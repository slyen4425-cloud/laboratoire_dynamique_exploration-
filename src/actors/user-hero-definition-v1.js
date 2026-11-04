// Exploration owns the HERO's authored visual definition, never gameplay.
// File bytes belong in its own IndexedDB store, not a WorldDocument or
// GenSRPG AdventureSession. The existing MapActorVisual and renderer own
// all scaling, mirror, motion and frame selection.
import {normalizeMapActorVisual} from './map-actor-visual-model.js';

export const USER_HERO_SCHEMA_V1='gensrpg-exploration-user-hero-v1';
export const USER_HERO_MAX_IMAGE_BYTES=8*1024*1024;
const ID=/^hero\.user\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const TYPES=new Set(['image/png','image/webp']);

function media(input,label){
 if(!input||typeof input!=='object'||!(input.blob instanceof Blob))
  throw new TypeError(label+' needs a real image file Blob');
 if(!TYPES.has(input.mimeType)||input.blob.type!==input.mimeType)
  throw new RangeError(label+' must be PNG or WebP');
 if(input.blob.size<1||input.blob.size>USER_HERO_MAX_IMAGE_BYTES)
  throw new RangeError(label+' file size invalid');
 if(!Number.isInteger(input.width)||!Number.isInteger(input.height)||
  input.width<16||input.height<16||input.width>4096||input.height>4096)
  throw new RangeError(label+' image dimension must be 16..4096');
 return Object.freeze({blob:input.blob,width:input.width,height:input.height,
  mimeType:input.mimeType});
}
function safeId(id){
 if(typeof id!=='string'||!ID.test(id))throw new RangeError('Hero definition must use an automatically minted UUID id');
 return id;
}
function validateSize(image,base,label){
 if(image.width!==base.width||image.height!==base.height)
  throw new RangeError(label+' sprite canvas dimensions must match the base hero image (prevent jitter)');
 return image;
}
function frames(input,base,label,required=false){
 if(input===undefined)input=[];
 if(!Array.isArray(input)||input.length>32||(required&&!input.length))
  throw new RangeError(label+' must contain '+(required?'1–':'0–')+'32 PNG/WebP frames');
 return input.map((frame,index)=>validateSize(media(frame,label+'['+index+']'),base,label+'['+index+']'));
}

export function createUserHeroDefinitionV1({
 id,name,base,mode='image',walk,idle,framesPerSecond=8,
 targetHeight=37,sourceFacingX=1,motion,now
}={}){
 const prefix=safeId(id);
 if(typeof name!=='string'||!name.trim()||name.trim().length>80)
  throw new TypeError('Hero display name must contain 1..80 characters');
 if(typeof now!=='string'||!Number.isFinite(Date.parse(now)))
  throw new TypeError('Hero createdAt must be ISO date');
 if(mode!=='image'&&mode!=='frames')throw new RangeError('Hero animation mode must be image or frames');
 const image=media(base,'base hero');
 const walks=mode==='frames'?frames(walk,image,'walk',true):[];
 const idles=mode==='frames'?frames(idle,image,'idle'):[];

 const assets=[{id:prefix+'.base',...image},
  ...idles.map((frame,i)=>({id:prefix+'.idle.'+i,...frame})),
  ...walks.map((frame,i)=>({id:prefix+'.walk.'+i,...frame}))];
 const animation=mode==='frames'
  ?{mode:'frames',framesPerSecond,idle:idles.map((_,i)=>prefix+'.idle.'+i),
    walk:walks.map((_,i)=>prefix+'.walk.'+i)}
  :{mode:'image'};
 const mapVisual=normalizeMapActorVisual({
  role:'hero',assetId:prefix+'.base',targetHeight,
  sourceFacingX,
  motion:motion??{idleAmplitude:.55,idleFrequency:.8,
   walkAmplitude:2,walkFrequency:3.8},
  animation
 });
 return Object.freeze({
  schema:USER_HERO_SCHEMA_V1,version:1,id:prefix,
  name:name.trim(),createdAt:now,mapVisual,
  assets:Object.freeze(assets.map(entry=>Object.freeze(entry)))
 });
}

export function validateUserHeroDefinitionV1(record){
 if(!record||record.schema!==USER_HERO_SCHEMA_V1||record.version!==1)
  throw new TypeError('Hero record schema/version invalid');
 const id=safeId(record.id);
 if(typeof record.name!=='string'||!record.name.trim()||record.name.length>80)
  throw new TypeError('Hero record display name invalid');
 if(!Number.isFinite(Date.parse(record.createdAt)))
  throw new TypeError('Hero record createdAt invalid');
 const visual=normalizeMapActorVisual(record.mapVisual);
 if(visual.role!=='hero'||visual.assetId!==id+'.base')
  throw new RangeError('Hero record must use its own main image');
 if(!Array.isArray(record.assets)||record.assets.length<1||record.assets.length>65)
  throw new RangeError('Hero record asset list invalid');
 const entries=new Map();
 for(const asset of record.assets){
  if(typeof asset?.id!=='string'||!asset.id.startsWith(id+'.')||entries.has(asset.id))
   throw new RangeError('Hero asset identity invalid or duplicated');
  entries.set(asset.id,media(asset,'Hero asset '+asset.id));
 }
 const allowed=[visual.assetId,...(visual.animation.mode==='frames'
  ?[...visual.animation.idle,...visual.animation.walk]:[])];
 if(allowed.length!==record.assets.length||allowed.some(ref=>!entries.has(ref)))
  throw new RangeError('Hero asset references must be complete and exact');
 const base=entries.get(visual.assetId);
 for(const value of entries.values())validateSize(value,base,'Hero frame');
 return record;
}

export function createUserHeroAssetResolverV1(record,{urlApi=URL}={}){
 validateUserHeroDefinitionV1(record);
 if(!urlApi?.createObjectURL||!urlApi?.revokeObjectURL)
  throw new Error('Hero media resolver needs object URL lifecycle');
 const assets=new Map(),urls=[];
 for(const item of record.assets){
  const path=urlApi.createObjectURL(item.blob);
  urls.push(path);
  assets.set(item.id,Object.freeze({id:item.id,kind:'map-actor-source',
   path,provenance:'user-local'}));
 }
 return Object.freeze({
  list(){return Object.freeze([...assets.values()]);},
  resolve(id){return assets.get(id)??null;},
  dispose(){
   for(const path of urls)urlApi.revokeObjectURL(path);
   urls.length=0;assets.clear();
  }
 });
}
