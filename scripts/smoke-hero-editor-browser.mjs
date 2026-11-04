// Exact-source Chromium gate for Hero Editor: actual image import, indexed
// Blob persistence across reload, switch from static to animated frames and
// preview in the sole Map Actor Renderer. No mocks of the source modules.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
 '.png':'image/png','.webp':'image/webp','.css':'text/css'};
const server=createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const path=resolve(root,'.'+pathname);
  if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
  const body=await readFile(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
   'Cache-Control':'no-store'}).end(body);
 }catch{res.writeHead(404).end('missing');}
});
const browser=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(p=>p&&spawnSync('which',[p]).status===0);
if(!browser)throw Error('Real Chromium required for hero editor UI gate');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
await new Promise((ok,fail)=>{
 server.once('error',fail);
 server.listen(0,'127.0.0.1',ok);
});
const profile=await mkdtemp(resolve(tmpdir(),'hero-editor-browser-'));
const url='http://127.0.0.1:'+server.address().port+'/hero-editor.html';
let chrome,socket,seq=0;
const pending=new Map(),exceptions=[];
const command=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++seq;
 const timeout=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},20000);
 pending.set(id,payload=>{
  clearTimeout(timeout);
  payload.error?reject(Error('CDP: '+JSON.stringify(payload.error))):resolve(payload);
 });
 socket.send(JSON.stringify({id,method,params}));
});
const read=async expression=>{
 const response=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(response.result?.exceptionDetails)
  throw Error('JS page exception '+JSON.stringify(response.result.exceptionDetails).slice(0,1000));
 return response.result?.result?.value;
};
async function waitUntil(expression,label){
 let value;
 for(let i=0;i<95;i++){
  value=await read(expression);
  if(value)return value;
  await sleep(130);
 }
 throw Error('Hero editor timeout waiting for '+label+'; last='+JSON.stringify(value));
}
try{
 chrome=spawn(browser,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--no-first-run','--disable-extensions','--remote-debugging-port=0',
  '--window-size=932,430','--user-data-dir='+profile,url],
  {stdio:['ignore','ignore','pipe']});
 const port=await new Promise((ok,fail)=>{
  let log='';
  const timeout=setTimeout(()=>fail(Error('Chromium start timed out '+log.slice(-700))),45000);
  chrome.stderr.on('data',chunk=>{
   log+=chunk.toString();
   const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(log);
   if(match){clearTimeout(timeout);ok(Number(match[1]));}
  });
  chrome.once('error',fail);
  chrome.once('exit',code=>fail(Error('Chromium exited '+code)));
 });
 let target;
 for(let i=0;i<80;i++){
  const pages=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  target=pages.find(p=>p.type==='page'&&p.url.includes('hero-editor.html'));
  if(target)break;
  await sleep(160);
 }
 if(!target)throw Error('Hero Editor Chromium tab missing');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  socket.addEventListener('open',ok,{once:true});
  socket.addEventListener('error',fail,{once:true});
 });
 socket.addEventListener('message',event=>{
  const payload=JSON.parse(event.data);
  if(payload.method==='Runtime.exceptionThrown')
   exceptions.push(payload.params?.exceptionDetails?.text||'exception');
  const handler=pending.get(payload.id);
  if(handler){pending.delete(payload.id);handler(payload);}
 });
 await command('Runtime.enable');
 await command('Page.enable');
 await waitUntil("document.querySelector('#hero-name')&&document.querySelector('#hero-status')?.textContent.includes('Importe')",'native UI startup');

 const first=await read(`(async()=>{
  const c=document.createElement('canvas');c.width=c.height=128;
  const context=c.getContext('2d');context.clearRect(0,0,128,128);
  context.fillStyle='#168bc3';context.fillRect(36,18,56,94);
  const blob=await new Promise(ok=>c.toBlob(ok,'image/png'));
  const dt=new DataTransfer();dt.items.add(new File([blob],'hero.png',{type:'image/png'}));
  document.querySelector('#hero-image').files=dt.files;
  document.querySelector('#hero-name').value='Exploratrice de test';
  document.querySelector('#hero-save').click();
  return {mode:document.querySelector('#hero-mode').value,
   fileName:document.querySelector('#hero-image').files[0].name};
 })()`);
 if(first.mode!=='image'||first.fileName!=='hero.png')
  throw Error('Default still image entry failed '+JSON.stringify(first));
 await waitUntil("document.querySelector('#hero-status')?.textContent.includes('Héros enregistré')",'first image save');
 const hero=await read(`(async()=>{
  const {createUserHeroStoreV1}=await import('/src/storage/user-hero-store-v1.js');
  const records=await createUserHeroStoreV1().list();
  const record=records[0];
  return {count:records.length,id:record?.id,
   type:record?.assets[0]?.blob?.type,mode:record?.mapVisual?.animation?.mode,
   options:document.querySelector('#hero-saved')?.options.length};
 })()`);
 if(hero.count!==1||!hero.id?.startsWith('hero.user.')||
   hero.type!=='image/png'||hero.mode!=='image'||hero.options!==2)
  throw Error('Real IndexedDB hero PNG was not persisted '+JSON.stringify(hero));
 console.log('Real Hero Editor PNG saved:',JSON.stringify(hero));

 await command('Page.reload',{ignoreCache:true});
 await waitUntil("document.querySelector('#hero-saved')?.options?.length===2",'IndexedDB listing after browser reload');
 await read(`(()=>{
  const picker=document.querySelector('#hero-saved');
  picker.value=${JSON.stringify(hero.id)};
  picker.dispatchEvent(new Event('change',{bubbles:true}));
 })()`);
 await waitUntil("document.querySelector('#hero-name')?.value==='Exploratrice de test'",'reload persisted hero');
 await waitUntil("document.querySelector('#hero-status')?.textContent.includes('Image fixe')",'native image renderer after resume');

 // Real UI: edit the SAME hero with three frame Blobs. All frames use
 // the same 128x128 author canvas, keeping the renderer's foot anchor stable.
 await read(`(async()=>{
  const make=async(color,label)=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=128;
   const x=canvas.getContext('2d');x.clearRect(0,0,128,128);
   x.fillStyle=color;x.fillRect(36,18,56,94);
   const blob=await new Promise(ok=>canvas.toBlob(ok,'image/png'));
   return new File([blob],label,{type:'image/png'});
  };
  const set=(id,files)=>{
   const dt=new DataTransfer();
   for(const file of files)dt.items.add(file);
   document.getElementById(id).files=dt.files;
  };
  document.getElementById('hero-mode').value='frames';
  document.getElementById('hero-mode').dispatchEvent(new Event('change',{bubbles:true}));
  document.getElementById('hero-fps').value='4';
  set('hero-idle',[await make('#dddd99','idle-a.png'),await make('#bbdd44','idle-b.png')]);
  set('hero-walk',[await make('#f16b41','walk-a.png'),
                   await make('#6bd45d','walk-b.png'),
                   await make('#8579ed','walk-c.png')]);
  document.getElementById('hero-save').click();
 })()`);
 await waitUntil("document.querySelector('#hero-status')?.textContent.includes('Héros enregistré')",'sprite mode save');
 const saved=await read(`(async()=>{
  const {createUserHeroStoreV1}=await import('/src/storage/user-hero-store-v1.js');
  const rows=await createUserHeroStoreV1().list();
  const record=rows[0];
  return {count:rows.length,id:record.id,mode:record.mapVisual.animation.mode,
   idle:record.mapVisual.animation.idle.length,
   walk:record.mapVisual.animation.walk.length,
   assets:record.assets.length,fps:record.mapVisual.animation.framesPerSecond,
   view:document.getElementById('hero-mode').value};
 })()`);
 if(saved.count!==1||saved.id!==hero.id||saved.mode!=='frames'||
    saved.idle!==2||saved.walk!==3||saved.assets!==6||saved.fps!==4||
    saved.view!=='frames')
  throw Error('Sprite Hero was not saved to same original definition '+JSON.stringify(saved));
 await read("document.querySelector('#hero-preview-walk').click()");
 await sleep(350);
 const canvas=await read(`(()=>{
  const c=document.querySelector('#hero-canvas');
  const p=c.getContext('2d').getImageData(210,135,1,1).data;
  return {width:c.width,height:c.height,pixel:[...p],
   moving:document.querySelector('#hero-status').textContent,
   idleInputHidden:document.querySelector('#hero-idle-label').hidden};
 })()`);
 if(canvas.width!==420||canvas.height!==210||canvas.idleInputHidden||
   canvas.moving!=='Prévisualisation : marche'||
   Math.max(...canvas.pixel.slice(0,3))-Math.min(...canvas.pixel.slice(0,3))<18)
  throw Error('Real native Hero sprite canvas did not paint '+JSON.stringify(canvas));
 if(exceptions.length)throw Error('Unexpected page exception '+exceptions.join(' | '));
 console.log('GREEN real Chromium (932x430 landscape): PNG -> IndexedDB -> reload -> 3 walk sprites -> same hero -> native animated renderer',
  JSON.stringify({saved,canvas}));
}finally{
 socket?.close();
 if(chrome&&chrome.exitCode===null&&chrome.signalCode===null){
  const gone=once(chrome,'exit');
  chrome.kill('SIGKILL');
  await gone;
 }
 server.close();
 await rm(profile,{recursive:true,force:true,maxRetries:5,retryDelay:100});
}
