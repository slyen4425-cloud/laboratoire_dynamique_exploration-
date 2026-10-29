// Native Chromium gate: a trusted Tester click must really play a bundled MP3.
// No --autoplay-policy=no-user-gesture-required, no mocked Audio.play().
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.mp3':'audio/mpeg',
  '.png':'image/png'};
const server=createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const data=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]??'application/octet-stream',
      'Cache-Control':'no-store'}).end(data);
  } catch{res.writeHead(404).end('not found');}
});
const chromePath=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
  .find(bin=>bin&&spawnSync('which',[bin]).status===0);
if(!chromePath)throw Error('Native Chromium is required for music playback gate');
await new Promise((ok,fail)=>{
  server.once('error',fail);server.listen(0,'127.0.0.1',ok);
});
const profile=await mkdtemp(resolve(tmpdir(),'exploration-real-music-'));
let chrome,socket,seq=0;
const pending=new Map();
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const send=(method,params={})=>new Promise((ok,fail)=>{
  const id=++seq;
  const timer=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout: '+method));},30000);
  pending.set(id,r=>{clearTimeout(timer);if(r.error)fail(Error(method+JSON.stringify(r.error)));else ok(r);});
  socket.send(JSON.stringify({id,method,params}));
});
const run=async expression=>{
  const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.result?.exceptionDetails)throw Error('Browser exception '+JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
try {
  const url='http://127.0.0.1:'+server.address().port+'/sculpt-lab.html?encounterTest=1';
  chrome=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--remote-debugging-port=0','--user-data-dir='+profile,url],
    {stdio:['ignore','ignore','pipe']});
  const port=await new Promise((ok,fail)=>{
    let log='';
    const timer=setTimeout(()=>fail(Error('Chromium boot timeout '+log.slice(-400))),40000);
    chrome.stderr.on('data',buf=>{
      log+=buf.toString();
      const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(log);
      if(m){clearTimeout(timer);ok(Number(m[1]));}
    });
    chrome.once('error',fail);
    chrome.once('exit',code=>fail(Error('Chromium exited '+code)));
  });
  let tab;
  for(let n=0;n<60;n++){
    const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    tab=tabs.find(t=>t.type==='page'&&t.url.includes('sculpt-lab.html'));
    if(tab)break;
    await sleep(100);
  }
  if(!tab)throw Error('Real Exploration tab was not created');
  socket=new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{
    socket.addEventListener('open',ok,{once:true});
    socket.addEventListener('error',fail,{once:true});
  });
  socket.addEventListener('message',event=>{
    const packet=JSON.parse(event.data);
    const cb=pending.get(packet.id);
    if(cb){pending.delete(packet.id);cb(packet);}
  });
  let boot=false;
  for(let n=0;n<120;n++){
    boot=await run("typeof window.__sculptLabProbe==='function' && typeof window.__sculptExplorationSoundProbe==='function'");
    if(boot)break;
    await sleep(200);
  }
  if(!boot)throw Error('Exploration did not initialize: '+JSON.stringify(await run(
    "({url:location.href,resources:performance.getEntriesByType('resource').slice(-8).map(r=>r.name)})")));
  const before=await run("window.__sculptExplorationSoundProbe()");
  if(before.state!=='stopped')throw Error('Music started without gesture: '+JSON.stringify(before));
  const rect=await run(`(()=>{const b=document.querySelector('#navigation-toggle');
    b.scrollIntoView({block:'center',behavior:'instant'});
    const r=b.getBoundingClientRect();
    return {x:r.left+r.width/2,y:r.top+r.height/2};})()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
  let state;
  for(let n=0;n<100;n++){
    state=await run("window.__sculptExplorationSoundProbe()");
    if(state.state==='playing'&&state.mediaCurrentTime>0.15)break;
    if(state.state==='blocked'||state.state==='error')
      throw Error('Real Tester gesture rejected by browser: '+JSON.stringify(state));
    await sleep(150);
  }
  if(state?.state!=='playing'||state.mediaCurrentTime<=0.15)
    throw Error('Music did not actually advance after native Tester click: '+JSON.stringify(state));
  const track=state.track;
  const playingUrl=await run("performance.getEntriesByType('resource').filter(x=>x.name.includes('/exploration-v1/')).map(x=>x.name)");
  if(!/^exploration-[1-4]$/.test(track)||!playingUrl.some(x=>x.includes('.mp3')))
    throw Error('No actual bundled Exploration MP3 loaded: '+JSON.stringify({state,playingUrl}));
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x,y:rect.y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x,y:rect.y,button:'left',clickCount:1});
  const stopped=await run("window.__sculptExplorationSoundProbe()");
  if(stopped.state!=='stopped')throw Error('Music survived edit-mode return: '+JSON.stringify(stopped));
  console.log('GREEN real MP3 audible timeline after trusted Tester click',JSON.stringify({state,stopped}));
} finally {
  try{socket?.close();}catch{}
  try{chrome?.kill('SIGTERM');}catch{}
  await new Promise(ok=>server.close(ok));
  await rm(profile,{recursive:true,force:true});
}
