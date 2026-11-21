// Read-only gallery of already-authoritative official and local visuals.
// Selecting a visual provides one image to the existing NPC definition editor.
// No clone of Combat creature gameplay, Hero DB, or global asset catalog.
import {createCaptureActorLibraryProviderV1} from '../capture/capture-actor-preview-loader-v1.js';
import {loadCaptureShowcaseEncounterSourceV1} from '../capture/capture-showcase-encounter-source-v1.js';
import {loadOfficialHeroCatalogV1} from './official-hero-presets-v1.js';
import {createUserHeroStoreV1} from '../storage/user-hero-store-v1.js';

const KINDS=Object.freeze(['creature','hero','npc']);
const $=(root,selector)=>root.querySelector(selector);
const unique=items=>[...new Set(items)].filter(Boolean).sort((a,b)=>a.localeCompare(b,'fr'));
export function filterNpcVisualEntriesV1(entries,{search='',category=''}={}){
 if(!Array.isArray(entries))throw new TypeError('Liste de visuels attendue');
 const query=String(search).trim().toLocaleLowerCase('fr');
 return entries.filter(item=>
  (!query||item.name.toLocaleLowerCase('fr').includes(query))&&
  (!category||item.tags.includes(category)));
}

function officialUrl(path){
 const value=new URL(path,document.baseURI);
 if(value.origin!==window.location.origin||!/\/[^/?]+\.(png|webp)$/i.test(value.pathname))
  throw new Error('Visuel officiel hors du catalogue autorisé');
 return value.href;
}
export function npcVisualHeroStyleV1(name){
 if(/^h[eé]ro[iï]ne\b/i.test(name))return 'Femme';
 if(/^h[eé]ros\b/i.test(name))return 'Homme';
 return 'Créations personnelles';
}
function localImage(record){
 const asset=record.assets?.find(x=>x.id===record.mapVisual?.assetId);
 if(!(asset?.blob instanceof Blob))throw new Error('Image locale manquante : '+record.name);
 return asset.blob;
}
export function mountNpcVisualLibraryV1({
 root,npcStore,onChoose,fetchImpl=fetch,
 loadHeroCatalog=loadOfficialHeroCatalogV1,
 loadCreatureCatalog=loadCaptureShowcaseEncounterSourceV1,
 loadCreatureProvider=createCaptureActorLibraryProviderV1,
 userHeroStore=createUserHeroStoreV1()
}={}){
 if(!root||!npcStore?.list||typeof onChoose!=='function')
  throw new TypeError('La galerie PNJ requiert les bibliothèques officielles');
 const panel=$ (root,'#npc-visual-cards');
 const status=$(root,'#npc-visual-library-status');
 const filter=$(root,'#npc-visual-subcategory');
 const search=$(root,'#npc-visual-search');
 let tab='creature',seq=0,rows=[],objectUrls=[],disposed=false;
 function disposeThumbs(){
  for(const url of objectUrls)URL.revokeObjectURL(url);
  objectUrls=[];
 }
 function labelFor(kind){return {creature:'Créatures',hero:'Héros',npc:'PNJ'}[kind];}
 async function sourceRows(kind){
  if(kind==='creature'){
   const [provider,catalog]=await Promise.all([
    loadCreatureProvider({fetchImpl}),loadCreatureCatalog({fetchImpl})
   ]);
   const species=new Map(catalog.creatures.map(c=>[c.id,c]));
   return provider.listDefinitions().map(def=>{
    const published=species.get(def.sourceId);
    const url=officialUrl(def.asset.path);
    return {id:def.id,name:def.displayName,
      tags:Array.isArray(published?.elements)?published.elements:[],
      thumbUrl:url,kind,sourceUrl:url};
   });
  }
  if(kind==='hero'){
   const [catalog,saved]=await Promise.all([loadHeroCatalog(),userHeroStore.list()]);
   return [
    ...catalog.heroes.map(hero=>{
     const file=hero.directions.S[0];
     return {id:hero.id,name:hero.name,tags:[npcVisualHeroStyleV1(hero.name)],
      kind,thumbUrl:officialUrl(hero.thumbnail),sourceUrl:officialUrl(file)};
    }),
    ...saved.map(hero=>({id:hero.id,name:hero.name,kind,
      tags:['Créations personnelles'],sourceBlob:localImage(hero)}))
   ];
  }
  return (await npcStore.list()).map(npc=>({id:npc.id,name:npc.name,kind,
   tags:[npc.role??'PNJ'],sourceBlob:localImage(npc)}));
 }
 function clear(){disposeThumbs();panel.replaceChildren();}
 function updateFilter(){
  const prior=filter.value;
  const groups=unique(rows.flatMap(item=>item.tags));
  filter.replaceChildren(new Option('Toutes les catégories',''),
   ...groups.map(item=>new Option(item,item)));
  filter.value=groups.includes(prior)?prior:'';
 }
 function render(){
  if(disposed)return;
  clear();
  const q=search.value.trim().toLocaleLowerCase('fr'),category=filter.value;
  const visible=filterNpcVisualEntriesV1(rows,{search:q,category});
  status.textContent=visible.length+' visuel(s) · '+labelFor(tab)+
   ' · choisir une image ne modifie jamais le modèle original';
  for(const item of visible){
   const card=document.createElement('div');card.className='npc-visual-card';
   const img=document.createElement('img');img.loading='lazy';img.alt=item.name;
   img.src=item.thumbUrl??URL.createObjectURL(item.sourceBlob);
   if(!item.thumbUrl)objectUrls.push(img.src);
   const name=document.createElement('strong');name.textContent=item.name;
   const tag=document.createElement('small');tag.textContent=item.tags.join(' · ')||labelFor(tab);
   const button=document.createElement('button');button.type='button';
   button.textContent='Utiliser ce visuel';
   button.addEventListener('click',async()=>{
    button.disabled=true;
    status.textContent='Chargement du modèle officiel…';
    try{
     let blob=item.sourceBlob;
     if(!blob){
      const response=await fetchImpl(item.sourceUrl,{cache:'force-cache'});
      if(!response?.ok)throw new Error('Image officielle indisponible');
      blob=await response.blob();
     }
     const path=item.sourceUrl??item.thumbUrl??'';
     const mime=/\.png(?:$|\?)/i.test(path)?'image/png':
       /\.webp(?:$|\?)/i.test(path)?'image/webp':blob.type;
     if(!['image/png','image/webp'].includes(mime)||!blob.size||blob.size>8*1024*1024)
      throw new Error('Modèle PNG/WebP invalide (maximum 8 Mo)');
     const image=new File([blob],item.id.replace(/[^a-z0-9_-]/gi,'-')+
      (mime==='image/png'?'.png':'.webp'),{type:mime});
     await onChoose(image,{name:item.name,kind:item.kind,sourceId:item.id});
     status.textContent='Visuel chargé : '+item.name+' · renomme ou règle ton PNJ puis Enregistrer';
    }catch(error){status.textContent='Import impossible : '+error.message;}
    finally{button.disabled=false;}
   });
   card.append(img,name,tag,button);panel.append(card);
  }
 }
 async function activate(kind){
  if(disposed||!KINDS.includes(kind))return;
  tab=kind;const epoch=++seq;
  for(const button of root.querySelectorAll('[data-npc-visual-tab]')){
   const active=button.dataset.npcVisualTab===tab;
   button.setAttribute('aria-selected',String(active));
  }
  clear();status.textContent='Chargement du catalogue '+labelFor(tab)+'…';
  try{
   // Refresh local libraries on each tab opening; official entries may stay cached
   // only for the current picker session, never a second persistent authority.
   const data=await sourceRows(kind);
   if(epoch!==seq||disposed)return;
   rows=data;
   updateFilter();render();
  }catch(error){
   if(epoch!==seq||disposed)return;
   rows=[];filter.replaceChildren(new Option('Toutes les catégories',''));
   status.textContent=labelFor(kind)+' indisponibles : '+error.message;
  }
 }
 for(const button of root.querySelectorAll('[data-npc-visual-tab]'))
  button.addEventListener('click',()=>activate(button.dataset.npcVisualTab));
 search.addEventListener('input',render);
 filter.addEventListener('change',render);
 root.addEventListener('toggle',()=>{if(root.open)activate(tab);});
 window.addEventListener('pagehide',()=>{disposed=true;clear();},{once:true});
 return Object.freeze({refresh:()=>activate(tab),dispose(){disposed=true;++seq;clear();}});
}
