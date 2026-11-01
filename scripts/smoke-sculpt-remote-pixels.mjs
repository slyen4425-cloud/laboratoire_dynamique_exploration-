// Verify original 2.5D sculpt renderer on immutable public HTTPS, not a fake canvas.
import {spawn,spawnSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const sha=process.env.EXPLORATION_SHA;
if(!/^[a-f0-9]{40}$/.test(sha||''))throw Error('Missing immutable source SHA');
const url='https://raw.githack.com/slyen4425-cloud/laboratoire_dynamique_exploration-/'+sha+'/sculpt-lab.html';
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
 for(let n=0;n<110;n++){
   pixels=await read(expression);
   if(pixels?.initialized&&pixels.w>300&&pixels.h>150&&pixels.colors>=4&&pixels.visible>=8)break;
   await sleep(500);
 }
 const fatal=issues.filter(x=>/framePending|ReferenceError|TypeError|Cannot access|Failed to fetch/i.test(x));
 const diagnostic=await read('(()=>({href:location.href,title:document.title,contentType:document.contentType,body:document.body?.innerText?.slice(0,800),head:document.documentElement?.outerHTML?.slice(0,700),readyState:document.readyState}))()');
 if(!(pixels?.initialized&&pixels.w>300&&pixels.h>150&&pixels.colors>=4&&pixels.visible>=8)||fatal.length)
   throw Error('Native HTTPS 2.5D source or renderer not usable: '+JSON.stringify({sha,pixels,document:diagnostic,errors:issues.slice(-18)}));
 console.log('GREEN real 2.5D HTTPS pixels '+JSON.stringify({sha,...pixels,errorCount:issues.length}));
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
}
