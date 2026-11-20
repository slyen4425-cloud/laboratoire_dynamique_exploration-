// Native Chromium gate for the actual NPC editor: PNG -> IndexedDB ->
// same MapActorRenderer canvas -> reload and same stable actor definition ID.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm,mkdir,writeFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';

const root=process.cwd(),mime={'.html':'text/html','.js':'text/javascript',
 '.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp'};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream',
   'Cache-Control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('absent');}
});
const chromePath=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(binary=>binary&&spawnSync('which',[binary]).status===0);
if(!chromePath)throw new Error('Chromium requis pour le gate navigateur PNJ');
await new Promise((done,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',done);});
const profile=await mkdtemp(resolve(tmpdir(),'gensrpg-npc-editor-'));
const base='http://127.0.0.1:'+server.address().port;
let chrome=null,ws=null;
const sleep=ms=>new Promise(done=>setTimeout(done,ms));
try{
 chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
   '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
   '--remote-debugging-port=0','--user-data-dir='+profile,
   '--window-size=932,430',base+'/npc-editor.html'],{
     stdio:['ignore','ignore','pipe'],detached:true});
 let stderr='',port=null;
 await new Promise((done,fail)=>{
  const timer=setTimeout(()=>fail(Error('Chromium CDP timeout '+stderr.slice(-500))),35000);
  chrome.stderr.on('data',chunk=>{
   stderr+=chunk.toString();
   const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
   if(match){clearTimeout(timer);port=Number(match[1]);done();}
  });
  chrome.once('error',fail);
  chrome.once('exit',code=>fail(Error('Chromium terminé '+code)));
 });
 let tab=null;
 for(let i=0;i<60;i++){
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  tab=tabs.find(t=>t.type==='page'&&t.url.includes('/npc-editor.html'));
  if(tab)break;await sleep(150);
 }
 if(!tab)throw Error('Onglet PNJ inaccessible');
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((done,fail)=>{
  ws.addEventListener('open',done,{once:true});
  ws.addEventListener('error',fail,{once:true});
 });
 let seq=0;const pending=new Map();
 ws.addEventListener('message',event=>{
  const data=JSON.parse(event.data),cb=pending.get(data.id);
  if(cb){pending.delete(data.id);cb(data);}
 });
 const evaluate=expression=>new Promise((done,fail)=>{
  const id=++seq,timer=setTimeout(()=>{
   pending.delete(id);fail(Error('CDP timeout '+expression.slice(0,140)));
  },60000);
  pending.set(id,payload=>{
   clearTimeout(timer);
   if(payload.error||payload.result?.exceptionDetails)
    fail(Error('Browser error '+JSON.stringify(payload).slice(0,1400)));
   else done(payload.result?.result?.value);
  });
  ws.send(JSON.stringify({id,method:'Runtime.evaluate',
   params:{expression,returnByValue:true,awaitPromise:true}}));
 });
 let ready=false;
 for(let i=0;i<90;i++){
  ready=await evaluate("!!document.getElementById('npc-name') && !!document.getElementById('npc-canvas') && document.getElementById('npc-count')?.textContent!=='Lecture…' && document.getElementById('npc-status')?.textContent.startsWith('Crée un PNJ')");
  if(ready)break;await sleep(150);
 }
 if(!ready)throw Error('Éditeur PNJ DOM indisponible');
 const created=await evaluate(`(async()=>{
  const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
  const c=document.createElement('canvas');c.width=96;c.height=128;
  const g=c.getContext('2d');g.clearRect(0,0,96,128);
  g.fillStyle='#65c5bc';g.fillRect(28,12,38,64);
  g.fillStyle='#153e50';g.fillRect(25,76,44,46);
  const png=await new Promise(ok=>c.toBlob(ok,'image/png'));
  const file=new File([png],'test-npc.png',{type:'image/png'});
  const list=new DataTransfer();list.items.add(file);
  document.querySelector('#npc-image').files=list.files;
  document.querySelector('#npc-name').value='PNJ navigateur CI';
  document.querySelector('#npc-dialogue').value='Bonjour depuis Chromium';
  document.querySelector('#npc-role').value='villager';
  document.querySelector('#npc-save').click();
  let option=null;
  for(let i=0;i<90;i++){
   option=[...document.querySelector('#npc-saved').options]
    .find(opt=>opt.textContent.includes('PNJ navigateur CI'));
   if(option&&document.querySelector('#npc-status').textContent.includes('enregistré'))break;
   await delay(150);
  }
  if(!option)throw Error('Le PNJ n’a pas été enregistré dans IndexedDB : '+JSON.stringify({status:document.querySelector('#npc-status').textContent,count:document.querySelector('#npc-count').textContent,form:document.querySelector('#npc-name').value,files:document.querySelector('#npc-image').files.length,options:[...document.querySelector('#npc-saved').options].map(o=>o.textContent)}));
  for(let i=0;i<90;i++){
   const p=document.querySelector('#npc-canvas').getContext('2d',{willReadFrequently:true})
    .getImageData(0,0,440,220).data;
   let colored=0;
   for(let x=0;x<p.length;x+=4)if(p[x+1]>140&&p[x]>65)colored++;
   if(colored>200)return {id:option.value,colored,count:document.querySelector('#npc-saved').options.length};
   await delay(120);
  }
  throw Error('Aucun vrai pixel PNJ peint par le MapActorRenderer');
 })()`);
 if(!/^npc\.user\.[a-f0-9-]{36}$/.test(created?.id)||created.colored<200)
  throw Error('Création ou affichage PNJ invalide : '+JSON.stringify(created));
 const reloaded=await evaluate(`(async()=>{
   location.search='?edit='+encodeURIComponent(${JSON.stringify(created.id)});
   return true;
 })()`);
 if(!reloaded)throw Error('Impossible de recharger l’éditeur PNJ');
 let persisted=null;
 for(let i=0;i<90;i++){
  try{
   persisted=await evaluate(`({
    loaded:document.querySelector('#npc-saved')?.value,
    name:document.querySelector('#npc-name')?.value,
    dialogue:document.querySelector('#npc-dialogue')?.value,
    preview:document.querySelector('#npc-status')?.textContent
   })`);
  }catch{}
  if(persisted?.loaded===created.id&&persisted.name==='PNJ navigateur CI')break;
  await sleep(180);
 }
 if(persisted?.loaded!==created.id||persisted.dialogue!=='Bonjour depuis Chromium')
  throw Error('La fiche PNJ ne survit pas au rechargement : '+JSON.stringify(persisted));
 // Screenshot is captured from the REAL Chromium page, never rendered by a mock.
 await mkdir('artifacts',{recursive:true});
 const shot=await new Promise((done,fail)=>{
  const id=++seq,timer=setTimeout(()=>{pending.delete(id);fail(Error('Screenshot CDP timeout'));},20000);
  pending.set(id,result=>{
   clearTimeout(timer);
   if(result.error)fail(Error(JSON.stringify(result.error)));
   else done(result);
  });
  ws.send(JSON.stringify({id,method:'Page.captureScreenshot',
   params:{format:'png',captureBeyondViewport:false}}));
 });
 await writeFile('artifacts/npc-editor-real-preview.png',Buffer.from(shot.result.data,'base64'));
 process.stdout.write('PNJ BROWSER GREEN : '+JSON.stringify({created,persisted})+'\n');
}finally{
 ws?.close();
 if(chrome?.pid){try{process.kill(-chrome.pid,'SIGTERM');}catch{chrome.kill('SIGTERM');}}
 await Promise.race([chrome?once(chrome,'exit').catch(()=>{}):Promise.resolve(),sleep(2000)]);
 await new Promise(done=>server.close(done));
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:150});
}
