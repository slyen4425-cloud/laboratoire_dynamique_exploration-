import {createUserHeroDefinitionV1} from '../actors/user-hero-definition-v1.js';
// Exploration owns both the HeroDefinition + image blobs (its one IndexedDB)
// and the project membership table. This table stores IDs only, never media,
// never mutates or deletes historical hero records to switch universes.
const KEY='gensrpg.exploration.universe-heroes.index.v1';
const SCHEMA=KEY;
const ID=/^unv_[a-z0-9-]{8,80}$/;
function validProject(value){if(typeof value!=='string'||!ID.test(value))
 throw new TypeError('Identifiant d’univers généré requis');return value;}
function validate(data){
 if(!data||typeof data!=='object'||Array.isArray(data)||
  Object.keys(data).sort().join(',')!=='projects,schema,version'||
  data.schema!==SCHEMA||data.version!==1||!Array.isArray(data.projects)||
  data.projects.some(p=>!p||typeof p!=='object'||Array.isArray(p)||
   Object.keys(p).sort().join(',')!=='heroIds,id'||!ID.test(p.id)||
   !Array.isArray(p.heroIds)||p.heroIds.some(x=>typeof x!=='string')||
   new Set(p.heroIds).size!==p.heroIds.length)||
  new Set(data.projects.map(p=>p.id)).size!==data.projects.length)
  throw new Error('Registre des héros par univers corrompu ; images historiques préservées');
 const all=data.projects.flatMap(p=>p.heroIds);
 if(new Set(all).size!==all.length)
  throw new Error('Un héros appartient à plusieurs univers ; aucune migration implicite');
 return data;
}
export function createExplorationUniverseHeroProjectsV1({storage,heroStore}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
  typeof heroStore?.get!=='function'||typeof heroStore?.list!=='function'||
  typeof heroStore?.put!=='function')
  throw new TypeError('Les propriétaires officiels de Storage et HeroDefinition sont requis');
 const read=()=>{
  const raw=storage.getItem(KEY);
  if(raw===null)return {schema:SCHEMA,version:1,projects:[]};
  let parsed;
  try{parsed=JSON.parse(raw)}catch{throw new Error('Index des héros illisible : aucune donnée effacée');}
  return validate(parsed);
 };
 const write=index=>{storage.setItem(KEY,JSON.stringify(validate(index)));return index};
 const get=(id,doc=read())=>doc.projects.find(p=>p.id===validProject(id))??null;
 function createEmpty(id){
  const data=read();if(get(id,data))throw new Error('Projet de héros déjà présent');
  write({...data,projects:[...data.projects,{id,heroIds:[]}]});
  return Object.freeze({projectId:id,heroIds:[]});
 }
 async function list(id){
  const p=get(id);
  if(!p)return Object.freeze([]);
  const entries=[];
  for(const heroId of p.heroIds){
   const hero=await heroStore.get(heroId);
   if(!hero)throw new Error('HeroDefinition manquant dans IndexedDB officiel : aucune réinitialisation');
   entries.push(hero);
  }
  return Object.freeze(entries);
 }
 async function add(id,heroId){
  const doc=read(),p=get(id,doc);
  if(!p)throw new Error('Projet HeroDefinition non initialisé');
  if(typeof heroId!=='string'||!heroId.startsWith('hero.user.'))
   throw new TypeError('HeroDefinition officiel requis');
  if(doc.projects.some(other=>other.heroIds.includes(heroId)))
   throw new Error('Ce héros appartient déjà à un univers : une copie explicite est nécessaire');
  const hero=await heroStore.get(heroId);
  if(!hero)throw new Error('Héros absent de la bibliothèque native : aucune donnée créée');
  write({...doc,projects:doc.projects.map(row=>row.id===id?
   {...row,heroIds:[...row.heroIds,heroId]}:row)});
  return hero;
 }
 function requireReady(id){
  const p=get(id);
  if(!p)throw new Error('Bibliothèque de héros de cet univers non initialisée');
  return Object.freeze({id:p.id,heroIds:Object.freeze([...p.heroIds])});
 }
 // An explicit clone is the only way to put a hero into another universe:
 // new stable ID and new native HeroDefinition, including its images. No
 // rewiring an existing saved hero or sharing a mutable record between games.
 async function copy({sourceHeroId,toProjectId,confirmed=false,makeId,now}={}){
  if(confirmed!==true||typeof makeId!=='function'||typeof now!=='string')
   throw new Error('Copie de héros : confirmation et ID natif généré requis');
  requireReady(toProjectId);
  const existing=await heroStore.get(sourceHeroId);
  if(!existing)throw new Error('Héros source introuvable dans IndexedDB natif');
  const id='hero.user.'+makeId();
  if(await heroStore.get(id))throw new Error('ID du nouveau héros déjà utilisé');
  const assets=new Map(existing.assets.map(item=>[item.id,item]));
  const visual=existing.mapVisual;
  const image=assetId=>{
   const asset=assets.get(assetId);
   if(!asset)throw new Error('Image native du héros source manquante');
   return asset;
  };
  const mode=visual.animation.mode;
  const directional=mode==='directions'
   ?Object.fromEntries(Object.entries(visual.animation.directions)
      .map(([dir,ids])=>[dir,ids.map(image)])):null;
  const record=createUserHeroDefinitionV1({
   id,name:existing.name,now,
   base:image(visual.assetId),
   portrait:assets.get(sourceHeroId+'.portrait')??null,
   mode,
   idle:mode==='frames'?visual.animation.idle.map(image):[],
   walk:mode==='frames'?visual.animation.walk.map(image):[],
   directions:directional,
   framesPerSecond:visual.animation.framesPerSecond,
   targetHeight:visual.targetHeight,sourceFacingX:visual.sourceFacingX,
   motion:visual.motion
  });
  await heroStore.put(record);
  await add(toProjectId,record.id);
  return record;
 }
 return Object.freeze({createEmpty,list,add,copy,requireReady});
}
