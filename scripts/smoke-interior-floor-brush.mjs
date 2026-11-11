// Real Chromium gate: indoor floor editing must work ONLY through World Builder
// and the canonical Sculpt 2.5D map. No retired builder launch or fake writes.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css',
 '.json':'application/json','.webp':'image/webp','.png':'image/png'};
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
const binary=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(bin=>bin&&spawnSync('which',[bin]).status===0);
if(!binary)throw Error('Chromium unavailable');
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const profile=await mkdtemp(resolve(tmpdir(),'world-interior-floor-'));
let chrome,socket;
try{
 const url='http://127.0.0.1:'+server.address().port+'/world-assembler.html';
 chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--window-size=1400,900',
  '--remote-debugging-port=0','--user-data-dir='+profile,url],
  {stdio:['ignore','ignore','pipe']});
 const port=await new Promise((ok,fail)=>{
  let stderr='';const timeout=setTimeout(()=>fail(Error('DevTools timeout '+stderr.slice(-500))),45000);
  chrome.stderr.on('data',chunk=>{stderr+=String(chunk);
   const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
   if(m){clearTimeout(timeout);ok(Number(m[1]));}
  });
  chrome.once('error',fail);chrome.once('exit',code=>fail(Error('Chrome exited '+code)));
 });
 let target;
 for(let i=0;i<70;i++){
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  target=tabs.find(x=>x.type==='page'&&x.url.includes('/world-assembler.html'));
  if(target)break;await sleep(150);
 }
 if(!target)throw Error('World Builder tab unavailable');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});
 });
 let next=0;const pending=new Map();
 socket.addEventListener('message',e=>{
  const msg=JSON.parse(e.data),reply=pending.get(msg.id);
  if(reply){pending.delete(msg.id);reply(msg);}
 });
 const command=(method,params={})=>new Promise((ok,fail)=>{
  const id=++next,timeout=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout '+method));},30000);
  pending.set(id,msg=>{clearTimeout(timeout);
   if(msg.error)fail(Error(JSON.stringify(msg.error)));else ok(msg);
  });
  socket.send(JSON.stringify({id,method,params}));
 });
 const run=async expression=>{
  const out=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(out.result?.exceptionDetails)throw Error('Chrome evaluation '+JSON.stringify(out.result.exceptionDetails));
  return out.result?.result?.value;
 };
 const until=async(expression,name)=>{
  for(let i=0;i<140;i++){
   let value=null;try{value=await run(expression);}catch{}
   if(value)return value;await sleep(180);
  }
  throw Error('Timeout '+name);
 };
 await until("window.__worldAssemblerProbe?.()?.source==='WorldDocument'",'WorldAssembler');
 const created=await run(`(()=>{
  const name=document.querySelector('#area-name');name.value='Intérieur 2.5D';
  name.dispatchEvent(new Event('input',{bubbles:true}));
  const kind=document.querySelector('#area-kind');
  kind.value='interior';kind.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#area-add-form').requestSubmit();
  return window.__worldAssemblerProbe();
 })()`);
 if(!created.areaKinds.includes('interior'))throw Error('World Builder failed to create an interior '+JSON.stringify(created));
 const id=created.selectedAreaId;
 await run("document.querySelector('#world-workspace-map').click()");
 const opened=await until(`(()=>{
  const probe=window.__sculptWorldProbe?.();
  return location.pathname==='/sculpt-lab.html'&&probe?.editable&&
   probe.areaId===${JSON.stringify(id)}?probe:null;
 })()`,'native Sculpt WorldArea');
 if(opened.areaKind!=='interior')throw Error('Wrong interior '+JSON.stringify(opened));
 const control=await run(`(()=>{
  document.querySelector('#mode-surface').click();
  const base=document.querySelector('#world-interior-floor-base');
  return {visible:!document.querySelector('#world-interior-floor-base-row').hidden,
   open:!document.querySelector('#surface-palette').hidden,
   bases:[...base.options].map(x=>x.value),
   enabled:[...document.querySelector('#surface-material').options]
    .filter(x=>!x.disabled).map(x=>x.value)};
 })()`);
 const floors=['floor.wood.house','floor.wood.dark','floor.tile.light','floor.tile.sandstone','floor.concrete.gray'];
 if(!control.visible||!control.open||
  !floors.every(x=>control.bases.includes(x)&&control.enabled.includes(x)))
  throw Error('Native interior floor controls missing '+JSON.stringify(control));
 await run(`(()=>{
  const base=document.querySelector('#world-interior-floor-base');
  base.value='floor.wood.dark';base.dispatchEvent(new Event('change',{bubbles:true}));
  const material=document.querySelector('#surface-material');
  material.value='floor.tile.light';material.dispatchEvent(new Event('change',{bubbles:true}));
  const width=document.querySelector('#surface-width');
  width.value='3';width.dispatchEvent(new Event('input',{bubbles:true}));
 })()`);
 let painted;
 for(const [rx,ry] of [[.5,.5],[.45,.55],[.55,.45],[.5,.6]]){
  const rect=await run(`(()=>{const r=document.querySelector('#sculpt-canvas').getBoundingClientRect();
   return {left:r.left,top:r.top,width:r.width,height:r.height};})()`);
  const x=rect.left+rect.width*rx,y=rect.top+rect.height*ry;
  await command('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
  await command('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
  await command('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});
  await sleep(100);
  painted=await run("window.__sculptSurfaceProbe?.()");
  if(painted?.features?.some(f=>f.materialId==='floor.tile.light'&&f.width>0))break;
 }
 if(!painted?.features?.some(f=>f.materialId==='floor.tile.light'&&f.width>0)||!painted.undoCount)
  throw Error('Actual Sculpt floor brush did not paint '+JSON.stringify(painted));
 const undo=await run(`(()=>{
  const before=window.__sculptSurfaceProbe().features.length;
  document.querySelector('#surface-undo').click();
  const after=window.__sculptSurfaceProbe().features.length;
  document.querySelector('#surface-redo').click();
  return {before,after,redone:window.__sculptSurfaceProbe().features.length};
 })()`);
 if(undo.after!==undo.before-1||undo.redone!==undo.before)
  throw Error('Sculpt floor undo/redo broke '+JSON.stringify(undo));
 await run("document.querySelector('#world-area-return').click()");
 const saved=await until(`(()=>{
  const probe=window.__worldAssemblerProbe?.();
  const world=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
  const area=world?.areas?.find(a=>a.id===${JSON.stringify(id)});
  return probe&&area&&location.pathname==='/world-assembler.html'?{area,probe}:null;
 })()`,'WorldArea save');
 if(saved.area.surface?.baseMaterialId!=='floor.wood.dark'||
  !saved.area.surface?.zones?.some(x=>x.materialId==='floor.tile.light')||
  saved.probe.source!=='WorldDocument')
  throw Error('Official WorldDocument did not save painted interior '+JSON.stringify(saved.area.surface));
 console.log('GREEN Chromium: native World Builder -> Sculpt 2.5D interior, five original floor materials, real pointer brush, undo/redo and one saved WorldDocument');
}finally{
 try{socket?.close();}catch{}
 try{chrome?.kill('SIGKILL');}catch{}
 server.close();await rm(profile,{recursive:true,force:true});
}
