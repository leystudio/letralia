// Clock geometry and learning state are independent of the drawing and input device.
export const CLOCK_LESSONS = [
 {id:'hours',name:'Horas en punto',caption:'La larga llega al 12',icon:'☀️',minuteStep:5,hourStep:60,example:[3,0],times:[[3,0],[8,0],[12,0],[1,0],[6,0],[10,0]],explanation:'En punto: la aguja larga señala el 12 y la corta señala la hora.'},
 {id:'halves',name:'Y media',caption:'La corta también avanza',icon:'◐',minuteStep:5,hourStep:30,example:[6,30],times:[[6,30],[2,30],[11,30],[9,30],[1,30],[4,30]],explanation:'Media hora son 30 minutos. La larga llega al 6. La corta queda a mitad de camino entre dos horas.'},
 {id:'quarters',name:'Y cuarto · menos cuarto',caption:'15 y 45 minutos',icon:'◴',minuteStep:5,hourStep:15,example:[3,15],times:[[3,15],[8,45],[12,45],[1,15],[6,45],[10,15]],explanation:'Un cuarto de hora son 15 minutos. A los 45 minutos faltan 15 para la hora siguiente.'},
 {id:'fives',name:'De cinco en cinco',caption:'5, 10, 15… hasta 60',icon:'🖐️',minuteStep:5,hourStep:5,example:[4,20],times:[[4,20],[7,40],[11,55],[2,5],[9,10],[5,25]],explanation:'Cada número grande vale cinco minutos para la aguja larga. Cuenta de cinco en cinco desde el 12.'},
 {id:'minutes',name:'Minuto a minuto',caption:'Cada rayita vale uno',icon:'🔎',minuteStep:1,hourStep:1,example:[2,17],times:[[2,17],[6,32],[11,59],[12,1],[4,23],[8,48]],explanation:'Cada rayita pequeña vale un minuto. La corta se acerca poco a poco a la hora siguiente, pero aún no ha llegado.'},
 {id:'seconds',name:'También los segundos',caption:'La fina completa otra vuelta',icon:'⏱️',minuteStep:1,hourStep:1,seconds:true,example:[6,30,15],times:[[6,30,15],[2,10,30],[11,59,45],[12,0,5],[4,23,20],[8,48,50]],explanation:'La aguja fina marca los segundos. Una vuelta completa son 60 segundos: entonces pasa un minuto.'}
];
export const mod=(v,n)=>((v%n)+n)%n;
export const distance=(a,b,n=360)=>Math.min(mod(a-b,n),mod(b-a,n));
export const timeOf=([h,m,s=0])=>({h,m,s});
export function clockAngles({h,m,s=0}){return {hour:mod(h,12)*30+m/2+s/120,minute:m*6+s/10,second:s*6}}
export const digitalTime=(t,seconds=false)=>`${t.h}:${String(t.m).padStart(2,'0')}${seconds?':'+String(t.s||0).padStart(2,'0'):''}`;
const names=['doce','una','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once'];
export function spokenTime(t,seconds=false){
 const h=mod(t.h,12),prefix=h===1?'Es la':'Son las';
 let value=`${prefix} ${names[h]}`;
 if(t.m===0)value+=' en punto';else if(t.m===15)value+=' y cuarto';else if(t.m===30)value+=' y media';else if(t.m===45){const next=mod(h+1,12);value=`${next===1?'Es la':'Son las'} ${names[next]} menos cuarto`}else value+=` y ${t.m}`;
 return value+(seconds?`, con ${t.s===1?'un segundo':(t.s||0)+' segundos'}`:'');
}
export const lessonFor=id=>CLOCK_LESSONS.find(l=>l.id===id)||CLOCK_LESSONS[0];
export function taskFor(lesson,index,variant=0){const time=timeOf(lesson.times[(index+variant*2)%lesson.times.length]);return {time,type:index%2===0?'set':'read'}}
export function readingChoices(t,seconds=false){
 const options=[t,{...t,h:mod(t.h,12)+1},{...t,m:mod(t.m+5,60)},seconds?{...t,s:mod(t.s+15,60)}:{...t,m:mod(t.m+30,60)}];
 // A stable rotation keeps the correct choice from always being in the same place.
 const offset=(t.h+t.m+(t.s||0))%4;return options.map((_,i)=>options[(i+offset)%4]);
}
export function initialHands(lesson,time){
 const target={hour:mod(time.h,12)*60+time.m,minute:time.m,second:time.s||0},hands={};
 for(const hand of ['minute','hour','second']){
  const unit=hand==='hour'?720:60,step=hand==='hour'?lesson.hourStep:hand==='minute'?lesson.minuteStep:1;
  for(let i=0;i<unit/step;i++){
   const value=mod((hand==='minute'?40:hand==='hour'?180:20)+i*step,unit),angle=value*360/unit;
   if(distance(value,target[hand],unit)<step||Object.entries(hands).some(([k,v])=>distance(angle,v*(k==='hour'?.5:6))<24))continue;
   hands[hand]=value;break;
  }
  hands[hand]??=mod(target[hand]+unit/3,unit);
 }
 return hands;
}
export function handStep(lesson,hand){return hand==='hour'?lesson.hourStep:hand==='minute'?lesson.minuteStep:1}
export function snapHand(angle,lesson,hand){const unit=hand==='hour'?720:60,step=handStep(lesson,hand);return mod(Math.round(mod(angle,360)/360*unit/step)*step,unit)}
export function handCorrect(hands,hand,t){
 if(hand==='minute')return hands.minute===t.m;
 if(hand==='second')return hands.second===(t.s||0);
 // The hour hand is read approximately, but must remain in the correct hour sector.
 const target=mod(t.h,12)*60+t.m;
 return Math.floor(hands.hour/60)===mod(t.h,12)&&distance(hands.hour,target,720)<=3;
}
export function placedAngles(hands,seconds=false){const s=seconds?hands.second:0;return {hour:hands.hour/2+s/120,minute:hands.minute*6+s/10,second:s*6}}
export function hourExplanation(t){
 const h=t.h,next=mod(h,12)+1;
 if(t.m===0)return `La corta apunta al ${h}: es la hora en punto.`;
 if(t.m===30)return `La corta queda a mitad de camino entre el ${h} y el ${next}. Ya pasó media hora.`;
 if(t.m===15)return `La corta ya pasó un poquito del ${h}: avanzó un cuarto del camino al ${next}.`;
 if(t.m===45)return `La corta está entre el ${h} y el ${next}, cerca del ${next}. Todavía no ha llegado.`;
 return `La corta está entre el ${h} y el ${next}. Han pasado ${t.m} minutos desde las ${h}.`;
}
export function handHint(hand,t){
 if(hand==='hour')return hourExplanation(t);
 const n=hand==='second'?(t.s||0):t.m,unit=hand==='second'?'segundos':'minutos',mark=n===0?12:Math.floor(n/5)||12,remainder=n%5;
 return n===0?`El 12 es el inicio: cero ${unit}.`:`Busca ${n} ${unit} en el borde. ${remainder?`Desde el ${mark}, avanza ${remainder} rayita${remainder===1?'':'s'} más.`:`La aguja apunta al ${mark}.`}`;
}
const count=v=>Number.isFinite(v)?Math.max(0,Math.min(1e6,Math.floor(v))):0;
export function cleanClock(raw){
 const p=raw&&typeof raw==='object'?raw:{},lessons={};
 for(const l of CLOCK_LESSONS){const v=p.lessons?.[l.id];if(v)lessons[l.id]={sessions:count(v.sessions),solved:count(v.solved),independent:Math.min(count(v.solved),count(v.independent)),read:count(v.read),set:count(v.set)}}
 let active=null;const a=p.active;
 if(a&&CLOCK_LESSONS.some(l=>l.id===a.lesson)&&Number.isInteger(a.index)&&a.index>=0&&a.index<4){
  const lesson=lessonFor(a.lesson),variant=count(a.variant)%3,t=taskFor(lesson,a.index,variant),fallback=initialHands(lesson,t.time);
  const hands={};for(const hand of ['hour','minute','second']){const n=a.hands?.[hand];hands[hand]=Number.isFinite(n)?mod(Math.round(n),hand==='hour'?720:60):fallback[hand]}
  active={lesson:a.lesson,index:a.index,variant,hands,step:Math.min(lesson.seconds?2:1,count(a.step)),done:!!a.done,helped:!!a.helped,mistakes:count(a.mistakes),hints:Math.min(2,count(a.hints)),results:Array.isArray(a.results)?a.results.slice(0,4).map(x=>({independent:!!x.independent,type:x.type==='read'?'read':'set'})):[]};
 }
 const foundation=p.foundation;
 const saved=Number.isInteger(foundation?.index)&&foundation.index>=0?{foundation:{index:foundation.index,complete:foundation.complete===true}}:{};
 return {version:1,...saved,lessons,lastLesson:CLOCK_LESSONS.some(l=>l.id===p.lastLesson)?p.lastLesson:'hours',active};
}
export function newClockSession(id,variant=0){const lesson=lessonFor(id);return {lesson:lesson.id,index:0,variant:variant%3,hands:initialHands(lesson,taskFor(lesson,0,variant).time),step:0,done:false,helped:false,mistakes:0,hints:0,results:[]}}
