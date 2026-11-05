// Real Chromium integration gate: same-origin GenSRPG scoped hero grant
// -> actual Hero IndexedDB -> native 2.5D Jouer Map Actor renderer.
// Uses the real WorldDocument/play checkpoint owner, no demo snapshot.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.json':'application/json','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml','.css':'text/css','.mp3':'audio/mpeg'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end('missing');}
});
const browser=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(p=>p&&spawnSync('which',[p]).status===0);
if(!browser)throw Error('Native Chromium required');
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
const profile=await mkdtemp(resolve(tmpdir(),'hero-play-'));
const origin='http://127.0.0.1:'+server.address().port;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let chrome,socket,seq=0;
const pending=new Map(),exceptions=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++seq;
 const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},30000);
 pending.set(id,p=>{clearTimeout(timer);
  if(p.error)reject(Error('CDP '+JSON.stringify(p.error)));
  else resolve(p);
 });
 socket.send(JSON.stringify({id,method,params}));
});
const evaluate=async expression=>{
 const p=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(p.result?.exceptionDetails)
  throw Error('Browser JS '+JSON.stringify(p.result.exceptionDetails).slice(0,1050));
 return p.result?.result?.value;
};
async function waitFor(expression,title,attempts=115){
 let value;
 for(let n=0;n<attempts;n++){
  value=await evaluate(expression);
  if(value)return value;
  await sleep(220);
 }
 let observed;
 try{
  observed=await evaluate("(()=>({href:location.href,title:document.title,ready:document.readyState,body:document.body?.textContent?.slice(0,400),heroNameCount:document.querySelectorAll('#hero-name').length}))()");
 }catch(error){observed={probeError:error.message};}
 throw Error('No '+title+' (last '+JSON.stringify(value)+', page '+JSON.stringify(observed)+', exceptions '+JSON.stringify(exceptions.slice(-3))+')');
}
try{
 chrome=spawn(browser,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--remote-debugging-port=0',
  '--window-size=932,430','--user-data-dir='+profile,
  origin+'/hero-editor.html'],{stdio:['ignore','ignore','pipe']});
 const port=await new Promise((ok,fail)=>{
  let log='';
  const timer=setTimeout(()=>fail(Error('Chrome port timeout '+log.slice(-500))),45000);
  chrome.stderr.on('data',b=>{
   log+=b.toString();
   const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(log);
   if(match){clearTimeout(timer);ok(+match[1]);}
  });
  chrome.once('error',fail);
  chrome.once('exit',code=>fail(Error('Chrome exit '+code)));
 });
 let tab;
 for(let n=0;n<60;n++){
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  tab=tabs.find(x=>x.type==='page'&&x.url.includes('/hero-editor.html'));
  if(tab)break;
  await sleep(140);
 }
 if(!tab)throw Error('Hero Editor startup tab missing');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});
  socket.addEventListener('error',fail,{once:true});});
 socket.addEventListener('message',e=>{
  const p=JSON.parse(e.data);
  if(p.method==='Runtime.exceptionThrown')
   exceptions.push(p.params?.exceptionDetails?.exception?.description||
    p.params?.exceptionDetails?.text||'unknown exception');
  const cb=pending.get(p.id);
  if(cb){pending.delete(p.id);cb(p);}
 });
 await send('Runtime.enable');
 await send('Page.enable');
 await send('Emulation.setDeviceMetricsOverride',
  {width:932,height:430,deviceScaleFactor:2,mobile:true});
 await send('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:5});
 await waitFor("document.querySelector('#hero-name')!==null",'hero editor');
 const generated=await evaluate(`(async()=>{
  const {createBlankWorldBuilderDraft}=await import('/src/builder/world-builder-draft.js');
  const {worldAreaSizeFromTiles}=await import('/src/builder/world-area-size-command.js');
  const {saveWorldAssemblerDraft}=await import('/src/builder/world-assembler-handoff.js');
  const {createNewExplorationPlay}=await import('/src/play/exploration-play-session.js');
  const {createUserHeroDefinitionV1}=await import('/src/actors/user-hero-definition-v1.js');
  const {createUserHeroStoreV1}=await import('/src/storage/user-hero-store-v1.js');
  const c=document.createElement('canvas');c.width=c.height=128;
  const ctx=c.getContext('2d');ctx.fillStyle='#b45aeb';ctx.fillRect(37,20,54,90);
  const png=await new Promise(ok=>c.toBlob(ok,'image/png'));
  const heroId='hero.user.'+crypto.randomUUID();
  const hero=createUserHeroDefinitionV1({
   id:heroId,name:'Héroïne réelle du Jouer',
   base:{blob:png,width:128,height:128,mimeType:'image/png'},
   mode:'image',now:new Date().toISOString()
  });
  await createUserHeroStoreV1().put(hero);
  // Reproduce the rejected legacy WorldBuilder default without weakening its
  // guard or resizing a real author document. The Play checkpoint must never
  // be created for an unsupported 2400×1600 WorldArea.
  const unsupported=createBlankWorldBuilderDraft({
   id:'world-hero-unsupported',width:2400,height:1600
  });
  const invalidSession='hero-oversized-validation-probe';
  let rejectedOversize=false;
  try{createNewExplorationPlay(localStorage,unsupported,{sessionId:invalidSession});}
  catch(error){
   if(!/Zone hors des dimensions prises en charge/.test(error?.message||''))throw error;
   rejectedOversize=true;
  }
  if(!rejectedOversize||
     localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+invalidSession)!==null)
   throw Error('Unsupported WorldDocument was silently resized or checkpointed');
  // This is an actual authorable 2.5D WorldArea: use the SAME canonical
  // tile→world converter as the World Assembler instead of a demo map.
  const size=worldAreaSizeFromTiles({width:36,height:24});
  const world=createBlankWorldBuilderDraft({id:'world-hero-real-play',...size});
  if(world.areas[0].width!==size.width||world.areas[0].height!==size.height)
   throw Error('WorldBuilder modified authored playable dimensions');
  saveWorldAssemblerDraft(localStorage,world);
  const sessionId='session-hero-real-play';
  const checkpoint=createNewExplorationPlay(localStorage,world,{sessionId});
  sessionStorage.setItem('gensrpg.capture.v2.hero-selection.v1:'+sessionId,
   JSON.stringify({schema:'gensrpg.capture.v2.hero-selection.v1',version:1,
    sessionId,worldId:world.id,heroDefinitionId:heroId}));
  return {heroId,sessionId,worldId:world.id,checkpoint};
 })()`);
 if(!generated?.heroId?.startsWith('hero.user.')||generated.checkpoint?.version!==1)
  throw Error('Real Hero/WorldDocument/Play session could not initialize '+JSON.stringify(generated));
 await send('Page.navigate',{url:origin+'/sculpt-lab.html?play=1&adventureSession='+generated.sessionId});
 await sleep(950);
 const ready=await waitFor(`(()=>{
  const p=window.__sculptPlayProbe?.();
  if(p?.active)return p;
  if(document.body.classList.contains('sculpt-play-unavailable'))
   return {error:document.getElementById('play-start-error-message')?.textContent};
  return null;
 })()`,'real Jouer selected hero');
 if(ready.error||!ready.active||!ready.playing||!ready.heroVisualPrepared||
  ready.heroDefinitionId!==generated.heroId||ready.worldId!==generated.worldId)
  throw Error('Native 2.5D Jouer failed real hero selection '+JSON.stringify(ready));
 console.log('GREEN real mobile Chromium: native Jouer loaded HeroDefinition and exact authorized avatar',JSON.stringify(ready));

 // Explicit stale deleted definition is an error; never pretend the demo
 // avatar is the chosen hero. The world/position checkpoint remains intact.
 await evaluate(`(()=>{
  const key='gensrpg.capture.v2.hero-selection.v1:'+ ${JSON.stringify(generated.sessionId)};
  const v=JSON.parse(sessionStorage.getItem(key));
  v.heroDefinitionId='hero.user.00000000-0000-4000-8000-000000000099';
  sessionStorage.setItem(key,JSON.stringify(v));
 })()`);
 await send('Page.reload',{ignoreCache:true});
 await sleep(950);
 const rejected=await waitFor(`(()=>{
  if(!document.body.classList.contains('sculpt-play-unavailable'))return null;
  return document.getElementById('play-start-error-message')?.textContent||'empty error';
 })()`,'missing authored hero fail closed');
 if(!/Héros sélectionné introuvable/.test(rejected))
  throw Error('Expected explicit missing hero error, got: '+rejected);
 if(exceptions.some(x=>/ReferenceError|TypeError|is not defined/.test(x)))
  throw Error('Unexpected JS error '+JSON.stringify(exceptions.slice(-4)));
 console.log('GREEN native Jouer: missing requested hero is rejected, never switched silently to demo');
}finally{
 socket?.close();
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const gone=once(chrome,'exit');chrome.kill('SIGKILL');await gone;
 }
 server.close();
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
