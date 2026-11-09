import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const S=process.argv[2];const R='public/arabica';
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8072,r));const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
const p=await ctx.newPage();await p.goto('http://127.0.0.1:8072/?heure=13',{waitUntil:'load'});await p.waitForTimeout(4000);
const out=[];
for(let i=0;i<20;i++){
  const yaw=i/20*Math.PI*2;
  await p.evaluate(y=>{tgt.yaw=y;cam.yaw=y;tgt.pitch=.22;cam.pitch=.22},yaw);
  await p.waitForTimeout(220);
  fs.writeFileSync(`${S}/t-${String(i).padStart(2,'0')}.png`,await p.screenshot());
  out.push(i);
}
/* et en basculant le regard vers le haut, là où le ciel rencontre les crêtes */
for(let i=0;i<10;i++){
  const pit=-.15+i*.09;
  await p.evaluate(v=>{tgt.pitch=v;cam.pitch=v;tgt.yaw=1.1;cam.yaw=1.1},pit);
  await p.waitForTimeout(220);
  fs.writeFileSync(`${S}/p-${String(i).padStart(2,'0')}.png`,await p.screenshot());
}
console.log('rendu');
await ctx.close();await b.close();srv.close();
