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
  // V12 real Chromium feature pixels, not just toggles or SVG flags.
  const overlayGate=await run(`(async()=>{
 await new Promise(ok=>setTimeout(ok,220));
 const pixels=()=>{const canvas=document.querySelector('#sculpt-canvas');
   return Uint8Array.from(canvas.getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,canvas.width,canvas.height).data);};
 const redraw=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
 const changed=(a,b)=>{let n=0;for(let i=0;i<a.length;i+=4)
   if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;return n;};
 const serialize=()=>{document.querySelector('#export').click();return document.querySelector('#json').value;};
 const saved=serialize(),initial=window.__sculptLabProbe(),on=pixels();
 const water=document.querySelector('#show-water'),road=document.querySelector('#show-road');
 water.checked=false;water.dispatchEvent(new Event('change',{bubbles:true}));
 await redraw();await redraw();const withoutWater=pixels();
 road.checked=false;road.dispatchEvent(new Event('change',{bubbles:true}));
 await redraw();await redraw();const withoutRoad=pixels();
 water.checked=true;water.dispatchEvent(new Event('change',{bubbles:true}));
 road.checked=true;road.dispatchEvent(new Event('change',{bubbles:true}));
 await redraw();await redraw();
 return {waterChanged:changed(on,withoutWater),roadChanged:changed(withoutWater,withoutRoad),
   unchanged:saved===serialize(),faceRuns:initial.faceRuns,faces:initial.faceCount,
   waterCells:initial.waterCells,roadCells:initial.roadCells};
})()`);
  if(overlayGate.waterChanged<25||overlayGate.roadChanged<25||
    overlayGate.waterCells<1||overlayGate.roadCells<1||
    overlayGate.faceRuns>=overlayGate.faces||!overlayGate.unchanged)
    throw Error('V12 water/road or continuous cliff foot: '+JSON.stringify(overlayGate));
  console.log('V12 water/road pixels:',JSON.stringify(overlayGate));
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
  await sleep(70);
  const brushPreview=await run("window.__sculptLabProbe()");
  if(brushPreview.previewCells<5)throw Error('V12 pointer preview absent: '+JSON.stringify(brushPreview));
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
  if(!smoothResult.sameHeights||smoothResult.changed>2)
    throw Error('V13 changing next-stroke rounding retroactively altered terrain: '+JSON.stringify(smoothResult));

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

  // V52: real sculpt canvas interaction paints ONLY cosmetic cliff contours.
  const v52Before=await run(`(()=>{
    document.querySelector('#flat').click();
    document.querySelector('[data-mode=cliff-round]').click();
    const smooth=document.querySelector('#visual-smooth');
    smooth.value='0';smooth.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'});
    document.querySelector('#export').click();
    return JSON.parse(document.querySelector('#json').value);
  })()`);
  await sleep(130);
  const v52Point=await run(`(()=>{
    const r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {x:r.x+r.width/2,y:r.y+r.height/2};
  })()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:v52Point.x,y:v52Point.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',
    x:v52Point.x,y:v52Point.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',
    x:v52Point.x,y:v52Point.y,button:'left',clickCount:1});
  await sleep(100);
  const v52After=await run(`(()=>{
    document.querySelector('#export').click();
    return JSON.parse(document.querySelector('#json').value);
  })()`);
  if(JSON.stringify(v52After.levels)!==JSON.stringify(v52Before.levels)||
     JSON.stringify(v52After.waterLevels)!==JSON.stringify(v52Before.waterLevels)||
     JSON.stringify(v52After.roundness)===JSON.stringify(v52Before.roundness))
    throw Error('V52 real cosmetic brush modified height/water or failed to paint contours');
  await run("document.querySelector('#undo').click()");
  const v52Undone=await run(`(()=>{
    document.querySelector('#export').click();
    return JSON.parse(document.querySelector('#json').value);
  })()`);
  if(JSON.stringify(v52Undone)!==JSON.stringify(v52Before))
    throw Error('V52 cosmetic cliff brush undo failed');
  const v52Edge=await run(`(async()=>{
    const mod=await import('./src/render/sculpt-height-renderer.js');
    const m=await import('./src/world/sculpt-height-model.js');
    const terrain=m.createSculptTerrain({width:8,height:8});
    const c=document.createElement('canvas');c.width=224;c.height=168;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    const outcome=mod.drawSculptTerrain(ctx,{terrain,material:{render:{baseColor:'#677955'}},
      rockPalette:'slate'});
    const at=(x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
    return {runs:outcome.outerCliffRuns,rockPixel:at(82,156),
      upperPixel:at(82,141)};
  })()`);
  if(v52Edge.runs!==1||
     v52Edge.rockPixel.join(',')===v52Edge.upperPixel.join(',')||
     v52Edge.rockPixel.join(',')==='103,121,85')
    throw Error('V52 outer south boundary not textured in real Chromium: '+JSON.stringify(v52Edge));
  console.log('V52 cosmetic contour brush/Undo + textured outer map rim Chromium:',
    JSON.stringify({brushOnlyRoundness:true,undo:true,rock:v52Edge}));
  // V53: truly continuous dry cliff ramp instead of saturated per-box corners.
  // Compare real Canvas pixels with canonical heights held strictly equal.
  const v53Curves=await run(`(async()=>{
    const mod=await import('./src/render/sculpt-height-renderer.js');
    const m=await import('./src/world/sculpt-height-model.js');
    const w=9,h=9,levels=Array(w*h).fill(2);
    for(const [c,v] of [[2,5],[3,4],[4,6],[5,5]])levels[4*w+c]=v;
    const original=m.createSculptTerrain({width:w,height:h,levels});
    const changed=m.applySculptStroke(original,{points:[{x:3.5,y:4.5}],
      radius:.5,rockRoundness:150,mode:'cliff-round'});
    const draw=t=>{
      const c=document.createElement('canvas');
      c.width=w*28;c.height=h*21+7*18;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      mod.drawSculptTerrain(ctx,{terrain:t,rockPalette:'warm',
        material:{render:{baseColor:'#528d42'}}});
      return ctx;
    };
    const baseline=draw(original),rounded=draw(changed);
    const before=baseline.getImageData(0,0,w*28,h*21).data;
    const after=rounded.getImageData(0,0,w*28,h*21).data;
    let cliffDiff=0,farDiff=0;
    for(let y=0;y<h*21;y++)for(let x=0;x<w*28;x++){
      const i=(y*w*28+x)*4;
      const different=before[i]!==after[i]||before[i+1]!==after[i+1]||
        before[i+2]!==after[i+2];
      if(different){
        if(x>=2*28&&x<5*28&&y<=100)cliffDiff++;
        if(x<28&&y<110)farDiff++;
      }
    }
    const preview=(name)=>document.querySelector(name)?.textContent??'';
    return {cliffDiff,farDiff,edited:m.serializeSculptTerrain(changed)!==
      m.serializeSculptTerrain(original),
      unchangedHeights:JSON.stringify(changed.levels)===JSON.stringify(original.levels),
      unchangedWater:JSON.stringify(changed.waterLevels)===JSON.stringify(original.waterLevels),
      untouchedPath:mod.sculptRoundedSouthColumns(original,4).length,
      joined:mod.sculptRoundedSouthColumns(changed,4),
      nativePreviewControl:!!document.querySelector('[data-mode=cliff-round]'),
      legacyFaceCount:m.sculptFaces(original).length===m.sculptFaces(changed).length};
  })()`);
  if(!v53Curves.edited||!v53Curves.unchangedHeights||!v53Curves.unchangedWater||
      v53Curves.untouchedPath!==0||v53Curves.joined.join(',')!=='2,3,4'||
      v53Curves.cliffDiff<45||v53Curves.farDiff!==0||
      !v53Curves.nativePreviewControl||!v53Curves.legacyFaceCount)
    throw Error('V53 continuous dry cliff contour pixels or guardrails failed: '+JSON.stringify(v53Curves));
  console.log('V53 real Chromium joined cliff, stable far pixels/height/water:',JSON.stringify(v53Curves));
  // V13: a water brush must edit the water volume without touching land and
  // Undo/Redo must exactly restore BOTH data fields, never a visual-only rollback.
  const waterSetup=await run(`(async()=>{
 const probe=()=>window.__sculptLabProbe();
 document.querySelector('#flat').click();
 document.querySelector('[data-mode=water-fill]').click();
 const target=document.querySelector('#water-target');
 target.value='5';target.dispatchEvent(new Event('input',{bubbles:true}));
 document.querySelector('#radius').value='2';
 document.querySelector('#radius').dispatchEvent(new Event('input',{bubbles:true}));
 document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'});
 return {before:probe(),modeActive:[...document.querySelectorAll('[data-mode].active')].map(x=>x.dataset.mode)};
})()`);
  if(waterSetup.before.wetCells!==0||!waterSetup.modeActive.includes('water-fill'))
    throw Error('V13 water tool failed to reset test: '+JSON.stringify(waterSetup));
  await sleep(180);
  const waterPoint=await run(`(()=>{const r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  const beforeWaterJSON=await run(`(()=>{document.querySelector('#export').click();
    return document.querySelector('#json').value;})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:waterPoint.x,y:waterPoint.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:waterPoint.x,y:waterPoint.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:waterPoint.x,y:waterPoint.y,button:'left',clickCount:1});
  await sleep(180);
  const afterWater=await run(`(()=>{document.querySelector('#export').click();return {
    probe:window.__sculptLabProbe(),json:document.querySelector('#json').value};})()`);
  if(afterWater.probe.wetCells<1||afterWater.probe.undoCount<1||
     afterWater.json===beforeWaterJSON)
    throw Error('V13 real mouse water stroke failed: '+JSON.stringify(afterWater.probe));
  await run("document.querySelector('#undo').click()");
  const waterUndo=await run(`(()=>{document.querySelector('#export').click();return {
    probe:window.__sculptLabProbe(),json:document.querySelector('#json').value};})()`);
  if(waterUndo.json!==beforeWaterJSON||waterUndo.probe.redoCount<1)
    throw Error('V13 undo did not restore exact water+land snapshot: '+JSON.stringify(waterUndo.probe));
  await run("document.querySelector('#redo').click()");
  const waterRedo=await run(`(()=>{document.querySelector('#export').click();return {
    probe:window.__sculptLabProbe(),json:document.querySelector('#json').value};})()`);
  if(waterRedo.json!==afterWater.json||waterRedo.probe.redoCount!==0)
    throw Error('V13 redo did not reconstruct exact water stroke: '+JSON.stringify(waterRedo.probe));
  // Fresh stroke after undo removes redo branch, including when changing rock profiles.
  await run("document.querySelector('#undo').click();document.querySelector('[data-mode=plateau]').click()");
  // V14 switches to the shorter Terre-only toolbar. Recalculate visible pointer
  // coordinates after the actual layout transition, not the old Water canvas Y.
  await run("document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'})");
  await sleep(160);
  const groundPoint=await run(`(()=>{const r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:groundPoint.x,y:groundPoint.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:groundPoint.x,y:groundPoint.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:groundPoint.x,y:groundPoint.y,button:'left',clickCount:1});
  await sleep(160);
  const divergent=await run('window.__sculptLabProbe()');
  if(divergent.redoCount!==0)throw Error('V13 new stroke failed to clear redo history');
  console.log('V13 water depth and exact undo/redo Chromium:',JSON.stringify({wet:afterWater.probe.wetCells,
    undoRestored:waterUndo.json===beforeWaterJSON,redoRestored:waterRedo.json===afterWater.json,
    redoCleared:divergent.redoCount===0}));

  // V14: changing editor material really hides unrelated controls, preserving
  // independent current tools and leaving the existing V13 water rendering alone.
  const switches=await run(`(()=>{
    const initial={groundHidden:document.querySelector('#ground-tools').hidden,
      waterHidden:document.querySelector('#water-tools').hidden};
    document.querySelector('#mode-water').click();
    const water={groundHidden:document.querySelector('#ground-tools').hidden,
      waterHidden:document.querySelector('#water-tools').hidden,
      selected:window.__sculptLabProbe().editorKind};
    document.querySelector('#mode-ground').click();
    const land={groundHidden:document.querySelector('#ground-tools').hidden,
      waterHidden:document.querySelector('#water-tools').hidden,
      selected:window.__sculptLabProbe().editorKind};
    return {initial,water,land};
  })()`);
  if(!switches.initial.waterHidden||switches.initial.groundHidden||
     !switches.water.groundHidden||switches.water.waterHidden||
     switches.water.selected!=='water'||switches.land.selected!=='ground'||
     switches.land.groundHidden||!switches.land.waterHidden)
     throw Error('V14 land/water editor switch does not isolate toolbars: '+JSON.stringify(switches));


  // V15 mobile: no scrolling is allowed to see the actual editing canvas.
  // Size shortcuts reflect a REAL 16-cell brush and switch cleanly with Water.
  await send('Emulation.setDeviceMetricsOverride',
    {width:390,height:844,deviceScaleFactor:2,mobile:true});
  const compact=await run(`(async()=>{
    window.scrollTo(0,0);
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const canvas=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const size=document.querySelector('#radius');
    size.value='15.5';size.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#radius-plus').click();
    const afterPlus=window.__sculptLabProbe().brushSize;
    document.querySelector('#radius-minus').click();
    const afterMinus=window.__sculptLabProbe().brushSize;
    document.querySelector('#quick-tool').value='plateau';
    document.querySelector('#quick-tool').dispatchEvent(new Event('change',{bubbles:true}));
    const tool=window.__sculptLabProbe().quickTool;
    document.querySelector('#mode-water').click();
    const waterOptions=[...document.querySelector('#quick-tool').options].map(o=>o.value);
    const waterTool=window.__sculptLabProbe().quickTool;
    document.querySelector('#mode-ground').click();
    const groundOptions=[...document.querySelector('#quick-tool').options].map(o=>o.value);
    const more=document.querySelector('#sculpt-settings');
    const hiddenByDefault=!more.open;
    return {width:innerWidth,height:innerHeight,canvasTop:canvas.top,canvasBottom:canvas.bottom,
      advancedClosed:hiddenByDefault,afterPlus,afterMinus,tool,waterTool,
      waterOptions,groundOptions,precisionActionsWithinCanvas:
        document.querySelector('.canvas-wrap').contains(document.querySelector('#precision-actions'))};
  })()`);
  if(compact.width!==390||compact.canvasTop<0||compact.canvasTop>compact.height*.73||
     compact.canvasBottom<compact.height*.58||!compact.advancedClosed||
     compact.afterPlus!==16||compact.afterMinus!==15.5||compact.tool!=='plateau'||
     !compact.waterOptions.every(x=>x.startsWith('water-'))||
     !compact.groundOptions.every(x=>!x.startsWith('water-'))||
     !compact.precisionActionsWithinCanvas)
    throw Error('V15 phone canvas-first ergonomics or brush-size shortcuts failed: '+JSON.stringify(compact));
  console.log('V15 mobile canvas visible without scroll, 16-cell brush and quick tool switch:',JSON.stringify(compact));
  // Phone viewport with ACTUAL CDP touch and deliberately staged painting:
  // precise radius 0.5 = one cell, finger release must NEVER edit before Apply.
  await send('Emulation.setDeviceMetricsOverride',
    {width:390,height:844,deviceScaleFactor:2,mobile:true});
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await run(`(()=>{
    document.querySelector('#mode-ground').click();
    document.querySelector('#flat').click();
    document.querySelector('[data-mode=plateau]').click();
    document.querySelector('#target').value='3';
    const radius=document.querySelector('#radius');radius.value='0.5';
    radius.dispatchEvent(new Event('input',{bubbles:true}));
    const edge=document.querySelector('#edge');edge.value='0';
    edge.dispatchEvent(new Event('input',{bubbles:true}));
    const precise=document.querySelector('#precision-mode');
    if(!precise.checked)precise.click();
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'});
  })()`);
  await sleep(230);
  const stagedBefore=await run(`(()=>{
    document.querySelector('#export').click();
    return {json:document.querySelector('#json').value,probe:window.__sculptLabProbe()};
  })()`);
  const thumb=await run(`(()=>{
    const b=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {x:b.left+b.width/2,y:b.top+b.height/2};
  })()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',
    touchPoints:[{x:thumb.x,y:thumb.y,id:1,radiusX:5,radiusY:5,force:1}]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(170);
  const stagedAim=await run(`(()=>{
    document.querySelector('#export').click();
    return {json:document.querySelector('#json').value,probe:window.__sculptLabProbe(),
      canApply:!document.querySelector('#apply-precision').disabled};
  })()`);
  if(stagedAim.json!==stagedBefore.json||!stagedAim.probe.precisionTarget||
     !stagedAim.canApply||stagedAim.probe.previewCells!==1)
    throw Error('V14 touch must aim exactly one cell without painting: '+JSON.stringify(stagedAim.probe));
  await run("document.querySelector('#nudge-right').click()");
  const nudged=await run(`(()=>{
    document.querySelector('#export').click();
    return {probe:window.__sculptLabProbe(),json:document.querySelector('#json').value};
  })()`);
  if(nudged.probe.precisionTarget.x!==Math.min(35,stagedAim.probe.precisionTarget.x+1)||
     nudged.json!==stagedBefore.json)
    throw Error('V14 nudge moved heights instead of just moving preview');
  await run("document.querySelector('#apply-precision').click()");
  const applied=await run(`(()=>{
    document.querySelector('#export').click();
    return {json:document.querySelector('#json').value,probe:window.__sculptLabProbe()};
  })()`);
  const initialLevels=JSON.parse(stagedBefore.json).levels;
  const finalLevels=JSON.parse(applied.json).levels;
  const changed=finalLevels.flatMap((n,i)=>n!==initialLevels[i]?[i]:[]);
  const cell=nudged.probe.precisionTarget;
  if(changed.length!==1||changed[0]!==cell.y*36+cell.x||
     finalLevels[changed[0]]!==3||applied.probe.undoCount<1)
    throw Error('V14 precise 0.5-cell stamp moved incorrect terrain: '+JSON.stringify({changed,cell}));
  await run("document.querySelector('#undo').click()");
  const exactUndo=await run(`(()=>{
    document.querySelector('#export').click();return document.querySelector('#json').value;
  })()`);
  await run("document.querySelector('#redo').click()");
  const exactRedo=await run(`(()=>{
    document.querySelector('#export').click();return document.querySelector('#json').value;
  })()`);
  if(exactUndo!==stagedBefore.json||exactRedo!==applied.json)
    throw Error('V14 precise edit must support exact water+ground undo/redo');

  console.log('V14 editor switch / phone precise aim+confirm Chromium:',JSON.stringify({
    tabs:switches,phoneWidth:390,aimNoMutation:stagedAim.json===stagedBefore.json,
    previewCells:stagedAim.probe.previewCells,nudge:cell,changedCellCount:changed.length,
    appliedLevel:finalLevels[changed[0]],undoOk:exactUndo===stagedBefore.json,redoOk:exactRedo===applied.json
  }));

  // V16: product path, not just pure model calls. Paint water, attempt to
  // raise adjacent land with an overlapping brush, then undo/redo snapshots.
  const layersV16=await run(`(async()=>{
    const el=id=>document.getElementById(id);
    const snapshot=()=>{el('export').click();return JSON.parse(el('json').value);};
    const change=(id,value)=>{el(id).value=String(value);
      el(id).dispatchEvent(new Event('input',{bubbles:true}));};
    el('flat').click();
    el('mode-water').click();
    el('quick-tool').value='water-fill';
    el('quick-tool').dispatchEvent(new Event('change',{bubbles:true}));
    change('radius',2);change('water-target',5);
    const before=snapshot();
    el('apply-precision').click();
    const water=snapshot();
    el('mode-ground').click();
    el('quick-tool').value='plateau';
    el('quick-tool').dispatchEvent(new Event('change',{bubbles:true}));
    change('radius',3);change('target',7);
    el('apply-precision').click();
    const withLand=snapshot();
    const touchedWater=water.levels.reduce((n,v,i)=>
      n+(water.waterLevels[i]>=0&&withLand.levels[i]!==v?1:0),0);
    const dryLandRaised=water.levels.reduce((n,v,i)=>
      n+(water.waterLevels[i]<0&&withLand.levels[i]>v?1:0),0);
    el('undo').click();const undone=snapshot();
    el('redo').click();const redone=snapshot();
    return {waterCells:water.waterLevels.filter(x=>x>=0).length,
      touchedWater,dryLandRaised,
      immutableWater:JSON.stringify(water.waterLevels)===JSON.stringify(withLand.waterLevels),
      groundUnchangedDuringWater:JSON.stringify(water.levels)===JSON.stringify(before.levels),
      undoExact:JSON.stringify(undone)===JSON.stringify(water),
      redoExact:JSON.stringify(redone)===JSON.stringify(withLand)};
  })()`);
  if(layersV16.waterCells<1||layersV16.touchedWater!==0||layersV16.dryLandRaised<1||
      !layersV16.immutableWater||!layersV16.groundUnchangedDuringWater||
      !layersV16.undoExact||!layersV16.redoExact)
    throw Error('V16 land/water overlapping brush leaked across layers: '+JSON.stringify(layersV16));
  const fullscreenV16=await run(`(async()=>{
    const el=id=>document.getElementById(id);
    const raf=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    el('fullscreen-toggle').click();await raf();await raf();
    const full=window.__sculptLabProbe();
    const visibleTools=getComputedStyle(document.querySelector('.sculpt-quickbar')).display!=='none';
    const p=el('palette-toggle');
    p.click();const collapsed=window.__sculptLabProbe().paletteCollapsed;
    p.click();const expanded=!window.__sculptLabProbe().paletteCollapsed;
    el('fullscreen-toggle').click();await raf();await raf();
    const restored=window.__sculptLabProbe();
    return {full:full.immersiveMode,canvasHeight:full.canvasHeight,viewportHeight:full.viewportHeight,
      tools:visibleTools,collapsed,expanded,restored:!restored.immersiveMode,
      precisionStillOn:restored.precisionMode};
  })()`);
  if(!fullscreenV16.full||fullscreenV16.canvasHeight<fullscreenV16.viewportHeight*.9||
      !fullscreenV16.tools||!fullscreenV16.collapsed||!fullscreenV16.expanded||
      !fullscreenV16.restored||!fullscreenV16.precisionStillOn)
    throw Error('V16 immersive canvas or compact palette failed in Chromium: '+JSON.stringify(fullscreenV16));
  console.log('V16 immersive phone and land/water separation Chromium:',
    JSON.stringify({layersV16,fullscreenV16}));

  // V17: genuine navigation input -> existing stepMovement -> Collision World
  // -> 2.5D rendered player, without mutating authored terrain.
  const navStart=await run(`(()=>{
    document.querySelector('#flat').click();
    document.querySelector('#export').click();
    const json=document.querySelector('#json').value;
    document.querySelector('#navigation-toggle').click();
    return {before:window.__sculptNavProbe(),json,
      hudVisible:!document.querySelector('#navigation-hud').hidden,
      stickVisible:!document.querySelector('#navigation-stick').hidden};
  })()`);
  if(!navStart.before.enabled||!navStart.before.joystickAttached||
     !navStart.hudVisible||!navStart.stickVisible||!navStart.before.player)
    throw Error('V17 navigation activation failed: '+JSON.stringify(navStart));
  if(navStart.before.speed!==220||navStart.before.zoom<1.7)
    throw Error('V19 default comfortable movement/viewport missing: '+JSON.stringify(navStart.before));
  const camera=await run(`(()=>{
    const slider=document.querySelector('#navigation-camera-zoom');
    slider.value='215';slider.dispatchEvent(new Event('input',{bubbles:true}));
    const close=window.__sculptNavProbe().zoom;
    slider.value='175';slider.dispatchEvent(new Event('input',{bubbles:true}));
    return {close,restored:window.__sculptNavProbe().zoom,
      label:document.querySelector('#navigation-camera-zoom-value').textContent};
  })()`);
  if(camera.close!==2.15||camera.restored!==1.75||camera.label!=='175 %')
    throw Error('V21 camera does not follow actual zoom config: '+JSON.stringify(camera));
  const slower=await run(`(()=>{
    const slider=document.querySelector('#navigation-speed');
    slider.value='120';slider.dispatchEvent(new Event('input',{bubbles:true}));
    return {speed:window.__sculptNavProbe().speed,
      label:document.querySelector('#navigation-speed-value').textContent};
  })()`);
  if(slower.speed!==120||slower.label!=='120')
    throw Error('V19 speed control cannot change real movement config: '+JSON.stringify(slower));
  const restored=await run(`(()=>{
    const slider=document.querySelector('#navigation-speed');
    slider.value='220';slider.dispatchEvent(new Event('input',{bubbles:true}));
    return window.__sculptNavProbe().speed;
  })()`);
  if(restored!==220)throw Error('V19 default speed not restored');
  await sleep(175);
  const v26Idle=await run('window.__sculptNavProbe()');
  if(v26Idle.actorMotion!=='idle'||!v26Idle.actorPrepared||v26Idle.actorMotionTime<=0)
    throw Error('V26 native actor idle motion not running: '+JSON.stringify(v26Idle));
  await send('Input.dispatchKeyEvent',
    {type:'keyDown',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  await sleep(220);
  const v26Walking=await run('window.__sculptNavProbe()');
  if(v26Walking.actorMotion!=='walk')
    throw Error('V26 native walk motion never starts on real displacement: '+JSON.stringify(v26Walking));
  await sleep(200);
  await send('Input.dispatchKeyEvent',
    {type:'keyUp',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  await sleep(140);
  const afterKeyboard=await run('window.__sculptNavProbe()');
  if(afterKeyboard.actorMotion!=='idle'||!afterKeyboard.actorPrepared)
    throw Error('V26 actor must return to idle after key release: '+JSON.stringify(afterKeyboard));
  if(afterKeyboard.player.x-navStart.before.player.x<35||!afterKeyboard.terrainCached)
    throw Error('V17 keyboard does not reach existing Exploration movement: '+JSON.stringify(afterKeyboard));
  // Force a 190ms main-thread freeze (simulates an overloaded Android device):
  // old 32ms frame clamp lost 158ms of real movement per dropped frame.
  await send('Input.dispatchKeyEvent',
    {type:'keyDown',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  await sleep(35);
  const preJank=await run('window.__sculptNavProbe()');
  await run(`(()=>{const end=performance.now()+190;while(performance.now()<end){}
    return true;})()`);
  await sleep(60);
  await send('Input.dispatchKeyEvent',
    {type:'keyUp',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  const postJank=await run('window.__sculptNavProbe()');
  if(postJank.player.x-preJank.player.x<35)
    throw Error('V21 main-thread 190ms stall caused unrealistic player crawl: '+
      JSON.stringify({distance:postJank.player.x-preJank.player.x,preJank,postJank}));
  console.log('V21 throttled Android-style jank movement:',JSON.stringify({
    moved:postJank.player.x-preJank.player.x,terrainCached:postJank.terrainCached,
    cameraZoom:postJank.zoom,fps:postJank.fps}));
  const stickCenter=await run(`(()=>{
    const r=document.querySelector('#navigation-stick').getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  })()`);
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
    {id:17,x:stickCenter.x,y:stickCenter.y}]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
    {id:17,x:stickCenter.x+23,y:stickCenter.y}]});
  await sleep(350);
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  const afterStick=await run('window.__sculptNavProbe()');
  if(afterStick.player.x-afterKeyboard.player.x<20)
    throw Error('V17 actual touch stick failed: '+JSON.stringify(afterStick));
  const navStop=await run(`(()=>{
    const choice=document.querySelector('#navigation-locomotion');
    choice.value='swim';choice.dispatchEvent(new Event('change',{bubbles:true}));
    const swimmable=window.__sculptNavProbe().player.locomotion.includes('swim');
    choice.value='fly';choice.dispatchEvent(new Event('change',{bubbles:true}));
    const flying=window.__sculptNavProbe().player.locomotion.includes('fly');
    document.querySelector('#navigation-toggle').click();
    document.querySelector('#export').click();
    return {swimmable,flying,
      json:document.querySelector('#json').value,
      after:window.__sculptNavProbe(),
      hudHidden:document.querySelector('#navigation-hud').hidden,
      stickHidden:document.querySelector('#navigation-stick').hidden};
  })()`);
  if(!navStop.swimmable||!navStop.flying||navStop.after.enabled||
      navStop.after.joystickAttached||!navStop.hudHidden||!navStop.stickHidden||
      navStop.json!==navStart.json)
    throw Error('V17 nav exit or immutable sculpture regression: '+JSON.stringify(navStop));
  console.log('V17 real keyboard and touch navigation / safe exit:',
    JSON.stringify({keyboardDistance:afterKeyboard.player.x-navStart.before.player.x,
      touchDistance:afterStick.player.x-afterKeyboard.player.x,
      mapUnchanged:navStop.json===navStart.json,hudHidden:navStop.hudHidden}));

  // V18: existing on-disk Material Registry visuals must change actual pixels
  // without writing a single authored height or water cell.
  const visualsV18=await run(`(async()=>{
    document.querySelector('#reset').click();
    const wait=async()=>{await new Promise(ok=>setTimeout(ok,180));
      await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));};
    const snap=()=>{document.querySelector('#export').click();
      return document.querySelector('#json').value;};
    const pixels=()=>new Uint8Array(document.querySelector('#sculpt-canvas')
      .getContext('2d',{willReadFrequently:true}).getImageData(0,0,
        document.querySelector('#sculpt-canvas').width,
        document.querySelector('#sculpt-canvas').height).data);
    const diff=(a,b)=>{let n=0;
      for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||
        a[i+1]!==b[i+1]||a[i+2]!==b[i+2])n++;
      return n;};
    await wait();const original=snap(),initial=pixels();
    const ground=document.querySelector('#material');
    ground.value='ground.forest_floor';
    ground.dispatchEvent(new Event('change',{bubbles:true}));
    await wait();const forest=pixels();
    ground.value='ground.mountain_rock';
    ground.dispatchEvent(new Event('change',{bubbles:true}));
    await wait();const mountain=pixels();
    const water=document.querySelector('#water-material');
    water.value='water.turquoise';
    water.dispatchEvent(new Event('change',{bubbles:true}));
    await wait();const turquoise=pixels();
    water.value='water.swamp';
    water.dispatchEvent(new Event('change',{bubbles:true}));
    await wait();const swamp=pixels();
    const resourcePaths=performance.getEntriesByType('resource').map(e=>e.name);
    return {forestPixels:diff(initial,forest),mountainPixels:diff(forest,mountain),
      turquoisePixels:diff(mountain,turquoise),swampPixels:diff(turquoise,swamp),
      mapUnchanged:original===snap(),
      forestLoaded:resourcePaths.some(s=>s.includes('forest_floor_stylized_01.webp')),
      mountainLoaded:resourcePaths.some(s=>s.includes('mountain_rock_stylized_01.webp')),
      turquoiseLoaded:resourcePaths.some(s=>s.includes('water_turquoise_stylized_01.webp')),
      swampLoaded:resourcePaths.some(s=>s.includes('water_swamp_stylized_01.webp')),
      selected:window.__sculptLabProbe().waterMaterialId};
  })()`);
  if(visualsV18.forestPixels<30||visualsV18.mountainPixels<30||
      visualsV18.turquoisePixels<30||visualsV18.swampPixels<30||
      !visualsV18.forestLoaded||!visualsV18.mountainLoaded||
      !visualsV18.turquoiseLoaded||!visualsV18.swampLoaded||
      !visualsV18.mapUnchanged||visualsV18.selected!=='water.swamp')
    throw Error('V18 real material image/pixel or data-isolation regression: '+JSON.stringify(visualsV18));
  console.log('V18 native visual palette real pixels:',JSON.stringify(visualsV18));

  // V20: REAL canvas pointer places a native catalog WorldObject, then undo,
  // redo, removal, scene export/import and native asset loading are exercised.
  const objectBegin=await run(`(()=>{
    document.querySelector('#flat').click();
    document.querySelector('#fit').click();
    document.querySelector('#mode-objects').click();
    const r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const select=document.querySelector('#object-definition');
    return {position:{x:r.left+r.width*.5,y:r.top+r.height*.5},
      probe:window.__sculptObjectsProbe(),
      type:select.value,paletteVisible:!document.querySelector('#object-palette').hidden};
  })()`);
  if(!objectBegin.probe.active||!objectBegin.paletteVisible||
      !objectBegin.type.startsWith('objectdef.building.'))
    throw Error('V20 object catalog/palette missing: '+JSON.stringify(objectBegin));
  async function placeOrEraseObject(){
    const pt=objectBegin.position;
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:pt.x,y:pt.y});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:pt.x,y:pt.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:pt.x,y:pt.y,button:'left',clickCount:1});
    await sleep(180);
  }
  await placeOrEraseObject();
  const placed=await run(`(()=>{
    const probe=window.__sculptObjectsProbe();
    document.querySelector('#scene-export').click();
    window.__v20ExportedScene=document.querySelector('#json').value;
    return {probe,scene:JSON.parse(window.__v20ExportedScene),
      height:window.__sculptLabProbe()};
  })()`);
  if(placed.probe.count!==1||placed.scene.objects.length!==1||
      !placed.probe.exportsIncludeObjects)
    throw Error('V20 real canvas object placement or scene export failed: '+JSON.stringify(placed));
  await run("document.querySelector('#object-undo').click()");
  if((await run('window.__sculptObjectsProbe().count'))!==0)
    throw Error('V20 object undo failed');
  await run("document.querySelector('#object-redo').click()");
  if((await run('window.__sculptObjectsProbe().count'))!==1)
    throw Error('V20 object redo failed');
  await run("document.querySelector('#object-action').value='remove'");
  await placeOrEraseObject();
  if((await run('window.__sculptObjectsProbe().count'))!==0)
    throw Error('V20 object removal failed');

  const reimport=await run(`(()=>{
    document.querySelector('#json').value=window.__v20ExportedScene;
    document.querySelector('#import').click();
    return {probe:window.__sculptObjectsProbe(),
      terrain:window.__sculptLabProbe(),status:document.querySelector('#notice').textContent};
  })()`);
  if(reimport.probe.count!==1||!reimport.status.includes('Scène complète'))
    throw Error('V20 scene import lost object: '+JSON.stringify(reimport));
  const nativeArt=await run(`(()=>{
    const urls=performance.getEntriesByType('resource').map(r=>r.name);
    return urls.some(u=>u.includes('building_house_')&&u.endsWith('.webp'));
  })()`);
  if(!nativeArt)throw Error('V20 building visual never requested from native asset adapter');
  const touchStart=await run(`(()=>{
    document.querySelector('#object-category').value='tree';
    document.querySelector('#object-category').dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#object-action').value='place';
    return window.__sculptObjectsProbe();
  })()`);
  await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await send('Input.dispatchTouchEvent',{type:'touchStart',
    touchPoints:[{id:26,x:objectBegin.position.x,y:objectBegin.position.y}]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(190);
  await send('Emulation.setTouchEmulationEnabled',{enabled:false});
  const afterObjectTouch=await run('window.__sculptObjectsProbe()');
  if(afterObjectTouch.count!==2||!afterObjectTouch.objects.some(o=>o.definition.includes('tree')))
    throw Error('V20 actual touch planting a tree failed: '+JSON.stringify({touchStart,afterObjectTouch}));
  await run("document.querySelector('#navigation-toggle').click()");
  const walkingWithObjects=await run(`(()=>({
    walking:window.__sculptNavProbe().enabled,
    paletteHidden:document.querySelector('#object-palette').hidden,
    objects:window.__sculptObjectsProbe().count
  }))()`);
  if(!walkingWithObjects.walking||!walkingWithObjects.paletteHidden||walkingWithObjects.objects!==2)
    throw Error('V20 object palette overlaps live walking test: '+JSON.stringify(walkingWithObjects));
  await run("document.querySelector('#navigation-toggle').click()");
  await run("document.querySelector('#mode-ground').click()");
  if((await run('window.__sculptObjectsProbe().active'))!==false)
    throw Error('V20 returning to terrain brush did not close object palette');
  console.log('V20 native object placement/undo/export/import/asset Chromium:',
    JSON.stringify({objects:reimport.probe.count,assetLoaded:nativeArt,
      untouchedHeight:placed.scene.terrain.schemaVersion===1}));

  // V23 real mobile canvas: place 3-view house, select after placement,
  // rotate 137 degrees, switch front -> rear, export and import intact.
  const v23Config=await run(`(()=>{
    document.querySelector('#mode-objects').click();
    const cat=document.querySelector('#object-category');
    cat.value='building';cat.dispatchEvent(new Event('change',{bubbles:true}));
    const defs=document.querySelector('#object-definition');
    defs.value='objectdef.building.house.blue_cottage.01';
    defs.dispatchEvent(new Event('change',{bubbles:true}));
    const variant=document.querySelector('#object-variant');
    const views=[...variant.options].map(o=>o.value);
    variant.value='side';variant.dispatchEvent(new Event('change',{bubbles:true}));
    const mode=document.querySelector('#object-action');
    mode.value='place';mode.dispatchEvent(new Event('change',{bubbles:true}));
    return {views,visible:!document.querySelector('#object-variant-wrap').hidden};
  })()`);
  if(!v23Config.visible||v23Config.views.join(',')!=='front,side,back')
    throw Error('V23 existing house visual variants not exposed: '+JSON.stringify(v23Config));
  const sidePt={x:objectBegin.position.x-85,y:objectBegin.position.y};
  async function tapV23(){
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:sidePt.x,y:sidePt.y});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:sidePt.x,y:sidePt.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:sidePt.x,y:sidePt.y,button:'left',clickCount:1});
    await sleep(180);
  }
  await tapV23();
  const sidePlaced=await run('window.__sculptObjectsProbe()');
  if(sidePlaced.count!==3||!sidePlaced.objects.some(o=>o.visualVariantId==='side'))
    throw Error('V23 house placed in side perspective failed: '+JSON.stringify(sidePlaced));
  await run(`(()=>{
    const mode=document.querySelector('#object-action');
    mode.value='select';mode.dispatchEvent(new Event('change',{bubbles:true}));
    return true;
  })()`);
  await tapV23();
  const edited=await run(`(()=>{
    const variant=document.querySelector('#object-variant');
    variant.value='back';variant.dispatchEvent(new Event('change',{bubbles:true}));
    const angle=document.querySelector('#object-rotation');
    angle.value='137';angle.dispatchEvent(new Event('input',{bubbles:true}));
    angle.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#scene-export').click();
    window.__v23Scene=document.querySelector('#json').value;
    return {probe:window.__sculptObjectsProbe(),scene:JSON.parse(window.__v23Scene)};
  })()`);
  const updated=edited.probe.objects.find(o=>o.id===edited.probe.selectedId);
  if(!updated||updated.visualVariantId!=='back'||updated.rotationDeg!==137||
     edited.scene.objects.find(o=>o.id===updated.id)?.overrides.visualVariantId!=='back')
    throw Error('V23 house edit/rotation/export failed: '+JSON.stringify(edited));
  await sleep(220);
  const rearLoaded=await run(`(()=>{
    const urls=performance.getEntriesByType('resource').map(r=>r.name);
    return urls.some(u=>u.includes('building_house_blue_cottage_back_01.webp'));
  })()`);
  if(!rearLoaded)throw Error('V23 rear house WebP was not loaded from the official catalog');
  await run(`(()=>{
    document.querySelector('#json').value=window.__v23Scene;
    document.querySelector('#import').click();
    return true;
  })()`);
  const afterV23Import=await run('window.__sculptObjectsProbe()');
  if(!afterV23Import.objects.some(o=>o.visualVariantId==='back'&&o.rotationDeg===137))
    throw Error('V23 house rear perspective lost after scene import: '+JSON.stringify(afterV23Import));
  await run("document.querySelector('#mode-ground').click()");
  console.log('V23 house 3 views/rotate/selected edit roundtrip Chromium:',
    JSON.stringify({views:v23Config.views,rotation:137,backAssetLoaded:rearLoaded}));

  // V51: Full browser path: the 7 native bridge families are selectable, a
  // four-direction view is applied, and a bridge alone may be placed on water.
  const bridgePicker=await run(`(()=>{
    const saved=JSON.parse(window.__v23Scene);
    saved.terrain.waterLevels=saved.terrain.levels.map(()=>7);
    document.querySelector('#json').value=JSON.stringify(saved);
    document.querySelector('#import').click();
    document.querySelector('#mode-objects').click();
    const category=document.querySelector('#object-category');
    category.value='bridge';category.dispatchEvent(new Event('change',{bubbles:true}));
    const choices=[...document.querySelector('#object-definition').options].map(o=>o.value);
    const bridge='objectdef.bridge.wood_rustic_2p5d.01';
    const def=document.querySelector('#object-definition');
    def.value=bridge;def.dispatchEvent(new Event('change',{bubbles:true}));
    const views=[...document.querySelector('#object-variant').options].map(o=>o.value);
    const variant=document.querySelector('#object-variant');
    variant.value='diagonal_right';variant.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#object-action').value='place';
    const scale=document.querySelector('#object-scale'),scaleMax=scale.max;
    // V56 real browser: 250% is allowed on a Bridge, not on buildings.
    scale.value='250';scale.dispatchEvent(new Event('input',{bubbles:true}));
    return {choices,views,sceneObjects:saved.objects.length,scaleMax,
      category:window.__sculptObjectsProbe().categories};
  })()`);
  if(!bridgePicker.category.includes('bridge')||bridgePicker.choices.filter(x=>
      x.includes('_2p5d.')).length!==7||
      bridgePicker.views.join(',')!=='horizontal,vertical,diagonal_left,diagonal_right'||
      bridgePicker.scaleMax!=='300')
    throw Error('V51 bridge categories or directional views missing in real Chromium: '+JSON.stringify(bridgePicker));
  await send('Input.dispatchMouseEvent',{type:'mousePressed',
    x:objectBegin.position.x,y:objectBegin.position.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',
    x:objectBegin.position.x,y:objectBegin.position.y,button:'left',clickCount:1});
  const bridgePlaced=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const exported=JSON.parse(document.querySelector('#json').value);
    const probe=window.__sculptObjectsProbe();
    return {probe,object:exported.objects.find(o=>o.objectDefinitionId===
      'objectdef.bridge.wood_rustic_2p5d.01')};
  })()`);
  if(bridgePlaced.probe.count!==bridgePicker.sceneObjects+1||
     bridgePlaced.object?.overrides.visualVariantId!=='diagonal_right'||
     bridgePlaced.object?.transform.scaleX!==2.5)
    throw Error('V51 bridge cannot be placed over water / variant lost: '+JSON.stringify(bridgePlaced));
  await run(`(()=>{
    document.querySelector('#json').value=window.__v23Scene;
    document.querySelector('#import').click();
    document.querySelector('#mode-ground').click();
    return true;
  })()`);
  console.log('V51 canonical bridges selectable/4 views/placed over water Chromium:',
    JSON.stringify({bridgeFamilies:7,views:bridgePicker.views,variant:'diagonal_right'}));

  // V24: In Chromium with an existing nonempty V23 house/tree scene, simulate
  // authored water, then test flatten-in-place, cancel New Map and confirm New Map.
  const wetScene=await run(`(()=>{
    const scene=JSON.parse(window.__v23Scene);
    const col=7,row=5;
    scene.terrain.waterLevels[row*scene.terrain.width+col]=6;
    document.querySelector('#json').value=JSON.stringify(scene);
    document.querySelector('#import').click();
    const before=window.__sculptLabProbe();
    document.querySelector('#flat').click();
    const after=window.__sculptLabProbe();
    document.querySelector('#undo').click(); // dry reset remains undoable
    const restored=window.__sculptLabProbe();
    document.querySelector('#scene-export').click();
    window.__v24OldScene=document.querySelector('#json').value;
    return {before,after,restored,objects:JSON.parse(window.__v24OldScene).objects.length};
  })()`);
  if(wetScene.before.objects<2||wetScene.after.objects!==wetScene.before.objects||
     wetScene.after.wetCells!==0||wetScene.after.authoredWaterCells!==0||
     wetScene.restored.wetCells!==wetScene.before.wetCells||
     wetScene.after.width!==wetScene.before.width||
     wetScene.objects!==wetScene.before.objects)
    throw Error('V24 flat must clear water as before, keep objects/dimensions and remain undoable: '+JSON.stringify(wetScene));
  const beforeCancel=await run(`(()=>{
    document.querySelector('#new-map-toggle').click();
    return {open:!document.querySelector('#new-map-panel').hidden,
      expanded:document.querySelector('#new-map-toggle').getAttribute('aria-expanded'),
      createDisabled:document.querySelector('#new-map-create').disabled,
      proposedWidth:document.querySelector('#new-map-width').value};
  })()`);
  if(!beforeCancel.open||beforeCancel.expanded!=='true'||!beforeCancel.createDisabled||
     Number(beforeCancel.proposedWidth)!==wetScene.before.width)
    throw Error('V24 new map panel/confirmation not exposed: '+JSON.stringify(beforeCancel));
  const canceled=await run(`(()=>{
    document.querySelector('#new-map-width').value='18';
    document.querySelector('#new-map-height').value='12';
    document.querySelector('#new-map-cancel').click();
    document.querySelector('#scene-export').click();
    return {map:window.__sculptLabProbe(),
      scene:document.querySelector('#json').value,
      oldScene:window.__v24OldScene,
      closed:document.querySelector('#new-map-panel').hidden};
  })()`);
  if(!canceled.closed||canceled.scene!==canceled.oldScene||
     canceled.map.objects!==wetScene.before.objects)
    throw Error('V24 cancel mutated existing scene: '+JSON.stringify(canceled));
  const newMap=await run(`(()=>{
    document.querySelector('#new-map-toggle').click();
    document.querySelector('#new-map-width').value='18';
    document.querySelector('#new-map-height').value='12';
    const agreed=document.querySelector('#new-map-confirm');
    agreed.checked=true;agreed.dispatchEvent(new Event('change',{bubbles:true}));
    const ready=!document.querySelector('#new-map-create').disabled;
    document.querySelector('#new-map-create').click();
    const notice=document.querySelector('#notice').textContent;
    document.querySelector('#scene-export').click();
    return {ready,created:window.__sculptLabProbe(),
      scene:JSON.parse(document.querySelector('#json').value),
      oldJson:document.querySelector('#json').value,
      panelClosed:document.querySelector('#new-map-panel').hidden,
      notice};
  })()`);
  if(!newMap.ready||!newMap.panelClosed||newMap.created.width!==18||
     newMap.created.height!==12||newMap.created.objects!==0||
     newMap.created.wetCells!==0||newMap.created.authoredWaterCells!==0||
     newMap.created.undoCount!==0||newMap.created.redoCount!==0||
     newMap.created.faceCount!==0||newMap.scene.objects.length!==0||
     newMap.created.roadVisible||newMap.created.exampleRoadEnabled||
     newMap.scene.terrain.waterLevels.some(n=>n!==-1)||
     !newMap.notice.includes('Carte vierge créée'))
    throw Error('V24 new map did not reset scene and editor history: '+JSON.stringify(newMap));
  await run("document.querySelector('#navigation-toggle').click()");
  const navV24=await run('window.__sculptNavProbe()');
  if(!navV24.enabled||!navV24.player||!navV24.joystickAttached||navV24.speed!==220)
    throw Error('V24 new map lost validated navigation/camera: '+JSON.stringify(navV24));
  const v25Imported=await run(`(()=>{
    document.querySelector('#import').click();
    return window.__sculptLabProbe();
  })()`);
  if(v25Imported.roadVisible||v25Imported.exampleRoadEnabled)
    throw Error('V25 import restored phantom decorative road: '+JSON.stringify(v25Imported));
  await run("document.querySelector('#navigation-toggle').click()");
  console.log('V24 new blank map, confirmed reset and cancellation Chromium:',
    JSON.stringify({dimensions:'18x12',oldObjects:wetScene.before.objects,
      oldWaterCells:wetScene.before.wetCells,newObjects:newMap.created.objects,
      newWaterCells:newMap.created.wetCells,undoCount:newMap.created.undoCount,
      navigationAfterCreate:navV24.enabled}));

  // V27 REAL canvas painting, edit undo/redo, exported WorldSurface and new map cleanup.
  const v27Ready=await run(`(()=>{
    document.querySelector('#mode-surface').click();
    const r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const p=window.__sculptLabProbe(), w=p.width*28,h=p.height*21+7*18;
    const panX=(r.width-w*p.zoom)/2;
    const panY=(r.height-h*p.zoom)/2+7*18*p.zoom;
    const cell=(col,row)=>({x:r.left+panX+(col+.5)*28*p.zoom,
      y:r.top+panY+((row+.5)*21-2*18)*p.zoom});
    const material=document.querySelector('#surface-material');
    material.value='road.dirt';material.dispatchEvent(new Event('change',{bubbles:true}));
    return {active:window.__sculptSurfaceProbe().active,
      start:cell(3,4),end:cell(9,4),zone:cell(8,8)};
  })()`);
  if(!v27Ready.active)throw Error('V27 texture palette not activated');
  async function paintSurface(from,to){
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:from.x,y:from.y});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:from.x,y:from.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:to.x,y:to.y,button:'left',buttons:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:to.x,y:to.y,button:'left',clickCount:1});
    await sleep(260);
  }
  await paintSurface(v27Ready.start,v27Ready.end);
  const v27Road=await run('window.__sculptSurfaceProbe()');
  if(v27Road.routes!==1||v27Road.zones!==0||v27Road.features[0].materialId!=='road.dirt')
    throw Error('V27 real mouse stroke did not author WorldSurface road: '+JSON.stringify(v27Road));
  await run("document.querySelector('#surface-undo').click()");
  if((await run('window.__sculptSurfaceProbe().routes'))!==0)
    throw Error('V27 undo did not remove surface route');
  await run("document.querySelector('#surface-redo').click()");
  if((await run('window.__sculptSurfaceProbe().routes'))!==1)
    throw Error('V27 redo did not restore surface route');
  await run(`(()=>{
    document.querySelector('#surface-material').value='ground.sand';
    return true;
  })()`);
  await paintSurface(v27Ready.zone,v27Ready.zone);
  const v27Zone=await run('window.__sculptSurfaceProbe()');
  if(v27Zone.zones!==1||v27Zone.features[1].materialId!=='ground.sand')
    throw Error('V27 zoned sand material failed: '+JSON.stringify(v27Zone));
  await sleep(440);
  const v27Visual=await run(`(()=>{
    document.querySelector('#scene-export').click();
    window.__v27Scene=document.querySelector('#json').value;
    return {scene:JSON.parse(window.__v27Scene),
      probe:window.__sculptSurfaceProbe(),
      painted:window.__sculptLabProbe().paintedCells};
  })()`);
  if(v27Visual.scene.surface.version!==3||
      v27Visual.scene.surface.routes.length!==1||v27Visual.scene.surface.zones.length!==1||
      !v27Visual.probe.texturesLoaded.includes('road.dirt')||
      !v27Visual.probe.texturesLoaded.includes('ground.sand')||
      v27Visual.painted<=0)
    throw Error('V27 native texture assets/terrain raster/export missing: '+JSON.stringify(v27Visual));
  const v27Reload=await run(`(()=>{
    document.querySelector('#json').value=window.__v27Scene;
    document.querySelector('#import').click();
    return window.__sculptSurfaceProbe();
  })()`);
  if(v27Reload.routes!==1||v27Reload.zones!==1)
    throw Error('V27 imported WorldSurface routes/zones lost: '+JSON.stringify(v27Reload));
  const v27Clean=await run(`(()=>{
    document.querySelector('#new-map-toggle').click();
    const c=document.querySelector('#new-map-confirm');
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#new-map-create').click();
    return {paint:window.__sculptSurfaceProbe(),lab:window.__sculptLabProbe()};
  })()`);
  if(v27Clean.paint.routes||v27Clean.paint.zones||
      v27Clean.lab.paintedRoutes||v27Clean.lab.paintedZones)
    throw Error('V27 New Map retains stale painted features: '+JSON.stringify(v27Clean));
  console.log('V27 real WorldSurface road/zone painting and cleanup Chromium:',
    JSON.stringify({roads:v27Visual.scene.surface.routes.length,
      zones:v27Visual.scene.surface.zones.length,
      materialAssets:v27Visual.probe.texturesLoaded,painted:v27Visual.painted}));
  // V30: same floating object panel can switch to Actor references, while
  // the local isolated CI runner intentionally lacks the external Capture checkout.
  const v30Palette=await run(`(()=>{
    document.querySelector('#mode-objects').click();
    document.querySelector('#actor-open').click();
    const selected=window.__sculptActorsProbe();
    const actorPanelVisible=!document.querySelector('#actor-controls').hidden;
    document.querySelector('#actor-back').click();
    const backToObjects=!document.querySelector('#object-controls').hidden;
    return {selected,actorPanelVisible,backToObjects};
  })()`);
  if(!v30Palette.selected.active||!v30Palette.actorPanelVisible||
     !v30Palette.backToObjects)
    throw Error('V30 native Capture actor palette not reachable: '+JSON.stringify(v30Palette));
  const v30ActorRoundtrip=await run(`(()=>{
    document.querySelector('#mode-objects').click(); // close palette
    document.querySelector('#scene-export').click();
    const json=document.querySelector('#json');
    const scene=JSON.parse(json.value);
    scene.actors=[{schemaVersion:1,id:'actor-smoke-1',
      actorDefinitionId:'capture:creature:crea-loup',x:98,y:75,facingX:-1}];
    json.value=JSON.stringify(scene);
    document.querySelector('#import').click();
    document.querySelector('#scene-export').click();
    const saved=JSON.parse(json.value);
    const actor=window.__sculptActorsProbe();
    document.querySelector('#new-map-toggle').click();
    const c=document.querySelector('#new-map-confirm');
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#new-map-create').click();
    return {savedActor:saved.actors?.[0],before:actor,
      after:window.__sculptActorsProbe()};
  })()`);
  if(v30ActorRoundtrip.savedActor?.actorDefinitionId!=='capture:creature:crea-loup'||
     v30ActorRoundtrip.savedActor?.facingX!==-1||
     v30ActorRoundtrip.before.count!==1||v30ActorRoundtrip.after.count!==0)
    throw Error('V30 native ActorPlacement import-export and New Map cleanup failed: '+
      JSON.stringify(v30ActorRoundtrip));
  // V31: real Chromium controls visible and wired in editor + quickbar,
  // including returning to the legacy round default.
  const v31Shapes=await run(`(()=>{
    document.querySelector('#mode-ground').click();
    const control=document.querySelector('#brush-shape');
    const states=[];
    for(const shape of ['square','cross','circle']){
      control.value=shape;control.dispatchEvent(new Event('change',{bubbles:true}));
      states.push(window.__sculptLabProbe().brushShape);
    }
    return {states,visible:control.getBoundingClientRect().width>0,
      buttonCount:control.options.length};
  })()`);
  if(v31Shapes.states.join(',')!=='square,cross,circle'||
     !v31Shapes.visible||v31Shapes.buttonCount!==3)
    throw Error('V31 selectable mobile brush shapes failed: '+JSON.stringify(v31Shapes));
  // V33 REAL Chromium raster regression: square land, then square water
  // raised to a higher level. A wet/dry SOUTH bank must not generate
  // a giant dangling cyan rectangle across grass (V32 user screenshot).
  const v33WaterPixels=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const render=await import('./src/render/sculpt-height-renderer.js');
    const base=model.createSculptTerrain({width:8,height:8,
      levels:Array(64).fill(0)});
    const raised=model.applySculptStroke(base,{
      points:[{x:6.5,y:6.5}],radius:1,shape:'square',
      mode:'plateau',target:1});
    const wet=model.applySculptWaterStroke(raised,{
      points:[{x:3.5,y:2.5}],radius:2,shape:'square',
      mode:'water-fill',target:2});
    const moved=model.applySculptWaterStroke(wet,{
      points:[{x:3.5,y:2.5}],radius:2,shape:'square',
      mode:'water-rise',strength:1});
    const c=document.createElement('canvas');
    c.width=8*28;c.height=8*21+7*18;
    const cx=c.getContext('2d',{willReadFrequently:true});
    const stats=render.drawSculptTerrain(cx,{
      terrain:moved,material:{render:{baseColor:'#16782d'}},
      overlays:{water:{visible:true,material:{render:{
        waterColor:'#26b6ef',highlightColor:'#eefaff'}},texture:null}}});
    const sample=(x,y)=>Array.from(cx.getImageData(x,y,1,1).data).slice(0,3);
    return {bank:sample(3*28+14,75),water:sample(3*28+14,36),
      wet:stats.waterCells,physicalGround:moved.levels[5*8+3],
      waterAtBank:model.sculptWaterAt(moved,3,4),
      noWaterOnLand:model.sculptWaterAt(moved,3,5)};
  })()`);
  if(v33WaterPixels.wet<10||v33WaterPixels.water[2]<100||
     v33WaterPixels.bank[1]<=v33WaterPixels.bank[2]||
     v33WaterPixels.noWaterOnLand!==0||
     v33WaterPixels.waterAtBank<=0)
    throw Error('V33 wet/dry renderer still paints a floating cyan water wall: '+
      JSON.stringify(v33WaterPixels));
  console.log('V33 real Chromium water/land seam pixels:',JSON.stringify(v33WaterPixels));
  // V46: real water shoreline raster gets curved exposed wet corners
  // without making the dry neighboring tile or wet collision geometry blue.
  const v46Shore=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const renderer=await import('./src/render/sculpt-height-renderer.js');
    const width=8,height=8,waterLevels=Array(width*height).fill(-1);
    waterLevels[5*width+5]=4;
    const terrain=model.createSculptTerrain({width,height,
      levels:Array(width*height).fill(2),waterLevels});
    const flat=model.createSculptTerrain({width,height,
      levels:Array(width*height).fill(2)});
    const paint=(t)=>{
      const c=document.createElement('canvas');c.width=8*28;c.height=8*21+7*18;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      renderer.drawSculptTerrain(ctx,{terrain:t,material:{render:{baseColor:'#337d46'}},
        overlays:{water:{visible:true,material:{render:{waterColor:'#20b6ed',
          highlightColor:'#efffff'}},texture:null}}});
      return ctx;
    };
    const before=JSON.stringify(terrain),wet=paint(terrain),dry=paint(flat);
    const x=5*28,y=5*21-4*18;
    const rgb=(ctx,cx,cy)=>Array.from(ctx.getImageData(cx,cy,1,1).data).slice(0,3);
    const corner=rgb(wet,x,y),cornerDry=rgb(dry,x,y);
    const middle=rgb(wet,x+14,y+9);
    const topEdge=rgb(wet,x+14,y);
    const topEdgeDry=rgb(dry,x+14,y);
    // With a wet neighbor east, the common seam must remain full blue.
    const joinedLevels=[...waterLevels];joinedLevels[5*width+6]=4;
    const joinedTerrain=model.createSculptTerrain({width,height,
      levels:Array(width*height).fill(2),waterLevels:joinedLevels});
    const joined=paint(joinedTerrain);
    return {corner,cornerDry,middle,topEdge,topEdgeDry,
      seamLeft:rgb(joined,x+27,y+9),seamRight:rgb(joined,x+28,y+9),
      afterSame:before===JSON.stringify(terrain),
      centerWet:model.sculptWaterAt(terrain,5,5),
      outsideWet:model.sculptWaterAt(terrain,5,4)};
  })()`);
  const blueDominant=c=>c[2]>c[1]&&c[2]>c[0]+30;
  if(v46Shore.corner.join(',')!==v46Shore.cornerDry.join(',')||
     v46Shore.topEdge.join(',')!==v46Shore.topEdgeDry.join(',')||
     !blueDominant(v46Shore.middle)||
     !blueDominant(v46Shore.seamLeft)||!blueDominant(v46Shore.seamRight)||
     !v46Shore.afterSame||v46Shore.centerWet!==2||v46Shore.outsideWet!==0)
    throw Error('V46 curved shoreline pixels/canonical water regression: '+JSON.stringify(v46Shore));
  console.log('V46 Chromium water dry corner, smoothed shoreline and connected wet tiles:',JSON.stringify(v46Shore));
  // V34 real Chromium raster: a higher dry plateau produces a local shadow
  // on the adjacent lower LAND tile, without darkening flat remote tiles.
  const v34Relief=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const renderer=await import('./src/render/sculpt-height-renderer.js');
    const levels=Array(8*8).fill(2);
    const flat=model.createSculptTerrain({width:8,height:8,levels});
    levels[3*8+4]=4;
    const raised=model.createSculptTerrain({width:8,height:8,levels});
    const draw=t=>{
      const canvas=document.createElement('canvas');
      canvas.width=8*28;canvas.height=8*21+7*18;
      const g=canvas.getContext('2d',{willReadFrequently:true});
      renderer.drawSculptTerrain(g,{terrain:t,material:{render:{baseColor:'#528d42'}}});
      return (x,y)=>Array.from(g.getImageData(x,y,1,1).data).slice(0,3);
    };
    const before=draw(flat),after=draw(raised);
    const contact=[3*28+26,3*21-2*18+10];
    const undisturbed=[1*28+14,5*21-2*18+10];
    const sum=c=>c.reduce((a,b)=>a+b,0);
    return {contactBefore:before(...contact),contactAfter:after(...contact),
      stillBefore:before(...undisturbed),stillAfter:after(...undisturbed),
      diff:sum(before(...contact))-sum(after(...contact))};
  })()`);
  if(v34Relief.diff<9||
     v34Relief.stillBefore.join(',')!==v34Relief.stillAfter.join(','))
    throw Error('V34 real canvas raised ground must cast localized gradient only: '+
      JSON.stringify(v34Relief));
  console.log('V34 Chromium land plateau contact shadow pixels:',JSON.stringify(v34Relief));
  // V35: real Canvas regression. A plateau lip is slightly darker than
  // its own grass top; a uniform dry plain has no artificial dark border.
  const v35Ledge=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const renderer=await import('./src/render/sculpt-height-renderer.js');
    const terrain=(raised)=>{
      const levels=Array(8*8).fill(2);
      if(raised)levels[5*8+3]=4;
      return model.createSculptTerrain({width:8,height:8,levels});
    };
    const paint=(t)=>{
      const canvas=document.createElement('canvas');
      canvas.width=8*28;canvas.height=8*21+7*18;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      renderer.drawSculptTerrain(ctx,{terrain:t,material:{render:{baseColor:'#528d42'}}});
      return (x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
    };
    const high=paint(terrain(true)),flat=paint(terrain(false));
    const sum=v=>v.reduce((a,b)=>a+b,0);
    const upperInner=high(3*28+14,5*21-4*18+9);
    const upperLip=high(3*28+14,5*21-4*18+20);
    const flatInner=flat(3*28+14,5*21-2*18+9);
    const flatEdge=flat(3*28+14,5*21-2*18+20);
    return {upperInner,upperLip,flatInner,flatEdge,
      lipDarkening:sum(upperInner)-sum(upperLip),
      fakePlainBorder:sum(flatInner)-sum(flatEdge)};
  })()`);
  if(v35Ledge.lipDarkening<18||Math.abs(v35Ledge.fakePlainBorder)>12)
    throw Error('V35 dry-cliff dark lip missing or artificial flat-terrain seam: '+
      JSON.stringify(v35Ledge));
  console.log('V35 real Chromium dark upper ledge:',JSON.stringify(v35Ledge));
  // V36: user screenshot requires a visibly stronger front lip, not just a
  // barely perceptible tint. Keep the V35 flat-ground seam rejection above.
  if(v35Ledge.lipDarkening<50)
    throw Error('V36 upper hill edge still insufficiently distinct from grass: '+
      JSON.stringify(v35Ledge));
  console.log('V36 Chromium stronger upper plateau rim:',JSON.stringify(v35Ledge));
  // V37: reproduce the user's actual missing case, the BACK of the raised
  // grassy plateau blending into flat grass behind it. V35/V36 only proved
  // the SOUTH/front rim, never the NORTH/rear or WEST/left.
  const v37RearRim=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const renderer=await import('./src/render/sculpt-height-renderer.js');
    const make=(raised,withWater=false,withEqual=false)=>{
      const levels=Array(8*8).fill(2),waterLevels=Array(8*8).fill(-1);
      if(raised)levels[5*8+3]=4;
      if(withEqual)levels[5*8+4]=4;
      if(withWater)waterLevels[4*8+3]=5;
      return model.createSculptTerrain({width:8,height:8,levels,waterLevels});
    };
    const paint=(terrain)=>{
      const canvas=document.createElement('canvas');
      canvas.width=8*28;canvas.height=8*21+7*18;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      renderer.drawSculptTerrain(ctx,{terrain,material:{render:{baseColor:'#528d42'}}});
      return (x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
    };
    const raised=make(true),high=paint(raised),flat=paint(make(false));
    const sum=v=>v.reduce((a,b)=>a+b,0);
    const topY=5*21-4*18,plainY=5*21-2*18,x=3*28;
    const inside=high(x+14,topY+9);
    const rear=high(x+14,topY+1),left=high(x+1,topY+9);
    const flatInside=flat(x+14,plainY+9);
    const flatRear=flat(x+14,plainY+1),flatLeft=flat(x+1,plainY+9);
    const withWater=make(true,true),equal=make(true,false,true);
    return {inside,rear,left,flatInside,flatRear,flatLeft,
      rearContrast:sum(inside)-sum(rear),
      westContrast:sum(inside)-sum(left),
      fakeRear:sum(flatInside)-sum(flatRear),
      fakeWest:sum(flatInside)-sum(flatLeft),
      northEdge:renderer.sculptGroundReliefLighting(raised,3,5).exposedEdges.includes('north'),
      westEdge:renderer.sculptGroundReliefLighting(raised,3,5).exposedEdges.includes('west'),
      noWetBorder:!renderer.sculptGroundReliefLighting(withWater,3,5).exposedEdges.includes('north'),
      noEqualBorder:!renderer.sculptGroundReliefLighting(equal,4,5).exposedEdges.includes('west')};
  })()`);
  if(v37RearRim.rearContrast<65||v37RearRim.westContrast<45||
    Math.abs(v37RearRim.fakeRear)>12||Math.abs(v37RearRim.fakeWest)>12||
    !v37RearRim.northEdge||!v37RearRim.westEdge||
    !v37RearRim.noWetBorder||!v37RearRim.noEqualBorder)
    throw Error('V37 user screenshot rear grassy plateau rim missing or false seam: '+
      JSON.stringify(v37RearRim));
  console.log('V37 real Chromium rear and west raised hill silhouettes:',JSON.stringify(v37RearRim));
  // V45 mineral-rock prototype: actual painted Canvas pixels must show
  // many natural color variations on a long cliff, without touching a flat
  // terrain's top or the V37 grassy plateau rims tested above.
  const v45Rock=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const renderer=await import('./src/render/sculpt-height-renderer.js');
    const levels=Array(9*9).fill(2);
    for(let x=2;x<=6;x++)levels[4*9+x]=5;
    const lifted=model.createSculptTerrain({width:9,height:9,levels});
    const flat=model.createSculptTerrain({width:9,height:9});
    const render=(terrain,rockPalette)=>{
      const canvas=document.createElement('canvas');
      canvas.width=9*28;canvas.height=9*21+7*18;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const stats=renderer.drawSculptTerrain(ctx,{terrain,rockPalette,
        material:{render:{baseColor:'#528d42'}}});
      return {ctx,stats};
    };
    const warm=render(lifted,'warm'),granite=render(lifted,'granite');
    const plain=render(flat,'warm'),plainOther=render(flat,'granite');
    const colors=new Set();let variantPixels=0;
    const rgb=(ctx,x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
    for(let y=23;y<=55;y+=2)for(let x=60;x<=188;x+=2){
      const a=rgb(warm.ctx,x,y),b=rgb(granite.ctx,x,y);
      colors.add(a.join(','));
      if(a.join(',')!==b.join(','))variantPixels++;
    }
    let unchangedPlain=true;
    for(const [x,y] of [[24,45],[80,62],[125,91],[167,140]]){
      if(rgb(plain.ctx,x,y).join(',')!==rgb(plainOther.ctx,x,y).join(','))
        unchangedPlain=false;
    }
    const selector=[...document.querySelector('#rock').options].map(o=>o.value);
    return {variants:colors.size,differentPalettePixels:variantPixels,
      unchangedPlain,faceRuns:warm.stats.faceRuns,choices:selector};
  })()`);
  if(v45Rock.variants<50||v45Rock.differentPalettePixels<120||
     !v45Rock.unchangedPlain||v45Rock.faceRuns<1||
     !['warm','slate','sandstone','dark','granite','ochre'].every(x=>v45Rock.choices.includes(x)))
    throw Error('V45 true Canvas mineral texture, palette or old flat top regression: '+JSON.stringify(v45Rock));
  console.log('V45 Chromium textured cliff mineral facets, six palettes, untouched plains:',JSON.stringify(v45Rock));
  // V47: exercise the REAL binary WebP committed into source, not just
  // palette/asset IDs. Missing binary must fail the browser gate, never pass
  // silently via the old V45 renderer fallback.
  const v47Cliff=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const renderer=await import('./src/render/sculpt-height-renderer.js');
    const atlas=await import('./src/render/sculpt-cliff-atlas.js');
    const image=new Image();
    image.src=atlas.resolveSculptCliffAtlasUrl();
    await image.decode();
    if(!atlas.sculptCliffAtlasHasLayers(image))throw Error('V47 atlas wrong dimensions');
    const levels=Array(9*9).fill(2);
    for(let x=2;x<=6;x++)levels[4*9+x]=5;
    const terrain=model.createSculptTerrain({width:9,height:9,levels});
    const flat=model.createSculptTerrain({width:9,height:9});
    const render=(t,rockPalette,img,moss=false)=>{
      const c=document.createElement('canvas');
      c.width=252;c.height=315;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      renderer.drawSculptTerrain(ctx,{terrain:t,rockPalette,cliffAtlas:img,
        cliffMoss:moss,material:{render:{baseColor:'#528d42'}}});
      return ctx;
    };
    const old=render(terrain,'warm',null);
    const newGray=render(terrain,'slate',image);
    const newOchre=render(terrain,'warm',image);
    const oldFlat=render(flat,'warm',null);
    const newFlat=render(flat,'warm',image);
    const get=(ctx,x,y)=>Array.from(ctx.getImageData(x,y,1,1).data).slice(0,3);
    let changed=0,paletteChanged=0,flatChanged=0;
    for(let y=22;y<=67;y+=2)for(let x=60;x<=192;x+=2){
      const a=get(old,x,y).join(','),b=get(newGray,x,y).join(',');
      const c=get(newOchre,x,y).join(',');
      if(a!==b)changed++;
      if(b!==c)paletteChanged++;
    }
    // Top of a flat plateau must be pixel-identical; V52 intentionally textures
    // its outer SOUTH skirt below y=132, which is not part of the plain top.
    for(let y=18;y<128;y+=9)for(let x=18;x<224;x+=9)
      if(get(oldFlat,x,y).join(',')!==get(newFlat,x,y).join(','))flatChanged++;
    const palette=[...document.querySelector('#rock').options].map(x=>x.value);
    const mossControl=document.querySelector('#rock-moss');
    const hasActualPath=image.currentSrc.endsWith('/assets/sculpt/cliff-atlas-v47.webp');
    const atlasLoaded=await new Promise(ok=>setTimeout(
      ()=>ok(document.querySelector('#rock-moss')!==null),35));
    return {dimensions:[image.naturalWidth,image.naturalHeight],hasActualPath,
      changed,paletteChanged,flatChanged,
      paletteCount:palette.length,mossAvailable:!!mossControl,atlasLoaded};
  })()`);
  if(v47Cliff.dimensions[0]!==192||v47Cliff.dimensions[1]!==160||
     !v47Cliff.hasActualPath||v47Cliff.changed<100||
     v47Cliff.paletteChanged<100||v47Cliff.flatChanged!==0||
     v47Cliff.paletteCount<6||!v47Cliff.mossAvailable||!v47Cliff.atlasLoaded)
    throw Error('V47 browser actual WebP atlas/rock pixels/flat invariant: '+JSON.stringify(v47Cliff));
  console.log('V47 Chromium real binary WebP, cliff facings, palettes and ground:',
    JSON.stringify(v47Cliff));
  // V48 real WebP: gradient must shade the bottom of an exposed wall AFTER
  // applying the texture (V47 lost this in opaque paint). Painterly islands
  // vary by face seed while raster caching and V46 water continue unchanged.
  const v48CliffDepth=await run(`(async()=>{
    const atlas=await import('./src/render/sculpt-cliff-atlas.js?rev=cliff-depth-v48');
    const image=new Image();image.src=atlas.resolveSculptCliffAtlasUrl();
    await image.decode();
    const canvas=document.createElement('canvas');
    canvas.width=145;canvas.height=235;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const colors=['#bba58e','#947968','#65595b','#414452'];
    const draw=seed=>{
      ctx.clearRect(0,0,145,235);
      ctx.fillStyle='#8f8f8f';ctx.fillRect(0,0,145,235);
      if(!atlas.drawSculptCliffAtlas(ctx,{image,rockPalette:'slate',
        colors,x:7,y:4,width:130,height:230,seed,moss:false}))
        throw Error('V48 physical atlas failed to load');
      return ctx.getImageData(0,0,145,235).data.slice();
    };
    const a=draw(3),b=draw(67);
    const sample=(data,x,y)=>[0,1,2].map(n=>data[(y*145+x)*4+n]);
    const lum=rgb=>rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;
    // Samples at 20 and 212 have identical 96px native texture phase.
    const points=[24,37,51,65,79,93,106,121];
    const top=points.reduce((sum,x)=>sum+lum(sample(a,x,20)),0)/points.length;
    const bottom=points.reduce((sum,x)=>sum+lum(sample(a,x,212)),0)/points.length;
    let variants=0;
    for(let y=40;y<193;y+=4)for(let x=20;x<127;x+=4){
      const i=(y*145+x)*4;
      if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2])variants++;
    }
    return {top,bottom,depthDifference:top-bottom,variants,
      patchCount:atlas.sculptCliffVariationPlan({width:260,height:180,seed:18}).length,
      rockMossPresent:!!document.querySelector('#rock-moss')};
  })()`);
  if(v48CliffDepth.depthDifference<18||v48CliffDepth.variants<30||
     v48CliffDepth.patchCount<2||!v48CliffDepth.rockMossPresent)
    throw Error('V48 restored post-texture depth/variety not visible in Chromium: '+JSON.stringify(v48CliffDepth));
  console.log('V48 Chromium real shaded vertical wall and irregular facet offsets:',
    JSON.stringify(v48CliffDepth));
  // V49 actual binary replacement: two native 256px source textures from
  // the original 1254px artworks, NOT resampled from V47's 96px preview.
  // Preserve the V48 shadow gradients and all three V47 decal overlays.
  const v49HD=await run(`(async()=>{
    const atlas=await import('./src/render/sculpt-cliff-atlas.js');
    const hd=await import('./src/render/sculpt-cliff-hd.js');
    const image=new Image(),hi=new Image();
    image.src=atlas.resolveSculptCliffAtlasUrl();
    hi.src=hd.resolveSculptCliffHDUrl();
    await Promise.all([image.decode(),hi.decode()]);
    const canvas=document.createElement('canvas');canvas.width=146;canvas.height=236;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const colors=['#bba58e','#947968','#65595b','#414452'];
    const draw=(palette,withHD)=>{
      ctx.clearRect(0,0,146,236);ctx.fillStyle='#929292';
      ctx.fillRect(0,0,146,236);
      if(!atlas.drawSculptCliffAtlas(ctx,{image,hdImage:withHD?hi:null,
        rockPalette:palette,colors,x:7,y:4,width:130,height:230,seed:5,moss:true}))
        throw Error('V49 material layer failed to render');
      return ctx.getImageData(0,0,146,236).data.slice();
    };
    const legacy=draw('slate',false),high=draw('slate',true);
    const ochre=draw('ochre',true);
    const at=(d,x,y)=>Array.from(d.slice((y*146+x)*4,(y*146+x)*4+3));
    const lum=p=>p[0]*.2126+p[1]*.7152+p[2]*.0722;
    let changed=0,palette=0;
    for(let y=30;y<206;y+=3)for(let x=18;x<126;x+=3){
      const a=at(legacy,x,y),b=at(high,x,y),c=at(ochre,x,y);
      if(a.join(',')!==b.join(','))changed++;
      if(b.join(',')!==c.join(','))palette++;
    }
    const xs=[27,43,59,75,91,107,119];
    const top=xs.reduce((t,x)=>t+lum(at(high,x,20)),0)/xs.length;
    const bottom=xs.reduce((t,x)=>t+lum(at(high,x,212)),0)/xs.length;
    return {sourceWidth:hi.naturalWidth,sourceHeight:hi.naturalHeight,
      hasRealPath:hi.currentSrc.endsWith('/assets/sculpt/cliff-base-hd-v49.webp'),
      regions:Object.keys(hd.SCULPT_CLIFF_HD_V49.layers),changed,palette,
      shadow:top-bottom,legacyWidth:image.naturalWidth,
      artNative:hd.SCULPT_CLIFF_HD_V49.layers.gray.width,
      cacheFlag:/rev=sculpt-(?:actor-presentation-v42|continuous-cliff-v53|rounded-hills-v54|bridge-crossing-v55|bridge-polish-v56|bridge-deck-v57)/.test(document.querySelector('script[type=module]')?.src??'')};
  })()`);
  if(v49HD.sourceWidth!==512||v49HD.sourceHeight!==256||
     !v49HD.hasRealPath||v49HD.artNative!==256||
     v49HD.changed<200||v49HD.palette<200||v49HD.shadow<8||
     !v49HD.cacheFlag||v49HD.legacyWidth!==192)
    throw Error('V49 actual HD rock WebP, shadow and palette visual regression: '+JSON.stringify(v49HD));
  console.log('V49 real committed original-image HD rock and post-texture shadow:',JSON.stringify(v49HD));
  // V38 real published path: both camera modes must redraw different actual
  // pixels without touching serialized terrain, and the screen->world inverse
  // must land a REAL browser click on the intended raised tile.
  const v38Visual=await run(`(async()=>{
    document.querySelector('#flat').click();
    const select=document.querySelector('#camera-view');
    const redraw=()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
    const pixels=()=>{const c=document.querySelector('#sculpt-canvas'),
       p=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,c.width,c.height).data;
       let sum=0;for(let i=0;i<p.length;i+=4)
         sum=(sum+Math.imul(p[i]+p[i+1]*2+p[i+2]*3,(i>>>2)%127+1))>>>0;
       return sum;};
    const saved=()=>{document.querySelector('#export').click();
      return document.querySelector('#json').value;};
    const before=saved();
    select.value='classic';select.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();const classic=pixels();
    select.value='threeQuarter';select.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();const angled=pixels();
    select.value='classic';select.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();const returned=pixels();
    select.value='threeQuarter';select.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();
    // Earlier smokes can leave object/navigation tools active; explicitly
    // return to the existing ground editor before exercising pointer picking.
    if(document.body.classList.contains('navigation-testing'))
      document.querySelector('#navigation-toggle').click();
    if(window.__sculptLabProbe().objectEditing)
      document.querySelector('#mode-objects').click();
    document.querySelector('#mode-ground').click();
    const precision=document.querySelector('#precision-mode');
    precision.checked=true;precision.dispatchEvent(new Event('change',{bubbles:true}));
    const probe=window.__sculptLabProbe();
    const projection=await import('./src/render/sculpt-camera-projection.js');
    const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    // Choose an actually clickable projected tile, not one hidden behind
    // the floating "Appliquer" precision toolbar on narrow viewports.
    let client=null,target=null,hit=null;
    // Prior real integration smokes can import a 16x12 or 18x14 map. Never
    // assume the original 36x24 demo still exists at this point of the run.
    const cols=[Math.floor(probe.width/2),Math.floor(probe.width/2)-2,
      Math.floor(probe.width/2)+2,Math.floor(probe.width/2)-4];
    const rows=[Math.floor(probe.height/2),Math.floor(probe.height/2)-2,
      Math.floor(probe.height/2)+2,Math.floor(probe.height/2)-4];
    for(const row of rows)for(const col of cols){
      if(col<0||row<0||col>=probe.width||row>=probe.height)continue;
      const x=(col+.5)*28,y=(row+.5)*21-2*18;
      const p=projection.sculptCameraProject(projection.sculptCameraView('threeQuarter'),x,y);
      const at={x:rect.left+probe.cameraPan.x+p.x*probe.zoom,
        y:rect.top+probe.cameraPan.y+p.y*probe.zoom};
      const found=document.elementFromPoint(at.x,at.y)?.id;
      if(found==='sculpt-canvas'){
        client=at;target={x:col,y:row};hit=found;break;
      }
    }
    return {classic,angled,returned,sameSave:before===saved(),
      mode:probe.cameraView,client,target,hit,
      picked:client?window.__sculptLabProbe(client).probedCell:null,
      precisionChecked:precision.checked,
      editing:probe.objectEditing,
      navigating:document.body.classList.contains('navigation-testing'),
      within:!!client};
  })()`);
  if(v38Visual.classic===v38Visual.angled||
      v38Visual.classic!==v38Visual.returned||!v38Visual.sameSave||
      v38Visual.mode!=='threeQuarter'||!v38Visual.within)
    throw Error('V38 camera visual comparison or preserved terrain failed: '+JSON.stringify(v38Visual));
  await run(`window.__v38HitTarget=${JSON.stringify(v38Visual.target)};window.__v38PointerEvents=[];
    document.querySelector('#sculpt-canvas').addEventListener('pointerdown',e=>window.__v38PointerEvents.push({type:e.type,button:e.button,x:e.clientX,y:e.clientY}));window.__v38TestClient=${JSON.stringify(v38Visual.client)};`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:v38Visual.client.x,y:v38Visual.client.y});
  await sleep(70);
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:v38Visual.client.x,y:v38Visual.client.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:v38Visual.client.x,y:v38Visual.client.y,button:'left',clickCount:1});
  const v38Pick=await run(`(()=>{
    const probe=window.__sculptLabProbe(),target=probe.precisionTarget;
    document.querySelector('#target').value='5';
    document.querySelector('#target').dispatchEvent(new Event('input',{bubbles:true}));
    const ready=!document.querySelector('#apply-precision').disabled;
    if(ready)document.querySelector('#apply-precision').click();
    document.querySelector('#export').click();
    const exportTerrain=JSON.parse(document.querySelector('#json').value);
    const requested=window.__v38HitTarget;
    const got=requested?exportTerrain.levels[requested.y*exportTerrain.width+requested.x]:null;
    const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const hit=document.elementFromPoint(window.__v38TestClient.x,window.__v38TestClient.y)?.id;
    return {target,ready,got,view:probe.cameraView,hit,
      picked:window.__sculptLabProbe(window.__v38TestClient).probedCell,
      precisionChecked:document.querySelector('#precision-mode').checked,
      surfaceEditing:probe.surfaceEditing,
      notice:document.querySelector('#notice').textContent,
      events:window.__v38PointerEvents,viewport:[innerWidth,innerHeight],
      rect:{x:rect.left,y:rect.top,width:rect.width,height:rect.height},
      pan:probe.cameraPan,zoom:probe.zoom};
  })()`);
  if(v38Pick.target?.x!==v38Visual.target.x||v38Pick.target?.y!==v38Visual.target.y||
     !v38Pick.ready||v38Pick.got!==5)
    throw Error('V38 real Canvas click painted wrong cell after camera tilt: '+
      JSON.stringify({v38Visual,v38Pick}));
  console.log('V38 Chromium camera pitch, reversible pixels, JSON and real pointer:',JSON.stringify({v38Visual,v38Pick}));
  // V39 creator pivot: default editing must be classic/easy, while the
  // published V38 projection authority now provides a live angle in Tester.
  const v39GameAngle=await run(`(async()=>{
    const camera=await import('./src/render/sculpt-camera-projection.js');
    const a90=camera.sculptCameraGameView(90),a35=camera.sculptCameraGameView(35);
    const p=camera.sculptCameraProject(a35,90,140);
    const u=camera.sculptCameraUnproject(a35,p.x,p.y);
    const roundTrip=Math.abs(u.x-90)<.00001&&Math.abs(u.y-140)<.00001;
    const pick=document.querySelector('#camera-view'),button=document.querySelector('#navigation-toggle');
    const slider=document.querySelector('#navigation-camera-angle');
    const redraw=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const pixelHash=()=>{
      const c=document.querySelector('#sculpt-canvas');
      const data=c.getContext('2d',{willReadFrequently:true})
        .getImageData(0,0,c.width,c.height).data;
      let sum=0;
      for(let i=0;i<data.length;i+=4)
        sum=(sum+Math.imul(data[i]+2*data[i+1]+3*data[i+2],(i>>>2)%127+1))>>>0;
      return sum;
    };
    const scene=()=>{document.querySelector('#scene-export').click();
      return document.querySelector('#json').value;};
    pick.value='classic';pick.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();
    const before=window.__sculptLabProbe(),editorHash=pixelHash(),saved=scene();
    button.click();await redraw();await redraw();
    slider.value='90';slider.dispatchEvent(new Event('input',{bubbles:true}));
    await redraw();await redraw();
    const top=window.__sculptLabProbe(),topNav=window.__sculptNavProbe(),topHash=pixelHash();
    slider.value='35';slider.dispatchEvent(new Event('input',{bubbles:true}));
    await redraw();await redraw();
    const oblique=window.__sculptLabProbe(),lowNav=window.__sculptNavProbe(),obliqueHash=pixelHash();
    button.click();await redraw();await redraw();
    const after=window.__sculptLabProbe(),returnedHash=pixelHash();
    return {roundTrip,topScale:a90.pitch,lowScale:a35.pitch,topShear:a90.shear,
      topAngle:top.cameraAngle,lowAngle:oblique.cameraAngle,
      topPitch:top.liveCameraPitch,lowPitch:oblique.liveCameraPitch,
      bothTesting:top.navigationTesting&&oblique.navigationTesting,
      gamePixelsDifferent:topHash!==obliqueHash,
      gameHashes:[topHash,obliqueHash],
      actorStayedInWorld:topNav.player?.x===lowNav.player?.x&&
        topNav.player?.y===lowNav.player?.y,
      editorWasClassic:before.cameraView==='classic'&&Math.abs(before.liveCameraPitch-1)<.0001,
      editorRestored:after.cameraView==='classic'&&!after.navigationTesting&&
        after.faceCount===before.faceCount&&after.undoCount===before.undoCount&&
        after.zoom===before.zoom,
      editorPixelsUnchanged:returnedHash===editorHash,
      jsonUnchanged:saved===scene(),
      label:document.querySelector('#navigation-camera-angle-value').textContent};
  })()`);
  if(!v39GameAngle.roundTrip||Math.abs(v39GameAngle.topScale-1)>.0001||
    v39GameAngle.lowScale>=.7||Math.abs(v39GameAngle.topShear)>.0001||
    v39GameAngle.topAngle!==90||v39GameAngle.lowAngle!==35||
    Math.abs(v39GameAngle.topPitch-1)>.0001||v39GameAngle.lowPitch>=.7||
    !v39GameAngle.bothTesting||!v39GameAngle.gamePixelsDifferent||
    !v39GameAngle.actorStayedInWorld||!v39GameAngle.editorWasClassic||
    !v39GameAngle.editorRestored||!v39GameAngle.editorPixelsUnchanged||
    !v39GameAngle.jsonUnchanged||v39GameAngle.label!=='35°')
    throw Error('V39 game camera angle/editor separation or real Chromium pixels failed: '+
      JSON.stringify(v39GameAngle));
  console.log('V39 Chromium game-only camera pitch, stable actor and editor:',JSON.stringify(v39GameAngle));
  // V40: the ACTUAL Tester panel, live navigation context and editor
  // scene must agree. Earlier V17/V39 real keyboard/pointer/camera gates remain.
  const v40Passability=await run(`(async()=>{
    const button=document.querySelector('#navigation-toggle');
    const slider=document.querySelector('#navigation-max-step');
    const label=document.querySelector('#navigation-max-step-value');
    const scene=()=>{document.querySelector('#scene-export').click();
      return document.querySelector('#json').value;};
    const saved=scene(),before=window.__sculptLabProbe();
    if(before.navigationTesting)return {error:'already navigating'};
    button.click();
    const initial=window.__sculptNavProbe(),
      visible=!document.querySelector('#navigation-hud').hidden;
    slider.value='1';slider.dispatchEvent(new Event('input',{bubbles:true}));
    const strict=window.__sculptNavProbe(),strictLabel=label.textContent;
    slider.value='3';slider.dispatchEvent(new Event('input',{bubbles:true}));
    const permissive=window.__sculptNavProbe(),permissiveLabel=label.textContent;
    slider.value='2';slider.dispatchEvent(new Event('input',{bubbles:true}));
    const returned=window.__sculptNavProbe();
    button.click();
    const after=window.__sculptLabProbe();
    return {initial:initial.maxStep,strict:strict.maxStep,strictLabel,
      permissive:permissive.maxStep,permissiveLabel,returned:returned.maxStep,
      visible,enabled:initial.enabled&&strict.enabled&&permissive.enabled,
      editorRestored:!after.navigationTesting&&after.cameraView===before.cameraView,
      terrainUnchanged:saved===scene()};
  })()`);
  if(v40Passability.error||v40Passability.initial!==2||
    v40Passability.strict!==1||v40Passability.permissive!==3||
    v40Passability.returned!==2||v40Passability.strictLabel!=='1'||
    v40Passability.permissiveLabel!=='3'||!v40Passability.visible||
    !v40Passability.enabled||!v40Passability.editorRestored||
    !v40Passability.terrainUnchanged)
    throw Error('V40 real Tester passability control or scene isolation failed: '+
      JSON.stringify(v40Passability));
  console.log('V40 Chromium real navigation step height UI, scene unchanged:',JSON.stringify(v40Passability));
  // V41: real Canvas background, four time-of-day choices, optional cloud/fog,
  // stars at night only, and exact editor return with no authored data changes.
  const v41Sky=await run(`(async()=>{
    const button=document.querySelector('#navigation-toggle');
    const time=document.querySelector('#navigation-sky-time');
    const clouds=document.querySelector('#navigation-sky-clouds');
    const mist=document.querySelector('#navigation-sky-mist');
    const stars=document.querySelector('#navigation-sky-stars');
    const redraw=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const sample=()=>{
      const ctx=document.querySelector('#sculpt-canvas').getContext('2d',{willReadFrequently:true});
      return Array.from(ctx.getImageData(3,3,1,1).data).slice(0,3);
    };
    const scene=()=>{document.querySelector('#scene-export').click();
      return document.querySelector('#json').value;};
    const before=window.__sculptLabProbe(),saved=scene();
    await redraw();await redraw();const editorPixel=sample();
    if(before.navigationTesting)return {error:'unexpected Tester mode at start'};
    button.click();await redraw();await redraw();
    const palette={};
    for(const value of ['morning','midday','evening','night']){
      time.value=value;time.dispatchEvent(new Event('change',{bubbles:true}));
      await redraw();await redraw();
      palette[value]={pixel:sample(),sky:window.__sculptSkyProbe()};
    }
    const paintedStars=palette.night.sky.stats.starsDrawn;
    stars.checked=false;stars.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();const starsOff=window.__sculptSkyProbe().stats.starsDrawn;
    clouds.checked=false;clouds.dispatchEvent(new Event('change',{bubbles:true}));
    mist.checked=false;mist.dispatchEvent(new Event('change',{bubbles:true}));
    await redraw();await redraw();const noWeather=window.__sculptSkyProbe().stats;
    button.click();await redraw();await redraw();
    const after=window.__sculptLabProbe(),returnPixel=sample();
    const rgb=p=>p.join(',');
    return {dayPixels:Object.fromEntries(Object.entries(palette).map(([k,v])=>[k,v.pixel])),
      uniqueColors:new Set(Object.values(palette).map(v=>rgb(v.pixel))).size,
      allOpaqueEditor:editorPixel.join(',')===returnPixel.join(','),
      editorRestored:!after.navigationTesting&&after.cameraView===before.cameraView,
      originalData:saved===scene(),
      nightStars:paintedStars,dayStars:Object.fromEntries(
        ['morning','midday','evening'].map(k=>[k,palette[k].sky.stats.starsDrawn])),
      starsOff,cloudsOff:noWeather.cloudsDrawn===0,
      mistOff:noWeather.mist===false};
  })()`);
  if(v41Sky.error||v41Sky.uniqueColors<4||v41Sky.nightStars!==72||
    Object.values(v41Sky.dayStars).some(n=>n!==0)||
    v41Sky.starsOff!==0||!v41Sky.cloudsOff||!v41Sky.mistOff||
    !v41Sky.editorRestored||!v41Sky.allOpaqueEditor||!v41Sky.originalData)
    throw Error('V41 real sky/time/night or editor separation failed: '+JSON.stringify(v41Sky));
  console.log('V41 Chromium four sky modes weather stars and editor unchanged:',JSON.stringify(v41Sky));
  // V42: real Chromium/touch-equivalent click path through existing
  // Objects -> Capture Actors palette. Never fake the app's selection API.
  const v42Setup=await run(`(async()=>{
    const projection=await import('./src/render/sculpt-camera-projection.js');
    const redraw=()=>new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const cv=document.querySelector('#camera-view');
    cv.value='classic';cv.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#flat').click();
    if(!window.__sculptLabProbe().objectEditing)document.querySelector('#mode-objects').click();
    if(!window.__sculptActorsProbe().active)document.querySelector('#actor-open').click();
    await redraw();await redraw();
    const palette=window.__sculptActorsProbe(),probe=window.__sculptLabProbe();
    if(!palette.catalogReady||!palette.definitions.length)return {error:'Capture Actor Catalog missing',palette};
    const definition=document.querySelector('#actor-definition');
    definition.value=palette.definitions[0];
    definition.dispatchEvent(new Event('change',{bubbles:true}));
    const back=[...document.querySelector('#actor-view').options].find(o=>o.value==='back');
    if(!back||back.disabled)return {error:'Capture back view not usable',palette};
    document.querySelector('#actor-action').value='place';
    document.querySelector('#actor-view').value='back';
    document.querySelector('#actor-facing').value='-1';
    const scale=document.querySelector('#actor-scale');
    scale.value='135';scale.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
    await redraw();await redraw();
    const p=window.__sculptLabProbe();
    const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    let target=null,client=null;
    const cols=[Math.floor(p.width/2),Math.floor(p.width/2)-2,Math.floor(p.width/2)+2];
    const rows=[Math.floor(p.height/2),Math.floor(p.height/2)-2,Math.floor(p.height/2)+2,Math.floor(p.height/2)-4];
    for(const row of rows){if(client)break;for(const col of cols){
      if(col<0||row<0||col>=p.width||row>=p.height)continue;
      const x=(col+.5)*28,y=(row+.5)*21-2*18;
      const point=projection.sculptCameraProject(projection.sculptCameraView('classic'),x,y);
      const at={x:rect.left+p.cameraPan.x+point.x*p.zoom,
        y:rect.top+p.cameraPan.y+point.y*p.zoom};
      if(document.elementFromPoint(at.x,at.y)?.id==='sculpt-canvas'){
        client=at;target={col,row};break;
      }
    }}
    window.__v42Target=target;window.__v42Client=client;
    return {definition:definition.value,client,target,catalogReady:palette.catalogReady,
      backEnabled:!back.disabled,initialCount:palette.count};
  })()`);
  if(v42Setup.error||!v42Setup.client||!v42Setup.backEnabled)
    throw Error('V42 Capture actor palette or drawable placement point unavailable: '+
      JSON.stringify(v42Setup));
  const clickV42=async()=>{
    const c=v42Setup.client;
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:c.x,y:c.y});
    await sleep(55);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:c.x,y:c.y,button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:c.x,y:c.y,button:'left',clickCount:1});
    await sleep(85);
  };
  await clickV42();
  const v42Placed=await run(`(()=>{
    const p=window.__sculptActorsProbe(),a=p.actors.at(-1);
    const scene=()=>{document.querySelector('#scene-export').click();
      return JSON.parse(document.querySelector('#json').value)};
    return {count:p.count,actor:a,exported:scene().actors?.at(-1)};
  })()`);
  if(v42Placed.count!==v42Setup.initialCount+1||v42Placed.actor?.visualScale!==1.35||
     v42Placed.actor?.visualView!=='back'||v42Placed.actor?.facingX!==-1||
     v42Placed.exported?.visualView!=='back')
    throw Error('V42 real Canvas placement lost Capture actor size/back: '+JSON.stringify(v42Placed));
  await run("document.querySelector('#actor-action').value='select';document.querySelector('#actor-action').dispatchEvent(new Event('change',{bubbles:true}));");
  await clickV42();
  const v42Edit=await run(`(()=>{
    const before=window.__sculptActorsProbe(),scale=document.querySelector('#actor-scale');
    scale.value='175';scale.dispatchEvent(new Event('input',{bubbles:true}));
    scale.dispatchEvent(new Event('change',{bubbles:true}));
    const view=document.querySelector('#actor-view');
    view.value='front';view.dispatchEvent(new Event('change',{bubbles:true}));
    const facing=document.querySelector('#actor-facing');
    facing.value='1';facing.dispatchEvent(new Event('change',{bubbles:true}));
    const after=window.__sculptActorsProbe(),actor=after.actors.find(a=>a.id===before.selectedId);
    const scene=()=>{document.querySelector('#scene-export').click();
      return document.querySelector('#json').value};
    const exported=JSON.parse(scene()).actors.find(a=>a.id===actor?.id);
    document.querySelector('#actor-undo').click();
    const undone=window.__sculptActorsProbe().actors.find(a=>a.id===actor?.id);
    document.querySelector('#actor-redo').click();
    const redone=window.__sculptActorsProbe().actors.find(a=>a.id===actor?.id);
    return {selectedId:before.selectedId,actor,exported,
      undoneScale:undone?.visualScale,redoneScale:redone?.visualScale,
      count:after.count,viewOptions:after.viewChoices,hasUndo:after.undoCount>0};
  })()`);
  if(v42Edit.selectedId!==v42Placed.actor.id||v42Edit.actor?.visualScale!==1.75||
    v42Edit.actor?.visualView!=='front'||v42Edit.actor?.facingX!==1||
    v42Edit.exported?.visualScale!==1.75||!v42Edit.hasUndo||
    v42Edit.redoneScale!==1.75)
    throw Error('V42 real actor select/edit/undo/export failed: '+JSON.stringify(v42Edit));
  await run("window.__v42ExportedActorId="+JSON.stringify(v42Edit.actor.id));
  const v42Imported=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const saved=document.querySelector('#json').value;
    document.querySelector('#import').click();
    const after=window.__sculptActorsProbe();
    document.querySelector('#scene-export').click();
    const sameScene=document.querySelector('#json').value===saved;
    const actor=after.actors.find(a=>a.id===window.__v42ExportedActorId);
    return {actor,afterCount:after.count,selectedId:after.selectedId,
      sameScene,undoCount:after.undoCount};
  })()`);
  if(!v42Imported.actor||v42Imported.actor.visualScale!==1.75||
    v42Imported.actor.visualView!=='front'||v42Imported.afterCount!==v42Edit.count||
    v42Imported.selectedId!==null||!v42Imported.sameScene||
    v42Imported.undoCount!==0)
    throw Error('V42 actual scene export/import or selection reset failed: '+JSON.stringify(v42Imported));
  console.log('V42 Chromium real actor placement, selection, scale and Capture views:',
    JSON.stringify({setup:v42Setup,placed:v42Placed.actor,edit:v42Edit,
      imported:v42Imported}));

  // V43: real wide landscape immersive toolbar; the old hard-coded 280px
  // squeezed Terre/Eau/Objets into illegible icons even on large phones.
  await send('Emulation.setDeviceMetricsOverride',{
    width:1100,height:620,deviceScaleFactor:1,mobile:false});
  const v43Toolbar=await run(`(()=>{ 
    if(!document.body.classList.contains('sculpt-immersive'))
      document.querySelector('#fullscreen-toggle').click();
    const bar=document.querySelector('.editor-switch');
    const br=bar.getBoundingClientRect();
    const keys=['mode-ground','mode-water','mode-objects','mode-surface',
      'navigation-toggle','new-map-toggle'];
    const nodes=keys.map(id=>document.querySelector('#'+id));
    return {immersive:document.body.classList.contains('sculpt-immersive'),
      barWidth:br.width,viewport:innerWidth,buttonWidths:nodes.map(n=>n.getBoundingClientRect().width),
      scrollWidth:bar.scrollWidth,clientWidth:bar.clientWidth};
  })()`);
  if(!v43Toolbar.immersive||v43Toolbar.barWidth<760||
     v43Toolbar.buttonWidths.some(width=>width<48))
    throw Error('V43 landscape toolbar still crammed: '+JSON.stringify(v43Toolbar));
  // Create a dry scene using the REAL public new-map form, then use mouse
  // and touch events through the native Canvas handlers, not a fake model call.
  const v43Ready=await run(`(async()=>{
    const cv=document.querySelector('#camera-view');
    cv.value='classic';cv.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#new-map-toggle').click();
    document.querySelector('#new-map-width').value='18';
    document.querySelector('#new-map-height').value='12';
    const confirm=document.querySelector('#new-map-confirm');
    confirm.checked=true;confirm.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#new-map-create').click();
    if(window.__sculptLabProbe().objectEditing)document.querySelector('#mode-objects').click();
    document.querySelector('#mode-objects').click();
    const category=document.querySelector('#object-category');
    category.value='building';category.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#object-action').value='place';
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const p=window.__sculptLabProbe(),r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    // The top painted surface is offset by two levels (18px each).
    const col=9,row=6,x=(col+.5)*28,y=(row+.5)*21-36;
    const client={x:r.left+p.cameraPan.x+x*p.zoom,
      y:r.top+p.cameraPan.y+y*p.zoom};
    return {client,p,hit:document.elementFromPoint(client.x,client.y)?.id};
  })()`);
  if(v43Ready.hit!=='sculpt-canvas')
    throw Error('V43 dry scene target hidden under UI: '+JSON.stringify(v43Ready));
  const v43Mouse=async(type,point,buttons=0)=>send('Input.dispatchMouseEvent',{
    type,x:point.x,y:point.y,button:buttons?'left':'none',buttons,
    ...(type==='mousePressed'||type==='mouseReleased'?{button:'left',clickCount:1}:{})});
  const originalPoint=v43Ready.client;
  await v43Mouse('mouseMoved',originalPoint);
  await v43Mouse('mousePressed',originalPoint,1);
  await v43Mouse('mouseReleased',originalPoint);
  const v43Placed=await run('window.__sculptObjectsProbe()');
  if(v43Placed.count!==1)throw Error('V43 placement failed: '+JSON.stringify(v43Placed));
  await run("document.querySelector('#object-action').value='select';"+
    "document.querySelector('#object-action').dispatchEvent(new Event('change',{bubbles:true}));");
  const dest={x:originalPoint.x+64,y:originalPoint.y+20};
  await v43Mouse('mouseMoved',originalPoint);
  await v43Mouse('mousePressed',originalPoint,1);
  for(const f of [.25,.5,.75,1]){
    await v43Mouse('mouseMoved',{x:originalPoint.x+(dest.x-originalPoint.x)*f,
      y:originalPoint.y+(dest.y-originalPoint.y)*f},1);
    await sleep(30);
  }
  await v43Mouse('mouseReleased',dest);
  const v43Moved=await run(`(()=>{const p=window.__sculptObjectsProbe();
    document.querySelector('#scene-export').click();
    return {...p,exported:JSON.parse(document.querySelector('#json').value).objects[0]};
  })()`);
  const oldPosition=v43Placed.objects[0],newPosition=v43Moved.objects[0];
  const expectedDx=64/v43Ready.p.zoom,expectedDy=20/v43Ready.p.zoom;
  if(v43Moved.selectedId!==oldPosition.id||
     v43Moved.count!==1||v43Moved.undoCount!==v43Placed.undoCount+1||
     Math.abs(newPosition.x-oldPosition.x-expectedDx)>.08||
     Math.abs(newPosition.y-oldPosition.y-expectedDy)>.08||
     Math.abs(v43Moved.exported.transform.x-newPosition.x)>.00001)
    throw Error('V43 real pointer drag/export/projection/undo failed: '+
      JSON.stringify({v43Ready,v43Placed,v43Moved,expectedDx,expectedDy}));
  const v43UndoRedo=await run(`(()=>{
    document.querySelector('#object-undo').click();
    const undo=window.__sculptObjectsProbe().objects[0];
    document.querySelector('#object-redo').click();
    return {undo,redo:window.__sculptObjectsProbe().objects[0]};
  })()`);
  if(Math.abs(v43UndoRedo.undo.x-oldPosition.x)>.0001||
     Math.abs(v43UndoRedo.undo.y-oldPosition.y)>.0001||
     Math.abs(v43UndoRedo.redo.x-newPosition.x)>.0001||
     Math.abs(v43UndoRedo.redo.y-newPosition.y)>.0001)
    throw Error('V43 one-action undo/redo for drag failed: '+JSON.stringify(v43UndoRedo));
  const unchangedBeforeCancel=await run('window.__sculptObjectsProbe()');
  const v43TouchStart={x:dest.x,y:dest.y};
  const v43TouchMove={x:dest.x+33,y:dest.y-12};
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...v43TouchStart,id:7}]});
  await send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...v43TouchMove,id:7}]});
  await send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
  const v43Cancelled=await run('window.__sculptObjectsProbe()');
  if(Math.abs(v43Cancelled.objects[0].x-newPosition.x)>.0001||
     Math.abs(v43Cancelled.objects[0].y-newPosition.y)>.0001||
     v43Cancelled.undoCount!==unchangedBeforeCancel.undoCount)
    throw Error('V43 pointercancel must restore object with no extra undo: '+
      JSON.stringify({v43Cancelled,unchangedBeforeCancel}));
  console.log('V43 Chromium landscape toolbar, real mouse drag, touch cancel and undo:',
    JSON.stringify({bar:v43Toolbar,oldPosition,newPosition,
      undoRedo:v43UndoRedo,cancelled:v43Cancelled.objects[0]}));
  // V44: the V43 drag got choppy on real phones because every pointer move
  // rebuilt the full sculpt map and hit-tests used invisible ground cells.
  // Import an elevated object, tap its visible rotated silhouette, then drag:
  // the native selection must work and cached ground must NOT re-render.
  const v44Setup=await run(`(async()=>{
    document.querySelector('#scene-export').click();
    const raw=JSON.parse(document.querySelector('#json').value);
    const o=raw.objects[0];
    const col=Math.floor(o.transform.x/28),row=Math.floor(o.transform.y/21);
    raw.terrain.levels[row*raw.terrain.width+col]=5;
    o.transform.rotationDeg=45;
    document.querySelector('#json').value=JSON.stringify(raw);
    document.querySelector('#import').click();
    const editor=document.querySelector('#camera-view');
    editor.value='classic';editor.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#object-action').value='select';
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const projection=await import('./src/render/sculpt-object-picking.js');
    const world=(await import('./src/world/world-object-placement-model.js'));
    const catalog=(await import('./src/objects/object-definition-catalog.js'));
    const model=(await import('./src/world/sculpt-height-model.js'));
    const r=world.resolveWorldObjectPlacements(raw.objects,catalog.objectDefinitionCatalogV1)[0];
    const terrain=model.importSculptTerrain(raw.terrain);
    const rect=projection.sculptObjectVisualRect(r,terrain);
    const p=window.__sculptLabProbe();
    const bounds=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const rad=Math.PI/4,localY=-rect.height*.23;
    const visual={x:rect.x-localY*Math.sin(rad),y:rect.y+localY*Math.cos(rad)};
    const at={x:bounds.left+p.cameraPan.x+visual.x*p.zoom,
      y:bounds.top+p.cameraPan.y+visual.y*p.zoom};
    return {at,visual,rect,hit:document.elementFromPoint(at.x,at.y)?.id,
      id:r.id,builds:window.__sculptObjectsProbe().terrainRasterBuilds,
      old:raw.objects[0].transform};
  })()`);
  if(v44Setup.hit!=='sculpt-canvas')
    throw Error('V44 raised rotated object visual selection target hidden: '+JSON.stringify(v44Setup));
  await v43Mouse('mouseMoved',v44Setup.at);
  await v43Mouse('mousePressed',v44Setup.at,1);
  await v43Mouse('mouseReleased',v44Setup.at);
  const v44Picked=await run('window.__sculptObjectsProbe()');
  if(v44Picked.selectedId!==v44Setup.id||v44Picked.count!==1)
    throw Error('V44 real visual hit missed raised rotated object: '+JSON.stringify({v44Setup,v44Picked}));
  const nextV44={x:v44Setup.at.x+35,y:v44Setup.at.y+15};
  await v43Mouse('mouseMoved',v44Setup.at);
  await v43Mouse('mousePressed',v44Setup.at,1);
  for(let i=1;i<=12;i++){
    await v43Mouse('mouseMoved',{
      x:v44Setup.at.x+(nextV44.x-v44Setup.at.x)*i/12,
      y:v44Setup.at.y+(nextV44.y-v44Setup.at.y)*i/12},1);
  }
  await v43Mouse('mouseReleased',nextV44);
  const v44Moved=await run(`(async()=>{
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const state=window.__sculptObjectsProbe();
    document.querySelector('#scene-export').click();
    return {...state,exported:JSON.parse(document.querySelector('#json').value).objects[0]};
  })()`);
  if(v44Moved.terrainRasterBuilds!==v44Picked.terrainRasterBuilds||
     v44Picked.terrainRasterBuilds!==v44Setup.builds||
     v44Moved.selectedId!==v44Setup.id||
     v44Moved.undoCount!==v44Picked.undoCount+1||
     Math.abs(v44Moved.objects[0].x-v44Setup.old.x-35/v43Ready.p.zoom)>.09||
     Math.abs(v44Moved.exported.transform.x-v44Moved.objects[0].x)>.0001)
    throw Error('V44 mobile fast drag hit/cache/export regression: '+
      JSON.stringify({v44Setup,v44Picked,v44Moved}));
  console.log('V44 Chromium raised rotated sprite touch and cached mobile drag:',
    JSON.stringify({spriteHit:v44Picked.selectedId,groundBuilds:v44Moved.terrainRasterBuilds,
      dragged:v44Moved.objects[0],picks:v44Picked.count}));
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
