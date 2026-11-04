// Verify that the EXACT checked-out SHA paints the real native Chromium 2.5D Canvas.
// The third-party raw.githack CDN can serve HTML while starving module loads;
// the official Pages workflow independently verifies live HTTPS after deployment.
import {spawn,spawnSync,execFileSync} from 'node:child_process';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {WORLD_ASSEMBLER_DRAFT_KEY} from '../src/builder/world-assembler-handoff.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import pngjs from 'pngjs';
const {PNG}=pngjs;
const sha=process.env.EXPLORATION_SHA;
if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Missing immutable source SHA');
const actualSha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(actualSha!==sha)throw Error('Chromium source SHA mismatch: '+actualSha+' != '+sha);
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript',
  '.css':'text/css','.json':'application/json','.svg':'image/svg+xml',
  '.png':'image/png','.webp':'image/webp','.ico':'image/x-icon'};
const server=createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const path=resolve(root,'.'+pathname);
    if(!path.startsWith(root+sep)){res.writeHead(403).end();return;}
    const bytes=await readFile(path);
    res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(bytes);
  }catch{res.writeHead(404).end('missing');}
});
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok);});
const url='http://127.0.0.1:'+server.address().port+'/sculpt-lab.html';
const chromeBin=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
 .find(x=>x&&spawnSync('which',[x]).status===0);
if(!chromeBin)throw Error('Native Chromium unavailable');
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const profile=await mkdtemp(join(tmpdir(),'sculpt-remote-pixels-'));
let chrome,socket,seq=0;const pending=new Map(),issues=[];
const send=(method,params={})=>new Promise((resolve,reject)=>{
 const id=++seq;const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},30000);
 pending.set(id,p=>{clearTimeout(timer);p.error?reject(Error(JSON.stringify(p.error))):resolve(p)});
 socket.send(JSON.stringify({id,method,params}));
});
const read=async expression=>{
 const p=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
 if(p.result?.exceptionDetails)throw Error('Runtime exception: '+JSON.stringify(p.result.exceptionDetails).slice(0,900));
 return p.result?.result?.value;
};
try{
 chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
   '--no-first-run','--disable-extensions','--remote-debugging-port=0',
   '--window-size=932,430','--user-data-dir='+profile,url],
   {stdio:['ignore','ignore','pipe']});
 const port=await new Promise((resolve,reject)=>{
   let log='';const timeout=setTimeout(()=>reject(Error('Chrome did not launch: '+log.slice(-500))),45000);
   chrome.stderr.on('data',bytes=>{log+=bytes.toString();const m=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(log);
      if(m){clearTimeout(timeout);resolve(+m[1]);}});
   chrome.once('error',reject);chrome.once('exit',code=>reject(Error('Chrome exited '+code)));
 });
 let page;
 for(let n=0;n<80;n++){
   const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
   page=tabs.find(t=>t.type==='page'&&t.url.includes('/sculpt-lab.html'));
   if(page)break;
   await sleep(180);
 }
 if(!page)throw Error('Native remote 2.5D page did not open');
 socket=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});
   socket.addEventListener('error',reject,{once:true});});
 socket.addEventListener('message',event=>{
   const p=JSON.parse(event.data),cb=pending.get(p.id);
   if(cb){pending.delete(p.id);cb(p);}
   if(p.method==='Runtime.exceptionThrown')issues.push('exception '+(p.params?.exceptionDetails?.exception?.description||p.params?.exceptionDetails?.text));
   if(p.method==='Log.entryAdded'&&p.params?.entry?.level==='error')issues.push('log '+p.params.entry.text);
   if(p.method==='Network.loadingFailed'&&!p.params?.canceled)issues.push('network '+p.params?.errorText);
 });
 await Promise.all([send('Runtime.enable'),send('Log.enable'),send('Network.enable')]);
 await send('Page.enable');
 await sleep(1200);
 const expression=[
 "(()=>{const c=document.querySelector('#sculpt-canvas');",
 "if(!c)return {exists:false};",
 "const w=c.width,h=c.height,initialized=typeof window.__sculptLabProbe==='function';",
 "if(w<80||h<80)return {exists:true,w,h,initialized};",
 "try{const ctx=c.getContext('2d',{willReadFrequently:true});",
 "const colors=new Set();let visible=0;",
 "for(let y=1;y<=11;y++)for(let x=1;x<=11;x++){",
 "const d=ctx.getImageData(Math.min(w-1,Math.floor(w*x/12)),",
 "Math.min(h-1,Math.floor(h*y/12)),1,1).data;",
 "colors.add(d[0]+','+d[1]+','+d[2]);if(d[0]+d[1]+d[2]>80)visible++;}",
 "return {exists:true,w,h,initialized,colors:colors.size,visible,href:location.href};",
 "}catch(e){return {exists:true,w,h,initialized,error:String(e)}}})()"
 ].join('');
 let pixels;
 for(let n=0;n<100;n++){
   pixels=await read(expression);
   if(pixels?.initialized&&pixels.w>300&&pixels.h>150&&(
     pixels.colors>=4&&pixels.visible>=8 || String(pixels.error||'').includes('SecurityError')))break;
   await sleep(500);
 }
 // The browser legitimately taints a canvas after drawing third-party imagery.
 // CDP screenshots capture the actual *displayed* compositor, without changing
 // CORS flags, touching the original textures, or fabricating render pixels.
 let screenshotProof=null;
 if(pixels?.initialized&&pixels.w>300&&pixels.h>150){
   const rect=await read("(()=>{const c=document.querySelector('#sculpt-canvas');c.scrollIntoView({block:'center',behavior:'instant'});const r=c.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()");
   await sleep(280);
   if(rect.x>=0&&rect.y>=0&&rect.width>300&&rect.height>150){
     const captured=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,
       clip:{x:rect.x,y:rect.y,width:rect.width,height:rect.height,scale:1}});
     const png=PNG.sync.read(Buffer.from(captured.result.data,'base64'));
     const colors=new Set();let lit=0;
     for(let y=1;y<=11;y++)for(let x=1;x<=11;x++){
       const px=Math.min(png.width-1,Math.floor(png.width*x/12));
       const py=Math.min(png.height-1,Math.floor(png.height*y/12));
       const i=(py*png.width+px)*4, r=png.data[i],g=png.data[i+1],b=png.data[i+2];
       colors.add(r+','+g+','+b);if(r+g+b>80)lit++;
     }
     screenshotProof={width:png.width,height:png.height,colors:colors.size,litSamples:lit};
   }
 }
 const fatal=issues.filter(x=>/framePending|ReferenceError|TypeError|Cannot access|Failed to fetch/i.test(x));
 const diagnostic=await read('(()=>({href:location.href,title:document.title,contentType:document.contentType,body:document.body?.innerText?.slice(0,800),head:document.documentElement?.outerHTML?.slice(0,700),readyState:document.readyState}))()');
 const worldEntry=await read(`(()=>{
   const link=document.querySelector('#world-assembler-shortcut-float');
   if(!link)return {exists:false};
   document.body.classList.add('sculpt-immersive');
   const standalone=getComputedStyle(link).display;
   document.body.classList.add('navigation-testing');
   const testing=getComputedStyle(link).display;
   document.body.classList.remove('navigation-testing');
   document.body.classList.add('world-area-editing');
   const worldArea=getComputedStyle(link).display;
   document.body.classList.remove('sculpt-immersive','world-area-editing');
   return {exists:true,href:link.getAttribute('href'),standalone,testing,worldArea};
 })()`);
 if(!(pixels?.initialized&&pixels.w>300&&pixels.h>150&&
   screenshotProof?.colors>=4&&screenshotProof.litSamples>=8)||fatal.length||
   !worldEntry?.exists||worldEntry.href!=='./world-assembler.html'||
   worldEntry.standalone==='none'||worldEntry.testing!=='none'||
   worldEntry.worldArea!=='none')
   throw Error('Native HTTPS 2.5D screenshot has no drawn terrain: '+
     JSON.stringify({sha,pixels,screenshotProof,worldEntry,document:diagnostic,errors:issues.slice(-18)}));
 // Also prove that Jouer really boots the SAME 2.5D Canvas and native
 // navigation owner, with no Builder controls and a resumable checkpoint.
 const gameWorld=serializeWorldBuilderDraft(
   createBlankWorldBuilderDraft({id:'ci-native-play',width:36*28,height:24*21})
 );
 await read(`localStorage.setItem(${JSON.stringify(WORLD_ASSEMBLER_DRAFT_KEY)},${JSON.stringify(gameWorld)});`);
 await send('Page.navigate',{url:new URL('./play.html',url).href});
 let menu;
 for(let i=0;i<70;i++){
   menu=await read("(()=>({newGame:!document.querySelector('#play-new')?.disabled,continueDisabled:document.querySelector('#play-continue')?.disabled,href:location.pathname}))()");
   if(menu?.newGame&&menu.continueDisabled===true)break;
   await sleep(250);
 }
 if(!menu?.newGame||menu.continueDisabled!==true)
   throw Error('Native Jouer game menu did not load the canonical WorldDocument: '+JSON.stringify(menu));
 await read("document.querySelector('#play-new').click()");
 let play;
 for(let i=0;i<100;i++){
   play=await read("(()=>({play:window.__sculptPlayProbe?.(),nav:window.__sculptNavProbe?.(),canvas:(()=>{const c=document.querySelector('#sculpt-canvas');return c?[c.width,c.height]:null})(),path:location.pathname,error:document.querySelector('#play-start-error-message')?.textContent}))()");
   if(play?.play?.active&&play?.play?.playing&&play.play.editorHidden&&play.canvas?.[0]>300)break;
   await sleep(250);
 }
 if(!(play?.play?.active&&play.play.playing&&play.play.editorHidden&&
      play.play.menuVisible&&play.canvas?.[0]>300&&play.nav?.activeFrames))
   throw Error('Native Jouer did not load authored 2.5D map and gameplay input: '+JSON.stringify(play));
 const startX=play.nav.player.x;
 await send('Input.dispatchKeyEvent',{type:'keyDown',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
 await sleep(280);
 await send('Input.dispatchKeyEvent',{type:'keyUp',key:'d',code:'KeyD',windowsVirtualKeyCode:68});
 const moved=await read("window.__sculptNavProbe().player.x");
 if(!(Math.abs(moved-startX)>2))
   throw Error('Native Jouer hero does not move through authoritative collision engine: '+JSON.stringify({startX,moved}));
 await read("document.querySelector('#play-menu-button').click()");
 let afterMenu;
 for(let i=0;i<50;i++){
   afterMenu=await read("(()=>({url:location.pathname,continueEnabled:!document.querySelector('#play-continue')?.disabled,checkpoint:localStorage.getItem('gensrpg.exploration.play.navigation.v1')}))()");
   if(afterMenu?.url.endsWith('/play.html')&&afterMenu.continueEnabled)break;
   await sleep(250);
 }
 if(!afterMenu?.continueEnabled)throw Error('Jouer menu did not save navigation checkpoint: '+JSON.stringify(afterMenu));
 const checkpoint=JSON.parse(afterMenu.checkpoint);
 if(Math.abs(checkpoint.x-moved)>2||checkpoint.currentAreaId!=='area-principale')
   throw Error('Jouer checkpoint does not match real hero and WorldArea: '+JSON.stringify(checkpoint));
 await read("document.querySelector('#play-continue').click()");
 let resumed;
 for(let i=0;i<70;i++){
   resumed=await read("(()=>({play:window.__sculptPlayProbe?.(),nav:window.__sculptNavProbe?.()}))()");
   if(resumed?.play?.active&&resumed.nav?.player)break;
   await sleep(250);
 }
 if(!resumed?.play?.active||Math.abs(resumed.nav.player.x-checkpoint.x)>1)
   throw Error('Jouer continue did not resume saved world position: '+JSON.stringify({checkpoint,resumed}));
 // GenSRPG's consumer owns New Game: create the scoped navigation only via
 // the public Exploration API, never by clicking Lab New Game.
 const legacyCheckpoint=await read("localStorage.getItem('gensrpg.exploration.play.navigation.v1')");
 const createdScoped=await read("(async()=>{const [{createNewExplorationPlay},{readWorldAssemblerDraft}]=await Promise.all([import('/src/play/exploration-play-session.js'),import('/src/builder/world-assembler-handoff.js')]);const world=readWorldAssemblerDraft(localStorage);return createNewExplorationPlay(localStorage,world,{sessionId:'ci-adventure-a'}).sessionId;})()");
 if(createdScoped!=='ci-adventure-a')throw Error('Official Exploration scoped creation failed');
 await send('Page.navigate',{url:new URL('./play.html?adventureSession=ci-adventure-a',url).href});
 let scopedMenu;
 for(let i=0;i<55;i++){
   scopedMenu=await read("(()=>({newDisabled:document.querySelector('#play-new')?.disabled,newHidden:document.querySelector('#play-new')?.hidden,newRendered:(()=>{const b=document.querySelector('#play-new');return !!b?.getClientRects().length&&getComputedStyle(b).display!=='none'})(),continueEnabled:!document.querySelector('#play-continue')?.disabled,session:new URL(location.href).searchParams.get('adventureSession')}))()");
   if(scopedMenu?.newDisabled&&scopedMenu.newHidden&&scopedMenu.continueEnabled)break;
   await sleep(250);
 }
 if(!scopedMenu?.newDisabled||!scopedMenu.newHidden||scopedMenu.newRendered||!scopedMenu.continueEnabled||scopedMenu.session!=='ci-adventure-a')
   throw Error('Native GenSRPG scoped menu allowed a duplicate new game: '+JSON.stringify(scopedMenu));
 await read("document.querySelector('#play-continue').click()");
 let scopedPlay;
 for(let i=0;i<90;i++){
   scopedPlay=await read("(()=>({play:window.__sculptPlayProbe?.(),session:new URL(location.href).searchParams.get('adventureSession'),publishedCount:window.__sculptEncounterProbe?.().playPublishedCount}))()");
   if(scopedPlay?.play?.active&&scopedPlay.play.playing)break;
   await sleep(250);
 }
 if(!scopedPlay?.play?.active||scopedPlay.session!=='ci-adventure-a'||scopedPlay.publishedCount!==0)
   throw Error('GenSRPG-scoped game did not open the real native Canvas: '+JSON.stringify(scopedPlay));
 await read("document.querySelector('#play-menu-button').click()");
 let scopedAfter;
 for(let i=0;i<50;i++){
   scopedAfter=await read("(()=>({menu:location.pathname.endsWith('/play.html'),session:new URL(location.href).searchParams.get('adventureSession'),continueEnabled:!document.querySelector('#play-continue')?.disabled,checkpoint:localStorage.getItem('gensrpg.exploration.play.navigation.v1:ci-adventure-a')}))()");
   if(scopedAfter?.menu&&scopedAfter.continueEnabled)break;
   await sleep(250);
 }
 if(!scopedAfter?.continueEnabled||scopedAfter.session!=='ci-adventure-a'||
    JSON.parse(scopedAfter.checkpoint||'null')?.sessionId!=='ci-adventure-a')
   throw Error('Scoped native Jouer lost its session on Menu/Save: '+JSON.stringify(scopedAfter));
 if(await read("localStorage.getItem('gensrpg.exploration.play.navigation.v1')")!==legacyCheckpoint)
   throw Error('GenSRPG-scoped session overwrote the standalone native Jouer save');
 await send('Page.navigate',{url:new URL('./play.html?adventureSession=ci-adventure-b',url).href});
 let secondMenu;
 for(let i=0;i<55;i++){
   secondMenu=await read("(()=>({newDisabled:document.querySelector('#play-new')?.disabled,continueDisabled:document.querySelector('#play-continue')?.disabled}))()");
   if(secondMenu?.newDisabled&&secondMenu.continueDisabled)break;
   await sleep(250);
 }
 if(!secondMenu?.newDisabled||!secondMenu.continueDisabled)
   throw Error('Second GenSRPG AdventureSession inherited the first checkpoint: '+JSON.stringify(secondMenu));
 await send('Page.navigate',{url:new URL('./play.html?adventureSession=ci-adventure-a',url).href});
 let resumedMenu;
 for(let i=0;i<55;i++){
   resumedMenu=await read("(()=>({continueEnabled:!document.querySelector('#play-continue')?.disabled}))()");
   if(resumedMenu?.continueEnabled)break;
   await sleep(250);
 }
 if(!resumedMenu?.continueEnabled)throw Error('First scoped session cannot resume');
 await read("document.querySelector('#play-continue').click()");
 let resumedScoped;
 for(let i=0;i<75;i++){
   resumedScoped=await read("(()=>({play:window.__sculptPlayProbe?.(),session:new URL(location.href).searchParams.get('adventureSession')}))()");
   if(resumedScoped?.play?.active)break;
   await sleep(250);
 }
 if(!resumedScoped?.play?.active||resumedScoped.session!=='ci-adventure-a')
   throw Error('Real Sculpt engine did not resume the correct GenSRPG session: '+JSON.stringify(resumedScoped));
 console.log('GREEN scoped GenSRPG AdventureSession: native Canvas, isolated checkpoints, menu and resume');
 const savedDocument=await read(`localStorage.getItem(${JSON.stringify(WORLD_ASSEMBLER_DRAFT_KEY)})`);
 if(savedDocument!==gameWorld)throw Error('Gameplay changed World Builder canonical document unexpectedly');
 console.log('GREEN native Jouer/Continuer: same 2.5D rendered map, collision, checkpoint, no editor');
 console.log('GREEN native 2.5D immutable checked-out source compositor and World Builder entry '+
   JSON.stringify({sha,...pixels,screenshotProof,errorCount:issues.length}));
}finally{
 try{socket?.close()}catch{}
 if(chrome){
  const exited=new Promise(ok=>{
    if(chrome.exitCode!==null||chrome.signalCode!==null)ok();else chrome.once('exit',ok);
  });
  try{chrome.kill('SIGTERM')}catch{}
  if(!await Promise.race([exited.then(()=>true),sleep(3500).then(()=>false)])){
    try{chrome.kill('SIGKILL')}catch{}
    await exited;
  }
 }
 await rm(profile,{recursive:true,force:true,maxRetries:10,retryDelay:200});
 await new Promise(ok=>server.close(ok));
}
