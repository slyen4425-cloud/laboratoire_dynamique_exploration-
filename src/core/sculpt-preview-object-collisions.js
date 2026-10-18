// Isolated pilot of object contact footprints for 2.5D sculpt preview.
// Uses the official ObjectDefinition catalog and Collision World geometry.
// NEVER changes canonical Builder, WorldDocument, or object asset definitions.
import {createObjectDefinitionCatalog,listNativeObjectDefinitions} from '../objects/object-definition-catalog.js';

const PROFILES=Object.freeze({
  building:Object.freeze({widthRatio:.66,heightRatio:.27,offsetX:0,offsetY:-.13}),
  tree:Object.freeze({widthRatio:.28,heightRatio:.19,offsetX:0,offsetY:-.10}),
  rock:Object.freeze({widthRatio:.58,heightRatio:.38,offsetX:0,offsetY:-.18})
});
export const sculptPreviewCollisionCatalog=createObjectDefinitionCatalog(
  listNativeObjectDefinitions().map(def=>{
    const profile=PROFILES[def.kind];
    if(!profile||def.id.startsWith('objectdef.relief.'))return def;
    const base={...def};
    if(def.kind==='building')return {...base,footprint:{enabled:true,...profile}};
    return {...base,collision:{role:'obstacle',shape:'box',...profile}};
  })
);
