// Dedicated NPC authoring contract. Explorer owns the reusable profile and
// its media, never its world placement, combat state, creature or item catalog.
import {normalizeMapActorVisual,MAP_ACTOR_COMPASS_DIRECTIONS_V1} from './map-actor-visual-model.js';
import {normalizeMapActorNpcSettingsV1} from './map-actor-npc-settings-v1.js';

export const USER_NPC_SCHEMA_V1='gensrpg-exploration-user-npc-v1';
export const USER_NPC_BUNDLE_SCHEMA_V1='gensrpg-exploration-user-npc-bundle-v1';
const UUID=/^npc\.user\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
const ROLE=/^[a-z][a-z0-9_-]{0,39}$/;
const MAX_IMAGE_BYTES=8*1024*1024;
const TYPES=new Set(['image/png','image/webp']);

export function mintUserNpcIdV1(cryptoApi=globalThis.crypto){
 if(typeof cryptoApi?.randomUUID!=='function')throw new Error('UUID sécurisé requis');
 return 'npc.user.'+cryptoApi.randomUUID();
}
export function npcKindForRoleV1(role){
 if(!ROLE.test(role))throw new RangeError('Rôle PNJ invalide');
 return role==='merchant'?'merchant':role.startsWith('trainer')?'trainer':
   role==='quest'?'quest':role==='wild'?'wild':'dialogue';
}
function image(input,label){
 if(!input||typeof input!=='object'||!(input.blob instanceof Blob))
  throw new TypeError(label+' doit contenir une image réelle');
 if(!TYPES.has(input.mimeType)||input.blob.type!==input.mimeType)
  throw new TypeError(label+' doit être un PNG ou WebP');
 if(input.blob.size<1||input.blob.size>MAX_IMAGE_BYTES)
  throw new RangeError(label+' doit peser entre 1 octet et 8 Mo');
 if(!Number.isInteger(input.width)||!Number.isInteger(input.height)||
    input.width<16||input.height<16||input.width>4096||input.height>4096)
  throw new RangeError(label+' doit mesurer entre 16 et 4096 pixels');
 return Object.freeze({blob:input.blob,mimeType:input.mimeType,
  width:input.width,height:input.height});
}
function frames(items,base,label,{required=false,exact=null}={}){
 if(items===undefined)items=[];
 if(!Array.isArray(items)||items.length>32||(required&&!items.length)||
   (exact!==null&&items.length!==exact))
  throw new RangeError(label+' : nombre de sprites invalide');
 return Object.freeze(items.map((entry,i)=>{
  const asset=image(entry,label+' '+i);
  if(asset.width!==base.width||asset.height!==base.height)
   throw new RangeError(label+' : les canevas doivent avoir les mêmes dimensions');
  return asset;
 }));
}
function validDate(value){
 return typeof value==='string'&&Number.isFinite(Date.parse(value));
}
export function createUserNpcDefinitionV1({
 id=mintUserNpcIdV1(),name,role='villager',base,portrait=null,
 mode='image',idle=[],walk=[],directions=null,framesPerSecond=16,
 targetHeight=62,sourceFacingX=1,mirrorHorizontal=true,shadow=null,
 motion=null,npc={},createdAt=new Date().toISOString(),
 updatedAt=new Date().toISOString()
}={}){
 if(!UUID.test(id))throw new TypeError('ID PNJ automatique UUID requis');
 if(typeof name!=='string'||!name.trim()||name.trim().length>80)
  throw new TypeError('Nom du PNJ requis (1 à 80 caractères)');
 if(!validDate(createdAt)||!validDate(updatedAt))
  throw new TypeError('Date de définition PNJ invalide');
 if(!['image','frames','directions'].includes(mode))
  throw new TypeError('Mode animation PNJ invalide');
 const kind=npcKindForRoleV1(role);
 const basic=image(base,'Image principale');
 const face=portrait==null?null:image(portrait,'Portrait');
 const idles=mode==='frames'?frames(idle,basic,'Repos'):[];
 const walks=mode==='frames'?frames(walk,basic,'Marche',{required:true}):[];
 const directional=mode==='directions'?Object.fromEntries(
  MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[dir,frames(directions?.[dir],
   basic,dir,{required:true,exact:6})])):{};
 const assets=[{id:id+'.base',...basic},
  ...(face?[{id:id+'.portrait',...face}]:[]),
  ...idles.map((a,i)=>({id:id+'.idle.'+i,...a})),
  ...walks.map((a,i)=>({id:id+'.walk.'+i,...a})),
  ...MAP_ACTOR_COMPASS_DIRECTIONS_V1.flatMap(dir=>
   (directional[dir]??[]).map((a,i)=>({id:id+'.dir.'+dir+'.'+i,...a})))];
 const animation=mode==='frames'?{mode,framesPerSecond,
   idle:idles.map((_,i)=>id+'.idle.'+i),
   walk:walks.map((_,i)=>id+'.walk.'+i)}
  :mode==='directions'?{mode,framesPerSecond,directions:Object.fromEntries(
   MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>[dir,
    directional[dir].map((_,i)=>id+'.dir.'+dir+'.'+i)]))}
   :{mode:'image'};
 const mapVisual=normalizeMapActorVisual({
  role:'npc',assetId:id+'.base',targetHeight,sourceFacingX,mirrorHorizontal,
  ...(shadow?{shadow}:{}),
  ...(motion?{motion}:{}),animation
 });
 // All existing interactions use the SAME native NPC settings schema.
 // Boss / adversary are tags only until the canonical Encounter Bridge provides
 // scenario IDs. Never manufacture a second combat engine here.
 const defaults=normalizeMapActorNpcSettingsV1({...npc,kind,
  name:name.trim(),
  ...(role==='trainer-aggressive'?{trainerEngagement:'aggressive'}:
     role==='trainer-friendly'?{trainerEngagement:'offer'}:{})});
 return Object.freeze({schema:USER_NPC_SCHEMA_V1,version:1,
  id,name:name.trim(),role,createdAt,updatedAt,mapVisual,npc:defaults,
  assets:Object.freeze(assets.map(a=>Object.freeze(a)))});
}
export function validateUserNpcDefinitionV1(record){
 if(!record||record.schema!==USER_NPC_SCHEMA_V1||record.version!==1||
  !UUID.test(record.id)||typeof record.name!=='string'||
  !record.name.trim()||record.name.length>80||
  !validDate(record.createdAt)||!validDate(record.updatedAt))
  throw new TypeError('Définition PNJ versionnée invalide');
 const kind=npcKindForRoleV1(record.role);
 const npc=normalizeMapActorNpcSettingsV1(record.npc);
 if(npc.kind!==kind||npc.name!==record.name)
  throw new RangeError('Le rôle et le nom PNJ doivent garder une autorité unique');
 const v=normalizeMapActorVisual(record.mapVisual),id=record.id;
 if(v.role!=='npc'||v.assetId!==id+'.base')
  throw new RangeError('Visuel PNJ référencé hors de sa définition');
 if(!Array.isArray(record.assets)||record.assets.length<1||
  record.assets.length>65)throw new RangeError('Liste des images PNJ invalide');
 const assets=new Map();
 for(const item of record.assets){
  if(typeof item?.id!=='string'||!item.id.startsWith(id+'.')||
   assets.has(item.id))throw new RangeError('ID de média PNJ dupliqué ou étranger');
  assets.set(item.id,image(item,'Média PNJ'));
 }
 const portrait=id+'.portrait',refs=[v.assetId,
  ...(assets.has(portrait)?[portrait]:[]),
  ...(v.animation.mode==='frames'?[...v.animation.idle,...v.animation.walk]:
   v.animation.mode==='directions'
    ?MAP_ACTOR_COMPASS_DIRECTIONS_V1.flatMap(dir=>v.animation.directions[dir]):[])];
 if(refs.length!==record.assets.length||
    new Set(refs).size!==refs.length||refs.some(ref=>!assets.has(ref)))
  throw new RangeError('Références sprites PNJ incomplètes');
 const base=assets.get(v.assetId);
 for(const [key,item] of assets)
  if(key!==portrait&&(item.width!==base.width||item.height!==base.height))
   throw new RangeError('Canevas de sprites PNJ incompatibles');
 return record;
}
export function createUserNpcAssetResolverV1(records,{urlApi=URL}={}){
 const safe=Array.isArray(records)?records:[records];
 if(!urlApi?.createObjectURL||!urlApi?.revokeObjectURL)
  throw new TypeError('Gestion des URL de médias nécessaire');
 const assets=new Map(),created=[];
 try{
  for(const record of safe){
   validateUserNpcDefinitionV1(record);
   for(const item of record.assets){
    if(assets.has(item.id))throw new RangeError('ID asset PNJ dupliqué');
    const path=urlApi.createObjectURL(item.blob);
    created.push(path);
    assets.set(item.id,Object.freeze({id:item.id,kind:'map-actor-source',
     path,provenance:'user-local'}));
   }
  }
 }catch(error){created.forEach(url=>urlApi.revokeObjectURL(url));throw error;}
 return Object.freeze({
  list:()=>Object.freeze([...assets.values()]),
  resolve:id=>assets.get(id)??null,
  dispose(){for(const url of created)urlApi.revokeObjectURL(url);
   created.length=0;assets.clear();}
 });
}
function encode64(bytes){
 let binary='';
 for(let i=0;i<bytes.length;i+=0x8000)
  binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
 return btoa(binary);
}
export async function exportUserNpcBundleV1(record){
 validateUserNpcDefinitionV1(record);
 const assets=await Promise.all(record.assets.map(async asset=>({
  id:asset.id,width:asset.width,height:asset.height,mimeType:asset.mimeType,
  base64:encode64(new Uint8Array(await asset.blob.arrayBuffer()))
 })));
 return JSON.stringify({schema:USER_NPC_BUNDLE_SCHEMA_V1,version:1,
  definition:{...record,assets}});
}
function decodeAsset(raw){
 if(typeof raw?.base64!=='string'||raw.base64.length>MAX_IMAGE_BYTES*1.4||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(raw.base64))
  throw new TypeError('Données du média PNJ invalides');
 const binary=atob(raw.base64),bytes=new Uint8Array(binary.length);
 for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 return {blob:new Blob([bytes],{type:raw.mimeType}),
  width:raw.width,height:raw.height,mimeType:raw.mimeType};
}
export function importUserNpcBundleV1(text,{mintId=mintUserNpcIdV1}={}){
 const input=JSON.parse(text);
 if(input?.schema!==USER_NPC_BUNDLE_SCHEMA_V1||input.version!==1||
  !input.definition||!Array.isArray(input.definition.assets))
  throw new TypeError('Archive PNJ inconnue');
 const saved=input.definition,items=new Map(saved.assets.map(a=>[a.id,decodeAsset(a)]));
 const v=saved.mapVisual,old=saved.id;
 const take=ref=>{const media=items.get(ref);
  if(!media)throw new RangeError('Sprite PNJ absent : '+ref);return media;};
 const base=take(old+'.base');
 return createUserNpcDefinitionV1({
  id:mintId(),name:saved.name,role:saved.role,base,
  portrait:items.has(old+'.portrait')?take(old+'.portrait'):null,
  mode:v.animation.mode,framesPerSecond:v.animation.framesPerSecond??16,
  idle:v.animation.mode==='frames'?v.animation.idle.map(take):[],
  walk:v.animation.mode==='frames'?v.animation.walk.map(take):[],
  directions:v.animation.mode==='directions'?Object.fromEntries(
   MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(d=>[d,v.animation.directions[d].map(take)])):null,
  targetHeight:v.targetHeight,sourceFacingX:v.sourceFacingX,
  mirrorHorizontal:v.mirrorHorizontal,shadow:v.shadow,motion:v.motion,
  npc:saved.npc
 });
}
// Runtime projection only: no migration of the saved WorldArea/WorldDocument.
// Historical in-map NPC settings always win and retain their original behavior.
export function resolvePlacedNpcDefinitionsV1(placements,resolveDefinition){
 return Object.freeze(placements.map(actor=>{
  if(actor.npc!=null)return actor;
  const def=resolveDefinition(actor.actorDefinitionId);
  return def?.schema===USER_NPC_SCHEMA_V1?Object.freeze({...actor,npc:def.npc}):actor;
 }));
}
