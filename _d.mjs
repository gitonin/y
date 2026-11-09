import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const S=process.argv[2];
const mk=(R,port)=>new Promise(res=>{const s=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});s.listen(port,()=>res(s))});
const a=await mk('public/arabica',8071),b2=await mk(S+'/sanshf',8070);
const br=await chromium.launch();
for(const [nom,port] of [['avec',8071],['sans',8070]]){
 const ctx=await br.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
 const p=await ctx.newPage();await p.goto(`http://127.0.0.1:${port}/?heure=13`,{waitUntil:'load'});await p.waitForTimeout(4000);
 for(const [i,yaw] of [[0,0.6],[1,2.2],[2,3.9]]){
  await p.evaluate(y=>{tgt.yaw=y;cam.yaw=y;tgt.pitch=.22;cam.pitch=.22},yaw);
  await p.waitForTimeout(300);
  fs.writeFileSync(`${S}/hf-${nom}-${i}.png`,await p.screenshot());}
 await ctx.close();}
await br.close();a.close();b2.close();console.log('rendu');
