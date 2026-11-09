import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
import sharp from 'sharp';
const R='public/arabica';const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8067,r));const b=await chromium.launch();
const lin=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4};
const lum=c=>.2126*lin(c[0])+.7152*lin(c[1])+.0722*lin(c[2]);
const res={};
for(const h of [13,22,6,19]){
 const ctx=await b.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
 const p=await ctx.newPage();await p.goto(`http://127.0.0.1:8067/?heure=${h}#survol`,{waitUntil:'load'});await p.waitForTimeout(5200);
 for(const a of [0.62,0.52,0.44,0.36,0.28,0.95]){
  await p.evaluate(v=>{let st=document.getElementById('essai');if(!st){st=document.createElement('style');st.id='essai';document.head.appendChild(st)}
   st.textContent=`.peek,.story,.icb:not(.dark),.x,.sndbtn,.btn:not(.dark){background:rgba(var(--pap),${v})!important}`},a);
  await p.waitForTimeout(400);
  /* une bande du cartouche sans aucun texte : juste sous la bordure haute */
  const z=await p.evaluate(()=>{const e=document.getElementById('terr');const r=e.getBoundingClientRect();
    const t=document.getElementById('tkick').getBoundingClientRect();
    return {x:Math.round(r.x+2),y:Math.round(r.y+2),w:Math.round(r.width-4),h:Math.max(4,Math.round(t.y-r.y-6)),col:getComputedStyle(document.getElementById('ttext')).color}});
  const buf=await p.screenshot({clip:{x:z.x,y:z.y,width:z.w,height:z.h}});
  const raw=await sharp(buf).removeAlpha().raw().toBuffer();
  const fg=z.col.match(/\d+/g).map(Number);const L1=lum(fg);
  let pire=1e9,clair=0,sombre=255;
  for(let i=0;i<raw.length;i+=3){const L2=lum([raw[i],raw[i+1],raw[i+2]]);
   const k=(Math.max(L1,L2)+.05)/(Math.min(L1,L2)+.05);if(k<pire)pire=k;
   const g=(raw[i]+raw[i+1]+raw[i+2])/3;if(g>clair)clair=g;if(g<sombre)sombre=g}
  (res[a]=res[a]||[]).push([h,pire,clair-sombre]);
 }
 await ctx.close();}
for(const a of Object.keys(res).sort((x,y)=>y-x)){
 const pire=Math.min(...res[a].map(r=>r[1]));const texture=Math.max(...res[a].map(r=>r[2]));
 console.log(`alpha ${a}  contraste min ${pire.toFixed(1)}:1  ${pire>=7?'✓ AAA':pire>=4.5?'~ AA ':'✗    '}  paysage visible au travers : ${texture.toFixed(0)} niveaux`);
}
await b.close();srv.close();
