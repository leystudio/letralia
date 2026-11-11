import {CLOCK_LESSONS,lessonFor,taskFor,readingChoices,timeOf,clockAngles,digitalTime,spokenTime,initialHands,handStep,snapHand,handCorrect,placedAngles,hourExplanation,handHint,cleanClock,newClockSession,mod} from './clock-model.js?v=34';

import {clockMenuView,clockIntroView,clockExploreView,clockTaskView,clockSummaryView} from './clock-child-ui.js?v=37';
const CHILD = {
 "play": "Toca el botón verde para jugar.",
 "minute": "Mueve la aguja larga.",
 "hour": "Ahora mueve la aguja corta.",
 "second": "Ahora mueve la aguja finita.",
 "check": "Toca la palomita verde.",
 "read": "¿Qué hora es? Escucha las opciones. Toca la hora que ves.",
 "show": "Mira. La aguja va aquí.",
 "retry": "Prueba otra vez.",
 "next": "¡Lo hiciste! Toca la flecha.",
 "explore": "Toca los botones. Mira cómo giran las agujas.",
 "end": "¡Lo hiciste!",
 "demo": "Mira cómo se mueve la aguja.",
 "pause": "Para seguir, toca el botón verde."
};

export const CLOCK_COPY={
 welcome:'Vamos a aprender la hora con Lilo. Puedes explorar el reloj o elegir una aventura.',
 explore:'La corta marca las horas. La larga marca los minutos. Al avanzar los minutos, la corta también se mueve.',
 seconds:'La aguja fina marca los segundos. Sesenta segundos forman un minuto. Sesenta minutos forman una hora.',
 set:'Primero coloca la aguja larga de los minutos. Después coloca la corta de las horas.',
 minute:'Mueve la aguja larga de los minutos. Arrastra su punta o toca el lugar al que debe apuntar.',
 hour:'Ahora mueve la aguja corta de las horas. Recuerda que también avanza entre los números.',
 second:'Ahora mueve la aguja fina de los segundos. Cada rayita vale un segundo.',
 read:'¿Qué hora marca el reloj? Dila en voz alta y luego elige. Mira primero la corta y después la larga.',
 readSeconds:'¿Qué hora marca el reloj? Mira la corta, la larga y la fina. Di la hora con sus segundos y luego elige.',
 correct:'¡Las agujas están en su lugar!',
 retry:'Vamos a mirar otra vez. Puedes mover la aguja y volver a comprobar.',
 readRetry:'Mira otra vez la aguja corta y las rayitas que alcanza la larga. Puedes intentarlo de nuevo.',
 readSecondsRetry:'Mira también la aguja fina: sus rayitas son los segundos. Puedes intentarlo de nuevo.',
 hint:'Vamos a hacerlo juntos.',
 pause:'El reloj puede esperar. Seguimos cuando quieras.',
 complete:'¡Terminaste tu sesión de reloj! Puedes descansar o seguir otro día.',
 demoHour:'La aguja corta señala la hora. Entre el seis y el siete, la hora todavía es seis.',
 demoMinute:'La aguja larga cuenta los minutos. Cada número grande equivale a cinco minutos.',
 oneMinute:'Sesenta segundos: pasó un minuto. La aguja larga avanzó una rayita.',
 oneHour:'Sesenta minutos: pasó una hora. La aguja corta avanzó al siguiente número.'
};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const HANDS={minute:{label:'Minutos',description:'larga',color:'#087d80',length:154},hour:{label:'Horas',description:'corta',color:'#6943ad',length:93},second:{label:'Segundos',description:'fina',color:'#b74419',length:162}};
const xy=(angle,r)=>({x:220+Math.sin(angle*Math.PI/180)*r,y:220-Math.cos(angle*Math.PI/180)*r});
function handSVG(hand,angle,{active=false,ghost=false}={}){
 const h=HANDS[hand],end=xy(angle,h.length),tail=xy(angle,-18),width=hand==='hour'?12:hand==='minute'?8:3;
 return `<g class="clock-needle ${active?'clock-active-needle':''} ${ghost?'clock-ghost':''}" data-needle="${hand}" data-angle="${angle}"><line x1="${tail.x}" y1="${tail.y}" x2="${end.x}" y2="${end.y}" stroke="${h.color}" stroke-width="${width}" stroke-linecap="round" ${ghost?'stroke-dasharray="9 8"':''}/>${hand==='second'?`<circle cx="${end.x}" cy="${end.y}" r="6" fill="${h.color}"/>`:''}${active?`<circle cx="${end.x}" cy="${end.y}" r="17" fill="white" stroke="${h.color}" stroke-width="4"/><circle cx="${end.x}" cy="${end.y}" r="5" fill="${h.color}"/>`:''}</g>`;
}
export function clockSVG(angles,{seconds=false,active=null,ghost=null,onlyHour=false,ring=true}={}){
 const ticks=Array.from({length:60},(_,i)=>{const a=xy(i*6,i%5===0?163:169),b=xy(i*6,178);return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${i%5===0?'#6f6580':'#b5adbc'}" stroke-width="${i%5===0?3:1.5}"/>`}).join('');
 const numbers=Array.from({length:12},(_,i)=>{const n=i||12,p=xy(i*30,124),q=xy(i*30,195);return `<text x="${p.x}" y="${p.y}" class="clock-hour-number">${n}</text>${ring?`<text x="${q.x}" y="${q.y}" class="clock-minute-number">${String(i*5).padStart(2,'0')}</text>`:''}`}).join('');
 const hands=onlyHour?['hour']:seconds?['hour','minute','second']:['hour','minute'];
 const order=active?[...hands.filter(h=>h!==active),active]:hands;
 return `<svg viewBox="0 0 440 440" class="clock-face" aria-hidden="true" focusable="false"><circle cx="220" cy="220" r="213" fill="#fffdf8" stroke="#e8dcc5" stroke-width="8"/><circle cx="220" cy="220" r="184" fill="none" stroke="#e9e1ee" stroke-width="1.5"/>${ticks}${ghost?handSVG(ghost.hand,ghost.angle,{ghost:true}):''}${order.map(h=>handSVG(h,angles[h],{active:active===h})).join('')}${numbers}<circle cx="220" cy="220" r="12" fill="#49385f"/><circle cx="220" cy="220" r="4" fill="white"/></svg>`;
}
export function clockAudioPhrases(){return [...new Set([...Object.values(CLOCK_COPY),...Object.values(CHILD),...CLOCK_LESSONS.flatMap(l=>[1,3,5].flatMap(i=>readingChoices(timeOf(l.times[i]),l.seconds).map(t=>spokenTime(t,l.seconds)))),...CLOCK_LESSONS.flatMap(l=>[l.explanation,...l.times.flatMap(time=>{const t=timeOf(time);return [spokenTime(t,!!l.seconds),`Marca esta hora. ${spokenTime(t,!!l.seconds)}`,...['hour','minute','second'].map(h=>handHint(h,t))]})])])]}

export function startClockLearning(container,options){
 let progress=cleanClock(options.progress),screen='menu',paused=false,dead=false,lastSpeech='',pointer=null,previewSeconds=false,onlyHour=false,exploreTime=360*60;
 const $=s=>container.querySelector(s),$$=s=>[...container.querySelectorAll(s)];
 let speechTurn=0, checkCueGiven=false;
 function say(...parts){
  lastSpeech=parts;
  const turn=++speechTurn;
  function play(i){if(!dead && turn===speechTurn && i<parts.length)options.say(parts[i],()=>play(i+1))}
  play(0);
 }
 function listen(text){++speechTurn;options.say(text)}
 function confirmCue(){if(!checkCueGiven){checkCueGiven=true;listen(CHILD.check)}}
 const save=(award=false)=>options.onChange(progress,{award});
 const lesson=()=>lessonFor(progress.active?.lesson||progress.lastLesson);
 const task=()=>taskFor(lesson(),progress.active.index,progress.active.variant);
 const activeHand=()=>['minute','hour','second'][progress.active.step];
 const announce=(text,good=false)=>{const node=$('#clock-feedback');if(node){node.textContent=good?'✓':'💡';node.setAttribute('aria-label',text);node.classList.toggle('is-good',good)}say(text)};
 function shell(html){container.innerHTML=`<div class="clock-app" data-clock-view="${screen}"><div class="clock-toolbar"><button class="clock-quiet" id="clock-menu" aria-label="Volver a las aventuras del reloj">←</button><div><button class="clock-quiet" id="clock-hear" aria-label="Escuchar la instrucción">🔊</button><button class="clock-quiet" id="clock-pause" aria-label="Pausar el reloj">Ⅱ</button></div></div><div id="clock-body">${html}</div><section id="clock-paused" hidden><span aria-hidden="true">☀️</span><h2>Pausa</h2><button class="primary" id="clock-resume">▶ Seguir</button></section></div>`;
  container.closest('dialog')?.scrollTo({top:0,behavior:'instant'});$('#clock-menu').onclick=menu;$('#clock-hear').onclick=()=>say(...lastSpeech);$('#clock-pause').onclick=pause;$('#clock-resume').onclick=resume;
 }
 function focusTitle(){$('[data-clock-title]')?.focus({preventScroll:true})}
 function menu(){
  if(dead)return;paused=false;screen='menu';options.cancelSpeech();
  const recommended=CLOCK_LESSONS.find(l=>!progress.lessons[l.id]?.sessions)||CLOCK_LESSONS[0];
  shell(clockMenuView(progress,clockSVG(clockAngles({h:6,m:30}),{ring:false})));
  $('#clock-menu').hidden=true;$('#clock-explore').onclick=explore;
  $('#clock-play')?.addEventListener('click',()=>intro(recommended.id));
  $('#clock-continue')?.addEventListener('click',exercise);
  $$('[data-clock-lesson]').forEach(b=>b.onclick=()=>intro(b.dataset.clockLesson));say(CHILD.play);focusTitle();
 }
 function explore(){
  if(dead)return;screen='explore';
  shell(clockExploreView(onlyHour,previewSeconds));
  $('#clock-only-hour').onchange=e=>{onlyHour=e.target.checked;if(onlyHour){previewSeconds=false;$('#clock-with-seconds').checked=false}drawExplore();say(onlyHour?CLOCK_COPY.demoHour:CLOCK_COPY.demoMinute)};
  $('#clock-with-seconds').onchange=e=>{previewSeconds=e.target.checked;if(previewSeconds){onlyHour=false;$('#clock-only-hour').checked=false}drawExplore();say(CLOCK_COPY.seconds)};
  $$('[data-advance]').forEach(b=>b.onclick=()=>{const delta=+b.dataset.advance;if(delta===1){previewSeconds=true;onlyHour=false;$('#clock-with-seconds').checked=true;$('#clock-only-hour').checked=false}exploreTime=mod(exploreTime+delta,43200);drawExplore()});
  $$('[data-demo]').forEach(b=>b.onclick=()=>{exploreTime=+b.dataset.demo;drawExplore();say(hourExplanation(exploreValue()))});
  $('#clock-demo-minute').onclick=()=>{previewSeconds=true;onlyHour=false;$('#clock-with-seconds').checked=true;$('#clock-only-hour').checked=false;exploreTime=21659;drawExplore();$('#clock-demo-note').textContent='6:00:59 → +1 s';say(CLOCK_COPY.seconds)};
  $('#clock-demo-hour').onclick=()=>{exploreTime=25140;drawExplore();$('#clock-demo-note').textContent='6:59 → +1 min';say(CLOCK_COPY.oneHour)};
  $('#clock-begin').onclick=()=>intro('hours');drawExplore();say(CHILD.explore);focusTitle();
 }
 function exploreValue(){return {h:Math.floor(exploreTime/3600)||12,m:Math.floor(exploreTime/60)%60,s:exploreTime%60}}
 function drawExplore(){const t=exploreValue();$('#clock-demo-face').innerHTML=clockSVG(clockAngles(t),{seconds:previewSeconds,onlyHour});$('#clock-demo-face').setAttribute('role','img');$('#clock-demo-face').setAttribute('aria-label',spokenTime(t,previewSeconds));$('#clock-demo-digital').textContent=digitalTime(t,previewSeconds);$('#clock-demo-note').textContent=''}
 function intro(id){
  screen='intro';const l=lessonFor(id),t=timeOf(l.example);
  shell(clockIntroView(l,t,clockSVG(clockAngles(t),{seconds:l.seconds})));
  $('#clock-example-hear').onclick=()=>listen(spokenTime(t,l.seconds));
  $('#clock-start-lesson').onclick=()=>{if(progress.active?.lesson!==l.id)progress.active=newClockSession(l.id,progress.lessons[l.id]?.sessions||0);progress.lastLesson=l.id;save();exercise()};say(CHILD.demo,spokenTime(t,l.seconds),CHILD.play);focusTitle();
 }
 function exercise(){
  if(dead||!progress.active)return;screen='exercise';paused=false;const a=progress.active,l=lesson(),{time:t,type}=task(),hand=activeHand();
  checkCueGiven=false;
  shell(clockTaskView(a,l,t,type,hand));
  $('#clock-target')?.addEventListener('click',()=>listen(spokenTime(t,l.seconds)));
  for(const button of $$('[data-listen-answer]')) {
   const choice=readingChoices(t,l.seconds)[Number(button.dataset.listenAnswer)];
   button.onclick=()=>listen(spokenTime(choice,l.seconds));
  }
  $('#clock-next').onclick=next;
  if(type==='set'){
   const dial=$('#clock-dial');
   dial.onpointerdown=e=>{if(a.done||paused||dead||e.button!==0)return;pointer=e.pointerId;dial.setPointerCapture(e.pointerId);movePointer(e)};
   dial.onpointermove=e=>{if(pointer===e.pointerId&&!paused&&!a.done)movePointer(e)};
   dial.onpointerup=dial.onpointercancel=e=>{if(pointer===e.pointerId){pointer=null;save();confirmCue()}};
   dial.onkeydown=e=>{if(a.done||paused)return;if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home')setHand(0);else if(e.key==='End')setHand((hand==='hour'?720:60)-handStep(l,hand));else adjust(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)}};
   $('#clock-back-step').onclick=()=>adjust(-1);$('#clock-forward-step').onclick=()=>adjust(1);$('#clock-check').onclick=check;
   $('#clock-show').onclick=()=>{if(paused||a.done)return;a.helped=true;a.hints=2;const values={hour:mod(t.h,12)*60+t.m,minute:t.m,second:t.s||0};setHand(values[hand]);announce(CHILD.show,true);save()};
  }else $$('[data-clock-answer]').forEach(b=>b.onclick=()=>{if(paused||a.done||dead)return;const chosen=readingChoices(t,l.seconds)[+b.dataset.clockAnswer];if(digitalTime(chosen,l.seconds)===digitalTime(t,l.seconds))win();else{a.mistakes++;a.helped=true;save();b.classList.add("clock-try-again");announce(CHILD.retry)}});
  $('#clock-hint').onclick=hint;drawDial();
  if(!a.done){if(type==='read')say(CHILD.read);else if(a.step===0)say(spokenTime(t,l.seconds),CHILD[hand]);else say(CHILD[hand])}
  else say(CHILD.next);
  focusTitle();
 }
 function movePointer(e){const r=$('#clock-dial').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;if(Math.hypot(x,y)<r.width*.055)return;e.preventDefault();setHand(snapHand(Math.atan2(x,-y)*180/Math.PI,lesson(),activeHand()),false)}
 function setHand(value,persist=true){if(dead||paused||progress.active?.done)return;const hand=activeHand();progress.active.hands[hand]=mod(value,hand==='hour'?720:60);drawDial();if(persist){save();confirmCue()}}
 function adjust(direction){setHand(progress.active.hands[activeHand()]+direction*handStep(lesson(),activeHand()))}
 function drawDial(){
  const a=progress.active,l=lesson(),{time:t,type}=task(),hand=activeHand(),read=type==='read'||a.done;
  const target={hour:mod(t.h,12)*30+t.m/2+(l.seconds?(t.s||0)/120:0),minute:t.m*6+(l.seconds?(t.s||0)/10:0),second:(t.s||0)*6};
  $('#clock-dial').innerHTML=clockSVG(read?clockAngles(t):placedAngles(a.hands,l.seconds),{seconds:l.seconds,active:read?null:hand,ghost:!read&&a.hints>=2?{hand,angle:target[hand]}:null});
  if(type==='set'&&!a.done){const unit=hand==='hour'?720:60,val=a.hands[hand],pos=hand==='hour'?`Hora ${Math.floor(val/60)||12}${val%60?` + ${val%60} min`:''}`:`${val} ${hand==='second'?'seg':'min'}`;$('#clock-position').textContent=pos;const dial=$('#clock-dial');dial.setAttribute('aria-label',`Aguja ${HANDS[hand].description} de ${HANDS[hand].label.toLowerCase()}`);dial.setAttribute('aria-valuemin','0');dial.setAttribute('aria-valuemax',String(unit-1));dial.setAttribute('aria-valuenow',String(val));dial.setAttribute('aria-valuetext',pos)}
  else $('#clock-dial').setAttribute('aria-label',`${hourExplanation(t)} La larga apunta a la rayita ${t.m} del borde${l.seconds?`. La fina apunta a la rayita ${t.s||0} del borde`:''}.`);
 }
 function check(){
  if(dead||paused||progress.active.done)return;const a=progress.active,hand=activeHand(),t=task().time;
  if(!handCorrect(a.hands,hand,t)){a.mistakes++;a.helped=true;a.hints=2;save();drawDial();announce(handHint(hand,t));return}
  if(a.step===(lesson().seconds?2:1)){win();return}options.sound('letter');a.step++;a.hints=0;save();exercise();$('#clock-dial').focus({preventScroll:true});
 }
 function hint(){if(dead||paused||progress.active.done)return;const a=progress.active;a.helped=true;a.hints=2;save();drawDial();announce(task().type==='set'?handHint(activeHand(),task().time):lesson().explanation)}
 function win(){
  const a=progress.active;if(!a||a.done||dead||paused)return;a.done=true;const result={independent:!a.helped&&a.mistakes===0,type:task().type};a.results.push(result);
  const stat=progress.lessons[a.lesson]??={sessions:0,solved:0,independent:0,read:0,set:0};stat.solved++;stat[result.type]++;if(result.independent)stat.independent++;
  save(true);options.sound('letter');exercise();$('#clock-next').focus({preventScroll:true});
 }
 function next(){
  if(dead||paused||!progress.active?.done)return;const a=progress.active;
  if(a.index===3){const id=a.lesson,independent=a.results.filter(r=>r.independent).length;progress.lessons[id].sessions++;progress.active=null;save();summary(id,independent);return}
  a.index++;a.step=0;a.done=false;a.helped=false;a.mistakes=0;a.hints=0;a.hands=initialHands(lesson(),task().time);save();exercise();
 }
 function summary(id,independent){
  screen='summary';const l=lessonFor(id),nextLesson=CLOCK_LESSONS[CLOCK_LESSONS.indexOf(l)+1];
  shell(clockSummaryView(nextLesson));
  $('#clock-finish').onclick=options.onExit;$('#clock-repeat').onclick=()=>intro(id);$('#clock-next-lesson')?.addEventListener('click',()=>intro(nextLesson.id));say(CHILD.end);focusTitle();
 }
 function pause(){if(dead||paused)return;paused=true;pointer=null;++speechTurn;options.cancelSpeech();options.say(CHILD.pause);$('#clock-body').hidden=true;$('#clock-paused').hidden=false;$('#clock-hear').disabled=true;$('#clock-pause').disabled=true;$('#clock-resume').focus({preventScroll:true})}
 function resume(){if(dead||!paused)return;paused=false;$('#clock-body').hidden=false;$('#clock-paused').hidden=true;$('#clock-hear').disabled=false;$('#clock-pause').disabled=false;$('#clock-pause').focus({preventScroll:true});say(...lastSpeech)}
 menu();return {pause,resume,destroy(){dead=true;pointer=null;options.cancelSpeech()}};
}
