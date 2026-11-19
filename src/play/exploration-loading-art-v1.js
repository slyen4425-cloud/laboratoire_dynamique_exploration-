// Presentation-only Capture art query contract. The owning Capture editor
// stores image Blobs; Exploration only projects same-origin URLs while loading.
export function readCaptureLoadingArtSceneV1({href,scene,origin}={}){
 if(typeof href!=='string'||!['zone','combat'].includes(scene))
  throw new TypeError('Capture loading art scene invalid');
 const url=new URL(href);
 const expectedOrigin=origin??url.origin;
 const raw=url.searchParams.get('loadingArt'+(scene==='zone'?'Zone':'Combat'));
 if(!raw)return Object.freeze([]);
 let values;
 try{values=JSON.parse(raw);}catch{return Object.freeze([]);}
 if(!Array.isArray(values)||values.length>12)return Object.freeze([]);
 const images=values.filter(value=>{
  if(typeof value!=='string'||value.length>512)return false;
  try{
   const parsed=new URL(value);
   return parsed.protocol==='blob:'&&parsed.origin===expectedOrigin;
  }catch{return false;}
 });
 return Object.freeze(images);
}
export function createCaptureLoadingArtCycleV1(images=[]){
 if(!Array.isArray(images))throw new TypeError('Loading images required');
 let next=0;
 return Object.freeze({
  next(){
   if(!images.length)return null;
   return images[next++%images.length];
  }
 });
}


// ONE presentation-only transition used by the existing native loading owners
// (Portal, Combat and Capture's Shell). It never controls readiness, gameplay
// or the asset library. Each owner calls dispose() on its actual READY/close.
export function mountCaptureLoadingArtCrossfadeV1({
 host,images,documentRef=globalThis.document,windowRef=globalThis,
 intervalMs=10000,fadeMs=700
}={}){
 if(!host||typeof host.prepend!=='function'||!documentRef?.createElement)
  throw new TypeError('Loading crossfade needs its existing DOM host');
 if(!Array.isArray(images)||!Number.isSafeInteger(intervalMs)||intervalMs<1000||
    !Number.isSafeInteger(fadeMs)||fadeMs<0||fadeMs>=intervalMs)
  throw new TypeError('Loading crossfade configuration invalid');
 const urls=[...new Set(images.filter(x=>typeof x==='string'&&x.length>0))].slice(0,12);
 if(!urls.length)return Object.freeze({dispose(){},get active(){return false;}});
 const oldBackground=host.style.backgroundImage;
 const oldIsolation=host.style.isolation;
 const children=[...host.children].map(node=>({
  node,position:node.style.position,zIndex:node.style.zIndex
 }));
 // The existing overlay's own text, spinner and cancel button remain above
 // this decorative layer, with their input and accessibility untouched.
 children.forEach(({node})=>{
  if(!node.style.position)node.style.position='relative';
  node.style.zIndex='1';
 });
 host.style.backgroundImage='none';
 host.style.isolation='isolate';
 const surface=documentRef.createElement('div');
 surface.dataset.captureLoadingCrossfade='true';
 surface.setAttribute('aria-hidden','true');
 Object.assign(surface.style,{
  position:'absolute',inset:'0',zIndex:'0',overflow:'hidden',
  pointerEvents:'none',backgroundColor:'transparent'
 });
 const reduce=windowRef.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true;
 const layers=[0,1].map((_,i)=>{
  const layer=documentRef.createElement('div');
  layer.dataset.captureLoadingLayer=String(i);
  Object.assign(layer.style,{
   position:'absolute',inset:'0',backgroundPosition:'center',
   backgroundRepeat:'no-repeat',backgroundSize:'contain',
   opacity:i===0?'1':'0',transition:reduce?'none':'opacity '+fadeMs+'ms ease',
   pointerEvents:'none'
  });
  surface.append(layer);
  return layer;
 });
 host.prepend(surface);
 let current=0,front=0,stopped=false,timer=null;
 const art=url=>'url('+JSON.stringify(url)+')';
 layers[0].style.backgroundImage=art(urls[0]);
 function schedule(){
  if(!stopped&&urls.length>1)
   timer=windowRef.setTimeout?.(()=>{void advance();},intervalMs)??null;
 }
 async function advance(){
  if(stopped||urls.length<2)return;
  const next=(current+1)%urls.length;
  const url=urls[next];
  // Decode ahead of the transition: failed or delayed assets must not create
  // flashes, and must never hold the actual native loading completion.
  try{
   if(typeof windowRef.Image==='function'){
    const image=new windowRef.Image();
    image.src=url;
    if(typeof image.decode==='function')await image.decode();
    else await new Promise((resolve,reject)=>{
     image.onload=resolve;image.onerror=reject;
     if(image.complete&&image.naturalWidth>0)resolve();
    });
   }
  }catch{schedule();return;}
  if(stopped)return;
  const back=1-front;
  layers[back].style.backgroundImage=art(url);
  layers[back].style.opacity='1';
  layers[front].style.opacity='0';
  front=back;current=next;
  schedule();
 }
 schedule();
 return Object.freeze({
  get active(){return !stopped;},
  dispose(){
   if(stopped)return;
   stopped=true;
   if(timer!==null)windowRef.clearTimeout?.(timer);
   surface.remove();
   host.style.backgroundImage=oldBackground;
   host.style.isolation=oldIsolation;
   for(const {node,position,zIndex} of children){
    node.style.position=position;node.style.zIndex=zIndex;
   }
  }
 });
}
