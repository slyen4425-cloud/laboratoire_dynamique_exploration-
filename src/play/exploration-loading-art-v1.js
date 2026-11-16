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
