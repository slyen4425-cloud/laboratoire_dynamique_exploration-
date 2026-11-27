// A read-only projection of the existing two IndexedDB libraries. No new
// persistent store, placement model, material registry or animation clock.
import {createObjectDefinitionCatalog,createComposedObjectDefinitionCatalog} from '../objects/object-definition-catalog.js';
import {sculptPreviewCollisionCatalog} from '../core/sculpt-preview-object-collisions.js';
import {objectDefinitionFromUserRecord} from '../objects/user-object-library.js';
import {createMaterialRegistry} from '../materials/material-registry.js';
import {materialPackV1} from '../materials/material-pack-v1.js';
import {composeMaterialPackWithUserMaterials} from '../materials/user-material-library.js';
import {resolveWorldObjectAsset} from './world-object-asset-adapter.js';
import {resolveMaterialAsset} from './material-asset-adapter.js';
import {createUserWorldObjectAssetResolver} from './user-world-object-asset-resolver.js';
import {createUserMaterialAssetResolver} from './user-material-asset-resolver.js';
import {createUserMaterialStore} from '../storage/user-material-store.js';
import {createUserWorldObjectStore} from '../storage/user-world-object-store.js';
import {normalizeGraphicAnimation} from './graphic-animation-v1.js';
import {resolveSculptSurfaceMaterial} from '../world/sculpt-surface-paint.js';
function checked(records,kind){
 const seen=new Set();
 for(const r of records){
  const prefix=kind==='object'?'user.object.asset.':'user.texture.';
  const id=r?.assetId;
  const validId=kind==='object'?r?.definitionId?.startsWith('user.objectdef.'):r?.id?.startsWith('user.material.');
  if(!validId||typeof id!=='string'||!id.startsWith(prefix)||seen.has(id)||
    !(r.blob instanceof Blob)||r.blob.size!==r.bytes||r.blob.type!==r.mimeType)
    throw Error('Ressource graphique locale invalide : '+(id??'?'));
  normalizeGraphicAnimation(r.animation,r.width,r.height);seen.add(id);
 }
 return records;
}
export function createSculptGraphicCatalog({objectRecords=[],materialRecords=[],urlApi=globalThis.URL}={}){
 const objects=checked(objectRecords,'object'),materials=checked(materialRecords,'material');
 const definitions=objects.map(objectDefinitionFromUserRecord);
 const catalog=createComposedObjectDefinitionCatalog(definitions);
 if(new Set(definitions.map(d=>d.id)).size!==definitions.length)throw Error('Identifiants objets personnels dupliqués.');
 // Only the historical native collision profiles differ from the visual catalog.
 // Personal definitions have the exact authored collision geometry in both.
 const collisionCatalog=createObjectDefinitionCatalog([...sculptPreviewCollisionCatalog.list(),...definitions]);
 const materialRegistry=createMaterialRegistry(composeMaterialPackWithUserMaterials(materialPackV1,materials));
 let objectResolver,materialResolver;
 try{
  objectResolver=createUserWorldObjectAssetResolver(objects,{urlApi});
  materialResolver=createUserMaterialAssetResolver(materials,{urlApi});
  if(objects.some(r=>!objectResolver.resolve(r.assetId))||materials.some(r=>!materialResolver.resolve(r.assetId)))
    throw Error('Résolution locale des ressources graphiques indisponible.');
 }catch(error){objectResolver?.dispose();materialResolver?.dispose();throw error;}
 return Object.freeze({
  catalog,collisionCatalog,materialRegistry,
  resolveObjectAsset:id=>objectResolver.resolve(id)??resolveWorldObjectAsset(id),
  resolveMaterialAsset:id=>materialResolver.resolve(id)??resolveMaterialAsset(id),
  personalSurfaceChoices:Object.freeze(materials.map(r=>resolveSculptSurfaceMaterial(r.id,materialRegistry)).filter(Boolean)),
  dispose(){objectResolver.dispose();materialResolver.dispose();}
 });
}
export async function loadSculptGraphicCatalog({objectStore=createUserWorldObjectStore(),materialStore=createUserMaterialStore(),urlApi=globalThis.URL}={}){
 const [objectRecords,materialRecords]=await Promise.all([objectStore.list(),materialStore.list()]);
 return createSculptGraphicCatalog({objectRecords,materialRecords,urlApi});
}

// Resolve all personal references BEFORE opening the world or switching its
// library projection. Missing content must never become an empty object or
// a default texture in a reduced saved document.
export function assertSculptWorldGraphicsAvailableV1(world,graphics){
 const requireObjects=objects=>{
  for(const o of objects??[]){
   const id=o.objectDefinitionId;if(!id?.startsWith('user.objectdef.'))continue;
   const d=graphics?.catalog?.get(id);
   if(!d||!graphics.resolveObjectAsset(d.visual?.assetId))
    throw Error('Ressource graphique personnelle manquante : '+id+' · restaure la bibliothèque.');
  }
 };
 const requireSurface=surface=>{
  if(!surface)return;
  const ids=[surface.baseMaterialId,...(surface.routes??[]).map(f=>f.materialId),...(surface.zones??[]).map(f=>f.materialId),...(surface.rivers??[]).map(f=>f.materialId)];
  for(const id of ids){
   if(!id?.startsWith('user.material.'))continue;
   const m=graphics?.materialRegistry?.resolve(id);
   if(!m||!graphics.resolveMaterialAsset(m.assets?.base??m.assets?.center))
    throw Error('Texture personnelle manquante : '+id+' · restaure la bibliothèque.');
  }
 };
 for(const area of world?.areas??[]){
  requireObjects(area.objects);requireSurface(area.surface);
  requireObjects(area.decorativeFringe?.objects);
  for(const chunk of area.decorativeFringe?.chunks??[])requireSurface(chunk.surface);
 }
 return true;
}
