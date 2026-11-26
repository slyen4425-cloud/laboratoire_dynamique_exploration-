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
    // A nonzero encounter chance requires at least one *real* species element.
    // Choose it through the official Sculpt checkbox, never inject WorldDocument.
    const elements=[...document.querySelectorAll('#sculpt-encounter-elements input[data-element-id]')];
    const first=elements.find(x=>!x.checked)??elements[0];
    if(!first)throw Error('Official Encounter catalogue produced zero elements');
    if(!first.checked){first.checked=true;first.dispatchEvent(new Event('change',{bubbles:true}));}
    const enabled=window.__sculptEncounterEditorProbe();
    document.querySelector('#sculpt-encounter-close').click();
    return {disabled,enabled,closed:document.querySelector('#sculpt-encounter-editor').hidden};})()`);
  if(authored.disabled.allowedInArea!==false||authored.enabled.allowedInArea!==true||
     authored.enabled.chance!==67||authored.enabled.enabledElementIds.length===0||!authored.closed)
    throw Error('Sculpt real encounter authoring failed '+JSON.stringify(authored));
  // One real Atelier overlay must stay reachable in phone landscape, no clone.
  await send('Emulation.setDeviceMetricsOverride',{width:844,height:390,
    deviceScaleFactor:1,mobile:true,screenOrientation:{type:'landscapePrimary',angle:90}});
  const layout=await run(`(()=>{
    const panel=document.querySelector('#sculpt-settings');
    const toggle=document.querySelector('#sculpt-settings-toggle');
    const initiallyHidden=getComputedStyle(panel).display==='none';
    toggle.click();
    const rect=panel.getBoundingClientRect();
    const result={initiallyHidden,open:panel.open,viewport:[innerWidth,innerHeight],
      rect:{left:rect.left,top:rect.top,right:rect.right,bottom:rect.bottom},
      quickPlus:document.querySelectorAll('#quick-level-plus').length,
      oldPlus:document.querySelectorAll('#level-up').length,
      baseMaterial:document.querySelectorAll('#material').length,
      scrollable:panel.scrollHeight>panel.clientHeight?getComputedStyle(panel).overflowY==='auto':true};
    toggle.click();
    return {...result,closed:!panel.open};
  })()`);
  await send('Emulation.clearDeviceMetricsOverride');
  if(!layout.initiallyHidden||!layout.open||!layout.closed||
      layout.rect.left<0||layout.rect.top<0||
      layout.rect.right>layout.viewport[0]+1||layout.rect.bottom>layout.viewport[1]+1||
      layout.quickPlus!==1||layout.oldPlus!==0||layout.baseMaterial!==1||!layout.scrollable)
    throw Error('Sculpt single Atelier overflows phone-landscape or duplicates controls: '+
      JSON.stringify(layout));
  // Arbitrarily named WorldDocument family, not a hard-coded 'Haute herbe'.
  const custom=await run(`(()=>{
    document.querySelector('#mode-encounters').click();
    document.querySelector('#sculpt-family-name').value='Marais libre';
    document.querySelector('#sculpt-family-kind').value='terrain';
    document.querySelector('#sculpt-family-chance').value='60';
    document.querySelector('#sculpt-family-create').click();
    const pick=[...document.querySelectorAll('#sculpt-encounter-elements input[data-element-id]')];
    if(!pick.length)throw Error('Custom family element catalogue is empty');
    if(!pick.some(x=>x.checked)){
      pick[0].checked=true;pick[0].dispatchEvent(new Event('change',{bubbles:true}));
    }
    const created=window.__sculptEncounterEditorProbe();
    const feedback=document.querySelector('#sculpt-family-create-status').textContent;
    document.querySelector('#mode-surface').click();
    const family=document.querySelector('#surface-family');
    const selectedOnCreate=family.value;
    const texture=document.querySelector('#surface-material');
    texture.value='grass.forest.alt';
    texture.dispatchEvent(new Event('change',{bubbles:true}));
    const selectedAfterTexture=family.value;
    const names=[...document.querySelector('#sculpt-encounter-family').options]
      .filter(option=>option.value===created.familyId).map(option=>option.text);
    return {created,feedback,selectedOnCreate,selectedAfterTexture,
      texture:texture.value,names};
  })()`);
  if(!custom.created?.familyId||custom.created.chance!==60||
      custom.created.enabledElementIds.length===0||
      !custom.feedback.includes('Marais libre')||
      custom.selectedOnCreate!==custom.created.familyId||
      custom.selectedAfterTexture!==custom.created.familyId||
      custom.texture!=='grass.forest.alt'||custom.names[0]!=='Marais libre')
    throw Error('Custom terrain family cannot coexist with independently chosen texture: '+
      JSON.stringify(custom));

  // Save through the real WorldArea transition, not direct state mutation.
  await run("document.querySelector('#world-area-return').click();'saved-through-WorldArea'");
  let returned;
  try {
  returned=await waitFor(`(async()=>{const probe=window.__worldAssemblerProbe?.();
    const world=(await import('./src/builder/world-assembler-handoff.js')).readWorldAssemblerDraft(localStorage);
    return probe&&location.pathname==='/world-assembler.html'&&world
      ?{probe,path:location.pathname,world}:null;})()`,'2.5D -> same World Builder round trip');
  } catch(error) {
    const details=await run(`(()=>({
      path:location.pathname,query:location.search,
      bodyClass:document.body.className,returnedButton:!!document.querySelector('#world-area-return'),
      feedback:document.querySelector('#world-portal-feedback')?.textContent,
      footer:document.querySelector('#notice')?.textContent,
      assembler:typeof window.__worldAssemblerProbe==='function',
      saved:!!localStorage.getItem('gensrpg.world-assembler.document.v1')
    }))()`);
    throw Error(error.message+' diagnostics='+JSON.stringify(details));
  }
  const savedArea=returned.world.areas.find(a=>a.id===authored.enabled.areaId);
  const savedFamily=returned.world.encounterConfig.families
    .find(f=>f.terrainFamilyId===authored.enabled.familyId);
  const savedCustom=returned.world.terrainFamilies
    .find(f=>f.id===custom.created.familyId);
  const savedCustomProfile=returned.world.encounterConfig.families
    .find(f=>f.terrainFamilyId===custom.created.familyId);
  if(savedCustom?.label!=='Marais libre'||savedCustom?.paintKind!=='terrain'||
      savedCustomProfile?.encounterChancePercent!==60)
    throw Error('Custom family lost during native World Builder save: '+JSON.stringify({
      savedCustom,savedCustomProfile,custom}));
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
