// Real browser proof: organize actual WorldArea nodes and persist author-only layout.
// No fake WorldGraph, no screenshot substitutes, no mutation of 2.5D coordinates.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
  '.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const bytes=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(bytes);
  }catch{res.writeHead(404).end('missing');}
});
const binary=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
  .find(bin=>bin&&spawnSync('which',[bin]).status===0);
if(!binary)throw Error('Chromium unavailable for real World Assembler smoke');
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const profile=await mkdtemp(resolve(tmpdir(),'world-assembler-layout-'));
let chrome,socket;
try{
  const pageUrl='http://127.0.0.1:'+server.address().port+'/builder.html';
  chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--window-size=1400,850','--remote-debugging-port=0',
    '--user-data-dir='+profile,pageUrl],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((ok,fail)=>{
    let stderr='';const watchdog=setTimeout(()=>fail(Error('No DevTools port: '+stderr.slice(-400))),45000);
    chrome.stderr.on('data',chunk=>{
      stderr+=String(chunk);
      const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
      if(match){clearTimeout(watchdog);ok(Number(match[1]));}
    });
    chrome.once('error',fail);
    chrome.once('exit',code=>fail(Error('Chrome exited unexpectedly '+code)));
  });
  let target;
  for(let i=0;i<60;i++){
    const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    target=tabs.find(x=>x.type==='page'&&x.url.includes('/world-assembler.html'));
    if(target)break;await sleep(150);
  }
  if(!target)throw Error('World Assembler Chromium tab missing');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{
    socket.addEventListener('open',ok,{once:true});
    socket.addEventListener('error',fail,{once:true});
  });
  let id=0;const pending=new Map();
  socket.addEventListener('message',event=>{
    const data=JSON.parse(event.data),handler=pending.get(data.id);
    if(handler){pending.delete(data.id);handler(data);}
  });
  const send=(method,params={})=>new Promise((ok,fail)=>{
    const seq=++id;
    const watchdog=setTimeout(()=>{pending.delete(seq);fail(Error('CDP timeout '+method));},30000);
    pending.set(seq,data=>{
      clearTimeout(watchdog);
      if(data.error)fail(Error(method+' '+JSON.stringify(data.error)));
      else ok(data);
    });
    socket.send(JSON.stringify({id:seq,method,params}));
  });
  const run=async expression=>{
    const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(result.result?.exceptionDetails)
      throw Error('World Assembler evaluation '+JSON.stringify(result.result.exceptionDetails));
    return result.result?.result?.value;
  };
  // Legacy URL must land on the canonical world editor, not instantiate 2D.
  const waitFor=async(expr,label)=>{
    for(let attempt=0;attempt<130;attempt++){
      let result=null;
      try{result=await run(expr);}catch{}
      if(result)return result;
      await sleep(170);
    }
    throw Error('Real Chromium timeout: '+label);
  };
  const initial=await waitFor(`(()=>{const probe=window.__worldAssemblerProbe?.();
    return probe?.areaIds?.length>0?{path:location.pathname,probe,
      oldBuilder:!!document.querySelector('#builder-status'),
      mapButton:!!document.querySelector('#world-workspace-map')}:null;})()`,'legacy URL -> canonical World Builder');
  if(initial.path!=='/world-assembler.html'||initial.oldBuilder||!initial.mapButton||
    initial.probe.source!=='WorldDocument')
    throw Error('Legacy URL did not redirect into real World Builder '+JSON.stringify(initial));
  // Enter the current 2.5D editor THROUGH the World Builder map tab.
  const request=await run(`(()=>{const tab=document.querySelector('#world-workspace-map');
    tab.click();return {clicked:true};})()`);
  if(!request.clicked)throw Error('Native map button was not activated');
  const map=await waitFor(`(()=>{const probe=window.__sculptWorldProbe?.();
    return probe?.editable && location.pathname==='/sculpt-lab.html'
      ?{path:location.pathname,probe,worldTab:!!document.querySelector('#world-workspace-world'),
        oldBuilder:!!document.querySelector('a[href="./builder.html"]')}:null;})()`,'WorldArea 2.5D map authoring');
  if(!map.worldTab||map.oldBuilder)
    throw Error('Sculpt did not keep canonical World Builder return '+JSON.stringify(map));
  // Author actual encounter probabilities and disabled-area policy in Sculpt.
  const encounter=await waitFor(`(()=>window.__sculptEncounterEditorProbe?.().available||
    null)()`,'Sculpt native Encounter editor');
  if(!encounter)throw Error('Native Encounter owner unavailable');
  const before=await run(`(()=>{document.querySelector('#mode-encounters').click();
    const probe=window.__sculptEncounterEditorProbe();
    return {probe,open:!document.querySelector('#sculpt-encounter-editor').hidden,
      range:!!document.querySelector('#sculpt-encounter-chance'),
      toggle:!!document.querySelector('#sculpt-encounter-area-enabled')};})()`);
  if(!before.open||!before.range||!before.toggle||!before.probe.familyId)
    throw Error('Native Encounter editor not interactive '+JSON.stringify(before));
  const authored=await run(`(()=>{const slider=document.querySelector('#sculpt-encounter-chance');
    slider.value='67';slider.dispatchEvent(new Event('input',{bubbles:true}));
    const toggle=document.querySelector('#sculpt-encounter-area-enabled');
    toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));
    const disabled=window.__sculptEncounterEditorProbe();
    toggle.checked=true;toggle.dispatchEvent(new Event('change',{bubbles:true}));
    const enabled=window.__sculptEncounterEditorProbe();
    document.querySelector('#sculpt-encounter-close').click();
    return {disabled,enabled,closed:document.querySelector('#sculpt-encounter-editor').hidden};})()`);
  if(authored.disabled.allowedInArea!==false||authored.enabled.allowedInArea!==true||
     authored.enabled.chance!==67||!authored.closed)
    throw Error('Sculpt real encounter authoring failed '+JSON.stringify(authored));
  // Save through the real WorldArea transition, not direct state mutation.
  await run("document.querySelector('#world-area-return').click();'saved-through-WorldArea'");
  const returned=await waitFor(`(()=>{const probe=window.__worldAssemblerProbe?.();
    const world=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
    return probe&&location.pathname==='/world-assembler.html'&&world
      ?{probe,path:location.pathname,world}:null;})()`,'2.5D -> same World Builder round trip');
  const savedArea=returned.world.areas.find(a=>a.id===authored.enabled.areaId);
  const savedFamily=returned.world.encounterConfig.families
    .find(f=>f.terrainFamilyId===authored.enabled.familyId);
  if(!savedArea||savedArea.encounters?.randomEnabled!==true||
     savedFamily?.encounterChancePercent!==67||
     returned.probe.source!=='WorldDocument')
    throw Error('Real WorldDocument Encounter settings not preserved '+JSON.stringify({
      area:savedArea?.id,encounters:savedArea?.encounters,family:savedFamily,probe:returned.probe}));
  console.log('GREEN real Chromium: deprecated Builder URL redirects to one World Builder, '
    +'native 2.5D Encounter chance/policy persisted via WorldDocument, same map return '
    +JSON.stringify({path:returned.path,area:savedArea.id,
      chance:savedFamily.encounterChancePercent,portals:returned.probe.portalCount}));
}finally{
  if(socket){try{socket.close();}catch{}}
  if(chrome){try{chrome.kill('SIGKILL');}catch{}}
  server.close();
  await rm(profile,{recursive:true,force:true});
}
