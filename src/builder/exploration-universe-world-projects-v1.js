// One Exploration-owned allocation table for independent Capture universe
// WorldDocuments. WorldBuilder archive + serializer remain the ONLY content
// authority. The per-universe table stores REFERENCES, never copied maps.
import {createExplorationWorldDocumentLibraryV1} from './exploration-world-document-library-v1.js';
import {createBlankWorldBuilderDraft,createWorldBuilderDraft,serializeWorldBuilderDraft}
 from './world-builder-draft.js';
import {saveWorldAssemblerDraft,readWorldAssemblerDraft,WORLD_ASSEMBLER_DRAFT_KEY}
 from './world-assembler-handoff.js';
import {createExplorationUniverseWorkspaceStorageV1}
 from '../storage/exploration-universe-workspace-storage-v1.js';
const INDEX='gensrpg.exploration.universe-worlds.index.v1';
const SCHEMA=INDEX;
const project=/^unv_[a-z0-9-]{8,80}$/;
const worldId=/^world-[a-z0-9-]{8,80}$/;
const isProject=id=>typeof id==='string'&&project.test(id);
export function validateExplorationUniverseWorldIndexV1(index){
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
  return validateExplorationUniverseWorldIndexV1(value);
 }
 const write=index=>{storage.setItem(INDEX,JSON.stringify(validateExplorationUniverseWorldIndexV1(index)));return index};
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
 function register(id,world,{extend=false}={}){
  const index=read(),p=entry(id,index);
  if(p&&!extend)throw new Error('Projet WorldDocument déjà alloué');
  if(index.projects.some(x=>x.worldIds.includes(world)))
   throw new Error('WorldDocument déjà attribué');
  const document=archive.load(world);
  if(document.id!==world)throw new Error('WorldDocument manquant');
  write({...index,projects:p
    ?index.projects.map(x=>x.id===id?{...x,worldIds:[...x.worldIds,world]}:x)
    :[...index.projects,{id,worldIds:[world]}]});
  return document;
 }
 function addBlank(id,{width=2400,height=1600}={}){
  const existing=entry(id);
  const identifier='world-'+String(makeId()).toLowerCase();
  if(!worldId.test(identifier))
   throw new TypeError('ID de WorldDocument généré invalide');
  if(archive.list().some(w=>w.id===identifier))
   throw new Error('Collision de WorldDocument : aucun écrasement');
  const document=createBlankWorldBuilderDraft({id:identifier,width,height});
  archive.save(document); // Canonical WorldDocument serializer only.
  register(id,identifier,{extend:Boolean(existing)});
  activate(id,identifier);
  return document;
 }
 function createBlank(id,options={}){
  if(entry(id))throw new Error('Projet déjà initialisé');
  return addBlank(id,options);
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
  activate(toProjectId,identifier);
  return cloned;
 }
 function list(id){
  const p=entry(id);
  if(!p)return Object.freeze([]);
  return Object.freeze(p.worldIds.map(world=>{
   const document=owned(id,world);
   return Object.freeze({id:document.id,areaCount:document.areas.length,projectId:id});
  }));
 }
 function save(id,document){
  owned(id,document?.id);
  return archive.save(document,{replace:true});
 }
 function activate(id,world){
  const document=owned(id,world);
  const scoped=createExplorationUniverseWorkspaceStorageV1(storage,id);
  const bytes=scoped.getItem(WORLD_ASSEMBLER_DRAFT_KEY);
  const active=readWorldAssemblerDraft(scoped);
  if(bytes!==null&&!active)
   throw new Error('Document actif du projet illisible : aucune activation destructive');
  if(active){
   let archived;
   try{archived=archive.load(active.id);}
   catch{throw new Error('Enregistre d’abord le monde actif de cet univers');}
   if(serializeWorldBuilderDraft(active)!==serializeWorldBuilderDraft(archived))
    throw new Error('Enregistre d’abord le monde actif de cet univers');
  }
  // The same ONE native WorldAssembler serializer, but a project-owned
  // workspace key. Never overwrite the old globally active draft.
  saveWorldAssemblerDraft(scoped,document);
  const index=read();write({...index,activeWorldId:world});
  return document;
 }
 // Explicit multiplayer import only. Preserve the host identity and canonical
 // bytes; never alias a WorldDocument already owned by another universe.
 function importShared(id,document,{confirmed=false}={}){
  if(confirmed!==true)throw Error('Import du monde du salon : confirmation requise');
  const index=read(),p=entry(id,index);
  if(!p||!worldId.test(document?.id??''))throw Error('Univers ou identité du monde reçu incompatible');
  const world=document.id;
  const other=index.projects.find(x=>x.id!==id&&x.worldIds.includes(world));
  if(other)throw Error('WorldDocument déjà attribué à un autre univers');
  // Native archive.save validates and refuses divergent existing bytes.
  // Under IndexedDB archive and project index are in the same transaction.
  archive.save(document,{replace:false});
  if(!p.worldIds.includes(world))register(id,world,{extend:true});
  return owned(id,world);
 }
 return Object.freeze({list,load:owned,createBlank,addBlank,copy,activate,save,importShared});
}
