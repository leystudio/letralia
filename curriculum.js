const D={cama:['🛏️','cama'],lapiz:['✏️','lápiz'],mono:['🐒','mono'],casa:['🏠','casa'],sol:['☀️','sol'],luna:['🌙','luna'],mesa:['🪑','mesa y silla'],pato:['🦆','pato'],gato:['🐈','gato'],mano:['✋','mano'],sopa:['🥣','sopa'],oso:['🐻','oso'],rana:['🐸','rana'],mapa:['🗺️','mapa'],piña:['🍍','piña'],uva:['🍇','uva'],isla:['🏝️','isla'],estrella:['⭐','estrella'],avion:['✈️','avión']};
const USES={cama:'Duermo en mi cama.',lapiz:'Dibujo con un lápiz.',mono:'El mono trepa al árbol.',casa:'Vivo en una casa.',sol:'El sol nos da luz.',luna:'La luna brilla en el cielo.',mesa:'Pongo mi plato en la mesa.',pato:'El pato nada en el agua.',gato:'El gato juega con una pelota.',mano:'Saludo con la mano.',sopa:'Como sopa con una cuchara.',oso:'El oso camina por el bosque.',rana:'La rana salta.',mapa:'Busco un lugar en el mapa.',piña:'La piña es una fruta.',uva:'La uva es una fruta.',isla:'La isla está rodeada de agua.',estrella:'La estrella brilla en el cielo.',avion:'El avión vuela por el cielo.'};
D.iman=['🧲','imán'];USES.iman='El imán atrae algunos metales.';D.unicornio=['🦄','unicornio'];USES.unicornio='El unicornio es un animal de los cuentos.';D.elefante=['🐘','elefante'];USES.elefante='El elefante tiene una trompa larga.';
function w(text,parts,picture,others=['sol','pato']){const d=D[picture];return{text,parts,icon:d[0],meaning:d[1],exampleWord:picture==='lapiz'?'lápiz':picture==='avion'?'avión':picture==='iman'?'imán':picture,usage:USES[picture],distractors:others.map(k=>D[k])}}
export const LEVELS=[
{title:'El jardín de las vocales',icon:'🌼',description:'Escucha A, E, I, O, U y encuentra sus teclas.',items:[w('a',['a'],'avion'),w('e',['e'],'estrella'),w('i',['i'],'isla'),w('o',['o'],'oso'),w('u',['u'],'uva')]},
{title:'El puente de las sílabas',icon:'🌉',description:'Une dos letras: ma, pa, sa, la, me y mo.',items:[w('ma',['ma'],'mano'),w('pa',['pa'],'pato'),w('sa',['sa'],'casa'),w('la',['la'],'lapiz'),w('me',['me'],'mesa'),w('mo',['mo'],'mono')]},
{title:'Mi primera palabra',icon:'🏡',description:'Forma casa, sol y otras palabras con ayuda.',items:[w('casa',['ca','sa'],'casa'),w('sol',['sol'],'sol',['casa','pato']),w('luna',['lu','na'],'luna'),w('pato',['pa','to'],'pato',['casa','gato']),w('mano',['ma','no'],'mano'),w('oso',['o','so'],'oso'),w('cama',['ca','ma'],'cama')]},
{title:'Palabras que crecen',icon:'🌱',description:'Descubre nuevas letras y conoce la Ñ.',items:[w('sopa',['so','pa'],'sopa'),w('gato',['ga','to'],'gato'),w('rana',['ra','na'],'rana'),w('mapa',['ma','pa'],'mapa'),w('piña',['pi','ña'],'piña'),w('uva',['u','va'],'uva')]},
{title:'Ya puedo intentarlo',icon:'🚀',description:'Escribe sin la tecla iluminada. Pide una pista cuando quieras.',items:[w('casa',['ca','sa'],'casa'),w('luna',['lu','na'],'luna'),w('pato',['pa','to'],'pato',['casa','gato']),w('sopa',['so','pa'],'sopa'),w('rana',['ra','na'],'rana')]},
{title:'Pequeñas frases',icon:'📖',description:'Separa las palabras con un espacio y léelas juntas.',items:[w('la casa',['la','casa'],'casa'),w('el sol',['el','sol'],'sol',['casa','pato']),w('la luna',['la','luna'],'luna'),w('un gato',['un','gato'],'gato'),w('una piña',['una','piña'],'piña')]}
];

const EXTRA=[
 ['vaca','va ca','🐄','La vaca come hierba.'],
 ['perro','pe rro','🐕','El perro mueve la cola.'],
 ['conejo','co ne jo','🐇','El conejo salta.'],
 ['tortuga','tor tu ga','🐢','La tortuga camina despacio.'],
 ['pez','pez','🐟','El pez nada en el agua.'],
 ['abeja','a be ja','🐝','La abeja visita una flor.'],
 ['mariposa','ma ri po sa','🦋','La mariposa vuela.'],
 ['oveja','o ve ja','🐑','La oveja tiene lana.'],
 ['caballo','ca ba llo','🐎','El caballo corre.'],
 ['gallina','ga lli na','🐔','La gallina pone huevos.'],
 ['cerdo','cer do','🐖','El cerdo vive en la granja.'],
 ['caracol','ca ra col','🐌','El caracol lleva su concha.'],
 ['banana','ba na na','🍌','Pelo una banana para comer.'],
 ['manzana','man za na','🍎','Lavo la manzana antes de comer.'],
 ['pera','pe ra','🍐','La pera es una fruta.'],
 ['tomate','to ma te','🍅','Pongo tomate en la ensalada.'],
 ['pan','pan','🍞','Como pan en el desayuno.'],
 ['queso','que so','🧀','Pongo queso en mi pan.'],
 ['leche','le che','🥛','Bebo un vaso de leche.'],
 ['huevo','hue vo','🥚','La gallina pone un huevo.'],
 ['fresa','fre sa','🍓','La fresa es roja.'],
 ['helado','he la do','🍦','El helado está frío.'],
 ['pelota','pe lo ta','⚽','Juego con una pelota.'],
 ['libro','li bro','📚','Leemos un libro juntos.'],
 ['zapato','za pa to','👟','Me pongo un zapato en el pie.'],
 ['camisa','ca mi sa','👕','Me pongo una camisa.'],
 ['sombrero','som bre ro','👒','El sombrero me protege del sol.'],
 ['barco','bar co','⛵','El barco navega por el agua.'],
 ['tren','tren','🚂','El tren va por las vías.'],
 ['bici','bi ci','🚲','Uso un casco para ir en bici.'],
 ['flor','flor','🌸','La flor crece en el jardín.'],
 ['nube','nu be','☁️','La nube está en el cielo.'],
 ['hoja','ho ja','🍃','La hoja crece en la planta.'],
 ['regalo','re ga lo','🎁','Doy un regalo a mi amigo.'],
 ['oreja','o re ja','👂','Con la oreja escucho sonidos.'],
 ['ojo','o jo','👁️','Con el ojo veo los colores.']
];
for(const [word,,icon,usage] of EXTRA){D[word]=[icon,word];USES[word]=usage}
const extraWord=word=>{const entry=EXTRA.find(e=>e[0]===word);return w(word,entry[1].split(' '),word)};
const words=list=>list.split(' ').map(extraWord);
// Existing positions remain stable, so saved progress keeps its meaning.
LEVELS[0].items.push(w('a',['a'],'abeja'),w('e',['e'],'elefante'),w('i',['i'],'iman'),w('o',['o'],'oreja'),w('u',['u'],'unicornio'));
LEVELS[1].items.push(w('pe',['pe'],'pera'),w('va',['va'],'vaca'),w('to',['to'],'tomate'),w('nu',['nu'],'nube'),w('ba',['ba'],'banana'),w('co',['co'],'conejo'),w('ga',['ga'],'gallina'),w('bi',['bi'],'bici'));
LEVELS[2].items.push(...words('pan pez pera vaca nube ojo'));
LEVELS[3].items.push(...words('perro conejo pelota tomate banana zapato hoja'));
LEVELS[4].items.push(...words('pan pera vaca nube'));
LEVELS[5].items.push(...['el perro','una pera','la vaca','un pez','la nube'].map(text=>w(text,text.split(' '),text.split(' ').at(-1))));
LEVELS.push(
 {title:'Escucha y encuentra',icon:'🐾',mode:'picture',description:'Escucha una palabra y toca su dibujo entre dos opciones.',items:words('vaca perro conejo tortuga pez abeja mariposa oveja caballo gallina cerdo caracol')},
 {title:'Une las sílabas',icon:'🧩',mode:'syllables',description:'Escucha y toca la siguiente sílaba para construir una palabra.',items:words('pera vaca nube banana pelota tomate conejo zapato camisa regalo')},
 {title:'La letra escondida',icon:'🔎',mode:'missing',description:'Completa una letra con la ayuda de la voz y el teclado.',items:words('pera vaca nube pan pez hoja bici ojo')},
 {title:'Sabores y colores',icon:'🍓',mode:'typing',description:'Escribe palabras de alimentos con ayuda.',items:words('banana manzana pera tomate pan queso leche huevo fresa helado')},
 {title:'Paseo por la granja',icon:'🐄',mode:'typing',description:'Descubre los nombres de animales con el teclado.',items:words('vaca perro conejo tortuga oveja caballo gallina cerdo')},
 {title:'Mi mundo',icon:'⚽',mode:'typing',description:'Descubre objetos, juegos y naturaleza.',items:words('pelota libro zapato camisa sombrero barco tren bici flor nube hoja regalo oreja ojo')}
);
export const VOCABULARY=Object.entries(D).map(([key,[icon,meaning]])=>({key,icon,meaning}));
export function shuffled(values,random=Math.random){const out=[...values];for(let i=out.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[out[i],out[j]]=[out[j],out[i]]}return out}
export function makeDeck(level,completed=[],previous=-1,random=Math.random){
 const all=LEVELS[level].items.map((_,i)=>i),fresh=all.filter(i=>!completed.includes(`${level}:${i}`));
 const pool=fresh.length?fresh:all,deck=shuffled(pool,random);
 if(deck.length>1&&deck[0]===previous)[deck[0],deck[1]]=[deck[1],deck[0]];
 return deck;
}
export function gamePrompt(w,mode,part=0,brief=false){
 if(mode==='picture')return brief?w.text:`Escucha: ${w.text}. Toca su dibujo.`;
 if(mode==='syllables')return w.parts[part];
 return '';
}

export function normalize(value){return String(value).normalize('NFC').toLocaleLowerCase('es')}
export function canAccept({repeat,now,lockedUntil}){return !repeat&&now>=lockedUntil}
export function letterName(c){const names={a:'a',b:'be',c:'ce',d:'de',e:'e',f:'efe',g:'ge',h:'hache',i:'i',j:'jota',k:'ka',l:'ele',m:'eme',n:'ene',ñ:'eñe',o:'o',p:'pe',q:'cu',r:'erre',s:'ese',t:'te',u:'u',v:'uve',w:'doble u',x:'equis',y:'ye',z:'zeta',' ':'espacio'};return names[normalize(c)]||c}

export function letterExample(w,c){return c===' '?'Un espacio entre las palabras.':`${letterName(c)}, en ${w.text.includes(' ')?w.text:w.exampleWord}.`}
export function readingSequence(w,level){
 if(level===0)return [{text:`${letterName(w.text)}, de ${w.exampleWord}.`,part:0,example:true}];
 if(level===1)return [{text:`${w.text}, como en ${w.exampleWord}.`,part:0,example:true}];
 const sequence=w.parts.length>1?w.parts.map((text,part)=>({text,part})):[];
 sequence.push({text:w.text,part:-1},{text:w.usage,part:-1,example:true});return sequence;
}
