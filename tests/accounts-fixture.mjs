// Test double for browser flows; RLS is tested separately against real PostgreSQL.
export function fakeSupabase({signedIn=true,empty=false}={}) {
  const parent={id:'11111111-1111-4111-8111-111111111111',email:'parent@example.test'};
  let user=signedIn?parent:null;const listeners=[];
  const seed=empty?[]:[{id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',nickname:'Luna',avatar:'fox',age_band:'4-5'},{id:'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',nickname:'Sol',avatar:'panda',age_band:'6-7'}];
  const db=JSON.parse(localStorage.getItem('fixture-db')||'null')||{children:seed,progress:{},imported:false};
  const save=()=>localStorage.setItem('fixture-db',JSON.stringify(db));save();
  window.fixture={db,emails:[],events:0,signIn(){user=parent;listeners.forEach(fn=>fn('SIGNED_IN',{user}))},repeat(){listeners.forEach(fn=>fn('SIGNED_IN',{user}))}};
  class Query {
    constructor(table){this.table=table;this.op='select';this.filters=[];this.singleRow=false}
    select(){return this}order(){return this}limit(){return this}single(){this.singleRow=true;return this}maybeSingle(){this.singleRow=true;return this}
    eq(k,v){this.filters.push([k,v]);return this}
    insert(data){this.op='insert';this.data=data;return this}update(data){this.op='update';this.data=data;return this}delete(){this.op='delete';return this}upsert(data){this.op='upsert';this.data=data;return this}
    then(resolve,reject){return this.exec().then(resolve,reject)}
    async exec(){
      if(!navigator.onLine)return {data:null,error:{message:'offline'}};
      let data;if(this.table==='children'){
        const rows=db.children.filter(row=>this.filters.every(([k,v])=>row[k]===v));
        if(this.op==='insert'){data={id:crypto.randomUUID(),...this.data};db.children.push(data)}
        else if(this.op==='update'){rows.forEach(r=>Object.assign(r,this.data));data=rows}
        else if(this.op==='delete'){rows.forEach(r=>delete db.progress[r.id]);db.children=db.children.filter(r=>!rows.includes(r));data=null}
        else data=this.singleRow?rows[0]||null:rows;
      }else if(this.op==='upsert'){db.progress[this.data.child_id]=this.data.data;data=null}
      save();return {data,error:null};
    }
  }
  window.supabase={createClient:()=>({
    auth:{getSession:async()=>({data:{session:user?{user}:null},error:null}),onAuthStateChange(fn){listeners.push(fn);return {data:{subscription:{unsubscribe(){}}}}},signInWithOtp:async({email})=>{window.fixture.emails.push(email);return {error:null}},signOut:async()=>{user=null;listeners.forEach(fn=>fn('SIGNED_OUT',null));return {error:null}}},
    from:table=>new Query(table),
    rpc:async(name,{target_child,guest_data})=>{if(!navigator.onLine)return {error:{message:'offline'}};let imported=false;if(!db.progress[target_child]){db.progress[target_child]=!db.imported?guest_data:{};imported=!db.imported&&Object.keys(guest_data).length>0;db.imported=true}save();return {data:{data:db.progress[target_child],imported},error:null}},
    functions:{invoke:async()=>{db.children=[];db.progress={};save();return {error:null}}}
  })};
}
