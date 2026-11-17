// Native Exploration-only Storage façade. Does NOT migrate or change old keys.
// Every historical WorldBuilder/Sculpt/Play serializer remains the sole writer.
// Scoped keys keep authored world drafts, presets and play sessions distinct.
const UNIVERSE=/^unv_[a-z0-9-]{8,80}$/;
const PREFIX='gensrpg.exploration.universe.workspace.v1:';
const isWorkspaceKey=k=>typeof k==='string'&&(
 k.startsWith('gensrpg.world-assembler.')||
 k==='gensrpg.exploration.map-presets.v1'||
 k==='gensrpg-exploration-sculpt-room-templates-v1'||
 k.startsWith('gensrpg.exploration.play.')||
 k.startsWith('gensrpg.exploration.sculpt.')||
 k.startsWith('gensrpg.exploration.interior.')
);
export function createExplorationUniverseWorkspaceStorageV1(storage,id){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function'||
  typeof storage.key!=='function'||!Number.isSafeInteger(storage.length))
  throw new TypeError('Le Storage officiel Exploration est requis');
 if(!UNIVERSE.test(id))throw new TypeError('Identifiant d’univers généré requis');
 const mine=PREFIX+id+':';
 const encoded=key=>isWorkspaceKey(key)?mine+key:key;
 const keys=()=>{
  const visible=[];
  for(let i=0;i<storage.length;i++){
   const key=storage.key(i);
   if(typeof key!=='string')continue;
   if(key.startsWith(PREFIX)){
    if(key.startsWith(mine))visible.push(key.slice(mine.length));
   }else if(!isWorkspaceKey(key))visible.push(key);
  }
  return visible;
 };
 return Object.freeze({
  getItem:key=>storage.getItem(encoded(key)),
  setItem:(key,value)=>storage.setItem(encoded(key),String(value)),
  removeItem:key=>{
   if(typeof storage.removeItem!=='function')throw new Error('Suppression indisponible');
   storage.removeItem(encoded(key));
  },
  key:index=>keys()[index]??null,
  get length(){return keys().length;}
 });
}
