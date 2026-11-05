// Single canonical shipped map catalogue: the creator's three approved
// scene snapshots. No demo presets, procedural generators, duplicate
// WorldDocument, Portals, Spawns or localStorage authority live here.
// Previously shipped generic IDs 101-108 are deliberately retired from the
// selection UI without deleting or migrating existing user WorldDocuments.
import {createSculptMapPreset,readSculptMapPresets}
  from './sculpt-map-preset-library.js?rev=author-maps-three-v1';
import {AUTHOR_SCULPT_MAP_SNAPSHOTS} from './sculpt-author-map-snapshots.js';
import {AUTHOR_SNOW_MAP_SNAPSHOT} from './sculpt-author-snow-map-snapshot.js';

const builtins=Object.freeze([...AUTHOR_SCULPT_MAP_SNAPSHOTS,AUTHOR_SNOW_MAP_SNAPSHOT].map((source,index)=>
  createSculptMapPreset(source.scene,{
    id:'map-preset-'+(109+index),
    name:source.name
  })
));

export function builtinSculptMapPresets(){return builtins;}

export function listAvailableSculptMapPresets(storage){
  // Personal saves remain independent; on a fresh browser the three bundled
  // author maps work immediately, even without a local preset library.
  return Object.freeze([...builtins,...readSculptMapPresets(storage)]);
}
