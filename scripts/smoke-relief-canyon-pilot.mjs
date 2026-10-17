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
      './assets/exploration/objects/relief/cliff_broken_ledge_02.svg',
      './assets/exploration/objects/relief/cliff_corner_01.svg',
      './assets/exploration/objects/relief/waterfall_blue_01.svg',
      './assets/exploration/materials/forest/water/water_canyon_turquoise_01.svg',
      './assets/exploration/materials/forest/transitions/water_canyon_turquoise_bank_01.svg'
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
      riverCount:area.surface.rivers.length,
      waterMaterial:area.surface.rivers[0]?.materialId,
      waterOverlayLoaded:performance.getEntriesByType('resource').some(r=>r.name.includes('relief-water-overlay.js')),
      images,
      bannerVisible:!banner.hidden,classicLink:!!banner.querySelector('a[href*="builder.html?rev="]'),
      canvasSize:[canvas.width,canvas.height],tabs:layout};
  })()`);
  console.log('Relief pilot Chromium:',JSON.stringify(data));
  if(data.id!=='relief-canyon-pilot-v1'||data.objectCount<12||data.riverCount!==1||
     data.waterMaterial!=='water.canyon_turquoise'||!data.waterOverlayLoaded||
     !data.bannerVisible||!data.classicLink||!data.images.every(img=>img.ok&&img.width>0)||
     data.canvasSize.some(size=>size<=0)||!data.tabs.includes('terrain')) {
    throw Error('Real Builder relief pilot smoke failed');
  }

  // Real Chromium Canvas: check gentle world-anchored shimmer changes its
  // actual pixels with time while using one already-loaded WorldArea geometry.
  const waterMotion=await run(`(async()=>{
    const {drawReliefRiverGlints, drawReliefRiverBankFoam} =
      await import('./src/render/relief-water-overlay.js?smoke=organic-reflections-v6');
    const area=JSON.parse(document.querySelector('#json-preview').value).areas[0];
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

  // Real Builder document + Browser Canvas pixel gate for generic water/object contact.
  const contactGate = await run(`(async()=> {
    const source=JSON.parse(document.querySelector('#json-preview').value);
    const area=source.areas[0];
    const {planObjectShoreContacts}=await import('./src/render/object-shore-contact.js?smoke=v7');
    const {createWorldObjectRenderer}=await import('./src/render/world-object-renderer.js?smoke=v7');
    const {resolveWorldObjectPlacement}=await import('./src/world/world-object-placement-model.js?smoke=v7');
    const {materialPackV1}=await import('./src/materials/material-pack-v1.js?smoke=v7');
    const {createMaterialRegistry}=await import('./src/materials/material-registry.js?smoke=v7');
    const registry=createMaterialRegistry(materialPackV1);
    const placement=area.objects.find(p=>p.id==='upper-cliff-left');
    const object=resolveWorldObjectPlacement(placement);
    const contact=planObjectShoreContacts({object,surface:area.surface,materialRegistry:registry});
    const asset=new Image();
    const ready=new Promise((resolve,reject)=>{asset.onload=resolve;asset.onerror=reject;});
    asset.src='./assets/exploration/objects/relief/cliff_grassy_edge_01.svg';
    await ready;
    const renderer=createWorldObjectRenderer({
      imageLoader:{get:()=>asset},
      resolveVisualAsset:()=>({render:{widthScale:1,heightScale:1}})
    });
    const render=(withWater)=>{
      const canvas=document.createElement('canvas');canvas.width=900;canvas.height=550;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      renderer.draw(ctx,{
        camera:{x:120,y:390},viewport:{width:900,height:550},
        objects:[placement],
        surface:withWater?area.surface:{...area.surface,rivers:[]},
        materialRegistry:registry
      });
      return ctx.getImageData(0,0,900,550).data;
    };
    const before=render(false),after=render(true);
    let tinted=0;
    for(let i=0;i<before.length;i+=4){
      // Bluer and less brown pixels on an already opaque cliff require a
      // translucent water wash, not just the prior thin stroke overlay.
      if(before[i+3]>0 && after[i+3]>0 &&
         after[i+2]>before[i+2]+3 && after[i]<before[i]-3)tinted++;
    }
    let changed=0;
    for(let i=0;i<before.length;i+=4){
      if(before[i]!==after[i]||before[i+1]!==after[i+1]||
         before[i+2]!==after[i+2]||before[i+3]!==after[i+3])changed++;
    }
    return {contacts:contact.length,changed,tinted,areaId:area.id,
      imageWidth:asset.naturalWidth,objects:area.objects.length};
  })()`);
  console.log('V8 water-rock immersion Browser pixels:',JSON.stringify(contactGate));
  if(contactGate.contacts<1||contactGate.changed<200||contactGate.tinted<100||contactGate.imageWidth<100)
    throw Error('Builder WorldDocument to real Canvas water-rock contact failed');

  console.log('GREEN: same Builder, optional canyon WorldDocument, six SVG assets loaded, classic link present');
}finally{
  socket?.close();
  if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
    const exited=once(chrome,'exit');chrome.kill('SIGKILL');await exited;
  }
  server.close();
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
