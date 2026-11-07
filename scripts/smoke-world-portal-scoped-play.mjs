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
const profile=await mkdtemp(resolve(tmpdir(),'portal-play-'));
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
  origin+'/sculpt-lab.html'],{stdio:['ignore','ignore','pipe']});
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
  tab=tabs.find(x=>x.type==='page'&&x.url.includes('/sculpt-lab.html'));
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

 const fixture=await evaluate("(async()=>{\n const {createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,updateSpawn}\n  =await import('/src/builder/world-builder-draft.js');\n const {saveWorldAssemblerDraft}=await import('/src/builder/world-assembler-handoff.js');\n const {createNewExplorationPlay}=await import('/src/play/exploration-play-session.js');\n let world=createBlankWorldBuilderDraft({id:'native-linked-play',width:36*28,height:24*21});\n world=addWorldArea(world,{name:'Deuxième zone',kind:'exterior',width:36*28,height:24*21});\n const from=world.initialAreaId,to=world.areas[1].id;\n world=connectWorldAreas(world,{sourceAreaId:from,targetAreaId:to,returnPortal:true});\n const forward=world.portals.find(p=>p.sourceAreaId===from);\n const reverse=world.portals.find(p=>p.sourceAreaId===to);\n world=updateSpawn(world,from,world.initialSpawnId,{x:forward.trigger.x,y:forward.trigger.y});\n world=updateSpawn(world,to,forward.targetSpawnId,{x:reverse.trigger.x,y:reverse.trigger.y});\n saveWorldAssemblerDraft(localStorage,world);\n const sessionId='native-portal-'+crypto.randomUUID();\n const initial=createNewExplorationPlay(localStorage,world,{sessionId});\n return {sessionId,from,to,initial,portals:world.portals.length};\n})()");
 if(fixture.portals!==2||fixture.initial.currentAreaId!==fixture.from)
  throw Error('Invalid official linked WorldDocument '+JSON.stringify(fixture));
 await send('Page.navigate',{url:origin+'/sculpt-lab.html?play=1&adventureSession='+fixture.sessionId});
 const ready=await waitFor("(()=>{const p=window.__sculptPlayProbe?.();return p?.active&&p?.playing?p:document.body.classList.contains('sculpt-play-unavailable')?{error:document.getElementById('play-start-error-message')?.textContent}:null})()", 'scoped native Jouer');
 if(ready.error||ready.areaId!==fixture.from)throw Error('Play start invalid '+JSON.stringify(ready));
 const portalReady=()=> "(()=>{const b=document.querySelector('#world-portal-traverse');return b&&!b.hidden&&!b.disabled&&b.textContent.includes('Entrer')})()";
 await waitFor(portalReady(),'official clickable Portal at first position');
 await evaluate("document.querySelector('#world-portal-traverse').click()");
 const arrived=areaId=>"(()=>{const p=window.__sculptPlayProbe?.();const saved=JSON.parse(localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+"
  +JSON.stringify(fixture.sessionId)+")||'null');return p?.areaId==="+JSON.stringify(areaId)+"&&saved?.currentAreaId===p.areaId?{probe:p,saved}:null})()";
 const crossed=await waitFor(arrived(fixture.to),'real Portal destination and saved checkpoint');
 await waitFor(portalReady(),'real return Portal after landing');
 await evaluate("document.querySelector('#world-portal-traverse').click()");
 const back=await waitFor(arrived(fixture.from),'return Portal source and saved checkpoint');
 if(back.saved.worldId!==fixture.initial.worldId||back.saved.sessionId!==fixture.sessionId)
  throw Error('Portal traveled outside the official player session');
 if(exceptions.some(x=>/ReferenceError|TypeError|is not defined/.test(x)))
  throw Error('Browser runtime exception '+JSON.stringify(exceptions));
 console.log('GREEN Chromium scoped Jouer two-way Portal traversal',JSON.stringify({from:fixture.from,to:crossed.probe.areaId,back:back.probe.areaId}));
}finally{
 socket?.close();
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const gone=once(chrome,'exit');chrome.kill('SIGKILL');await gone;
 }
 server.close();
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
