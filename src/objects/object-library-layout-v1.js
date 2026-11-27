// Personal presentation metadata only: no images, object definitions or world data.
const clean=v=>typeof v==='string'?v.trim():'';
const key=v=>clean(v).normalize('NFKC').toLocaleLowerCase('fr');
const validId=v=>/^category\.[a-z0-9-]{1,80}$/.test(v);
const own=(o,k)=>Object.hasOwn(o,k);
const label=v=>{const s=clean(v);if(!s||s.length>80)throw Error('Nom de catégorie invalide (1 à 80 caractères).');return s;};
export function normalizeObjectLibraryLayout(raw={version:1,categories:[],assignments:{}}){
 if(raw.version!==1||!Array.isArray(raw.categories)||!raw.assignments||typeof raw.assignments!=='object'||Array.isArray(raw.assignments))throw Error('Classement graphique invalide.');
 const categories=raw.categories.map(c=>{
  if(!validId(c.id)||!(c.parentId===null||validId(c.parentId)))throw Error('Identifiant de catégorie invalide.');
  return Object.freeze({id:c.id,parentId:c.parentId,label:label(c.label)});
 });
 const byId=new Map(categories.map(c=>[c.id,c]));
 if(byId.size!==categories.length)throw Error('Catégorie dupliquée.');
 const names=new Set();
 for(const c of categories){
  const k=JSON.stringify([c.parentId,key(c.label)]);
  if(names.has(k))throw Error('Ce nom existe déjà dans ce dossier.');
  names.add(k);
  const seen=new Set([c.id]);let parent=c.parentId;
  while(parent!==null){if(seen.has(parent)||!byId.has(parent))throw Error('Hiérarchie de catégories invalide.');seen.add(parent);parent=byId.get(parent).parentId;}
 }
 const assignments=Object.create(null);
 for(const [id,target] of Object.entries(raw.assignments)){
  if(!clean(id)||!byId.has(target))throw Error('Rattachement de ressource invalide.');
  assignments[id]=target;
 }
 return Object.freeze({version:1,categories:Object.freeze(categories),assignments:Object.freeze(assignments)});
}
export function addObjectLibraryCategory(layout,{name,parentId=null,makeId=()=>globalThis.crypto.randomUUID()}={}){
 const current=normalizeObjectLibraryLayout(layout);
 return normalizeObjectLibraryLayout({...current,categories:[...current.categories,{id:'category.'+makeId(),parentId,label:name}]});
}
export function editObjectLibraryCategory(layout,id,patch={}){
 const current=normalizeObjectLibraryLayout(layout);
 if(!current.categories.some(c=>c.id===id))throw Error('Catégorie introuvable.');
 return normalizeObjectLibraryLayout({...current,categories:current.categories.map(c=>c.id===id?{...c,...(own(patch,'name')?{label:patch.name}:{}),...(own(patch,'parentId')?{parentId:patch.parentId}:{})}:c)});
}
export function reorderObjectLibraryCategory(layout,id,direction){
 const current=normalizeObjectLibraryLayout(layout),categories=[...current.categories],index=categories.findIndex(c=>c.id===id);
 if(index<0||![-1,1].includes(direction))throw Error('Déplacement invalide.');
 const siblings=categories.map((c,i)=>({c,i})).filter(x=>x.c.parentId===categories[index].parentId);
 const position=siblings.findIndex(x=>x.i===index),other=siblings[position+direction]?.i;
 if(other===undefined)return current;
 [categories[index],categories[other]]=[categories[other],categories[index]];
 return normalizeObjectLibraryLayout({...current,categories});
}
export function assignObjectLibraryCategory(layout,definitionId,target=null){
 const current=normalizeObjectLibraryLayout(layout),assignments=Object.assign(Object.create(null),current.assignments);
 if(!clean(definitionId))throw Error('Ressource introuvable.');
 if(target===null)delete assignments[definitionId];else assignments[definitionId]=target;
 return normalizeObjectLibraryLayout({...current,assignments});
}
export function removeObjectLibraryCategory(layout,id){
 const current=normalizeObjectLibraryLayout(layout);
 if(!current.categories.some(c=>c.id===id))throw Error('Catégorie introuvable.');
 if(current.categories.some(c=>c.parentId===id)||Object.values(current.assignments).includes(id))throw Error('Déplace les ressources et sous-catégories avant de retirer ce dossier.');
 return normalizeObjectLibraryLayout({...current,categories:current.categories.filter(c=>c.id!==id)});
}
export function objectLibraryCategoryPath(layout,id){
 const byId=new Map(layout.categories.map(c=>[c.id,c])),out=[];
 let c=byId.get(id);while(c){out.unshift(c);c=byId.get(c.parentId);}
 return out;
}
