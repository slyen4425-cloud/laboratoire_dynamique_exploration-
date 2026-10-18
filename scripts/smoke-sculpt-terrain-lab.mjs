// Real Chromium gate for the isolated sculptable heightfield lab, without a separate engine.
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
const profile=await mkdtemp(resolve(tmpdir(),'exploration-sculpt-smoke-'));
let chrome,socket;
const sleep=(ms)=>new Promise(ok=>setTimeout(ok,ms));
try{
  const url='http://127.0.0.1:'+server.address().port+
    '/sculpt-lab.html?rev=sculpt-terrain-pilot-r1';
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
    target=tabs.find(t=>t.type==='page'&&t.url.includes('/sculpt-lab.html'));
    if(target)break;await sleep(150);
  }
  if(!target)throw Error('Sculpt lab tab unavailable');
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

  let boot=null;
  for(let i=0;i<120;i++){
    boot=await run("typeof window.__sculptLabProbe==='function' && document.querySelector('#sculpt-canvas')?.width>0 ? window.__sculptLabProbe():null");
    if(boot)break;await sleep(150);
  }
  if(!boot)throw Error('Sculpt lab did not boot: '+JSON.stringify(await run(`({title:document.title,resources:performance.getEntriesByType('resource').map(x=>x.name).slice(-10)})`)));
  if(boot.faceCount<20||boot.levelSpread<3||boot.width!==36||boot.height!==24)
    throw Error('Sculpt heightfield demo or generated cliffs absent: '+JSON.stringify(boot));
  const pixelInfo=await run(`(()=>{const canvas=document.querySelector('#sculpt-canvas');
     const p=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,canvas.width,canvas.height);
     let visible=0;for(let i=0;i<p.data.length;i+=12){if(p.data[i]>65&&p.data[i+1]>65)visible++;}
     return {visible,w:canvas.width,h:canvas.height};})()`);
  if(pixelInfo.visible<100)throw Error('Sculpt renderer did not paint real Canvas pixels: '+JSON.stringify(pixelInfo));
  await run("document.querySelector('#flat').click()");
  const flat=await run("window.__sculptLabProbe()");
  if(flat.faceCount!==0)throw Error('Flat map still has cliff faces: '+JSON.stringify(flat));
  await run("document.querySelector('[data-mode=raise]').click()");
  await run("document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'})");
  const center=await run(`(()=>{const c=document.querySelector('#sculpt-canvas'),r=c.getBoundingClientRect();
    const x=r.x+r.width/2,y=r.y+r.height/2;
    return {x,y,inside:document.elementFromPoint(x,y)?.id,
      viewport:[innerWidth,innerHeight],rect:{x:r.x,y:r.y,width:r.width,height:r.height}};})()`);
  if(center.inside!=='sculpt-canvas')throw Error('Canvas center is not clickable in Chromium: '+JSON.stringify(center));
  const send=(method,params)=>new Promise(done=>{
    const id=++seq;pending.set(id,done);socket.send(JSON.stringify({id,method,params}));
  });
  await run("window.__sculptInputEvents=[];document.querySelector('#sculpt-canvas').addEventListener('pointerdown',e=>window.__sculptInputEvents.push({type:e.type,x:e.clientX,y:e.clientY,button:e.button}));document.querySelector('#sculpt-canvas').addEventListener('pointerup',e=>window.__sculptInputEvents.push({type:e.type,x:e.clientX,y:e.clientY,button:e.button}));");
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:center.x,y:center.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:center.x,y:center.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:center.x,y:center.y,button:'left',clickCount:1});
  await sleep(200);
  const raised=await run("window.__sculptLabProbe()");
  if(raised.faceCount<1||raised.levelSpread<2)throw Error('Real mouse stroke did not sculpt the map: '+JSON.stringify({raised,center,events:await run('window.__sculptInputEvents')}));
  await run(`(async()=>{const s=document.querySelector('#material');s.value='ground.snow';
   s.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('#export').click();
   await new Promise(ok=>setTimeout(ok,120));return true;})()`);
  const after=await run(`(()=>({
    probe:window.__sculptLabProbe(),json:JSON.parse(document.querySelector('#json').value),
    scriptLoaded:performance.getEntriesByType('resource').some(x=>x.name.includes('sculpt-lab-main.js'))
  }))()`);
  if(after.probe.materialId!=='ground.snow'||after.json.levels.length!==36*24||!after.scriptLoaded)
    throw Error('Material Registry or JSON model export invalid: '+JSON.stringify(after).slice(0,600));
  await run("document.querySelector('#import').click()");
  const imported=await run("window.__sculptLabProbe()");
  if(imported.faceCount!==raised.faceCount)
    throw Error('Imported experimental heightmap did not preserve cliff geometry');

  // Real V11 UI: exactly level 3 with a single hard-edged tap, then repeated
  // touches MUST NOT stack another elevation. Test real DOM/control + mouse.
  await run("document.querySelector('#flat').click();document.querySelector('[data-mode=plateau]').click();document.querySelector('#target').value='3';document.querySelector('#target').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#edge').value='0';document.querySelector('#edge').dispatchEvent(new Event('input',{bubbles:true}));");
  async function tapMouse(){
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:center.x,y:center.y});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:center.x,y:center.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:center.x,y:center.y,button:'left',clickCount:1});
    await sleep(70);
  }
  await tapMouse();
  const exact=await run("window.__sculptLabProbe()");
  if(exact.highestLevel!==3||exact.target!==3||exact.edge!==0)
    throw Error('V11 first tap did not set an exact plateau at height 3: '+JSON.stringify(exact));
  await tapMouse();
  const repeat=await run("window.__sculptLabProbe()");
  if(repeat.highestLevel!==3)throw Error('V11 tapping again stacked a plateau: '+JSON.stringify(repeat));
  await run("document.querySelector('#target').value='6';document.querySelector('#target').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#edge').value='80';document.querySelector('#edge').dispatchEvent(new Event('input',{bubbles:true}));");
  await tapMouse();
  const feather=await run("window.__sculptLabProbe()");
  if(feather.highestLevel!==6||feather.levelSpread<3)
    throw Error('V11 feathered brush not producing level 6 and intermediate heights: '+JSON.stringify(feather));

  // Render smoothing toggles pixels only; the serialized heightfield stays byte identical.
  const smoothResult=await run(`(async()=> {
    const slider=document.querySelector('#visual-smooth');
    const snap=()=>{document.querySelector('#export').click();return document.querySelector('#json').value;};
    const heightBefore=snap();
    const pixels=()=>new Uint8ClampedArray(document.querySelector('#sculpt-canvas')
      .getContext('2d',{willReadFrequently:true}).getImageData(0,0,
      document.querySelector('#sculpt-canvas').width,
      document.querySelector('#sculpt-canvas').height).data);
    const redraw=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    slider.value='0';slider.dispatchEvent(new Event('input',{bubbles:true}));await redraw();
    const hard=pixels();
    slider.value='100';slider.dispatchEvent(new Event('input',{bubbles:true}));await redraw();
    const curved=pixels();
    let changed=0;for(let i=0;i<hard.length;i+=4){
      if(hard[i]!==curved[i]||hard[i+1]!==curved[i+1]||hard[i+2]!==curved[i+2])changed++;
    }
    return {changed,sameHeights:heightBefore===snap()};
  })()`);
  if(!smoothResult.sameHeights||smoothResult.changed<10)
    throw Error('V11 visual rounding fails to alter only pixels: '+JSON.stringify(smoothResult));

  // Genuine CDP touch events (not a synthetic PointerEvent) after scrolling
  // the expanded mobile-friendly toolbar out of the way.
  await run("document.querySelector('#flat').click();document.querySelector('#target').value='3';document.querySelector('#target').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('#edge').value='0';document.querySelector('#edge').dispatchEvent(new Event('input',{bubbles:true}));");
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:center.x,y:center.y}]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(110);
  const touch=await run("window.__sculptLabProbe()");
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  if(touch.highestLevel!==3||touch.levelSpread<2)
    throw Error('V11 actual CDP touchscreen gesture did not sculpt level 3: '+JSON.stringify(touch));
  console.log('V11 exact plateau + smooth + mobile touch Chromium:',JSON.stringify({
    exactLevel:exact.highestLevel,repeatLevel:repeat.highestLevel,
    featheredLevel:feather.highestLevel,featheredSpread:feather.levelSpread,
    pixelsChangedByVisualSmoothing:smoothResult.changed,touchLevel:touch.highestLevel
  }));

  console.log('GREEN: sculpt lab Chromium',JSON.stringify({
    initialFaces:boot.faceCount,initialLevels:boot.levelSpread,canvas:pixelInfo,
    flatFaces:flat.faceCount,afterRealMouseStroke:raised.faceCount,
    material:after.probe.materialId,roundtripFaces:imported.faceCount
  }));
}finally{
  socket?.close();
  if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
    const exited=once(chrome,'exit');chrome.kill('SIGKILL');await exited;
  }
  server.close();
  await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
