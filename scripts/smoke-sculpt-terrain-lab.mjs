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
  await send('Input.dispatchKeyEvent',
    {type:'keyDown',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  await sleep(420);
  await send('Input.dispatchKeyEvent',
    {type:'keyUp',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
  const afterKeyboard=await run('window.__sculptNavProbe()');
  if(afterKeyboard.player.x-navStart.before.player.x<35||!afterKeyboard.terrainCached)
    throw Error('V17 keyboard does not reach existing Exploration movement: '+JSON.stringify(afterKeyboard));
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
