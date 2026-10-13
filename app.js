import {SPANISH_AUDIO} from './spanish-audio.js?v=24';
import {makeRound,cleanJourney,completeRoundItem,nextRoundItem} from './journey.js?v=19';
import {QUICK_AUDIO} from './quick-audio.js?v=18';
import {createGameSounds} from './game-sounds.js?v=17';
import {createBackgroundMusic, MUSIC_TRACKS} from './background-music.js?v=17';
import {exampleSegments, SCENES, defaultScene} from './learning-visuals.js?v=15';
import {LEVELS, VOCABULARY, shuffled, makeDeck, gamePrompt, letterName, normalize, canAccept, readingSequence} from './curriculum.js?v=20';
import {ADAPTIVE_AUDIO,cleanMemory,record,initialCue,rowFor,matchingChoices,selectReview} from './adaptive.js?v=15';
import {AUDIO} from './audio-manifest.js?v=24';
import {activeChildId,queueProgress,readLocalProgress,saveGuestProgress,clearGuestProgress} from './profiles.js?v=26';
import {createAccounts} from './account-ui.js?v=26';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const modal=$('#modal'), activity=$('#activity'), keyboard=$('#keyboard');
const defaults={voice:'',rate:.82,hints:'auto',lower:false,motion:matchMedia('(prefers-reduced-motion: reduce)').matches,layout:'es',save:true,sounds:true,music:true};
let journey=cleanJourney(null,LEVELS);
let prefs={...defaults}, learned=[], completions=[], memory={}, recent={}, decks={}, comprehension={free:0,helped:0}, storageOk=true;
try{const saved=readLocalProgress();if(saved){journey=cleanJourney(saved.journey,LEVELS);prefs={...defaults,...saved.prefs};memory=cleanMemory(saved.memory);if(saved.recent&&typeof saved.recent==='object')recent=Object.fromEntries(Object.entries(saved.recent).filter(([k,v])=>Number.isInteger(+k)&&Number.isInteger(v)&&LEVELS[k]?.items[v]));if(saved.comprehension)for(const k of ['free','helped'])comprehension[k]=Number.isFinite(saved.comprehension[k])?Math.max(0,Math.floor(saved.comprehension[k])):0;learned=Array.isArray(saved.learned)?saved.learned.filter(x=>typeof x==='string'):[];completions=Array.isArray(saved.completions)?saved.completions:[];}}catch{storageOk=false}
let state={phase:'welcome',level:2,item:0,index:0,lockedUntil:0,mistakes:0,hint:false}, held=new Set(), voices=[], speechId=0, timers=[], sessionCount=0, currentSpeech='', resumePhase=null, activeAudio=null;
const item=()=>LEVELS[state.level].items[state.item];
const musicAudio=document.createElement('audio');musicAudio.id='background-music';musicAudio.hidden=true;musicAudio.setAttribute('aria-hidden','true');document.body.append(musicAudio);
const music=createBackgroundMusic(musicAudio,()=>({enabled:prefs.music,hidden:document.hidden,modal:modal.open,phase:state.phase,level:state.level,mode:LEVELS[state.level].mode}));
new MutationObserver(()=>{music.sync();syncPauseControl();renderJourney()}).observe(activity,{childList:true,subtree:true});
new MutationObserver(()=>music.sync()).observe(modal,{attributes:true,attributeFilter:['open']});
document.addEventListener('visibilitychange',()=>music.sync());
document.addEventListener('click',()=>music.sync());
document.addEventListener('keydown',()=>music.sync());
window.addEventListener('pagehide',()=>music.stop());

const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const effects=createGameSounds(()=>({enabled:prefs.sounds,hidden:document.hidden}),()=>new(window.AudioContext||window.webkitAudioContext)());
function chime(kind='tap'){effects.play(kind)}
document.addEventListener('pointerdown',()=>{effects.welcome();music.sync()},{capture:true});
document.addEventListener('keydown',e=>{if(!e.repeat){effects.welcome();music.sync()}},{capture:true});
document.addEventListener('click',e=>{
 if(e.target.closest('button,a,summary,input,select,.game-card,.companion'))chime();
});
document.addEventListener('change',e=>{if(e.target.matches('input,select'))chime()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)effects.stop()});
window.addEventListener('pagehide',()=>effects.stop());
function progressSnapshot(){return {prefs,learned,completions,memory,comprehension,recent,journey}}
function applyProgress(data){
 data=data&&typeof data==='object'?data:{};
 journey=cleanJourney(data.journey,LEVELS);prefs={...defaults,...data.prefs};if(activeChildId())prefs.save=true;memory=cleanMemory(data.memory);
 recent=data.recent&&typeof data.recent==='object'?Object.fromEntries(Object.entries(data.recent).filter(([k,v])=>Number.isInteger(+k)&&Number.isInteger(v)&&LEVELS[k]?.items[v])):{};
 comprehension={free:0,helped:0};for(const k of ['free','helped'])comprehension[k]=Number.isFinite(data.comprehension?.[k])?Math.max(0,Math.floor(data.comprehension[k])):0;
 learned=Array.isArray(data.learned)?data.learned.filter(x=>typeof x==='string'):[];completions=Array.isArray(data.completions)?data.completions.filter(x=>typeof x==='string'):[];
 decks={};sessionCount=0;clearPending();state={phase:'welcome',level:journey.current,item:0,index:0,lockedUntil:0,mistakes:0,hint:false};
 document.body.classList.toggle('reduced',prefs.motion);collection();renderJourney();music.sync();
}
function persist(){const data=progressSnapshot(),childId=activeChildId();if(childId)queueProgress(childId,data);else if(prefs.save)storageOk=saveGuestProgress(data);else clearGuestProgress()}
function delay(fn,ms){const id=setTimeout(fn,ms);timers.push(id);return id}
function cancelSpeech(){speechId++;window.speechSynthesis?.cancel();if(activeAudio){activeAudio.pause();activeAudio.onended=null;activeAudio.onerror=null;activeAudio=null}document.body.classList.remove('speaking');music.duck(false)}
function clearPending(){clearVisuals();timers.forEach(clearTimeout);timers=[];cancelSpeech();held.clear()}
function selectedVoice(){return voices.find(v=>v.voiceURI===prefs.voice)||voices.find(v=>/^es-(DO|MX|US|419)/i.test(v.lang))||voices.find(v=>/^es/i.test(v.lang))}
function updateVoices(){voices=window.speechSynthesis?.getVoices().filter(v=>/^es/i.test(v.lang))||[];if($('#voice-select'))fillVoiceSelect()}
function say(text,done,quick=false){currentSpeech=text;cancelSpeech();music.duck(true);const id=speechId;let finished=false;const finish=()=>{if(finished||id!==speechId)return;finished=true;document.body.classList.remove('speaking');music.duck(false);done?.()};const recorded=()=>{if(id!==speechId)return;if(!SPANISH_AUDIO[text]&&!AUDIO[text]){voiceNotice();delay(finish,700);return}const audio=new Audio(SPANISH_AUDIO[text]||(quick&&QUICK_AUDIO[text])||AUDIO[text]);activeAudio=audio;audio.playbackRate=prefs.rate/.82;audio.onended=finish;audio.onerror=()=>{voiceNotice();finish()};audio.play().then(()=>{if(id===speechId){$('#voice-notice')?.remove();document.body.classList.add('speaking')}else audio.pause()}).catch(()=>{if(id===speechId){voiceNotice();finish()}})};const voice=SPANISH_AUDIO[text]||!prefs.voice||prefs.voice==='recorded'?null:selectedVoice();if(!('speechSynthesis'in window)||!voice){recorded();return}$('#voice-notice')?.remove();const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;u.rate=prefs.rate*(quick?1.10:1);u.pitch=1.05;u.onstart=()=>document.body.classList.add('speaking');u.onend=finish;u.onerror=e=>{if(e.error!=='canceled'&&e.error!=='interrupted')recorded()};speechSynthesis.speak(u);delay(finish,Math.max(6000,text.length*130))}
function voiceNotice(){let n=$('#voice-notice');if(!n){n=document.createElement('p');n.id='voice-notice';n.className='voice-status';$('.game-foot').before(n)}n.textContent='No pudimos reproducir la voz en español. Un adulto puede revisar «Para familias → Voz». Las pistas escritas siguen disponibles.'}
function collection(){ $('#collection').textContent=`★ ${learned.length}`;$('#collection-bar').style.width=Math.min(100,learned.length/30*100)+'%'}
function setSteps(n){$$('.step').forEach((e,i)=>e.classList.toggle('current',i===n))}
function showModal(title,html){window.dispatchEvent(new Event('letralia-modal-changing'));clearPending();$('#modal-title').textContent=title;$('#modal-body').innerHTML=html;if(!modal.open)modal.showModal()}
function gateForParent(next){
 const answer=5+Math.floor(Math.random()*11),a=1+Math.floor(Math.random()*(answer-1)),b=answer-a;
 showModal('Solo para adultos',`<section id="parent-gate"><p>Para entrar, resuelve: <strong>¿Cuánto es ${a} + ${b}?</strong></p><form id="gate-form"><label class="field">Respuesta<input id="gate-answer" inputmode="numeric" pattern="[0-9]{1,2}" maxlength="2" autocomplete="off" required></label><div class="number-pad">${['1','2','3','4','5','6','7','8','9','⌫','0'].map(n=>`<button type="button" data-number="${n}" aria-label="${n==='⌫'?'Borrar':n}">${n}</button>`).join('')}</div><button class="primary" id="gate-submit">Continuar</button></form><p id="gate-error" role="alert"></p></section>`);
 $('#gate-form').onsubmit=e=>{e.preventDefault();if(Number($('#gate-answer').value)===answer)next();else{$('#gate-error').textContent='Esa respuesta no es correcta. Inténtalo otra vez.';$('#gate-answer').value=''}};
 $$('[data-number]').forEach(button=>button.onclick=()=>{const input=$('#gate-answer');input.value=button.dataset.number==='⌫'?input.value.slice(0,-1):(input.value+button.dataset.number).slice(0,2)});
}
function notifyAccount(message){const t=$('#status');t.textContent=message;t.hidden=false;clearTimeout(notifyAccount.timer);notifyAccount.timer=setTimeout(()=>t.hidden=true,5000)}
function resetGame(data){
 applyProgress(data);keyboard.hidden=true;
 activity.innerHTML='<div class="welcome"><div class="word-picture" aria-label="Casa">🏠</div><div class="preview-letters"><span>C</span><span>A</span><span>S</span><span>A</span></div><button class="primary" id="start" aria-label="Empezar a jugar">▶</button><p class="guest-prompt">Juegas como invitado · <button id="guest-account">Crea tu cuenta gratis</button> para guardar el progreso en todos tus equipos</p></div>';
 $('#start').onclick=()=>{updateVoices();startLevel(journey.current)};$('#guest-account').onclick=accounts.account;accounts.refreshButton();
}
function speakAccount(text){
 cancelSpeech();const id=speechId;
 return new Promise(resolve=>{
  let finished=false;const done=()=>{if(finished)return;finished=true;clearTimeout(timeout);if(id===speechId){document.body.classList.remove('speaking');music.duck(false)}resolve()};
  const timeout=setTimeout(done,2500);
  if(text==='¿Quién va a jugar hoy?'){const audio=new Audio('audio/profile-picker.mp3');activeAudio=audio;audio.onended=done;audio.onerror=done;audio.play().catch(done);return}
  const voice=selectedVoice();if(!voice||!window.speechSynthesis){done();return}
  const utterance=new SpeechSynthesisUtterance(text);utterance.lang=voice.lang;utterance.voice=voice;utterance.rate=prefs.rate;utterance.onend=done;utterance.onerror=done;speechSynthesis.speak(utterance);
 });
}
const accounts=createAccounts({showModal,showGate:gateForParent,applyProgress,resetGame,startGame:()=>startLevel(journey.current),speak:speakAccount,toast:notifyAccount});
window.addEventListener('letralia-storage-warning',e=>notifyAccount(e.detail));
function closeModal(){modal.close();held.clear();if(state.phase==='typing')promptLetter();else if(state.phase==='reading'){if($('#read-word'))readTogether();else readStage()}else if(state.phase==='matching')remedialStage();else if(state.phase==='discovery')discoveryStage();else if(state.phase==='success')celebrate()}
$('#close-modal').onclick=closeModal;modal.addEventListener('cancel',e=>{e.preventDefault();closeModal()});
function displayChar(c){return c===' '?'␣':prefs.lower?c.toLowerCase():c.toUpperCase()}
function showHint(){return state.cue>=2} function resetCue(){state.cue=initialCue({level:state.level>=6?2:state.level,preference:prefs.hints,review:state.review,stats:memory[normalize(item().text[state.index]||'')]});state.usedHelp=state.cue>0;}
function renderKeyboard(){keyboard.hidden=false;keyboard.innerHTML=['QWERTYUIOP',prefs.layout==='es'?'ASDFGHJKLÑ':'ASDFGHJKL','ZXCVBNM'].map((row,r)=>`<div class="key-row" style="padding-left:${r*12}px">${[...row].map(k=>`<button type="button" class="key" data-key="${k}" aria-label="Letra ${letterName(k)}">${k}</button>`).join('')}</div>`).join('')+`<div class="key-row"><button class="key space" data-key=" " aria-label="Espacio">␣</button>${prefs.layout==='us'&&item().text.includes('ñ')?'<button class="key" data-key="Ñ" aria-label="Letra eñe">Ñ</button>':''}</div>`;$$('[data-key]').forEach(b=>b.onclick=()=>inputLetter(b.dataset.key,false,'touch'));updateKeys()}
function updateKeys(){const target=normalize(item().text[state.index]||'');const space=state.phase==='typing'&&target===' ';const row=rowFor(target);const guided=state.phase==='typing'&&state.mistakes>0&&state.cue>=2;if(space)state.usedHelp=true;$('#prompt')?.classList.toggle('space-prompt',space);$$('#keyboard .key-row').forEach((r,i)=>r.classList.toggle('guided-row',guided&&i===row));$$('[data-key]').forEach(b=>{const on=state.phase==='typing'&&(space||showHint())&&normalize(b.dataset.key)===target;b.classList.toggle('target',on);b.classList.toggle('guided-target',on&&guided&&!space);b.classList.toggle('space-target',on&&space);b.classList.remove('demonstrate','row-hint');if(on)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current')})}
function renderSlots(){
 const target=item().text,missing=LEVELS[state.level].mode==='missing';
 $('#slots').innerHTML=[...target].map((c,i)=>{
  const done=missing?i!==state.index:i<state.index;
  const hidden=(state.level===4&&i>=state.index)||(missing&&i===state.index);
  return `<span class="letter-slot ${done?'done':i===state.index?'next':''} ${hidden?'blank':''}" aria-label="${hidden?'Letra oculta':done?'Escrita: '+c:'Siguiente: '+c}">${hidden?'':displayChar(c)}</span>`;
 }).join('');
}
function promptText(){const c=item().text[state.index];if(c===' ')return 'Ahora, pulsa la barra de espacio.';return `Busca la letra ${letterName(c)}.`}
function promptLetter(praise=''){if(state.phase!=='typing')return;const c=item().text[state.index];$('#prompt').textContent=c===' '?'␣':displayChar(c);renderSlots();updateKeys();say(praise+promptText())}
function startLevel(level=2,index=null,options={}){
 if(accounts.hasSession()&&!activeChildId()){accounts.account();return}
 if(!Number.isInteger(level)||level<0||level>=LEVELS.length)throw Error('Nivel no válido');
 const opening=index===null||state.phase==='welcome'||state.level!==level;
 clearPending();if(modal.open)modal.close();
 if(!options.review){
  let round=journey.rounds[level];
  if(!round||round.done.length===round.deck.length){
   const pending=makeDeck(level,completions,recent[level]);
   round=makeRound(LEVELS[level].items,[...pending,...makeDeck(level,[],recent[level])]);journey.rounds[level]=round;
  }
  decks[level]=round.deck;
  if(index===null||!round.deck.includes(index)||round.done.includes(index))index=round.deck.find(i=>!round.done.includes(i));
  journey.current=level;
 }
 if(!Number.isInteger(index)||!LEVELS[level].items[index])throw Error('Actividad no válida');
 if(opening)chime('start');
 recent[level]=index;persist();
 state={phase:'typing',level,item:index,index:0,part:0,lockedUntil:performance.now()+650,mistakes:0,hint:false,review:!!options.review,returnTo:options.returnTo||null};
 const mode=LEVELS[level].mode;
 if(mode==='picture'||mode==='syllables'){discoveryStage();return}
 if(mode==='missing')state.index=Math.floor(Math.random()*item().text.length);
 resetCue();renderTyping();
 if(mode==='missing')say(`Completa ${item().text}. ${promptText()}`);
 else say(`Vamos a ${level===0?'encontrar la vocal':level===1?'formar la sílaba':'escribir'} ${item().text}. ${promptText()}`);
}
function discoveryStage(){
 clearPending();state.phase='discovery';keyboard.hidden=true;state.lockedUntil=performance.now()+650;
 const w=item(),mode=LEVELS[state.level].mode,part=state.part||0;
 const target=mode==='picture'?w.exampleWord:w.parts[part];
 let choices;
 if(mode==='picture'){
  const other=shuffled(VOCABULARY.filter(v=>v.meaning!==w.meaning&&v.icon!==w.icon))[0];
  choices=shuffled([{value:target,label:w.meaning,display:w.icon},{value:other.key,label:other.meaning,display:other.icon}]);
 }else{
  const pool=[...new Set(LEVELS[state.level].items.flatMap(v=>v.parts))].filter(p=>p!==target);
  choices=shuffled([target,shuffled(pool)[0]]).map(v=>({value:v,label:v,display:prefs.lower?v:v.toUpperCase()}));
 }
 if(state.choicePart===part&&state.choices)choices=state.choices;else{state.choicePart=part;state.choices=choices}
 const word=mode==='syllables'?`<div class="activity-picture" role="img" aria-label="${esc(w.meaning)}">${w.icon}</div><div class="syllable-build">${w.parts.map((p,i)=>`<span class="syllable-piece ${i<part?'done':i===part?'next':''}">${i<=part?esc(prefs.lower?p:p.toUpperCase()):'•'}</span>`).join('')}</div>`:'<div class="listen-cue" aria-hidden="true">🔊</div>';
 activity.innerHTML=`<div class="discovery">${word}<div class="choices">${choices.map(c=>`<button class="choice ${mode==='syllables'?'syllable-choice':''}" data-discover="${esc(c.value)}" aria-label="${esc(c.label)}">${c.display}</button>`).join('')}</div><p id="discovery-feedback" class="instruction" aria-live="polite"></p></div>`;
 const brief=state.discoveryPrompted||(journey.rounds[state.level]?.done.length||0)>0;
 state.discoveryPrompted=true;say(gamePrompt(w,mode,part,brief));
 delay(()=>{if(state.phase==='discovery'&&!modal.open&&!document.hidden)$$('[data-discover]').forEach(b=>b.classList.toggle('match-hint',b.dataset.discover===target))},5000);
 $$('[data-discover]').forEach(b=>b.onclick=()=>{
  if(state.phase!=='discovery'||modal.open||document.hidden||performance.now()<state.lockedUntil)return;
  state.lockedUntil=performance.now()+700;
  if(b.dataset.discover!==target){$('#discovery-feedback').textContent='👀';say(gamePrompt(w,mode,part,true));return}
  chime('letter');mascotMood('happy');
  if(mode==='syllables'&&part+1<w.parts.length){state.part++;discoveryStage()}
  else {clearPending();state.phase='reading';readStage()}
 });
}
function renderTyping(){mascotMood('calm');setSteps(1);$('#lesson-tag').textContent=state.review?'★':`★ ${state.item+1} / ${LEVELS[state.level].items.length}`;const w=item();activity.innerHTML=`<div class="activity-heading"><span class="activity-picture" role="img" aria-label="${esc(w.meaning)}">${w.icon}</span><div><div class="subword">${state.level===4?'':esc(w.meaning)}</div></div></div><p class="prompt" id="prompt" aria-live="polite"></p><div id="slots" class="letter-slots" aria-label="Palabra en construcción"></div><p class="instruction" id="feedback"></p>`;renderKeyboard();$('#prompt').textContent=item().text[state.index]===' '?'␣':displayChar(item().text[state.index]);renderSlots();}
function giveHelp(manual=false){mascotMood('guide');const target=normalize(item().text[state.index]);state.usedHelp=true;record(memory,target,'help');persist();if(manual)state.mistakes=Math.max(1,state.mistakes);state.cue=2;if(state.mistakes>=3&&target!==' '){remedialStage();return}updateKeys();const row=rowFor(target);$('#feedback').textContent='👀';const letterInstruction=promptText();const level=state.level,index=state.index,word=state.item;const locate=()=>{if(state.phase==='typing'&&!modal.open&&state.level===level&&state.item===word&&state.index===index)say(letterInstruction)};if(row>=0)say(ADAPTIVE_AUDIO[row],locate);else locate()}
function inputLetter(raw,repeat=false,source='physical'){if(modal.open||document.hidden||state.phase!=='typing'||!canAccept({repeat,now:performance.now(),lockedUntil:state.lockedUntil}))return false;const key=normalize(raw);if(key.length!==1)return false;const expected=normalize(item().text[state.index]);if(key===state.lastAccepted&&key!==expected)return false;if(!/^[a-zñ ]$/.test(key))return false;if(key!==expected){state.mistakes++;state.usedHelp=true;record(memory,expected,'misses');persist();state.lockedUntil=performance.now()+850;if(prefs.hints!=='off')giveHelp();else{$('#feedback').textContent='👀';say(promptText())}return false}record(memory,expected,source==='touch'?(state.usedHelp?'touchHelp':'touchFree'):(state.usedHelp?'physicalHelp':'physicalFree'));persist();flyLetter(expected,state.index);mascotMood('happy');chime('letter');state.lastAccepted=key;if(LEVELS[state.level].mode==='missing')state.index=item().text.length;else state.index++;$('#feedback').textContent='⭐';state.lockedUntil=performance.now()+700;state.mistakes=0;state.hint=false;renderSlots();if(state.index===item().text.length){state.phase='reading';updateKeys();delay(()=>{if(state.phase==='reading'&&!modal.open){keyboard.hidden=true;readStage()}},prefs.motion?0:380)}else{resetCue();updateKeys();delay(()=>promptLetter(),150)}return true}
function remedialStage(){clearPending();state.phase='matching';keyboard.hidden=true;const target=normalize(item().text[state.index]);activity.innerHTML=`<div class="success"><span class="lesson-tag"></span><h2 aria-label="Busca una letra igual">👀</h2><div class="match-target">${displayChar(target)}</div><div class="choices">${matchingChoices(target).map(c=>`<button class="choice letter-choice" data-match="${c}" aria-label="Elegir ${letterName(c)}">${displayChar(c)}</button>`).join('')}</div><p id="match-feedback" class="instruction" aria-live="polite"></p><button class="quiet" id="back-word" aria-label="Volver a la palabra">↩</button></div>`;say(ADAPTIVE_AUDIO[4]);scheduleMatchHint(target);state.lockedUntil=performance.now()+650;$$('[data-match]').forEach(b=>b.onclick=()=>{if(state.phase!=='matching'||performance.now()<state.lockedUntil)return;state.lockedUntil=performance.now()+800;if(b.dataset.match===target){chime('letter');record(memory,target,'match');persist();returnFromMatch(true)}else{$('#match-feedback').textContent='👀';say(ADAPTIVE_AUDIO[5])}});$('#back-word').onclick=()=>returnFromMatch(false);}
function scheduleMatchHint(target){
 const level=state.level,word=state.item,index=state.index;
 delay(()=>{
  if(state.phase!=='matching'||modal.open||document.hidden||state.level!==level||state.item!==word||state.index!==index)return;
  $$('[data-match]').forEach(b=>b.classList.toggle('match-hint',b.dataset.match===target));
 },5000);
}
function returnFromMatch(success){clearPending();state.phase='typing';state.cue=2;state.usedHelp=true;state.mistakes=0;state.lockedUntil=performance.now()+850;renderTyping();$('#feedback').textContent=success?'⭐':'⌨';if(success)say(ADAPTIVE_AUDIO[6]);else promptLetter()}
window.addEventListener('keydown',e=>{if(modal.open||state.phase!=='typing'||e.ctrlKey||e.metaKey||e.altKey||e.isComposing)return;if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;const token=e.code||e.key;if(e.key.length===1)e.preventDefault();if(e.repeat||held.has(token))return;held.add(token);if(e.key.length===1)inputLetter(e.key,e.repeat)});
window.addEventListener('keyup',e=>held.delete(e.code||e.key));
function mascotMood(mood){$('#mascot-wrap').dataset.mood=mood}
function clearVisuals(){
 $$('[data-match],[data-discover]').forEach(e=>e.classList.remove('match-hint'));
 $$('.flying-letter').forEach(e=>e.remove());
 $$('.meaning-scene').forEach(e=>e.classList.remove('is-active'));
 mascotMood('calm');
}
function flyLetter(key,index){
 if(prefs.motion)return;
 const from=$$('[data-key]').find(e=>normalize(e.dataset.key)===key),to=$$('.letter-slot')[index];
 if(!from||!to)return;
 const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();
 const letter=document.createElement('span');letter.className='flying-letter';letter.textContent=displayChar(key);letter.setAttribute('aria-hidden','true');
 Object.assign(letter.style,{left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`});
 letter.style.setProperty('--flight-x',`${b.left+b.width/2-a.left-a.width/2}px`);
 letter.style.setProperty('--flight-y',`${b.top+b.height/2-a.top-a.height/2}px`);
 document.body.append(letter);delay(()=>letter.remove(),380);
}
function sceneMarkup(w){
 const scene=SCENES[w.exampleWord]||defaultScene(w);
 if(!scene)return `<div class="activity-picture">${w.icon}</div>`;
 const actor=scene.actor==='lilo'?'<img src="mascot.png" alt="" width="88" height="88">':scene.actor;
 return `<div class="meaning-scene scene-${scene.motion}" role="img" aria-label="${esc(w.usage)}"><span class="scene-prop" aria-hidden="true">${scene.prop}</span><span class="scene-actor" aria-hidden="true">${actor}</span></div>`;
}
function readStage(){
 setSteps(2);keyboard.hidden=true;cancelSpeech();const w=item();
 activity.innerHTML=`<div class="success">${sceneMarkup(w)}<div class="read-word reading-parts ${state.level===5?'phrase-parts':''}" id="read-word">${w.parts.map((p,i)=>`<span data-part="${i}">${esc(prefs.lower?p:p.toUpperCase())}</span>`).join('')}</div><p class="example-word" id="reading-example" hidden></p></div>`;
 readTogether();
}
function readTogether(){
 if(!$('#read-word')){readStage();return}
 clearPending();const w=item(),sequence=readingSequence(w,state.level);let i=0;
 const preloaded=sequence.filter(s=>s.part>=0&&!s.example&&(SPANISH_AUDIO[s.text]||QUICK_AUDIO[s.text])).map(s=>{const a=new Audio(SPANISH_AUDIO[s.text]||QUICK_AUDIO[s.text]);a.preload='auto';a.load();return a});
 function next(){
  if(state.phase!=='reading'||modal.open)return;
  if(i>=sequence.length){finishItem();return}
  const step=sequence[i],whole=step.part===-1;
  $('#read-word').classList.toggle('joined',whole);
  $$('[data-part]').forEach(e=>{e.classList.toggle('reading-focus',Number(e.dataset.part)===step.part);e.classList.toggle('whole-focus',whole)});
  const example=$('#reading-example');example.hidden=!step.example;
  if(step.example&&state.level<2){
   example.innerHTML=exampleSegments(w.exampleWord,w.text).map(p=>`<span class="${p.focus?'example-focus':''}">${esc(prefs.lower?p.text:p.text.toUpperCase())}</span>`).join('');
  }else example.textContent=step.example?w.usage:'';
  const scene=$('.meaning-scene');if(scene){void scene.offsetWidth;scene.classList.toggle('is-active',!!step.example)}
  say(step.text,()=>{i++;delay(next,step.part>=0&&!step.example?50:150)},step.part>=0&&!step.example);
 }
 next();
}
function quizStage(){clearPending();state.phase='quiz';state.quizMistakes??=0;state.quizHelp??=false;const w=item();const options=[{icon:w.icon,meaning:w.meaning,right:true},...w.distractors.map(d=>({icon:d[0],meaning:d[1],right:false}))];const rotate=(state.item+state.level)%3;const ordered=options.slice(rotate).concat(options.slice(0,rotate));activity.innerHTML=`<div class="success"><span class="lesson-tag"></span><p class="prompt" aria-label="Elige el dibujo">👇</p><div class="read-word">${esc(w.text)}</div><div class="choices">${ordered.map((o,i)=>`<button class="choice" data-choice="${i}" aria-label="${esc(o.meaning)}">${o.icon}</button>`).join('')}</div><p class="instruction" id="quiz-feedback"></p><button class="quiet" id="quiz-hear">🔊</button></div>`;say('Lee lo que escribiste. ¿Qué dibujo va con estas palabras?');$('#quiz-hear').onclick=()=>{state.quizHelp=true;say(w.text)};$$('[data-choice]').forEach(b=>b.onclick=()=>{if(state.phase!=='quiz')return;if(ordered[Number(b.dataset.choice)].right){comprehension[state.quizHelp?'helped':'free']++;finishItem()}else{state.quizHelp=true;state.quizMistakes++;const explanation=state.quizMistakes===1?ADAPTIVE_AUDIO[8]:ADAPTIVE_AUDIO[9];$('#quiz-feedback').textContent='👀';if(state.quizMistakes>=2)$$('[data-choice]').forEach(c=>c.classList.toggle('guided-choice',ordered[Number(c.dataset.choice)].right));say(explanation,()=>{if(state.phase==='quiz'&&!modal.open)say(w.text)})}})}
function nextActivity(level,index,returnTo){
 if(returnTo)return {level:returnTo.level,index:returnTo.index};
 return nextRoundItem(journey,level,LEVELS.length);
}
function finishItem(){clearPending();state.phase='success';const w=item();if(!learned.includes(w.text))learned.push(w.text);const id=`${state.level}:${state.item}`;if(!completions.includes(id))completions.push(id);sessionCount++;if(!state.review){const ended=completeRoundItem(journey,state.level,state.item);if(ended)journey.current=Math.min(state.level+1,LEVELS.length-1)}persist();collection();celebrate()}
function celebrate(){
 clearPending();mascotMood('happy');state.phase='success';keyboard.hidden=true;
 const next=nextActivity(state.level,state.item,state.returnTo);
 const newLevel=next&&next.level!==state.level;
 activity.innerHTML=`<div class="success"><div class="success-star">${newLevel?'🏅':'🌟'}</div><h2 aria-label="${newLevel?'Siguiente nivel':'Muy bien'}">${newLevel?'🚀 '+(next.level+1):'🙌'}</h2><div class="read-word">${esc(item().text)}</div></div>`;
 delay(()=>{
  if(state.phase!=='success'||modal.open)return;
  if(!next){
   activity.innerHTML='<div class="success"><div class="success-star">🏆</div><h2 aria-label="Lo lograste">🌟</h2><button class="primary" id="again" aria-label="Elegir otra aventura">🗺</button></div>';
   state.phase='complete';$('#again').onclick=showLevels;return;
  }
  startLevel(next.level,next.index);
 },350);
}
function pause(){if(state.phase==='paused')return;resumePhase=state.phase;clearPending();state.phase='paused';keyboard.hidden=true;activity.innerHTML='<div class="paused"><div class="success-star">☀</div><h2 aria-label="Pausa">Ⅱ</h2><button class="primary" id="resume" aria-label="Seguir jugando">▶</button></div>';$('#resume').onclick=resume}
function resume(){if(resumePhase==='typing'){state.phase='typing';state.lockedUntil=performance.now()+650;renderTyping();promptLetter()}else if(resumePhase==='reading'){state.phase='reading';readStage()}else if(resumePhase==='matching'){remedialStage()}else if(resumePhase==='discovery'){discoveryStage()}else if(resumePhase==='quiz'){quizStage()}else if(resumePhase==='success'){celebrate()}else showLevels()}
window.addEventListener('blur',()=>held.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden){held.clear();cancelSpeech();if(!modal.open&&['typing','matching','reading','quiz','success','discovery'].includes(state.phase))pause()}});
function showLevels(){showModal('🗺',`<div class="level-grid">${LEVELS.map((l,i)=>`<button class="level" data-level="${i}" aria-label="${esc(l.title)}"><span class="level-icon">${l.icon}</span><span class="number">${i+1}</span><span class="count">${journey.medals.includes(i)?'🏅':`${journey.rounds[i]?.done.length||0}/5 ★`}</span></button>`).join('')}</div>`);$$('[data-level]').forEach(b=>b.onclick=()=>startLevel(Number(b.dataset.level)))}
function fillVoiceSelect(){const select=$('#voice-select');if(!select)return;select.innerHTML='<option value="">Lilo · español (automática)</option><option value="recorded">Lilo · voz incluida en español</option>'+voices.map(v=>`<option value="${esc(v.voiceURI)}">${esc(v.name)} · ${esc(v.lang)}${v.localService?' · local':''}</option>`).join('');select.value=prefs.voice;$('#voice-status').textContent=voices.length?`${voices.length} ${voices.length===1?'voz disponible':'voces disponibles'} en español. Las voces marcadas «local» se sintetizan en el dispositivo. Las sílabas usan siempre los audios españoles de Lilo.`:'Lilo usa los audios en español incluidos en el juego. No necesitas instalar una voz. Si añades voces españolas al equipo, aparecerán aquí.'}
function showFamilyContent(){showModal('Un espacio para acompañar',`<p>Sesiones cortas, ayuda cercana y libertad para repetir. No hace falta saber leer para empezar.</p><div class="stat-grid"><div class="stat"><strong>${learned.length}</strong>descubrimientos</div><div class="stat"><strong>${completions.length}</strong>retos diferentes</div><div class="stat"><strong>${sessionCount}</strong>retos ahora*</div></div><p class="session-info">* En esta sesión. Las cifras describen actividad, no certifican dominio lector.</p><h3>Sonido</h3><label class="field">Sonidos de juego<input id="sounds" type="checkbox" ${prefs.sounds?'checked':''}></label><label class="field">Música infantil de fondo<input id="music" type="checkbox" ${prefs.music?'checked':''}></label><p class="session-info">La melodía cambia según el juego y baja mientras habla Lilo. Se detiene en las pausas y durante la celebración.</p><details><summary>Créditos de la música</summary><p>Música de Kevin MacLeod (<a href="https://incompetech.com/" target="_blank" rel="noopener">incompetech.com</a>), utilizada bajo <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">Creative Commons Atribución 4.0</a>.</p><ul>${Object.values(MUSIC_TRACKS).map(t=>`<li><a href="${t.source}" target="_blank" rel="noopener">${t.title}</a> — Kevin MacLeod.</li>`).join('')}</ul><p>Archivos originales sin modificar; volumen adaptado durante la reproducción.</p></details><h3>Voz de Lilo</h3><label class="field">Voz en español<select id="voice-select"></select></label><p class="voice-status" id="voice-status"></p><button class="secondary" id="voice-test">◖)) Probar voz</button><button class="quiet" id="voice-refresh">Buscar voces</button><label class="field">Velocidad de voz<select id="rate"><option value="0.7">Más despacio</option><option value="0.82">Tranquila</option><option value="1">Normal</option></select></label><h3>Ayudas para aprender</h3><label class="field">Pistas en el teclado<select id="hints"><option value="auto">Graduales según el nivel</option><option value="always">Siempre visibles</option><option value="off">Sin pistas automáticas</option></select></label><label class="field">Mi teclado<select id="layout"><option value="es">Español QWERTY (con Ñ)</option><option value="us">QWERTY sin Ñ</option></select></label><label class="field">Palabras en minúsculas<input id="lower" type="checkbox" ${prefs.lower?'checked':''}></label><label class="field">Reducir animaciones<input id="motion" type="checkbox" ${prefs.motion?'checked':''}></label><label class="field">Guardar avances en este navegador<input id="save" type="checkbox" ${activeChildId()?'disabled':''} ${prefs.save?'checked':''}></label><p class="notice">${storageOk?(activeChildId()?'Los avances de este perfil se guardan en tu cuenta y en este equipo. Si borras los datos del navegador, vuelve a entrar con tu correo.':'Como invitado, los avances se guardan solo en este navegador. Si borras sus datos, se perderán.'):'El navegador no permite guardar los avances. Puedes jugar, pero no se conservarán al cerrar.'} Incluimos audios en español para todos los retos. También puedes elegir voces del equipo; algunas de esas voces usan conexión a internet.</p><h3>Palabras y letras descubiertas</h3><div class="word-list">${learned.length?learned.map(w=>`<span>${esc(w)}</span>`).join(''):'Todavía no hay descubrimientos. ¡La primera aventura te espera!'}</div>${memoryPanel()}<h3>Aventuras para explorar</h3><p>Hay 12 niveles. Además del teclado, pueden escuchar y elegir entre dos dibujos, unir sílabas o completar una letra escondida. El mapa permite escoger cualquier aventura. Cada nivel tiene cinco retos distintos y cinco estrellas de avance. Al completar la ronda, se gana una medalla y se pasa al siguiente nivel. El avance se guarda en este navegador si la opción de guardar está activada. Al volver a jugar un nivel, cambia la selección del vocabulario; no hay límite de tiempo ni penalizaciones.</p><h3>Cómo acompañar</h3><p>Pregunta qué representa el dibujo. Después de escribir, unan las sílabas y lean la palabra. Relaciónenla con algo de casa. Acepta que busque las teclas con uno o dos dedos: la velocidad y la técnica formal vendrán después.</p><p>Las teclas muestran mayúsculas, como un teclado físico. La opción de minúsculas ayuda a relacionarlas. La voz dice el nombre de la letra para localizarla y después lee sílabas y palabras; esos nombres no sustituyen la enseñanza explícita de los sonidos.</p><details><summary>Base educativa y alcance</summary><p>Esta es una primera plataforma de práctica, no un curso validado ni una evaluación del desarrollo. Las actividades se inspiran en reconocimiento de letras, conciencia silábica, decodificación y comprensión. Un adulto debe revisar la pronunciación de la voz elegida.</p><p class="source-links"><a href="https://ies.ed.gov/ncee/WWC/PracticeGuide/21/Published" target="_blank" rel="noopener">IES: fundamentos de lectura</a> · <a href="https://www.educarchile.cl/recursos-para-el-aula/actividad-de-aprendizaje-lectura-1deg-basico-0" target="_blank" rel="noopener">Educarchile: conciencia fonológica</a> · <a href="https://www.naeyc.org/resources/topics/technology-and-media/resources" target="_blank" rel="noopener">NAEYC: tecnología en la infancia</a></p></details><button class="quiet" id="reset">${activeChildId()?'Borrar avances de este perfil':'Borrar avances de este navegador'}</button>`);updateVoices();$('#rate').value=prefs.rate;$('#hints').value=prefs.hints;$('#layout').value=prefs.layout;$('#voice-select').onchange=e=>{prefs.voice=e.target.value;persist()};$('#voice-test').onclick=()=>{updateVoices();say('¡Hola! Soy Lilo. Vamos a escribir la palabra casa. Busca la letra ce. Casa. Ca. Sa.')};$('#voice-refresh').onclick=updateVoices;['rate','hints','layout','lower','motion','save','sounds','music'].forEach(id=>$('#'+id).onchange=e=>{prefs[id]=e.target.type==='checkbox'?e.target.checked:id==='rate'?Number(e.target.value):e.target.value;document.body.classList.toggle('reduced',prefs.motion);persist();music.sync();if(state.phase==='typing'){if(id==='hints'){const used=state.usedHelp;resetCue();state.usedHelp=used||state.usedHelp;}renderSlots();renderKeyboard()}});$('#reset').onclick=()=>{showModal('¿Borrar los avances?', '<p>Se borrarán las palabras, los retos y el registro de ayudas guardados en este navegador. Las preferencias se conservarán.</p><button class="primary" id="confirm-reset">Sí, borrar avances</button><button class="secondary" id="cancel-reset">Conservarlos</button>');$('#confirm-reset').onclick=()=>{learned=[];completions=[];memory={};recent={};decks={};journey=cleanJourney(null,LEVELS);comprehension={free:0,helped:0};sessionCount=0;persist();resetGame(progressSnapshot());showFamily()};$('#cancel-reset').onclick=showFamily}}
function showFamily(){accounts.family(showFamilyContent)}
accounts.bindFamilyContent(showFamilyContent);$('#help').onclick=()=>showModal('❔','<div class="simple-help" aria-label="Escucha, busca la letra y lee con Lilo"><p>👂 → ⌨ → 📖</p></div>');
$('#repeat').onclick=()=>{if(state.phase==='typing')say(promptText());else if(state.phase==='matching')say(ADAPTIVE_AUDIO[4]);else if(state.phase==='discovery')say(gamePrompt(item(),LEVELS[state.level].mode,state.part,true));else if(state.phase==='reading')readTogether();else if(state.phase==='success')celebrate();else if(state.phase==='quiz')say('Lee lo que escribiste. ¿Qué dibujo va con estas palabras?');else if(state.phase==='welcome')say('¡Hola! Soy Lilo. Vamos a jugar con letras y palabras.');else say(currentSpeech||'Cada letra es un nuevo descubrimiento.')};
const firstLevel=journey.current,firstRound=journey.rounds[firstLevel];
const firstIndex=firstRound?.deck.find(i=>!firstRound.done.includes(i))??makeDeck(firstLevel,completions,recent[firstLevel])[0];
const firstWord=LEVELS[firstLevel].items[firstIndex];
$('.word-picture').textContent=firstWord.icon;$('.word-picture').setAttribute('aria-label',firstWord.meaning);$('.preview-letters').innerHTML=[...firstWord.text].map(c=>`<span>${esc(displayChar(c))}</span>`).join('');
$('#start').onclick=()=>{updateVoices();startLevel(journey.current)};$('#map-nav').onclick=showLevels;$('#explore').onclick=showLevels;$('#family-nav').onclick=showFamily;$('#account-nav').onclick=accounts.account;$('#play-nav').onclick=()=>{if(modal.open)closeModal();if(state.phase==='paused')resume()};$('.brand').onclick=e=>{e.preventDefault();if(modal.open)closeModal();if(state.phase==='paused')resume();else if(state.phase!=='welcome')showLevels()};
$('#mascot-wrap').innerHTML='<img src="mascot.png" alt="Lilo, un zorrito que saluda con su libro turquesa" width="216" height="216">';document.body.classList.toggle('reduced',prefs.motion);collection();updateVoices();window.speechSynthesis?.addEventListener('voiceschanged',updateVoices);
const context=document.modelContext;if(context?.registerTool){const lifecycle=new AbortController();for(const tool of [{name:'read_learning_state',description:'Read the current level and stage. Does not complete any learning activity.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){return {level:state.level+1,stage:state.phase,item:state.phase==='welcome'?null:item().text,completed:completions.length,roundCompleted:journey.rounds[state.level]?.done.length||0,roundTotal:5,levelsCompleted:journey.medals.length}}},{name:'start_learning_level',description:'Open a level for the child to practice. Does not submit answers or mark learning complete.',inputSchema:{type:'object',properties:{level:{type:'integer',minimum:1,maximum:LEVELS.length}},required:['level'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(!input||Object.keys(input).some(k=>k!=='level')||!Number.isInteger(input.level)||input.level<1||input.level>LEVELS.length)throw Error(`El nivel debe ser un entero de 1 a ${LEVELS.length}`);startLevel(input.level-1);return {level:input.level,stage:state.phase}}}]){try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{})}catch{}}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}


function memoryPanel(){const rows=Object.entries(memory).filter(([c])=>c!==' ').sort(([a],[b])=>a.localeCompare(b,'es'));return `<h3>Cómo está practicando</h3><p class="session-info">Registro local de ayudas, no diagnóstico. Los aciertos en teclado físico, en pantalla y en el ejercicio de reconocer formas se cuentan por separado. Tres aciertos sin pistas en el teclado físico permiten retirar la iluminación inicial de esa letra.</p>${rows.length?`<div class="learning-table"><table><thead><tr><th>Letra</th><th>Teclado sin iluminación</th><th>Teclado con ayuda</th><th>En pantalla</th><th>Ayudas adicionales</th><th>Reconocer forma</th></tr></thead><tbody>${rows.map(([c,r])=>`<tr><th>${c.toUpperCase()}</th><td>${r.physicalFree}</td><td>${r.physicalHelp}</td><td>${r.touchFree+r.touchHelp}</td><td>${r.help}</td><td>${r.match}</td></tr>`).join('')}</tbody></table></div>`:'<p>El registro aparecerá cuando empiece a practicar.</p>'}<p class="session-info">Relación palabra–imagen: ${comprehension.free} respuestas acertadas sin ayuda adicional y ${comprehension.helped} con apoyo. No equivale a medir lectura independiente.</p>`}








// Attempt entry audio immediately; trusted interactions retry if autoplay is blocked.
music.sync();effects.welcome();

function syncPauseControl(){const b=$("#pause");b.hidden=["welcome","complete"].includes(state.phase);b.textContent=state.phase==="paused"?"▶":"Ⅱ";b.setAttribute("aria-label",state.phase==="paused"?"Seguir jugando":"Pausar")}
$("#pause").onclick=()=>{if(state.phase==="paused")resume();else if(!["welcome","complete"].includes(state.phase))pause()};syncPauseControl();

function renderJourney(){
 const level=state.phase==='welcome'?journey.current:state.level,round=journey.rounds[level],done=round?.done.length||0;
 const box=$('#round-progress');
 box.setAttribute('aria-label',`Nivel ${level+1}: ${done} de 5 retos completados`);
 box.innerHTML=`<span class="round-level" aria-label="Nivel ${level+1}">${LEVELS[level].icon} ${level+1}</span><span class="round-stars" aria-hidden="true">${Array.from({length:5},(_,i)=>`<span class="round-star ${i<done?'earned':i===done?'current':''}">${i<done?'★':'☆'}</span>`).join('')}</span><span class="round-finish" aria-hidden="true">${done===5?'🏅':'🏁'}</span>`;
}
renderJourney();

$('#guest-account').onclick=accounts.account;
accounts.init();
