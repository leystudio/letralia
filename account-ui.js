import {authReady,initAuth,getSession,signInWithEmail,signOut,onAuthChange,consumeAuthError,client} from './auth.js?v=26';
import {avatars,listChildren,addChild,updateChild,deleteChild,activeChildId,setActiveChildId,setAccount,syncOnFirstUse,store,readLocalProgress} from './profiles.js?v=26';

export function createAccounts({showModal,showGate,applyProgress,resetGame,startGame,toast,speak=async()=>{}}) {
  let user=null, children=[], view=0, busy=false, lastFamily=()=>{}, retryAt=0, email='';
  const $=s=>document.querySelector(s);
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const avatar=c=>(avatars.find(a=>a.id===c?.avatar)||avatars[0]).emoji;
  function render(title,body,id='account-panel') {
    view++; busy=false;
    showModal(title,`<section id="${id}">${body}<p id="account-error" role="alert"></p></section>`);
  }
  function message(error) {
    const code=error?.code||'';
    if(code.includes('rate')||error?.status===429)return 'Espera un minuto antes de pedir otro enlace.';
    if(code==='otp_expired')return 'Este enlace expiró. Solicita uno nuevo.';
    if(!navigator.onLine)return 'No hay conexión. Tus avances locales siguen guardados.';
    return 'No pudimos completar la acción. Comprueba tu conexión e inténtalo de nuevo.';
  }
  async function run(button,action,done=()=>{}) {
    if(busy)return;busy=true;const stamp=view,owner=user?.id;
    if(button)button.disabled=true;
    try {const result=await action();if(view===stamp&&owner===user?.id)await done(result);}
    catch(error){if(view===stamp&&$('#account-error'))$('#account-error').textContent=message(error);}
    finally {if(view===stamp){busy=false;if(button?.isConnected)button.disabled=false;}}
  }
  function accountButton(){
    const child=children.find(c=>c.id===activeChildId()),button=$('#account-nav');
    button.textContent=child?avatar(child):user?'👤 Perfiles':'👤 Entrar';
    button.setAttribute('aria-label',child?`Cambiar perfil: ${child.nickname}`:user?'Elegir perfil':'Entrar a una cuenta');
    const prompt=$('.guest-prompt');if(prompt)prompt.hidden=Boolean(user);
  }
  function waiting(){
    render('¡Revisa tu correo! 📧',`<p>Te enviamos un enlace a <strong>${esc(email)}</strong>.</p><p>Abre el enlace para entrar sin contraseña.</p><button class="secondary" id="auth-resend">Reenviar</button><button class="quiet" id="auth-correct">Corregir correo</button>`,'auth-modal');
    const button=$('#auth-resend');
    function tick(){if(!button.isConnected)return;const left=Math.max(0,Math.ceil((retryAt-Date.now())/1000));button.disabled=left>0||busy;button.textContent=left?`Reenviar en ${left} s`:'Reenviar';if(left)setTimeout(tick,250);}
    tick();button.onclick=()=>{if(Date.now()<retryAt)return;run(button,()=>signInWithEmail(email),()=>{retryAt=Date.now()+60000;waiting()})};
    $('#auth-correct').onclick=()=>login();
  }
  function login(expired=false){
    if(!authReady){render('Cuentas familiares','<p>Las cuentas por correo todavía no están disponibles. Puedes seguir jugando como invitado.</p>','auth-modal');return}
    render(expired?'Este enlace expiró':'Guarda el progreso de tu hijo',`${expired?'<p>Pide un enlace nuevo para entrar.</p>':'<p>Gratis. Sin tarjetas. Solo tu correo.</p>'}<form id="auth-form"><label class="field" for="auth-email">Correo del adulto<input id="auth-email" type="email" autocomplete="email" required maxlength="254" value="${esc(email)}" placeholder="tu@correo.com"></label><button class="primary" type="submit">${expired?'Reenviar enlace':'Enviarme el enlace'}</button></form><p class="session-info">Te enviaremos un enlace mágico para entrar sin contraseña.</p>`,'auth-modal');
    $('#auth-form').onsubmit=e=>{e.preventDefault();if(Date.now()<retryAt){$('#account-error').textContent='Espera un minuto antes de pedir otro enlace.';return}email=$('#auth-email').value.trim();run(e.submitter,()=>signInWithEmail(email),()=>{retryAt=Date.now()+60000;waiting()})};
  }
  async function refresh(){children=await listChildren();accountButton()}
  function picker(){
    if(!user){login();return}
    render('¿Quién va a jugar?',`<div class="profile-grid">${children.map(c=>`<button class="profile-card" data-child="${esc(c.id)}" aria-label="Jugar como ${esc(c.nickname)}"><span aria-hidden="true">${avatar(c)}</span><strong>${esc(c.nickname)}</strong></button>`).join('')}<button class="profile-card add-profile" id="picker-add"><span aria-hidden="true">＋</span><strong>Agregar</strong></button></div><button class="quiet" id="picker-signout">Cambiar de cuenta</button>`,'profile-picker');
    document.querySelectorAll('[data-child]').forEach(b=>b.onclick=()=>choose(b.dataset.child,b));
    $('#picker-add').onclick=()=>showGate(()=>addFlow());
    $('#picker-signout').onclick=()=>showGate(()=>logoutView());
    speak('¿Quién va a jugar hoy?');
  }
  function choose(id,button){
    const child=children.find(c=>c.id===id);if(!child)return;
    run(button,()=>syncOnFirstUse(id),async result=>{
      const stamp=view;await speak(child.nickname);if(stamp!==view)return;
      setActiveChildId(id);applyProgress(result.data);accountButton();startGame();
      if(result.recovered)toast('Recuperamos el progreso de este equipo ☁️');
    });
  }
  function avatarGrid(chosen){return `<div class="avatar-grid">${avatars.map(a=>`<button type="button" class="avatar-choice ${chosen===a.id?'chosen':''}" data-avatar="${a.id}" aria-label="${a.name}" aria-pressed="${chosen===a.id}">${a.emoji}</button>`).join('')}</div>`}
  function bindAvatars(draft){document.querySelectorAll('[data-avatar]').forEach(b=>b.onclick=()=>{draft.avatar=b.dataset.avatar;document.querySelectorAll('[data-avatar]').forEach(x=>{x.classList.toggle('chosen',x===b);x.setAttribute('aria-pressed',String(x===b))})})}
  function addFlow(){
    const draft={nickname:'',avatar:'fox',age_band:'4-5'};let step=0;
    function draw(){
      const heading=['¿Cómo se llama?','Elige su avatar','¿Cuántos años tiene?'][step];
      const content=step===0?`<label class="field">Apodo<input id="child-name" maxlength="24" required value="${esc(draft.nickname)}" placeholder="Ej: Luna"></label><p class="session-info">Usa un apodo; no hace falta su nombre completo.</p>`:step===1?avatarGrid(draft.avatar):`<div class="age-grid">${[['4-5','4–5'],['6-7','6–7'],['8+','8 o más']].map(([v,t])=>`<button type="button" class="secondary age-choice ${draft.age_band===v?'chosen':''}" data-age="${v}" aria-pressed="${draft.age_band===v}">${t}</button>`).join('')}</div>`;
      render(heading,`<p class="session-info">Paso ${step+1} de 3</p><form id="child-form">${content}<button class="primary" id="child-next">${step===2?'¡A jugar! 🚀':'Continuar'}</button></form>${step?'<button class="quiet" id="child-back">Atrás</button>':''}`,'add-child-modal');
      if(step===1)bindAvatars(draft);
      if(step===2)document.querySelectorAll('[data-age]').forEach(b=>b.onclick=()=>{draft.age_band=b.dataset.age;document.querySelectorAll('[data-age]').forEach(x=>{x.classList.toggle('chosen',x===b);x.setAttribute('aria-pressed',String(x===b))})});
      if(step)$('#child-back').onclick=()=>{step--;draw()};
      $('#child-form').onsubmit=e=>{e.preventDefault();if(step===0){draft.nickname=$('#child-name').value.trim();if(!draft.nickname)return}
        if(step<2){step++;draw();return}
        run(e.submitter,()=>addChild(draft),async child=>{children.push(child);await refresh();picker();choose(child.id,$(`[data-child="${child.id}"]`))});
      };
    }draw();
  }
  function tabs(current){
    const nav=document.createElement('nav');nav.className='parent-tabs';nav.setAttribute('aria-label','Zona de padres');
    nav.innerHTML=['Progreso','Niños','Cuenta'].map((t,i)=>`<button class="${current===i?'selected':''}" aria-current="${current===i?'page':'false'}">${t}</button>`).join('');
    nav.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>parentTab(i));$('#modal-body').prepend(nav);
  }
  function parentTab(index){
    if(!user)return;
    if(index===0){view++;lastFamily();tabs(0);return}
    if(index===1){
      render('Pequeños lectores',`<div class="profile-list">${children.map(c=>`<div class="profile-row"><span>${avatar(c)} <strong>${esc(c.nickname)}</strong> · ${esc(c.age_band)}</span><div><button class="quiet" data-edit="${esc(c.id)}">Editar</button><button class="quiet" data-delete="${esc(c.id)}">Eliminar</button></div></div>`).join('')}</div><button class="secondary" id="manage-add">＋ Agregar</button>`);
      $('#manage-add').onclick=addFlow;
      document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(children.find(c=>c.id===b.dataset.edit)));
      document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>removeChild(children.find(c=>c.id===b.dataset.delete)));
    }else{
      render('Tu cuenta',`<p>Correo del adulto: <strong>${esc(user.email)}</strong></p><p>Los avances de cada perfil se guardan en esta cuenta.</p><button class="secondary" id="manage-signout">Cerrar sesión</button><button class="danger-button" id="manage-delete">Eliminar mi cuenta y mis datos</button>`);
      $('#manage-signout').onclick=logoutView;$('#manage-delete').onclick=deleteAccountWarning;
    }tabs(index);
  }
  function edit(child){
    const draft={...child};render('Editar perfil',`<form id="edit-form"><label class="field">Apodo<input id="edit-nickname" maxlength="24" required value="${esc(child.nickname)}"></label>${avatarGrid(child.avatar)}<button class="primary">Guardar</button></form>`);bindAvatars(draft);
    $('#edit-form').onsubmit=e=>{e.preventDefault();draft.nickname=$('#edit-nickname').value.trim();run(e.submitter,()=>updateChild(child.id,draft),async()=>{await refresh();parentTab(1)})};
  }
  function removeChild(child){
    render('Eliminar perfil',`<p>Escribe <strong>${esc(child.nickname)}</strong> para confirmar. Se borrarán este perfil y todo su progreso.</p><form id="delete-child-form"><label class="field">Apodo<input id="delete-nickname" autocomplete="off" required></label><button class="danger-button">Eliminar perfil</button></form>`);
    $('#delete-child-form').onsubmit=e=>{e.preventDefault();if($('#delete-nickname').value.trim()!==child.nickname){$('#account-error').textContent='El apodo no coincide.';return}
      const wasActive=activeChildId()===child.id;run(e.submitter,()=>deleteChild(child.id),async()=>{if(wasActive)resetGame({});await refresh();parentTab(1)})};
  }
  function clearSession(){user=null;children=[];setAccount(null);resetGame(readLocalProgress()||{});accountButton()}
  function logoutView(){
    const pending=children.some(c=>store.cached(c.id)?.pending_sync);
    render('Cerrar sesión',`<p>${pending?'Hay avances pendientes de enviar. Permanecerán en este equipo para sincronizar al volver a entrar con esta cuenta.':'Puedes volver a entrar cuando quieras con tu correo.'}</p><button class="primary" id="logout-confirm">Cerrar sesión</button>`);
    $('#logout-confirm').onclick=e=>run(e.currentTarget,async()=>{await store.flushAll(children.map(c=>c.id)).catch(()=>{});await signOut()},()=>{clearSession();render('Sesión cerrada','<p>Puedes seguir jugando como invitado.</p>')});
  }
  function deleteAccountWarning(){
    render('¿Eliminar tu cuenta?', '<p>Se borrarán todos los perfiles y sus avances en la nube. Esta acción no se puede deshacer.</p><button class="danger-button" id="delete-account-next">Sí, quiero eliminarla</button>');
    $('#delete-account-next').onclick=()=>{
      render('Confirma la eliminación','<p>Escribe <strong>ELIMINAR</strong> para borrar definitivamente tu cuenta y sus datos.</p><form id="delete-account-form"><label class="field">Confirmación<input id="confirm-delete-account" autocomplete="off" required></label><button class="danger-button">Eliminar mi cuenta y mis datos</button></form>');
      $('#delete-account-form').onsubmit=e=>{e.preventDefault();if($('#confirm-delete-account').value!=='ELIMINAR'){$('#account-error').textContent='Escribe ELIMINAR para confirmar.';return}
        run(e.submitter,async()=>{const {error}=await client.functions.invoke('delete-account');if(error)throw error;store.forgetOwner();await signOut().catch(()=>{});},()=>{clearSession();render('Cuenta eliminada','<p>Se eliminaron tu cuenta, sus perfiles y sus avances.</p>')});
      };
    };
  }
  async function sessionChanged(session){
    const next=session?.user||null;if(next?.id===user?.id)return;
    if(!next){if(user){clearSession();render('Sesión cerrada','<p>Vuelve a entrar con tu correo cuando quieras.</p>')}return}
    const sessionId=next.id;user=next;setAccount(user.id);resetGame(readLocalProgress()||{});accountButton();
    render('Cargando perfiles…','<p>Un momento, Lilo está preparando tus aventuras.</p>');
    try{await refresh();if(user?.id!==sessionId)return;if(!children.length)toast('¡Cuenta creada! Ahora agreguemos a tu pequeño lector.');picker();store.flushAll(children.map(c=>c.id)).catch(()=>{});}
    catch{if(user?.id!==sessionId)return;render('No pudimos cargar tus perfiles','<p>Comprueba tu conexión y vuelve a intentarlo.</p><button class="secondary" id="profiles-retry">Reintentar</button>');$('#profiles-retry').onclick=e=>run(e.currentTarget,refresh,picker);}
  }
  async function init(){
    if(!authReady)return;
    const expired=consumeAuthError();
    try{await initAuth();onAuthChange((event,session)=>{if(['INITIAL_SESSION','SIGNED_IN','SIGNED_OUT'].includes(event))sessionChanged(session)});await sessionChanged(await getSession());if(expired&&!user)login(true);}
    catch{toast('No pudimos conectar las cuentas. Puedes jugar como invitado.');if(expired)login(true);}
  }
  window.addEventListener('online',()=>{if(user)store.flushAll(children.map(c=>c.id)).catch(()=>toast('Tus avances siguen pendientes de sincronizar.'))});
  window.addEventListener('letralia-modal-changing',()=>{view++;busy=false});
  document.querySelector('#modal').addEventListener('close',()=>{view++;busy=false});
  return {account:()=>user?picker():login(),family(fn){lastFamily=fn;if(user)showGate(()=>parentTab(0));else fn()},init,hasSession:()=>Boolean(user),bindFamilyContent(fn){lastFamily=fn},refreshButton:accountButton};
}
