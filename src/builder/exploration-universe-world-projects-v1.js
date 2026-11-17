// One Exploration-owned allocation table for independent Capture universe
// WorldDocuments. WorldBuilder archive + serializer remain the ONLY content
// authority. The per-universe table stores REFERENCES, never copied maps.
import {createExplorationWorldDocumentLibraryV1} from './exploration-world-document-library-v1.js';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft}
 from './world-builder-draft.js';
const INDEX='gensrpg.exploration.universe-worlds.index.v1';
const SCHEMA=INDEX;
const project=/^unv_[a-z0-9-]{8,80}$/;
const worldId=/^world-[a-z0-9-]{8,80}$/;
const isProject=id=>typeof id==='string'&&project.test(id);
function validate(index){
 if(!index||typeof index!=='object'||Array.isArray(index)||
  Object.keys(index).sort().join(',')!=='activeWorldId,projects,schema,version'||
  index.schema!==SCHEMA||index.version!==1||!Array.isArray(index.projects)||
  index.projects.some(p=>!p||typeof p!=='object'||Array.isArray(p)||
    Object.keys(p).sort().join(',')!=='id,worldIds'||!isProject(p.id)||
    !Array.isArray(p.worldIds)||new Set(p.worldIds).size!==p.worldIds.length||
    p.worldIds.some(id=>typeof id!=='string'||!worldId.test(id)))||
  new Set(index.projects.map(p=>p.id)).size!==index.projects.length||
  (index.activeWorldId!==null&&
   !index.projects.some(p=>p.worldIds.includes(index.activeWorldId))))
  throw new Error('Projets WorldDocument invalides : les cartes historiques restent inchangées');
 const all=index.projects.flatMap(p=>p.worldIds);
 if(new Set(all).size!==all.length)
  throw new Error('WorldDocument attribué à plusieurs univers : aucune donnée modifiée');
 return index;
}
export function createExplorationUniverseWorldProjectsV1({storage,makeId}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
  typeof makeId!=='function')
  throw new TypeError('Le World Builder officiel et des identifiants générés sont requis');
 const archive=createExplorationWorldDocumentLibraryV1({storage});
 function read(){
  const raw=storage.getItem(INDEX);
  if(raw===null)return {schema:SCHEMA,version:1,projects:[],activeWorldId:null};
  let value;
  try{value=JSON.parse(raw)}catch{throw new Error('Index des projets WorldDocument illisible; conservation intégrale');}
  return validate(value);
 }
 const write=index=>{storage.setItem(INDEX,JSON.stringify(validate(index)));return index};
 const entry=(id,index=read())=>{
  if(!isProject(id))throw new TypeError('Identifiant de projet généré requis');
  return index.projects.find(p=>p.id===id)??null;
 };
 const owned=(id,world)=>{
  const p=entry(id);
  if(!p||!p.worldIds.includes(world))
   throw new Error('WorldDocument étranger à cet univers : activation refusée');
  const document=archive.load(world);
  if(document.id!==world)throw new Error('Document de monde incohérent');
  return document;
 };
 function register(id,world){
  const index=read(),p=entry(id,index);
  if(p)throw new Error('Projet WorldDocument déjà alloué');
  if(index.projects.some(x=>x.worldIds.includes(world)))
   throw new Error('WorldDocument déjà attribué');
  const document=archive.load(world);
  if(document.id!==world)throw new Error('WorldDocument manquant');
  write({...index,projects:[...index.projects,{id,worldIds:[world]}]});
  return document;
 }
 function createBlank(id,{width=2400,height=1600}={}){
  if(entry(id))throw new Error('Projet déjà initialisé');
  const identifier='world-'+String(makeId()).toLowerCase();
  if(!worldId.test(identifier))
   throw new TypeError('ID de WorldDocument généré invalide');
  if(archive.list().some(w=>w.id===identifier))
   throw new Error('Collision de WorldDocument : aucun écrasement');
  const document=createBlankWorldBuilderDraft({id:identifier,width,height});
  archive.save(document); // Canonical only, no saved Adventure or Hero bytes.
  register(id,identifier);
  return document;
 }
 function copy({fromWorldId,toProjectId,confirmed=false}={}){
  if(confirmed!==true)throw new Error('Copie WorldDocument uniquement après confirmation explicite');
  if(entry(toProjectId))throw new Error('Projet déjà initialisé');
  const source=archive.load(fromWorldId);
  const identifier='world-'+String(makeId()).toLowerCase();
  if(!worldId.test(identifier)||archive.list().some(w=>w.id===identifier))
   throw new Error('Nouvel identifiant de WorldDocument invalide ou en collision');
  const cloned=createWorldBuilderDraft({...source,id:identifier});
  archive.save(cloned);
  register(toProjectId,identifier);
  return cloned;
 }
 function list(id){
  const p=entry(id);
  if(!p)return Object.freeze([]);
  return Object.freeze(p.worldIds.map(world=>Object.freeze({
   id:owned(id,world).id,projectId:id
  })));
 }
 function save(id,document){
  owned(id,document?.id);
  return archive.save(document,{replace:true});
 }
 function activate(id,world){
  const document=owned(id,world);
  // The native owner enforces the one unsaved-draft check and uses the one
  // active WorldAssembler handoff. Never bypass it via a second writer.
  archive.activate(document.id);
  const index=read();write({...index,activeWorldId:world});
  return document;
 }
 return Object.freeze({list,load:owned,createBlank,copy,activate,save});
}
