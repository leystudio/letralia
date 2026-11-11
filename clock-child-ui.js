import {CLOCK_LESSONS,timeOf,clockAngles,digitalTime,spokenTime,readingChoices} from './clock-model.js?v=39';
const HAND_COLORS={minute:'#087d80',hour:'#6943ad',second:'#b74419'};

export function littleClock(lesson) {
  const {hour,minute,second} = clockAngles(timeOf(lesson.example));
  const needle=(angle,length,color,width)=>`<path d="M40 40v-${length}" transform="rotate(${angle} 40 40)" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 80 80" width="68" height="68" aria-hidden="true"><circle cx="40" cy="40" r="36" fill="#fffdf8" stroke="#cebedb" stroke-width="3"/>
    <path d="M40 8v5m27 27h5M40 67v5M8 40h5" stroke="#776b85" stroke-width="3"/>
    ${needle(minute,26,'#087d80',4)}${needle(hour,17,'#6943ad',6)}${lesson.seconds?needle(second,29,'#b74419',2):''}<circle cx="40" cy="40" r="3.5" fill="#49385f"/></svg>`;
}

export function clockMenuView(progress, face) {
  const beginner=!progress.foundation?.complete;
  const playId = !beginner && progress.active ? 'clock-continue' : 'clock-play';
  return `<section class="little-welcome">
    <div class="clock-welcome-art">${beginner?'<div class="basics-preview"><span>🌼</span></div>':face}<img src="mascot-transparent.png" alt="Lilo"></div>
    <div><h2 data-clock-title tabindex="-1">La hora con Lilo</h2>
    <button class="primary little-play" id="${playId}">▶ ${beginner ? (progress.foundation?"Seguir":"Empezar") : progress.active ? 'Seguir' : 'Jugar'}</button>
    ${beginner && progress.active?'<button class="clock-quiet" id="clock-continue">▶ Mi ejercicio</button>':''}
    ${!beginner?'<button class="clock-quiet" id="clock-from-zero">🌼 Desde el inicio</button>':''}<button class="clock-quiet" id="clock-explore">🔍 Explorar</button></div>
  </section><details class="basics-practice" ${beginner?'':'open'}><summary>🎯 Practicar la hora</summary><div class="little-lessons">${CLOCK_LESSONS.map(l => `<button data-clock-lesson="${l.id}" aria-label="${l.name}" title="${l.name}">
    ${littleClock(l)}<strong>${digitalTime(timeOf(l.example), l.seconds)}</strong>
    ${progress.lessons[l.id]?.sessions ? '<span aria-label="Completado">★</span>' : ''}</button>`).join('')}</div></details>`;
}

export function clockIntroView(l,demo,face,i){
  return `<div class="little-demo"><h2 data-clock-title tabindex="-1">👀 Mira</h2>
    ${face}<button class="clock-time-card little-time" id="clock-example-hear" aria-label="Escuchar este ejemplo">🔊 <strong>${digitalTime(demo.t,l.seconds)}</strong></button>
    <div class="basics-options"><button class="${i<demo.count?'primary':'clock-quiet'}" id="clock-bridge-step" aria-label="${i<demo.count?'Avanzar las agujas':'Repetir el ejemplo'}">${i<demo.count?'⟳ Avanzar':'↻ Ver otra vez'}</button>
    <button class="${i===demo.count?'primary':'clock-quiet'}" id="clock-start-lesson">▶ Jugar</button></div></div>`;
}

export function clockTaskView(a,l,t,type,hand){
  const set=type==='set', choosing=set&&!a.done, hands={minute:'larga',hour:'corta',second:'finita'};
  const label=a.done?'¡Lo hiciste!':set?`Mueve la ${hands[hand]}`:'¿Qué hora es?';
  return `<div class="little-task-top"><h2 class="clock-task-title" data-clock-title tabindex="-1">${choosing?`<i class="legend-hand ${hand}" style="--hand-color:${HAND_COLORS[hand]}"></i>`:''} ${label}</h2>
    <div class="clock-stars" aria-label="${a.results.length} de 4">${'★'.repeat(a.results.length)}${'☆'.repeat(4-a.results.length)}</div></div>
    <div class="clock-workspace"><section class="clock-board"><div id="clock-dial" ${choosing?'role="slider" tabindex="0"':'role="img"'}></div>
    ${set?`<button class="clock-time-card little-time" id="clock-target" aria-label="Escuchar la hora que debes marcar">🔊 <strong>${digitalTime(t,l.seconds)}</strong></button>`:''}</section>
    <section class="clock-task-panel">${set?`<div class="clock-hand-controls" ${a.done?'hidden':''}><button id="clock-back-step" aria-label="Mover atrás">↶</button><output id="clock-position"></output><button id="clock-forward-step" aria-label="Mover adelante">↷</button></div>
    <button class="primary clock-check" id="clock-check" ${a.done?'hidden':''}>✓ Listo</button>`:`<div class="clock-reading-choices" ${a.done?'hidden':''}>${readingChoices(t,l.seconds).map((v,i)=>`<div class="little-choice"><button data-listen-answer="${i}" aria-label="Escuchar opción ${i+1}">🔊</button><button data-clock-answer="${i}">${digitalTime(v,l.seconds)}</button></div>`).join('')}</div>`}
    <p id="clock-feedback" role="status" aria-live="polite" class="clock-feedback"></p>
    <div class="little-hints" ${a.done?'hidden':''}><button class="clock-quiet" id="clock-hint">💡 Pista</button>${set?'<button class="clock-quiet" id="clock-show">👀 Ver</button>':''}</div>
    <div class="clock-solved" ${a.done?'':'hidden'}><button class="primary little-play" id="clock-next" aria-label="Seguir al siguiente paso">➜ Seguir</button></div></section></div>`;
}

export function clockExploreView(onlyHour,previewSeconds){
 return `<h2 class="clock-task-title" tabindex="-1" data-clock-title>🕒 Explorar</h2><div class="clock-explore-grid"><section><div id="clock-demo-face"></div><div class="clock-time-card"><strong id="clock-demo-digital"></strong></div></section>
 <section class="clock-explore-panel"><div class="clock-demo-switches"><label><input type="checkbox" id="clock-only-hour" ${onlyHour?'checked':''}><i class="legend-hand hour" style="--hand-color:#6943ad"></i> Solo la corta</label><label><input type="checkbox" id="clock-with-seconds" ${previewSeconds?'checked':''}><i class="legend-hand second" style="--hand-color:#b74419"></i> Segundos</label></div>
 <div class="clock-explore-buttons"><button data-advance="3600">+1 h</button><button data-advance="300">+5 min</button><button data-advance="60">+1 min</button><button data-advance="1">+1 seg</button></div>
 <div class="clock-example-buttons">${[21600,22500,23400,24300].map((v,i)=>`<button data-demo="${v}">6:${['00','15','30','45'][i]}</button>`).join('')}</div>
 <div class="clock-demo-actions"><button class="secondary" id="clock-demo-minute">⏱ 60 s → 1 min</button><button class="secondary" id="clock-demo-hour">🕒 60 min → 1 h</button></div>
 <p id="clock-demo-note" aria-live="polite"></p><button class="primary" id="clock-begin">▶ Jugar</button></section></div>`;
}

export function clockSummaryView(nextLesson){
 return `<section class="clock-summary"><img src="mascot-transparent.png" alt="Lilo"><h2 data-clock-title tabindex="-1">¡Lo hiciste!</h2><div class="clock-summary-stars" aria-label="Cuatro retos logrados">★★★★</div><div><button class="primary" id="clock-finish">🏠 Inicio</button><button class="secondary" id="clock-repeat">↻ Otra vez</button>${nextLesson?'<button class="secondary" id="clock-next-lesson">➜ Seguir</button>':''}</div></section>`;
}
