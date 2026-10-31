// Isolated pilot of object contact footprints for 2.5D sculpt preview.
// Uses the official ObjectDefinition catalog and Collision World geometry.
// NEVER changes canonical Builder, WorldDocument, or object asset definitions.
import {createObjectDefinitionCatalog,listNativeObjectDefinitions} from '../objects/object-definition-catalog.js?rev=sculpt-bridge-crossing-v55-deck-v70-ramp-v77';

const PROFILES=Object.freeze({
  tree:Object.freeze({widthRatio:.28,heightRatio:.19,offsetX:0,offsetY:-.10}),
  rock:Object.freeze({widthRatio:.58,heightRatio:.38,offsetX:0,offsetY:-.18})
});
export const sculptPreviewCollisionCatalog=createObjectDefinitionCatalog(
  listNativeObjectDefinitions().map(def=>{
    // Buildings use the canonical ObjectDefinition footprint; overriding it
    // here left Sculpt with a second, smaller invisible wall after the V82
    // scaled-house/door fix. Trees and rocks retain their preview profiles.
    const profile=PROFILES[def.kind];
    if(!profile||def.id.startsWith('objectdef.relief.'))return def;
    const base={...def};
    return {...base,collision:{role:'obstacle',shape:'box',...profile}};
  })
);
