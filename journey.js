// Short, finite rounds. The wider vocabulary stays available on later visits.
export function makeRound(items, candidates) {
 const seen=new Set(),deck=[];
 for(const index of candidates){const word=items[index]?.text;if(word&&!seen.has(word)){seen.add(word);deck.push(index)}if(deck.length===5)break}
 return {deck,done:[]};
}
export function cleanJourney(raw,levels){
 const result={rounds:{},medals:[],current:0};
 if(!raw||typeof raw!=='object')return result;
 result.medals=[...new Set((Array.isArray(raw.medals)?raw.medals:[]).filter(i=>Number.isInteger(i)&&levels[i]))];
 if(Number.isInteger(raw.current)&&levels[raw.current])result.current=raw.current;
 for(const [key,r] of Object.entries(raw.rounds||{})){
  const level=Number(key);if(!levels[level]||!Array.isArray(r?.deck)||r.deck.length!==5)continue;
  if(r.deck.some(i=>!Number.isInteger(i)||!levels[level].items[i])||new Set(r.deck.map(i=>levels[level].items[i].text)).size!==5)continue;
  result.rounds[level]={deck:[...r.deck],done:[...new Set((Array.isArray(r.done)?r.done:[]).filter(i=>r.deck.includes(i)))]};
 }
 return result;
}
export function completeRoundItem(journey,level,index){
 const round=journey.rounds[level];if(!round||!round.deck.includes(index))return false;
 if(!round.done.includes(index))round.done.push(index);
 const complete=round.done.length===round.deck.length;
 if(complete&&!journey.medals.includes(level))journey.medals.push(level);
 return complete;
}
export function nextRoundItem(journey,level,levelCount){
 const round=journey.rounds[level],pending=round?.deck.find(i=>!round.done.includes(i));
 if(pending!==undefined)return {level,index:pending};
 return level+1<levelCount?{level:level+1,index:null}:null;
}
