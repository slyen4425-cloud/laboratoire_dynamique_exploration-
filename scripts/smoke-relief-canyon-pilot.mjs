// Browser regression for the original opt-in canyon WorldDocument.
// Canonical import via World Builder 2.5D, NEVER the retired 2D builder.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(bytes);
 }catch{
  if(!res.headersSent)res.writeHead(404).end('missing');
  else res.end();
 }
});
const browser=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(x=>x&&spawnSync('which',[x]).status===0);
if(!browser)throw Error('Chromium unavailable');
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
const profile=await mkdtemp(resolve(tmpdir(),'canyon-canonical-chromium-'));
let chrome,socket;
try{
 const url='http://127.0.0.1:'+server.address().port+'/world-assembler.html';
 chrome=spawn(browser,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--remote-debugging-port=0','--user-data-dir='+profile,url],
  {stdio:['ignore','ignore','pipe']});
 const port=await new Promise((ok,fail)=>{
  let stderr='';const watchdog=setTimeout(()=>fail(Error('Chrome debug timeout '+stderr.slice(-500))),45000);
  chrome.stderr.on('data',chunk=>{stderr+=String(chunk);
   const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
   if(m){clearTimeout(watchdog);ok(Number(m[1]));}
  });
  chrome.once('error',fail);chrome.once('exit',code=>fail(Error('Chromium exit '+code)));
 });
 let tab;
 for(let i=0;i<65;i++){
  const pages=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  tab=pages.find(x=>x.type==='page'&&x.url.includes('/world-assembler.html'));
  if(tab)break;await sleep(180);
 }
 if(!tab)throw Error('Canonical World Builder Chromium tab absent');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});
 });
 let seq=0;const pending=new Map();
 socket.addEventListener('message',e=>{const d=JSON.parse(e.data),f=pending.get(d.id);
  if(f){pending.delete(d.id);f(d);}
 });
 const run=expression=>new Promise((ok,fail)=>{
  const id=++seq;
  const watchdog=setTimeout(()=>{pending.delete(id);fail(Error('CDP Runtime timeout'));},30000);
  pending.set(id,reply=>{
   clearTimeout(watchdog);
   if(reply.error||reply.result?.exceptionDetails)
    fail(Error('Chrome eval '+JSON.stringify(reply).slice(0,1800)));
   else ok(reply.result?.result?.value);
  });
  socket.send(JSON.stringify({id,method:'Runtime.evaluate',
   params:{expression,returnByValue:true,awaitPromise:true}}));
 });
 async function until(expression,label){
  for(let i=0;i<100;i++){
   let value=null;try{value=await run(expression);}catch{}
   if(value)return value;
   await sleep(170);
  }
  throw Error('Timed out '+label);
 }
 await until("window.__worldAssemblerProbe?.()?.source==='WorldDocument'",'canonical World Builder');
 // Use the genuine authored JSON import UI. The original demo remains one
 // optional WorldDocument, not an alternate map editor or copied engine.
 const importResult=await run(`(async()=>{
  const {reliefCanyonPilotDocument}=await import('./src/world/relief-canyon-pilot-world.js');
  const input=document.querySelector('#import-world');
  const transfer=new DataTransfer();
  transfer.items.add(new File([JSON.stringify(reliefCanyonPilotDocument)],
   'relief-canyon-pilot-v1.world.json',{type:'application/json'}));
  input.files=transfer.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
  return {inputFound:!!input,sourceId:reliefCanyonPilotDocument.id};
 })()`);
 if(!importResult?.inputFound||importResult.sourceId!=='relief-canyon-pilot-v1')
  throw Error('Official import UI absent '+JSON.stringify(importResult));
 const doc=await until(`(()=>{
  const p=window.__worldAssemblerProbe?.();
  const data=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
  return p?.worldId==='relief-canyon-pilot-v1'&&data?.id===p.worldId
   ?{path:location.pathname,p,data}:null;
 })()`,'imported canyon WorldDocument');
 const area=doc.data.areas.find(a=>a.id===doc.p.initialAreaId);
 if(doc.path!=='/world-assembler.html'||!area||area.objects.length<12||
  area.surface?.rivers?.length!==1||
  area.surface.rivers[0].materialId!=='water.canyon_turquoise')
  throw Error('Canonical World Builder did not retain full canyon '+JSON.stringify(doc.p));
 const media=await run(`(async()=>{
  const paths=[
   './assets/exploration/objects/relief/cliff_grassy_edge_01.svg',
   './assets/exploration/objects/relief/cliff_broken_ledge_02.svg',
   './assets/exploration/objects/relief/cliff_corner_01.svg',
   './assets/exploration/objects/relief/waterfall_blue_01.svg',
   './assets/exploration/materials/forest/water/water_canyon_turquoise_01.svg',
   './assets/exploration/materials/forest/transitions/water_canyon_turquoise_bank_01.svg'
  ];
  return await Promise.all(paths.map(src=>new Promise(resolve=>{
   const img=new Image();
   img.onload=()=>resolve({src,ok:true,width:img.naturalWidth});
   img.onerror=()=>resolve({src,ok:false,width:0});
   img.src=src;
  })));
 })()`);
 if(media.length!==6||media.some(x=>!x.ok||x.width<=0))
  throw Error('Original official canyon SVG visual missing '+JSON.stringify(media));
  const waterMotion=await run(`(async()=>{
    const {drawReliefRiverGlints, drawReliefRiverBankFoam} =
      await import('./src/render/relief-water-overlay.js?smoke=organic-reflections-v6');
    const area=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')).areas[0];
    function renderWater(seconds){
      const probe=document.createElement('canvas');
      probe.width=850;probe.height=330;
      const context=probe.getContext('2d',{willReadFrequently:true});
      context.fillStyle='#209bb9';
      context.fillRect(0,0,850,330);
      const view={area,camera:{x:280,y:690},viewport:{width:850,height:330},timeSeconds:seconds};
      const glints=drawReliefRiverGlints(context,view);
      const foam=drawReliefRiverBankFoam(context,view);
      return {pixels:context.getImageData(0,0,850,330).data,glints,foam};
    }
    const first=renderWater(0),next=renderWater(9);
    let changed=0;
    for(let i=0;i<first.pixels.length;i+=16){
      if(first.pixels[i]!==next.pixels[i]||
         first.pixels[i+1]!==next.pixels[i+1]||
         first.pixels[i+2]!==next.pixels[i+2])changed++;
    }
    return {changed,glints:first.glints,foam:first.foam,riverCount:area.surface.rivers.length};
  })()`);
  console.log('Relief water shimmer Chromium:',JSON.stringify(waterMotion));
  if(waterMotion.riverCount!==1 || waterMotion.glints<2 ||
     waterMotion.foam<2 || waterMotion.changed<40)
    throw Error('Real Canvas water reflections static, absent or not flowing');

 console.log('GREEN real Chromium canonical canyon import: full WorldArea + 6 source SVG + animated water pixels; old 2D Builder never opened');
}finally{
 try{socket?.close();}catch{}
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const exited=once(chrome,'exit');chrome.kill('SIGKILL');await exited;
 }
 server.close();
 await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:150});
}
