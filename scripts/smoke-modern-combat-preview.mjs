// Chromium checks the actual, packaged Encounter DOM and module/data graph,
// not a mocked Combat UI or invented win/loss. Run only against a pinned artifact.
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { once } from 'node:events';

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

const server = createServer(async(req,res)=>{
  try {
    const requestUrl=new URL(req.url,'http://localhost');
    const pathname=decodeURIComponent(requestUrl.pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    let content=await readFile(path);
    if(pathname===route){
      const origin='http://127.0.0.1:'+server.address().port;
      const opponentId=requestUrl.searchParams.get('opponent') || snapshot.opponents[0].creatureId;
      const encounterSnapshot={...snapshot,opponents:[{creatureId:opponentId}]};
      const envelope={version:1,snapshot:encounterSnapshot,
        returnState:{areaId:'forest-exterior',x:62,y:18,
          returnUrl:origin+'/index.html?combatReturn=1'},result:null};
      const probe='<script>'+
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
            const audioButton = document.querySelector('[data-encounter-audio]');
            if (audioButton && !document.documentElement.dataset.encounterAudioProof &&
                getComputedStyle(audioButton).display !== 'none') {
              document.documentElement.dataset.encounterAudioProof =
                audioButton.textContent.includes('Activer le son')
                  ? 'OK' : 'audio-button-label-invalid';
            }
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
            if (++attempts >= 75) {
              document.documentElement.dataset.encounterSkillProof =
                'no-native-skill-ready:buttons=' + skills.length;
              clearInterval(timer);
            }
          }, 150);
        }, {once: true});
      </script>`;
      const layoutProbe = `<script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            const stage = document.querySelector('[data-capture-preview-shell]');
            const arena = document.querySelector('[data-combat-arena]');
            const banner = document.querySelector('[data-bridge-status]');
            const local = document.querySelector('.squad-card--local-full');
            const controls = document.querySelector('.coop-command-stack');
            if (!stage || !arena || !banner || !local || !controls) {
              document.documentElement.dataset.nativeLayoutProof = 'missing-canonical-view';
              return;
            }
            const r = arena.getBoundingClientRect();
            const h = local.getBoundingClientRect();
            const c = controls.getBoundingClientRect();
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
          }, 3500);
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

async function dumpDom(url) {
  const command=spawn(browserBinary(),[
    '--headless=new','--no-sandbox','--disable-gpu',
    '--window-size=1600,900',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--virtual-time-budget=6500','--dump-dom',url
  ],{stdio:['ignore','pipe','pipe']});
  const chunks=[],errors=[];
  command.stdout.on('data',chunk=>chunks.push(chunk));
  command.stderr.on('data',chunk=>errors.push(chunk));
  const timeout=setTimeout(()=>command.kill('SIGKILL'),75000);
  try {
    const [code]=await once(command,'close');
    if(code!==0)throw Error('Chromium exit='+code+' '+Buffer.concat(errors).toString().slice(-1000));
    return Buffer.concat(chunks).toString();
  } finally {
    clearTimeout(timeout);
  }
}

try {
  const baseUrl='http://127.0.0.1:'+server.address().port+route;
  // Keep the original encounter sentinel and add the creator's second-battle
  // case: Noctigriffe has no authored model and must remain playable by fallback.
  for (const [opponentId,opponentName] of [['crea_nat_1','Grainou'],['crea_ombre_2','Noctigriffe']]) {
  const url=baseUrl+'?opponent='+opponentId;
  const dom=await dumpDom(url);
  const status=dom.match(/<p[^>]*data-bridge-status[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g,'').trim()??'missing';
  const jsError=dom.match(/data-encounter-bootstrap-error="([^"]+)"/)?.[1]??'';
  const layoutProof=dom.match(/data-native-layout-proof="([^"]+)"/)?.[1]??'missing';
  const skillProof=dom.match(/data-encounter-skill-proof="([^"]+)"/)?.[1]??'missing';
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
  if(layoutProof!=='OK')throw Error('Native Capture Editor landscape UI is wrong: '+layoutProof);
  if(skillProof!=='OK')throw Error('Real Encounter ability cannot be used: '+skillProof);
  if(fullscreenProof!=='OK')throw Error('Encounter has no usable Android fullscreen control: '+fullscreenProof);
  if(audioProof!=='OK')throw Error('Encounter has no Android audio activation control: '+audioProof);
  console.log('GREEN real Chromium Encounter boot, skill click and canonical HUD: '+opponentName);
  }
}finally{
  server.close();
}
