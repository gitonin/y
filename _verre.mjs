import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const S=process.argv[2];const R='public/arabica';
const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}r.writeHead(200,{'content-type':'text/html'});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8069,r));const b=await chromium.launch();
const ctx=await b.newContext({viewport:{width:800,height:500},deviceScaleFactor:1});
const p=await ctx.newPage();await p.goto('http://127.0.0.1:8069/?heure=22#survol',{waitUntil:'load'});await p.waitForTimeout(5200);
const bb=await p.evaluate(()=>{const r=document.getElementById('terr').getBoundingClientRect();return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}});
console.log('cartouche',bb);
fs.writeFileSync(S+'/verre-nuit.png',await p.screenshot());
/* le verre agit-il ? on compare l'intérieur du cartouche avec et sans */
const avec=await p.screenshot({clip:{x:bb.x+10,y:bb.y+6,width:bb.w-20,height:14}});
await p.evaluate(()=>{const e=document.getElementById('terr');e.style.backdropFilter='none';e.style.webkitBackdropFilter='none'});
await p.waitForTimeout(250);
const sans=await p.screenshot({clip:{x:bb.x+10,y:bb.y+6,width:bb.w-20,height:14}});
fs.writeFileSync('/tmp/a.png',avec);fs.writeFileSync('/tmp/b.png',sans);
await ctx.close();await b.close();srv.close();
