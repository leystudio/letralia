// Visual support follows the existing spoken sequence; it never adds a task.
export function exampleSegments(word, target) {
 const plain=s=>s.normalize('NFD').replace(/\p{M}/gu,'').toLocaleLowerCase('es');
 const start=plain(word).indexOf(plain(target));
 return start<0?[{text:word,focus:false}]:[
  {text:word.slice(0,start),focus:false},
  {text:word.slice(start,start+target.length),focus:true},
  {text:word.slice(start+target.length),focus:false}
 ].filter(p=>p.text);
}

// Existing picture vocabulary, with one action illustrating each spoken example.
export const SCENES={
 casa:{motion:'enter',actor:'lilo',prop:'🏠'},
 mano:{motion:'wave',actor:'✋',prop:''},
 pato:{motion:'swim',actor:'🦆',prop:'🌊'},
 sol:{motion:'shine',actor:'☀️',prop:''},
 luna:{motion:'shine',actor:'🌙',prop:'✨'},
 cama:{motion:'rest',actor:'lilo',prop:'🛏️'},
 sopa:{motion:'stir',actor:'🥄',prop:'🥣'},
 gato:{motion:'play',actor:'🐈',prop:'🧶'},
 rana:{motion:'hop',actor:'🐸',prop:''},
 mapa:{motion:'locate',actor:'📍',prop:'🗺️'},
 piña:{motion:'fruit',actor:'🍍',prop:'🧺'},
 uva:{motion:'fruit',actor:'🍇',prop:'🧺'},
 oso:{motion:'walk',actor:'🐻',prop:'🌳'},
 avión:{motion:'fly',actor:'✈️',prop:'☁️'},
 estrella:{motion:'shine',actor:'⭐',prop:''},
 isla:{motion:'island',actor:'🏝️',prop:'🌊'},
 lápiz:{motion:'draw',actor:'✏️',prop:'📄'},
 mesa:{motion:'place',actor:'🍽️',prop:''},
 mono:{motion:'climb',actor:'🐒',prop:'🌳'}
};

export function defaultScene(w){return {motion:'shine',actor:w.icon,prop:''}}
