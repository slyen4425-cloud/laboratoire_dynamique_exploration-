import {assertExplorationWorldDocumentIdV1} from '../world/world-document-identity-v1.js';
// Exploration reads ONLY an explicit, versioned, same-origin Hero selection
// from the GenSRPG Adventure owner. It never chooses the hero, accesses
// GenSRPG's saved session, stores Blob URLs or invents an asset.
export const ADVENTURE_HERO_SELECTION_SCHEMA_V1=
 'gensrpg.capture.v2.hero-selection.v1';
export const ADVENTURE_HERO_SELECTION_STORAGE_PREFIX_V1=
 'gensrpg.capture.v2.hero-selection.v1:';

function safeId(value,field){
 if(typeof value!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_:.-]{0,129}$/.test(value))
  throw new RangeError('Invalid '+field+' identifier in Adventure hero selection');
 return value;
}
function exact(value,fields){
 if(!value||typeof value!=='object'||Array.isArray(value)||
  Object.keys(value).length!==fields.length||
  fields.some(field=>!Object.hasOwn(value,field)))
  throw new TypeError('Unexpected Adventure hero selection fields');
}
export function adventureHeroSelectionStorageKeyV1(sessionId){
 return ADVENTURE_HERO_SELECTION_STORAGE_PREFIX_V1+safeId(sessionId,'session');
}
export function readScopedAdventureHeroSelectionV1({
 storage,sessionId,worldId
}={}){
 if(typeof storage?.getItem!=='function')
  throw new TypeError('Same-origin temporary Hero selection storage required');
 const key=adventureHeroSelectionStorageKeyV1(sessionId);
 assertExplorationWorldDocumentIdV1(worldId);
 const raw=storage.getItem(key);
 if(raw===null)return null;
 let value;
 try{value=JSON.parse(raw);}
 catch{throw new Error('Adventure hero selection is not readable JSON');}
 exact(value,['schema','version','sessionId','worldId','heroDefinitionId']);
 if(value.schema!==ADVENTURE_HERO_SELECTION_SCHEMA_V1||value.version!==1)
  throw new RangeError('Adventure hero selection schema/version incompatible');
 if(value.sessionId!==sessionId||value.worldId!==worldId)
  throw new Error('Adventure hero selection does not match the current world/session');
 if(typeof value.heroDefinitionId!=='string'||
  !/^hero\.user\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value.heroDefinitionId))
  throw new RangeError('Adventure hero selection must use an authored HeroDefinition ID');
 return value.heroDefinitionId;
}
