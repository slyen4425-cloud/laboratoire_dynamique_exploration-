import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawn,spawnSync} from 'node:child_process';

// Independent real-browser acceptance for the original 36x24 map plus
// an eight-cell decorative ring, not a second exploration engine.
const root=process.cwd();
const mime={'.html':'text/html','.js':'text/javascript','.json':'application/json',
  '.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png'};
const server=createServer(async(req,res)=>{
  try{
    const file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
    if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
    const bytes=await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
  }catch{res.writeHead(404).end('missing');}
});
const chromeBin=[process.env.CHROME_PATH,'google-chrome','chromium','chromium-browser']
  .find(x=>x&&spawnSync('which',[x]).status===0);
if(!chromeBin)throw Error('Chromium required');
await new Promise((ok,fail)=>{server.once('error',fail);server.listen(0,'127.0.0.1',ok)});
const url='http://127.0.0.1:'+server.address().port;
const profile=await mkdtemp(resolve(tmpdir(),'sculpt-fringe-smoke-'));
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
let chrome,socket,sequence=0;
const pending=new Map();
try{
  chrome=spawn(chromeBin,['--headless=new','--no-sandbox','--disable-gpu',
    '--disable-dev-shm-usage','--no-first-run','--disable-extensions',
    '--remote-debugging-port=0','--window-size=1400,900',
    '--user-data-dir='+profile,url+'/sculpt-lab.html'],{stdio:['ignore','ignore','pipe']});
  const port=await new Promise((ok,fail)=>{
    let log='';const timer=setTimeout(()=>fail(Error('Chrome startup: '+log.slice(-250))),45000);
    chrome.stderr.on('data',chunk=>{
      log+=chunk.toString();
      const found=/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(log);
      if(found){clearTimeout(timer);ok(Number(found[1]));}
    });
    chrome.once('error',fail);
    chrome.once('exit',code=>fail(Error('Chrome exit '+code)));
  });
  let target=null;
  for(let i=0;i<50;i++){
    const tabs=await(await fetch('http://127.0.0.1:'+port+'/json')).json();
    target=tabs.find(t=>t.type==='page'&&t.url.includes('sculpt-lab.html'));
    if(target)break;
    await sleep(130);
  }
  if(!target)throw Error('No browser tab');
  socket=new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{
    socket.addEventListener('open',ok,{once:true});
    socket.addEventListener('error',fail,{once:true});
  });
  socket.addEventListener('message',e=>{
    const data=JSON.parse(e.data),complete=pending.get(data.id);
    if(complete){pending.delete(data.id);complete(data);}
  });
  const command=(method,params={})=>new Promise((ok,fail)=>{
    const id=++sequence;
    const timer=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout '+method));},45000);
    pending.set(id,r=>{
      clearTimeout(timer);
      if(r.error)fail(Error(JSON.stringify(r.error)));else ok(r);
    });
    socket.send(JSON.stringify({id,method,params}));
  });
  const run=async expression=>{
    const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
    if(r.result?.exceptionDetails)throw Error('Browser JS: '+JSON.stringify(r.result.exceptionDetails).slice(0,850));
    return r.result?.result?.value;
  };
  const until=async (expression,label)=>{
    for(let i=0;i<120;i++){
      let result=null;try{result=await run(expression)}catch{}
      if(result)return result;
      await sleep(150);
    }
    throw Error('Browser not ready: '+label);
  };
  await command('Runtime.enable');
  await command('Page.enable');
  await until("typeof window.__sculptLabProbe==='function' && document.querySelector('#sculpt-canvas')?.width>0",'Sculpt lab');
  const areaId=await run("(async()=>{ const [{createBlankWorldBuilderDraft},{saveWorldAssemblerDraft}]=await Promise.all([import('./src/builder/world-builder-draft.js'),import('./src/builder/world-assembler-handoff.js')]); const world=createBlankWorldBuilderDraft({id:'border-check',width:1008,height:504});saveWorldAssemblerDraft(localStorage,world);return world.initialAreaId;})()");
  if(!areaId)throw Error('Cannot create map');
  await command('Page.navigate',{url:url+'/sculpt-lab.html?worldAssembler=1&areaId='+encodeURIComponent(areaId)});
  const mounted=await until("window.__sculptFringeProbe?.().available && window.__sculptFringeProbe()", 'mounted WorldArea');
  if(mounted.initialWidth!==36||mounted.initialHeight!==24||mounted.active)
    throw Error('Wrong core before editing '+JSON.stringify(mounted));
  const edited=await run("(()=>{const toggle=document.querySelector('#scenery-fringe-toggle');const panel=document.querySelector('#scenery-fringe-panel');if(!toggle||panel.hidden)return {error:'Control missing'};toggle.click();return window.__sculptFringeProbe();})()");
  if(edited.error||edited.editing!==true||edited.chunks<8)
    throw Error('Border editor inaccessible '+JSON.stringify(edited));
  await run("document.querySelector('[data-mode=raise]').click();document.querySelector('#radius').value='0.5';document.querySelector('#sculpt-canvas').scrollIntoView({block:'center'});true");
  await sleep(150);
  const before=await run("(()=>{const p=window.__sculptFringeProbe(),r=document.querySelector('#sculpt-canvas').getBoundingClientRect();const x=-14,y=8*21+10-2*18;return {p,x:r.left+p.pan.x+x*p.zoom,y:r.top+p.pan.y+(y*.70-x*.10)*p.zoom,w:innerWidth,h:innerHeight,hit:document.elementFromPoint(r.left+p.pan.x+x*p.zoom,r.top+p.pan.y+(y*.70-x*.10)*p.zoom)?.id};})()");
  if(before.x<=0||before.y<=0||before.x>=before.w||before.y>=before.h||before.hit!=='sculpt-canvas')
    throw Error('Cannot point to editor-only relief: '+JSON.stringify(before));
  const props={x:before.x,y:before.y,button:'left',clickCount:1};
  for(const type of ['mouseMoved','mousePressed','mouseReleased'])
    await command('Input.dispatchMouseEvent',{type,...props});
  await sleep(180);
  const after=await run("window.__sculptFringeProbe()");
  if(after.levelSum<=before.p.levelSum||after.initialWidth!==36||after.initialHeight!==24)
    throw Error('Real fringe touch did not sculpt '+JSON.stringify({before,after}));
  const original=await run("(()=>{document.querySelector('#scenery-fringe-toggle').click();return {fringe:window.__sculptFringeProbe(),terrain:window.__sculptLabProbe()};})()");
  if(original.fringe.editing||original.terrain.width!==36||original.terrain.height!==24)
    throw Error('Core changed after border editing');
  console.log('GREEN Chromium decorative edge: 4 sides, touch sculpt, original 36x24 gameplay footprint');
}finally{
  try{socket?.close()}catch{}
  try{chrome?.kill('SIGKILL')}catch{}
  await rm(profile,{recursive:true,force:true});
  await new Promise(ok=>server.close(ok));
}
