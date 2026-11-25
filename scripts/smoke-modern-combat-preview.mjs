// Chromium checks the actual, packaged Encounter DOM and module/data graph,
// not a mocked Combat UI or invented win/loss. Run only against a pinned artifact.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, extname, sep } from 'node:path';
import {createUniverseEncounterBrowserFixture} from './universe-encounter-browser-fixture.mjs';

const root = process.cwd();
const route = '/combat-preview/examples/dom-demo/exploration-encounter.html';
const mime = {
  '.html':'text/html', '.js':'text/javascript', '.mjs':'text/javascript',
  '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml',
  '.png':'image/png', '.webp':'image/webp', '.ico':'image/x-icon'
};

const snapshot = {
  schema:'capture-encounter-snapshot-v1', version:1,
  encounterId:'smoke-encounter-1', source:'terrain-random',
  player:{partyRef:'capture-party-player-v1'},
  opponents:[{creatureId:'crea_nat_1'}],
  rules:{rulesetId:'capture.standard.1v1'},
  context:{areaId:'forest-exterior',terrainFamilyId:'forest',elementId:'nature'},
  returnToken:'return-smoke-1'
};

const universeFixture=await createUniverseEncounterBrowserFixture(snapshot);
const server = createServer(async(req,res)=>{
  try {
    const requestUrl=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(requestUrl.pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    let content=await readFile(path);
    if(pathname===route){
      const origin='http://127.0.0.1:'+server.address().port;
      const projectTester=requestUrl.searchParams.has('projectTester');
      const opponentId=requestUrl.searchParams.get('opponent') || snapshot.opponents[0].creatureId;
      const placedWild=requestUrl.searchParams.has('placedWild');
      const encounterSnapshot=placedWild?{...snapshot,source:'npc-wild',
        context:{...snapshot.context,wildActorId:'placed-wild-smoke'},
        opponents:[{creatureId:opponentId,level:20,npcInstance:{
          schema:'capture-npc-opponent-instance-v1',displayName:'Sauvage Chromium',
          statAllocations:{health:7}
        }}]}:{...snapshot,opponents:[{creatureId:opponentId}]};
      const envelope={version:1,snapshot:encounterSnapshot,
        returnState:{areaId:'forest-exterior',x:62,y:18,
          returnUrl:origin+'/index.html?combatReturn=1'+(projectTester?'&universe='+universeFixture.universeId:'')},result:null};
      const probe='<script>'+
        (projectTester?universeFixture.testerSeed:'')+
        (requestUrl.searchParams.get('adventureSession')===universeFixture.sessionId?
          universeFixture.browserSeed(origin):'')+
        'sessionStorage.setItem("gensrpg.capture.combat-handoff.v1",'+
        JSON.stringify(JSON.stringify(envelope))+');'+
        'window.addEventListener("error",e=>document.documentElement.dataset.encounterBootstrapError=e.message);'+
        'window.addEventListener("unhandledrejection",e=>document.documentElement.dataset.encounterBootstrapError=String(e.reason?.message||e.reason));'+
        '</script>';
      // Native browser behavior: a visible ability must really dispatch an action.
      // The earlier Chromium gate only counted icons and missed disabled skills.
      const playableProbe = `<script>
        window.addEventListener('load', () => {
          let attempts = 0;
          const timer = setInterval(() => {
            const fullscreenButton = document.querySelector('[data-encounter-fullscreen]');
            if (fullscreenButton && !document.documentElement.dataset.encounterFullscreenProof) {
              document.documentElement.dataset.encounterFullscreenProof =
                getComputedStyle(fullscreenButton).display !== 'none' && !fullscreenButton.disabled
                  ? 'OK' : 'button-not-visible';
            }
            document.documentElement.dataset.encounterAudioProof =
              document.querySelector('[data-encounter-audio]') === null
                ? 'OK' : 'redundant-audio-button-present';
            const skills = [...document.querySelectorAll('[data-combat-skill]')];
            const ready = skills.find(button => !button.disabled);
            if (ready) {
              const status = document.querySelector('[data-combat-live-status]');
              const before = status?.textContent ?? '';
              ready.click();
              const after = status?.textContent ?? '';
              document.documentElement.dataset.encounterSkillProof =
                after !== before || ready.disabled ? 'OK' :
                  'action-not-committed:' + ready.dataset.combatSkill;
              clearInterval(timer);
              return;
            }
            if (++attempts >= 240) {
              document.documentElement.dataset.encounterSkillProof =
                'no-native-skill-ready:buttons=' + skills.length;
              clearInterval(timer);
            }
          }, 150);
        }, {once: true});
      </script>`;
      const layoutProbe = `<script>
        window.addEventListener('load', () => {
          let attempts = 0;
          const timer = setInterval(() => {
            const stage = document.querySelector('[data-capture-preview-shell]');
            const arena = document.querySelector('[data-combat-arena]');
            const banner = document.querySelector('[data-bridge-status]');
            const local = document.querySelector('.squad-card--local-full');
            const controls = document.querySelector('.coop-command-stack');
            // The image-decoding barrier is intentional. Test the finished
            // native Combat layout rather than a fixed delay after page load.
            if (!stage || !arena || !banner || !local || !controls) {
              if (++attempts >= 240) {
                document.documentElement.dataset.nativeLayoutProof = 'missing-canonical-view';
                clearInterval(timer);
              }
              return;
            }
            // The bridge now awaits its official arena backdrop. Evaluate the
            // real final layout only after its existing loading banner closes.
            // A missing READY still fails through the finite existing bound.
            if (getComputedStyle(banner).display !== 'none' && attempts++ < 240) return;
            const r = arena.getBoundingClientRect();
            const h = local.getBoundingClientRect();
            const c = controls.getBoundingClientRect();
            const project=new URL(location.href).searchParams;
            const configured=project.has('adventureSession')||project.has('projectTester');
            // Combat main #396 projects the saved legacy offsets through
            // its new rectangle owner, not CSS translate. Verify the native
            // node and its actual measured position, without dropping the
            // requirement for a saved layout or skill slots.
            const translated=local.style.translate!==''&&local.style.translate!=='none';
            const box=local.dataset.hudBox==='local-status';
            const parent=local.offsetParent;
            const p=parent?.getBoundingClientRect();
            const left=parseFloat(local.style.left),top=parseFloat(local.style.top);
            const width=parseFloat(local.style.width),height=parseFloat(local.style.height);
            const positioned=box&&p&&getComputedStyle(local).position==='absolute'&&
              [left,top,width,height].every(Number.isFinite)&&
              Math.abs(h.left-(p.left+parent.clientLeft-parent.scrollLeft+left))<2&&
              Math.abs(h.top-(p.top+parent.clientTop-parent.scrollTop+top))<2&&
              Math.abs(h.width-width)<2&&Math.abs(h.height-height)<2&&
              h.left>=r.left-1&&h.top>=r.top-1&&h.right<=r.right+1&&h.bottom<=r.bottom+1;
            const moved=translated||positioned;
            const slot=!!document.querySelector('[data-combat-hud-skill-role^="skill-slot-"]');
            document.documentElement.dataset.nativeAuthoredHudProof=configured
              ?(moved&&slot?'OK':'layout-or-slot-missing:'+local.style.translate+':'+box+':'+positioned+':'+slot)
              :(!translated&&!box?'OK':'unexpected-layout');
            const ok = getComputedStyle(stage).position === 'fixed' &&
              getComputedStyle(banner).display === 'none' &&
              r.width > 500 && r.height > 260 &&
              Math.abs(r.width/r.height - 16/9) < 0.06 &&
              r.width <= window.innerWidth + 1 &&
              r.height <= window.innerHeight + 1 &&
              h.height < r.height * 0.29 &&
              c.width < r.width * 0.41 &&
              arena.dataset.combatActiveCount === '1';
            document.documentElement.dataset.nativeLayoutProof = ok ? 'OK' :
              'layout-mismatch:' + [
                getComputedStyle(stage).position,
                getComputedStyle(banner).display,
                Math.round(r.width), Math.round(r.height),
                Math.round(h.height), Math.round(c.width),
                arena.dataset.combatActiveCount
              ].join(':');
            clearInterval(timer);
          }, 150);
        }, {once: true});
      </script>`;
      content=Buffer.from(content.toString('utf8').replace('</head>',probe+playableProbe+layoutProbe+'</head>'));
    }
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(content);
  }catch(error){res.writeHead(404).end('Unavailable '+String(error?.message));}
});
await new Promise((resolveStart,rejectStart)=>{
  server.once('error',rejectStart);
  server.listen(0,'127.0.0.1',resolveStart);
});

function browserBinary() {
  for(const candidate of [process.env.CHROME_PATH,'google-chrome','google-chrome-stable','chromium','chromium-browser']){
    if(candidate && spawnSync('which',[candidate]).status===0)return candidate;
  }
  throw new Error('Chrome/Chromium unavailable');
}

// Real-time CDP checks the native decoded arena and session, not Chromium's
// virtual clock. A simulated-timer DOM snapshot can expire while a valid
// local image is loading, spuriously declaring Combat unavailable.
async function dumpDom(url) {
  const profile=await mkdtemp(resolve(tmpdir(),'gensrpg-real-combat-smoke-'));
  let command=null,socket=null;
  try {
    command=spawn(browserBinary(),[
      '--headless=new','--no-sandbox','--disable-gpu',
      '--window-size=1600,900','--disable-dev-shm-usage',
      '--no-first-run','--disable-extensions',
      '--remote-debugging-port=0','--user-data-dir='+profile,url
    ],{stdio:['ignore','ignore','pipe'],detached:process.platform!=='win32'});
    const port=await new Promise((done,fail)=>{
      let stderr='';
      const watchdog=setTimeout(()=>fail(Error('Chromium debug port unavailable '+stderr.slice(-300))),45000);
      command.stderr.on('data',bytes=>{
        stderr+=bytes.toString();
        const match=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
        if(match){clearTimeout(watchdog);done(Number(match[1]));}
      });
      command.once('error',error=>{clearTimeout(watchdog);fail(error);});
      command.once('exit',code=>{clearTimeout(watchdog);fail(Error('Chromium exited '+code));});
    });
    let target=null;
    for(let i=0;i<50;i++){
      const tabs=await (await fetch('http://127.0.0.1:'+port+'/json')).json();
      target=tabs.find(t=>t.type==='page'&&t.url.startsWith(url));
      if(target)break;
      await new Promise(done=>setTimeout(done,150));
    }
    if(!target)throw Error('Native Combat real Chromium tab missing');
    socket=new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((done,fail)=>{
      socket.addEventListener('open',done,{once:true});
      socket.addEventListener('error',fail,{once:true});
    });
    let seq=0;
    const pending=new Map();
    socket.addEventListener('message',event=>{
      const result=JSON.parse(event.data);
      const callback=pending.get(result.id);
      if(callback){pending.delete(result.id);callback(result);}
    });
    const evaluate=expression=>new Promise((done,fail)=>{
      const id=++seq;
      const watchdog=setTimeout(()=>{
        pending.delete(id);
        fail(Error('CDP evaluation stalled: '+expression.slice(0,180)));
      },30000);
      pending.set(id,result=>{
        clearTimeout(watchdog);
        if(result.error||result.result?.exceptionDetails)
          fail(Error('CDP evaluation error '+JSON.stringify(result).slice(0,700)));
        else done(result.result?.result?.value);
      });
      socket.send(JSON.stringify({id,method:'Runtime.evaluate',
        params:{expression,returnByValue:true,awaitPromise:true}}));
    });
    let evidence;
    // CDP can attach before the initial blank document gains documentElement.
    // Keep the existing finite READY deadline and all final native assertions.
    const probe="(()=>({status:document.querySelector('[data-bridge-status]')?.textContent?.trim()??'',"+
      "error:document.documentElement?.dataset?.encounterBootstrapError??'',"+
      "layout:document.documentElement?.dataset?.nativeLayoutProof??'',"+
      "skill:document.documentElement?.dataset?.encounterSkillProof??'',"+
      "audio:document.documentElement?.dataset?.encounterAudioProof??'',"+
      "fullscreen:document.documentElement?.dataset?.encounterFullscreenProof??''}))()";
    for(let i=0;i<200;i++){
      evidence=await evaluate(probe);
      if(evidence?.error||
         (evidence?.status?.includes('Combat réel')&&evidence.layout&&evidence.skill&&
          evidence.audio&&evidence.fullscreen))break;
      await new Promise(done=>setTimeout(done,150));
    }
    // An unfinished render still fails via the unchanged native assertions.
    const html=await evaluate('document.documentElement.outerHTML');
    if(typeof html!=='string')throw Error('Native Combat DOM could not be inspected');
    return html;
  } finally {
    if(socket)try{socket.close();}catch{}
    if(command){
      // The browser may keep writing its profile from child processes after
      // the parent PID is signalled. Own a dedicated process group and wait
      // for its real exit before removing this test-only temporary directory.
      const closed=command.exitCode===null&&command.signalCode===null
        ?new Promise(resolve=>command.once('close',resolve))
        :Promise.resolve();
      if(process.platform!=='win32'&&Number.isSafeInteger(command.pid)){
        try{process.kill(-command.pid,'SIGKILL');}
        catch{command.kill('SIGKILL');}
      }else command.kill('SIGKILL');
      await closed;
    }
    await rm(profile,{recursive:true,force:true});
  }
}

try {
  const baseUrl='http://127.0.0.1:'+server.address().port+route;
  // Keep the original encounter sentinel and add the creator's second-battle
  // case: Noctigriffe has no authored model and must remain playable by fallback.
  for (const [opponentId,opponentName,query=''] of [['crea_nat_1','Grainou'],['crea_ombre_2','Noctigriffe'],
    [universeFixture.speciesId,universeFixture.name,'&adventureSession='+universeFixture.sessionId],
    [universeFixture.speciesId,universeFixture.name,'&projectTester=1'],
    ['crea_mossback','Sauvage Chromium','&placedWild=1']]) {
  const url=baseUrl+'?opponent='+opponentId+query;
  const dom=await dumpDom(url);
  const status=dom.match(/<p[^>]*data-bridge-status[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g,'').trim()??'missing';
  const jsError=dom.match(/data-encounter-bootstrap-error="([^"]+)"/)?.[1]??'';
  const layoutProof=dom.match(/data-native-layout-proof="([^"]+)"/)?.[1]??'missing';
  const skillProof=dom.match(/data-encounter-skill-proof="([^"]+)"/)?.[1]??'missing';
  const hudProof=dom.match(/data-native-authored-hud-proof="([^"]+)"/)?.[1]??'missing';
  const fullscreenProof=dom.match(/data-encounter-fullscreen-proof="([^"]+)"/)?.[1]??'missing';
  const audioProof=dom.match(/data-encounter-audio-proof="([^"]+)"/)?.[1]??'missing';
  const skillCount=[...dom.matchAll(/data-combat-skill="/g)].length;
  const orbs=[...dom.matchAll(/class="energy-orb\b/g)].length;
  console.log(JSON.stringify({opponentId,status,jsError,skillCount,orbs,layoutProof,skillProof,fullscreenProof,audioProof}));
  if(jsError)throw Error('Encounter JavaScript error: '+jsError);
  if(!status.includes('Combat réel'))throw Error('Encounter not ready: '+status+'; rendered=' + dom.slice(0,1250));
  if(skillCount<1)throw Error('No real Capture combat skill rendered');
  if(!dom.includes('data-combat-hp-value="opponent-1"'))throw Error('Encounter enemy HUD absent');
  if(!dom.includes(opponentName))throw Error('Encounter does not show real selected creature '+opponentName);
  if(query.startsWith('&adventureSession=')){
    const hp=dom.match(/data-combat-hp-value="local-1"[^>]*>([^<]*)</)?.[1]??'';
    if(!hp.includes('/ '+universeFixture.expectedHp+' PV'))throw Error('PV du projet absents du HUD : '+hp);
  }
  if(layoutProof!=='OK')throw Error('Native Capture Editor landscape UI is wrong: '+layoutProof);
  if(hudProof!=='OK')throw Error('Saved universe HUD not projected in native encounter: '+hudProof);
  if(skillProof!=='OK')throw Error('Real Encounter ability cannot be used: '+skillProof);
  if(fullscreenProof!=='OK')throw Error('Encounter has no usable Android fullscreen control: '+fullscreenProof);
  if(audioProof!=='OK')throw Error('Unexpected audio activation button: '+audioProof);
  console.log('GREEN real Chromium Encounter boot, skill click and canonical HUD: '+opponentName);
  }
}finally{
  server.close();
}
