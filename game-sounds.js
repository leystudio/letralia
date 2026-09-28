// Original synthesized cues: no downloaded recording or extra license required.
export const GAME_NOTES={tap:[659.25],letter:[659.25,880],start:[523.25,659.25,1046.5],welcome:[523.25,783.99,1046.5],win:[523.25,659.25,783.99,1046.5]};
export function createGameSounds(read,makeContext){
 let context,revision=0,last=-Infinity,welcomed=false;
 function play(kind='tap'){
  const s=read();if(!s.enabled||s.hidden)return;
  const now=Date.now();if(now-last<90&&kind==='tap')return;
  last=now;const ticket=++revision;
  try{
   context??=makeContext();
   const emit=()=>{
    const current=read();
    if(ticket!==revision||Date.now()-now>600||!current.enabled||current.hidden||context.state!=='running')return;
    if(kind==='welcome'&&welcomed)return;welcomed=true;
    const notes=GAME_NOTES[kind]||GAME_NOTES.tap;
    notes.forEach((hz,i)=>{const o=context.createOscillator(),g=context.createGain(),t=context.currentTime+i*.07;o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(kind==='tap'?.035:.045,t+.012);g.gain.exponentialRampToValueAtTime(.001,t+.16);o.connect(g);g.connect(context.destination);o.start(t);o.stop(t+.18)});
   };
   if(context.state==='running')emit();else Promise.resolve(context.resume()).then(emit).catch(()=>{});
  }catch{}
 }
 return {play,welcome(){if(!welcomed)play('welcome')},stop(){revision++;context?.suspend().catch(()=>{})}};
}
