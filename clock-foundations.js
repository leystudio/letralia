const numberWords = ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce'];
const minuteWords = ['cero','cinco','diez','quince','veinte','veinticinco','treinta','treinta y cinco','cuarenta','cuarenta y cinco','cincuenta','cincuenta y cinco','sesenta'];
export const FOUNDATIONS = [
 {kind:'face', title:'Mi reloj', speech:'Este es un reloj. Nos ayuda a saber cuándo pasan las cosas. Toca su cara redonda.'},
 {kind:'center',title:'El centro',speech:'Toca el puntito del medio. Aquí se sujetan las agujas que giran.'},
 {kind:'countIntro',title:'A contar',speech:'Vamos a contar flores. Toca la primera flor.'},
 ...numberWords.slice(1).map((name,i)=>({kind:'count',n:i+1,title:'Las flores',speech:`${name}. ${i===0?'Una flor.':('Hay '+name+' flores.')}` })),
 ...[2,4,8,12].map(n=>({kind:'quantity',n,title:'¿Cuántas hay?',speech:'Cuenta las flores conmigo. Después toca el número que dice cuántas hay.'})),
 ...[12,1,2,3,4,5,6,7,8,9,10,11].map((n,i)=>({kind:'build',n,i,title:'Mi reloj',speech:i===0?'El doce vive arriba. Toca su sitio para ponerlo.':`Aquí va el ${numberWords[n]}. Toca su sitio.`})),
 ...[3,6,9,12].map((n,i)=>({kind:'turn',n,i,title:'Sigue la vuelta',speech:['Desde arriba, la aguja va hacia la derecha. Sigue la flecha con tu dedo y toca donde termina.','Ahora baja hasta el seis. Toca donde termina la flecha.','Ahora sigue por abajo y sube hacia el nueve.','Y vuelve arriba al doce. Así giran las agujas del reloj.'][i]})),
 {kind:'locate',n:3,title:'Tu turno',speech:'Ahora sin flecha. Desde arriba, ¿hacia dónde gira la aguja? Toca el número que encuentra primero entre estos dos.'},
 {kind:'short',title:'La corta',speech:'Mira la aguja corta. Señala la hora. Toca la aguja corta.'},
 {kind:'hour',n:3,title:'La hora',speech:'La corta señala el tres. Son las tres. Toca el tres en el reloj.'},
 {kind:'long',title:'La larga',speech:'Esta aguja llega más lejos. Es la larga. Cuenta los minutos que pasan. Toca la larga.'},
 {kind:'ticks',n:0,title:'Las rayitas',speech:'Cada rayita que avanza la larga es un minuto. En el juego podemos adelantar el reloj con el dedo. Toca la flecha.'},
 ...[1,2,3,4,5].map(n=>({kind:'ticks',n,title:'Los minutos',speech:n===5?'Cinco minutos. La larga llegó al uno. Entre el doce y el uno hay cinco pasitos.':`${numberWords[n]} ${n===1?'minuto':'minutos'}.`})),
 ...Array.from({length:11},(_,i)=>({kind:'fives',n:(i+2)*5,title:'Una vuelta',speech:i===10?'¡Una vuelta! Pasaron sesenta minutos. La corta llegó al tres. Pasó una hora.':`${minuteWords[i+2]} minutos.`})),
 {kind:'oclock',title:'En punto',speech:'La corta acaba de llegar al tres. La larga está arriba y han pasado cero minutos de la nueva hora. A eso le decimos las tres en punto.'},
 {kind:'matchHour',title:'Tu turno',speech:'¿Cuál marca las tres en punto? Busca la corta en el tres y la larga arriba.'},
 {kind:'digital',title:'La misma hora',speech:'También podemos escribir la hora. Antes de los dos puntitos van las horas. Después van los minutos. Tres y dos ceros significa las tres en punto.'},
 {kind:'day',title:'Mi día',speech:'El reloj da otra vuelta mientras pasa el día. Puede marcar las siete cuando desayunas o las siete por la noche. Mira el sol y la luna.'}
];
export const BRIDGES = {
 hours:{h:2,unit:60,count:1,voice:'Una vuelta de la larga dura una hora. Mira cómo la corta pasa del dos al tres.'},
 halves:{h:6,unit:15,count:2,voice:'Media es la mitad. Mira la larga salir de arriba y llegar abajo. Ha recorrido media vuelta. Pasaron treinta minutos.'},
 quarters:{h:3,unit:15,count:4,voice:'Repartimos la vuelta en cuatro partes iguales. Toca para recorrer una parte cada vez. Cada parte dura quince minutos.'},
 fives:{h:4,unit:5,count:4,voice:'Cada número del reloj está a cinco rayitas del siguiente. Toca y cuenta de cinco en cinco.'},
 minutes:{h:2,unit:1,count:3,start:15,voice:'La larga está en el tres. Ya pasaron quince minutos. Avanza una rayita cada vez y escucha cuántos van.'},
 seconds:{h:6,unit:1,count:3,start:58,voice:'En un reloj de verdad, cada pasito de la finita dura un segundo. Va por el cincuenta y ocho. Toca para avanzar.'}
};
export const BASICS_COPY={again:'Vamos juntos. Mira dónde brilla.',add:'Toca otra flor.',next:'Toca la flecha para seguir.', practice:'Vamos a probarlo.',lastQuarter:'Tres cuartos de vuelta. Faltan quince minutos para la siguiente hora. Por eso decimos menos cuarto.',quarter:'Un cuarto de vuelta. Pasaron quince minutos.',half:'Media vuelta. Pasaron treinta minutos.',secondMinute:'La finita volvió arriba. Sesenta segundos hacen un minuto. La larga avanzó una rayita.', firstSecond:'Cincuenta y nueve segundos.',newSecond:'Un segundo de este nuevo minuto.'};
export const countWords = numberWords;
export const foundationVoices = [...new Set([...FOUNDATIONS.map(s=>s.speech),...Object.values(BRIDGES).map(s=>s.voice),...Object.values(BASICS_COPY),...numberWords.slice(1),...['Cinco','Diez','Quince','Veinte','Dieciséis','Diecisiete','Dieciocho'].map(n=>n+' minutos.')])];

import {clockAngles,spokenTime} from './clock-model.js?v=39';

function circleLesson(step) {
  const places=[12,1,2,3,4,5,6,7,8,9,10,11];
  const point=(n,r)=>({x:50+r*Math.sin(n*Math.PI/6),y:50-r*Math.cos(n*Math.PI/6)});
  const build=step.kind==='build', turn=step.kind==='turn';
  const buttons=places.map((n,i)=>{
    const p=point(n,39), target=n===step.n;
    const choose=build ? i>=step.i : turn ? target : step.kind==='locate' ? n===3||n===9 : n===step.n||n===6||n===9;
    const value=build && i>=step.i ? (target?'＋':'·') : n;
    const pos=`style="left:${p.x}%;top:${p.y}%"`;
    return choose?`<button class="spot ${target&&(build||turn)?'lit':''}" ${pos} data-answer="${n}" aria-label="Posición ${n}">${value}</button>`:`<span class="spot" ${pos}>${value}</span>`;
  }).join('');
  let drawing='';
  if(turn){
    const a=point(step.n-3,29),b=point(step.n,29);
    drawing=`<defs><marker id="turn-tip" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="3.5" markerHeight="3.5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#09777c"/></marker></defs><path d="M${a.x},${a.y} A29,29 0 0 1 ${b.x},${b.y}" fill="none" stroke="#09777c" stroke-width="2.5" marker-end="url(#turn-tip)"/><g class="basics-sweep" style="--from:${(step.i)*90}deg;--to:${(step.i+1)*90}deg"><path d="M50 50V23" stroke="#6943ad" stroke-width="3" stroke-linecap="round"/></g>`;
  }else if(step.kind==='hour'){
    drawing='<path d="M50 50h25" stroke="#6943ad" stroke-width="4" stroke-linecap="round"/>';
  }
  return `<div class="basics-circle"><svg viewBox="0 0 100 100" aria-hidden="true">${drawing}<circle cx="50" cy="50" r="2.4" fill="#55446c"/></svg>${buttons}</div>`;
}

function flowerBoard(n,interactive=false){
  return `<div class="flower-bed" aria-label="${n} flores">${Array.from({length:n},(_,i)=>interactive?`<button data-flower="${i}" aria-label="Contar flor">🌼</button>`:'<span aria-hidden="true">🌼</span>').join('')}</div>`;
}

export function lessonClock(t,face,{minuteDelta=0,secondDelta=0,arc=0,seconds=false}={}){
  return `<div class="basics-clock" style="--minute-from:${-minuteDelta}deg;--hour-from:${-minuteDelta/12}deg;--second-from:${-secondDelta}deg">${face(clockAngles(t),{seconds,ring:false})}${arc?`<svg class="basics-arc" viewBox="0 0 440 440" aria-hidden="true"><circle cx="220" cy="220" r="181" fill="none" stroke="#1a938c" opacity=".58" stroke-width="9" pathLength="60" stroke-dasharray="${arc} 60" transform="rotate(-90 220 220)"/></svg>`:''}</div>`;
}

export function foundationView(step,face) {
 const next='<button class="primary basics-next" data-basics-next aria-label="Seguir">➜</button>';
 let activity='',advance=next,correct;
 switch(step.kind){
 case 'face':case 'center':{
   const center=step.kind==='center';
   const example=face(clockAngles({h:8,m:0}),{ring:false});
   activity=`<div class="basics-circle basics-empty">${center?example+'<button class="center-dot lit" aria-label="El centro" data-basics-next>●</button>':'<button class="whole-face" aria-label="La cara redonda" data-basics-next>'+example+'</button>'}</div>`;advance='';break;
 }
 case 'countIntro':activity='<button class="basics-flower" data-basics-next aria-label="Contar la primera flor">🌼</button>';advance='';break;
 case 'count':activity=`<strong class="basics-digit">${step.n}</strong>${flowerBoard(step.n)}`;if(step.n<12)advance='<button class="primary basics-next" data-basics-next aria-label="Añadir otra flor">＋ 🌼</button>';break;
 case 'quantity':{
   correct=step.n;
   const choices=step.n===2?[1,3,2]:step.n===4?[4,3,5]:step.n===8?[7,8,9]:[10,11,12];
   activity=flowerBoard(step.n,true)+`<div class="basics-options">${choices.map(n=>`<button data-answer="${n}">${n}</button>`).join('')}</div>`;advance='';break;
 }
 case 'build':case 'turn':case 'locate':case 'hour':
   correct=step.n;activity=(step.kind==='build'?`<strong class="basics-piece">${step.n}</strong>`:'')+circleLesson(step);advance='';break;
 case 'short':case 'long':{
   correct=step.kind;activity=`<div class="basics-clock">${face(clockAngles({h:3,m:0}),{onlyHour:step.kind==='short',ring:false})}</div><div class="basics-options">${(step.kind==='short'?['long','short']:['short','long']).map(h=>`<button data-answer="${h}" aria-label="Aguja ${h==='short'?'corta':'larga'}"><i class="sample-hand ${h}"></i></button>`).join('')}</div>`;advance='';break;
 }
 case 'ticks':case 'fives':{
   const m=step.n;activity=lessonClock({h:m===60?3:2,m:m%60},face,{minuteDelta:m===0?0:step.kind==='ticks'?6:30,arc:m})+`<strong class="basics-piece">${m} min</strong>`;
   advance=`<button class="primary basics-next" data-basics-next aria-label="Seguir">${m===60?'➜':m<5?'+1 ⟳':'+5 ⟳'}</button>`;break;
 }
 case 'oclock':case 'digital':activity=lessonClock({h:3,m:0},face)+'<div class="basics-digital"><b>3</b> : <b>00</b></div>';break;
 case 'matchHour':
   correct='hour';activity=`<div class="basics-options faces">${[{k:'half',m:30},{k:'hour',m:0}].map(v=>`<button data-answer="${v.k}" aria-label="${v.m?'Tres y media':'Tres en punto'}">${face(clockAngles({h:3,m:v.m}),{ring:false})}</button>`).join('')}</div>`;advance='';break;
 case 'day':activity=`<div class="basics-day"><span>☀️ 🥣</span>${lessonClock({h:7,m:0},face)}<span>🌙 🛏️</span></div>`;break;
 }
 return {correct,html:`<section class="basics-scene"><h2 tabindex="-1" data-clock-title>${step.title}</h2>${activity}<div class="basics-feedback" role="status"></div>${advance}</section>`};
}

export function bridgeState(lesson,i){
 const b=BRIDGES[lesson.id],seconds=!!lesson.seconds;
 const elapsed=(b.start||0)+i*b.unit;
 const t=seconds?{h:6,m:30+Math.floor(elapsed/60),s:elapsed%60}:{h:b.h+Math.floor(elapsed/60),m:elapsed%60};
 let speech=b.voice;
 if(i>0){
   if(seconds)speech=[null,BASICS_COPY.firstSecond,BASICS_COPY.secondMinute,BASICS_COPY.newSecond][i];
   else if(lesson.id==='quarters'||lesson.id==='halves')speech=[null,BASICS_COPY.quarter,BASICS_COPY.half,BASICS_COPY.lastQuarter,spokenTime(t)][i];
   else if(lesson.id==='hours')speech=spokenTime(t);
   else speech=({5:'Cinco',10:'Diez',15:'Quince',20:'Veinte',16:'Dieciséis',17:'Diecisiete',18:'Dieciocho'})[elapsed]+' minutos.';
 }
 return {t,speech,count:b.count,seconds,minuteDelta:i?(seconds ? 0.1 : b.unit*6):0,secondDelta:seconds&&i?6:0,arc:seconds?0:Math.min(elapsed,60)};
}
