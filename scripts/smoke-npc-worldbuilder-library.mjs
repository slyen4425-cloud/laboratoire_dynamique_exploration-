// Native Chromium contract: true persistent authored NPC -> Sculpt visual
// library -> one WorldArea actorDefinitionId -> native NPC dialogue after reload.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';

const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript',
 '.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'};
const server=createServer(async(req,res)=>{
 try{
  const full=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!full.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(full);
  res.writeHead(200,{'Content-Type':mime[extname(full)]??'application/octet-stream',
   'Cache-Control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('missing');}
});
const chrome=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(bin=>bin&&spawnSync('which',[bin]).status===0);
if(!chrome)throw Error('Chromium required for native NPC placement test');
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const profile=await mkdtemp(resolve(tmpdir(),'npc-worldbuilder-'));
let browser=null,socket=null,seq=0;const pending=new Map(),errors=[];
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
function cmd(method,params={}){
 return new Promise((ok,fail)=>{
  const id=++seq,timer=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout '+method));},45000);
  pending.set(id,value=>{
   clearTimeout(timer);
   if(value.error)fail(Error('CDP '+JSON.stringify(value.error)));
   else ok(value);
  });
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function evalJs(expression){
 const response=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
 if(response.result?.exceptionDetails)
  throw Error('Runtime '+JSON.stringify(response.result.exceptionDetails).slice(0,1500));
 return response.result?.result?.value;
}
async function until(expression,label){
 let last;
 for(let i=0;i<130;i++){
  try{last=await evalJs(expression);}catch(error){last={error:error.message};}
  if(last&&!last.error)return last;
  await delay(125);
 }
 throw Error('Timeout '+label+' : '+JSON.stringify(last)+' '+JSON.stringify(errors.slice(-4)));
}
try{
 const url='http://127.0.0.1:'+server.address().port+'/sculpt-lab.html';
 browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
  '--remote-debugging-port=0','--user-data-dir='+profile,'--window-size=932,430',url],
  {stdio:['ignore','ignore','pipe'],detached:true});
 const port=await new Promise((ok,fail)=>{
  let stderr='';
  const timer=setTimeout(()=>fail(Error('Chrome failed to start '+stderr.slice(-500))),45000);
  browser.stderr.on('data',part=>{
   stderr+=part.toString();
   const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
   if(match){clearTimeout(timer);ok(Number(match[1]));}
  });
  browser.once('error',fail);browser.once('exit',code=>fail(Error('Chrome exit '+code)));
 });
 let tab=null;
 for(let i=0;i<60;i++){
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  tab=tabs.find(t=>t.type==='page'&&t.url.includes('/sculpt-lab.html'));
  if(tab)break;await delay(150);
 }
 if(!tab)throw Error('Sculpt tab unavailable');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{socket.addEventListener('open',ok,{once:true});socket.addEventListener('error',fail,{once:true});});
 socket.addEventListener('message',e=>{
  const obj=JSON.parse(e.data),cb=pending.get(obj.id);
  if(obj.method==='Runtime.exceptionThrown')
   errors.push(obj.params?.exceptionDetails?.exception?.description??obj.params?.exceptionDetails?.text);
  if(cb){pending.delete(obj.id);cb(obj);}
 });
 await cmd('Runtime.enable');
 await until("typeof window.__sculptActorsProbe==='function' && window.__sculptActorsProbe().catalogReady",'Sculpt actor catalog ready');
 const id='npc.user.00000000-0000-4000-8000-000000000072';
 const staged=await evalJs(`(async()=>{
  const {createUserNpcDefinitionV1}=await import('./src/actors/user-npc-definition-v1.js');
  const {createUserNpcStoreV1}=await import('./src/storage/user-npc-store-v1.js');
  const canvas=document.createElement('canvas');canvas.width=96;canvas.height=128;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ed4dce';ctx.fillRect(20,16,56,106);
  const file=await new Promise(ok=>canvas.toBlob(ok,'image/png'));
  const image={blob:file,width:96,height:128,mimeType:'image/png'};
  const definition=createUserNpcDefinitionV1({
   id:'${id}',name:'Messager de la forêt',role:'villager',base:image,
   npc:{dialogue:'Bienvenue dans la clairière !',movement:{mode:'static',radius:90}}
  });
  const store=createUserNpcStoreV1();await store.put(definition);
  const saved=await store.get('${id}');
  if(saved?.assets?.[0]?.blob.size!==file.size)throw Error('Authoritative NPC Blob lost');
  document.querySelector('#flat').click();
  document.querySelector('#mode-objects').click();
  document.querySelector('#actor-open').click();
  window.dispatchEvent(new Event('focus'));
  return {id:saved.id,bytes:saved.assets[0].blob.size};
 })()`);
 if(staged.id!==id||staged.bytes<50)throw Error('NPC seed invalid '+JSON.stringify(staged));
 await until(`window.__sculptActorsProbe().definitions.includes('${id}')`,'NPC definition appears from IndexedDB');
 const gallery=await evalJs(`(()=>{
  document.querySelector('#actor-npc-library-open').click();
  const buttons=[...document.querySelectorAll('#actor-npc-gallery button')];
  const button=buttons.find(b=>b.textContent.includes('Messager de la forêt'));
  if(!button)return {found:false,open:document.querySelector('#actor-npc-library').open};
  button.click();
  const probe=window.__sculptActorsProbe();
  return {found:true,selected:document.querySelector('#actor-definition').value,
   mode:document.querySelector('#actor-action').value,probe};
 })()`);
 if(!gallery.found||gallery.selected!==id||gallery.mode!=='place'||!gallery.probe.active)
  throw Error('Native PNJ visual picker failed '+JSON.stringify(gallery));
 // Use real hit testing, as the native Sculpt browser smoke does.
 const point=await evalJs(`(()=>{
  document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
  const p=window.__sculptLabProbe(),rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
  const x=rect.left+p.cameraPan.x+3.5*28*p.zoom;
  const y=rect.top+p.cameraPan.y+3.5*21*p.zoom;
  return {x,y,hit:document.elementFromPoint(x,y)?.id};
 })()`);
 if(point.hit!=='sculpt-canvas')throw Error('Canvas placement not reachable '+JSON.stringify(point));
 for(const type of ['mouseMoved','mousePressed','mouseReleased'])
  await cmd('Input.dispatchMouseEvent',{type,x:point.x,y:point.y,button:'left',clickCount:1});
 const placement=await evalJs(`(()=>{
  document.querySelector('#scene-export').click();
  const scene=JSON.parse(document.querySelector('#json').value),actor=scene.actors?.[0];
  return {scene:document.querySelector('#json').value,
   actor,selection:window.__sculptActorsProbe().selectedId,
   legacyModal:document.querySelector('#npc-authoring-dialog').open,
   linked:document.querySelector('#actor-npc-edit-definition').hidden===false};
 })()`);
 if(placement.actor?.actorDefinitionId!==id||placement.actor?.npc!==undefined||
   placement.legacyModal||!placement.linked||!placement.selection)
  throw Error('Placed PNJ duplicated definition in WorldArea '+JSON.stringify(placement.actor));
 // Verify same serialized scene stays bare after importing the actual file contents.
 const scene=JSON.stringify(placement.scene);
 const restore=await evalJs(`(()=>{
  document.querySelector('#json').value=${scene};
  document.querySelector('#import').click();
  document.querySelector('#scene-export').click();
  const round=JSON.parse(document.querySelector('#json').value).actors?.[0];
  return {actor:round,count:window.__sculptActorsProbe().count};
 })()`);
 if(restore.count!==1||restore.actor?.actorDefinitionId!==id||
   restore.actor?.npc!==undefined)
  throw Error('Sculpt JSON roundtrip duplicates actor data '+JSON.stringify(restore));
 await evalJs("document.querySelector('#navigation-toggle').click()");
 await until("document.querySelector('#npc-talk')?.hidden===false",'talk button from linked NPC profile');
 const talk=await evalJs(`(()=>{
  const caption=document.querySelector('#npc-talk').textContent;
  document.querySelector('#npc-talk').click();
  const spoken=document.querySelector('#npc-dialogue-text').textContent;
  document.querySelector('#npc-dialogue-close').click();
  return {caption,spoken};
 })()`);
 if(!talk.caption.includes('Messager de la forêt')||
    talk.spoken!=='Bienvenue dans la clairière !')
  throw Error('Linked PNJ did not talk through canonical dialogue '+JSON.stringify(talk));
 // Screenshot is captured from the REAL Chromium page, never rendered by a mock.
 await mkdir('artifacts',{recursive:true});
 const shot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
 await writeFile('artifacts/npc-worldbuilder-real-preview.png',Buffer.from(shot.result.data,'base64'));
 process.stdout.write('NPC WORLDBUILDER GREEN '+JSON.stringify({id,bytes:staged.bytes,
  placement:restore.actor,dialogue:talk})+'\n');
}finally{
 socket?.close();
 if(browser?.pid)try{process.kill(-browser.pid,'SIGTERM');}catch{browser.kill('SIGTERM');}
 await Promise.race([browser?once(browser,'exit').catch(()=>{}):Promise.resolve(),delay(2500)]);
 await new Promise(ok=>server.close(ok));
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
