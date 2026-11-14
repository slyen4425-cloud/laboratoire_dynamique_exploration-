// Published hero presets are ONE immutable asset catalog, not new hero state.
// Choosing one creates an ordinary UserHeroDefinition in its existing IndexedDB.
// The same renderer, previews, saves and GenSRPG selection read this one store.
import {MAP_ACTOR_COMPASS_DIRECTIONS_V1,DEFAULT_HERO_VISUAL_SETTINGS_V1} from './map-actor-visual-model.js';
import {createUserHeroDefinitionV1} from './user-hero-definition-v1.js';

export const OFFICIAL_HERO_CATALOG_URL_V1='assets/exploration/actors/official/catalog.json';
const ROOT='assets/exploration/actors/official/';
const EXPECTED_HEROES=12;
const assetPath=value=>typeof value==='string'&&value.startsWith(ROOT)&&
  !value.includes('..')&&!value.includes('?')&&!value.includes('#')&&
  /^[A-Za-z0-9_./-]+\.png$/.test(value);
export function normalizeOfficialHeroCatalogV1(catalog){
  if(!catalog||catalog.schema!=='exploration-official-hero-catalog-v1'||
     catalog.version!==1||!Array.isArray(catalog.heroes)||
     catalog.heroes.length!==EXPECTED_HEROES)
    throw new TypeError('Le catalogue officiel doit contenir 12 héros');
  const seen=new Set();
  const heroes=catalog.heroes.map((entry,index)=>{
    if(!entry||typeof entry.id!=='string'||
       !/^hero\.official\.\d\d_[a-z_]+$/.test(entry.id)||
       seen.has(entry.id)||!entry.id.includes(String(index+1).padStart(2,'0')+'_')||
       typeof entry.name!=='string'||!entry.name.trim()||
       !assetPath(entry.thumbnail)||!assetPath(entry.back)||
       entry.fps!==DEFAULT_HERO_VISUAL_SETTINGS_V1.framesPerSecond||JSON.stringify(entry.frameSize)!=='[128,160]'||
       !entry.directions||Object.keys(entry.directions).length!==8)
      throw new TypeError('Héros officiel invalide ou en double : '+index);
    seen.add(entry.id);
    const directions=Object.fromEntries(MAP_ACTOR_COMPASS_DIRECTIONS_V1.map(dir=>{
      const images=entry.directions[dir];
      if(!Array.isArray(images)||images.length!==6||images.some(a=>!assetPath(a)))
        throw new TypeError('Séquence manquante : '+entry.id+' '+dir);
      return [dir,Object.freeze([...images])];
    }));
    return Object.freeze({...entry,directions:Object.freeze(directions)});
  });
  return Object.freeze({...catalog,heroes:Object.freeze(heroes)});
}
export async function loadOfficialHeroCatalogV1({fetchAsset=fetch,baseUrl=document.baseURI}={}){
  const url=new URL(OFFICIAL_HERO_CATALOG_URL_V1,baseUrl);
  const result=await fetchAsset(url.href,{cache:'no-store'});
  if(!result?.ok)throw new Error('Catalogue officiel de héros indisponible');
  return normalizeOfficialHeroCatalogV1(await result.json());
}
export async function installOfficialHeroPresetV1({
  hero,store,fetchAsset=fetch,baseUrl=document.baseURI,
  mintId=()=>crypto.randomUUID(),now=()=>new Date().toISOString()
}={}){
  if(typeof store?.put!=='function')throw new Error('Bibliothèque de héros indisponible');
  // Validate entry against the same strict published format; never accept URLs
  // outside the one authority or arbitrary user-provided network addresses.
  if(!hero||!/^hero\.official\.\d\d_[a-z_]+$/.test(hero.id??''))
    throw new TypeError('Modèle officiel invalide');
  const {directions}=hero;
  if(!directions||MAP_ACTOR_COMPASS_DIRECTIONS_V1.some(dir=>
     !Array.isArray(directions[dir])||directions[dir].length!==6||
     directions[dir].some(path=>!assetPath(path))))
    throw new TypeError('Les huit directions du héros sont incomplètes');
  // A second tap on "Utiliser ce modèle" must not silently create another
  // IndexedDB hero with a fresh UUID. The owner itself checks the saved
  // definitions; Capture and the editor share this one install contract.
  // Only compare the immutable published S/0 PNG and the unedited 49-image
  // model signature. A renamed/modified hero remains a distinct user record.
  if(typeof store.list==='function'){
    const saved=await store.list();
    const candidates=saved.filter(record=>record.name===hero.name&&
      record.mapVisual.animation.mode==='directions'&&
      record.assets.length===49&&
      record.mapVisual.assetId&&record.mapVisual.animation.directions.S?.length===6);
    if(candidates.length){
      const url=new URL(directions.S[0],baseUrl);
      if(url.origin!==new URL(baseUrl).origin)
        throw new Error('Héros officiel hors domaine');
      const response=await fetchAsset(url.href);
      if(!response?.ok)throw new Error('Image du héros absente : '+directions.S[0]);
      const bytes=new Uint8Array(await (await response.blob()).arrayBuffer());
      for(const record of candidates){
        const first=record.assets.find(asset=>asset.id===record.mapVisual.assetId)?.blob;
        if(!first||first.size!==bytes.length)continue;
        const current=new Uint8Array(await first.arrayBuffer());
        if(current.every((byte,index)=>byte===bytes[index]))return record;
      }
    }
  }
  const files={};
  const queue=MAP_ACTOR_COMPASS_DIRECTIONS_V1.flatMap(dir=>
    directions[dir].map((path,i)=>({dir,i,path})));
  // Limit concurrent image downloads on landscape Android. All data belongs
  // to the final single IndexedDB record; no transient cache authority.
  let offset=0;
  async function worker(){
    for(;;){
      const item=queue[offset++];
      if(!item)return;
      const url=new URL(item.path,baseUrl);
      if(url.origin!==new URL(baseUrl).origin)
        throw new Error('Héros officiel hors domaine');
      const response=await fetchAsset(url.href);
      if(!response?.ok)throw new Error('Image du héros absente : '+item.path);
      const blob=await response.blob();
      if(blob.size<1||blob.size>8*1024*1024)
        throw new RangeError('Image du héros incorrecte : '+item.path);
      (files[item.dir]??=[])[item.i]={
        blob:new Blob([blob],{type:'image/png'}),
        mimeType:'image/png',width:128,height:160
      };
    }
  }
  await Promise.all(Array.from({length:6},()=>worker()));
  const id='hero.user.'+mintId();
  const record=createUserHeroDefinitionV1({
    id,name:hero.name,base:files.S[0],mode:'directions',
    directions:files,framesPerSecond:hero.fps,
     targetHeight:DEFAULT_HERO_VISUAL_SETTINGS_V1.targetHeight,now:now()
  });
  await store.put(record);
  return record;
}
