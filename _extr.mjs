import {readFile} from 'node:fs/promises';
const atlas=await readFile('arabica/index.html','utf8');
/* Découpe une déclaration en comptant les accolades, hors chaînes. */
export function declaration(src,nom){
  const i=src.indexOf('const '+nom+'=');
  if(i<0)throw new Error('déclaration absente : '+nom);
  let k=src.indexOf('=',i)+1;
  const ouvre=src[k];if(ouvre!=='{'&&ouvre!=='[')throw new Error(nom+' n’est ni un objet ni un tableau');
  const ferme=ouvre==='{'?'}':']';
  let prof=0,q=null;
  for(;k<src.length;k++){const c=src[k];
    if(q){if(c==='\\'){k++;continue}if(c===q)q=null;continue}
    if(c==="'"||c==='"'||c==='`'){q=c;continue}
    if(c===ouvre)prof++;
    else if(c===ferme){prof--;if(!prof)return src.slice(i,k+1)}
  }
  throw new Error(nom+' : accolade non refermée');
}
const noms=['GROUPS','SRC','NODES','NODES_L','YLINKS','YL_L','EVENTS','EVENTS_L','REGIONS','REGIONS_L','LOTS','UI'];
const src=noms.map(n=>declaration(atlas,n)+';').join('\n')+'\nreturn {'+noms.join(',')+'};';
const D=new Function('RUST','VRGB',src)('#a84f26',[168,79,38]);
for(const n of noms){const v=D[n];console.log(n.padEnd(10),Array.isArray(v)?v.length+' entrées':Object.keys(v).length+' clés')}
console.log('\nNODE :',JSON.stringify(D.NODES[20]).slice(0,260));
console.log('NODES_L.en :',JSON.stringify(D.NODES_L.en[D.NODES[20].id]).slice(0,260));
console.log('EVENT :',JSON.stringify(D.EVENTS[2]));
console.log('EVENTS_L.zh[2] :',JSON.stringify(D.EVENTS_L.zh[2]));
console.log('REGION :',JSON.stringify(D.REGIONS[0]).slice(0,300));
console.log('REGIONS_L.en.puer :',JSON.stringify(D.REGIONS_L.en.puer).slice(0,300));
console.log('SRC :',JSON.stringify(Object.entries(D.SRC)[0]));
console.log('UI.fr clés :',Object.keys(D.UI.fr).length);
