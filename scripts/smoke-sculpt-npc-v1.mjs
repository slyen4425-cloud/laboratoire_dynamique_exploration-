// Real Chromium gate for PNJ authoring, dialogue, both trainer triggers and frozen V80.
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';

const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
 '.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
 try{
  const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  const bytes=await readFile(file);
  res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream',
   'Cache-Control':'no-store'}).end(bytes);
 }catch{res.writeHead(404).end('missing');}
});
const chromePath=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
  .find(exe=>exe&&spawnSync('which',[exe]).status===0);
if(!chromePath)throw Error('Chromium is required for PNJ browser gate');
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const url='http://127.0.0.1:'+server.address().port+'/sculpt-lab.html';
const profile=await mkdtemp(resolve(tmpdir(),'sculpt-npc-v1-'));
let browser,socket,seq=0;
const pending=new Map(),errors=[];
function command(method,params={}){
 return new Promise((ok,fail)=>{
  const id=++seq;
  const watchdog=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout: '+method));},25000);
  pending.set(id,r=>{
   clearTimeout(watchdog);
   r.error?fail(Error('CDP '+JSON.stringify(r.error))):ok(r);
  });
  socket.send(JSON.stringify({id,method,params}));
 });
}
async function run(expression){
 const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
 if(r.result?.exceptionDetails)throw Error('Browser exception '+JSON.stringify(r.result.exceptionDetails).slice(0,1500));
 return r.result?.result?.value;
}
async function until(expression,label){
 for(let i=0;i<115;i++){
  let state;
  try{state=await run(expression);}catch{}
  if(state)return state;
  await sleep(120);
 }
 throw Error('Timed out waiting for '+label+'; page errors '+JSON.stringify(errors.slice(-3)));
}
try{
 browser=spawn(chromePath,['--headless=new','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--disable-extensions','--no-first-run',
  '--remote-debugging-port=0','--window-size=932,430',
  '--user-data-dir='+profile,url],{stdio:['ignore','ignore','pipe']});
 const port=await new Promise((ok,fail)=>{
  let err='';
  const watchdog=setTimeout(()=>fail(Error('Browser startup '+err.slice(-600))),45000);
  browser.stderr.on('data',chunk=>{
   err+=chunk.toString();const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(err);
   if(match){clearTimeout(watchdog);ok(Number(match[1]));}
  });
  browser.once('error',fail);
  browser.once('exit',code=>fail(Error('Browser exited '+code)));
 });
 let target;
 for(let i=0;i<45;i++){
  const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
  target=tabs.find(t=>t.type==='page'&&t.url.includes('/sculpt-lab.html'));
  if(target)break;
  await sleep(130);
 }
 if(!target)throw Error('No Sculpt editor browser tab');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  socket.addEventListener('open',ok,{once:true});
  socket.addEventListener('error',fail,{once:true});
 });
 socket.addEventListener('message',e=>{
  const r=JSON.parse(e.data);
  if(r.method==='Runtime.exceptionThrown'){
   const issue=r.params?.exceptionDetails;
   errors.push({text:issue?.text,description:issue?.exception?.description,
     url:issue?.url,line:issue?.lineNumber,
     source:issue?.stackTrace?.callFrames?.[0]?.url});
  }
  const cb=pending.get(r.id);
  if(cb){pending.delete(r.id);cb(r);}
 });
 await command('Runtime.enable');
 await command('Page.enable');
 await until("typeof window.__sculptActorsProbe==='function' && window.__sculptActorsProbe().catalogReady",'native Actor catalog');
 const setup=await run(`(()=>{
  document.querySelector('#flat').click();
  document.querySelector('#mode-objects').click();
  document.querySelector('#actor-open').click();
  const definition=document.querySelector('#actor-definition');
  definition.value='exploration:npc:generic-v1';
  definition.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#actor-npc-kind').value='trainer';
  document.querySelector('#actor-npc-name').value='Gardienne de la clairière';
  document.querySelector('#actor-npc-dialogue').value='Bonjour voyageur !\\nTrouve la clé.';
  document.querySelector('#actor-npc-movement').value='static';
  document.querySelector('#sculpt-canvas').scrollIntoView({block:'center',behavior:'instant'});
  return {selection:definition.value,probe:window.__sculptActorsProbe()};
 })()`);
 if(setup.selection!=='exploration:npc:generic-v1'||!setup.probe.active)
  throw Error('NPC palette not available '+JSON.stringify(setup));
 // Place at the actual standalone navigation Spawn (3,3) on a flat map.
 const point=await run(`(()=>{
  const p=window.__sculptLabProbe(),rect=document.querySelector('#sculpt-canvas').getBoundingClientRect();
  const x=rect.left+p.cameraPan.x+3.5*28*p.zoom;
  const y=rect.top+p.cameraPan.y+3.5*21*p.zoom;
  return {x,y,hit:document.elementFromPoint(x,y)?.id,probe:p};
 })()`);
 if(point.hit!=='sculpt-canvas')throw Error('Native map click unavailable '+JSON.stringify(point));
 for(const type of ['mouseMoved','mousePressed','mouseReleased']){
  await command('Input.dispatchMouseEvent',{type,x:point.x,y:point.y,button:'left',clickCount:1});
 }
 await sleep(150);
 const placed=await run(`(()=>{
  document.querySelector('#scene-export').click();
  const actor=JSON.parse(document.querySelector('#json').value).actors?.[0];
  return {count:window.__sculptActorsProbe().count,actor};
 })()`);
 if(placed.count!==1||placed.actor?.npc?.kind!=='trainer'||
     !placed.actor?.npc?.dialogue.includes('Bonjour voyageur !')||
     !placed.actor?.npc?.dialogue.includes('Trouve la clé.')||
     !placed.actor?.npc?.dialogue.includes(String.fromCharCode(10)))
  throw Error('NPC placement not persisted in canonical scene '+JSON.stringify(placed));
 const modalAtCreation=await run(`({
  open:document.querySelector('#npc-authoring-dialog')?.open,
  uniqueForm:document.querySelectorAll('#actor-npc-settings').length,
  selected:window.__sculptActorsProbe().selectedId
 })`);
 if(!modalAtCreation.open||modalAtCreation.uniqueForm!==1||
    modalAtCreation.selected!==placed.actor?.id)
  throw Error('Native PNJ authoring window not opened after placement '+JSON.stringify(modalAtCreation));
 await run("document.querySelector('#npc-authoring-close').click()");
 if(await run("document.querySelector('#npc-authoring-dialog').open"))
  throw Error('Native PNJ authoring window failed to close');
 // The next tap on the same placed actor must select its details automatically
 // without requiring a mode switch or creating a duplicate Actor placement.
 for(const type of ['mouseMoved','mousePressed','mouseReleased'])
  await command('Input.dispatchMouseEvent',{type,x:point.x,y:point.y,button:'left',clickCount:1});
 await until("document.querySelector('#npc-team-creature')?.options.length>1",'official Combat creature choices');
 if(!await run("document.querySelector('#npc-authoring-dialog').open"))
  throw Error('Selecting an existing PNJ did not reopen its original settings');
 const configured=await run(`(()=>{
   const selector=document.querySelector('#npc-team-creature');
   selector.value=selector.options[1].value;
   document.querySelector('#npc-team-level').value='12';
   document.querySelector('#npc-team-add').click();
   selector.value=selector.options[2].value;
   document.querySelector('#npc-team-level').value='7';
   document.querySelector('#npc-team-add').click();
   const engagement=document.querySelector('#npc-trainer-engagement');
   const defaultEngagement=engagement.value;
   engagement.value='aggressive';
   engagement.dispatchEvent(new Event('change',{bubbles:true}));
   document.querySelector('#scene-export').click();
   const actor=JSON.parse(document.querySelector('#json').value).actors[0];
   engagement.value='offer';
   engagement.dispatchEvent(new Event('change',{bubbles:true}));
   document.querySelector('#scene-export').click();
   return {actor,offerScene:document.querySelector('#json').value,
    rows:document.querySelectorAll('.npc-team-row').length,defaultEngagement};
 })()`);
 const roster=configured.actor?.npc?.trainerRoster;
 if(!roster?.[0]?.creatureId||roster[0].level!==12||!roster[1]?.creatureId||roster[1].level!==7||
    configured.rows!==2||configured.defaultEngagement!=='offer'||
    configured.actor.npc.trainerEngagement!=='aggressive')
  throw Error('Visual trainer team editor failed '+JSON.stringify(configured.actor));
 console.log('Native visual trainer roster:',JSON.stringify(roster));
 const updated=await run(`(()=>{
  const selected=window.__sculptActorsProbe().selectedId;
  document.querySelector('#actor-npc-kind').value='dialogue';
  const name=document.querySelector('#actor-npc-name');
  name.value='Gardienne';name.dispatchEvent(new Event('change',{bubbles:true}));
  const role=document.querySelector('#actor-npc-kind');
  role.dispatchEvent(new Event('change',{bubbles:true}));
  document.querySelector('#scene-export').click();
  return {selected,mode:document.querySelector('#actor-action').value,
    count:window.__sculptActorsProbe().count,
    actor:JSON.parse(document.querySelector('#json').value).actors?.[0]};
 })()`);
 if(!updated.selected||updated.mode!=='select'||updated.count!==1||
    updated.actor?.npc?.name!=='Gardienne'||
    updated.actor?.npc?.kind!=='dialogue'||
    updated.actor?.npc?.trainerRoster?.[0]?.level!==12)
  throw Error('NPC select/edit failed '+JSON.stringify(updated));
 await run("document.querySelector('#npc-authoring-close').click()");
 await run("document.querySelector('#npc-authoring-open').click()");
 if(!await run("document.querySelector('#npc-authoring-dialog').open"))
  throw Error('Reopening the selected PNJ from its toolbar failed');
 await run("document.querySelector('#npc-authoring-close').click()");
 // Tester must show the SAME authored dialogue near the navigation Spawn.
 await run("document.querySelector('#navigation-toggle').click()");
 await until("document.querySelector('#npc-talk')?.hidden===false",'nearby PNJ talk button');
 const spoken=await run(`(()=>{
   document.querySelector('#npc-talk').click();
   const overlay=document.querySelector('#npc-dialogue-overlay');
   const first=document.querySelector('#npc-dialogue-text').textContent;
   document.querySelector('#npc-dialogue-next').click();
   const second=document.querySelector('#npc-dialogue-text').textContent;
   document.querySelector('#npc-dialogue-close').click();
   return {first,second,closed:overlay.hidden};
 })()`);
 if(spoken.first!=='Bonjour voyageur !'||spoken.second!=='Trouve la clé.'||!spoken.closed)
  throw Error('NPC dialogue buttons failed '+JSON.stringify(spoken));
 console.log('PNJ genuine Chromium placement/select/export/dialogue:',JSON.stringify({
  id:placed.actor.id,kind:updated.actor.npc.kind,selected:updated.selected,...spoken
 }));

 // Restore the scene authored above and use the Builder's real Tester button.
 await run(`(()=>{
  document.querySelector('#navigation-toggle').click();
  document.querySelector('#json').value=${JSON.stringify(configured.offerScene)};
  document.querySelector('#import').click();
  document.querySelector('#navigation-toggle').click();
 })()`);
 await until("document.querySelector('#npc-talk')?.hidden===false",'nearby trainer in Tester');
 const offer=await run(`(()=>{
  document.querySelector('#npc-talk').click();
  document.querySelector('#npc-dialogue-next').click();
  return {accept:document.querySelector('#npc-dialogue-next').textContent,
    refuse:document.querySelector('#npc-dialogue-close').textContent};
 })()`);
 if(offer.accept!=='Accepter le duel'||offer.refuse!=='Refuser')
  throw Error('Tester drops the authored trainer challenge: '+JSON.stringify(offer));
 await run("document.querySelector('#npc-dialogue-close').click()");
 if(await run("Boolean(document.querySelector('.combat-overlay__frame'))"))throw Error('Refusal launched a battle');
 await run(`(()=>{
  document.querySelector('#npc-talk').click();
  document.querySelector('#npc-dialogue-next').click();
  document.querySelector('#npc-dialogue-next').click();
 })()`);
 const combatDoc="document.querySelector('.combat-overlay__frame')?.contentDocument";
 async function waitForNativeDuel(label){
  try{
   await until("Boolean("+combatDoc+"?.querySelector('[data-bridge-status][data-ready=true]'))",label);
  }catch(error){
   const status=await run(combatDoc+"?.querySelector('[data-bridge-status]')?.textContent");
   throw new Error(error.message+'; combat status '+status,{cause:error});
  }
 }
 await waitForNativeDuel('native Tester trainer fight');
 if(await run(combatDoc+".querySelectorAll('[data-enemy-reserve-member-id]:not([hidden])').length")!==1)
  throw Error('The authored second creature is missing from the Tester fight');
 const journal=await run(`(async()=>{
  const {readCombatHandoff}=await import('./src/encounters/combat-handoff-store.js');
  const snapshot=readCombatHandoff(sessionStorage)?.snapshot;
  return {source:snapshot?.source,partyRef:snapshot?.player.partyRef,
   opponents:snapshot?.opponents,storedLocally:Boolean(readCombatHandoff(localStorage))};
 })()`);
 if(journal.source!=='npc-trainer'||journal.partyRef!=='capture-party-player-v1'||journal.storedLocally||
    journal.opponents?.length!==roster.length||
    journal.opponents?.some((slot,index)=>slot.creatureId!==roster[index]?.creatureId||slot.level!==roster[index]?.level))
  throw Error('Tester must use the original preview party and authored trainer levels '+JSON.stringify(journal));
 await run(combatDoc+".querySelector('[data-encounter-flee]').click()");
 await until("!document.querySelector('.combat-overlay__frame')",'Tester exploration after flee');

 // Play the same authored dresseur in a saved WorldDocument via World Builder → Jouer.
 await run(`(async()=>{
  const [{createBlankWorldBuilderDraft},{saveWorldAssemblerDraft}]=await Promise.all([
   import('./src/builder/world-builder-draft.js'),import('./src/builder/world-assembler-handoff.js')
  ]);
  const world=createBlankWorldBuilderDraft({id:'world-test-dresseur',width:36*28,height:24*21});
  const area=world.areas.find(entry=>entry.id===world.initialAreaId);
  const spawn=area.spawns.find(entry=>entry.id===world.initialSpawnId);
  area.actors.push({...${JSON.stringify(configured.actor)},x:spawn.x+20,y:spawn.y});
  saveWorldAssemblerDraft(localStorage,world);
 })()`);
 await command('Page.navigate',{url:new URL('/world-assembler.html',url).href});
 await until("location.pathname.endsWith('/world-assembler.html') && document.querySelector('#world-play-open')",'World Builder play entry');
 await run("document.querySelector('#world-play-open').click()");
 await until("location.pathname.endsWith('/play.html') && document.querySelector('#play-new')?.disabled===false",'World Builder new game');
 await run("document.querySelector('#play-new').click()");
 await until("window.__sculptPlayProbe?.().active",'saved world loaded for play');
 const right={key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39};
 await command('Input.dispatchKeyEvent',{type:'keyDown',...right});
 try{
  await waitForNativeDuel('aggressive trainer on first movement within range');
 }finally{await command('Input.dispatchKeyEvent',{type:'keyUp',...right});}
 if(await run("document.querySelector('#npc-dialogue-overlay').hidden")!==true)
  throw Error('Aggressive trainer opened dialogue before battle');
 await run(combatDoc+".querySelector('[data-encounter-flee]').click()");
 await until("!document.querySelector('.combat-overlay__frame') && window.__sculptPlayProbe().active",'saved world after native trainer fight');
 console.log('Native dresseur duels validated from Tester and World Builder play');

 await command('Page.navigate',{url:new URL('/sculpt-lab-v80.html',url).href});
 await until("typeof window.__sculptLabProbe==='function' && document.querySelector('#sculpt-canvas')?.width>0",'frozen V80 startup');
 const legacy=await run(`({
  dimensions:[window.__sculptLabProbe().width,window.__sculptLabProbe().height],
  unchangedMarkup:!document.querySelector('#actor-npc-kind')&&!document.querySelector('#npc-talk')
 })`);
 if(legacy.dimensions[0]!==36||legacy.dimensions[1]!==24||!legacy.unchangedMarkup)
  throw Error('Frozen V80 incompatibility '+JSON.stringify(legacy));
 if(errors.length)throw Error('Runtime browser errors '+JSON.stringify(errors.slice(-5)));
 console.log('Frozen V80 boots with shared actor engine unchanged:',JSON.stringify(legacy));
}finally{
 socket?.close();
 // Chromium can keep writing its profile for a moment after receiving
 // SIGTERM. Wait for real process exit before deleting the test directory;
 // a successful end-to-end browser test must never fail on an fs race.
 if(browser&&browser.exitCode===null&&browser.signalCode===null){
  const exited=once(browser,'exit').catch(()=>{});
  browser.kill('SIGKILL');
  await Promise.race([exited,sleep(4500)]);
 }
 await rm(profile,{recursive:true,force:true,maxRetries:8,retryDelay:150});
 await new Promise(ok=>server.close(ok));
}
