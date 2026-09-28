export const MUSIC_TRACKS={
 letters:{file:'music/carefree.mp3',title:'Carefree',source:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400037'},
 pictures:{file:'music/monkeys.mp3',title:'Monkeys Spinning Monkeys',source:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400011'},
 puzzles:{file:'music/life-of-riley.mp3',title:'Life of Riley',source:'https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1400054'}
};
export function musicTheme(level,mode){
 if(mode==='picture'||level===10)return 'pictures';
 if(mode==='syllables'||mode==='missing'||level===1)return 'puzzles';
 return 'letters';
}
// One player survives activity changes. Speech and celebration always take priority.
export function createBackgroundMusic(audio,read){
 let theme='',speaking=false,ramp=null,goal=0,pending=false,revision=0;
 audio.loop=true;audio.preload='none';audio.volume=0;
 function volume(target){
  if(target===goal)return;
  goal=target;clearInterval(ramp);ramp=null;
  if(target<audio.volume){audio.volume=target;return}
  ramp=setInterval(()=>{audio.volume=Math.min(goal,audio.volume+.008);if(audio.volume>=goal){clearInterval(ramp);ramp=null}},40);
 }
 function stop(){revision++;pending=false;clearInterval(ramp);ramp=null;goal=0;audio.volume=0;audio.pause()}
 function sync(){
  const s=read();
  if(!s.enabled||s.hidden||s.modal||!['welcome','typing','discovery','matching','reading','quiz'].includes(s.phase)){stop();return}
  const next=musicTheme(s.level,s.mode);
  if(next!==theme){stop();theme=next;audio.src=MUSIC_TRACKS[theme].file;audio.dataset.theme=theme}
  volume(speaking ? .012 : .10);
  if(audio.paused&&!pending){
   pending=true;const ticket=++revision;
   Promise.resolve(audio.play()).then(()=>{if(ticket===revision)pending=false}).catch(()=>{if(ticket===revision)pending=false});
  }
 }
 return {sync,duck(on){speaking=on;sync()},stop};
}
