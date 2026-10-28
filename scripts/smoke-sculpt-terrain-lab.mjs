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

  // R14 real Chromium gate: legacy rounded height data may still load,
  // but all four grass corners of the square hill render as square grass.
  const squareGate=await run(`(async()=>{
    const mod=await import('./src/render/sculpt-height-renderer.js');
    const m=await import('./src/world/sculpt-height-model.js');
    const W=14,H=14,levels=Array(W*H).fill(2);
    for(let y=6;y<=9;y++)for(let x=4;x<=7;x++)levels[y*W+x]=5;
    const original=m.createSculptTerrain({width:W,height:H,levels});
    const legacy=m.applySculptStroke(original,{mode:'cliff-round',rockRoundness:150,
      radius:.5,points:[{x:5.5,y:7.5}]});
    const paint=t=>{
      const canvas=document.createElement('canvas');
      canvas.width=W*28;canvas.height=H*21+7*18;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      const result=mod.drawSculptTerrain(ctx,{terrain:t,
        material:{render:{baseColor:'#528d42'}},rockPalette:'warm'});
      return {ctx,result,data:ctx.getImageData(0,0,canvas.width,canvas.height).data};
    };
    const a=paint(original),b=paint(legacy);
    let different=0;
    for(let k=0;k<a.data.length;k+=4)
      if(a.data[k]!==b.data[k]||a.data[k+1]!==b.data[k+1]||a.data[k+2]!==b.data[k+2])different++;
    const greens=[[4,6,2,2],[7,6,26,2],[4,9,2,19],[7,9,26,19]].map(([x,y,dx,dy])=>{
      const p=b.ctx.getImageData(x*28+dx,y*21-5*18+dy,1,1).data;
      return p[1]>p[0]&&p[1]>p[2];
    });
    const modes=[...document.querySelectorAll('#ground-tools [data-mode]')].map(e=>e.dataset.mode);
    return {different,greens,modes,unchangedHeight:JSON.stringify(legacy.levels)===JSON.stringify(original.levels),
      legacySaved:legacy.roundness[7*W+5]===150,
      runCountEqual:a.result.faceRuns===b.result.faceRuns,
      sphereControl:modes.includes('sphere-hill'),waterSmooth:!!document.querySelector('[data-mode=water-smooth]')};
  })()`);
  if(squareGate.different!==0||squareGate.greens.includes(false)||
      squareGate.modes.includes('smooth')||squareGate.modes.includes('cliff-round')||
      !squareGate.unchangedHeight||!squareGate.legacySaved||!squareGate.runCountEqual||
      !squareGate.sphereControl||!squareGate.waterSmooth)
    throw Error('R14 square grass corners/browser controls regression: '+JSON.stringify(squareGate));
  console.log('R14 square corners and legacy JSON in real Chromium:',JSON.stringify(squareGate));

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
    const length=document.querySelector('#object-bridge-length');
    const width=document.querySelector('#object-bridge-width');
    // V72: the 250% legacy V51 fixture now uses explicit independent axes.
    length.value='250';length.dispatchEvent(new Event('input',{bubbles:true}));
    width.value='250';width.dispatchEvent(new Event('input',{bubbles:true}));
    return {choices,views,sceneObjects:saved.objects.length,scaleMax:length.max,
      lengthVisible:!document.querySelector('#object-bridge-length-wrap').hidden,
      widthVisible:!document.querySelector('#object-bridge-width-wrap').hidden,
      category:window.__sculptObjectsProbe().categories};
  })()`);
  if(!bridgePicker.category.includes('bridge')||bridgePicker.choices.filter(x=>
      x.includes('_2p5d.')).length!==7||
      bridgePicker.views.join(',')!=='horizontal,vertical,diagonal_left,diagonal_right'||
      bridgePicker.scaleMax!=='300'||!bridgePicker.lengthVisible||!bridgePicker.widthVisible)
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
  // V63 real Chromium: use the ACTUAL bridge placed at 250% by the Objects
  // palette (not a fabricated mock) and compare its displayed rectangle to
  // the canonical WorldObject corridor. Former renderer used 96x96 square.
  const v63RealScale=await run(`(async()=>{
    const placements=await import('./src/world/world-object-placement-model.js?rev=sculpt-bridge-crossing-v55');
    const worldObject=await import('./src/world/world-object-model.js?rev=sculpt-bridge-crossing-v55');
    const drawing=await import('./src/render/sculpt-object-picking.js?rev=sculpt-bridge-dimensions-v63');
    document.querySelector('#scene-export').click();
    const scene=JSON.parse(document.querySelector('#json').value);
    const placed=scene.objects.find(o=>o.objectDefinitionId==='objectdef.bridge.wood_rustic_2p5d.01');
    const bridge=placements.resolveWorldObjectPlacements([placed])[0];
    const rect=drawing.sculptObjectVisualRect(bridge,scene.terrain);
    const crossing=worldObject.bridgeTraversalRect(bridge);
    return {width:rect.width,height:rect.height,length:crossing.length,
      across:crossing.width,scale:placed.transform.scaleX};
  })()`);
  if(v63RealScale.scale!==2.5||
     Math.abs(v63RealScale.width-425)>0.01||
     Math.abs(v63RealScale.height-240)>0.01||
     Math.abs(v63RealScale.length/v63RealScale.width-.92)>0.01||
     Math.abs(v63RealScale.across/v63RealScale.height-.35)>0.01)
    throw Error('V63 real visible bridge sprite dimensions diverge from crossing at 250%: '+
      JSON.stringify(v63RealScale));
  console.log('V63 browser bridge 250% visual/physical aspect agrees:',JSON.stringify(v63RealScale));
  // V64 real pointer/selection/DRAG on a fully wet scene. The old editor
  // refused every pointermove across water, although the same bridge could
  // be placed there. Exercise the user-facing workflow, no synthetic model.
  const v64BridgeDrag=await run(`(async()=>{
    const camera=await import('./src/render/sculpt-camera-projection.js');
    const picking=await import('./src/render/sculpt-object-picking.js?rev=sculpt-bridge-dimensions-v63');
    const world=await import('./src/world/world-object-placement-model.js?rev=sculpt-bridge-crossing-v55');
    const model=await import('./src/world/sculpt-height-model.js');
    const editor=document.querySelector('#camera-view');
    editor.value='classic';editor.dispatchEvent(new Event('change',{bubbles:true}));
    const select=document.querySelector('#object-action');select.value='select';
    select.dispatchEvent(new Event('change',{bubbles:true}));
    const canvas=document.querySelector('#sculpt-canvas');
    canvas.scrollIntoView({block:'center',behavior:'instant'});
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    document.querySelector('#scene-export').click();
    const scene=JSON.parse(document.querySelector('#json').value);
    // The phone's Objects palette overlays the right of the Canvas.
    // Move only the test fixture bridge to an actually tappable left-side
    // position through the public scene Import action, not any editor API.
    const placement=scene.objects.find(o=>o.objectDefinitionId==='objectdef.bridge.wood_rustic_2p5d.01');
    placement.transform.x=Math.max(80,placement.transform.x-300);
    document.querySelector('#json').value=JSON.stringify(scene);
    document.querySelector('#import').click();
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const o=world.resolveWorldObjectPlacements([placement])[0];
    const visual=picking.sculptObjectVisualRect(o,model.importSculptTerrain(scene.terrain));
    const p=window.__sculptLabProbe(),bounds=canvas.getBoundingClientRect();
    const candidates=[0,-.12,-.23,.12].map(f=>{
      const v=camera.sculptCameraProject(camera.sculptCameraView('classic'),
        visual.x,visual.y+visual.height*f);
      const at={x:bounds.left+p.cameraPan.x+v.x*p.zoom,
        y:bounds.top+p.cameraPan.y+v.y*p.zoom};
      return {...at,hit:document.elementFromPoint(at.x,at.y)?.id};
    });
    return {at:candidates.find(c=>c.hit==='sculpt-canvas'),candidates,
      originalX:placement.transform.x,originalY:placement.transform.y,
      originalScale:placement.transform.scaleX,id:placement.id};
  })()`);
  if(!v64BridgeDrag.at)throw Error('V64 bridge drag target hidden: '+JSON.stringify(v64BridgeDrag));
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:v64BridgeDrag.at.x,y:v64BridgeDrag.at.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:v64BridgeDrag.at.x,y:v64BridgeDrag.at.y,button:'left',clickCount:1});
  const v64DragEnd={x:v64BridgeDrag.at.x+24,y:v64BridgeDrag.at.y};
  for(let k=1;k<=8;k++)await send('Input.dispatchMouseEvent',{
    type:'mouseMoved',x:v64BridgeDrag.at.x+24*k/8,y:v64BridgeDrag.at.y,
    button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:v64DragEnd.x,y:v64DragEnd.y,button:'left',clickCount:1});
  const v64Moved=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const scene=JSON.parse(document.querySelector('#json').value);
    const placement=scene.objects.find(o=>o.id===${JSON.stringify(v64BridgeDrag.id)});
    const probe=window.__sculptObjectsProbe();
    return {x:placement?.transform.x,y:placement?.transform.y,
      scale:placement?.transform.scaleX,selected:probe.selectedId};
  })()`);
  if(!(v64Moved.x>v64BridgeDrag.originalX+2)||
     v64Moved.scale!==v64BridgeDrag.originalScale)
    throw Error('V64 real wet bridge drag did not edit WorldObject center or lost scale: '+
      JSON.stringify({v64BridgeDrag,v64Moved}));
  console.log('V64 Chromium real 250% water bridge selected and dragged:',JSON.stringify(v64Moved));
  // V72 browser gate: use the REAL selected bridge after drag, operate each
  // visible slider and change the visual orientation before scene export.
  const v72Dimensions=await run(`(async()=>{
    const length=document.querySelector('#object-bridge-length');
    const width=document.querySelector('#object-bridge-width');
    const variant=document.querySelector('#object-variant');
    const probe=window.__sculptObjectsProbe();
    if(!probe.bridgeDimensionsVisible||!probe.selectedId)
      return {error:'selected bridge controls hidden',probe};
    length.value='200';length.dispatchEvent(new Event('input',{bubbles:true}));
    length.dispatchEvent(new Event('change',{bubbles:true}));
    width.value='70';width.dispatchEvent(new Event('input',{bubbles:true}));
    width.dispatchEvent(new Event('change',{bubbles:true}));
    variant.value='vertical';variant.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#scene-export').click();
    const scene=JSON.parse(document.querySelector('#json').value);
    const placement=scene.objects.find(o=>o.id===window.__sculptObjectsProbe().selectedId);
    const placements=await import('./src/world/world-object-placement-model.js');
    const model=await import('./src/world/world-object-model.js');
    const drawing=await import('./src/render/sculpt-object-picking.js');
    const h=await import('./src/world/sculpt-height-model.js');
    const bridge=placements.resolveWorldObjectPlacements([placement])[0];
    const sprite=drawing.sculptObjectVisualRect(bridge,h.importSculptTerrain(scene.terrain));
    const deck=model.bridgeTraversalRect(bridge);
    // V73: real selected vertical bridge in Chromium must repaint ONLY the
    // left/right rail strips, not a full-width plank band over the hero.
    const masker=await import('./src/render/sculpt-bridge-deck-layers.js?rev=sculpt-bridge-deck-anchor-v67-mask-v68-vertical-v73');
    const lift=masker.sculptBridgeDeckArtShift(sprite,bridge);
    const strips=masker.sculptBridgeForegroundRegions(sprite,lift,bridge);
    const covers=(r,x,y)=>x>=r.x&&x<=r.x+r.width&&y>=r.y&&y<=r.y+r.height;
    return {selected:window.__sculptObjectsProbe().selectedId,
      x:placement.transform.scaleX,y:placement.transform.scaleY,
      variant:bridge.visual.variantId,
      sprite:{width:sprite.width,height:sprite.height},
      deck:{length:deck.length,width:deck.width},
      verticalRailPass:{count:strips.length,
        leftRail:strips.some(r=>covers(r,-sprite.width*.45,sprite.height*.2)),
        rightRail:strips.some(r=>covers(r,sprite.width*.45,sprite.height*.2)),
        centerBoardsRepainted:strips.some(r=>covers(r,0,sprite.height*.2))}};
  })()`);
  if(v72Dimensions.selected!==v64BridgeDrag.id||
    v72Dimensions.x!==2||v72Dimensions.y!==.7||
    v72Dimensions.variant!=='vertical'||
    Math.abs(v72Dimensions.sprite.width-96*.7)>.01||
    Math.abs(v72Dimensions.sprite.height-170*2)>.01||
    Math.abs(v72Dimensions.deck.width-96*.7*.35)>.01||
    Math.abs(v72Dimensions.deck.length-170*2*.92)>.01||
    v72Dimensions.verticalRailPass.count!==2||
    !v72Dimensions.verticalRailPass.leftRail||
    !v72Dimensions.verticalRailPass.rightRail||
    v72Dimensions.verticalRailPass.centerBoardsRepainted)
    throw Error('V72 selected bridge dimensions or vertical geometry diverged: '+
      JSON.stringify(v72Dimensions));
  console.log('V72 Chromium independent length/width and vertical bitmap PASS:',JSON.stringify(v72Dimensions));
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
    document.querySelector('#surface-family').value='road';
    const base=document.querySelector('#surface-base-family');
    base.value='mountain';base.dispatchEvent(new Event('change',{bubbles:true}));
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
  if(v27Road.routes!==1||v27Road.zones!==0||v27Road.features[0].materialId!=='road.dirt'||
     v27Road.features[0].terrainFamilyId!=='road'||v27Road.baseTerrainFamilyId!=='mountain')
    throw Error('V27 real mouse stroke did not author WorldSurface road: '+JSON.stringify(v27Road));
  await run("document.querySelector('#surface-undo').click()");
  if((await run('window.__sculptSurfaceProbe().routes'))!==0)
    throw Error('V27 undo did not remove surface route');
  await run("document.querySelector('#surface-redo').click()");
  if((await run('window.__sculptSurfaceProbe().routes'))!==1)
    throw Error('V27 redo did not restore surface route');
  await run(`(()=>{
    document.querySelector('#surface-material').value='ground.sand';
    document.querySelector('#surface-family').value='snow';
    return true;
  })()`);
  await paintSurface(v27Ready.zone,v27Ready.zone);
  const v27Zone=await run('window.__sculptSurfaceProbe()');
  if(v27Zone.zones!==1||v27Zone.features[1].materialId!=='ground.sand'||
     v27Zone.features[1].terrainFamilyId!=='snow')
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
      v27Visual.scene.surface.baseTerrainFamilyId!=='mountain'||
      v27Visual.scene.surface.zones[0].terrainFamilyId!=='snow'||
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
  if(v27Reload.routes!==1||v27Reload.zones!==1||
     v27Reload.baseTerrainFamilyId!=='mountain'||
     v27Reload.features[1].terrainFamilyId!=='snow')
    throw Error('V27 imported WorldSurface routes/zones lost: '+JSON.stringify(v27Reload));
  const v27Clean=await run(`(()=>{
    document.querySelector('#new-map-toggle').click();
    const c=document.querySelector('#new-map-confirm');
    c.checked=true;c.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#new-map-create').click();
    return {paint:window.__sculptSurfaceProbe(),lab:window.__sculptLabProbe()};
  })()`);
  if(v27Clean.paint.routes||v27Clean.paint.zones||
     v27Clean.paint.baseTerrainFamilyId!=='forest'||
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
      cacheFlag:/rev=sculpt-(?:actor-presentation-v42|continuous-cliff-v53|rounded-hills-v54|bridge-crossing-v55|bridge-polish-v56|bridge-deck-v57|bridge-foot-clean-v58|hill-shoulder-v59|bridge-crossing-v60|whole-hill-v61|bridge-bank-v62|high-platform-bridge-v63|bridge-tactile-v64|bridge-camera-v65|bridge-input-v66|bridge-deck-anchor-v67)/.test(document.querySelector('script[type=module]')?.src??'')};
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
      visible,sliderDisabled:slider.disabled,sliderMin:slider.min,sliderMax:slider.max,
      enabled:initial.enabled&&strict.enabled&&permissive.enabled,
      editorRestored:!after.navigationTesting&&after.cameraView===before.cameraView,
      terrainUnchanged:saved===scene()};
  })()`);
  // V75: attempts to set the obsolete height slider to 1 or 3 MUST NOT
  // grant free climbing. Its value is displayed as zero and it is disabled.
  if(v40Passability.error||v40Passability.initial!==0||
    v40Passability.strict!==0||v40Passability.permissive!==0||
    v40Passability.returned!==0||v40Passability.strictLabel!=='0'||
    v40Passability.permissiveLabel!=='0'||!v40Passability.sliderDisabled||
    v40Passability.sliderMin!=='0'||v40Passability.sliderMax!=='0'||
    !v40Passability.visible||!v40Passability.enabled||
    !v40Passability.editorRestored||!v40Passability.terrainUnchanged)
    throw Error('V75 real Tester must NOT enable free-cliff traversal: '+
      JSON.stringify(v40Passability));
  console.log('V75 Chromium fixed no-cliff height HUD, scene unchanged:',JSON.stringify(v40Passability));
  // V75 R2: reproduce the Pixel north-entry report in real Chromium, using
  // the same browser-loaded movement + Collision World contract as the Tester.
  const v75North=await run(`(async()=>{
    const {createSculptTerrain}=await import('./src/world/sculpt-height-model.js');
    const {stepMovement}=await import('./src/core/movement.js?rev=bridge-grade-v69-deck-v70-rails-v71-north-r2');
    const {sculptNavigationRoute}=await import('./src/core/sculpt-navigation-collision.js?rev=sculpt-bridge-crossing-v60-grade-v69-deck-v70-rails-v71-cliff-lock-v75-north-r2');
    const w=12,h=12,levels=Array.from({length:w*h},(_,i)=>{
      const x=i%w,y=Math.floor(i/w);
      return x>=4&&x<=7&&y>=8&&y<=10?6:2;
    });
    const terrain=createSculptTerrain({width:w,height:h,levels});
    const cfg={terrain,cellWidth:28,cellHeight:21,projectionRise:18,
      maxStepUp:0,maxStepDown:0,bridges:[]};
    const world={width:w*28,height:h*21,objects:[],obstacles:[]};
    const y0=8*21-(6-2)*18-10,y1=y0+18;
    const actual=[];
    for(const angle of ['35','55','80','90']){
      const slider=document.querySelector('#navigation-camera-angle');
      slider.value=angle;slider.dispatchEvent(new Event('input',{bubbles:true}));
      const actor={x:154,y:y0,radius:5,locomotion:{modes:['ground']}};
      const denial=sculptNavigationRoute(cfg,actor,actor.x,y1).reason;
      stepMovement(world,actor,{x:0,y:1},1,{maxSpeed:18},undefined,{sculptNavigation:cfg});
      const fly={x:154,y:y0,radius:5,locomotion:{modes:['fly']}};
      stepMovement(world,fly,{x:0,y:1},1,{maxSpeed:18},undefined,{sculptNavigation:cfg});
      actual.push({angle,block:denial?.kind,stopped:actor.y===y0,fly:fly.y===y1});
    }
    return {actual,stillUsingCanonicalScene:window.__sculptLabProbe().schemaVersion!==0};
  })()`);
  if(v75North.actual.length!==4||v75North.actual.some(o=>
    o.block!=='cliff-projection'||!o.stopped||!o.fly))
    throw Error('V75 R2 real Chromium north-wall movement regression: '+JSON.stringify(v75North));
  console.log('V75 R2 Chromium north cliff 35/55/80/90 deg, pedestrian blocked, flight allowed:',JSON.stringify(v75North));
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
  // R14 removes V61 rounded-height UI; equivalent native Canvas gate now
  // checks import-compatible square grass and no brown corners above.
  // V66 REAL Chrome: the same UP key must move vertically on SCREEN at
  // either camera angle, at comparable *visible* speed. This deliberately
  // exercises a real key event -> nav loop -> stepMovement -> Collision World.
  const v66Start=await run(`(()=>{
    document.querySelector('#flat').click();
    const speed=document.querySelector('#navigation-speed');
    speed.value='90';speed.dispatchEvent(new Event('input',{bubbles:true}));
    if(!window.__sculptNavProbe().enabled)
      document.querySelector('#navigation-toggle').click();
    const diagnostic=document.querySelector('#navigation-show-bridge-corridor');
    diagnostic.checked=true;diagnostic.dispatchEvent(new Event('change',{bubbles:true}));
    return {enabled:window.__sculptNavProbe().enabled,
      overlay:window.__sculptNavProbe().bridgeCorridorVisible};
  })()`);
  if(!v66Start.enabled||!v66Start.overlay)
    throw Error('V66 real navigation screen-space diagnostic toggle failed: '+JSON.stringify(v66Start));
  const v66Results=[];
  for(const angle of [35,90]){
    const initial=await run(`(()=>{
      const a=document.querySelector('#navigation-camera-angle');
      a.value='${angle}';a.dispatchEvent(new Event('input',{bubbles:true}));
      document.querySelector('#navigation-reset').click();
      document.activeElement?.blur?.();
      return window.__sculptNavProbe().player;
    })()`);
    const inputTimeBefore=await run('window.__sculptNavProbe().inputElapsedMs');
    await run(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));true`);
    await sleep(135);
    await run(`window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowUp',bubbles:true}));true`);
    const current=await run(`window.__sculptNavProbe().player`);
    const inputTimeAfter=await run('window.__sculptNavProbe().inputElapsedMs');
    const projection=await run(`(async()=>{
      const p=await import('./src/render/sculpt-camera-projection.js');
      const view=p.sculptCameraGameView(${angle});
      const a=p.sculptCameraProject(view,${initial.x},${initial.y});
      const b=p.sculptCameraProject(view,${current.x},${current.y});
      return {dx:b.x-a.x,dy:b.y-a.y};
    })()`);
    const consumedMs=inputTimeAfter-inputTimeBefore;
    const v={angle,initial,current,screenDelta:projection,
      consumedMovementMs:consumedMs,
      projectedSpeed:consumedMs>0?-projection.dy*1000/consumedMs:0};
    v66Results.push(v);
    if(consumedMs<30||projection.dy>-1||Math.abs(projection.dx)>Math.abs(projection.dy)*.1)
      throw Error('V66 actual key travel not screen-aligned or RAF input absent: '+JSON.stringify(v));
  }
  // Compare pixel speeds per *actual movement RAF time*. Wall-clock sleep is
  // not a simulation clock: on busy GitHub runners the browser can process
  // 2 frames for one camera and 8 for the next during the same 135ms sleep.
  // This keeps the original real keyboard->Collision World gate intact,
  // without relaxing the speed regression tolerance to conceal a failure.
  if(Math.abs(v66Results[0].projectedSpeed/v66Results[1].projectedSpeed-1)>.25)
    throw Error('V66 camera pitch changes actual visible movement speed: '+JSON.stringify(v66Results));
  await run(`document.querySelector('#navigation-toggle').click();true`);
  console.log('V66 real keydown->Movement->Collision World camera view 35°/90°:',JSON.stringify(v66Results));
  // V67 real bridge crossing, unlike the earlier synthetic corridor tests:
  // import a deep wet gorge + native bridge, then HOLD actual keyboard input
  // until the hero reaches the other bank. Repeat at both camera angles.
  const v67Setup=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js');
    const scene=await import('./src/world/sculpt-scene-preview.js');
    const width=20,height=12,levels=Array(width*height).fill(6),
      waterLevels=Array(width*height).fill(-1);
    for(let y=2;y<10;y++)for(const x of [5,6,7]){
      levels[y*width+x]=0;waterLevels[y*width+x]=8;
    }
    const terrain=model.createSculptTerrain({width,height,levels,waterLevels});
    const objects=scene.appendSculptPreviewObject([],
      {definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
       x:6.5*28,y:3.5*21,scale:1.3,variantId:'horizontal'});
    document.querySelector('#json').value=scene.serializeSculptPreviewScene(terrain,objects);
    document.querySelector('#import').click();
    const speed=document.querySelector('#navigation-speed');
    speed.value='150';speed.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#navigation-show-bridge-corridor').checked=true;
    document.querySelector('#scene-export').click();
    window.__v67OriginalScene=document.querySelector('#json').value;
    const saved=JSON.parse(window.__v67OriginalScene).terrain;
    return {objects:window.__sculptObjectsProbe().count,
      wet:saved.waterLevels.filter((level,i)=>level>saved.levels[i]).length};
  })()`);
  if(v67Setup.objects!==1||v67Setup.wet<16)
    throw Error('V67 real bridge crossing fixture failed: '+JSON.stringify(v67Setup));
  const v67Crossings=[];
  for(const angle of [35,90]){
    const start=await run(`(()=>{
      const a=document.querySelector('#navigation-camera-angle');
      a.value='${angle}';a.dispatchEvent(new Event('input',{bubbles:true}));
      if(!window.__sculptNavProbe().enabled)
        document.querySelector('#navigation-toggle').click();
      document.querySelector('#navigation-reset').click();
      document.activeElement?.blur?.();
      return window.__sculptNavProbe();
    })()`);
    await run(`window.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));true`);
    await sleep(780);
    const middle=await run(`window.__sculptNavProbe()`);
    await sleep(640);
    await run(`window.dispatchEvent(new KeyboardEvent('keyup',{key:'ArrowRight',bubbles:true}));true`);
    const end=await run(`window.__sculptNavProbe()`);
    const trial={angle,start:start.player,middle:middle.player,
      deckAtMiddle:middle.deckBridgeId,end:end.player,endReason:end.blockReason};
    v67Crossings.push(trial);
    if(!trial.start||!trial.middle||!trial.end||
       !trial.deckAtMiddle||trial.middle.x<=5*28||trial.end.x<=8*28)
      throw Error('V67 real bridge route fails across deep water: '+JSON.stringify(trial));
    await run(`document.querySelector('#navigation-toggle').click();true`);
  }
  const v67Persist=await run(`(()=>{
    document.querySelector('#scene-export').click();
    return document.querySelector('#json').value===window.__v67OriginalScene;
  })()`);
  if(!v67Persist)throw Error('V67 actual bridge travel mutated saved terrain/objects');
  console.log('V67 REAL Chromium hero crosses deep gorge bridge at 35° and 90°:',
    JSON.stringify(v67Crossings));
  // V76 real Chromium: one actual pointer gesture creates a continuous
  // spherical hill in the existing Sculpt editor; Undo/Redo and scene export
  // must retain EXACT same canonical geometry, without changing old tiles.
  const v76Setup=await run(`(async()=>{
    const m=await import('./src/world/sculpt-height-model.js');
    const sc=await import('./src/world/sculpt-scene-preview.js');
    document.querySelector('#navigation-toggle')?.getAttribute('aria-pressed')==='true'&&
      document.querySelector('#navigation-toggle').click();
    document.querySelector('#json').value=sc.serializeSculptPreviewScene(
      m.createSculptTerrain({width:40,height:40}),[]);
    document.querySelector('#import').click();
    document.querySelector('#mode-ground').click();
    document.querySelector('[data-mode="sphere-hill"]').click();
    const precise=document.querySelector('#precision-mode');
    if(precise.checked){precise.checked=false;precise.dispatchEvent(new Event('change',{bubbles:true}));}
    const radius=document.querySelector('#radius');
    radius.value='3';radius.dispatchEvent(new Event('input',{bubbles:true}));
    const level=document.querySelector('#target');
    level.value='4';level.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'});
    return {count:window.__sculptLabProbe().sphereCount,selected:window.__sculptLabProbe().quickTool};
  })()`);
  if(v76Setup.count!==0||v76Setup.selected!=='sphere-hill')
    throw Error('V76 spherical brush was not armed in Chromium: '+JSON.stringify(v76Setup));
  await sleep(180);
  const v76Pointer=await run(`(()=>{
    const b=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const x=b.x+b.width*.5,y=b.y+b.height*.50;
    return {x,y,cell:window.__sculptLabProbe({x,y}).probedCell};
  })()`);
  if(!v76Pointer.cell||v76Pointer.cell.x<4||v76Pointer.cell.y<4||
      v76Pointer.cell.x>35||v76Pointer.cell.y>35)
    throw Error('V76 real canvas center did not land inside flat world: '+JSON.stringify(v76Pointer));
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:v76Pointer.x,y:v76Pointer.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:v76Pointer.x,y:v76Pointer.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:v76Pointer.x,y:v76Pointer.y,button:'left',clickCount:1});
  await sleep(140);
  const v76Drawn=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const t=JSON.parse(document.querySelector('#json').value).terrain;
    const f=t.spheres?.[0];
    const count=window.__sculptLabProbe().sphereCount;
    return {count,feature:f,levelsUntouched:t.levels.every(v=>v===2),
      wetUntouched:t.waterLevels.every(v=>v===-1)};
  })()`);
  if(v76Drawn.count!==1||v76Drawn.feature?.kind!=='hill'||
    v76Drawn.feature?.height!==4||v76Drawn.feature?.radius!==84||
    !v76Drawn.levelsUntouched||!v76Drawn.wetUntouched)
    throw Error('V76 real Chromium tap failed to create ONLY canonical spherical mesh: '+
      JSON.stringify({v76Pointer,v76Drawn}));
  const v76Undo=await run(`(()=>{
    document.querySelector('#undo').click();
    const undone=window.__sculptLabProbe().sphereCount;
    document.querySelector('#redo').click();
    const redone=window.__sculptLabProbe().sphereCount;
    document.querySelector('#scene-export').click();
    const saved=document.querySelector('#json').value;
    document.querySelector('#import').click();
    return {undone,redone,reimported:window.__sculptLabProbe().sphereCount,
      exact:document.querySelector('#json').value===saved};
  })()`);
  if(v76Undo.undone!==0||v76Undo.redone!==1||v76Undo.reimported!==1||!v76Undo.exact)
    throw Error('V76 real Chromium scene roundtrip or undo/redo failed: '+JSON.stringify(v76Undo));
  console.log('V76 real Chromium one-tap spherical relief / Undo / scene reimport:',
    JSON.stringify({pointer:v76Pointer,feature:v76Drawn.feature,roundtrip:v76Undo}));
  // V76 R2 actual Chromium Canvas: verify visible depth in REAL pixels,
  // not only the JSON shape or a mocked draw command in Node.
  const volumePixels=await run(`(async()=>{
    const m=await import('./src/world/sculpt-height-model.js');
    const mesh=await import('./src/render/sculpt-sphere-mesh.js?rev=real-spherical-v76-volume-r2');
    const results=[];
    for(const kind of ['hill','basin'])for(const height of [1,3,7]){
      const terrain=m.appendSculptSphere(m.createSculptTerrain({width:40,height:40}),
        {kind,x:560,y:420,radius:112,height});
      const sphere=terrain.spheres[0],tile={width:28,height:21,rise:18};
      const c=document.createElement('canvas');c.width=1120;c.height=840;
      const ctx=c.getContext('2d',{willReadFrequently:true});
      ctx.fillStyle='#677955';ctx.fillRect(0,0,c.width,c.height);
      const count=mesh.drawSculptSphereMeshes(ctx,{terrain,tile,baseColor:'#677955',
        rockPaletteColors:['#bea28c','#947c70','#6c6064','#4b4a56']});
      const focus=mesh.sculptSphereProjectedPoint(terrain,sphere,0,0,tile);
      const pixels=ctx.getImageData(560,240,1,280).data;
      let distinct=0,dark=0;
      for(let i=0;i<pixels.length;i+=4){
        if(pixels[i]!==103||pixels[i+1]!==121||pixels[i+2]!==85)distinct++;
        if(pixels[i]<70&&pixels[i+1]<90)dark++;
      }
      results.push({kind,height,count,distinct,dark,depth:focus.y-
        (sphere.y-sphere.baseLevel*tile.rise)});
    }
    return {results,hillLabel:document.querySelector('#height-label')?.textContent,
      active:document.querySelector('[data-mode="sphere-hill"]')?.textContent};
  })()`);
  if(volumePixels.results.length!==6||volumePixels.results.some(x=>x.count!==1||
     x.distinct<35||(x.kind==='basin'&&x.dark<10))||
     !(volumePixels.results.find(x=>x.kind==='hill'&&x.height===7).depth<
       volumePixels.results.find(x=>x.kind==='hill'&&x.height===1).depth)||
     !(volumePixels.results.find(x=>x.kind==='basin'&&x.height===7).depth>
       volumePixels.results.find(x=>x.kind==='basin'&&x.height===1).depth))
    throw Error('V76 R2 actual Canvas has no clearly drawn volume: '+JSON.stringify(volumePixels));
  console.log('V76 R2 REAL Chromium mineral hills / clipped crater depths 1/3/7:',
    JSON.stringify(volumePixels));
  // V76 R3 mobile authoring contract: actual pointer placement must persist
  // summit width and chosen flank texture, while the preview guide vanishes.
  const r3Setup=await run(`(async()=>{
    const m=await import('./src/world/sculpt-height-model.js');
    const sc=await import('./src/world/sculpt-scene-preview.js');
    document.querySelector('#json').value=sc.serializeSculptPreviewScene(
      m.createSculptTerrain({width:40,height:40}),[]);
    document.querySelector('#import').click();
    document.querySelector('[data-mode="sphere-hill"]').click();
    const precise=document.querySelector('#precision-mode');
    if(precise.checked){precise.checked=false;precise.dispatchEvent(new Event('change',{bubbles:true}));}
    const radius=document.querySelector('#radius');radius.value='3';radius.dispatchEvent(new Event('input',{bubbles:true}));
    const summit=document.querySelector('#sphere-summit-ratio');summit.value='75';
    summit.dispatchEvent(new Event('input',{bubbles:true}));
    const wall=document.querySelector('#sphere-wall-material');wall.value='earth';
    wall.dispatchEvent(new Event('change',{bubbles:true}));
    const height=document.querySelector('#target');height.value='5';
    height.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'});
    const box=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {profileVisible:!document.querySelector('#sphere-profile-wrap').hidden,
      label:document.querySelector('#sphere-summit-ratio-value').textContent,
      pos:{x:box.x+box.width*.5,y:box.y+box.height*.5}};
  })()`);
  if(!r3Setup.profileVisible||r3Setup.label!=='75 %')
    throw Error('V76 R3 mobile controls did not expose flat summit: '+JSON.stringify(r3Setup));
  await sleep(120);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:r3Setup.pos.x,y:r3Setup.pos.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:r3Setup.pos.x,y:r3Setup.pos.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:r3Setup.pos.x,y:r3Setup.pos.y,button:'left',clickCount:1});
  await sleep(90);
  const r3Painted=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const terrain=JSON.parse(document.querySelector('#json').value).terrain;
    const p=window.__sculptLabProbe();
    return {sphere:terrain.spheres[0],count:p.sphereCount,
      guideVisible:p.sphereGuideVisible,chosenMaterial:p.wallMaterial,
      chosenSummit:p.summitRatio};
  })()`);
  if(r3Painted.count!==1||r3Painted.sphere?.summitRatio!==.75||
     r3Painted.sphere?.wallMaterial!=='earth'||!r3Painted.guideVisible||
     r3Painted.chosenSummit!==.75||r3Painted.chosenMaterial!=='earth')
    throw Error('V76 R6 pointer failed summit/material or live brush visibility: '+
      JSON.stringify(r3Painted));
  console.log('V76 R3 real Chromium plateau + earth texture + temporary brush:',
    JSON.stringify(r3Painted));
  // V76 R4 — the SAME physical sliders must be available in the real
  // fullscreen floating quickbar, and precision aiming must show a guide
  // BEFORE committing, never a black permanent rim AFTER committing.
  const v76R4UI=await run(`(async()=>{
    const m=await import('./src/world/sculpt-height-model.js');
    const sc=await import('./src/world/sculpt-scene-preview.js');
    document.querySelector('#json').value=sc.serializeSculptPreviewScene(
      m.createSculptTerrain({width:40,height:40}),[]);
    document.querySelector('#import').click();
    document.querySelector('[data-mode="sphere-hill"]').click();
    const enteredImmersive=!document.body.classList.contains('sculpt-immersive');
    if(enteredImmersive)document.querySelector('#fullscreen-toggle').click();
    const panel=document.querySelector('.sculpt-quickbar');
    const profile=document.querySelector('#sphere-profile-wrap');
    const ratio=document.querySelector('#sphere-summit-ratio');
    const material=document.querySelector('#sphere-wall-material');
    const precision=document.querySelector('#precision-mode');
    precision.checked=true;precision.dispatchEvent(new Event('change',{bubbles:true}));
    const aim=window.__sculptLabProbe();
    const before={immersive:aim.immersiveMode,expanded:!aim.paletteCollapsed,
      inside:panel.contains(profile)&&profile.contains(ratio)&&profile.contains(material),
      profileVisible:!profile.hidden&&getComputedStyle(profile).display!=='none',
      guide:aim.sphereGuideVisible,target:aim.precisionTarget};
    document.querySelector('#palette-toggle').click();
    const closed=getComputedStyle(panel).display==='none';
    document.querySelector('#palette-toggle').click();
    const reopened=getComputedStyle(panel).display!=='none';
    const x=window.__sculptLabProbe().precisionTarget;
    document.querySelector('#apply-precision').click();
    const after=window.__sculptLabProbe();
    document.querySelector('#nudge-right').click();
    const reaim=window.__sculptLabProbe();
    if(enteredImmersive)document.querySelector('#fullscreen-toggle').click();
    return {before,closed,reopened,applied:after.sphereCount,
      afterGuide:after.sphereGuideVisible,newAimGuide:reaim.sphereGuideVisible,
      moved:reaim.precisionTarget?.x===x.x+1};
  })()`);
  if(!v76R4UI.before.immersive||!v76R4UI.before.expanded||!v76R4UI.before.inside||
     !v76R4UI.before.profileVisible||!v76R4UI.before.guide||
     !v76R4UI.before.target||!v76R4UI.closed||!v76R4UI.reopened||
     v76R4UI.applied!==1||!v76R4UI.afterGuide||
     !v76R4UI.newAimGuide||!v76R4UI.moved)
    throw Error('V76 R6 fullscreen / preview remains ready after placement: '+JSON.stringify(v76R4UI));
  console.log('V76 R6 Chromium fullscreen controls / aim stays visible for next placement:',JSON.stringify(v76R4UI));
  // V76 R5: actual image assets (HD cliff, forest grass and forest earth)
  // must be loaded before validating that pointer hovering cannot re-bake
  // all 36x24 ground cells and spherical meshes on each event.
  const v76R5Before=await run(`(()=>{
    document.querySelector('#precision-mode').checked=false;
    document.querySelector('#precision-mode').dispatchEvent(new Event('change',{bubbles:true}));
    const c=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {probe:window.__sculptLabProbe(),
      rect:{x:c.x,y:c.y,width:c.width,height:c.height}};
  })()`);
  await sleep(180);
  const v76R5Start=await run(`window.__sculptLabProbe()`);
  for(let i=0;i<24;i++){
    const rx=v76R5Before.rect.x+v76R5Before.rect.width*(.24+i%6*.09);
    const ry=v76R5Before.rect.y+v76R5Before.rect.height*(.24+Math.floor(i/6)*.12);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rx,y:ry});
  }
  await sleep(140);
  const v76R5End=await run(`window.__sculptLabProbe()`);
  const v76R5Stats={assets:v76R5End.sphereMaterialAssets,
    before:v76R5Start.terrainRasterBuilds,after:v76R5End.terrainRasterBuilds,
    cached:v76R5End.cachedGround,sphereCount:v76R5End.sphereCount};
  if(!v76R5Stats.assets?.rock||!v76R5Stats.assets?.grass||
     !v76R5Stats.assets?.earth||!v76R5Stats.cached||
     v76R5Stats.after-v76R5Stats.before>1)
    throw Error('V76 R5 assets/cache real Chromium regression: '+JSON.stringify(v76R5Stats));
  console.log('V76 R5 REAL Chromium canonical HD rock/grass/earth + cached pointer:',JSON.stringify(v76R5Stats));
  // V76 R9 — genuinely exercise the 100% UI and the browser's shared
  // canonical height + Collision World (not a mock Canvas-only test).
  const r9Check=await run(`(async()=>{
    const world=await import('./src/world/sculpt-height-model.js?rev=sphere-frustum-v76-r9');
    const nav=await import('./src/core/sculpt-navigation-collision.js?rev=sculpt-bridge-crossing-v60-grade-v69-deck-v70-rails-v71-cliff-lock-v75-north-r2-sphere-v76-frustum-r9');
    const slider=document.querySelector('#sphere-summit-ratio');
    const max=Number(slider.max);slider.value='100';
    slider.dispatchEvent(new Event('input',{bubbles:true}));
    const t=world.appendSculptSphere(world.createSculptTerrain({width:40,height:40}),
      {kind:'hill',x:560,y:420,radius:112,height:7,summitRatio:1,wallMaterial:'grass'});
    const serialized=world.serializeSculptTerrain(t);
    const imported=world.importSculptTerrain(serialized);
    const rendered=world.sculptSphereDisplacementAt(imported,560+111.8,420);
    const out=world.sculptSphereDisplacementAt(imported,560+112,420);
    const at=nav.sculptSphereProjectionBlock(imported,560,420-112-16,
      {cellWidth:28,cellHeight:21,projectionRise:18,radius:5});
    return {max,label:document.querySelector('#sphere-summit-ratio-value').textContent,
      jsonRatio:imported.spheres[0].summitRatio,heightAtEdge:rendered,
      heightOutside:out,collision:at?.kind};
  })()`);
  if(r9Check.max!==100||r9Check.label!=='100 %'||
     r9Check.jsonRatio!==1||r9Check.heightAtEdge!==7||
     r9Check.heightOutside!==0||r9Check.collision!=='sphere-projection')
    throw Error('V76 R9 real Chromium 100% mesa/JSON/ground-occlusion regression: '+JSON.stringify(r9Check));
  console.log('V76 R9 REAL Chromium 100% flat round plateau / canonical JSON / projected hill lock:',JSON.stringify(r9Check));
  // V76 R10: real Chromium 2D canvas checks the FRONT cone is a continuous
  // painted curtain at small/medium/full summit sizes, not individual spiky
  // triangles. The same already-registered renderer is exercised directly.
  const r10Check=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js?rev=sphere-frustum-v76-r9');
    const render=await import('./src/render/sculpt-sphere-mesh.js?rev=real-spherical-v76-volume-r2-frustum-r9');
    const tile={width:28,height:21,rise:18},samples=[];
    for(const ratio of [.05,.2,.5,.75,1]){
      const terrain=model.appendSculptSphere(model.createSculptTerrain({width:40,height:40}),
        {kind:'hill',x:560,y:420,radius:112,height:6,summitRatio:ratio});
      const cap=render.sculptSphereFrustumContours(terrain,terrain.spheres[0],tile);
      const test=document.createElement('canvas');test.width=1120;test.height=840;
      const context=test.getContext('2d',{willReadFrequently:true});
      render.drawSculptSphereMeshes(context,{terrain,tile,baseColor:'#72ab53'});
      const alpha=[];
      for(const sector of [3,7,9,11,15]){
        const a=cap.topFront[sector],b=cap.baseFront[sector];
        for(const amount of [.25,.5,.75]){
          const px=Math.round(a.x*(1-amount)+b.x*amount),
            py=Math.round(a.y*(1-amount)+b.y*amount);
          alpha.push(context.getImageData(px,py,1,1).data[3]);
        }
      }
      samples.push({ratio,continuous:alpha.every(v=>v>0),
        minAlpha:Math.min(...alpha),border:cap.seamRadius});
    }
    return samples;
  })()`);
  if(r10Check.some(s=>!s.continuous||s.minAlpha<1))
    throw Error('V76 R10 actual Chromium conical wall contains unpainted triangles: '+JSON.stringify(r10Check));
  console.log('V76 R10 REAL Chromium 5%–100% continuous painted front rock (no missing triangles):',JSON.stringify(r10Check));
  // V76 R11: a real browser canvas must visually distinguish high grass
  // from low grass. Test the composited pixels, not merely the CSS/ramp.
  const r11Light=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js?rev=sphere-frustum-v76-r9');
    const render=await import('./src/render/sculpt-sphere-mesh.js?rev=real-spherical-v76-volume-r2-frustum-r9-depth-r11');
    const tile={width:28,height:21,rise:18},samples=[];
    for(const height of [1,3,7]){
      const terrain=model.appendSculptSphere(model.createSculptTerrain({width:40,height:40}),
        {kind:'hill',x:560,y:420,radius:112,height,summitRatio:.75,wallMaterial:'rock'});
      const canvas=document.createElement('canvas');canvas.width=1120;canvas.height=840;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});
      render.drawSculptSphereMeshes(ctx,{terrain,tile,baseColor:'#6b8952'});
      const yy=Math.round(420-(terrain.spheres[0].baseLevel+height)*tile.rise);
      const pixel=Array.from(ctx.getImageData(560,yy,1,1).data);
      samples.push({height,pixel});
    }
    return samples;
  })()`);
  const r11Lum=v=>v.pixel[0]+v.pixel[1]+v.pixel[2];
  if(r11Light.some(x=>x.pixel[3]===0)||!(r11Lum(r11Light[0])<
     r11Lum(r11Light[1])&&r11Lum(r11Light[1])<r11Lum(r11Light[2])))
    throw Error('V76 R11 grass lighting fails real Chromium low/middle/high pixel comparison: '+JSON.stringify(r11Light));
  console.log('V76 R11 REAL Chromium 1/3/7 level upper grass luminance:',JSON.stringify(r11Light));
  // R3 real DOM/pointer gate: mobile default precision is ON, but a slope
  // must be authored by two taps or a single drag directly on the canvas.
  const rampR3Setup=await run(`(async()=>{
    const model=await import('./src/world/sculpt-height-model.js?rev=terrain-sculpt-ramp-v77-r2');
    const width=18,height=22;
    const levels=Array.from({length:width*height},(_,i)=>Math.floor(i/width)<8?5:2);
    document.querySelector('#json').value=model.serializeSculptTerrain(
      model.createSculptTerrain({width,height,levels}));
    document.querySelector('#import').click();
    const view=document.querySelector('#camera-view');view.value='classic';
    view.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('[data-mode="terrain-ramp"]').click();
    const precision=document.querySelector('#precision-mode');
    precision.checked=true;precision.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const probe=window.__sculptLabProbe();
    const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const screen=(col,row,level)=>({x:rect.left+probe.cameraPan.x+(col+.5)*28*probe.zoom,
      y:rect.top+probe.cameraPan.y+((row+.5)*21-level*18)*probe.zoom});
    const foot=screen(8,13,2),head=screen(8,7,5);
    const dragFoot=screen(11,13,2),dragHead=screen(11,7,5);
    return {foot,head,dragFoot,dragHead,probe,
      atFoot:document.elementFromPoint(foot.x,foot.y)?.id,
      atHead:document.elementFromPoint(head.x,head.y)?.id};
  })()`);
  if(!rampR3Setup.probe.precisionMode||!rampR3Setup.probe.rampGuideVisible||
    rampR3Setup.probe.terrainRampCount!==0||
    rampR3Setup.atFoot!=='sculpt-canvas'||rampR3Setup.atHead!=='sculpt-canvas')
    throw Error('R3 precision/canvas ramp setup: '+JSON.stringify(rampR3Setup));
  const r3Click=async p=>{
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:p.x,y:p.y});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',x:p.x,y:p.y,
      button:'left',clickCount:1});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:p.x,y:p.y,
      button:'left',clickCount:1});
  };
  await r3Click(rampR3Setup.foot);
  const r3AfterFoot=await run('window.__sculptLabProbe()');
  if(!r3AfterFoot.rampStart||r3AfterFoot.terrainRampCount!==0||
    !r3AfterFoot.rampGuideText.startsWith('2.'))
    throw Error('R3 first tap must set pending foot, never create ramp: '+
      JSON.stringify(r3AfterFoot));
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',
    x:rampR3Setup.head.x,y:rampR3Setup.head.y});
  await sleep(70);
  const r3Preview=await run('window.__sculptLabProbe()');
  if(r3Preview.rampPreviewValid!==true)
    throw Error('R3 slope live two-bank preview invalid: '+JSON.stringify(r3Preview));
  await r3Click(rampR3Setup.head);
  const r3AfterHead=await run('window.__sculptLabProbe()');
  if(r3AfterHead.terrainRampCount!==1||r3AfterHead.rampStart)
    throw Error('R3 second tap did not commit exactly one terrain ramp: '+
      JSON.stringify(r3AfterHead));
  await run("document.querySelector('#undo').click()");
  const r3Undo=await run('window.__sculptLabProbe()');
  await run("document.querySelector('#redo').click()");
  const r3Redo=await run('window.__sculptLabProbe()');
  if(r3Undo.terrainRampCount!==0||r3Redo.terrainRampCount!==1)
    throw Error('R3 terrain Undo/Redo broken: '+
      JSON.stringify({r3Undo,r3Redo}));
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',
    x:rampR3Setup.dragFoot.x,y:rampR3Setup.dragFoot.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',
    x:rampR3Setup.dragFoot.x,y:rampR3Setup.dragFoot.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',
    x:rampR3Setup.dragHead.x,y:rampR3Setup.dragHead.y,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',
    x:rampR3Setup.dragHead.x,y:rampR3Setup.dragHead.y,button:'left',clickCount:1});
  const r3Drag=await run('window.__sculptLabProbe()');
  if(r3Drag.terrainRampCount!==2||r3Drag.rampStart)
    throw Error('R3 single drag failed to add a terrain ramp: '+JSON.stringify(r3Drag));
  await r3Click(rampR3Setup.foot);
  const rampR3Pending=await run('window.__sculptLabProbe()');
  await run("document.querySelector('#ramp-cancel').click()");
  const rampR3Cancelled=await run('window.__sculptLabProbe()');
  if(!rampR3Pending.rampStart||rampR3Cancelled.rampStart||rampR3Cancelled.terrainRampCount!==2)
    throw Error('R3 Change foot must clear only pending point: '+
      JSON.stringify({pending:rampR3Pending,cancelled:rampR3Cancelled}));
  console.log('R3 GREEN real Chromium slope two-tap, drag, precision bypass, live preview, Undo/Redo, cancel');
  // V79 real Chromium: import a house, select its existing WorldObject,
  // open an independent sculptable WorldArea, change camera, leave, export
  // and import. This catches UI/boot contracts that unit tests cannot.
  const v79House=await run(`(async()=>{
    const s=await import('./src/world/sculpt-scene-preview.js');
    const scene=s.createBlankSculptPreviewScene({width:36,height:24});
    const x=18*28,y=12*21;
    const objects=s.appendSculptPreviewObject([],{
      definitionId:'objectdef.building.house.fantasy_wood_stone.01',
      x,y,scale:.60
    });
    document.querySelector('#json').value=
      s.serializeSculptPreviewScene(scene.terrain,objects,scene.surface,[]);
    document.querySelector('#import').click();
    document.querySelector('#camera-view').value='classic';
    document.querySelector('#camera-view').dispatchEvent(new Event('change',{bubbles:true}));
    if(!window.__sculptObjectsProbe().active)
      document.querySelector('#mode-objects').click();
    document.querySelector('#object-action').value='select';
    document.querySelector('#object-action').dispatchEvent(new Event('change'));
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const probe=window.__sculptLabProbe();
    const positions=[.22,.35,.5,.65,.78].map(f=>({
      x:rect.x+probe.cameraPan.x+x*probe.zoom,
      y:rect.y+probe.cameraPan.y+(y-180*f)*probe.zoom
    }));
    return {positions,initial:probe};
  })()`);
  let v79Picked=null;
  for(const pt of v79House.positions){
    await r3Click(pt);
    v79Picked=await run('window.__sculptObjectsProbe()');
    if(v79Picked.selectedId)break;
  }
  if(!v79Picked?.selectedId||v79Picked.objects.length!==1||
    !v79House.initial.precisionMode)
    throw Error('V79 real Chromium house selection failed: '+
      JSON.stringify({v79House,v79Picked}));
  const v79Opened=await run(`(()=>{
    const button=document.querySelector('#object-open-interior');
    const visible=!button.hidden;
    button.click();
    const probe=window.__sculptLabProbe();
    return {visible,probe};
  })()`);
  if(!v79Opened.visible||!v79Opened.probe.activeAreaId.startsWith('sculpt-interior-')||
    v79Opened.probe.width!==18||v79Opened.probe.height!==14||
    !v79Opened.probe.interiorAreaBarVisible||v79Opened.probe.interiorCount!==1)
    throw Error('V79 browser interior did not open: '+JSON.stringify(v79Opened));
  const v79Angles=await run(`(()=>{
    const angle=document.querySelector('#interior-camera-angle');
    angle.value='35';angle.dispatchEvent(new Event('input',{bubbles:true}));
    const a=window.__sculptLabProbe().liveCameraPitch;
    angle.value='90';angle.dispatchEvent(new Event('input',{bubbles:true}));
    return {a,b:window.__sculptLabProbe().liveCameraPitch};
  })()`);
  if(!(v79Angles.a<.60&&v79Angles.b>.99))
    throw Error('V79 browser interior camera inclination not connected: '+
      JSON.stringify(v79Angles));
  const v79R2=await run(`(()=>{
    const roomBar=document.querySelector('#interior-area-bar');
    const quick=document.querySelector('.sculpt-quickbar');
    const floor=document.querySelector('#interior-floor-base');
    floor.value='floor.tile.light';floor.dispatchEvent(new Event('change',{bubbles:true}));
    const original=window.__sculptLabProbe().interiorFloorId;
    document.querySelector('#interior-template-name').value='Maison de village';
    document.querySelector('#interior-template-save').click();
    const itemId=document.querySelector('#interior-template-select').value;
    floor.value='floor.wood.dark';floor.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#interior-template-apply').click();
    const applied=window.__sculptLabProbe();
    // Previous gates may leave the editor immersive: enter explicitly,
    // rather than accidentally toggling an existing fullscreen OFF.
    if(!document.body.classList.contains('sculpt-immersive'))
      document.querySelector('#fullscreen-toggle').click();
    const floatingInfo={immersive:document.body.classList.contains('sculpt-immersive'),
      insideQuickbar:quick.contains(roomBar),position:getComputedStyle(roomBar).position,
      panelVisible:!roomBar.hidden,quickDisplay:getComputedStyle(quick).display};
    const floating=floatingInfo.immersive&&floatingInfo.insideQuickbar&&
      floatingInfo.position==='static'&&floatingInfo.panelVisible;
    if(document.body.classList.contains('sculpt-immersive'))
      document.querySelector('#fullscreen-toggle').click();
    document.querySelector('#scene-export').click();
    const exported=JSON.parse(document.querySelector('#json').value);
    return {original,itemId,appliedFloor:applied.interiorFloorId,
      templates:applied.interiorTemplateCount,exported:exported.interiorTemplates?.length,
      savedFloor:exported.interiors?.[0]?.surface?.baseMaterialId,
      floating,floatingInfo};
  })()`);
  if(v79R2.original!=='floor.tile.light'||!v79R2.itemId||
     v79R2.appliedFloor!=='floor.tile.light'||v79R2.templates!==1||
     v79R2.exported!==1||v79R2.savedFloor!=='floor.tile.light'||
     !v79R2.floating)
    throw Error('V79 R2 real Chromium native floors / reusable templates / floating bar failed: '+
      JSON.stringify(v79R2));
  console.log('V79 R2 REAL Chromium native indoor floors, reusable room and floating return:',JSON.stringify(v79R2));

  // R3A mobile-equivalent Chromium: real pointer input to create a physical
  // WorldArea wall, Undo/Redo, and the Portal action ON THE PLAYFIELD.
  const v79WallSetup=await run(`(async()=>{
    document.querySelector('#interior-wall-toggle').click();
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const p=window.__sculptLabProbe();
    const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const at=(x,y)=>({x:rect.x+p.cameraPan.x+x*p.zoom,
      y:rect.y+p.cameraPan.y+y*p.zoom});
    return {from:at(100,82),to:at(235,82),mode:p.interiorWallMode};
  })()`);
  if(v79WallSetup.mode!=='place')
    throw Error('V79 R3A wall palette unavailable: '+JSON.stringify(v79WallSetup));
  await r3Click(v79WallSetup.from);
  const v79WallPending=await run('window.__sculptLabProbe()');
  await r3Click(v79WallSetup.to);
  const v79WallPlaced=await run('window.__sculptLabProbe()');
  if(!v79WallPending.interiorWallPending||v79WallPlaced.interiorWallCount!==1||
     v79WallPlaced.interiorWallPending)
    throw Error('V79 R3A two-touch wall failed: '+
      JSON.stringify({pending:v79WallPending,placed:v79WallPlaced}));
  await run("document.querySelector('#interior-wall-undo').click()");
  const v79WallUndone=await run('window.__sculptLabProbe()');
  await run("document.querySelector('#interior-wall-redo').click()");
  const v79WallRedone=await run('window.__sculptLabProbe()');
  if(v79WallUndone.interiorWallCount!==0||v79WallRedone.interiorWallCount!==1)
    throw Error('V79 R3A wall Undo/Redo failed: '+
      JSON.stringify({undo:v79WallUndone,redo:v79WallRedone}));
  const v79Playfield=await run(`(()=>{
    document.querySelector('#navigation-toggle').click();
    const p=window.__sculptLabProbe();
    const button=document.querySelector('#navigation-area-door');
    const rect=button.getBoundingClientRect();
    document.querySelector('#navigation-toggle').click();
    return {inPlayfield:p.gameDoorInPlayfield,visible:p.gameDoorVisible,
      width:rect.width,height:rect.height,mode:p.navigationTesting};
  })()`);
  if(!v79Playfield.inPlayfield||!v79Playfield.visible||
     !v79Playfield.mode||v79Playfield.width<100||v79Playfield.height<40)
    throw Error('V79 R3A game door action is not visible on the playfield: '+
      JSON.stringify(v79Playfield));
  const v79WallJson=await run(`(()=>{
    document.querySelector('#scene-export').click();
    return JSON.parse(document.querySelector('#json').value).interiors?.[0]?.area?.walls?.length;
  })()`);
  if(v79WallJson!==1)throw Error('V79 R3A walls missing from JSON: '+v79WallJson);
  console.log('V79 R3A REAL Chromium wall two-touch, Undo/Redo, Portal playfield action, JSON:',JSON.stringify({
    walls:v79WallJson,playfield:v79Playfield
  }));
  // R3A2 real-pointer UX: one drag creates a snapped wall, with no
  // accidental ghost or half-placed segment. Then resize/move the actual
  // Portal-backed door, and verify persisted Spawn after scene export.
  const v79WallDragStart=await run(`(()=>{
    // A gameplay test turns authoring off; reselect Wall mode for the drag.
    if(window.__sculptLabProbe().interiorWallMode!=='place')
      document.querySelector('#interior-wall-toggle').click();
    const p=window.__sculptLabProbe(),r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const at=(x,y)=>({x:r.x+p.cameraPan.x+x*p.zoom,
      y:r.y+p.cameraPan.y+y*p.zoom});
    return {a:at(145,178),b:at(310,178)};
  })()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',
    x:v79WallDragStart.a.x,y:v79WallDragStart.a.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',
    x:v79WallDragStart.a.x,y:v79WallDragStart.a.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',
    x:v79WallDragStart.b.x,y:v79WallDragStart.b.y,button:'left'});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',
    x:v79WallDragStart.b.x,y:v79WallDragStart.b.y,button:'left',clickCount:1});
  const v79AfterDrag=await run('window.__sculptLabProbe()');
  if(v79AfterDrag.interiorWallCount!==2||v79AfterDrag.interiorWallPending)
    throw Error('V79 R3A2 glisser-relâcher n’a pas créé un mur complet: '+JSON.stringify(v79AfterDrag));
  const doorSetup=await run(`(()=>{
    document.querySelector('#interior-door-scale').value='45';
    document.querySelector('#interior-door-scale').dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#interior-door-move').click();
    const p=window.__sculptLabProbe(),r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {x:r.x+p.cameraPan.x+350*p.zoom,
      y:r.y+p.cameraPan.y+200*p.zoom};
  })()`);
  await r3Click(doorSetup);
  const doorCheck=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const e=JSON.parse(document.querySelector('#json').value).interiors?.[0];
    return {x:e?.exitPortal?.trigger?.x,y:e?.exitPortal?.trigger?.y,
      scale:e?.exitPortal?.visual?.scale,spawn:e?.area?.spawns?.find(s=>s.id==='entrance'),
      actualWalls:e?.area?.walls?.length};
  })()`);
  if(!doorCheck||Math.abs(doorCheck.x-350)>2||
     Math.abs(doorCheck.y-200)>2||doorCheck.scale!==.45||
     doorCheck.spawn?.x!==doorCheck.x||
     !(doorCheck.spawn.y<doorCheck.y)||doorCheck.actualWalls!==2)
    throw Error('V79 R3A2 porte mobile/échelle/Portal/Spawn : '+JSON.stringify(doorCheck));
  await run("document.querySelector('#interior-door-move').click()");
  console.log('V79 R3A2 REAL Chromium mur glissé et porte Portal mobile/scale + Spawn:',
    JSON.stringify({walls:doorCheck.actualWalls,door:doorCheck}));

  // V79 R3B real Chromium: house-linked room is resizable and polygonal,
  // upper floor is a different WorldArea, both real Portals survive JSON.
  const v79R3B=await run(`(async()=>{
    const width=document.querySelector('#interior-width');
    const height=document.querySelector('#interior-height');
    const shape=document.querySelector('#interior-shape');
    width.value='24';height.value='18';shape.value='l';
    document.querySelector('#interior-layout-apply').click();
    const layout=window.__sculptLabProbe();
    document.querySelector('#interior-level-add').click();
    const upper=window.__sculptLabProbe();
    document.querySelector('#scene-export').click();
    const raw=JSON.parse(document.querySelector('#json').value);
    const lib=await import('./src/world/sculpt-interior-area-link.js');
    const entries=lib.importSculptInteriors(raw.interiors,raw.objects);
    const doc=lib.sculptInteriorPortalDocument(raw.objects,entries);
    const valid=doc.portals.length===4&&
      doc.areas.some(a=>a.boundary.kind==='polygon')&&
      entries.length===2&&
      entries[1].entryPortal.sourceAreaId===entries[0].area.id;
    const selector=document.querySelector('#interior-level-select');
    selector.value='0';selector.dispatchEvent(new Event('change',{bubbles:true}));
    return {layout:{w:layout.width,h:layout.height},
      above:upper.activeAreaId,back:window.__sculptLabProbe().activeAreaId,
      floors:entries.length,portals:doc.portals.length,valid};
  })()`);
  if(v79R3B.layout.w!==24||v79R3B.layout.h!==18||
     !v79R3B.above.endsWith('-floor-1')||v79R3B.floors!==2||
     !v79R3B.valid||v79R3B.back===v79R3B.above)
    throw Error('V79 R3B real Chromium shape resize/floor Portal failed: '+
      JSON.stringify(v79R3B));
  console.log('V79 R3B REAL Chromium custom WorldArea shape and two floors:',JSON.stringify(v79R3B));
  // R3C genuine browser path: shape switches instantly without hidden Apply,
  // finishes are saved, and placing a ladder moves the real source Portal.
  const v79R3CMaterials=await run(`(()=>{
    const shape=document.querySelector('#interior-shape');
    shape.value='rectangle';shape.dispatchEvent(new Event('change',{bubbles:true}));
    const rect=window.__sculptLabProbe().interiorShape;
    shape.value='l';shape.dispatchEvent(new Event('change',{bubbles:true}));
    const polygon=window.__sculptLabProbe().interiorShape;
    const wall=document.querySelector('#interior-wall-material');
    wall.value='brick';wall.dispatchEvent(new Event('change',{bubbles:true}));
    const door=document.querySelector('#interior-door-asset');
    door.value='object.door.fantasy.wood.01';
    door.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#scene-export').click();
    const entry=JSON.parse(document.querySelector('#json').value).interiors[0];
    return {rect,polygon,material:entry.area.wallMaterialId,door:entry.exitPortal.visual.assetId,
      shapeFeedback:document.querySelector('#interior-shape-hint').textContent};
  })()`);
  if(v79R3CMaterials.rect!=='rectangle'||v79R3CMaterials.polygon!=='polygon'||
     v79R3CMaterials.material!=='brick'||
     v79R3CMaterials.door!=='object.door.fantasy.wood.01')
    throw Error('V79 R3C browser shape immediate or texture selectors failed: '+
      JSON.stringify(v79R3CMaterials));
  const v79R3CPoint=await run(`(async()=>{
    const link=document.querySelector('#interior-connector-link');
    const asset=document.querySelector('#interior-connector-asset');
    const id=link.value;
    asset.value='ladder.wood';asset.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#interior-connector-place').click();
    document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
    await new Promise(ok=>requestAnimationFrame(()=>requestAnimationFrame(ok)));
    const p=window.__sculptLabProbe(),r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    return {id,enabled:p.interiorConnectorMode,
      x:r.x+p.cameraPan.x+240*p.zoom,y:r.y+p.cameraPan.y+238*p.zoom};
  })()`);
  if(!v79R3CPoint.enabled||!v79R3CPoint.id)
    throw Error('R3C indoor stair-placement mode unavailable: '+JSON.stringify(v79R3CPoint));
  await r3Click(v79R3CPoint);
  const v79R3CSave=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const json=JSON.parse(document.querySelector('#json').value);
    const upper=json.interiors.find(e=>e.floorIndex===1);
    const lower=json.interiors.find(e=>e.floorIndex===0);
    const stairs=upper.entryPortal;
    return {asset:stairs.visual.assetId,x:stairs.trigger.x,y:stairs.trigger.y,
      arrival:upper.area.spawns.find(x=>x.id===stairs.targetSpawnId),
      exits:json.interiors.length,wall:lower.area.wallMaterialId,
      door:lower.exitPortal.visual.assetId};
  })()`);
  if(v79R3CSave.asset!=='ladder.wood'||Math.abs(v79R3CSave.x-240)>4||
    Math.abs(v79R3CSave.y-238)>4||v79R3CSave.arrival?.x!==v79R3CSave.x||
    v79R3CSave.wall!=='brick')
    throw Error('R3C REAL Chromium stair pointer, Portal or Spawn failed: '+
      JSON.stringify(v79R3CSave));
  await run("document.querySelector('#interior-connector-place').click()");
  // R3D actual Chromium controls: rotation stays in Portal JSON and the
  // actor MUST stay inside the phone canvas after pitch/zoom adjustments.
  const r3dRotation=await run(`(()=>{
    const input=document.querySelector('#interior-connector-rotation');
    input.value='135';input.dispatchEvent(new Event('input',{bubbles:true}));
    document.querySelector('#scene-export').click();
    const raw=JSON.parse(document.querySelector('#json').value);
    return {input:input.value,degree:raw.interiors.find(e=>e.floorIndex===1)
      .entryPortal.visual.rotationDeg};
  })()`);
  if(r3dRotation.degree!==135||r3dRotation.input!=='135')
    throw Error('R3D orientation escalier non persistée: '+JSON.stringify(r3dRotation));
  const r3dCamera=await run(`(async()=>{
    document.querySelector('#navigation-toggle').click();
    const results=[];
    for(const angle of ['35','55','90']){
      const input=document.querySelector('#navigation-camera-angle');
      input.value=angle;input.dispatchEvent(new Event('input',{bubbles:true}));
      for(const zoom of ['100','175','240']){
        const z=document.querySelector('#navigation-camera-zoom');
        z.value=zoom;z.dispatchEvent(new Event('input',{bubbles:true}));
        // Wait for the actual canvas paint. ActorScreen alone can look
        // centered while a leaked canvas pitch scales its DRAWN position.
        await new Promise(resolve=>requestAnimationFrame(()=>
          requestAnimationFrame(resolve)));
        const probe=window.__sculptNavProbe(),hero=probe.actorScreen;
        const matrix=probe.actorRenderTransform;
        const rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
        results.push({angle:Number(angle),zoom:Number(zoom),
          x:hero?.x,y:hero?.y,width:rect.width,height:rect.height,
          matrixA:matrix?.a,matrixD:matrix?.d,
          matrixB:matrix?.b,matrixC:matrix?.c});
      }
    }
    document.querySelector('#navigation-toggle').click();
    return results;
  })()`);
  if(r3dCamera.length!==9||r3dCamera.some(q=>!Number.isFinite(q.x)||
    !Number.isFinite(q.y)||q.x<0||q.y<0||q.x>=q.width||q.y>=q.height))
    throw Error('R3D actor lost after zoom/pitch in Chromium: '+JSON.stringify(r3dCamera));
  // R3E: assert ACTUAL sprite Canvas transform across 35°/55°/90° and zooms.
  // The old bug passed the actorScreen check because that metric was
  // theoretical, while the polygon mask prematurely popped ctx.save().
  if(r3dCamera.some(q=>!Number.isFinite(q.matrixA)||
    !Number.isFinite(q.matrixD)||Math.abs(q.matrixA-q.matrixD)>.0001||
    Math.abs(q.matrixB)>.0001||Math.abs(q.matrixC)>.0001))
    throw Error('R3E double projection polygonal actor, 35-90°: '+
      JSON.stringify(r3dCamera));
  console.log('R3D REAL Chromium portal rotation and actor following all pitch/zoom:',JSON.stringify({
    rotation:r3dRotation,screenChecks:r3dCamera
  }));
  console.log('V79 R3C REAL Chromium shape instant, wall textures, doors, placed ladder:',
    JSON.stringify({materials:v79R3CMaterials,stair:v79R3CSave}));
  const v79Back=await run(`(()=>{
    document.querySelector('#interior-area-return').click();
    return window.__sculptLabProbe();
  })()`);
  if(v79Back.activeAreaId!=='sculpt-exterior'||v79Back.objects!==1||
    v79Back.interiorCount!==2||v79Back.interiorAreaBarVisible)
    throw Error('V79 exterior view did not restore: '+JSON.stringify(v79Back));
  const v79Saved=await run(`(()=>{
    document.querySelector('#scene-export').click();
    const data=JSON.parse(document.querySelector('#json').value);
    document.querySelector('#import').click();
    return {interiors:data.interiors?.length,objects:data.objects?.length,
      probe:window.__sculptLabProbe(),
      exportRoomLevels:data.interiors?.[0]?.terrain?.levels?.length};
  })()`);
  if(v79Saved.interiors!==2||v79Saved.objects!==1||
    v79Saved.exportRoomLevels!==24*18||v79Saved.probe.interiorCount!==2)
    throw Error('V79 browser complete scene roundtrip failed: '+JSON.stringify(v79Saved));
  console.log('V79 REAL Chromium house selection -> independent sculptable interior -> camera 35/90 -> exterior -> JSON roundtrip:',JSON.stringify({
    picked:v79Picked.selectedId,angle:v79Angles,room:v79Opened.probe.activeAreaId,
    interiorCount:v79Saved.interiors}));
  // Shared JavaScript must continue to boot the FROZEN V80 HTML, which
  // intentionally does not contain the new terrain-family palette controls.
  const legacyNavigate=await send('Page.navigate',{
    url:new URL('/sculpt-lab-v80.html',url).toString()
  });
  if(legacyNavigate.error)throw Error('V80 navigation failed: '+JSON.stringify(legacyNavigate.error));
  await sleep(400);
  let legacyBoot=null;
  for(let i=0;i<100;i++){
    try{
      legacyBoot=await run("typeof window.__sculptLabProbe==='function' && document.querySelector('#sculpt-canvas')?.width>0 ? window.__sculptLabProbe():null");
    }catch{/* navigation can briefly replace the JavaScript execution context */}
    if(legacyBoot)break;
    await sleep(140);
  }
  if(!legacyBoot||legacyBoot.width!==36||legacyBoot.height!==24)
    throw Error('Frozen V80 page no longer boots shared sculpt engine: '+JSON.stringify(legacyBoot));
  const legacyPaint=await run(`(()=>{
    if(document.querySelector('#surface-base-family')||
       document.querySelector('#surface-family'))
      throw Error('Frozen V80 markup unexpectedly rewritten');
    document.querySelector('#mode-surface').click();
    return window.__sculptSurfaceProbe();
  })()`);
  if(!legacyPaint.active||legacyPaint.baseTerrainFamilyId!=='forest')
    throw Error('Frozen V80 legacy palette incompatible with canonical painter: '+
      JSON.stringify(legacyPaint));
  console.log('V80 immutable HTML real Chromium compatibility:',JSON.stringify({
    faces:legacyBoot.faceCount,palette:legacyPaint.active,
    semanticBaseFamily:legacyPaint.baseTerrainFamilyId
  }));

  // REAL 2.5D keyboard movement -> canonical WorldSurface -> existing
  // Encounter Controller -> CaptureEncounterSnapshot -> packaged Combat iframe.
  const encounterUrl=new URL('/sculpt-lab.html?encounterTest=1',url).href;
  const encounterNavigation=await send('Page.navigate',{url:encounterUrl});
  if(encounterNavigation.error)throw Error('Encounter scene navigation failed');
  await sleep(300);
  let encounterBoot=null;
  for(let i=0;i<110;i++){
    try{
      encounterBoot=await run("typeof window.__sculptEncounterProbe==='function' && window.__sculptEncounterProbe().supported && typeof window.__sculptNavProbe==='function'");
    }catch{/* transient navigation context */}
    if(encounterBoot)break;
    await sleep(110);
  }
  if(!encounterBoot)throw Error('Encounter scene did not boot');
  // Old Builder editing semantics in the real 2.5D palette: one WorldArea
  // enable flag, one normalized EncounterConfig v1 and Capture element picks.
  const editedEncounter=await run(`(()=>{
    document.querySelector('#new-map-toggle').click();
    const confirm=document.querySelector('#new-map-confirm');
    confirm.checked=true;confirm.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#new-map-create').click();
    document.querySelector('#mode-encounters').click();
    const chance=document.querySelector('#sculpt-encounter-chance');
    const family=document.querySelector('#sculpt-encounter-family');
    family.value='forest';family.dispatchEvent(new Event('change',{bubbles:true}));
    chance.value='100';chance.dispatchEvent(new Event('input',{bubbles:true}));
    const elements=[...document.querySelectorAll('#sculpt-encounter-elements input')];
    for(const input of elements){
      const desired=input.dataset.elementId==='fire';
      if(input.checked!==desired){
        input.checked=desired;input.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    const enabled=document.querySelector('#sculpt-encounter-area-enabled');
    enabled.checked=false;enabled.dispatchEvent(new Event('change',{bubbles:true}));
    const before=window.__sculptEncounterEditorProbe();
    document.querySelector('#scene-export').click();
    const exported=JSON.parse(document.querySelector('#json').value);
    document.querySelector('#import').click();
    const restored=window.__sculptEncounterEditorProbe();
    const button=document.querySelector('#mode-encounters').getBoundingClientRect();
    const panel=document.querySelector('#sculpt-encounter-editor').getBoundingClientRect();
    const exportConfig=exported.encounterConfig?.families.find(x=>x.terrainFamilyId==='forest');
    enabled.checked=true;enabled.dispatchEvent(new Event('change',{bubbles:true}));
    const active=window.__sculptEncounterEditorProbe();
    return {before,restored,active,
      familyChance:exportConfig?.encounterChancePercent??null,
      selected:exportConfig?.elementChances.map(x=>x.elementId)??null,
      savedAreaAllowed:exported.exteriorEncounters?.randomEnabled,
      buttonVisible:button.right<=innerWidth&&button.left>=0,
      panelVisible:panel.right<=innerWidth&&panel.left>=0&&panel.height>0};
  })()`);
  const authored=editedEncounter;
  if(!authored.before.available||!authored.before.open||
     authored.before.chance!==100||authored.before.allowedInArea!==false||
     authored.restored.chance!==100||authored.restored.allowedInArea!==false||
     authored.active.allowedInArea!==true||
     authored.familyChance!==100||authored.savedAreaAllowed!==false||
     JSON.stringify(authored.selected)!==JSON.stringify(['fire'])||
     JSON.stringify(authored.active.enabledElementIds)!==JSON.stringify(['fire'])||
     !authored.buttonVisible||!authored.panelVisible)
    throw Error('Builder Encounter editor did not persist one canonical authored config: '+
      JSON.stringify(authored));
  console.log('2.5D Encounter Builder authoring browser roundtrip:',JSON.stringify(authored));

  const startEncounter=await run(`(()=>{
    document.querySelector('#navigation-toggle').click();
    return {encounter:window.__sculptEncounterProbe(),nav:window.__sculptNavProbe()};
  })()`);
  if(!startEncounter.nav.enabled||startEncounter.encounter.pending)
    throw Error('Encounter navigation tester not initialized: '+JSON.stringify(startEncounter));
  const moveKey=async(type)=>await send('Input.dispatchKeyEvent',{
    type,key:'d',code:'KeyD',windowsVirtualKeyCode:68,nativeVirtualKeyCode:68
  });
  await moveKey('keyDown');
  let encountered=null;
  for(let i=0;i<40;i++){
    await sleep(120);
    encountered=await run('window.__sculptEncounterProbe()');
    if(encountered.pending)break;
  }
  await moveKey('keyUp');
  if(!encountered.pending||!encountered.creatureId||
     encountered.terrainFamilyId!=='forest'||encountered.elementId!=='fire'||
     !encountered.overlayVisible)
    throw Error('Real 2.5D movement did not launch Capture encounter: '+JSON.stringify(encountered));
  const pausedX=await run('window.__sculptNavProbe().player.x');
  await sleep(320);
  const stillX=await run('window.__sculptNavProbe().player.x');
  if(Math.abs(pausedX-stillX)>0.01)
    throw Error('Actor continues moving during encounter dialog: '+JSON.stringify({pausedX,stillX}));
  const continued=await run(`(()=>{
    document.querySelector('#sculpt-encounter-continue').click();
    return window.__sculptEncounterProbe();
  })()`);
  if(continued.pending||continued.overlayVisible)
    throw Error('Encounter controller did not release on continue: '+JSON.stringify(continued));
  await run("document.querySelector('#navigation-reset').click()");
  await moveKey('keyDown');
  let second=null;
  for(let i=0;i<40;i++){
    await sleep(120);
    second=await run('window.__sculptEncounterProbe()');
    if(second.pending)break;
  }
  await moveKey('keyUp');
  if(!second.pending||second.encounterId===encountered.encounterId)
    throw Error('2.5D encounter did not re-arm after continue/reset: '+JSON.stringify(second));
  const combatLaunch=await run(`(()=>{
    document.querySelector('#sculpt-encounter-combat').click();
    const iframe=document.querySelector('.combat-overlay__frame');
    return {state:window.__sculptEncounterProbe(),iframeSrc:iframe?.src??null,
      packaged:!!iframe,storage:!!sessionStorage.getItem('gensrpg.capture.combat-handoff.v1')};
  })()`);
  if(!combatLaunch.packaged||!combatLaunch.storage||!combatLaunch.state.combatActive||
     !combatLaunch.state.pending||
     !combatLaunch.iframeSrc.includes('/combat-preview/examples/dom-demo/exploration-encounter.html'))
    throw Error('2.5D bridge did not open real same-origin Combat host: '+JSON.stringify(combatLaunch));
  let combatReady=null;
  for(let i=0;i<70;i++){
    await sleep(130);
    combatReady=await run(`(()=>{
      const doc=document.querySelector('.combat-overlay__frame')?.contentDocument;
      return doc ? {status:doc.querySelector('[data-bridge-status]')?.textContent??'',
        skills:doc.querySelectorAll('[data-combat-skill]').length,
        enemyHud:!!doc.querySelector('[data-combat-hp-value="enemy-1"]'),
        bootError:doc.documentElement.dataset.encounterBootstrapError??null}:null;
    })()`);
    if(combatReady?.status.includes('Combat réel') && combatReady.skills>0 &&
       combatReady.enemyHud)break;
  }
  if(!combatReady?.status.includes('Combat réel')||!combatReady.enemyHud||
     combatReady.skills<1||combatReady.bootError)
    throw Error('2.5D iframe has no real playable Capture combat: '+JSON.stringify(combatReady));
  console.log('2.5D real movement -> single Encounter Controller -> Combat iframe Chromium:',
    JSON.stringify({first:encountered.creatureId,second:second.creatureId,
      stoppedAt:pausedX,previewReleased:true,combatPackaged:true,
      realCombatSkills:combatReady.skills}));

  // World Builder v1: a separate Dungeon-like UI backed by the SAME
  // WorldDocument v3, WorldArea and Portal Model, not a map/graph duplicate.
  const assemblerEntry=await run("!!document.querySelector('a[href=\"./world-assembler.html\"]')");
  if(!assemblerEntry)throw Error('Exploration lacks the separate World Builder entry');
  await send('Emulation.setDeviceMetricsOverride',{
    width:960,height:540,deviceScaleFactor:1,mobile:true,
    screenWidth:960,screenHeight:540
  });
  const assemblerUrl=new URL('/world-assembler.html',url).href;
  const assemblyNavigation=await send('Page.navigate',{url:assemblerUrl});
  if(assemblyNavigation.error)throw Error('World Builder page navigation failed');
  let assemblerBoot=null;
  for(let i=0;i<100;i++){
    try{assemblerBoot=await run("typeof window.__worldAssemblerProbe==='function' ? window.__worldAssemblerProbe():null");}
    catch{/* previous frame execution context can be replaced while navigating */}
    if(assemblerBoot)break;
    await sleep(120);
  }
  if(assemblerBoot?.source!=='WorldDocument'||assemblerBoot.areaIds.length!==1)
    throw Error('World Builder booted without canonical blank WorldDocument: '+
      JSON.stringify(assemblerBoot));
  const newWorldGraph=await run(`(()=>{
    const add=(name,kind)=>{
      document.querySelector('#area-name').value=name;
      document.querySelector('#area-kind').value=kind;
      document.querySelector('#area-add-form').requestSubmit();
    };
    add('Forêt du nord','exterior');
    add('Château secret','interior');
    const before=window.__worldAssemblerProbe();
    const source=before.initialAreaId;
    const instance=before.areaIds[2];
    document.querySelector('#link-from').value=source;
    document.querySelector('#link-to').value=instance;
    document.querySelector('#link-back').checked=true;
    document.querySelector('#connect-form').requestSubmit();
    const linked=window.__worldAssemblerProbe();
    document.querySelector('#start-area').click();
    const started=window.__worldAssemblerProbe();
    const panel=document.querySelector('.inspector').getBoundingClientRect();
    const header=document.querySelector('.app-header').getBoundingClientRect();
    const node=document.querySelector('.world-node.selected').getBoundingClientRect();
    return {before,linked,started,
      panelInLandscape:panel.right<=innerWidth&&panel.width>120,
      headerInLandscape:header.top>=0&&header.bottom<100,
      selectedGraphNodeVisible:node.width>150&&node.height>70,
      portalRows:document.querySelectorAll('.portal-row').length};
  })()`);
  if(newWorldGraph.before.areaIds.length!==3||
     newWorldGraph.linked.portalCount!==2||
     newWorldGraph.linked.graphEdgeCount!==2||
     newWorldGraph.started.initialAreaId!==newWorldGraph.started.selectedAreaId||
     newWorldGraph.portalRows<2||!newWorldGraph.panelInLandscape||
     !newWorldGraph.headerInLandscape||!newWorldGraph.selectedGraphNodeVisible)
    throw Error('World Builder visual assembly or canonical links failed: '+
      JSON.stringify(newWorldGraph));
  await run("document.querySelector('#edit-area').click();true");
  let detailed=null;
  for(let i=0;i<90;i++){
    await sleep(120);
    try{detailed=await run(`(()=>{
      const back=document.querySelector('#world-assembler-back');
      const area=document.querySelector('#area-select');
      return back&&area?.options.length===3 ? {
        backVisible:!back.hidden,selectedAreaId:area.value,
        width:document.querySelector('#area-width')?.value
      }:null;
    })()`);}catch{}
    if(detailed)break;
  }
  if(!detailed?.backVisible||detailed.selectedAreaId!==newWorldGraph.started.selectedAreaId)
    throw Error('Existing detailed Builder did not load target WorldArea: '+JSON.stringify(detailed));
  await run(`(()=>{
    const input=document.querySelector('#area-width');
    input.value='850';input.dispatchEvent(new Event('change',{bubbles:true}));
    document.querySelector('#world-assembler-back').click();
    return true;
  })()`);
  let returned=null;
  for(let i=0;i<90;i++){
    await sleep(120);
    try{returned=await run("typeof window.__worldAssemblerProbe==='function' ? window.__worldAssemblerProbe():null");}
    catch{}
    if(returned)break;
  }
  if(returned?.selectedWidth!==850||returned.areaIds.length!==3||
     returned.portalCount!==2||!returned.saved)
    throw Error('Detailed Builder failed to return canonical edited WorldDocument: '+
      JSON.stringify(returned));
  await send('Page.reload',{ignoreCache:true});
  let recovered=null;
  for(let i=0;i<90;i++){
    await sleep(120);
    try{recovered=await run("typeof window.__worldAssemblerProbe==='function' ? window.__worldAssemblerProbe():null");}
    catch{}
    if(recovered)break;
  }
  if(recovered?.selectedWidth!==850||recovered.portalCount!==2)
    throw Error('World Builder lost canonical local save after reload: '+JSON.stringify(recovered));
  console.log('World Builder graph -> detailed Builder -> graph + reload Chromium:',
    JSON.stringify({initial:assemblerBoot.areaIds.length,final:recovered.areaIds.length,
      portals:recovered.portalCount,editedArea:recovered.selectedAreaId,
      width:recovered.selectedWidth,mobileLandscape:true}));

  // 2.5D World Builder contract: an actual dungeon placed IN a host Area,
  // its entry placed on SculptTerrain, then real Portal -> WorldArea ->
  // Spawn traversal while Tester is running. Restore unchanged whole world.
  const authoredDungeon=await run(`(()=>{
    document.querySelector('.world-node[data-area-id="area-principale"]').click();
    document.querySelector('#area-name').value='Grotte du nord';
    document.querySelector('#area-kind').value='dungeon';
    document.querySelector('#area-kind').dispatchEvent(new Event('change'));
    document.querySelector('#area-add-form').requestSubmit();
    const result=window.__worldAssemblerProbe();
    const dungeonId=result.areaIds.at(-1);
    const saved=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1'));
    const dungeon=saved.areas.find(a=>a.id===dungeonId);
    return {...result,dungeonId,siteKind:dungeon?.siteKind,
      host: saved.portals.find(p=>p.targetAreaId===dungeonId)?.sourceAreaId,
      terrainWidth:dungeon.width/28,terrainHeight:dungeon.height/21};
  })()`);
  if(authoredDungeon.areaIds.length!==4||authoredDungeon.portalCount!==4||
     authoredDungeon.siteKind!=='dungeon'||authoredDungeon.host!=='area-principale'||
     authoredDungeon.terrainWidth!==18||authoredDungeon.terrainHeight!==14)
    throw Error('Dungeon not physically contained by host WorldArea Portal: '+
      JSON.stringify(authoredDungeon));
  await run(`(()=>{
    document.querySelector('.world-node[data-area-id="area-principale"]').click();
    document.querySelector('#edit-sculpt-area').click();
    return true;
  })()`);
  let worldSculpt=null;
  for(let i=0;i<90;i++){
    await sleep(110);
    try{worldSculpt=await run("typeof window.__sculptWorldProbe==='function' ? window.__sculptWorldProbe():null");}
    catch{}
    if(worldSculpt)break;
  }
  if(worldSculpt?.areaId!=='area-principale'||worldSculpt.areaCount!==4||
     worldSculpt.portalCount!==4||worldSculpt.terrainWidth!==36)
    throw Error('Sculpt editor did not load canonical host Area: '+JSON.stringify(worldSculpt));

  // Real mobile viewport, not merely a CSS/text assertion: the collapsed
  // Portal palette must leave the playfield visible and fullscreen reachable.
  await send('Emulation.setDeviceMetricsOverride',{
    width:960,height:540,deviceScaleFactor:1,mobile:true,
    screenWidth:960,screenHeight:540
  });
  const uxInitial=await run(`(()=>{
    const panel=document.querySelector('#world-area-portal-panel');
    const full=document.querySelector('#fullscreen-toggle');
    const r=full.getBoundingClientRect(),p=panel.getBoundingClientRect();
    const hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
    return {worldMode:document.body.classList.contains('world-area-editing'),
      open:panel.open,panelHeight:p.height,panelWidth:p.width,
      fullscreenRect:{x:r.left+r.width/2,y:r.top+r.height/2},
      fullscreenHit:hit===full||full.contains(hit),
      fullscreenVisible:r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight,
      viewport:[innerWidth,innerHeight]};
  })()`);
  if(!uxInitial.worldMode||uxInitial.open||uxInitial.panelHeight>47||
     !uxInitial.fullscreenVisible||!uxInitial.fullscreenHit)
    throw Error('WorldArea Portal inspector blocks fullscreen or starts huge: '+
      JSON.stringify(uxInitial));
  const fullPoint=uxInitial.fullscreenRect;
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
    {x:fullPoint.x,y:fullPoint.y,id:31,radiusX:6,radiusY:6,force:1}
  ]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(180);
  const uxFullscreen=await run(`(()=>{
    const canvas=document.querySelector('#sculpt-canvas').getBoundingClientRect();
    const panel=document.querySelector('#world-area-portal-panel');
    return {immersive:document.body.classList.contains('sculpt-immersive'),
      fullscreenPressed:document.querySelector('#fullscreen-toggle').getAttribute('aria-pressed'),
      canvasWidth:canvas.width,canvasHeight:canvas.height,
      viewportWidth:innerWidth,viewportHeight:innerHeight,
      paletteHeight:panel.getBoundingClientRect().height};
  })()`);
  if(!uxFullscreen.immersive||uxFullscreen.fullscreenPressed!=='true'||
     uxFullscreen.canvasHeight<uxFullscreen.viewportHeight*.90||
     uxFullscreen.canvasWidth<uxFullscreen.viewportWidth*.90||
     uxFullscreen.paletteHeight>47)
    throw Error('WorldArea fullscreen cannot reveal whole 2.5D map: '+
      JSON.stringify(uxFullscreen));
  const detailsPoint=await run(`(()=>{
    const summary=document.querySelector('#world-area-portal-panel summary');
    const r=summary.getBoundingClientRect();
    const x=r.left+r.width/2,y=r.top+r.height/2;
    const hit=document.elementFromPoint(x,y);
    return {x,y,hittable:hit===summary||summary.contains(hit)};
  })()`);
  if(!detailsPoint.hittable)
    throw Error('Collapsed Portal badge is not touchable in fullscreen: '+
      JSON.stringify(detailsPoint));
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
    {x:detailsPoint.x,y:detailsPoint.y,id:32,radiusX:5,radiusY:5,force:1}
  ]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  const uxOpened=await run(`(()=>{
    const panel=document.querySelector('#world-area-portal-panel');
    const rect=panel.getBoundingClientRect();
    const full=document.querySelector('#fullscreen-toggle');
    const f=full.getBoundingClientRect();
    const hit=document.elementFromPoint(f.left+f.width/2,f.top+f.height/2);
    return {open:panel.open,width:rect.width,height:rect.height,
      viewportWidth:innerWidth,viewportHeight:innerHeight,
      scrollable:panel.scrollHeight>panel.clientHeight,
      fullscreenStillHit:hit===full||full.contains(hit)};
  })()`);
  if(!uxOpened.open||uxOpened.width>258||
     uxOpened.height>uxOpened.viewportHeight*.56||
     !uxOpened.scrollable||!uxOpened.fullscreenStillHit)
    throw Error('Expanded Portal inspector too large or obstructs fullscreen: '+
      JSON.stringify(uxOpened));
  const uxPlacement=await run(`(()=>{
    document.querySelector('#world-area-portal-place').click();
    return window.__sculptWorldProbe();
  })()`);
  if(uxPlacement.inspectorOpen||uxPlacement.placementMode!=='portal')
    throw Error('Portal pointer placement must immediately expose terrain: '+
      JSON.stringify(uxPlacement));
  await run(`(()=>{
    const panel=document.querySelector('#world-area-portal-panel');
    panel.open=true;
    document.querySelector('#world-area-portal-place').click();
    return true;
  })()`);
  const uxCanceled=await run("window.__sculptWorldProbe()");
  if(uxCanceled.placementMode!==null)
    throw Error('Portal authoring mode not cancellable from compact panel');
  const closingPoint=await run(`(()=>{
    const full=document.querySelector('#fullscreen-toggle'),r=full.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};
  })()`);
  await send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
    {x:closingPoint.x,y:closingPoint.y,id:33,radiusX:6,radiusY:6,force:1}
  ]});
  await send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await sleep(150);
  if((await run("document.body.classList.contains('sculpt-immersive')"))!==false)
    throw Error('Original fullscreen action cannot return to normal WorldArea editing');
  console.log('WorldArea Portal compact/touch/fullscreen mobile Chromium:',
    JSON.stringify({collapsed:uxInitial.panelHeight,
      expanded:uxOpened.height,fullCanvas:uxFullscreen.canvasHeight,
      touchFullscreen:true,scrollable:uxOpened.scrollable}));

  const placedWorldPortal=await run(`(()=>{
    const gate=window.__sculptWorldProbe().outgoing.find(p=>
      p.targetAreaId==='grotte-du-nord');
    if(!gate) return {error:'no dungeon entry'};
    const list=document.querySelector('#world-area-portal-select');
    list.value=gate.id;list.dispatchEvent(new Event('change'));
    const spawn=window.__sculptWorldProbe().spawns[0];
    document.querySelector('#world-area-portal-x').value=String(spawn.x+12);
    document.querySelector('#world-area-portal-y').value=String(spawn.y);
    document.querySelector('#world-area-portal-save').click();
    document.querySelector('#navigation-toggle').click();
    return {gate,spawn,sculpt:window.__sculptWorldProbe(),
      inspectorHidden:getComputedStyle(document.querySelector('#world-area-portal-panel')).display==='none',
      nav:window.__sculptNavProbe()};
  })()`);
  if(!placedWorldPortal.inspectorHidden)throw Error('Portal inspector overlaps the playable hero during testing');
  if(placedWorldPortal.error||!placedWorldPortal.nav.enabled||
     !placedWorldPortal.sculpt.traverseVisible)
    throw Error('Host 2.5D portal not reachable in actual gameplay: '+
      JSON.stringify(placedWorldPortal));
  // Real mobile CSS layout: previously the button was in normal document
  // flow, so the code saw it but the user never saw/could touch it.
  const visibleTraverse=await run(`(()=>{
    const button=document.querySelector('#world-portal-traverse');
    const canvas=document.querySelector('.canvas-wrap');
    const rect=button.getBoundingClientRect(),bounds=canvas.getBoundingClientRect();
    return {position:getComputedStyle(button).position,
      display:getComputedStyle(button).display,disabled:button.disabled,
      label:button.textContent,
      rect:{x:rect.x,y:rect.y,w:rect.width,h:rect.height},
      canvas:{x:bounds.x,y:bounds.y,w:bounds.width,h:bounds.height}};
  })()`);
  if(visibleTraverse.position!=='absolute'||visibleTraverse.display==='none'||
     visibleTraverse.disabled||visibleTraverse.rect.w<80||
     visibleTraverse.rect.x<visibleTraverse.canvas.x||
     visibleTraverse.rect.y<visibleTraverse.canvas.y||
     visibleTraverse.rect.x+visibleTraverse.rect.w>
       visibleTraverse.canvas.x+visibleTraverse.canvas.w+2||
     visibleTraverse.rect.y+visibleTraverse.rect.h>
       visibleTraverse.canvas.y+visibleTraverse.canvas.h+2)
    throw Error('Mobile Portal action not physically visible within canvas: '+
      JSON.stringify(visibleTraverse));
  const enteredDungeon=await run(`(()=>{
    document.querySelector('#world-portal-traverse').click();
    return {sculpt:window.__sculptWorldProbe(),nav:window.__sculptNavProbe()};
  })()`);
  if(enteredDungeon.sculpt.areaId!=='grotte-du-nord'||
     enteredDungeon.sculpt.siteKind!=='dungeon'||
     enteredDungeon.sculpt.terrainWidth!==18||
     enteredDungeon.nav.player===null)
    throw Error('Canonical Portal did not load live 2.5D dungeon Area: '+
      JSON.stringify(enteredDungeon));
  const placedDungeonReturn=await run(`(()=>{
    document.querySelector('#navigation-toggle').click();
    const current=window.__sculptWorldProbe();
    const back=current.outgoing.find(p=>p.targetAreaId==='area-principale');
    if(!back)return {error:'no return portal'};
    const list=document.querySelector('#world-area-portal-select');
    list.value=back.id;list.dispatchEvent(new Event('change'));
    const spawn=window.__sculptWorldProbe().spawns[0];
    document.querySelector('#world-area-portal-x').value=String(spawn.x+12);
    document.querySelector('#world-area-portal-y').value=String(spawn.y);
    document.querySelector('#world-area-portal-save').click();
    document.querySelector('#navigation-toggle').click();
    return {sculpt:window.__sculptWorldProbe(),nav:window.__sculptNavProbe()};
  })()`);
  if(placedDungeonReturn.error||!placedDungeonReturn.sculpt.traverseVisible)
    throw Error('Dungeon return Portal not reachable: '+JSON.stringify(placedDungeonReturn));
  const backOutside=await run(`(()=>{
    document.querySelector('#world-portal-traverse').click();
    return window.__sculptWorldProbe();
  })()`);
  if(backOutside.areaId!=='area-principale')
    throw Error('Dungeon -> host Portal transition failed: '+JSON.stringify(backOutside));
  await run("document.querySelector('#world-area-return').click();true");
  let returned2p5d=null;
  for(let i=0;i<90;i++){
    await sleep(110);
    try{returned2p5d=await run(`(()=>{
      const probe=window.__worldAssemblerProbe?.();
      if(!probe)return null;
      const doc=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1'));
      return {...probe,dungeon:doc.areas.find(a=>a.id==='grotte-du-nord'),
        exterior:doc.areas.find(a=>a.id==='area-principale')};
    })()`);}catch{}
    if(returned2p5d)break;
  }
  if(returned2p5d?.areaIds.length!==4||returned2p5d.portalCount!==4||
     returned2p5d.dungeon?.sculptTerrain?.width!==18||
     returned2p5d.exterior?.sculptTerrain?.width!==36||
     !returned2p5d.exterior?.surface||!returned2p5d.saved)
    throw Error('Saved dungeon sculpt terrain or real portals lost on return: '+
      JSON.stringify(returned2p5d));
  // The SAME WorldDocument is edited from two user-facing panels.
  // Choose a non-default size in the world panel, open that WorldArea in
  // 2.5D using the top navigation, then switch back without losing anything.
  const unifiedSize=await run(`(()=>{
    const w=document.querySelector('#area-width'),h=document.querySelector('#area-height');
    w.value='40';h.value='31';
    w.dispatchEvent(new Event('input'));h.dispatchEvent(new Event('input'));
    document.querySelector('#area-name').value='Grande clairière';
    document.querySelector('#area-kind').value='exterior';
    document.querySelector('#area-add-form').requestSubmit();
    const last=window.__worldAssemblerProbe();
    const map=document.querySelector('#world-workspace-map');
    const rect=map.getBoundingClientRect();
    const point=document.elementFromPoint(rect.x+rect.width/2,rect.y+rect.height/2);
    return {...last,tabVisible:rect.width>40&&rect.height>30,
      tabTouchable:point===map||map.contains(point)};
  })()`);
  if(unifiedSize.selectedWidth!==40*28||
     !unifiedSize.tabVisible||!unifiedSize.tabTouchable)
    throw Error('A new WorldArea size/panel tab is not functional on mobile: '+
      JSON.stringify(unifiedSize));
  await run("document.querySelector('#world-workspace-map').click();true");
  let unifiedMap=null;
  for(let i=0;i<90;i++){
    await sleep(110);
    try{unifiedMap=await run(`(()=>{
      const p=window.__sculptWorldProbe?.();
      return p?{...p,hasWorldTab:!!document.querySelector('#world-workspace-world'),
        hasNewMapTab:!!document.querySelector('#world-area-create-another'),
        worldHeader:document.querySelector('header h1')?.textContent}:null;
    })`);}catch{}
    if(unifiedMap)break;
  }
  if(unifiedMap?.terrainWidth!==40||unifiedMap.terrainHeight!==31||
    !unifiedMap.hasWorldTab||!unifiedMap.hasNewMapTab||
    !unifiedMap.worldHeader?.includes('World Builder'))
    throw Error('Sculpt Map panel is not the same selected WorldArea: '+
      JSON.stringify(unifiedMap));
  await run("document.querySelector('#world-workspace-world').click();true");
  let unifiedBack=null;
  for(let i=0;i<90;i++){
    await sleep(110);
    try{unifiedBack=await run(`(()=>{
      const probe=window.__worldAssemblerProbe?.();if(!probe)return null;
      const doc=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1'));
      return {...probe,created:doc.areas.find(a=>a.label==='Grande clairière')};
    })`);}catch{}
    if(unifiedBack)break;
  }
  if(unifiedBack?.selectedWidth!==40*28||
    unifiedBack.created?.height!==31*21||!unifiedBack.saved)
    throw Error('World/Map panel switch lost the canonical WorldArea: '+
      JSON.stringify(unifiedBack));
  console.log('Unified World/Map panels Chromium GREEN:',
    JSON.stringify({size:'40x31',areaId:unifiedBack.selectedAreaId,
      saved:unifiedBack.saved,oneWorldDocument:true}));
  console.log('World Builder -> physical 2.5D Portal -> dungeon -> host + save Chromium:',
    JSON.stringify({areas:returned2p5d.areaIds.length,
      portals:returned2p5d.portalCount,
      dungeonGrid:returned2p5d.dungeon.sculptTerrain.width+'x'+
        returned2p5d.dungeon.sculptTerrain.height,returned:true}));
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
