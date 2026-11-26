const CATEGORIES = Object.freeze([
  Object.freeze({ id: 'buildings', label: 'Maisons / bâtiments' }),
  Object.freeze({ id: 'vegetation', label: 'Végétation' }),
  Object.freeze({ id: 'rocks', label: 'Rochers' }),
  Object.freeze({ id: 'doors', label: 'Portes / entrées' }),
  Object.freeze({ id: 'stairs', label: 'Escaliers' }),
  Object.freeze({ id: 'bridges', label: 'Ponts' }),
  Object.freeze({ id: 'decor', label: 'Décors' })
]);

const FOLDERS = Object.freeze([
  Object.freeze({"id": "decor/fences", "categoryId": "decor", "label": "Clôtures / barrières", "defaultKind": "decor"}),
  Object.freeze({"id": "decor/storage", "categoryId": "decor", "label": "Caisses / tonneaux / stockage", "defaultKind": "decor"}),
  Object.freeze({"id": "decor/furniture", "categoryId": "decor", "label": "Mobilier intérieur", "defaultKind": "decor"}),
  Object.freeze({"id": "decor/shops", "categoryId": "decor", "label": "Boutiques / boulangeries", "defaultKind": "decor"}),
  Object.freeze({"id": "decor/health", "categoryId": "decor", "label": "Pharmacie / soins", "defaultKind": "decor"}),
  Object.freeze({ id: 'buildings/utility/wind', categoryId: 'buildings', label: 'Moulins / éoliennes animés', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/arenas/elemental', categoryId: 'buildings', label: 'Arènes élémentaires · Monster Capture', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/houses/temperate', categoryId: 'buildings', label: 'Maisons · Tempéré', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/houses/snow', categoryId: 'buildings', label: 'Maisons · Neige', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/houses/sand', categoryId: 'buildings', label: 'Maisons · Sable', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/inns/temperate', categoryId: 'buildings', label: 'Auberges · Tempéré', defaultKind: 'building' }),
  Object.freeze({ id: 'vegetation/trees', categoryId: 'vegetation', label: 'Arbres', defaultKind: 'tree' }),
  Object.freeze({ id: 'vegetation/trees/temperate', categoryId: 'vegetation', label: 'Arbres · Standard', defaultKind: 'tree' }),
  Object.freeze({ id: 'vegetation/trees/snow', categoryId: 'vegetation', label: 'Arbres · Neige', defaultKind: 'tree' }),
  Object.freeze({ id: 'decor/water', categoryId: 'decor', label: 'Eau · Cascades et fontaines', defaultKind: 'decor' }),
  Object.freeze({ id: 'decor/urban', categoryId: 'decor', label: 'Décorations urbaines', defaultKind: 'decor' }),
  Object.freeze({ id: 'vegetation/bushes', categoryId: 'vegetation', label: 'Buissons', defaultKind: 'decor' }),
  Object.freeze({ id: 'vegetation/flowers-grass', categoryId: 'vegetation', label: 'Fleurs / herbes', defaultKind: 'decor' }),
  Object.freeze({ id: 'rocks/general', categoryId: 'rocks', label: 'Rochers', defaultKind: 'rock' }),
  Object.freeze({ id: 'doors/general', categoryId: 'doors', label: 'Portes / entrées', defaultKind: 'door' }),
  Object.freeze({ id: 'stairs/general', categoryId: 'stairs', label: 'Escaliers', defaultKind: 'stairs' }),
  Object.freeze({ id: 'bridges/general', categoryId: 'bridges', label: 'Ponts', defaultKind: 'bridge' }),
  Object.freeze({ id: 'decor/general', categoryId: 'decor', label: 'Décors divers', defaultKind: 'decor' })
]);

function safe(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function listObjectLibraryCategories() {
  return CATEGORIES;
}

export function listObjectLibraryFolders(categoryId = null) {
  const id = safe(categoryId);
  return id
    ? Object.freeze(FOLDERS.filter((folder) => folder.categoryId === id))
    : FOLDERS;
}

export function resolveObjectLibraryCategory(categoryId) {
  const id = safe(categoryId);
  return id
    ? CATEGORIES.find((item) => item.id === id) ?? null
    : null;
}

export function resolveObjectLibraryFolder(folderId) {
  const id = safe(folderId);
  return id
    ? FOLDERS.find((item) => item.id === id) ?? null
    : null;
}

export function categoryIdFromFolderId(folderId) {
  const id = safe(folderId);
  if (!id) return null;
  const known = resolveObjectLibraryFolder(id);
  if (known) return known.categoryId;
  const first = id.split('/')[0];
  return resolveObjectLibraryCategory(first)?.id ?? null;
}

export function defaultObjectKindForFolder(folderId) {
  return resolveObjectLibraryFolder(folderId)?.defaultKind ?? 'decor';
}

export function createCustomObjectLibraryFolder({
  categoryId,
  parentFolderId,
  label,
  idToken
} = {}) {
  const category = resolveObjectLibraryCategory(categoryId);
  const parent = safe(parentFolderId);
  const safeLabel = safe(label);
  const token = safe(idToken)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!category || !safeLabel || !token) {
    throw new Error('Invalid custom object library folder');
  }

  const base =
    parent && categoryIdFromFolderId(parent) === category.id
      ? parent
      : category.id;

  return Object.freeze({
    id: `${base}/${token}`,
    categoryId: category.id,
    label: safeLabel,
    defaultKind: defaultObjectKindForFolder(parent)
  });
}

// One presentation hierarchy for native and personal definitions. Folder IDs
// stored in older worlds/records remain unchanged. These are presentation
// paths, never placement kinds or new asset identities.
const displayFolders=Object.freeze({
 'buildings/houses/temperate':['Maisons','Standard'],
 'buildings/houses/snow':['Maisons','Neige'],
 'buildings/houses/sand':['Maisons','Sable'],
 'buildings/inns/temperate':['Bâtiments','Auberges','Standard'],
 'buildings/utility/wind':['Bâtiments','Moulins / éoliennes'],
 'buildings/arenas/elemental':['Arènes','Élémentaires'],
 'vegetation/trees':['Végétation','Arbres','Standard'],
 'vegetation/trees/temperate':['Végétation','Arbres','Standard'],
 'vegetation/trees/snow':['Végétation','Arbres','Neige'],
 'vegetation/bushes':['Végétation','Buissons'],
 'vegetation/flowers-grass':['Végétation','Fleurs / herbes'],
 'decor/fences':['Décorations','Urbain','Clôtures / barrières'],
 'decor/storage':['Décorations','Urbain','Caisses / tonneaux'],
 'decor/urban':['Décorations','Urbain'],
 'decor/water':['Décorations','Eau','Cascades / fontaines'],
 'decor/furniture':['Décorations','Intérieur','Mobilier'],
 'decor/shops':['Décorations','Intérieur','Boutiques'],
 'decor/health':['Décorations','Intérieur','Soins / pharmacie'],
 'decor/general':['Décorations','Divers'],
 'rocks/general':['Rochers'],
 'doors/general':['Portes / entrées'],
 'stairs/general':['Escaliers'],
 'bridges/general':['Ponts']
});
const rootOrder=['Maisons','Bâtiments','Arènes','Décorations','Végétation','Rochers','Portes / entrées','Escaliers','Ponts'];
export function objectLibraryDisplayPath(definition){
 const library=definition?.library??{},id=safe(definition?.id),folder=safe(library.folderId);
 // Historical native folder metadata is coarser than the actual asset type.
 // Only known native families get this read-only refinement; custom folders
 // always keep the author's chosen hierarchy.
 if(library.provenance!=='user-local'){
  if(id.startsWith('objectdef.waterfall.')||id.startsWith('objectdef.relief.waterfall.'))
   return [...displayFolders['decor/water']];
  if(definition?.kind==='tree'&&id.startsWith('objectdef.tree.snow.'))
   return [...displayFolders['vegetation/trees/snow']];
  if(definition?.kind==='building'&&id.startsWith('objectdef.building.house.snow_'))
   return [...displayFolders['buildings/houses/snow']];
 }
 if(displayFolders[folder])return [...displayFolders[folder]];
 const parent=Object.keys(displayFolders).filter(p=>folder.startsWith(p+'/')).sort((a,b)=>b.length-a.length)[0];
 if(parent){
  const rest=folder.slice(parent.length+1).split('/').filter(Boolean);
  return [...displayFolders[parent],...rest.map((s,i)=>i===rest.length-1?(safe(library.folderLabel)||s.replace(/-/g,' ')):s.replace(/-/g,' '))];
 }
 const category=safe(library.categoryId)||categoryIdFromFolderId(folder);
 const root=({buildings:'Bâtiments',vegetation:'Végétation',decor:'Décorations',rocks:'Rochers',doors:'Portes / entrées',stairs:'Escaliers',bridges:'Ponts'})[category]??'Divers';
 return [root,...(folder.includes('/')?[safe(library.folderLabel)||folder.split('/').at(-1)]:[])];
}
export function buildObjectLibraryTree(definitions=[],query=''){
 const search=safe(query).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const root={children:new Map(),definitions:[]},seen=new Set();
 for(const def of definitions){
  if(!def?.id||seen.has(def.id))continue;seen.add(def.id);
  const path=objectLibraryDisplayPath(def);
  if(search&&!search.split(/\s+/).every(word=>normalize([def.label??'',...path].join(' ')).includes(word)))continue;
  let node=root;
  for(const label of path){
   if(!node.children.has(label))node.children.set(label,{label,children:new Map(),definitions:[]});
   node=node.children.get(label);
  }
  node.definitions.push(def);
 }
 const collator=new Intl.Collator('fr',{numeric:true,sensitivity:'base'});
 const sort=(a,b)=>collator.compare(a.label,b.label);
 const freezeNode=(node,depth=0)=>{
  const children=[...node.children.values()].sort((a,b)=>{
   if(depth===0){
    const ai=rootOrder.indexOf(a.label),bi=rootOrder.indexOf(b.label);
    if(ai!==bi)return (ai<0?999:ai)-(bi<0?999:bi);
   }
   return sort(a,b);
  }).map(child=>freezeNode(child,depth+1));
  const definitions=[...node.definitions].sort(sort);
  return Object.freeze({label:node.label??'',children:Object.freeze(children),definitions:Object.freeze(definitions),
   count:definitions.length+children.reduce((sum,child)=>sum+child.count,0)});
 };
 return freezeNode(root);
}
