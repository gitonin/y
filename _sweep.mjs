import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const R='public/arabica';const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8068,r));const b=await chromium.launch();
/* Contraste réel : on lit la couleur du texte, puis la couleur rendue juste
   à côté du texte dans le cartouche — donc le paysage déjà composé. */
const mesure=async(p,alpha)=>{
  await p.evaluate(a=>{let st=document.getElementById('essai');if(!st){st=document.createElement('style');st.id='essai';document.head.appendChild(st)}
    st.textContent=`.peek,.story,.icb:not(.dark),.x,.sndbtn,.btn:not(.dark){background:rgba(var(--pap),${a})!important}`},alpha);
  await p.waitForTimeout(350);
  const b2=await p.evaluate(()=>{const e=document.getElementById('ttext');const r=e.getBoundingClientRect();
    return {x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),col:getComputedStyle(e).color}});
  const buf=await p.screenshot({clip:{x:b2.x,y:b2.y,width:b2.w,height:b2.h}});
  return {buf,col:b2.col,box:b2};
};
const out=[];
for(const h of [13,22,6]){
 const ctx=await b.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
 const p=await ctx.newPage();await p.goto(`http://127.0.0.1:8068/?heure=${h}#survol`,{waitUntil:'load'});await p.waitForTimeout(5200);
 for(const a of [0.62,0.52,0.44,0.36,0.28]){
  const {buf,col}=await mesure(p,a);
  fs.writeFileSync(`/tmp/c-${h}-${a}.png`,buf);
  out.push([h,a,col]);
 }
 await ctx.close();}
fs.writeFileSync('/tmp/sweep.json',JSON.stringify(out));
await b.close();srv.close();console.log('rendu');
