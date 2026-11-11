import {CLOCK_LESSONS,lessonFor,taskFor,readingChoices,timeOf,clockAngles,digitalTime,spokenTime,initialHands,handStep,snapHand,handCorrect,placedAngles,hourExplanation,handHint,cleanClock,newClockSession,mod} from './clock-model.js?v=34';

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
function legend(seconds=false){return `<div class="clock-legend">${(seconds?['hour','minute','second']:['hour','minute']).map(h=>`<span style="--hand-color:${HANDS[h].color}"><i class="legend-hand ${h}"></i>${HANDS[h].description} · ${HANDS[h].label.toLowerCase()}</span>`).join('')}</div>`}
export function clockAudioPhrases(){return [...new Set([...Object.values(CLOCK_COPY),...CLOCK_LESSONS.flatMap(l=>[l.explanation,...l.times.flatMap(time=>{const t=timeOf(time);return [spokenTime(t,!!l.seconds),`Marca esta hora. ${spokenTime(t,!!l.seconds)}`,...['hour','minute','second'].map(h=>handHint(h,t))]})])])]}

export function startClockLearning(container,options){
 let progress=cleanClock(options.progress),screen='menu',paused=false,dead=false,lastSpeech='',pointer=null,previewSeconds=false,onlyHour=false,exploreTime=360*60;
 const $=s=>container.querySelector(s),$$=s=>[...container.querySelectorAll(s)];
 const say=text=>{lastSpeech=text;options.say(text)};
 const save=(award=false)=>options.onChange(progress,{award});
 const lesson=()=>lessonFor(progress.active?.lesson||progress.lastLesson);
 const task=()=>taskFor(lesson(),progress.active.index,progress.active.variant);
 const activeHand=()=>['minute','hour','second'][progress.active.step];
 const announce=(text,good=false)=>{const node=$('#clock-feedback');if(node){node.textContent=text;node.classList.toggle('is-good',good)}say(text)};
 function shell(html){container.innerHTML=`<div class="clock-app" data-clock-view="${screen}"><div class="clock-toolbar"><button class="clock-quiet" id="clock-menu" aria-label="Volver a las aventuras del reloj">← Aventuras</button><div><button class="clock-quiet" id="clock-hear" aria-label="Escuchar la instrucción">🔊</button><button class="clock-quiet" id="clock-pause" aria-label="Pausar el reloj">Ⅱ</button></div></div><div id="clock-body">${html}</div><section id="clock-paused" hidden><span aria-hidden="true">☀️</span><h2>El reloj puede esperar</h2><p>Seguimos cuando quieras.</p><button class="primary" id="clock-resume">▶ Continuar</button></section></div>`;
  container.closest('dialog')?.scrollTo({top:0,behavior:'instant'});$('#clock-menu').onclick=menu;$('#clock-hear').onclick=()=>say(lastSpeech);$('#clock-pause').onclick=pause;$('#clock-resume').onclick=resume;
 }
 function focusTitle(){$('[data-clock-title]')?.focus({preventScroll:true})}
 function menu(){
  if(dead)return;paused=false;screen='menu';options.cancelSpeech();
  const recommended=CLOCK_LESSONS.find(l=>!progress.lessons[l.id]?.sessions)||CLOCK_LESSONS[0];
  shell(`<section class="clock-welcome"><div><p class="eyebrow">UN NUEVO DESCUBRIMIENTO</p><h2 tabindex="-1" data-clock-title>La hora con Lilo</h2><p>Gira las agujas. Lee la hora.<br>Descubre cómo pasa el tiempo.</p><button class="primary" id="clock-explore">🔎 Conocer el reloj</button></div><div class="clock-welcome-art">${clockSVG(clockAngles({h:6,m:30}))}<img src="mascot-transparent.png" alt="Lilo te acompaña"></div></section>${progress.active?`<div class="clock-resume-card"><span>Te quedaste en <strong>${lessonFor(progress.active.lesson).name}</strong> · reto ${progress.active.index+1} de 4</span><button class="primary" id="clock-continue">▶ Continuar mi sesión</button></div>`:''}<div class="clock-section-label"><h3>Aventuras del reloj</h3><span>4 retos por sesión · sin prisa</span></div><div class="clock-lessons">${CLOCK_LESSONS.map((l,i)=>{const stat=progress.lessons[l.id];return `<button class="clock-lesson" data-clock-lesson="${l.id}"><span class="clock-lesson-symbol">${l.icon}</span><span><small>PASO ${i+1}${l.id===recommended.id?' · PARA SEGUIR':''}</small><strong>${l.name}</strong><span>${l.caption}</span><em>${stat?.sessions?`✓ ${stat.solved} retos · ${stat.independent} sin ayuda`:'Leer y colocar las agujas'}</em></span><b aria-hidden="true">→</b></button>`}).join('')}</div><details class="clock-teacher"><summary>Para acompañar: cómo enseñamos la hora</summary><p>Primero observa la aguja corta sola. Practica horas en punto y medias horas; después añade minutos, cuartos y segundos. En los retos de colocar agujas se mueve primero la larga y después la corta.</p><p>A las 6:30 la corta está a mitad de camino entre el 6 y el 7. No salta de un número a otro. Un reloj de 12 horas, sin otra información, no distingue mañana de tarde.</p><p>Di la hora en voz alta antes de elegir. Relaciónala con desayunar, ir a la escuela o acostarse. Las pistas están disponibles siempre; puedes repetir o hacer una pausa. Las cifras registran práctica, no certifican dominio.</p><p>Secuencia basada en <a href="https://www.ncetm.org.uk/classroom-resources/cp-year-1-unit-11-time/" target="_blank" rel="noopener">NCETM</a>, <a href="https://www.open.edu/openlearncreate/mod/oucontent/view.php?id=162162&section=2.3" target="_blank" rel="noopener">The Open University</a> y el <a href="https://www.gov.uk/government/publications/national-curriculum-in-england-mathematics-programmes-of-study/national-curriculum-in-england-mathematics-programmes-of-study" target="_blank" rel="noopener">currículo de primaria</a>.</p></details>`);
  $('#clock-menu').hidden=true;$('#clock-explore').onclick=explore;
  $('#clock-continue')?.addEventListener('click',exercise);
  $$('[data-clock-lesson]').forEach(b=>b.onclick=()=>intro(b.dataset.clockLesson));say(CLOCK_COPY.welcome);focusTitle();
 }
 function explore(){
  if(dead)return;screen='explore';
  shell(`<div class="clock-section-heading"><p class="eyebrow">TOCA, OBSERVA Y DESCUBRE</p><h2 tabindex="-1" data-clock-title>Un reloj que se mueve contigo</h2><p>La corta también camina entre los números.</p></div><div class="clock-explore-grid"><div><div id="clock-demo-face"></div><div class="clock-time-card"><small>ESTE RELOJ MARCA</small><strong id="clock-demo-digital"></strong><span id="clock-demo-spoken"></span></div></div><div class="clock-explore-panel">${legend(true)}<div class="clock-demo-switches"><label><input type="checkbox" id="clock-only-hour" ${onlyHour?'checked':''}> Ver solo la aguja corta</label><label><input type="checkbox" id="clock-with-seconds" ${previewSeconds?'checked':''}> Mostrar segundos</label></div><div class="clock-explore-buttons"><button data-advance="3600">+1 hora</button><button data-advance="300">+5 minutos</button><button data-advance="60">+1 minuto</button><button data-advance="1">+1 segundo</button></div><p id="clock-demo-note" role="status">60 minutos forman una hora.</p><div class="clock-example-buttons"><button data-demo="21600">6:00</button><button data-demo="22500">6:15</button><button data-demo="23400">6:30</button><button data-demo="24300">6:45</button></div><div class="clock-demo-actions"><button class="secondary" id="clock-demo-minute">Ver 60 segundos → 1 minuto</button><button class="secondary" id="clock-demo-hour">Ver 60 minutos → 1 hora</button></div><button class="primary" id="clock-begin">▶ Probar horas en punto</button></div></div>`);
  $('#clock-only-hour').onchange=e=>{onlyHour=e.target.checked;if(onlyHour){previewSeconds=false;$('#clock-with-seconds').checked=false}drawExplore();say(onlyHour?CLOCK_COPY.demoHour:CLOCK_COPY.demoMinute)};
  $('#clock-with-seconds').onchange=e=>{previewSeconds=e.target.checked;if(previewSeconds){onlyHour=false;$('#clock-only-hour').checked=false}drawExplore();say(CLOCK_COPY.seconds)};
  $$('[data-advance]').forEach(b=>b.onclick=()=>{const delta=+b.dataset.advance;if(delta===1){previewSeconds=true;onlyHour=false;$('#clock-with-seconds').checked=true;$('#clock-only-hour').checked=false}exploreTime=mod(exploreTime+delta,43200);drawExplore()});
  $$('[data-demo]').forEach(b=>b.onclick=()=>{exploreTime=+b.dataset.demo;drawExplore();say(hourExplanation(exploreValue()))});
  $('#clock-demo-minute').onclick=()=>{previewSeconds=true;onlyHour=false;$('#clock-with-seconds').checked=true;$('#clock-only-hour').checked=false;exploreTime=21659;drawExplore();$('#clock-demo-note').textContent='6:00:59 → toca +1 segundo. Verás pasar un minuto.';say(CLOCK_COPY.seconds)};
  $('#clock-demo-hour').onclick=()=>{exploreTime=25140;drawExplore();$('#clock-demo-note').textContent='6:59 → toca +1 minuto. Verás llegar las 7:00.';say(CLOCK_COPY.oneHour)};
  $('#clock-begin').onclick=()=>intro('hours');drawExplore();say(CLOCK_COPY.explore);focusTitle();
 }
 function exploreValue(){return {h:Math.floor(exploreTime/3600)||12,m:Math.floor(exploreTime/60)%60,s:exploreTime%60}}
 function drawExplore(){const t=exploreValue();$('#clock-demo-face').innerHTML=clockSVG(clockAngles(t),{seconds:previewSeconds,onlyHour});$('#clock-demo-face').setAttribute('role','img');$('#clock-demo-face').setAttribute('aria-label',spokenTime(t,previewSeconds));$('#clock-demo-digital').textContent=digitalTime(t,previewSeconds);$('#clock-demo-spoken').textContent=spokenTime(t,previewSeconds);$('#clock-demo-note').textContent=previewSeconds?'60 segundos = 1 minuto · 60 minutos = 1 hora':hourExplanation(t)}
 function intro(id){
  screen='intro';const l=lessonFor(id),t=timeOf(l.example);
  shell(`<div class="clock-section-heading"><p class="eyebrow">PRIMERO, LO VEMOS JUNTOS</p><h2 tabindex="-1" data-clock-title>${l.name}</h2></div><div class="clock-intro-grid"><div role="img" aria-label="${esc(spokenTime(t,!!l.seconds))}">${clockSVG(clockAngles(t),{seconds:l.seconds})}<div class="clock-time-card"><strong>${digitalTime(t,l.seconds)}</strong><span>${spokenTime(t,l.seconds)}</span></div></div><section class="clock-explanation">${legend(l.seconds)}<h3>Fíjate en las agujas</h3><p>${l.explanation}</p><p>${hourExplanation(t)}</p>${l.seconds?'<p>La fina se cuenta con las mismas 60 rayitas. Al moverse, también avanzan un poquito las otras agujas.</p>':''}<div class="clock-tip">En el reto: primero la larga, después la corta${l.seconds?' y al final la fina':''}.</div>${progress.active&&progress.active.lesson!==l.id?'<p class="clock-session-notice">Al empezar se reemplaza el reto pendiente. Los retos ya logrados se conservan.</p>':''}<button class="primary" id="clock-start-lesson">▶ ${progress.active?.lesson===l.id?'Continuar':'¡Ahora me toca!'}</button></section></div>`);
  $('#clock-start-lesson').onclick=()=>{if(progress.active?.lesson!==l.id)progress.active=newClockSession(l.id,progress.lessons[l.id]?.sessions||0);progress.lastLesson=l.id;save();exercise()};say(l.explanation);focusTitle();
 }
 function exercise(){
  if(dead||!progress.active)return;screen='exercise';paused=false;const a=progress.active,l=lesson(),{time:t,type}=task(),hand=activeHand();
  shell(`<div class="clock-exercise-top"><p class="eyebrow">${l.name.toUpperCase()} · RETO ${a.index+1} DE 4</p><div class="clock-stars" aria-label="${a.results.length} de 4 retos logrados">${'★'.repeat(a.results.length)}${'☆'.repeat(4-a.results.length)}</div></div><h2 class="clock-task-title" tabindex="-1" data-clock-title>${type==='set'?'Pon las agujas en su lugar':'¿Qué hora marca el reloj?'}</h2>${type==='set'&&!a.done?`<p class="clock-active-label" style="--hand-color:${HANDS[hand].color}">${a.step+1}. Aguja ${HANDS[hand].description} · ${HANDS[hand].label.toLowerCase()}</p>`:''}<div class="clock-workspace"><section class="clock-board"><div id="clock-dial" ${type==='set'&&!a.done?'role="slider" tabindex="0" aria-label="Posición de la aguja activa"':'role="img"'}></div>${type==='set'?`<div class="clock-time-card" id="clock-target"><small>MARCA ESTA HORA</small><strong>${digitalTime(t,l.seconds)}</strong><span>${spokenTime(t,l.seconds)}</span></div>`:'<p class="clock-read-invite">Dila en voz alta y luego elige.</p>'}${legend(l.seconds)}</section><section class="clock-task-panel">${type==='set'?`<ol class="clock-hand-steps">${(l.seconds?['minute','hour','second']:['minute','hour']).map((h,i)=>`<li class="${i===a.step?'current':''} ${i<a.step||a.done?'finished':''}" ${i===a.step?'aria-current="step"':''} style="--hand-color:${HANDS[h].color}"><b>${i<a.step||a.done?'✓':i+1}</b><span>${HANDS[h].label}<small>Aguja ${HANDS[h].description}</small></span></li>`).join('')}</ol><p class="clock-move-instruction" id="clock-move-instruction">${a.done?'¡Ya está!':`Mueve la <strong>${HANDS[hand].description}</strong>. Arrastra su punta o toca en el reloj.`}</p><div class="clock-hand-controls" ${a.done?'hidden':''}><button id="clock-back-step" aria-label="Mover aguja hacia atrás">↶</button><output id="clock-position"></output><button id="clock-forward-step" aria-label="Mover aguja hacia delante">↷</button></div><button class="primary clock-check" id="clock-check" ${a.done?'hidden':''}>✓ Comprobar ${HANDS[hand].label.toLowerCase()}</button>`:`<div class="clock-reading-choices" ${a.done?'hidden':''}>${readingChoices(t,l.seconds).map((v,i)=>`<button data-clock-answer="${i}">${digitalTime(v,l.seconds)}</button>`).join('')}</div>`}<p id="clock-feedback" role="status" aria-live="polite" class="clock-feedback ${a.done?'is-good':''}">${a.done?`${spokenTime(t,l.seconds)}. ¡Reto logrado!`:''}</p><div class="clock-hint-buttons" ${a.done?'hidden':''}><button class="secondary" id="clock-hint">💡 Una pista</button>${type==='set'?'<button class="clock-quiet" id="clock-show">Muéstrame esta aguja</button>':''}</div><div class="clock-solved" ${a.done?'':'hidden'}><span>🌱 Semillita guardada</span><button class="primary" id="clock-next">${a.index===3?'Ver mi sesión':'Siguiente reto →'}</button></div><p class="clock-kind-note">Sin prisa. Puedes probar todas las veces que necesites.</p></section></div>`);
  $('#clock-next').onclick=next;
  if(type==='set'){
   const dial=$('#clock-dial');
   dial.onpointerdown=e=>{if(a.done||paused||dead||e.button!==0)return;pointer=e.pointerId;dial.setPointerCapture(e.pointerId);movePointer(e)};
   dial.onpointermove=e=>{if(pointer===e.pointerId&&!paused&&!a.done)movePointer(e)};
   dial.onpointerup=dial.onpointercancel=e=>{if(pointer===e.pointerId){pointer=null;save()}};
   dial.onkeydown=e=>{if(a.done||paused)return;if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home')setHand(0);else if(e.key==='End')setHand((hand==='hour'?720:60)-handStep(l,hand));else adjust(['ArrowRight','ArrowUp'].includes(e.key)?1:-1)}};
   $('#clock-back-step').onclick=()=>adjust(-1);$('#clock-forward-step').onclick=()=>adjust(1);$('#clock-check').onclick=check;
   $('#clock-show').onclick=()=>{if(paused||a.done)return;a.helped=true;a.hints=2;const values={hour:mod(t.h,12)*60+t.m,minute:t.m,second:t.s||0};setHand(values[hand]);announce(handHint(hand,t));save()};
  }else $$('[data-clock-answer]').forEach(b=>b.onclick=()=>{if(paused||a.done||dead)return;const chosen=readingChoices(t,l.seconds)[+b.dataset.clockAnswer];if(digitalTime(chosen,l.seconds)===digitalTime(t,l.seconds))win();else{a.mistakes++;a.helped=true;save();announce(l.seconds?CLOCK_COPY.readSecondsRetry:CLOCK_COPY.readRetry)}});
  $('#clock-hint').onclick=hint;drawDial();
  if(!a.done)say(type==='read'?(l.seconds?CLOCK_COPY.readSeconds:CLOCK_COPY.read):a.step===0?`Marca esta hora. ${spokenTime(t,l.seconds)}`:CLOCK_COPY[hand]);focusTitle();
 }
 function movePointer(e){const r=$('#clock-dial').getBoundingClientRect(),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;if(Math.hypot(x,y)<r.width*.055)return;e.preventDefault();setHand(snapHand(Math.atan2(x,-y)*180/Math.PI,lesson(),activeHand()),false)}
 function setHand(value,persist=true){if(dead||paused||progress.active?.done)return;const hand=activeHand();progress.active.hands[hand]=mod(value,hand==='hour'?720:60);drawDial();if(persist)save()}
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
  if(!handCorrect(a.hands,hand,t)){a.mistakes++;a.helped=true;if(a.mistakes>=2)a.hints=2;save();drawDial();announce(handHint(hand,t));return}
  if(a.step===(lesson().seconds?2:1)){win();return}options.sound('letter');a.step++;a.hints=0;save();exercise();$('#clock-dial').focus({preventScroll:true});
 }
 function hint(){if(dead||paused||progress.active.done)return;const a=progress.active;a.helped=true;a.hints=Math.min(2,a.hints+1);save();drawDial();announce(task().type==='set'?handHint(activeHand(),task().time):lesson().explanation)}
 function win(){
  const a=progress.active;if(!a||a.done||dead||paused)return;a.done=true;const result={independent:!a.helped&&a.mistakes===0,type:task().type};a.results.push(result);
  const stat=progress.lessons[a.lesson]??={sessions:0,solved:0,independent:0,read:0,set:0};stat.solved++;stat[result.type]++;if(result.independent)stat.independent++;
  save(true);options.sound('letter');exercise();say(spokenTime(task().time,lesson().seconds));$('#clock-next').focus({preventScroll:true});
 }
 function next(){
  if(dead||paused||!progress.active?.done)return;const a=progress.active;
  if(a.index===3){const id=a.lesson,independent=a.results.filter(r=>r.independent).length;progress.lessons[id].sessions++;progress.active=null;save();summary(id,independent);return}
  a.index++;a.step=0;a.done=false;a.helped=false;a.mistakes=0;a.hints=0;a.hands=initialHands(lesson(),task().time);save();exercise();
 }
 function summary(id,independent){
  screen='summary';const l=lessonFor(id),nextLesson=CLOCK_LESSONS[CLOCK_LESSONS.indexOf(l)+1];
  shell(`<section class="clock-summary"><img src="mascot-transparent.png" alt="Lilo celebra contigo"><p class="eyebrow">UN POQUITO MÁS CADA DÍA</p><h2 tabindex="-1" data-clock-title>¡Cuatro retos logrados!</h2><p>${l.name}</p><div class="clock-summary-stars" aria-label="Cuatro retos completados">★★★★</div><p>${independent} sin ayuda · ${4-independent} con acompañamiento</p><p>Practicaste leer y colocar las agujas. </p><div><button class="primary" id="clock-finish">Volver a Letralia</button><button class="secondary" id="clock-repeat">Repetir esta aventura</button>${nextLesson?'<button class="secondary" id="clock-next-lesson">Ver la siguiente aventura →</button>':''}</div></section>`);
  $('#clock-finish').onclick=options.onExit;$('#clock-repeat').onclick=()=>intro(id);$('#clock-next-lesson')?.addEventListener('click',()=>intro(nextLesson.id));say(CLOCK_COPY.complete);focusTitle();
 }
 function pause(){if(dead||paused)return;paused=true;pointer=null;options.cancelSpeech();$('#clock-body').hidden=true;$('#clock-paused').hidden=false;$('#clock-hear').disabled=true;$('#clock-pause').disabled=true;$('#clock-resume').focus({preventScroll:true})}
 function resume(){if(dead||!paused)return;paused=false;$('#clock-body').hidden=false;$('#clock-paused').hidden=true;$('#clock-hear').disabled=false;$('#clock-pause').disabled=false;$('#clock-pause').focus({preventScroll:true});say(lastSpeech)}
 menu();return {pause,resume,destroy(){dead=true;pointer=null;options.cancelSpeech()}};
}
