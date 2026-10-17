// Browser gate: test real Builder indoor palette and pointer painting without a second runtime.
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

const root = process.cwd();
const types = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json',
  '.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(await readFile(path));
  }catch{res.writeHead(404).end('missing');}
});
const chromePath=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
  .find((bin)=>bin&&spawnSync('which',[bin]).status===0);
if(!chromePath)throw Error('Chromium unavailable');
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const profile=await mkdtemp(resolve(tmpdir(),'builder-interior-floor-'));
let chrome,socket;
const sleep=(ms)=>new Promise((ok)=>setTimeout(ok,ms));
try{
  const url='http://127.0.0.1:'+server.address().port+'/builder.html';
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--remote-debugging-port=0','--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((done,fail)=>{
    let stderr='';
    const timer=setTimeout(()=>fail(Error('Chromium CDP timeout: '+stderr.slice(-500))),45000);
    chrome.stderr.on('data',(b)=>{stderr+=b.toString();const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
      if(m){clearTimeout(timer);done(Number(m[1]));}});
    chrome.once('error',fail);
    chrome.once('exit',(code)=>fail(Error('Chrome quit '+code)));
  });
  let target;
  for(let i=0;i<50;i++){
    const pages=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    target=pages.find((x)=>x.type==='page'&&x.url.includes('/builder.html'));
    if(target)break;await sleep(150);
  }
  if(!target)throw Error('No builder page');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
  let seq=0;const pending=new Map();
  socket.addEventListener('message',(event)=>{const response=JSON.parse(event.data);const cb=pending.get(response.id);
    if(cb){pending.delete(response.id);cb(response);}});
  const evalJs=(expression)=>new Promise((done)=>{const id=++seq;pending.set(id,done);
    socket.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true,awaitPromise:true}}));});
  const run=async(js)=>{const r=await evalJs(js);if(r.error||r.result?.exceptionDetails)
    throw Error('Browser evaluation: '+JSON.stringify(r).slice(0,1600));
    return r.result?.result?.value;};
  let initialized=false;
  for(let i=0;i<120;i++){
    initialized=await run("document.querySelector('#builder-status')?.textContent?.includes('valide') && document.querySelector('#interior-floor-material')?.options.length >= 0");
    if(initialized)break;await sleep(100);
  }
  if(!initialized)throw Error('Builder initialization did not complete');
  const result=await run(`(() => {
    const select=document.querySelector('#area-select');
    const inside=[...select.options].find((o)=>o.value.includes('interior'));
    if(!inside) return {error:'missing interior area',values:[...select.options].map(o=>o.value)};
    select.value=inside.value;select.dispatchEvent(new Event('change',{bubbles:true}));
    const tab=document.querySelector('[data-tab="interior-floor"]');
    const outsideTab=document.querySelector('[data-tab="terrain"]');
    const shortcut=document.querySelector('#area-open-interior-floors');
    shortcut.click();
    const initial=[...document.querySelector('#interior-floor-material').options].map((o)=>o.value);
    const base=document.querySelector('#interior-floor-base');
    base.value='floor.wood.dark';base.dispatchEvent(new Event('change',{bubbles:true}));
    const brush=document.querySelector('#interior-floor-material');
    brush.value='floor.tile.light';brush.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#interior-floor-brush-size').value='64';
    document.querySelector('#interior-floor-brush-size').dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#interior-floor-paint-toggle').click();
    const canvas=document.querySelector('#builder-preview');
    const r=canvas.getBoundingClientRect();
    const opts=(x,y)=>({pointerId:26,pointerType:'mouse',bubbles:true,
      clientX:r.left+r.width*x,clientY:r.top+r.height*y});
    canvas.dispatchEvent(new PointerEvent('pointerdown',opts(0.5,0.5)));
    canvas.dispatchEvent(new PointerEvent('pointerup',opts(0.5,0.5)));
    const json=JSON.parse(document.querySelector('#json-preview')?.value ?? '{}');
    const area=json.areas?.find((a)=>a.id===inside.value);
    return {tabVisible:!tab.hidden,externalHidden:outsideTab.hidden,
      tabActive:tab.classList.contains('active'),options:initial,
      base:area?.surface?.baseMaterialId,
      zones:area?.surface?.zones?.map((z)=>({id:z.id,materialId:z.materialId,terrainFamilyId:z.terrainFamilyId,width:z.width})),
      baseFamily:area?.surface?.baseTerrainFamilyId, undoDisabled:document.querySelector('#interior-floor-undo').disabled,
      guide:document.querySelector('#interior-floor-paint-guide').textContent};
  })()`);
  console.log('Indoor floor Chromium:',JSON.stringify(result));
  const expected=['floor.wood.house','floor.wood.dark','floor.tile.light','floor.tile.sandstone','floor.concrete.gray'];
  if(result.error||!result.tabVisible||!result.externalHidden||!result.tabActive||
     !expected.every((id)=>result.options.includes(id))||result.base!=='floor.wood.dark'||
     !result.zones?.some((z)=>z.materialId==='floor.tile.light'&&z.width===64&&z.terrainFamilyId===result.baseFamily)||
     result.undoDisabled)
    throw Error('Real Builder indoor brush failed: '+JSON.stringify(result));
  console.log('GREEN Chromium: interior palette, background, pointer brush, unchanged traversal family and undo');
}finally{
  socket?.close();
  if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){const exited=once(chrome,'exit');chrome.kill('SIGKILL');await exited;}
  server.close();
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
