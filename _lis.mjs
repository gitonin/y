import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const R='public/arabica';const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8074,r));
const b=await chromium.launch();
/* Contraste réel : on compose la couleur du texte sur ce qui est derrière
   lui, en remontant les fonds jusqu'à trouver un fond opaque. */
const sonde=()=>{
  const lum=(c)=>{const f=c.map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)});return .2126*f[0]+.7152*f[1]+.0722*f[2]};
  const par=(s)=>{const m=s.match(/rgba?\(([^)]+)\)/);if(!m)return null;const v=m[1].split(',').map(x=>parseFloat(x));return {c:[v[0],v[1],v[2]],a:v.length>3?v[3]:1}};
  const fond=(el)=>{let e=el,acc=null;
    while(e){const bg=par(getComputedStyle(e).backgroundColor);
      if(bg&&bg.a>0){acc=acc?acc.map((v,i)=>v*(1)+0):null;
        if(!acc)acc=bg.a>=1?bg.c:null;
        if(bg.a>=1)return bg.c}
      e=e.parentElement}
    return [239,235,226]};
  const res=[];
  for(const el of document.querySelectorAll('.btn,.icb,.menubtn,.playbtn,.back,.x,.sndbtn,.vrow,.chip,.mnav button,.filters button,.langs button')){
    if(!el.checkVisibility||!el.checkVisibility({opacityProperty:true,visibilityProperty:true}))continue;
    const cs=getComputedStyle(el);const fg=par(cs.color);if(!fg)continue;
    /* la couche propre du bouton, posée sur le fond de son parent */
    const own=par(cs.backgroundColor)||{c:[0,0,0],a:0};
    const base=fond(el.parentElement);
    const mix=own.c.map((v,i)=>v*own.a+base[i]*(1-own.a));
    const L1=lum(fg.c),L2=lum(mix);
    const ratio=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);
    res.push({id:el.id||String(el.className).split(' ').slice(0,2).join('.'),txt:(el.textContent||'').trim().slice(0,18),ratio:+ratio.toFixed(2)});
  }
  return res;
};
const pages=[['arbre',null],['varietes','varietes'],['yunnan','yunnan'],['terroirs','terroirs'],['sources','sources'],['fiche',null]];
let pires=[];
for(const h of [13,22,6]){
 for(const [nom,pg] of pages){
  const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const p=await ctx.newPage();await p.goto(`http://127.0.0.1:8074/?heure=${h}`,{waitUntil:'load'});await p.waitForTimeout(2600);
  if(pg)await p.evaluate(k=>openPage(k),pg); else if(nom==='fiche')await p.evaluate(()=>openFiche(M.catimor));
  await p.waitForTimeout(800);
  const r=await p.evaluate(sonde);
  const mauvais=r.filter(x=>x.ratio<4.5);
  if(mauvais.length)mauvais.forEach(x=>pires.push(`${h}h · ${nom} · ${x.id} « ${x.txt} » = ${x.ratio}:1`));
  await ctx.close();
 }}
console.log(pires.length?pires.join('\n'):'tous les boutons dépassent 4,5:1 de contraste, à 6 h, 13 h et 22 h');
await b.close();srv.close();
