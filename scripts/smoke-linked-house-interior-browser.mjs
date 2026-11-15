// Real browser gate for the exact bug: click a linked house, see and use the
// existing wall/floor/exit inspector, save, return, and reload. No synthetic UI.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {createBlankWorldBuilderDraft,addWorldObject,serializeWorldBuilderDraft}
 from '../src/builder/world-builder-draft.js';
import {linkSculptWorldBuildingInteriorV1}
 from '../src/builder/sculpt-world-area-link.js';

const contentRoot=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(contentRoot,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(contentRoot+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('missing');}
});
const binary=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(v=>v&&spawnSync('which',[v]).status===0);
if(!binary)throw Error('A real Chromium binary is required');
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
let world=createBlankWorldBuilderDraft({width:36*28,height:24*21});
const outside=world.areas.find(a=>a.kind==='exterior')??world.areas[0];
world=addWorldObject(world,outside.id,{
 id:'browser-real-house',objectDefinitionId:'objectdef.building.house.blue_cottage.01',
 transform:{x:510,y:305,rotationDeg:0,scaleX:1,scaleY:1}
});
const linked=linkSculptWorldBuildingInteriorV1(world,{
 sourceAreaId:outside.id,buildingId:'browser-real-house'});
world=linked.document;
const ground=linked.targetAreaId,exterior=outside.id;
const serialized=serializeWorldBuilderDraft(world);
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const port=server.address().port;
const profile=await mkdtemp(resolve(tmpdir(),'linked-world-house-'));
let chrome,socket;
try{
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--window-size=1400,900',
  '--remote-debugging-port=0','--user-data-dir='+profile,
  'http://127.0.0.1:'+port+'/world-assembler.html'],{stdio:['ignore','ignore','pipe']});
 const chromePort=await new Promise((ok,fail)=>{
  let stderr='';const timeout=setTimeout(()=>fail(Error('DevTools timeout '+stderr.slice(-500))),45000);
  chrome.stderr.on('data',chunk=>{stderr+=String(chunk);
   const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
   if(m){clearTimeout(timeout);ok(Number(m[1]));}
  });
  chrome.once('error',fail);chrome.once('exit',code=>fail(Error('Chrome exited '+code)));
 });
 let target;
 for(let i=0;i<100;i++){
  const targets=await(await fetch('http://127.0.0.1:'+chromePort+'/json')).json();
  target=targets.find(t=>t.type==='page'&&t.url.includes('world-assembler.html'));
  if(target)break;await sleep(150);
 }
 if(!target)throw Error('Chromium tab missing');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  socket.addEventListener('open',ok,{once:true});
  socket.addEventListener('error',fail,{once:true});
 });
 let seq=0;const pending=new Map();
 socket.addEventListener('message',event=>{
  const message=JSON.parse(event.data),callback=pending.get(message.id);
  if(callback){pending.delete(message.id);callback(message);}
 });
 const call=(method,params={})=>new Promise((ok,fail)=>{
  const id=++seq,timeout=setTimeout(()=>{pending.delete(id);
    fail(Error('CDP timeout '+method));},30000);
  pending.set(id,response=>{clearTimeout(timeout);
   if(response.error)fail(Error(JSON.stringify(response.error)));
   else ok(response);
  });
  socket.send(JSON.stringify({id,method,params}));
 });
 const run=async expression=>{
  const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.result?.exceptionDetails)
    throw Error('Chromium evaluation '+JSON.stringify(result.result.exceptionDetails));
  return result.result?.result?.value;
 };
 const until=async(expression,label)=>{
  for(let i=0;i<140;i++){
   let value;try{value=await run(expression);}catch{}
   if(value)return value;
   await sleep(140);
  }
  throw Error('Timeout '+label);
 };
 await until('document.readyState==="complete"','initial page');
 await run(`(()=>{
  localStorage.setItem('gensrpg.world-assembler.document.v1',${JSON.stringify(serialized)});
  sessionStorage.setItem('gensrpg.world-assembler.handoff.v1',
    ${JSON.stringify(JSON.stringify({schemaVersion:1,document:world,areaId:ground}))});
 })()`);
 await call('Page.navigate',{url:'http://127.0.0.1:'+port+
   '/sculpt-lab.html?worldAssembler=1&areaId='+encodeURIComponent(ground)});
 const opened=await until(`(()=>{
  const probe=window.__sculptWorldProbe?.();
  if(!probe?.editable||probe.areaId!==${JSON.stringify(ground)})return null;
  const bar=document.querySelector('#interior-area-bar');
  const tools=document.querySelector('#interior-controls-details');
  return {barVisible:!bar.hidden,collapsed:!tools.open,
   floorAdd:!document.querySelector('#interior-level-add').disabled,
   wallsEnabled:!document.querySelector('#interior-wall-toggle').disabled,
   returnButton:!document.querySelector('#interior-area-return').hidden,
   hasUniqueInspector:document.querySelectorAll('#interior-area-bar').length===1};
 })()`,'linked house inspector');
 if(!Object.values(opened).every(Boolean))
   throw Error('Linked house still loses editor controls '+JSON.stringify(opened));
 const enabled=await run(`(()=>{
  document.querySelector('#interior-controls-details').open=true;
  const wall=document.querySelector('#interior-wall-toggle');
  wall.click();
  const details=document.querySelector('#interior-controls-details');
  return {mode:wall.getAttribute('aria-pressed'),autoCollapsed:!details.open};
 })()`);
 if(enabled.mode!=='true'||!enabled.autoCollapsed)
  throw Error('Native wall authoring did not free the canvas '+JSON.stringify(enabled));
 let drawn=false;
 for(const [ax,ay,bx,by] of [[.43,.54,.57,.54],[.42,.46,.58,.48],[.4,.56,.6,.56]]){
  const rect=await run(`(()=>{
   const c=document.querySelector('#sculpt-canvas'),r=c.getBoundingClientRect();
   return {left:r.left,top:r.top,width:r.width,height:r.height};
  })()`);
  const x1=rect.left+rect.width*ax,y1=rect.top+rect.height*ay;
  const x2=rect.left+rect.width*bx,y2=rect.top+rect.height*by;
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:x1,y:y1});
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:x1,y:y1,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:x2,y:y2,button:'left',buttons:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:x2,y:y2,button:'left',clickCount:1});
  await sleep(160);
  drawn=await run('window.__sculptLabProbe?.()?.interiorWallCount>0');
  if(drawn)break;
 }
 if(!drawn){
  const diagnostic=await run(`(()=>{
   const canvas=document.querySelector('#sculpt-canvas');
   const r=canvas.getBoundingClientRect();
   const element=document.elementFromPoint(r.left+r.width*.5,r.top+r.height*.5);
   return {wallCount:window.__sculptLabProbe?.()?.interiorWallCount,
     status:document.querySelector('#notice')?.textContent,
     wallInfo:document.querySelector('#interior-wall-info')?.textContent,
     wallMode:document.querySelector('#interior-wall-toggle')?.getAttribute('aria-pressed'),
     centerElement:element?.id||element?.className,
     canvas:{left:r.left,top:r.top,width:r.width,height:r.height}};
  })()`);
  throw Error('Real canvas gesture never built a wall on linked house '+JSON.stringify(diagnostic));
 }
 const changed=await run(`(()=>{
  document.querySelector('#interior-controls-details').open=true;
  const material=document.querySelector('#interior-wall-material');
  material.value='stone';material.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#interior-wall-toggle').click();
  const before=window.__sculptWorldProbe?.();
  document.querySelector('#interior-level-add').click();
  return {before,detailOpen:document.querySelector('#interior-controls-details').open};
 })()`);
 const first=await until(`(()=>{
  const p=window.__sculptWorldProbe?.();
  return p?.areaId!==${JSON.stringify(ground)}&&p?.areaKind==='interior'?p:null;
 })()`,'upper floor');
 if(!first.areaId)throw Error('Upper floor missing');
 const floorOne=first.areaId;
 const houseState=await run(`(()=>{
  const doc=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
  const base=doc?.areas.find(a=>a.id===${JSON.stringify(ground)});
  const upper=doc?.areas.find(a=>a.id===${JSON.stringify(floorOne)});
  const floorPortals=doc?.portals.filter(p=>
   [${JSON.stringify(ground)},${JSON.stringify(floorOne)}].includes(p.sourceAreaId)&&
   [${JSON.stringify(ground)},${JSON.stringify(floorOne)}].includes(p.targetAreaId));
  return {wallCount:base?.walls.length,wallMaterialId:base?.wallMaterialId,
   floorLevel:upper?.interiorFloor?.level,portals:floorPortals?.length,
   selectorCount:document.querySelector('#interior-level-select')?.options.length};
 })()`);
 if(houseState.wallCount<1||houseState.wallMaterialId!=='stone'||
    houseState.floorLevel!==1||houseState.portals!==2||houseState.selectorCount!==2)
  throw Error('Wall/floor save did not roundtrip through the official world '+JSON.stringify(houseState));
 await run(`(()=>{
  document.querySelector('#interior-area-return').click();
 })()`);
 await until(`window.__sculptWorldProbe?.()?.areaId===${JSON.stringify(exterior)}`,
  'return to exterior');
 const home=await run(`(()=>{
  const doc=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
  return {interior:doc?.areas.find(a=>a.id===${JSON.stringify(ground)}),
   floor:doc?.areas.find(a=>a.id===${JSON.stringify(floorOne)}),
   hasHouse:doc?.areas.find(a=>a.id===${JSON.stringify(exterior)})?.objects
     .some(o=>o.id==='browser-real-house')};
 })()`);
 if(!home.hasHouse||home.interior?.walls.length<1||home.floor?.interiorFloor?.level!==1)
  throw Error('Return to house lost authored map '+JSON.stringify(home));
 console.log('GREEN Chromium: linked house inspector + actual wall drag + stone material + upper floor + return exterior + canonical reload-safe state');
}finally{
 try{socket?.close();}catch{}
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const exited=once(chrome,'exit');chrome.kill('SIGKILL');await exited;
 }
 await new Promise(ok=>server.close(ok));
 await rm(profile,{recursive:true,force:true,maxRetries:12,retryDelay:170});
}
