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
  let ready=false;
  for(let i=0;i<100;i++){
    ready=await run("typeof window.__worldAssemblerProbe==='function' && document.querySelectorAll('.world-node').length>0");
    if(ready)break;await sleep(150);
  }
  if(!ready)throw Error('World Assembler failed to boot in browser');
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
  const dragged=await run(`(()=>{
    const world=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
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
  const edited=await run(`(()=>{
    const card=document.querySelector('.world-node[data-area-id="area-principale"]');
    card.click();
    const dialog=document.querySelector('#area-details-dialog');
    const loaded=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
    const terrainBefore=JSON.stringify(loaded?.encounterConfig??null);
    const oneId=id=>document.querySelectorAll('#'+id).length===1;
    const oneForm=oneId('world-area-encounter-levels')&&oneId('connect-form')&&
      oneId('area-add-form')&&oneId('selected-contents')&&oneId('selected-events');
    document.querySelector('#area-encounter-min-level').value='4';
    document.querySelector('#area-encounter-max-level').value='17';
    document.querySelector('#world-area-encounter-levels').requestSubmit();
    const updated=JSON.parse(localStorage.getItem('gensrpg.world-assembler.document.v1')||'null');
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
    document.querySelector('#area-list button').click();
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
    throw Error('Area modal Escape/list/new zone UI failed '+JSON.stringify(navigation));
  console.log('GREEN real Chromium: single Area modal, native levels, texture odds unchanged, Escape/new area '+
    JSON.stringify({edited,navigation}));
  console.log('GREEN real Chromium: draggable WorldArea, saved position and Portal preservation '+
    JSON.stringify({dragged:dragged.point,afterReload:{x:recovered.left,y:recovered.top},
      portals:recovered.portalCount}));
}finally{
  if(socket){try{socket.close();}catch{}}
  if(chrome){try{chrome.kill('SIGKILL');}catch{}}
  server.close();
  await rm(profile,{recursive:true,force:true});
}
