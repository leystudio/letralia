export const ADAPTIVE_AUDIO = [
 'Vamos por partes. Mira la fila de arriba del teclado.',
 'Vamos por partes. Mira la fila del medio del teclado.',
 'Vamos por partes. Mira la fila de abajo del teclado.',
 'Mira la tecla que se ilumina. Búscala en tu teclado.',
 'Hagamos un juego pequeño. Elige la letra que es igual a la de arriba.',
 'Mira su forma con calma. Busca una letra igual.',
 '¡La encontraste! Ahora vuelve a buscarla en tu teclado.',
 'Vamos a practicar una palabra con una letra que ya conoces. Puedes pedir ayuda.',
 'Escuchemos la palabra una vez más. Después busca su dibujo.',
 'Vamos a unir la palabra con su dibujo. Mira el dibujo señalado.',
 '¡Buen trabajo! Hagamos una pausa. Podemos seguir después.'
];
export function cleanMemory(value){const result={};if(!value||typeof value!=='object')return result;for(const [letter,stats]of Object.entries(value)){if(!/^[a-zñ ]$/.test(letter)||!stats||typeof stats!=='object')continue;const entry={};for(const key of ['misses','help','physicalFree','physicalHelp','touchFree','touchHelp','match'])entry[key]=Number.isFinite(stats[key])?Math.max(0,Math.min(100000,Math.floor(stats[key]))):0;result[letter]=entry}return result}
export function record(memory,letter,event){if(!/^[a-zñ ]$/.test(letter))return;memory[letter]??={misses:0,help:0,physicalFree:0,physicalHelp:0,touchFree:0,touchHelp:0,match:0};if(event in memory[letter])memory[letter][event]++}
export function initialCue({level,preference,review,stats}){if(preference==='always')return 2;if(preference==='off'||review||level>=4||stats?.physicalFree>=3)return 0;return 2}
export function rowFor(letter){return ['qwertyuiop','asdfghjklñ','zxcvbnm'].findIndex(row=>row.includes(letter))}
export function matchingChoices(letter){const alternatives='aenmcsoptdñ'.split('').filter(x=>x!==letter);const rotate=letter.charCodeAt(0)%3;const choices=[letter,...alternatives.slice(0,2)];return choices.slice(rotate).concat(choices.slice(0,rotate))}
export function selectReview(levels,memory,current){const letters=[...new Set(current.text.replaceAll(' ',''))].filter(c=>memory[c]&&(memory[c].misses+memory[c].help>memory[c].physicalFree));letters.sort((a,b)=>(memory[b].misses+memory[b].help-memory[b].physicalFree)-(memory[a].misses+memory[a].help-memory[a].physicalFree));for(const letter of letters){for(let level=2;level<=3;level++){const index=levels[level].items.findIndex(w=>w.text!==current.text&&w.text.includes(letter)&&w.text.length<=current.text.length+1);if(index>=0)return {level,index,letter}}}return null}
