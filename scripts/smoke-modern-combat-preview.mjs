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
  opponents:[{creatureId:'crea_nat_3'}],
  rules:{rulesetId:'capture.standard.1v1'},
  context:{areaId:'forest-exterior',terrainFamilyId:'forest',elementId:'nature'},
  returnToken:'return-smoke-1'
};

const server = createServer(async(req,res)=>{
  try {
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    let content=await readFile(path);
    if(pathname===route){
      const origin='http://127.0.0.1:'+server.address().port;
      const envelope={version:1,snapshot,
        returnState:{areaId:'forest-exterior',x:62,y:18,
          returnUrl:origin+'/index.html?combatReturn=1'},result:null};
      const probe='<script>'+
        'sessionStorage.setItem("gensrpg.capture.combat-handoff.v1",'+
        JSON.stringify(JSON.stringify(envelope))+');'+
        'window.addEventListener("error",e=>document.documentElement.dataset.encounterBootstrapError=e.message);'+
        'window.addEventListener("unhandledrejection",e=>document.documentElement.dataset.encounterBootstrapError=String(e.reason?.message||e.reason));'+
        "document.documentElement.dataset.encounterProbeLoaded=\"1\";(()=>{const sample=()=>{const status=document.querySelector(\"[data-bridge-status]\");document.documentElement.dataset.encounterProbeState=status?.dataset.state??\"none\";if(status?.dataset.state!==\"ready\")return;const shell=document.querySelector(\".capture-preview-shell[data-landscape-required=true]\");const game=shell?.querySelector(\".capture-preview-host > .game\");const arena=game?.querySelector(\"[data-combat-arena]\");const controls=arena?.querySelector(\".coop-controls\");const local=arena?.querySelector(\".squad-card--local-full\");const enemy=arena?.querySelector(\".squad-card--opponent\");const bench=arena?.querySelector(\".combat-test-enemy-reserves\");document.documentElement.dataset.encounterProbeNodes=[!!shell,!!game,!!arena,!!controls,!!local,!!enemy,!!bench].join(\",\");if(!shell||!game||!arena||!controls||!local||!enemy||!bench)return;const g=game.getBoundingClientRect(),a=arena.getBoundingClientRect(),h=controls.getBoundingClientRect(),u=local.getBoundingClientRect(),e=enemy.getBoundingClientRect();document.documentElement.dataset.encounterLayout=encodeURIComponent(JSON.stringify({ratio:g.width/g.height,arenaWidth:a.width,controlsWidth:h.width,controlsRight:h.right,arenaRight:a.right,controlsBottom:h.bottom,arenaBottom:a.bottom,localWidth:u.width,enemyWidth:e.width,benchDirectChild:bench.parentElement===arena,bannerHidden:getComputedStyle(status).display===\"none\",sharedCss:[...document.styleSheets].some(s=>s.href?.includes(\"capture-editor-v2.css\"))}));};setInterval(sample,125);sample();})();"+
        '</script>';
      content=Buffer.from(content.toString('utf8').replace('</head>',probe+'</head>'));
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
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--window-size=1536,684',
    '--virtual-time-budget=30000','--dump-dom',url
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
  const url='http://127.0.0.1:'+server.address().port+route;
  const dom=await dumpDom(url);
  const status=dom.match(/<p[^>]*data-bridge-status[^>]*>([\s\S]*?)<\/p>/i)?.[1]?.replace(/<[^>]*>/g,'').trim()??'missing';
  const jsError=dom.match(/data-encounter-bootstrap-error="([^"]+)"/)?.[1]??'';
  const skillCount=[...dom.matchAll(/data-combat-skill="/g)].length;
  const orbs=[...dom.matchAll(/class="energy-orb\b/g)].length;
  const encodedLayout=dom.match(/data-encounter-layout="([^"]+)"/)?.[1] ?? '';
  const layout=encodedLayout ? JSON.parse(decodeURIComponent(encodedLayout)) : null;
  const documentTag=dom.match(/<html[^>]*>/i)?.[0]?.slice(0,900)??'';
  console.log(JSON.stringify({status,jsError,skillCount,orbs,layout,documentTag}));
  if(jsError)throw Error('Encounter JavaScript error: '+jsError);
  if(!status.includes('Combat réel'))throw Error('Encounter not ready: '+status);
  if(skillCount<1)throw Error('No real Capture combat skill rendered');
  if(!dom.includes('data-combat-hp-value="enemy-1"'))throw Error('Encounter enemy HUD absent');
  if(!layout)throw Error('Landscape HUD geometry missing from real Chromium');
  if(Math.abs(layout.ratio-16/9)>0.065)throw Error('Not 16:9 game canvas: '+layout.ratio);
  if(layout.controlsWidth/layout.arenaWidth>0.40)throw Error('Oversized HUD controls');
  if(layout.localWidth/layout.arenaWidth>0.34)throw Error('Oversized player HP card');
  if(layout.enemyWidth/layout.arenaWidth>0.34)throw Error('Oversized opponent HP card');
  if(layout.controlsRight>layout.arenaRight+2||layout.controlsBottom>layout.arenaBottom+2)throw Error('Combat controls overflow arena');
  if(!layout.benchDirectChild)throw Error('Enemy reserves are inside the command dock');
  if(!layout.bannerHidden)throw Error('Ready diagnostic banner covers the combat');
  if(!layout.sharedCss)throw Error('Canonical Capture editor HUD CSS not loaded');
  console.log('GREEN real Chromium Encounter with same Capture landscape layout at 1536x684');
}finally{
  server.close();
}
