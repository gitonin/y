import {chromium} from 'playwright';import http from 'node:http';import fs from 'node:fs';import path from 'node:path';
const R='public/arabica';const srv=http.createServer((q,r)=>{let p=q.url.split('?')[0];if(p==='/')p='/index.html';if(p.endsWith('/'))p+='index.html';
 const f=path.join(R,p);if(!fs.existsSync(f)){r.writeHead(404);return r.end()}
 const t=f.endsWith('.png')?'image/png':'text/html';r.writeHead(200,{'content-type':t});r.end(fs.readFileSync(f))});
await new Promise(r=>srv.listen(8080,r));const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
/* 1. l'application démarre-t-elle encore, et le texte se cache-t-il ? */
for(const [l,u] of [['fr','/'],['en','/en/'],['zh','/zh/']]){
  const ctx=await b.newContext({viewport:{width:1200,height:800}});const p=await ctx.newPage();
  const err=[];p.on('pageerror',e=>err.push(''+e));
  await p.goto('http://127.0.0.1:8080'+u,{waitUntil:'load'});await p.waitForTimeout(3500);
  const o=await p.evaluate(()=>({lang:LANG,html:document.documentElement.lang,
    lecture:!!document.getElementById('lecture'),
    cachee:getComputedStyle(document.getElementById('lecture')).display,
    mots:document.getElementById('lecture').textContent.trim().split(/\s+/).length,
    titre:document.title,canon:document.querySelector('link[rel=canonical]').href,
    alt:[...document.querySelectorAll('link[rel=alternate]')].length}));
  console.log(l,JSON.stringify(o),'erreurs',err.length?err[0].slice(0,90):0);
  await ctx.close();
}
/* 2. l'image de partage */
{
  const ctx=await b.newContext({viewport:{width:1200,height:630},deviceScaleFactor:1});const p=await ctx.newPage();
  await p.goto('http://127.0.0.1:8080/?heure=9.2',{waitUntil:'load'});await p.waitForTimeout(4000);
  await p.evaluate(()=>{S.year=2026;syncTime();tgt.dist=7200;tgt.pitch=.2;tgt.yaw=1.15;tgt.ty=300;document.getElementById('hint').style.opacity=0});
  await p.waitForTimeout(4000);
  await p.screenshot({path:'public/og/arabica-og.png'});
  await ctx.close();
}
console.log('fini');
await b.close();srv.close();
