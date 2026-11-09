import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const S=process.argv[2];const R='public/arabica';
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8073,r));const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
const p=await ctx.newPage();await p.goto('http://127.0.0.1:8073/?heure=13#survol',{waitUntil:'load'});await p.waitForTimeout(5000);
/* on tourne la caméra tout autour, en relevant la grisaille moyenne du haut
   de l'image — là où le ciel et les crêtes se rencontrent */
const mesures=[];
for(let i=0;i<24;i++){
  const yaw=i/24*Math.PI*2;
  await p.evaluate(y=>{tgt.yaw=y;cam.yaw=y},yaw);
  await p.waitForTimeout(260);
  const buf=await p.screenshot({clip:{x:0,y:0,width:800,height:500}});
  fs.writeFileSync(`${S}/rot-${String(i).padStart(2,'0')}.png`,buf);
  mesures.push(yaw);
}
console.log('24 vues rendues');
await ctx.close();await b.close();srv.close();
