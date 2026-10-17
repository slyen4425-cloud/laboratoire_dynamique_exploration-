// Real Chromium gate for the opt-in 2.5D canyon demo, without a separate engine.
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

const root = process.cwd();
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const bytes=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(bytes);
  }catch{res.writeHead(404).end('missing');}
});
const chromePath=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
  .find((bin)=>bin&&spawnSync('which',[bin]).status===0);
if(!chromePath)throw Error('Chromium unavailable');
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const profile=await mkdtemp(resolve(tmpdir(),'exploration-relief-smoke-'));
let chrome,socket;
const sleep=(ms)=>new Promise(ok=>setTimeout(ok,ms));
try{
  const url='http://127.0.0.1:'+server.address().port+
    '/builder.html?demo=relief-canyon-v1&rev=relief-canyon-pilot-v1';
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--remote-debugging-port=0','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((done,fail)=>{
    let stderr='';const timer=setTimeout(()=>fail(Error('CDP timeout '+stderr.slice(-400))),45000);
    chrome.stderr.on('data',b=>{stderr+=b.toString();const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
      if(m){clearTimeout(timer);done(Number(m[1]));}});
    chrome.once('error',fail);chrome.once('exit',code=>fail(Error('Chromium exited '+code)));
  });
  let target;
  for(let i=0;i<50;i++){
    const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    target=tabs.find(t=>t.type==='page'&&t.url.includes('/builder.html'));
    if(target)break;await sleep(150);
  }
  if(!target)throw Error('Builder tab unavailable');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
  let seq=0;const pending=new Map();
  socket.addEventListener('message',event=>{const packet=JSON.parse(event.data);const cb=pending.get(packet.id);
    if(cb){pending.delete(packet.id);cb(packet);}});
  const evaluate=(expression)=>new Promise(done=>{
    const id=++seq;pending.set(id,done);
    socket.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));
  });
  const run=async js=>{const data=await evaluate(js);
    if(data.error||data.result?.exceptionDetails)throw Error('Chromium eval '+JSON.stringify(data).slice(0,1000));
    return data.result?.result?.value;};
  let ready=false;
  for(let i=0;i<150;i++){
    ready=await run("document.querySelector('#builder-status')?.textContent?.includes('valide') && JSON.parse(document.querySelector('#json-preview')?.value||'{}').id === 'relief-canyon-pilot-v1'");
    if(ready)break;await sleep(100);
  }
  if(!ready) {
    const snapshot=await run(`(() => ({
      status:document.querySelector('#builder-status')?.textContent,
      jsonId: (() => {try{return JSON.parse(document.querySelector('#json-preview')?.value||'{}').id;}catch(e){return String(e)}})(),
      title:document.title,
      loadedScripts:[...document.scripts].map(s=>s.src),
      loadStatus:document.readyState,
      resources:performance.getEntriesByType('resource').filter(r=>r.name.includes('relief')||r.name.includes('builder')).map(r=>({name:r.name,status:r.responseStatus}))
    }))()`);
    throw Error('Opt-in pilot did not boot: '+JSON.stringify(snapshot));
  }
  const data=await run(`(async()=> {
    const json=JSON.parse(document.querySelector('#json-preview').value);
    const paths=[
      './assets/exploration/objects/relief/cliff_grassy_edge_01.svg',
      './assets/exploration/objects/relief/cliff_corner_01.svg',
      './assets/exploration/objects/relief/waterfall_blue_01.svg'
    ];
    const images=await Promise.all(paths.map(src=>new Promise(resolve=>{
      const image=new Image();image.onload=()=>resolve({src,width:image.naturalWidth,ok:true});
      image.onerror=()=>resolve({src,ok:false});image.src=src;
    })));
    const canvas=document.querySelector('#builder-preview');
    const area=json.areas[0];
    const banner=document.querySelector('#relief-pilot-notice');
    const layout=[...document.querySelectorAll('[data-tab]')].map(x=>x.dataset.tab);
    return {id:json.id,area:area.id,objectCount:area.objects.length,
      riverCount:area.surface.rivers.length,images,
      bannerVisible:!banner.hidden,classicLink:!!banner.querySelector('a[href*="builder.html?rev="]'),
      canvasSize:[canvas.width,canvas.height],tabs:layout};
  })()`);
  console.log('Relief pilot Chromium:',JSON.stringify(data));
  if(data.id!=='relief-canyon-pilot-v1'||data.objectCount<12||data.riverCount!==1||
     !data.bannerVisible||!data.classicLink||!data.images.every(img=>img.ok&&img.width>0)||
     data.canvasSize.some(size=>size<=0)||!data.tabs.includes('terrain')) {
    throw Error('Real Builder relief pilot smoke failed');
  }
  console.log('GREEN: same Builder, optional canyon WorldDocument, three SVG assets loaded, classic link present');
}finally{
  socket?.close();
  if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
    const exited=once(chrome,'exit');chrome.kill('SIGKILL');await exited;
  }
  server.close();
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
