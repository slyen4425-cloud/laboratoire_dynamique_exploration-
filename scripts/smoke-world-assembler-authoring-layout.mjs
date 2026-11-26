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
  const pageUrl='http://127.0.0.1:'+server.address().port+'/world-assembler.html';
  chrome=spawn(binary,['--headless=new','--no-sandbox','--disable-gpu',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--window-size=1400,850','--remote-debugging-port=0',
    '--user-data-dir='+profile,pageUrl],{stdio:['ignore','ignore','pipe'],
    // Isolate the real Chromium process tree, including helpers writing its
    // profile. Closing the parent alone is not enough on Linux runners.
    detached:process.platform!=='win32'});
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
  let ready=false;
  for(let i=0;i<100;i++){
    ready=await run("typeof window.__worldAssemblerProbe==='function' && document.querySelectorAll('.world-node').length>0");
    if(ready)break;await sleep(150);
  }
  if(!ready)throw Error('World Assembler failed to boot in browser');
  const mapCardSelection=await run("(()=>{const gallery=document.querySelector('#world-map-preset-gallery'),official=gallery.querySelector('.map-preset-shelf[data-source=official]'),personal=gallery.querySelector('.map-preset-shelf[data-source=personal]'),library=document.querySelector('.world-library-controls');const folded=!official.open&&!personal.open&&!library.open;library.querySelector('summary').click();const loadOpened=library.open;library.querySelector('summary').click();official.querySelector('summary').click();const cards=[...gallery.querySelectorAll('.map-preset-card[data-source=official]')],player=gallery.querySelectorAll('.map-preset-card[data-source=personal]');if(cards.length!==3)return {official:cards.length,personal:player.length};cards[1].click();const create=document.querySelector('#world-map-preset-create');return {official:cards.length,personal:player.length,chosen:gallery.dataset.selectedId,card:gallery.querySelector('.map-preset-card[aria-pressed=true]')?.dataset.presetId,ready:!create.disabled,folded,loadOpened,opened:official.open&&!personal.open,noDup:!document.querySelector('#world-map-preset-select,#area-list')};})()");
  if(mapCardSelection.official!==3||mapCardSelection.personal!==0||
    !mapCardSelection.chosen||mapCardSelection.chosen!==mapCardSelection.card||
    !mapCardSelection.ready||!mapCardSelection.folded||!mapCardSelection.loadOpened||
    !mapCardSelection.opened||!mapCardSelection.noDup)
    throw Error('World Builder map cards not connected to real WorldArea create action '+JSON.stringify(mapCardSelection));
  const setup=await run(`(()=>{
    const add=document.querySelector('#area-add-form');
    document.querySelector('#area-name').value='Zone annexe';
    add.requestSubmit();
    const areas=window.__worldAssemblerProbe();
    const from=document.querySelector('#link-from');
    const to=document.querySelector('#link-to');
    from.value=areas.areaIds[0];to.value=areas.areaIds[1];
    document.querySelector('#connect-form').requestSubmit();
    const probe=window.__worldAssemblerProbe();
    const node=document.querySelector('.world-node[data-area-id="area-principale"]');
    const b=node.getBoundingClientRect();
    return {probe,x:b.left+b.width/2,y:b.top+b.height/2,
      hasContentPanel:!!document.querySelector('#selected-contents'),
      hasPlaceAction:!!document.querySelector('#place-area-object')};
  })()`);
  if(setup.probe.areaIds.length!==2||setup.probe.portalCount!==2||
      setup.probe.graphEdgeCount!==2||!setup.hasContentPanel||!setup.hasPlaceAction)
    throw Error('Real WorldDocument graph/control setup failed '+JSON.stringify(setup));
  const x=Math.round(setup.x),y=Math.round(setup.y);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});
  await send('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:x+90,y:y+52,button:'left',buttons:1});
  await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:x+90,y:y+52,button:'left',clickCount:1});
  await sleep(350);
  const dragged=await run(`(async()=>{
    const world=(await import('./src/builder/world-assembler-handoff.js')).readWorldAssemblerDraft(localStorage);
    const node=document.querySelector('.world-node[data-area-id="area-principale"]');
    const point=world?.authoringLayout?.positions?.['area-principale'];
    const before=window.__worldAssemblerProbe();
    document.querySelector('#toggle-graph-links').click();
    const hidden=window.__worldAssemblerProbe();
    return {point,left:parseInt(node?.style.left,10),top:parseInt(node?.style.top,10),
      areaCount:before.areaIds.length,portalCount:before.portalCount,
      graphEdgesBefore:before.graphEdgeCount,graphEdgesHidden:hidden.graphEdgeCount,
      portalCountHidden:hidden.portalCount};
  })()`);
  if(!dragged.point||dragged.point.x<80||dragged.point.y<100||
    dragged.portalCount!==2||dragged.portalCountHidden!==2||
    dragged.graphEdgesBefore!==2||dragged.graphEdgesHidden!==0)
    throw Error('Real drag/Portal visual toggle failed '+JSON.stringify(dragged));
  await send('Page.reload',{ignoreCache:true});
  let recovered=null;
  for(let i=0;i<100;i++){
    recovered=await run(`(()=>{
      const p=window.__worldAssemblerProbe?.();
      const node=document.querySelector('.world-node[data-area-id="area-principale"]');
      return p&&node?{...p,left:parseInt(node.style.left,10),
        top:parseInt(node.style.top,10)}:null;
    })()`);
    if(recovered)break;await sleep(200);
  }
  if(!recovered||recovered.left!==dragged.point.x||
     recovered.top!==dragged.point.y||recovered.portalCount!==2)
    throw Error('Saved WorldDocument layout not restored after reload '+JSON.stringify(recovered));
  // The exact same WorldArea node now opens the SINGLE native modal.
  const edited=await run(`(async()=>{
    const card=document.querySelector('.world-node[data-area-id="area-principale"]');
    card.click();
    const dialog=document.querySelector('#area-details-dialog');
    const loaded=(await import('./src/builder/world-assembler-handoff.js')).readWorldAssemblerDraft(localStorage);
    const terrainBefore=JSON.stringify(loaded?.encounterConfig??null);
    const oneId=id=>document.querySelectorAll('#'+id).length===1;
    const oneForm=oneId('world-area-encounter-levels')&&oneId('connect-form')&&
      oneId('area-add-form')&&oneId('selected-contents')&&oneId('selected-events');
    document.querySelector('#area-encounter-min-level').value='4';
    document.querySelector('#area-encounter-max-level').value='17';
    document.querySelector('#world-area-encounter-levels').requestSubmit();
    const updated=(await import('./src/builder/world-assembler-handoff.js')).readWorldAssemblerDraft(localStorage);
    const area=updated?.areas?.find(a=>a.id==='area-principale');
    return {open:dialog.open,oneForm,
      panelCount:document.querySelectorAll('.inspector').length,
      oldRailCount:document.querySelectorAll('aside.inspector').length,
      levels:[area?.encounters?.minLevel,area?.encounters?.maxLevel],
      terrainUnchanged:JSON.stringify(updated?.encounterConfig??null)===terrainBefore,
      portals:updated?.portals?.length,events:document.querySelector('#selected-event-count')?.textContent};
  })()`);
  if(!edited.open||!edited.oneForm||edited.panelCount!==1||edited.oldRailCount!==0||
     edited.levels[0]!==4||edited.levels[1]!==17||
     !edited.terrainUnchanged||edited.portals!==2||edited.events!=='0')
    throw Error('Real Area modal, unique controls or terrain RNG isolation failed '+JSON.stringify(edited));
  const contentNavigation=await run(`(()=>{
    const dialog=document.querySelector('#area-details-dialog');
    const picker=document.querySelector('#selected-neighbor-area');
    const initial=document.querySelector('#selected-id').textContent;
    const filter=document.querySelector('#area-content-filter');
    const options=[...picker.options].map(option=>option.value).filter(Boolean);
    filter.value='dungeon';filter.dispatchEvent(new Event('change'));
    const emptyFilter=document.querySelector('#selected-contents .empty-links')?.textContent.includes('catégorie');
    filter.value='all';filter.dispatchEvent(new Event('change'));
    document.querySelector('#open-neighbor-area').click();
    const neighbor=document.querySelector('#selected-id').textContent;
    const back=document.querySelector('#selected-portals .portal-open-area');
    back?.click();
    const restored=document.querySelector('#selected-id').textContent;
    return {open:dialog.open,options,initial,neighbor,restored,emptyFilter,
      uniqueFilter:document.querySelectorAll('#area-content-filter').length===1};
  })()`);
  if(!contentNavigation.open||contentNavigation.options.length!==1||
     contentNavigation.neighbor===contentNavigation.initial||
     contentNavigation.restored!==contentNavigation.initial||
     !contentNavigation.emptyFilter||!contentNavigation.uniqueFilter)
    throw Error('Real Area contents filter / Portal navigation failed '+JSON.stringify(contentNavigation));
  console.log('GREEN real Chromium: Area contents filter and Portal-only navigation '+JSON.stringify(contentNavigation));
  await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await send('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await sleep(120);
  const navigation=await run(`(()=>{
    const dialog=document.querySelector('#area-details-dialog');
    const escapeClosed=!dialog.open;
    document.querySelector('#graph-nodes .world-node').click();
    const reopened=dialog.open;
    document.querySelector('#close-area-editor').click();
    const closeWorked=!dialog.open;
    document.querySelector('#new-world-area').click();
    const createVisible=dialog.open&&document.querySelector('#area-creation-details').open&&
      document.activeElement===document.querySelector('#area-name');
    document.querySelector('#close-area-editor').click();
    return {escapeClosed,reopened,closeWorked,createVisible};
  })()`);
  if(Object.values(navigation).some(v=>v!==true))
    throw Error('Area modal Escape/graph/new zone UI failed '+JSON.stringify(navigation));
  console.log('GREEN real Chromium: single Area modal, native levels, texture odds unchanged, Escape/new area '+
    JSON.stringify({edited,navigation}));
  console.log('GREEN real Chromium: draggable WorldArea, saved position and Portal preservation '+
    JSON.stringify({dragged:dragged.point,afterReload:{x:recovered.left,y:recovered.top},
      portals:recovered.portalCount}));

  // Test the replacement backend against real IndexedDB, not a Storage mock.
  // It is still disconnected from the live editor until migration is complete.
  const durable=await run(`(async()=>{
    const {createWorldDocumentIndexedDbStoreV1}=await import('./src/storage/world-document-indexeddb-store-v1.js');
    const {readWorldAssemblerDraft,WORLD_ASSEMBLER_DRAFT_KEY:key}=await import('./src/builder/world-assembler-handoff.js');
    const {serializeWorldBuilderDraft}=await import('./src/builder/world-builder-draft.js');
    const raw=localStorage.getItem(key),world=readWorldAssemblerDraft(localStorage);
    const a=createWorldDocumentIndexedDbStoreV1(),b=createWorldDocumentIndexedDbStoreV1();
    const scoped='gensrpg.exploration.universe.workspace.v1:unv_abcdefgh:'+key;
    const [first,second]=await a.migrateLegacy([{key,raw},{key:scoped,raw}]);
    const again=await b.migrateLegacy([{key,raw}]);
    const change={...world,areas:world.areas.map((area,i)=>i===0?{...area,label:'Zone IndexedDB vérifiée'}:area)};
    const [saved]=await a.commit([{key,document:change,expectedRevision:first.revision}]);
    let stale=false,rolledBack=false,conflict=false;
    try{await b.commit([{key,document:world,expectedRevision:first.revision}]);}catch(e){stale=/Conflit de révision/.test(e.message);}
    try{await b.commit([{key:scoped,document:change,expectedRevision:second.revision},{key,document:world,expectedRevision:first.revision}]);}
    catch(e){rolledBack=/Conflit de révision/.test(e.message);}
    try{await b.migrateLegacy([{key,raw}]);}catch(e){conflict=/Conflit de migration/.test(e.message);}
    const read=await b.read(key),other=await b.read(scoped);
    return {initial:first.revision,again:again[0].revision,saved:saved.revision,stale,rolledBack,conflict,
      correct:serializeWorldBuilderDraft(read.document)===serializeWorldBuilderDraft(change),
      previous:serializeWorldBuilderDraft(read.previous)===serializeWorldBuilderDraft(world),
      isolated:other.revision===1&&serializeWorldBuilderDraft(other.document)===serializeWorldBuilderDraft(world),
      legacyUnchanged:localStorage.getItem(key)===raw};
  })()`);
  if(durable.initial!==1||durable.again!==1||durable.saved!==2||
     !durable.stale||!durable.rolledBack||!durable.conflict||!durable.correct||
     !durable.previous||!durable.isolated||!durable.legacyUnchanged)
    throw Error('Real IndexedDB transaction / migration failed '+JSON.stringify(durable));
  await send('Page.reload',{ignoreCache:true});
  let durableReload=null;
  for(let i=0;i<40;i++){
    try{durableReload=await run(`(async()=>{
      const {createWorldDocumentIndexedDbStoreV1}=await import('./src/storage/world-document-indexeddb-store-v1.js');
      const {WORLD_ASSEMBLER_DRAFT_KEY:key}=await import('./src/builder/world-assembler-handoff.js');
      const row=await createWorldDocumentIndexedDbStoreV1().read(key);
      return row?{revision:row.revision,label:row.document.areas[0].label,previous:!!row.previous}:null;
    })()`);}catch{}
    if(durableReload)break;await sleep(150);
  }
  if(durableReload?.revision!==2||durableReload.label!=='Zone IndexedDB vérifiée'||!durableReload.previous)
    throw Error('Real IndexedDB did not survive page reload '+JSON.stringify(durableReload));
  console.log('GREEN real IndexedDB: transaction, migration, stale writer, rollback, isolation and reload');

  // One valid WorldDocument at native maximum map dimensions, larger than
  // the historical Web Storage budget. It must not need localStorage at all.
  const large=await run(`(async()=>{
    const {createWorldDocumentIndexedDbStoreV1}=await import('./src/storage/world-document-indexeddb-store-v1.js');
    const {createBlankWorldBuilderDraft,serializeWorldBuilderDraft}=await import('./src/builder/world-builder-draft.js');
    const {createSculptTerrain}=await import('./src/world/sculpt-height-model.js');
    const base=createBlankWorldBuilderDraft({id:'world-idb-capacity-test',width:80*28,height:64*21});
    const terrain=createSculptTerrain({width:80,height:64,levels:Array.from({length:80*64},(_,i)=>i%17)});
    const world={...base,areas:Array.from({length:64},(_,i)=>({...base.areas[0],id:i===0?base.initialAreaId:'area-capacity-'+i,label:'Zone '+i,sculptTerrain:terrain}))};
    const bytes=serializeWorldBuilderDraft(world);
    const key='gensrpg.exploration.world-library.document.v1:'+world.id;
    const store=createWorldDocumentIndexedDbStoreV1();
    const [saved]=await store.commit([{key,document:world,expectedRevision:null}]);
    const reopened=await store.read(key);
    const items=await store.inventory();
    return {length:bytes.length,areas:reopened.document.areas.length,revision:saved.revision,
      identical:serializeWorldBuilderDraft(reopened.document)===bytes,
      inventoried:items.some(x=>x.key===key&&x.areaCount===64),noLegacyCopy:localStorage.getItem(key)===null};
  })()`);
  if(large.length<=5*1024*1024||large.areas!==64||large.revision!==1||
     !large.identical||!large.inventoried||!large.noLegacyCopy)
    throw Error('Large WorldDocument capacity regression '+JSON.stringify(large));
  console.log('GREEN real IndexedDB: 64 native maps, '+large.length+' serialized characters, exact readback');
  // Capacity with authored content, not just terrain. Use real catalog IDs,
  // canonical normalization and the actual Portal authoring command.
  const populated=await run(`(async()=>{
    const {createWorldDocumentIndexedDbStoreV1}=await import('./src/storage/world-document-indexeddb-store-v1.js');
    const {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument,connectWorldAreas,addSurfacePath}=await import('./src/builder/world-builder-draft.js');
    const {createSculptTerrain}=await import('./src/world/sculpt-height-model.js');
    const {objectDefinitionCatalogV1}=await import('./src/objects/object-definition-catalog.js');
    const base=createBlankWorldBuilderDraft({id:'world-idb-populated-test',width:80*28,height:64*21});
    const original=base.areas[0];
    const ids=['objectdef.tree.snow.broadleaf_oak_01','objectdef.building.windmill.01',
      'objectdef.rock.desert.layered_plateau.01','objectdef.decor.genesis.crate_moss.01',
      'objectdef.bridge.wood_rustic_2p5d.01','objectdef.stairs.stone_rustic_2p5d.01'];
    if(ids.some(id=>!objectDefinitionCatalogV1.get(id)))throw Error('Missing official object definition');
    let world={...base,areas:Array.from({length:64},(_,i)=>({...original,id:i===0?base.initialAreaId:'area-populated-'+i,label:'Carte chargée '+i}))};
    // Connect before expanding the terrain/placements to avoid quadratic
    // cloning of giant fixtures; all spawns and portals are real builder data.
    // All cards linked in pairs, not 63 expensive full graph authoring calls.
    for(let i=0;i<world.areas.length;i+=2)
      world=connectWorldAreas(world,{sourceAreaId:world.areas[i].id,targetAreaId:world.areas[i+1].id,returnPortal:true});
    let model=base;
    for(let i=0;i<8;i++){
      const points=Array.from({length:20},(_,j)=>({x:40+j*90,y:60+i*110+(j%3)*20}));
      model=addSurfacePath(model,base.initialAreaId,i===7?'river':i%2?'route':'terrain',{points,width:35+i*4});
    }
    const surface=model.areas[0].surface;
    const terrain=createSculptTerrain({width:80,height:64,levels:Array.from({length:80*64},(_,i)=>i%17)});
    world={...world,areas:world.areas.map((a,i)=>({...a,sculptTerrain:terrain,surface,
      objects:Array.from({length:i===0?2048:256},(_,j)=>({
        id:'placement-'+(j+1),objectDefinitionId:ids[j%ids.length],
        transform:{x:28+(j%76)*28,y:21+Math.floor(j/76)*40,rotationDeg:(j%4)*90,scaleX:0.5+(j%3)*0.25,scaleY:0.5+(j%3)*0.25},
        overrides:{}})),
      actors:Array.from({length:12},(_,j)=>({id:'actor-'+(j+1),actorDefinitionId:'capture:creature:crea-loup',x:90+j*90,y:120+i*10,facingX:j%2?1:-1}))
    }))};
    const raw=serializeWorldBuilderDraft(world);
    const normalized=importWorldBuilderDocument(raw);
    const counts={areas:normalized.areas.length,objects:normalized.areas.reduce((n,a)=>n+a.objects.length,0),
      actors:normalized.areas.reduce((n,a)=>n+a.actors.length,0),
      paths:normalized.areas.reduce((n,a)=>n+a.surface.zones.length+a.surface.routes.length+a.surface.rivers.length,0),
      portals:normalized.portals.length};
    const key='gensrpg.exploration.world-library.document.v1:'+normalized.id;
    const store=createWorldDocumentIndexedDbStoreV1();
    const start=performance.now();
    const [saved]=await store.commit([{key,document:normalized,expectedRevision:null}]);
    const read=await store.read(key);
    return {...counts,bytes:new TextEncoder().encode(raw).byteLength,revision:saved.revision,
      identical:serializeWorldBuilderDraft(read.document)===raw,noLegacyCopy:localStorage.getItem(key)===null,
      elapsedMs:Math.round(performance.now()-start)};
  })()`);
  if(populated.areas!==64||populated.objects!==18176||populated.actors!==768||
     populated.paths!==512||populated.portals!==64||populated.revision!==1||
     !populated.identical||!populated.noLegacyCopy)
    throw Error('Populated WorldDocument capacity regression '+JSON.stringify(populated));
  console.log('GREEN real IndexedDB populated maps '+JSON.stringify(populated));
  // Save a changed populated world again, on the same key, then check the
  // previous complete revision. No artificial Storage or mocked transaction.
  const populatedResave=await run(`(async()=>{
    const {createWorldDocumentIndexedDbStoreV1}=await import('./src/storage/world-document-indexeddb-store-v1.js');
    const {serializeWorldBuilderDraft}=await import('./src/builder/world-builder-draft.js');
    const store=createWorldDocumentIndexedDbStoreV1(),key='gensrpg.exploration.world-library.document.v1:world-idb-populated-test';
    const first=await store.read(key);
    const changed={...first.document,areas:first.document.areas.map((a,i)=>i===0?{...a,label:'Carte chargée modifiée'}:a)};
    const [saved]=await store.commit([{key,document:changed,expectedRevision:first.revision}]);
    const reopened=await store.read(key);
    return {revision:saved.revision,current:serializeWorldBuilderDraft(reopened.document)===serializeWorldBuilderDraft(changed),
      previous:serializeWorldBuilderDraft(reopened.previous)===serializeWorldBuilderDraft(first.document)};
  })()`);
  if(populatedResave.revision!==2||!populatedResave.current||!populatedResave.previous)
    throw Error('Populated WorldDocument resave regression '+JSON.stringify(populatedResave));
  console.log('GREEN real IndexedDB populated maps: second save and complete previous revision');
}finally{
  // The fully isolated Chromium profile is kept mutable by browser helpers.
  // Shut down via CDP FIRST so they flush storage before the process-group
  // fallback. A SIGKILL-only shutdown can race rmdir(Default) after all
  // successful smoke assertions and turn a GREEN test into ENOTEMPTY.
  if(socket){
    if(socket.readyState===WebSocket.OPEN){
      try{
        socket.send(JSON.stringify({id:2147483000,method:'Browser.close'}));
        await sleep(750);
      }catch{ /* Browser.close is best effort; process-group gate below */ }
    }
    try{socket.close();}catch{}
  }
  // Browser-profile files can still be written after kill() returns.
  // Wait for the real Chromium exit before deleting its isolated directory;
  // never mask actual browser assertions with a racing ENOTEMPTY cleanup.
  if(chrome){
    const killTree=signal=>{
      try{
        if(process.platform!=='win32'&&Number.isInteger(chrome.pid))
          process.kill(-chrome.pid,signal);
        else chrome.kill(signal);
      }catch(error){if(error?.code!=='ESRCH')throw error;}
    };
    if(chrome.exitCode===null&&chrome.signalCode===null){
      const exited=new Promise(ok=>chrome.once('exit',ok));
      killTree('SIGTERM');
      if(!await Promise.race([exited.then(()=>true),sleep(3500).then(()=>false)])){
        killTree('SIGKILL');
        await exited;
      }
    }
    // Parent exit does not imply Chromium child helpers have exited.
    // Kill only the dedicated Chrome process group, not unrelated tests.
    if(process.platform!=='win32')killTree('SIGKILL');
  }
  await new Promise(ok=>server.close(ok));
  // Chromium cache workers may still flush short-lived profile entries after
  // the browser process group exits. Wait for actual recursive removal,
  // keeping this independent smoke red on persistent cleanup errors.
  await rm(profile,{recursive:true,force:true,maxRetries:60,retryDelay:250});
}
