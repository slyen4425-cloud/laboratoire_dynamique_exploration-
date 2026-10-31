// Self-contained optional heightfield experiment. Never changes the live 2D Builder.
import {createMaterialRegistry} from './materials/material-registry.js';
import {materialPackV1} from './materials/material-pack-v1.js';
import {resolveMaterialAsset} from './assets/material-asset-adapter.js';
import {createSculptTerrain,sculptDemo,applySculptStroke,applySculptWaterStroke,sculptWaterAt,serializeSculptTerrain,importSculptTerrain,sculptHeightAt,sculptFaces,appendSculptSphere,removeSculptSphereAt,sculptSphereAt,sculptSphereDisplacementAt,sculptTerrainRampProjections,appendSculptTerrainRamp,removeSculptTerrainRampAt} from './world/sculpt-height-model.js?rev=terrain-sculpt-ramp-v77-r2';
import {SCULPT_TILE,drawSculptTerrain,drawSculptBrushPreview,SCULPT_PREVIEW_RIBBONS} from './render/sculpt-height-renderer.js?rev=sculpt-whole-hill-v61-sphere-v76-volume-r2-frustum-r9-depth-r11-altitude-r12-grass-corners-hero-r13-square-corners-r14';
import {drawSculptSphereCursor} from './render/sculpt-sphere-mesh.js?rev=real-spherical-v76-volume-r2-frustum-r9-depth-r11-altitude-r12';
import {resolveSculptCliffAtlasUrl} from './render/sculpt-cliff-atlas.js';
import {resolveSculptCliffHDUrl,sculptCliffHDReady} from './render/sculpt-cliff-hd.js';
import {sculptCameraView,sculptCameraProject,sculptCameraProjectBridgeFoot,sculptCameraProjectBridgeCorridor,sculptCameraWorldInput,sculptCameraBounds,sculptCameraScreenToWorld,sculptCameraGameView,sculptCameraInteriorView,sculptCameraFollowActor} from './render/sculpt-camera-projection.js?rev=interior-v79-r3d-actor-follow';
import {drawSculptSkyBackdrop} from './render/sculpt-sky-backdrop.js';
import {stepMovement} from './core/movement.js?rev=bridge-grade-v69-deck-v70-rails-v71-north-r2-sphere-v76-stairs-v78-ramp-v77';
import {SCULPT_NAVIGATION_PROBE_DEFAULTS,sculptNavigationSample,sculptNavigationBlockDetail,sculptSphereProjectionBlock,sculptBridgeDeckAt,sculptBridgeDeckHeight} from './core/sculpt-navigation-collision.js?rev=sculpt-stairs-dynamic-height-v78-ramp-v77';
import {sculptStairHeightAt} from './core/sculpt-stair-traversal.js?rev=natural-ramp-v77';
import {sculptRampVisualMesh} from './render/sculpt-ramp-renderer.js?rev=terrain-native-v77-r2';
import {normalizeWorldArea} from './world/world-area-model.js?rev=interior-r3c-wall-materials';
import {INTERIOR_DOOR_ASSETS,INTERIOR_CONNECTOR_ASSETS} from './world/interior-material-catalog.js';
import {worldAreaBoundaryPoints,pointInWorldAreaBoundary} from './world/world-area-geometry.js';
import {sculptInteriorShapeId,resizeSculptInterior} from './world/sculpt-interior-layout.js?rev=interior-r3c-shapes';
import {appendInteriorWall,removeInteriorWallNear,INTERIOR_WALL_LIMIT,snapInteriorWallPoint} from './world/interior-wall-model.js';
import {drawSculptInteriorWalls} from './render/sculpt-interior-walls.js?rev=interior-v79-r3e-no-stair-marker';
import {SCULPT_EXTERIOR_AREA_ID,SCULPT_INTERIOR_LIMIT,
 SCULPT_INTERIOR_TEMPLATE_LIMIT,SCULPT_INTERIOR_FLOOR_LIMIT,createSculptInteriorArea,createSculptUpperFloor,updateSculptInterior,updateSculptInteriorDoor,updateSculptFloorConnector,
 serializeSculptInteriors,importSculptInteriors,sculptInteriorTransition,sculptInteriorAvailablePortal,
 normalizeSculptInteriorTemplates,createSculptInteriorTemplate,
 applySculptInteriorTemplate} from './world/sculpt-interior-area-link.js?rev=interior-v79-r3d-connector-rotation';
import {sculptPreviewCollisionCatalog} from './core/sculpt-preview-object-collisions.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71-ramp-v77&house=canonical-v1';
import {sculptNavigationFrameSteps} from './core/sculpt-navigation-frame-clock.js';
import {sculptVisualHeightStep} from './core/sculpt-visual-height-step.js';
import {sculptAltitudeVisualState} from './render/sculpt-altitude-visual.js?rev=hero-depth-v76-r13';
import {createVirtualStick} from './input/virtual-stick.js';
import {resolveMapActorAsset,createMapActorAssetResolver} from './assets/map-actor-asset-adapter.js';
import {createImageAssetLoader} from './assets/image-asset-loader.js';
import {createCaptureActorPreviewProviderV1} from './capture/capture-actor-preview-loader-v1.js';
import {createPlacedMapActorView} from './actors/placed-map-actor-view.js';
import {createMapActorVisualPreparer} from './assets/map-actor-visual-preparer.js';
import {createMapActorRenderer} from './render/map-actor-renderer.js';
import {normalizeMapActorVisual} from './actors/map-actor-visual-model.js';
import {resolveWorldObjectAsset} from './assets/world-object-asset-adapter.js?rev=waterfalls-v3';
import {drawWorldObjectSprite} from './render/world-object-frame-selector.js?rev=waterfalls-v3';
import {prepareSculptBridgeImage} from './assets/sculpt-bridge-alpha.js?rev=sculpt-bridge-foot-clean-v58';
import {objectDefinitionCatalogV1} from './objects/object-definition-catalog.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71-waterfalls-v3-ramp-v77';
import {resolveWorldObjectPlacements} from './world/world-object-placement-model.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71-waterfalls-v3-ramp-v77';
import {sculptObjectVisualRect,findSculptVisualObjectAtPoint} from './render/sculpt-object-picking.js?rev=sculpt-bridge-deck-anchor-v67-deck-v70-rails-v71-directions-v72-stairs-dynamic-v78-ramp-v77';
import {sculptBridgeForegroundRegions,sculptBridgeVisualFootLift,sculptBridgeDeckArtShift} from './render/sculpt-bridge-deck-layers.js?rev=sculpt-bridge-deck-anchor-v67-mask-v68-vertical-v73';
import {isBlocked} from './core/collision.js?rev=sculpt-bridge-crossing-v60-deck-v70-rails-v71-north-r2-sphere-v76-stairs-v78';
import {SCULPT_OBJECT_LIMIT,sculptObjectCanOccupyCell,listSculptPlaceableDefinitions,appendSculptPreviewObject,
  updateSculptPreviewObject,sculptPreviewVariants,
  removeSculptPreviewObject,findSculptPreviewObjectNear,serializeSculptPreviewScene,
  importSculptPreviewScene,createBlankSculptPreviewScene,
  appendSculptPreviewActor,removeSculptPreviewActorAt,
  findSculptPreviewActorNear,updateSculptPreviewActor} from './world/sculpt-scene-preview.js?rev=sculpt-bridge-tactile-v64-deck-v70-rails-v71-axes-v72-waterfalls-v3-stairs-visible-r15-ramp-v77';
import {createSculptSurface,normalizeSculptSurface,appendSculptSurfaceStroke,removeSculptSurfaceAt,
  SCULPT_SURFACE_MATERIALS} from './world/sculpt-surface-paint.js';
import {terrainFamilyRegistry} from './world/terrain-family-registry.js';

import {createCaptureCreatureCatalogProvider} from './capture/capture-creature-catalog-provider.js';
import {loadCaptureShowcaseEncounterSourceV1} from './capture/capture-showcase-encounter-source-v1.js';
import {createEncounterController} from './encounters/encounter-controller.js';
import {resolveTerrainFamilyAtPoint} from './encounters/terrain-family-resolver.js';
import {normalizeTerrainFamilyEncounterConfig} from './encounters/terrain-family-encounter-config.js';
import {setAreaEncounterRandomEnabled,updateTerrainFamilyEncounterProfile,
  setTerrainFamilyEncounterElementEnabled} from './builder/world-builder-draft.js?rev=preset-travel-encounters-v2';
import {createSculptEncounterArea,sculptPreviewEncounterConfig} from './encounters/sculpt-encounter-area-adapter.js';
import {snapshotFromEncounterIntent} from './encounters/encounter-bridge.js';
import {launchCombatHandoffNavigation} from './encounters/combat-handoff-navigation.js';
import {resolveExplorationCombatReturn} from './encounters/combat-return.js';
import {createImmersiveEncounterHostV1} from './encounters/immersive-encounter-host-v1.js';
import {createCaptureCombatWarmupV1} from './encounters/capture-combat-warmup-v1.js';
import {createExplorationSoundtrackV1} from './audio/exploration-soundtrack-v1.js?rev=mobile-real-play-r2-audio-fades-r1';
import {findTriggeredPortal,applyPortalTransition,resolvePortalTriggerPoint} from './world/portal-model.js';
import {createSculptMapPreset,saveSculptMapPreset,readSculptMapPresets,
  addImportedSculptMapPreset,importSculptMapPreset,sculptMapPresetFilename,
  serializeSculptMapPresetForShare} from './builder/sculpt-map-preset-library.js?rev=preset-travel-encounters-v2-preset-save-share-v1';
import {sculptWorldAreaScene,saveSculptWorldArea,
  placeSculptWorldPortal,placeSculptWorldSpawn,setSculptWorldPortalLabel} from './builder/sculpt-world-area-link.js';
import {markersForSculptWorldArea} from './builder/sculpt-world-portal-markers.js';
import {readWorldAssemblerHandoff,saveWorldAssemblerHandoff,readWorldAssemblerDraft,saveWorldAssemblerDraft} from './builder/world-assembler-handoff.js';
import {listAvailableSculptMapPresets,builtinSculptMapPresets} from './builder/sculpt-builtin-map-presets.js?rev=preset-travel-encounters-v2';
import {createWorldBuilderDraft,createBuildingInteriorLink,initializeWorldPresetEncounters} from './builder/world-builder-draft.js?rev=preset-travel-encounters-v2';
import {makePlayableZoneRoute,playableExteriorArea} from './builder/sculpt-playable-zone-route.js?rev=preset-travel-encounters-v2';
import {encounterConfigNeedsExplicitInitialization} from './builder/preset-encounter-defaults.js';

const $=id=>document.getElementById(id);
const explorationSoundtrack=createExplorationSoundtrackV1();
window.__sculptExplorationSoundProbe=()=>Object.freeze({
  state:explorationSoundtrack.state,track:explorationSoundtrack.currentTrackId,
  lastError:explorationSoundtrack.lastError,
  mediaReadyState:explorationSoundtrack.mediaReadyState,
  mediaCurrentTime:explorationSoundtrack.mediaCurrentTime
});
window.addEventListener('pagehide',()=>explorationSoundtrack.dispose(),{once:true});
// If Chrome Android rejects the first attempt (for instance after a native
// confirmation dialog), the next actual movement or keyboard gesture resumes
// the SAME player. No fake clicks, timers, or extra audio button.
function retryExplorationAudioFromGesture(event) {
  if(event.isTrusted===false||!navigationTesting||
      (explorationSoundtrack.state!=='blocked'&&explorationSoundtrack.state!=='error'))return;
  explorationSoundtrack.start();
}
document.addEventListener('pointerdown',retryExplorationAudioFromGesture,{capture:true});
document.addEventListener('keydown',retryExplorationAudioFromGesture,{capture:true});
const canvas=$('sculpt-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const registry=createMaterialRegistry(materialPackV1);
let terrain=sculptDemo(),selectedMode='dig',drawing=false,strokeUndo=null;
// V79: one active area at a time. Detached exterior snapshot is a temporary
// editor view of the SAME scene while an interior is open, not a second terrain.
let sculptInteriors=Object.freeze([]),outsideAreaSnapshot=null,activeInteriorId=null;
// World-linked authoring uses exactly one world document. Active terrain is
// transient editor state until committed back to its own WorldArea.
let sculptWorldDraft=null,sculptWorldAreaId=null,sculptWorldPortalPlacement=null;
let sculptWorldAreaMounted=false; // derived from a successful canonical 2.5D WorldArea mount
let sculptInteriorTemplates=Object.freeze([]);
let lastSelectedInteriorHouseId=null; // UI-only selection; each WorldArea owns its own content
let interiorWallMode=null,interiorWallStart=null,interiorWallPreview=null;
let interiorWallGesture=null,interiorDoorMoving=false,interiorDoorGesture=null,interiorDoorPreview=null;
let interiorWallHistory=[],interiorWallRedo=[];
let interiorConnectorMode=false,interiorConnectorGesture=null,interiorConnectorPreview=null;
const SCULPT_INTERIOR_TEMPLATE_STORAGE='gensrpg-exploration-sculpt-room-templates-v1';
let rampStart=null,rampEnd=null,rampGesture=null;
let lastCell='',strokePoints=[],history=[],redoHistory=[],currentTexture=null,zoom=1,pan={x:0,y:0};
let hoverCell=null,previewSummary=null,lastRenderStats=null;
let spherePreviewDismissed=false;
let editorKind='ground',lastGroundMode='dig',lastWaterMode='water-fill';
let precisionCell=null,precisionDragging=false;
let nativeFullscreenEntered=false;
let objectEditing=false,placedObjects=Object.freeze([]),objectHistory=[],objectRedo=[];
let actorSubmode=false,placedActors=Object.freeze([]),actorHistory=[],actorRedo=[];
let actorSelectedId=null;
let captureActorProvider=null,captureActorRenderer=null,captureActorImageLoader=null;
let surface=createSculptSurface(),surfaceEditing=false,surfaceDrawing=false;
// The frozen V80 HTML lacks the newer semantic palette. The shared module
// supports its existing WorldSurface authoring without a second control path.
const surfaceBaseFamilySelect=$('surface-base-family');
const surfacePaintFamilySelect=$('surface-family');
if(Boolean(surfaceBaseFamilySelect)!==Boolean(surfacePaintFamilySelect))
  throw Error('Incomplete terrain family palette in sculpt editor HTML');
if(surfaceBaseFamilySelect){
  for(const selector of [surfaceBaseFamilySelect,surfacePaintFamilySelect])
    selector.replaceChildren(...terrainFamilyRegistry.list().map(f=>new Option(f.label,f.id)));
  surfaceBaseFamilySelect.value=surface.baseTerrainFamilyId;
  surfacePaintFamilySelect.value=surface.baseTerrainFamilyId;
}
let surfaceStrokePoints=[],surfaceLastCell='',surfaceHistory=[],surfaceRedo=[];
const surfacePaintImages=new Map();
let objectSelectedId=null,objectDrag=null;
const objectImages=new Map(),availableObjects=listSculptPlaceableDefinitions();
const interiorVisualImages=new Map();
for(const visual of [...INTERIOR_DOOR_ASSETS,...INTERIOR_CONNECTOR_ASSETS]){
  if(!visual.path)continue;
  const pic=new Image();pic.onload=()=>scheduleDraw();
  pic.onerror=()=>scheduleDraw();pic.src=visual.path;
  interiorVisualImages.set(visual.id,pic);
}
function objectImage(assetId){
  if(objectImages.has(assetId))return objectImages.get(assetId);
  const resolved=resolveWorldObjectAsset(assetId);
  if(!resolved)return null;
  const picture=new Image();
  const sourceCleaned2p5d=resolved.kind==='bridge-visual'&&
    resolved.path.includes('_2p5d_');
  picture.onload=()=>{
    // V74: 28 native 2.5D WebPs have already been cleaned AT SOURCE.
    // Do not alpha-erase their legitimate pale stones/rails a second time.
    // Historic bridge assets retain the existing V56 runtime fallback.
    if(resolved.kind==='bridge-visual'&&!sourceCleaned2p5d)
      objectImages.set(assetId,prepareSculptBridgeImage(picture));
    scheduleDraw();
  };
  picture.onerror=()=>status('Impossible de charger le visuel '+assetId);
  // Image-cache revision ONLY; the asset resolver and IDs remain unchanged.
  picture.src=sourceCleaned2p5d?resolved.path+'?source-clean-v74':resolved.path;
  objectImages.set(assetId,picture);
  return picture;
}
let navigationTesting=false,navActor=null,navFrame=0,navPreviousTime=null,navStick=null;

const sculptEncounterDialog=$('sculpt-encounter-preview');
// The frozen V80 page intentionally exposes no encounter UI; the editor's
// new 2.5D Tester reuses exactly the same runtime Encounter Controller class,
// catalog and bridge as the 2D Exploration game.
const sculptCombatWarmup=createCaptureCombatWarmupV1({
  documentUrl:document.URL,
  fetchImpl:(url,opts)=>window.fetch(url,opts),
  schedule:callback=>typeof window.requestIdleCallback==='function'
    ?window.requestIdleCallback(callback,{timeout:3000})
    :window.setTimeout(callback,300),
  saveData:window.navigator?.connection?.saveData===true
});
const sculptEncounterTest=new URL(document.URL).searchParams.get('encounterTest')==='1';
const sculptEncounterController=sculptEncounterDialog?createEncounterController({
  checkDistance:sculptEncounterTest?80:160
}):null;
const sculptEncounterCatalog=sculptEncounterController
  ?createCaptureCreatureCatalogProvider(await loadCaptureShowcaseEncounterSourceV1()):null;
const sculptEncounterRandom=sculptEncounterTest?()=>0:Math.random;
let sculptPendingEncounter=null;
let sculptEncounterSetupOffered=false;
let sculptEncounterAreaCache=null;

/* The Builder is the ONE authoring owner of EncounterConfig v1 and Area
 * encounters.randomEnabled. This panel invokes its existing commands and
 * edits the same objects that Scene export serializes and Tester consumes.
 * No separate spawn map, material table or Capture rarity authority. */
let sculptEncounterConfig=sculptPreviewEncounterConfig;
let sculptExteriorEncounters=Object.freeze({randomEnabled:true});
const sculptEncounterEditor=$('sculpt-encounter-editor');
let selectedSculptEncounterFamilyId=surface.baseTerrainFamilyId;
function sculptEncounterProfile(){
  return sculptEncounterConfig.families.find(
    f=>f.terrainFamilyId===selectedSculptEncounterFamilyId)??null;
}
function sculptEncounterAreaEnabled(){
  return activeInteriorId
    ?sculptInteriors.find(e=>e.area.id===activeInteriorId)?.area.encounters.randomEnabled===true
    :sculptExteriorEncounters.randomEnabled;
}
function refreshSculptEncounterAuthoringStatus(){
  if(!sculptEncounterEditor)return;
  const profile=sculptEncounterProfile();
  const elementCount=profile?.elementChances.filter(x=>x.chancePercent>0).length??0;
  const invalid=!!profile&&profile.encounterChancePercent>0&&elementCount===0;
  const statusOutput=$('sculpt-encounter-authoring-status');
  statusOutput.dataset.invalid=String(invalid);
  statusOutput.textContent=invalid
    ?'Choisis au moins un élément, sinon cette famille ne pourra pas générer de créature.'
    :profile?.encounterChancePercent===0
      ?'0 % : aucune rencontre aléatoire pour cette famille.'
      :elementCount+' élément(s) sélectionné(s). La rareté des créatures reste celle de Capture.';
}
function refreshSculptEncounterEditor(){
  if(!sculptEncounterEditor)return;
  const families=terrainFamilyRegistry.list();
  const ids=new Set(families.map(x=>x.id));
  if(!ids.has(selectedSculptEncounterFamilyId))
    selectedSculptEncounterFamilyId=ids.has(surface.baseTerrainFamilyId)
      ?surface.baseTerrainFamilyId:families[0]?.id??'';
  const select=$('sculpt-encounter-family');
  if(select.options.length!==families.length)
    select.replaceChildren(...families.map(x=>new Option(x.label,x.id)));
  select.value=selectedSculptEncounterFamilyId;
  const enabled=sculptEncounterAreaEnabled();
  $('sculpt-encounter-area-enabled').checked=enabled;
  $('sculpt-encounter-area-status').textContent=
    (activeInteriorId?'Pièce / étage actuel':'Extérieur')+' · '+(enabled
      ?'rencontres autorisées':'rencontres désactivées')+
    ' (règle de cette WorldArea, pas de la texture)';
  const familyName=families.find(x=>x.id===selectedSculptEncounterFamilyId)?.label??'';
  const baseName=families.find(x=>x.id===surface.baseTerrainFamilyId)?.label??'';
  $('sculpt-encounter-family-hint').textContent=
    surface.baseTerrainFamilyId===selectedSculptEncounterFamilyId
      ?'Cette famille est le sol de base : aucune peinture nécessaire.'
      :'Sol de base : '+baseName+'. '+familyName+' s’applique sur les zones et routes de cette famille.';
  const profile=sculptEncounterProfile();
  $('sculpt-encounter-chance').value=String(profile?.encounterChancePercent??0);
  $('sculpt-encounter-chance-value').textContent=
    String(Math.round(profile?.encounterChancePercent??0))+' %';
  const container=$('sculpt-encounter-elements');
  container.replaceChildren();
  const checked=new Set((profile?.elementChances??[])
    .filter(x=>x.chancePercent>0).map(x=>x.elementId));
  for(const element of sculptEncounterCatalog.listElements()){
    const line=document.createElement('label'),input=document.createElement('input');
    input.type='checkbox';input.checked=checked.has(element.id);
    input.dataset.elementId=element.id;
    input.setAttribute('aria-label','Autoriser '+element.label);
    const count=sculptEncounterCatalog.findByElement(element.id)
      .filter(x=>x.spawnChance>0).length;
    const name=document.createElement('span');
    name.textContent=element.label+' · '+count+' créature(s)';
    input.addEventListener('change',()=>{
      const updated=setTerrainFamilyEncounterElementEnabled(
        {encounterConfig:sculptEncounterConfig},
        selectedSculptEncounterFamilyId,element.id,input.checked
      );
      sculptEncounterConfig=normalizeTerrainFamilyEncounterConfig(updated.encounterConfig);
      refreshSculptEncounterAuthoringStatus();
    });
    line.append(input,name);container.append(line);
  }
  $('sculpt-encounter-catalog-summary').textContent=
    'Capture · '+sculptEncounterCatalog.listCreatures().length+
    ' créatures · '+sculptEncounterCatalog.listElements().length+
    ' éléments · rareté individuelle conservée';
  refreshSculptEncounterAuthoringStatus();
}
function setSculptEncounterEditorOpen(on){
  if(!sculptEncounterEditor)return;
  if(on&&sculptPendingEncounter)return;
  if(on){
    if(navigationTesting)setNavigationTesting(false);
    if(surfaceEditing)setSurfaceEditing(false);
    if(objectEditing)setObjectEditing(false);
  }
  sculptEncounterEditor.hidden=!on;
  document.body.classList.toggle('sculpt-encounter-editing',on);
  $('mode-encounters').classList.toggle('active',on);
  $('mode-encounters').setAttribute('aria-pressed',String(on));
  if(on)refreshSculptEncounterEditor();
}
if(sculptEncounterEditor){
  $('mode-encounters').addEventListener('click',
    ()=>setSculptEncounterEditorOpen(sculptEncounterEditor.hidden));
  $('sculpt-encounter-close').addEventListener('click',
    ()=>setSculptEncounterEditorOpen(false));
  for(const id of ['mode-ground','mode-water','mode-objects','mode-surface']){
    $(id).addEventListener('click',()=>setSculptEncounterEditorOpen(false));
  }
  $('sculpt-encounter-family').addEventListener('change',()=>{
    selectedSculptEncounterFamilyId=$('sculpt-encounter-family').value;
    refreshSculptEncounterEditor();
  });
  $('sculpt-encounter-chance').addEventListener('input',()=>{
    const chance=Number($('sculpt-encounter-chance').value);
    const updated=updateTerrainFamilyEncounterProfile(
      {encounterConfig:sculptEncounterConfig},selectedSculptEncounterFamilyId,
      {encounterChancePercent:chance}
    );
    sculptEncounterConfig=normalizeTerrainFamilyEncounterConfig(updated.encounterConfig);
    $('sculpt-encounter-chance-value').textContent=Math.round(chance)+' %';
    refreshSculptEncounterAuthoringStatus();
  });
  $('sculpt-encounter-area-enabled').addEventListener('change',()=>{
    const area=navigationEncounterArea();
    const changed=setAreaEncounterRandomEnabled(
      {areas:[area]},area.id,$('sculpt-encounter-area-enabled').checked
    );
    const encounters=Object.freeze({...changed.areas[0].encounters});
    if(activeInteriorId){
      const entry=sculptInteriors.find(e=>e.area.id===activeInteriorId);
      if(!entry)throw Error('WorldArea intérieure absente');
      const nextArea=normalizeWorldArea({...entry.area,encounters});
      sculptInteriors=Object.freeze(sculptInteriors.map(e=>
        e.area.id===entry.area.id?updateSculptInterior(e,{area:nextArea}):e
      ));
    }else{
      sculptExteriorEncounters=encounters;
    }
    sculptEncounterAreaCache=null;
    refreshSculptEncounterEditor();
  });
  window.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&!sculptEncounterEditor.hidden)
      setSculptEncounterEditorOpen(false);
  });
}
window.__sculptEncounterEditorProbe=()=>Object.freeze({
  available:!!sculptEncounterEditor,open:!!sculptEncounterEditor&&!sculptEncounterEditor.hidden,
  familyId:selectedSculptEncounterFamilyId,
  chance:sculptEncounterProfile()?.encounterChancePercent??null,
  enabledElementIds:(sculptEncounterProfile()?.elementChances??[])
    .filter(x=>x.chancePercent>0).map(x=>x.elementId),
  allowedInArea:sculptEncounterAreaEnabled(),
  areaId:activeInteriorId??sculptWorldAreaId??SCULPT_EXTERIOR_AREA_ID,
  configFamilyCount:sculptEncounterConfig.families.length
});

function navigationEncounterArea(){
  const areaId=activeInteriorId??sculptWorldAreaId??SCULPT_EXTERIOR_AREA_ID;
  const interior=activeInteriorId?sculptInteriors.find(e=>e.area.id===activeInteriorId):null;
  const worldArea=sculptWorldDraft?.areas.find(e=>e.id===sculptWorldAreaId)??null;
  if(activeInteriorId&&!interior)throw Error('WorldArea intérieure introuvable pour rencontre');
  if(sculptEncounterAreaCache?.areaId===areaId&&
     sculptEncounterAreaCache.surface===surface&&
     sculptEncounterAreaCache.terrain===terrain&&
     sculptEncounterAreaCache.existingArea===(interior?.area??worldArea)&&
     sculptEncounterAreaCache.exteriorEncounters===sculptExteriorEncounters)
    return sculptEncounterAreaCache.projected;
  const projected=createSculptEncounterArea({
    areaId,existingArea:interior?.area??worldArea??null,surface,
    exteriorEncounters:sculptExteriorEncounters,
    width:terrain.width*SCULPT_TILE.width,height:terrain.height*SCULPT_TILE.height
  });
  sculptEncounterAreaCache={
    areaId,surface,terrain,existingArea:interior?.area??worldArea,
    exteriorEncounters:sculptExteriorEncounters,projected
  };
  return projected;
}
function sculptEncounterStep(){
  if(!sculptEncounterController||!navigationTesting||!navActor||sculptPendingEncounter)
    return null;
  const area=navigationEncounterArea();
  const intent=sculptEncounterController.step({
    area,player:{currentAreaId:area.id,x:navActor.x,y:navActor.y},
    encounterConfig:sculptEncounterConfig,
    captureCatalog:sculptEncounterCatalog,
    playerPartyRef:'capture-party-player-v1',rulesetId:'capture.standard.1v1',
    random:sculptEncounterRandom
  });
  if(!intent)return null;
  sculptPendingEncounter=snapshotFromEncounterIntent(intent);
  navActor.moving=false;
  navKeys.clear();navStick?.reset();
  const creatureId=sculptPendingEncounter.opponents[0].creatureId;
  // Prewarm only the two real author-selected creature portraits while the
  // player reads the encounter dialog. No gameplay change or visual fallback.
  void sculptCombatWarmup.warmCreature(creatureId);
  const creature=sculptEncounterCatalog.resolveCreature(creatureId);
  $('sculpt-encounter-summary').textContent=
    (creature?.name??creatureId)+' · '+sculptPendingEncounter.context.terrainFamilyId+
    ' · élément '+sculptPendingEncounter.context.elementId;
  sculptEncounterDialog.hidden=false;
  scheduleDraw();
  return sculptPendingEncounter;
}
function releaseSculptEncounter(){
  if(!sculptPendingEncounter)return false;
  if(!sculptEncounterController.release(sculptPendingEncounter.encounterId))return false;
  sculptPendingEncounter=null;
  sculptEncounterDialog.hidden=true;
  $('sculpt-encounter-summary').textContent='';
  navKeys.clear();navStick?.reset();
  return true;
}
const sculptEncounterHost=sculptEncounterController?createImmersiveEncounterHostV1({
  windowRef:window,documentRef:document,storage:window.sessionStorage,
  onCompleted(envelope){
    if(!sculptPendingEncounter||
       envelope.snapshot.encounterId!==sculptPendingEncounter.encounterId||
       envelope.snapshot.returnToken!==sculptPendingEncounter.returnToken)return false;
    const area=navigationEncounterArea();
    const restored=resolveExplorationCombatReturn({
      envelope,worldDocument:{areas:[area]}
    });
    if(!releaseSculptEncounter())return false;
    // Only the existing Exploration actor position owns x/y. Combat sends a
    // validated result, never a replacement scene or actor position.
    navActor.x=restored.x;navActor.y=restored.y;navActor.moving=false;
    navVisualLevel=navHeight();
    // Return uses the same Navigation camera slider as before the fight.
    // The fullscreen resize handler above enforces it again after overlay removal.
    zoom=navigationCameraZoom();
    $('zoom').value=String(Math.round(zoom*100));
    centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
    // Combat owns its audio until the validated iframe closes. Resume in
    // a microtask after the host has destroyed the iframe, without overlap.
    queueMicrotask(()=>{if(navigationTesting)explorationSoundtrack.fadeIn({durationMs:900});});
    status('Combat terminé : '+restored.outcome+' · exploration reprise');
    return true;
  }
}):null;
if(sculptEncounterDialog){
  $('sculpt-encounter-combat').addEventListener('click',()=>{
    if(!sculptPendingEncounter||sculptEncounterHost.active)return;
    explorationSoundtrack.fadeOut({durationMs:600}); // Transition vers la musique native Combat, sans coupure brusque.
    const player={currentAreaId:navigationEncounterArea().id,x:navActor.x,y:navActor.y};
    try{
      launchCombatHandoffNavigation({
        snapshot:sculptPendingEncounter,player,
        storage:window.sessionStorage,documentUrl:document.URL,
        navigate(url){sculptEncounterHost.open({url,snapshot:sculptPendingEncounter});}
      });
    }catch(error){
      explorationSoundtrack.fadeIn({durationMs:650});
      status('Combat indisponible : '+error.message);
    }
  });
  $('sculpt-encounter-continue').addEventListener('click',releaseSculptEncounter);
}
window.__sculptEncounterProbe=()=>Object.freeze({
  supported:!!sculptEncounterController,
  testing:navigationTesting,
  areaId:activeInteriorId??SCULPT_EXTERIOR_AREA_ID,
  terrainFamilyId:navActor?(
    navigationEncounterArea().surface&&
    // Diagnostic reads the original Encounter resolver, not renderer pixels.
    resolveTerrainFamilyAtPoint(navigationEncounterArea().surface,navActor.x,navActor.y).terrainFamilyId
  ):null,
  pending:!!sculptPendingEncounter,
  encounterId:sculptPendingEncounter?.encounterId??null,
  creatureId:sculptPendingEncounter?.opponents[0]?.creatureId??null,
  elementId:sculptPendingEncounter?.context.elementId??null,
  overlayVisible:sculptEncounterDialog?!sculptEncounterDialog.hidden:false,
  combatActive:sculptEncounterHost?.active??false
});

let navHeroRenderTransform=null; // diagnostic only: actual Canvas matrix at sprite draw
// Display-only altitude, separate from native Collision World coordinates.
let navVisualLevel=null;
const navKeys=new Set();
// Preview-only navigation speed; authoritative runtime movement remains unchanged.
const navSpeed=()=>Math.max(90,Math.min(360,Number($('navigation-speed').value)||220));
let navViewport=null,navLastState='',navBlocked=false,navBlockReason=null;
let navFps=0,navStepSpeed=0,navMetricLast=0,navMetricFrames=0,navMetricDistance=0;
// Passive real-RAF diagnostic: how much simulation time truly processed input.
// Does not influence movement, encounter cadence, collisions or camera.
let navInputElapsedMs=0;
let navTerrainCache=null,navSkyCache=null,terrainRasterBuilds=0;
let cliffAtlasImage=null,cliffAtlasReady=false,cliffAtlasError=false;
const cliffAtlasLoader=new Image();
cliffAtlasLoader.onload=()=>{
  cliffAtlasImage=cliffAtlasLoader;cliffAtlasReady=true;
  navTerrainCache=null;scheduleDraw();
};
cliffAtlasLoader.onerror=()=>{
  cliffAtlasError=true;
  status('Texture de roche absente : rendu classique conservé');
};
cliffAtlasLoader.src=resolveSculptCliffAtlasUrl();
let cliffHDImage=null,cliffHDLoaded=false;
const cliffHDLoader=new Image();
cliffHDLoader.onload=()=>{
  if(!sculptCliffHDReady(cliffHDLoader)){
    status('Asset roche HD non conforme : rendu V48 conservé');return;
  }
  cliffHDImage=cliffHDLoader;cliffHDLoaded=true;
  navTerrainCache=null;scheduleDraw();
};
cliffHDLoader.onerror=()=>status('Base HD absente : roches V48 conservées');
cliffHDLoader.src=resolveSculptCliffHDUrl();
// Background only. Cache by actual viewport + sky options, not by character
// position or frame: stars/clouds never allocate a new canvas each movement.
function navigationSkyBackdrop(width,height){
  const time=$('navigation-sky-time').value;
  const clouds=$('navigation-sky-clouds').checked;
  const mist=$('navigation-sky-mist').checked;
  const stars=$('navigation-sky-stars').checked;
  const key=[Math.ceil(width),Math.ceil(height),time,clouds,mist,stars].join('|');
  if(navSkyCache?.key===key)return navSkyCache;
  const scale=Math.min(1.5,Math.max(1,window.devicePixelRatio||1));
  const image=document.createElement('canvas');
  image.width=Math.ceil(width*scale);image.height=Math.ceil(height*scale);
  const imageCtx=image.getContext('2d',{alpha:false});
  imageCtx.setTransform(scale,0,0,scale,0,0);
  const stats=drawSculptSkyBackdrop(imageCtx,{width,height,time,clouds,mist,stars});
  return navSkyCache={key,image,stats};
}
function navigationCameraZoom(){return Math.max(1,Math.min(2.4,Number($('navigation-camera-zoom').value)/100||1.75));}
/* Only the static sculpt raster is cached. Actor, objects, collision, input,
   camera and height data retain their existing owners and update separately. */
function navigationBackground(){
  const rockPalette=$('rock').value,materialId=displayedBaseMaterialId();
  const signature=[rockPalette,materialId,
    cliffAtlasReady,cliffHDLoaded,!!$('rock-moss')?.checked,
     sphereTexturesLoaded,
    ribbonTextures.water?.visible,ribbonTextures.road?.visible,
    ribbonTextures.water?.material?.id,ribbonTextures.road?.material?.id].join('|');
  const same=navTerrainCache&&navTerrainCache.terrain===terrain&&
    navTerrainCache.texture===currentTexture&&navTerrainCache.signature===signature&&
    navTerrainCache.waterTexture===ribbonTextures.water?.texture&&
    navTerrainCache.roadTexture===ribbonTextures.road?.texture&&
    navTerrainCache.paintSurface===surface;
  if(same)return navTerrainCache;
  const paddingX=18,paddingY=7*SCULPT_TILE.rise+18;
  const raster=document.createElement('canvas');
  const scale=Math.min(1.5,Math.max(1,window.devicePixelRatio||1));
  raster.width=Math.ceil((terrain.width*SCULPT_TILE.width+paddingX*2)*scale);
  raster.height=Math.ceil((terrain.height*SCULPT_TILE.height+paddingY+20)*scale);
  const imageContext=raster.getContext('2d',{alpha:true});
  imageContext.scale(scale,scale);
  imageContext.translate(paddingX,paddingY);
  const material=registry.require(materialId,'surface');
  const result=drawSculptTerrain(imageContext,{terrain,material,texture:currentTexture,
    rockPalette,cliffAtlas:cliffAtlasImage,cliffHD:cliffHDImage,
    cliffMoss:$('rock-moss')?.checked,
    overlays:ribbonTextures,
     sphereWallImages,
    paintSurface:surface,paintImages:surfacePaintImages});
  terrainRasterBuilds++;
  navTerrainCache={terrain,texture:currentTexture,signature,
    waterTexture:ribbonTextures.water?.texture,roadTexture:ribbonTextures.road?.texture,
    paintSurface:surface,image:raster,scale,paddingX,paddingY,result};
  return navTerrainCache;
}
const demoActorImage=new Image(),demoActorAsset=resolveMapActorAsset('actor.demo.hero.traveler.01');
const navigationActorVisual=normalizeMapActorVisual({
  assetId:'actor.demo.hero.traveler.01',role:'hero',targetHeight:37,
  motion:{idleAmplitude:.55,idleFrequency:.8,walkAmplitude:2.0,walkFrequency:3.8}
});
const navigationActorPreparer=createMapActorVisualPreparer({imageLoader:{
  get:id=>id===demoActorAsset?.id?demoActorImage:null
}});
const navigationActorRenderer=createMapActorRenderer({preparedVisuals:navigationActorPreparer});
let navVisualTime=0,navLastVisualPaint=-Infinity;
if(demoActorAsset){
  demoActorImage.onload=()=>{
    navigationActorPreparer.prepare([demoActorAsset.id]);scheduleDraw();
  };
  demoActorImage.src=demoActorAsset.path;
}

const ribbonTextures={water:null,road:null};
// The legacy visual road belongs to the example only, not blank scene data.
let exampleRoadEnabled=true;
let framePending=false;
let waterMaterialRevision=0,groundMaterialRevision=0;
// V76 R5: source material artwork from the existing Material Registry.
const sphereWallImages={grass:null,earth:null};
let sphereTexturesLoaded=0;
const sculptGroundMaterials=Object.freeze(['ground.dirt','grass.forest','ground.forest_floor',
  'ground.mountain_rock','ground.snow','ground.sand','ground.volcanic_ash_lava']);
const sculptWaterMaterials=Object.freeze(['water.clear_blue','water.turquoise',
  'water.forest_stream','water.swamp']);
const images=new Map();
const themes=sculptGroundMaterials;
const interiorFloorMaterials=Object.freeze(SCULPT_SURFACE_MATERIALS.filter(meta=>
  meta.id.startsWith('floor.')).map(meta=>meta.id));
const sculptWorldCurrentInterior=()=>sculptWorldDraft?.areas.find(a=>a.id===sculptWorldAreaId)?.kind==='interior';
// WorldSurface is the ONLY base-material authority. The UI mirrors its
// selection; the last visited Area's toolbar must never recolor this Area.
const displayedBaseMaterialId=()=>surface.baseMaterialId;
function imageFor(materialId,kind='surface'){
  const material=registry.require(materialId,kind);
  const id=kind==='surface' ? material.assets?.base : material.assets?.center;
  const path=resolveMaterialAsset(id)?.path;
  if(!path)return Promise.resolve(null);
  if(images.has(id))return images.get(id);
  const promise=new Promise(resolve=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
    img.src=path;
  });
  images.set(id,promise);return promise;
}
async function loadSphereWallImages(){
  // Already-authored forest surface assets; no duplicate material authority.
  for(const [kind,id] of [['grass','grass.forest'],['earth','ground.forest_floor']]){
    const texture=await imageFor(id);
    if(texture){sphereWallImages[kind]=texture;sphereTexturesLoaded++;
      navTerrainCache=null;scheduleDraw();}
  }
}
async function setWaterMaterial(){
  const id=$('water-material').value;
  if(!sculptWaterMaterials.includes(id))return;
  const revision=++waterMaterialRevision;
  // This is an existing Material Registry item, never a new texture owner.
  const material=registry.require(id,'water');
  const previous=ribbonTextures.water;
  ribbonTextures.water={visible:previous?.visible??$('show-water').checked,
    material,texture:null};
  scheduleDraw();
  const texture=await imageFor(id,'water');
  if(revision!==waterMaterialRevision)return; // late image cannot overwrite current choice
  ribbonTextures.water={...ribbonTextures.water,texture};
  scheduleDraw();
}
async function setupRibbons(){
  const road=SCULPT_PREVIEW_RIBBONS.road;
  const material=registry.require(road.materialId,road.kind);
  ribbonTextures.road={visible:exampleRoadEnabled&&$('show-road').checked,material,texture:null};
  ribbonTextures.road.texture=await imageFor(road.materialId,road.kind);
  scheduleDraw();
  await setWaterMaterial();
}
function toggleRibbon(kind){
  if(ribbonTextures[kind]){
    ribbonTextures[kind].visible=(kind!=='road'||exampleRoadEnabled)&&$('show-'+kind).checked;scheduleDraw();
  }
}
async function setTheme(){
  const id=displayedBaseMaterialId();
  if(!((activeInteriorId||sculptWorldCurrentInterior())
    ?interiorFloorMaterials:themes).includes(id))return;
  const revision=++groundMaterialRevision;
  // Release the previous Area's bitmap synchronously: never paint a mountain
  // texture onto grass while the next material's image promise is pending.
  currentTexture=null;
  navTerrainCache=null;
  scheduleDraw();
  const texture=await imageFor(id);
  if(revision!==groundMaterialRevision)return;
  currentTexture=texture;
  navTerrainCache=null;
  scheduleDraw();
}
function dimensions(){
  const bounds=canvas.getBoundingClientRect();
  return {width:Math.max(1,bounds.width),height:Math.max(1,bounds.height)};
}
function cameraView(){
  if(activeInteriorId||sculptWorldCurrentInterior())return sculptCameraInteriorView(Number($(
    navigationTesting?'navigation-camera-angle':'interior-camera-angle').value));
  return navigationTesting
    ?sculptCameraGameView(Number($('navigation-camera-angle').value))
    :sculptCameraView($('camera-view').value);
}
function cameraBounds(){
  return sculptCameraBounds(cameraView(),terrain.width*SCULPT_TILE.width,
    terrain.height*SCULPT_TILE.height,7*SCULPT_TILE.rise);
}
function fit(){
  // One viewport owner: fullscreenchange, requestAnimationFrame(fit),
  // window.resize and the editor's Fit action all pass through here.
  // Editor fit-to-map must NEVER overwrite the Navigation camera's 100–240%.
  if(navigationTesting){
    zoom=navigationCameraZoom();
    $('zoom').value=String(Math.round(zoom*100));
    centerNavigationCamera();scheduleDraw();return;
  }
  const {width,height}=dimensions();
  const bounds=cameraBounds();
  zoom=Math.max(.32,Math.min(1.6,Math.min((width-30)/bounds.width,(height-20)/bounds.height)));
  $('zoom').value=String(Math.round(zoom*100));
  center();scheduleDraw();
}
function center(){
  const {width,height}=dimensions(),bounds=cameraBounds();
  pan={x:Math.round((width-bounds.width*zoom)/2),
    y:Math.round((height-bounds.height*zoom)/2-bounds.minY*zoom)};
}
let previewObjectViewport=null;
function draw(){
  framePending=false;
  const {width,height}=dimensions(),dpr=Math.min(2,window.devicePixelRatio||1);
  const desiredW=Math.max(1,Math.floor(width*dpr)),desiredH=Math.max(1,Math.floor(height*dpr));
  if(canvas.width!==desiredW)canvas.width=desiredW;
  if(canvas.height!==desiredH)canvas.height=desiredH;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  if(navigationTesting){
    const sky=navigationSkyBackdrop(width,height);
    ctx.drawImage(sky.image,0,0,width,height);
  }else{
    ctx.fillStyle='#17232b';ctx.fillRect(0,0,width,height);
  }
  ctx.translate(pan.x,pan.y);ctx.scale(zoom,zoom);
  // Conservative render-only viewport: does not alter persisted scene data,
  // object placements, hit tests or collision ownership.
  previewObjectViewport={minX:-pan.x/zoom,maxX:(width-pan.x)/zoom,
    minY:-pan.y/zoom,maxY:(height-pan.y)/zoom};
  const view=cameraView();
  // Editor keeps the published V38 exact inverse pointer projection. In
  // Tester, project only the background texture, not standing actor sprites.
  if(!navigationTesting)ctx.transform(1,view.shear,0,view.pitch,0,0);
  let result;
  if(navigationTesting||objectEditing||!drawing){
    // Reuse the EXISTING terrain-only raster while editing object placements.
    // The ground doesn't change during a drag: mobile pointermove now paints
    // just a cached background plus live objects, never 36x24 tile effects.
    const snapshot=navigationBackground();
    if(navigationTesting){ctx.save();ctx.transform(1,view.shear,0,view.pitch,0,0);}
    ctx.drawImage(snapshot.image,-snapshot.paddingX,-snapshot.paddingY,
      snapshot.image.width/snapshot.scale,snapshot.image.height/snapshot.scale);
    if(navigationTesting)ctx.restore();
    result=snapshot.result;
  }else{
    const material=registry.require(displayedBaseMaterialId(),'surface');
    result=drawSculptTerrain(ctx,{terrain,material,texture:currentTexture,
      rockPalette:$('rock').value,cliffAtlas:cliffAtlasImage,cliffHD:cliffHDImage,
      cliffMoss:$('rock-moss')?.checked,
      sphereWallImages,overlays:ribbonTextures,paintSurface:surface,paintImages:surfacePaintImages});
  }
  lastRenderStats=result;
  if(activeInteriorId||sculptWorldCurrentInterior()){
    // Draw rooms with the same single wall and doorway renderer.
    ctx.save();
    // Canonical WorldArea boundary owns the visible interior cut-out AND the
    // Collision World limit; do not make a second editor-only silhouette.
    // Floor raster already drawn: mask every part outside boundary.
    const boundaryArea=activeInteriorId
      ?sculptInteriors.find(e=>e.area.id===activeInteriorId)?.area
      :sculptWorldArea();
    if(boundaryArea?.boundary?.kind==='polygon'){
      // Isolate the boundary's projection. Previously, a conditional
      // ctx.restore() popped the OUTER interior save instead; subsequent
      // wall transform leaked into the hero and doubled camera pitch.
      ctx.save();
      if(navigationTesting)ctx.transform(1,view.shear,0,view.pitch,0,0);
      const poly=worldAreaBoundaryPoints(boundaryArea);
      ctx.save();ctx.fillStyle='#17232b';ctx.beginPath();
      ctx.rect(-2000,-2000,terrain.width*28+4000,terrain.height*21+4000);
      for(let i=0;i<poly.length;i++){
        const p=poly[i];if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
      }
      ctx.closePath();ctx.fill('evenodd');ctx.restore();
      // Always balance the local save: polygonal and rectangular interiors
      // must reach drawNavigationActor with the same canvas transform.
      ctx.restore();
    }
    // In Tester the ground is projected inside the cached layer; use its
    // exact affine camera for walls as well, never an independent perspective.
    if(navigationTesting)ctx.transform(1,view.shear,0,view.pitch,0,0);
    const interior=sculptInteriors.find(e=>e.area.id===activeInteriorId);
    const worldExit=sculptWorldCurrentInterior()?
      worldOutboundPortals().find(p=>p.visual?.marker==='exit'&&p.trigger?.kind==='point'):null;
    drawSculptInteriorWalls(ctx,terrain,{tileWidth:SCULPT_TILE.width,
      tileHeight:SCULPT_TILE.height,rise:SCULPT_TILE.rise,
      doorway:interiorDoorPreview??sculptInteriors.find(e=>e.area.id===activeInteriorId&&e.floorIndex===0)?.exitPortal.trigger??worldExit?.trigger,
      stairPortals:sculptInteriors.flatMap(e=>[e.entryPortal,e.exitPortal])
        .filter(p=>p.sourceAreaId===activeInteriorId&&p.visual.marker==='portal')
        .map(p=>interiorConnectorPreview?.id===p.id?
          {...p,trigger:{...p.trigger,...interiorConnectorPreview}}:p),
      doorScale:interior?.exitPortal?.visual?.scale??worldExit?.visual?.scale??.58,
      doorImage:interiorVisualImages.get(interior?.exitPortal?.visual?.assetId??worldExit?.visual?.assetId)??null,
      connectorImages:interiorVisualImages,
      wallMaterialId:(interior?.area??boundaryArea)?.wallMaterialId??'plaster',
      walls:(interior?.area??boundaryArea)?.walls??[],
      boundaryPoints:(interior?.area??boundaryArea)?.boundary?.kind==='polygon'?
        worldAreaBoundaryPoints(interior?.area??boundaryArea):null,
      cameraPitch:view.pitch});
    if(interiorWallMode==='place'&&interiorWallStart){
      const next=interiorWallPreview??interiorWallStart;
      ctx.save();ctx.setLineDash([8,5]);ctx.lineWidth=6;
      ctx.strokeStyle='#80f5d7';ctx.beginPath();
      ctx.moveTo(interiorWallStart.x,interiorWallStart.y);
      ctx.lineTo(next.x,next.y);ctx.stroke();
      ctx.setLineDash([]);ctx.fillStyle='#d1ffe8';
      for(const p of [interiorWallStart,next]){
        ctx.beginPath();ctx.arc(p.x,p.y,5,0,Math.PI*2);ctx.fill();
      }
      ctx.restore();
    }
    if(interiorDoorMoving){
      const p=interiorDoorPreview??interior?.exitPortal.trigger;
      if(p?.kind==='point'){
        ctx.save();ctx.setLineDash([4,4]);ctx.strokeStyle='#ffe89e';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(p.x,p.y,24,0,Math.PI*2);ctx.stroke();ctx.restore();
      }
    }
    ctx.restore();
  }
  if(navigationTesting){
    // V57: the collision-owned deck identifies which bridge actually carries
    // the hero. One bridge sprite is split into backdrop and near-rail pass.
    const deckBridge=activeSculptBridge();
    const underBridge=navActor&&!deckBridge?resolvedSculptBridges().find(bridge=>
      sculptBridgeDeckAt([bridge],navActor.x,navActor.y,
        Math.max(0,Number(navActor.radius)||0))):null;
    const layeredBridge=deckBridge??underBridge;
    // V78 R2: a stair is anchored at its LOW foot (large Y), not at the
    // player's changing standing height. Painting it by anchor Y alone
    // would cover the climbing actor. Draw the ONE active stair behind them.
    const activeStair=navActor?.sculptStairId?resolvedSculptStairs().find(
      stair=>stair.id===navActor.sculptStairId):null;
    drawPreviewObjects(navActor?.y??Infinity,-Infinity,layeredBridge?.id,activeStair?.id);
    drawPlacedActors(navActor?.y??Infinity);
    if(activeStair)drawPreviewObject(activeStair);
    if(deckBridge)drawPreviewObject(deckBridge);
    drawNavigationActor();
    if(deckBridge)drawPreviewObject(deckBridge,{foregroundRailOnly:true});
    // Ground-level traffic is physically BELOW the entire bridge, not just
    // behind its low front rail. Do not promote it to the deck in the renderer.
    if(underBridge)drawPreviewObject(underBridge);
    if($('navigation-show-bridge-corridor')?.checked)drawNavigationBridgeCorridors();
    drawPreviewObjects(Infinity,navActor?.y??Infinity,layeredBridge?.id,activeStair?.id);
    drawPlacedActors(Infinity,navActor?.y??Infinity);
  }else{
    drawPreviewObjects();
    drawPlacedActors();
  }
  // A temporary stroke preview is visual only; WorldSurface is committed on
  // pointerup. No hidden draft geometry is persisted by the renderer.
  if(surfaceEditing){
    const points=surfaceDrawing&&surfaceStrokePoints.length?surfaceStrokePoints:
      hoverCell?[{x:(hoverCell.x+.5)*SCULPT_TILE.width,
        y:(hoverCell.y+.5)*SCULPT_TILE.height}]:[];
    if(points.length){
      const width=Number($('surface-width').value)*SCULPT_TILE.width;
      ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
      ctx.globalAlpha=.42;ctx.strokeStyle=$('surface-material').value==='road.dirt'?'#d1a772':'#adedd1';
      ctx.lineWidth=width;
      ctx.beginPath();
      for(let i=0;i<points.length;i++){
        const p=points[i];
        const level=sculptHeightAt(terrain,Math.floor(p.x/SCULPT_TILE.width),
          Math.floor(p.y/SCULPT_TILE.height));
        const yy=p.y-level*SCULPT_TILE.rise;
        if(!i)ctx.moveTo(p.x,yy);else ctx.lineTo(p.x,yy);
      }
      if(points.length===1){const p=points[0];ctx.lineTo(p.x+.001,
        p.y-sculptHeightAt(terrain,Math.floor(p.x/SCULPT_TILE.width),
          Math.floor(p.y/SCULPT_TILE.height))*SCULPT_TILE.rise);}
      ctx.stroke();ctx.restore();
    }
  }
  drawSculptWorldPortalMarkers();
  // Preview the authored ground ramp from its real endpoints, not an
  // artificial object silhouette. The committed terrain is drawn in the
  // terrain-only raster with the same surface texture.
  const rampA=rampStart??rampGesture?.origin;
  const rampB=rampEnd??(rampA&&hoverCell?rampPointFromCell(hoverCell):null);
  let rampPreviewValid=null;
  if(!navigationTesting&&rampToolActive()&&rampA&&rampB){
    const candidate=appendSculptTerrainRamp(terrain,{
      x:rampA.x,y:rampA.y,endX:rampB.x,endY:rampB.y,width:rampWidth()});
    rampPreviewValid=candidate!==terrain;
    const level=p=>sculptHeightAt(terrain,Math.floor(p.x/SCULPT_TILE.width),
      Math.floor(p.y/SCULPT_TILE.height));
    const foot={x:rampA.x,y:rampA.y-level(rampA)*SCULPT_TILE.rise};
    const head={x:rampB.x,y:rampB.y-level(rampB)*SCULPT_TILE.rise};
    ctx.save();
    if(rampPreviewValid){
      const projected=sculptTerrainRampProjections(candidate).at(-1);
      const mesh=sculptRampVisualMesh(candidate,projected,{
        cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height,
        rise:SCULPT_TILE.rise,view:null,segments:12});
      if(mesh?.valid){
        ctx.fillStyle='rgba(80,232,156,.30)';
        ctx.strokeStyle='rgba(178,255,219,.8)';
        for(let i=1;i<mesh.samples.length;i++){
          const a=mesh.samples[i-1],b=mesh.samples[i];
          ctx.beginPath();ctx.moveTo(a.left.x,a.left.y);
          ctx.lineTo(b.left.x,b.left.y);ctx.lineTo(b.right.x,b.right.y);
          ctx.lineTo(a.right.x,a.right.y);ctx.closePath();ctx.fill();
        }
        ctx.lineWidth=1.5;ctx.beginPath();
        ctx.moveTo(mesh.samples[0].left.x,mesh.samples[0].left.y);
        ctx.lineTo(mesh.samples.at(-1).left.x,mesh.samples.at(-1).left.y);
        ctx.moveTo(mesh.samples[0].right.x,mesh.samples[0].right.y);
        ctx.lineTo(mesh.samples.at(-1).right.x,mesh.samples.at(-1).right.y);ctx.stroke();
      }
    }else{
      ctx.lineCap='round';ctx.strokeStyle='rgba(230,113,92,.23)';
      ctx.lineWidth=Math.max(8,rampWidth());ctx.beginPath();
      ctx.moveTo(foot.x,foot.y);ctx.lineTo(head.x,head.y);ctx.stroke();
    }
    ctx.lineWidth=2;ctx.strokeStyle=rampPreviewValid?'#b9ffe1':'#ffb3a3';
    ctx.setLineDash([6,4]);ctx.beginPath();ctx.moveTo(foot.x,foot.y);
    ctx.lineTo(head.x,head.y);ctx.stroke();ctx.setLineDash([]);
    for(const [p,label] of [[foot,'1'],[head,'2']]){
      ctx.fillStyle='#203b38';ctx.beginPath();ctx.arc(p.x,p.y,9,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#e0fff0';ctx.lineWidth=1.5;ctx.stroke();
      ctx.fillStyle='#f8fffd';ctx.font='bold 11px sans-serif';ctx.textAlign='center';
      ctx.textBaseline='middle';ctx.fillText(label,p.x,p.y+.3);
    }
    ctx.restore();
  }
  previewSummary=null;
  const precisionOn=$('precision-mode').checked;
  const displayCell=selectedMode.startsWith('terrain-ramp')?hoverCell:
    precisionOn?precisionCell:hoverCell;
  // R4: display the candidate footprint even if the generic cursor is off.
  const hasFootprint=precisionOn||$('preview-cursor').checked||selectedMode.startsWith('sphere-');
  if(!navigationTesting&&!objectEditing&&!surfaceEditing&&displayCell&&hasFootprint&&
     (!selectedMode.startsWith('sphere-')||!spherePreviewDismissed)){
    const points=precisionOn?[{x:displayCell.x+.5,y:displayCell.y+.5}]
      :drawing&&strokePoints.length?strokePoints:[{x:displayCell.x+.5,y:displayCell.y+.5}];
    const base=drawing&&strokeUndo ? strokeUndo : terrain;
    const first=points[0],target=selectedMode.startsWith('water-')?Number($('water-target').value):selectedMode==='plateau' ? Number($('target').value)
      : sculptHeightAt(base,Math.floor(first.x),Math.floor(first.y));
    if(selectedMode.startsWith('sphere-')){
      drawSculptSphereCursor(ctx,{terrain:base,x:first.x*SCULPT_TILE.width,
        y:first.y*SCULPT_TILE.height,radius:Number($('radius').value)*SCULPT_TILE.width,
        tile:SCULPT_TILE,kind:selectedMode==='sphere-basin'?'basin':'hill',
         summitRatio:Number($('sphere-summit-ratio').value)/100});
      previewSummary={cells:1,centerHeight:target};
    }else if(selectedMode.startsWith('terrain-ramp')){
      previewSummary={cells:1,centerHeight:target};
    }else previewSummary=drawSculptBrushPreview(ctx,{terrain:base,points,
      radius:Number($('radius').value),strength:Number($('strength').value),
      shape:$('brush-shape').value,edgeSoftness:Number($('edge').value)/100,mode:selectedMode,target,
      zoom});
  }
  $('stats').textContent=terrain.width+' × '+terrain.height+' cases · '+result.faceCount+
    ' parois ('+result.faceRuns+' sections) · '+Math.round(zoom*100)+' %';
  $('brush-info').textContent=rampToolActive()
    ?rampA?(rampPreviewValid?'Aperçu vert : pente raccordée · touche pour créer.':
      'Aperçu orange : vise plus haut ou allonge la pente.')+
      ' Largeur : '+$('radius').value+' cases.'
      :'Pente : 1. pied bas · 2. sommet haut · ou glisser en un seul geste.'
    :selectedMode==='terrain-ramp-erase'
      ?'Effacer une pente : touche directement la zone de pente.'
    :displayCell ?
      (precisionOn?'Visée ('+(displayCell.x+1)+','+(displayCell.y+1)+') · ':'Pinceau : ')+
      (previewSummary?.cells??0)+' case(s) · '+selectedMode+
      (selectedMode==='plateau'?' niveau '+$('target').value:selectedMode.startsWith('water-')?' eau '+$('water-target').value:'')+
      (precisionOn?' · appuie sur Appliquer pour sculpter':' · bord '+$('edge').value+' %') :
      precisionOn?'Placement précis : vise au doigt sans modifier le terrain, puis confirme':
        'Déplace le pointeur ou touche le terrain : empreinte visible avant la sculpture';
  ensureWaterfallPump();
}
// One 12 FPS redraw pump only while animated decorations are placed.
// The existing Sculpt renderer remains the sole drawing path.
let waterfallPumpHandle=0,waterfallLastPaintMs=0;
function waterfallPresent(){return placedObjects.some(o=>Boolean(resolveWorldObjectAsset(o.visual?.assetId)?.animation));}
function pumpWaterfallFrame(now){
  if(!waterfallPresent()){waterfallPumpHandle=0;return;}
  if(now-waterfallLastPaintMs>=83){waterfallLastPaintMs=now;if(!navigationTesting)scheduleDraw();}
  waterfallPumpHandle=requestAnimationFrame(pumpWaterfallFrame);
}
function ensureWaterfallPump(){
  if(!waterfallPumpHandle&&waterfallPresent())waterfallPumpHandle=requestAnimationFrame(pumpWaterfallFrame);
}
function scheduleDraw(){if(!framePending){framePending=true;requestAnimationFrame(draw);}}
function screenToWorldPoint(event){
  const rect=canvas.getBoundingClientRect();
  // One inverse shared by brush picking and object drag; drag itself NEVER
  // snaps to a painted cell or subtracts an invented height offset.
  return sculptCameraScreenToWorld(cameraView(),{
    screenX:event.clientX-rect.left,screenY:event.clientY-rect.top,pan,zoom});
}
function screenToCell(event){
  // Exact inverse of the same affine camera used to draw terrain/preview.
  const {x,y}=screenToWorldPoint(event);
  const col=Math.floor(x/SCULPT_TILE.width);
  if(col<0||col>=terrain.width)return null;
  const area=sculptInteriors.find(e=>e.area.id===activeInteriorId)?.area;
  if(area&&!pointInWorldAreaBoundary(area,x,y))return null;
  // Pick the exposed top face, not a static projected pixel geometry.
  for(let row=terrain.height-1;row>=0;row--){
    const top=row*SCULPT_TILE.height-sculptHeightAt(terrain,col,row)*SCULPT_TILE.rise;
    if(y>=top&&y<=top+SCULPT_TILE.height)return {x:col,y:row};
  }
  const row=Math.floor(y/SCULPT_TILE.height);
  return row>=0&&row<terrain.height?{x:col,y:row}:null;
}
function status(message){$('notice').textContent=message;}
// R3 touch authoring. Terrain.ramps stays the only persisted source; a pending
// foot or preview never writes to the map and never creates a WorldObject.
const rampToolActive=()=>selectedMode==='terrain-ramp';
const rampPointFromCell=cell=>({x:(cell.x+.5)*SCULPT_TILE.width,
  y:(cell.y+.5)*SCULPT_TILE.height});
const rampWidth=()=>Number($('radius').value)*SCULPT_TILE.width;
function updateRampGuide(message=null){
  const active=rampToolActive();
  $('ramp-guide').hidden=!active;
  document.body.classList.toggle('terrain-ramp-authoring',
    active||selectedMode==='terrain-ramp-erase');
  $('ramp-cancel').disabled=!rampStart;
  if(!active)return;
  $('ramp-step').textContent=message??(rampStart
    ?'2. Touche le sommet PLUS HAUT · ou glisse pour ajuster. Largeur : '+$('radius').value+' cases.'
    :'1. Touche le pied BAS, puis le sommet HAUT. Ou glisse en un geste.');
}
function commitTerrainRamp(from,to){
  const strokeUndo=terrain;
  const next=appendSculptTerrainRamp(strokeUndo,{
    x:from.x,y:from.y,endX:to.x,endY:to.y,width:rampWidth()});
  if(next===strokeUndo){
    rampStart=from;
    status('Pente non raccordée : choisis un sommet sec et plus haut, ou allonge le passage.');
    updateRampGuide('Pente non raccordée · change le sommet (ou le pied).');
    return false;
  }
  terrain=next;rampStart=null;
  commitUndo(strokeUndo);
  status('Pente créée dans le terrain · Annuler disponible · Tester pour monter.');
  updateRampGuide();return true;
}

function updatePrecisionActions(){
  const enabled=!navigationTesting&&!objectEditing&&!surfaceEditing&&
    !selectedMode.startsWith('terrain-ramp')&&$('precision-mode').checked;
  $('precision-actions').hidden=!enabled;
  const hasTarget=enabled&&!!precisionCell;
  $('apply-precision').disabled=!hasTarget;
  for(const id of ['nudge-left','nudge-up','nudge-down','nudge-right'])
    $(id).disabled=!hasTarget;
  scheduleDraw();
}
function setEditorKind(kind){
  if(kind!=='ground'&&kind!=='water')return;
  if(objectEditing)setObjectEditing(false);
  if(surfaceEditing)setSurfaceEditing(false);
  editorKind=kind;
  $('ground-tools').hidden=kind!=='ground';
  $('water-tools').hidden=kind!=='water';
  document.querySelectorAll('[data-panel="ground"]').forEach(element=>{
    element.hidden=kind!=='ground';
  });
  for(const domain of ['ground','water']){
    const btn=$('mode-'+domain),active=kind===domain;
    btn.classList.toggle('active',active);
    btn.setAttribute('aria-pressed',String(active));
  }
  const wanted=kind==='ground'?lastGroundMode:lastWaterMode;
  if(selectedMode!==wanted)selectMode(wanted);
  else $('active-tool-label').textContent=(kind==='ground'?'Terre':'Eau')+' · '+selectedMode;
  updatePrecisionActions();
  syncQuickToolbar();
}
function precisionApply(){
  if(!$('precision-mode').checked||!precisionCell)return;
  const cell=precisionCell,previous=terrain;
  const water=selectedMode.startsWith('water-');
  const options={points:[{x:cell.x+.5,y:cell.y+.5}],
    radius:Number($('radius').value),strength:Number($('strength').value),
    shape:$('brush-shape').value,mode:selectedMode,target:water?Number($('water-target').value):
       selectedMode==='plateau'?Number($('target').value):sculptHeightAt(previous,cell.x,cell.y),
    edgeSoftness:Number($('edge').value)/100};
  if(selectedMode.startsWith('sphere-')){
    const x=(cell.x+.5)*SCULPT_TILE.width,y=(cell.y+.5)*SCULPT_TILE.height;
    terrain=selectedMode==='sphere-erase'?removeSculptSphereAt(previous,x,y):
      appendSculptSphere(previous,{kind:selectedMode==='sphere-hill'?'hill':'basin',
        x,y,radius:Number($('radius').value)*SCULPT_TILE.width,
        height:Math.max(1,Number($('target').value)),
        summitRatio:Number($('sphere-summit-ratio').value)/100,
        wallMaterial:$('sphere-wall-material').value});
  }else terrain=water?applySculptWaterStroke(previous,options):
    applySculptStroke(previous,options);
  commitUndo(previous);
  // R6: keep the mint dashed brush active after placement so the next
  // target can be adjusted immediately. It is ONLY a live editor overlay.
  if(selectedMode.startsWith('sphere-'))spherePreviewDismissed=false;
  status(terrain!==previous?'Case ('+(cell.x+1)+','+(cell.y+1)+') appliquée · Annuler disponible':
    'Aucun changement à cet emplacement');
  scheduleDraw();
}

// One quick toolbar follows the established Terre/Eau tools (no duplicate tool state).
function syncQuickToolbar(){
  const select=$('quick-tool'),wanted=selectedMode;
  const group=editorKind;
  const available=[...document.querySelectorAll('[data-mode]')].filter(button=>
    (button.dataset.mode.startsWith('water-')?'water':'ground')===group);
  if(select.options.length!==available.length ||
      available.some((button,i)=>select.options[i]?.value!==button.dataset.mode)){
    select.replaceChildren(...available.map(button=>{
      const option=document.createElement('option');
      option.value=button.dataset.mode;
      option.textContent=button.textContent.trim().replace(/\s+/g,' ');
      return option;
    }));
  }
  select.value=wanted;
  const isBasin=selectedMode==='sphere-basin';
  const isSphere=selectedMode==='sphere-hill'||isBasin;
  $('quick-level-label').textContent=group==='water'?'Eau':
    isBasin?'Profondeur':isSphere?'Hauteur de colline':'Hauteur';
  $('quick-level-value').textContent=group==='water'?$('water-target').value:
    isSphere?(isBasin?'−':'+')+$('target').value+' niv.':$('target').value;
}
function adjustQuickLevel(delta){
  const el=editorKind==='water' ? $('water-target') : $('target');
  const limit=editorKind==='water'?10:7;
  const minimum=editorKind==='ground'&&
    (selectedMode==='sphere-hill'||selectedMode==='sphere-basin')?1:0;
  el.value=String(Math.max(minimum,Math.min(limit,Number(el.value)+delta)));
  el.dispatchEvent(new Event('input',{bubbles:true}));
}
// Fullscreen and the floating palette only reflow the EXISTING controls.
function setImmersive(enabled){
  document.body.classList.toggle('sculpt-immersive',enabled);
  document.body.classList.remove('palette-collapsed');
  $('palette-toggle').hidden=!enabled;
  $('palette-toggle').setAttribute('aria-expanded','true');
  $('palette-toggle').textContent='▴';
  $('fullscreen-toggle').setAttribute('aria-pressed',String(enabled));
  $('fullscreen-toggle').setAttribute('aria-label',enabled?'Quitter le plein écran':'Passer en plein écran');
  $('fullscreen-toggle').textContent=enabled?'⤢ Quitter':'⛶ Plein écran';
  requestAnimationFrame(fit);
}
function toggleImmersive(){
  const entering=!document.body.classList.contains('sculpt-immersive');
  setImmersive(entering);
  if(entering&&typeof document.documentElement.requestFullscreen==='function'){
    // Mobile browsers without Fullscreen API still use the 100dvh CSS canvas.
    try{document.documentElement.requestFullscreen().catch(()=>{});}catch{}
  }else if(!entering&&document.fullscreenElement&&document.exitFullscreen){
    document.exitFullscreen().catch(()=>{});
  }
}
function adjustBrushSize(delta){
  const input=$('radius');
  const size=Math.max(.5,Math.min(16,Number(input.value)+delta));
  input.value=String(size);
  input.dispatchEvent(new Event('input',{bubbles:true}));
}
function selectMode(mode){
  if(interiorWallMode)setInteriorWallMode(null);
  if(interiorDoorMoving)setInteriorDoorMoving(false);
  const nextKind=mode.startsWith('water-')?'water':'ground';
  selectedMode=mode;
  rampStart=null;rampEnd=null;rampGesture=null;
  spherePreviewDismissed=false;
  if(nextKind==='water')lastWaterMode=mode;else lastGroundMode=mode;
  // Quickbar can be used while Objects or Textures is active even when the
  // last terrain kind was already 'ground'. Always exit the overlay editor.
  if(editorKind!==nextKind||objectEditing||surfaceEditing)setEditorKind(nextKind);
  $('active-tool-label').textContent=(nextKind==='water'?'Eau':'Terre')+' · '+mode;
  document.querySelectorAll('[data-mode]').forEach(button=>{
    const active=button.dataset.mode===mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  syncQuickToolbar();
  updateRampGuide();
  updatePrecisionActions();
  $('sphere-profile-wrap').hidden=mode!=='sphere-hill'&&mode!=='sphere-basin';
  // On mobile, make a prospective footprint visible before the first tap.
  if(mode.startsWith('sphere-')&&$('precision-mode').checked&&!precisionCell){
    precisionCell={x:Math.floor(terrain.width/2),y:Math.floor(terrain.height/2)};
    updatePrecisionActions();
  }
  $('height-label').textContent=mode==='sphere-basin'?'Profondeur':mode==='sphere-hill'?'Hauteur de colline':'Hauteur du plateau';
  $('target').min=mode==='sphere-hill'||mode==='sphere-basin'?'1':'0';
  if(mode==='sphere-hill'||mode==='sphere-basin'){
    if(Number($('target').value)<1){$('target').value='3';$('target').dispatchEvent(new Event('input',{bubbles:true}));}
    $('brush-shape').value='circle';
    if(Number($('radius').value)<2){$('radius').value='4';
      $('radius').dispatchEvent(new Event('input',{bubbles:true}));}
  }
  status({dig:'Creuser : abaisse le terrain et crée la paroi',raise:'Surélever : pousse le plateau vers le haut',
    flatten:'Aplanir : nivelle vers la première hauteur touchée',
    plateau:'Plateau : pose exactement le niveau sélectionné, sans empiler les passages',
    'sphere-hill':'V76 R9 : 0 % sphère ; de 5 à 95 % colline à flanc conique ; 100 % plateau rond vertical. Accès à pied sur les pentes : V77.',
    'sphere-basin':'V76 R9 : creux rond à fond plat et flancs coniques, ou bord vertical à 100 %. Accès par pente : V77.',
    'sphere-erase':'V76 : touche une colline/cavité sphérique pour la supprimer, sans modifier les cases.',
    'terrain-ramp':'Pente : touche le pied BAS, puis le sommet HAUT (ou glisse en un seul geste). La taille du pinceau règle la largeur.',
    'terrain-ramp-erase':'Effacer pente : touche le passage à supprimer dans Terre. Le terrain conserve ses plateaux.',
    'water-fill':'Eau : niveau de surface absolu, volume calculé par rapport au terrain',
    'water-rise':'Eau : surélever sa surface, sans déplacer le sol',
    'water-lower':'Eau : abaisser sa surface','water-erase':'Eau : enlever le volume peint',
    'water-smooth':'Eau : égaliser les hauteurs voisines'}[mode]);
}
function commitUndo(previous){
  if(previous===terrain)return;
  history.push(previous);if(history.length>40)history.shift();
  redoHistory=[];updateHistoryButtons();
}
function updateHistoryButtons(){
  $('undo').disabled=history.length===0;
  $('redo').disabled=redoHistory.length===0;
  $('undo').textContent='↶ Annuler ('+history.length+')';
  $('redo').textContent='↷ Rétablir ('+redoHistory.length+')';
}
function undo(){
  if(!history.length){status('Aucune action à annuler');return;}
  redoHistory.push(terrain);terrain=history.pop();
  updateHistoryButtons();scheduleDraw();status('Dernière action annulée (sol / eau)');
}
function redo(){
  if(!redoHistory.length){status('Aucune action à rétablir');return;}
  history.push(terrain);terrain=redoHistory.pop();
  updateHistoryButtons();scheduleDraw();status('Action rétablie');
}
function begin(event){
  if(navigationTesting)return;
  if(event.button!==undefined&&event.button!==0)return;
  if(sculptWorldPortalPlacement){
    event.preventDefault();
    const point=screenToWorldPoint(event);
    applySculptWorldPointerPlacement(point);
    return;
  }
  if(activeInteriorId&&interiorConnectorMode){
    const point=screenToWorldPoint(event);
    if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    interiorConnectorGesture={pointerId:event.pointerId,point};
    interiorConnectorPreview={id:$('interior-connector-link').value,...point};
    scheduleDraw();return;
  }
  if(activeInteriorId&&interiorDoorMoving){
    const point=interiorDoorPointFromEvent(event);
    if(!point)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    interiorDoorGesture={pointerId:event.pointerId,point};
    interiorDoorPreview={...currentSculptInterior().exitPortal.trigger,...point};
    scheduleDraw();return;
  }
  if(activeInteriorId&&interiorWallMode){
    const point=interiorWallPointFromEvent(event);
    if(!point)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    if(interiorWallMode==='remove'){
      const entry=currentSculptInterior();
      commitInteriorWalls(removeInteriorWallNear(entry.area.walls,point.x,point.y,24/zoom));
      return;
    }
    const previousStart=interiorWallStart;
    const first=previousStart??point;
    interiorWallGesture={pointerId:event.pointerId,origin:point,first,last:point,
      previousStart,screen:{x:event.clientX,y:event.clientY},dragged:false};
    interiorWallStart=first;interiorWallPreview=point;
    updateInteriorWallControls();scheduleDraw();return;
  }
  if(objectEditing&&!actorSubmode&&$('object-action').value!=='place'){
    // Aim at what the finger SEES: elevated, rotated visible object artwork.
    // A touch never needs to hit the invisible ground cell/center.
    const at=screenToWorldPoint(event);
    const hit=findSculptVisualObjectAtPoint(placedObjects,terrain,at,{zoom});
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    if($('object-action').value==='remove'){
      if(hit&&objectCommit(removeSculptPreviewObject(placedObjects,hit.id))){
        syncObjectSelectedControls();status('Objet supprimé');
      }else if(!hit)status('Aucun objet sous le doigt');
      return;
    }
    objectSelectedId=hit?.id??null;
    syncObjectSelectedControls();scheduleDraw();
    objectDrag=hit?{pointerId:event.pointerId,id:hit.id,start:at,
      origin:{x:hit.transform.x,y:hit.transform.y},
      before:placedObjects,client:{x:event.clientX,y:event.clientY},active:false}:null;
    status(hit?'Objet sélectionné : glisse directement pour déplacer':'Aucun objet sous le doigt');
    return;
  }
  const cell=screenToCell(event);if(!cell)return;
  spherePreviewDismissed=false;
  hoverCell=cell;
  event.preventDefault();canvas.setPointerCapture(event.pointerId);
  if(objectEditing){
    if(actorSubmode)applyActorAtCell(cell);else applyObjectAtCell(cell);
    return;
  }
  if(surfaceEditing){
    const point={x:(cell.x+.5)*SCULPT_TILE.width,y:(cell.y+.5)*SCULPT_TILE.height};
    if($('surface-action').value==='erase'){
      surfaceCommit(removeSculptSurfaceAt(surface,point));return;
    }
    surfaceDrawing=true;surfaceLastCell=cell.x+','+cell.y;surfaceStrokePoints=[point];
    return;
  }
  // R3: slopes bypass the global mobile precision checkbox ONLY while
  // creating/erasing a slope. Other terrain brushes preserve their mode.
  if(selectedMode==='terrain-ramp-erase'){
    const strokeUndo=terrain,point=rampPointFromCell(cell);
    terrain=removeSculptTerrainRampAt(strokeUndo,point.x,point.y);
    commitUndo(strokeUndo);
    status(terrain===strokeUndo?'Aucune pente à cet emplacement.'
      :'Pente du terrain effacée · Annuler disponible.');
    scheduleDraw();return;
  }
  if(rampToolActive()){
    const point=rampPointFromCell(cell);
    rampGesture={pointerId:event.pointerId,origin:point,last:point,
      previousStart:rampStart,moved:false};
    rampEnd=point;
    updateRampGuide();scheduleDraw();return;
  }
  if($('precision-mode').checked){
    precisionDragging=true;precisionCell=cell;updatePrecisionActions();
    status('Visée ('+(cell.x+1)+','+(cell.y+1)+') : déplace ou ajuste avec les flèches, puis Appliquer');
    return;
  }
  drawing=true;lastCell='';strokePoints=[];strokeUndo=terrain;
  stroke(event);
}
function stroke(event){
  if(navigationTesting)return;
  if(interiorConnectorMode){
    if(interiorConnectorGesture?.pointerId===event.pointerId){
      const point=screenToWorldPoint(event);
      if(Number.isFinite(point.x)&&Number.isFinite(point.y)){
        interiorConnectorGesture.point=point;
        interiorConnectorPreview={id:$('interior-connector-link').value,...point};scheduleDraw();
      }
    }
    return;
  }
  if(interiorDoorMoving){
    if(interiorDoorGesture&&event.pointerId===interiorDoorGesture.pointerId){
      const point=interiorDoorPointFromEvent(event);
      if(point){interiorDoorGesture.point=point;
        interiorDoorPreview={...currentSculptInterior().exitPortal.trigger,...point};
        scheduleDraw();}
    }
    return;
  }
  if(activeInteriorId&&interiorWallMode){
    const gesture=interiorWallGesture;
    if(gesture&&event.pointerId===gesture.pointerId){
      const point=interiorWallPointFromEvent(event,gesture.first);
      if(!point)return;
      gesture.last=point;
      if(Math.hypot(event.clientX-gesture.screen.x,event.clientY-gesture.screen.y)>=8)
        gesture.dragged=true;
      interiorWallPreview=point;scheduleDraw();
    }else if(interiorWallStart&&event.pointerType==='mouse'){
      const point=interiorWallPointFromEvent(event,interiorWallStart);
      if(point){interiorWallPreview=point;scheduleDraw();}
    }
    return;
  }
  if(objectEditing){
    if(!objectDrag||objectDrag.pointerId!==event.pointerId)return;
    if(event.pointerType==='mouse'&&event.buttons===0)return;
    const source=objectDrag,world=screenToWorldPoint(event);
    if(!Number.isFinite(world.x)||!Number.isFinite(world.y))return;
    // Four CSS pixels avoid turning a simple select tap into a move.
    if(!source.active&&Math.hypot(event.clientX-source.client.x,
      event.clientY-source.client.y)<4)return;
    const x=Math.max(.001,Math.min(terrain.width*SCULPT_TILE.width-.001,
      source.origin.x+world.x-source.start.x));
    const y=Math.max(.001,Math.min(terrain.height*SCULPT_TILE.height-.001,
      source.origin.y+world.y-source.start.y));
    // The SAME native bridge permission as placement: a bridge may be
    // repositioned on wet cells, all other kinds must stay on dry ground.
    const current=placedObjects.find(o=>o.id===source.id);
    if(!current||!sculptObjectCanOccupyCell(terrain,current.objectDefinitionId,
      Math.floor(x/SCULPT_TILE.width),Math.floor(y/SCULPT_TILE.height)))return;
    if(!current||Math.abs(current.transform.x-x)<.0001&&
       Math.abs(current.transform.y-y)<.0001)return;
    const next=updateSculptPreviewObject(placedObjects,source.id,{x,y});
    objectDrag.active=true;
    canvas.classList.add('object-dragging');
    placedObjects=next;scheduleDraw();
    return;
  }
  if(surfaceEditing){
    if(!surfaceDrawing){
      if(event.pointerType!=='touch'){
        hoverCell=screenToCell(event);scheduleDraw();
      }
      return;
    }
    const cell=screenToCell(event);if(!cell)return;
    hoverCell=cell;
    const key=cell.x+','+cell.y;
    if(key===surfaceLastCell)return;
    if(surfaceLastCell){
      const [px,py]=surfaceLastCell.split(',').map(Number);
      const steps=Math.max(Math.abs(cell.x-px),Math.abs(cell.y-py));
      for(let i=1;i<steps;i++){
        const x=Math.round(px+(cell.x-px)*i/steps),y=Math.round(py+(cell.y-py)*i/steps);
        surfaceStrokePoints.push({x:(x+.5)*SCULPT_TILE.width,y:(y+.5)*SCULPT_TILE.height});
      }
    }
    surfaceLastCell=key;
    surfaceStrokePoints.push({x:(cell.x+.5)*SCULPT_TILE.width,
      y:(cell.y+.5)*SCULPT_TILE.height});
    scheduleDraw();return;
  }
  if(rampGesture){
    if(event.pointerId!==rampGesture.pointerId)return;
    const cell=screenToCell(event);
    if(cell){
      const point=rampPointFromCell(cell);
      hoverCell=cell;rampGesture.last=point;rampEnd=point;
      if(point.x!==rampGesture.origin.x||point.y!==rampGesture.origin.y)
        rampGesture.moved=true;
      scheduleDraw();
    }
    return;
  }
  if(precisionDragging){
    const next=screenToCell(event);
    if(next){precisionCell=next;hoverCell=next;updatePrecisionActions();}
    return;
  }
  // In mobile precision mode, slope preview still follows the fingertip
  // and mouse hover, unlike the other brushes requiring Apply.
  if(rampToolActive()&&!drawing){
    const next=screenToCell(event);
    if(next){hoverCell=next;scheduleDraw();}
    return;
  }
  if($('precision-mode').checked)return;
  if(!drawing){
    if(event.pointerType==='touch')return;
    spherePreviewDismissed=false;
    hoverCell=screenToCell(event);
    scheduleDraw();return;
  }
  const cell=screenToCell(event);if(!cell)return;
  hoverCell=cell;
  const key=cell.x+','+cell.y;
  if(key===lastCell)return;
  if(selectedMode.startsWith('sphere-')){
    // Exactly one authored radial shape per gesture, not a trail of circles.
    if(lastCell)return;
    lastCell=key;
    const x=(cell.x+.5)*SCULPT_TILE.width,y=(cell.y+.5)*SCULPT_TILE.height;
    const before=strokeUndo;
    terrain=selectedMode==='sphere-erase'?removeSculptSphereAt(before,x,y):
      appendSculptSphere(before,{kind:selectedMode==='sphere-hill'?'hill':'basin',
        x,y,radius:Number($('radius').value)*SCULPT_TILE.width,
        height:Math.max(1,Number($('target').value)),
        summitRatio:Number($('sphere-summit-ratio').value)/100,
        wallMaterial:$('sphere-wall-material').value});
    if(terrain===before)status('V76 : choisissez une zone plane et sèche, avec assez de place pour tout le cercle.');
    scheduleDraw();return;
  }
  // Interpolate pointer travel so a fast thumb stroke never leaves holes.
  if(lastCell){
    const [px,py]=lastCell.split(',').map(Number);
    const steps=Math.max(Math.abs(cell.x-px),Math.abs(cell.y-py));
    for(let i=1;i<steps;i++){
      const ix=Math.round(px+(cell.x-px)*i/steps);
      const iy=Math.round(py+(cell.y-py)*i/steps);
      const prev=strokePoints[strokePoints.length-1];
      if(!prev||prev.x!==ix+.5||prev.y!==iy+.5)
        strokePoints.push({x:ix+.5,y:iy+.5});
    }
  }
  lastCell=key;strokePoints.push({x:cell.x+.5,y:cell.y+.5});
  // Stable immutable stroke, one height update even after revisiting same cell.
  const first=strokePoints[0];
  const waterMode=selectedMode.startsWith('water-');
  const target=waterMode ? Number($('water-target').value):selectedMode==='plateau' ? Number($('target').value)
    : sculptHeightAt(strokeUndo,Math.floor(first.x),Math.floor(first.y));
  const options={points:strokePoints,radius:Number($('radius').value),
    shape:$('brush-shape').value,strength:Number($('strength').value),mode:selectedMode,target,
    edgeSoftness:Number($('edge').value)/100};
  terrain=waterMode ?applySculptWaterStroke(strokeUndo,options):
    applySculptStroke(strokeUndo,options);
  scheduleDraw();
}
function stop(event){
  if(interiorConnectorGesture){
    const gesture=interiorConnectorGesture;
    if(event.pointerId!==gesture.pointerId)return;
    interiorConnectorGesture=null;interiorConnectorPreview=null;
    if(event.type!=='pointercancel'){
      try{
        sculptInteriors=updateSculptFloorConnector(sculptInteriors,{
          sourceAreaId:activeInteriorId,portalId:$('interior-connector-link').value,
          x:gesture.point.x,y:gesture.point.y,assetId:$('interior-connector-asset').value});
        updateInteriorConnectorControls();
        status('Escalier / échelle placé : vrai Portal et arrivée liée au niveau cible.');
      }catch(error){status(error.message);}
    }
    scheduleDraw();return;
  }
  if(interiorDoorGesture){
    const gesture=interiorDoorGesture;
    if(event.pointerId!==gesture.pointerId)return;
    interiorDoorGesture=null;interiorDoorPreview=null;
    if(event.type!=='pointercancel')commitInteriorDoor(gesture.point);
    else scheduleDraw();
    return;
  }
  if(interiorWallGesture){
    const gesture=interiorWallGesture;
    if(event.pointerId!==gesture.pointerId)return;
    interiorWallGesture=null;
    const canceled=event.type==='pointercancel';
    if(canceled){interiorWallStart=gesture.previousStart;interiorWallPreview=null;}
    else if(gesture.dragged||gesture.previousStart){
      interiorWallStart=null;interiorWallPreview=null;
      try{commitInteriorWalls(appendInteriorWall(currentSculptInterior().area.walls,
        {a:gesture.first,b:gesture.last}));}
      catch(error){status(error.message);}
    }else{interiorWallStart=gesture.origin;interiorWallPreview=gesture.origin;}
    updateInteriorWallControls();scheduleDraw();return;
  }
  if(objectDrag){
    const drag=objectDrag;objectDrag=null;
    canvas.classList.remove('object-dragging');
    const cancelled=event?.type==='pointercancel'||event?.type==='lostpointercapture';
    if(cancelled){
      placedObjects=drag.before;scheduleDraw();
      status('Déplacement annulé : objet remis à sa place');return;
    }
    const original=drag.before.find(obj=>obj.id===drag.id);
    const moved=placedObjects.find(obj=>obj.id===drag.id);
    const changed=!!original&&!!moved&&(
      Math.abs(original.transform.x-moved.transform.x)>.0001||
      Math.abs(original.transform.y-moved.transform.y)>.0001);
    if(changed){
      objectHistory.push(drag.before);
      if(objectHistory.length>40)objectHistory.shift();
      objectRedo=[];updateObjectCount();
      status('Objet déplacé · ↶ Objet pour annuler · Exporter scène pour sauvegarder');
    }
    return;
  }
  if(surfaceDrawing){
    surfaceDrawing=false;surfaceLastCell='';
    const changed=appendSculptSurfaceStroke(surface,{
      materialId:$('surface-material').value,
      terrainFamilyId:surfacePaintFamilySelect?.value,points:surfaceStrokePoints,
      width:Number($('surface-width').value)*SCULPT_TILE.width
    });
    surfaceStrokePoints=[];
    surfaceCommit(changed);return;
  }
  if(rampGesture){
    const gesture=rampGesture;rampGesture=null;rampEnd=null;
    const cancelled=event?.type==='pointercancel'||event?.type==='lostpointercapture';
    if(!cancelled){
      if(gesture.moved){
        commitTerrainRamp(gesture.previousStart??gesture.origin,gesture.last);
      }else if(!gesture.previousStart){
        rampStart=gesture.origin;
        status('Pied choisi. Touche maintenant le sommet PLUS HAUT.');
        updateRampGuide();
      }else commitTerrainRamp(gesture.previousStart,gesture.last);
    }
    updateRampGuide();scheduleDraw();return;
  }
  if(precisionDragging){
    precisionDragging=false;
    spherePreviewDismissed=false;
    updatePrecisionActions();
    return;
  }
  if(drawing&&strokeUndo){
    commitUndo(strokeUndo);
    strokeUndo=null;
  }
  drawing=false;lastCell='';strokePoints=[];
  if(selectedMode.startsWith('sphere-')){
    spherePreviewDismissed=false;
    // Retain the last target on touch devices; it is not persisted in the map.
    scheduleDraw();
  }
}

/* V17 isolated gameplay probe. Position and movement use the existing Exploration
   stepMovement. Collision World alone decides whether the sculpt terrain blocks
   that movement. The editor never persists player navigation in map JSON. */
function navigationWorld(){
  const current=sculptInteriors.find(e=>e.area.id===activeInteriorId);
  const base={width:terrain.width*SCULPT_TILE.width,
    height:terrain.height*SCULPT_TILE.height,objects:placedObjects,obstacles:[],
    boundary:current?.area.boundary,
    walls:current?.area.walls??[]};
  const worldArea=sculptWorldDraft?.areas.find(a=>a.id===sculptWorldAreaId);
  return worldArea?{...base,boundary:worldArea.boundary,
    walls:worldArea.walls}:base;
}
function navigationMaxStep(){
  // V75: an abrupt sculpt cell boundary is NEVER a free walking step. The
  // old 1-3 level HUD toggle bypassed the authored-height access design.
  return SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepUp;
}
let navBridgePlacements=null,navBridgeProjection=null,navStairProjection=null;
function resolvedSculptBridges(){
  if(navBridgePlacements!==placedObjects){
    navBridgePlacements=placedObjects;
    navBridgeProjection=resolveWorldObjectPlacements(placedObjects,sculptPreviewCollisionCatalog)
      .filter(o=>o.kind==='bridge');
    navStairProjection=resolveWorldObjectPlacements(placedObjects,sculptPreviewCollisionCatalog)
      .filter(o=>o.kind==='stairs'||o.kind==='ramp');
  }
  return navBridgeProjection;
}
function resolvedSculptStairs(){resolvedSculptBridges();return navStairProjection;}
function activeSculptBridge(){
  if(!navigationTesting||!navActor?.sculptBridgeId)return null;
  return resolvedSculptBridges().find(bridge=>bridge.id===navActor.sculptBridgeId&&
    sculptBridgeDeckAt([bridge],navActor.x,navActor.y,
      Math.max(0,Number(navActor.radius)||0)))??null;
}
function navigationContext(){
  const maxStep=navigationMaxStep();
  return {objectCatalog:sculptPreviewCollisionCatalog,
    sculptNavigation:{terrain,cellWidth:SCULPT_TILE.width,
      cellHeight:SCULPT_TILE.height,projectionRise:SCULPT_TILE.rise,
       maxStepUp:maxStep,maxStepDown:maxStep,
      shoreEntryFraction:.14,bridges:resolvedSculptBridges(),
      stairs:[...resolvedSculptStairs(),...sculptTerrainRampProjections(terrain)]}};
}
// Explain actual rejection from the SAME swept-height check used by Collision
// World; never guess physics from rounded visual cliff pixels.
function navigationBlockMessage(reason){
  if(!reason)return 'obstacle, bâtiment ou bord de la carte';
  if(reason.kind==='bounds')return 'limite de la carte';
  if(reason.kind==='water')return 'eau profonde (nage nécessaire)';
  if(reason.kind==='sphere-wall'||reason.kind==='sphere-projection')
    return 'colline haute : flanc et sommet bloqués depuis le sol (pentes V77)';
  if(reason.kind==='bridge-edge')return 'rebord du pont : sortie par les extrémités uniquement';
  if(reason.kind==='stair-edge')return 'pente/escalier : accès uniquement par une extrémité praticable';
  if(reason.kind==='cliff-projection')return 'falaise nord : rebord bloqué avant le sommet visible';
  if(reason.kind==='height-up'||reason.kind==='height-down')
    return reason.limit===0
      ?'falaise infranchissable : '+reason.from+'→'+reason.to+
        ' (passage par pente ou escalier raccordé)'
      :(reason.kind==='height-up'?'montée':'descente')+' '+reason.from+'→'+reason.to+
        ' (écart '+reason.delta+', franchissement '+reason.limit+')';
  return 'obstacle';
}
function navHeight(){
  const stairLevel=navActor?.sculptStairId?sculptStairHeightAt(terrain,
    [...resolvedSculptStairs(),...sculptTerrainRampProjections(terrain)],
    navActor.sculptStairId,navActor.x,navActor.y,
    {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height}):null;
  if(stairLevel!==null)return stairLevel;
  const info=navActor&&sculptNavigationSample(terrain,navActor.x,navActor.y,
    {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
  const activeBridge=navActor?.sculptBridgeId?resolvedSculptBridges().find(bridge=>
    bridge.id===navActor.sculptBridgeId):null;
  const deck=activeBridge?sculptBridgeDeckHeight(terrain,resolvedSculptBridges()
    .filter(bridge=>bridge.id===activeBridge.id),
    navActor.x,navActor.y,{cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height}):null;
  // Read height only from World Model; an actor legitimately standing on a
  // flat spherical summit uses that elevation for rendering and hero size.
  return deck??((info?.level??0)+(navActor?
    sculptSphereDisplacementAt(terrain,navActor.x,navActor.y):0));
}
function centerNavigationCamera(){
  if(!navigationTesting||!navActor)return;
  const {width,height}=dimensions();
  if(activeInteriorId || sculptWorldAreaMounted){
    // Runtime follows the actor on every canonical WorldArea, including
    // immediately after a Portal transition. Bounds are for editor framing,
    // not an alternate camera authority that can displace the hero.
    // Empty backdrop is preferable to losing the actor at shallow pitch.
    const follow=sculptCameraFollowActor(cameraView(),{
      x:navActor.x,y:navActor.y,level:navVisualLevel??navHeight(),
      rise:SCULPT_TILE.rise
    },{width,height,zoom,anchorY:.54});
    pan.x=follow.x;pan.y=follow.y;return;
  }
  const bounds=cameraBounds(),point=sculptCameraProject(cameraView(),
    navActor.x,navActor.y-(navVisualLevel??navHeight())*SCULPT_TILE.rise);
  const worldWidth=bounds.width*zoom,worldHeight=bounds.height*zoom;
  const targetX=width*.5-point.x*zoom;
  const targetY=height*.57-point.y*zoom;
  pan.x=worldWidth<width?(width-worldWidth)*.5:
    Math.max(width-bounds.maxX*zoom,Math.min(-bounds.minX*zoom,targetX));
  pan.y=worldHeight<height?(height-worldHeight)*.5-bounds.minY*zoom:
    Math.max(height-bounds.maxY*zoom,Math.min(-bounds.minY*zoom,targetY));
}
function drawNavigationBridgeCorridors(){
  // Diagnostics are presentation-only and read the exact resolved deck that
  // sculptNavigationBlockDetail / Collision World uses, at current camera pitch.
  const view=cameraView();
  for(const bridge of resolvedSculptBridges()){
    const corridor=sculptBridgeDeckAt([bridge],bridge.transform.x,bridge.transform.y,0);
    if(!corridor)continue;
    const level=sculptBridgeDeckHeight(terrain,[bridge],bridge.transform.x,bridge.transform.y,
      {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height})??0;
    const points=sculptCameraProjectBridgeCorridor(view,corridor,
      {level,rise:SCULPT_TILE.rise});
    if(points.length!==4)continue;
    ctx.save();ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);
    for(const point of points.slice(1))ctx.lineTo(point.x,point.y);
    ctx.closePath();ctx.fillStyle='rgba(85,233,193,.12)';ctx.fill();
    ctx.strokeStyle='rgba(84,233,193,.85)';ctx.lineWidth=1.8;ctx.stroke();ctx.restore();
  }
}
function drawNavigationActor(){
  if(!navActor)return;
  const deckBridge=activeSculptBridge();
  const visualRect=deckBridge?sculptObjectVisualRect(deckBridge,terrain,{
    tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height,rise:SCULPT_TILE.rise}):null;
  // First project the world elevation like any ground point; then lift
  // the actor feet in SCREEN units. Bridge artwork is not pitch-scaled, so
  // pre-projection lift was 43% smaller at 35° than at 90°.
  const footY=navActor.y-(navVisualLevel??navHeight())*SCULPT_TILE.rise+3;
  const projected=sculptCameraProjectBridgeFoot(cameraView(),navActor.x,footY,
    sculptBridgeVisualFootLift(visualRect,deckBridge));
  // Capture the ACTUAL sprite rendering transform (not inferred coordinates).
  // All interiors, including polygonal ones, must give the sprite an
  // unpitched matrix: otherwise 35° and 80° paint different hero positions.
  const matrix=ctx.getTransform();
  navHeroRenderTransform={a:matrix.a,b:matrix.b,c:matrix.c,d:matrix.d,
    e:matrix.e,f:matrix.f};
  // The native Exploration actor renderer owns idle/walk motion, shadow,
  // visual anchor and direction; gameplay state is read-only.
  if(navigationActorPreparer.get(navigationActorVisual.assetId))
    navigationActorRenderer.draw(ctx,{
      camera:{x:0,y:0},
      actors:[{x:projected.x,y:projected.y,facingX:navActor.facingX,
        moving:navActor.moving,mapVisual:navigationActorVisual,
         visualScale:sculptAltitudeVisualState(navVisualLevel??navHeight()).heroScale}],
      timeSeconds:navVisualTime
    });
}
function navigationSpawn(){
  // WorldBuilder's Spawn, not a prototype test position, owns the entrance
  // of a region/instance. Still validate it through native Collision World.
  const worldArea=sculptWorldDraft?.areas.find(a=>a.id===sculptWorldAreaId);
  const worldSpawn=worldArea?.spawns.find(s=>s.id===
    (sculptWorldDraft.initialAreaId===sculptWorldAreaId
      ?sculptWorldDraft.initialSpawnId:worldArea.spawns[0]?.id));
  if(worldSpawn&&Number.isFinite(worldSpawn.x)&&Number.isFinite(worldSpawn.y)){
    const candidate={x:worldSpawn.x,y:worldSpawn.y,radius:5,
      locomotion:{modes:['ground']},facingX:1,moving:false};
    const level=sculptNavigationSample(terrain,candidate.x,candidate.y,
      {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
    if(level?.waterDepth===0&&
       !isBlocked(navigationWorld(),candidate,candidate.x,candidate.y,
         undefined,navigationContext()))return candidate;
  }
  // Start in an area known to be dry in the default demo; valid for a
  // user-imported terrain too, because the fallback searches dry cells.
  // For cross/L/T polygons the TEST avatar begins in the central corridor,
  // not at the far end of the southern arm where left/right movement is
  // correctly blocked by the outline and can be mistaken for broken input.
  const polygonal=!!activeInteriorId&&
    sculptInteriors.some(e=>e.area.id===activeInteriorId&&e.area.boundary?.kind==='polygon');
  const preferred=activeInteriorId
    ?(polygonal?[[Math.floor(terrain.width/2),Math.floor(terrain.height/2)],
       [Math.floor(terrain.width/2),terrain.height-3],[3,3],[2,2]]:
       [[Math.floor(terrain.width/2),terrain.height-3],[3,3],[2,2]])
    :[[3,3],[2,2],[terrain.width-3,2],[2,terrain.height-3]];
  for(let y=1;y<terrain.height-1;y++)for(let x=1;x<terrain.width-1;x++)preferred.push([x,y]);
  for(const [x,y] of preferred){
    const candidate={x:(x+.5)*SCULPT_TILE.width,y:(y+.5)*SCULPT_TILE.height,
      radius:5,locomotion:{modes:['ground']},facingX:1,moving:false};
    const level=sculptNavigationSample(terrain,candidate.x,candidate.y,
      {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
    if(level?.waterDepth===0&&!sculptSphereAt(terrain,candidate.x,candidate.y,candidate.radius)&&
      !sculptSphereProjectionBlock(terrain,candidate.x,candidate.y,
        {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height,
          projectionRise:SCULPT_TILE.rise,radius:candidate.radius})&&
      !isBlocked(navigationWorld(),candidate,candidate.x,candidate.y,undefined,navigationContext()))return candidate;
  }
  return null;
}
function updateNavigationInfo(forced=false){
  if(!navigationTesting||!navActor)return;
  updateSculptDoorAction();
  updateSculptWorldPortalAction();
  const info=sculptNavigationSample(terrain,navActor.x,navActor.y,
    {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
  const deck=activeSculptBridge();
  const value=info?'Case '+(info.col+1)+' / '+(info.row+1)+' · hauteur '+info.level+
    (deck?' · 🌉 SUR LE PONT':'')+
    (navActor.sculptStairId?' · 🪜 ESCALIER '+navHeight().toFixed(1):'')+
    (info.waterDepth>0?' · eau '+info.waterDepth:'')+
    (navBlocked?' · bloqué : '+navigationBlockMessage(navBlockReason):''):'Hors zone';
  if(forced||value!==navLastState){$('navigation-status').textContent=value;navLastState=value;}
}
function navigationInput(){
  let x=(navKeys.has('arrowright')||navKeys.has('d')?1:0)-
    (navKeys.has('arrowleft')||navKeys.has('a')||navKeys.has('q')?1:0);
  let y=(navKeys.has('arrowdown')||navKeys.has('s')?1:0)-
    (navKeys.has('arrowup')||navKeys.has('w')||navKeys.has('z')?1:0);
  if(navStick&&Math.hypot(navStick.x,navStick.y)>.13){
    x=navStick.x;y=navStick.y;
  }
  return {x,y};
}
function navigationTick(time){
  if(!navigationTesting)return;
  if(sculptPendingEncounter){
    navPreviousTime=time;
    navActor.moving=false;
    navFrame=requestAnimationFrame(navigationTick);
    return;
  }
  if(navPreviousTime!==null){
    const elapsed=Math.max(0,time-navPreviousTime);
    const rawIntent=navigationInput();
    // Joystick and keyboard are screen-relative; Collision World still
    // receives a normal, single-authority X/Y world movement intention.
    const intent=sculptCameraWorldInput(cameraView(),rawIntent.x,rawIntent.y);
    navMetricFrames++;
    navVisualTime+=Math.min(250,elapsed)/1000;
    if(elapsed>0&&Math.hypot(intent.x,intent.y)>.13){
      navInputElapsedMs+=elapsed;
      const previousX=navActor.x,previousY=navActor.y;
      const world=navigationWorld(),context=navigationContext();
      // Critical V21: retain elapsed time during dropped frames, but apply
      // movement with short steps so Collision World still stops cliffs/water.
      for(const dt of sculptNavigationFrameSteps(elapsed))
        stepMovement(world,navActor,intent,dt,
          {maxSpeed:navSpeed()*intent.speedMultiplier},undefined,context);
      const moved=Math.hypot(navActor.x-previousX,navActor.y-previousY);
      navMetricDistance+=moved;
      navBlocked=moved<.001;
      navBlockReason=null;
      if(navBlocked){
        const magnitude=Math.hypot(intent.x,intent.y);
        const probe=8/magnitude;
        navBlockReason=sculptNavigationBlockDetail(context.sculptNavigation,navActor,
          navActor.x+intent.x*probe,navActor.y+intent.y*probe);
      }
      navActor.moving=moved>.001;
      if(intent.x!==0)navActor.facingX=intent.x<0?-1:1;
      // Trigger only from canonical post-collision hero coordinates.
      // No dice roll from materials, pixels, or pre-collision input.
      sculptEncounterStep();
      // Camera tracks x/y and the smoothed altitude after the movement loop.
      updateNavigationInfo();
    }else if(navActor.moving){navActor.moving=false;scheduleDraw();}
    const previousVisualLevel=navVisualLevel;
    navVisualLevel=sculptVisualHeightStep(navVisualLevel,navHeight(),elapsed);
    // Smooth only the pictured elevation and vertical follow, never collision.
    if(Math.hypot(intent.x,intent.y)>.13 ||
       Math.abs(navVisualLevel-previousVisualLevel)>.0001)
      centerNavigationCamera();
    // Idle remains alive without keeping the heavy canvas redraw at 60fps.
    if(time-navLastVisualPaint>=(navActor.moving?33:55)){
      navLastVisualPaint=time;scheduleDraw();
    }
    if(!navMetricLast)navMetricLast=time;
    if(time-navMetricLast>=900){
      const elapsedSec=(time-navMetricLast)/1000;
      navFps=Math.round(navMetricFrames/elapsedSec);
      navStepSpeed=Math.round(navMetricDistance/elapsedSec);
      $('navigation-metrics').textContent=navFps+' FPS · '+navStepSpeed+
        ' unités/s réelles'+(navBlocked?' · obstacle':'');
      navMetricFrames=0;navMetricDistance=0;navMetricLast=time;
    }
  }
  navPreviousTime=time;
  navFrame=requestAnimationFrame(navigationTick);
}
function setNavigationTesting(on){
  if(on===navigationTesting)return;
  if(on)setSculptEncounterEditorOpen(false);
  // Old world saves predate encounter profiles. The user must explicitly
  // approve initializing them; intentional 0% gameplay is never overwritten.
  if(on&&sculptWorldDraft&&!sculptEncounterSetupOffered&&
      encounterConfigNeedsExplicitInitialization(sculptEncounterConfig)){
    sculptEncounterSetupOffered=true;
    if(window.confirm('Ce monde ne peut déclencher aucune rencontre (0 % sur tous les terrains). '+
        'Activer les réglages de rencontres des présets ? Tu pourras les modifier dans Rencontres.')){
      sculptWorldDraft=initializeWorldPresetEncounters(sculptWorldDraft);
      sculptEncounterConfig=sculptWorldDraft.encounterConfig;
      refreshSculptEncounterEditor();
    }
  }
  if(on){
    if(interiorConnectorMode)setInteriorConnectorMode(false);
    if(interiorWallMode)setInteriorWallMode(null);
    if(interiorDoorMoving)setInteriorDoorMoving(false);
    if(objectEditing)setObjectEditing(false); // keep object palette out of the walking HUD
    if(surfaceEditing)setSurfaceEditing(false);
    navActor=navigationSpawn();
    if(!navActor){status('Aucune case sèche disponible pour le test');return;}
    navigationTesting=true;
    // The existing Tester tap is the trusted Android user gesture. The
    // browser may not start audio on page load, so do not add an audio button.
    explorationSoundtrack.start();
    if(sculptEncounterController)sculptCombatWarmup.start();
    if(sculptWorldDraft)$('world-area-portal-panel').open=false;
    navViewport={zoom,pan:{...pan}};
    navKeys.clear();navBlocked=false;navBlockReason=null;navLastState='';
    $('world-portal-feedback').hidden=true;
    $('navigation-hud').open=false; // unobstructed playfield by default
    $('navigation-hud').hidden=false;$('navigation-stick').hidden=false;
    $('navigation-toggle').textContent='✎ Éditer';
    $('navigation-toggle').setAttribute('aria-pressed','true');
    document.body.classList.add('navigation-testing');
    $('navigation-locomotion').value='ground';
    navActor.locomotion={modes:['ground']};
    navStick=createVirtualStick($('navigation-stick'),$('navigation-knob'),30);
    // Keep the hero and movement legible on a small phone display.
    zoom=navigationCameraZoom();
    $('zoom').value=String(Math.round(zoom*100));
    navTerrainCache=null;navFps=0;navStepSpeed=0;
    navVisualLevel=navHeight();
    navVisualTime=0;navLastVisualPaint=-Infinity;
    navMetricLast=0;navMetricFrames=0;navMetricDistance=0;
    navInputElapsedMs=0;
    $('navigation-metrics').textContent='Mesure de fluidité en cours…';
    centerNavigationCamera();
    updatePrecisionActions();updateNavigationInfo(true);
    sculptEncounterController?.resetAnchor();
    sculptEncounterStep(); // seed the cadence anchor at the actual spawn
    navPreviousTime=null;navFrame=requestAnimationFrame(navigationTick);
    status(sculptWorldDraft
      ?'Test de navigation : approche du cercle SORTIE puis appuie sur « 🚪 Entrer » pour changer de zone.'
      :'Test de navigation : joystick à maintenir · vitesse réglable dans la palette de droite.');
  }else{
    if(sculptEncounterHost?.active)return; // Combat owns the overlay until completion
    releaseSculptEncounter();
    sculptEncounterController?.resetAnchor();
    navigationTesting=false;
    explorationSoundtrack.stop();
    cancelAnimationFrame(navFrame);navFrame=0;navPreviousTime=null;
    navStick?.dispose();navStick=null;navKeys.clear();
    document.body.classList.remove('navigation-testing');
    $('navigation-hud').hidden=true;$('navigation-stick').hidden=true;
    $('world-portal-feedback').hidden=true;
    $('navigation-toggle').textContent='🚶 Tester';
    $('navigation-toggle').setAttribute('aria-pressed','false');
    if(navViewport){zoom=navViewport.zoom;pan=navViewport.pan;}
    $('zoom').value=String(Math.round(zoom*100));
    navActor=null;navViewport=null;navBlocked=false;navBlockReason=null;navTerrainCache=null;
    navVisualLevel=null;
    navLastVisualPaint=-Infinity;
    updatePrecisionActions();updateSculptWorldPortalAction();scheduleDraw();
    status('Édition réactivée : le test de marche n’a modifié aucune donnée.');
  }
  scheduleDraw();
}
for(const id of ['navigation-sky-time','navigation-sky-clouds','navigation-sky-mist','navigation-sky-stars']){
  $(id).addEventListener('change',()=>{navSkyCache=null;scheduleDraw();});
}
window.__sculptSkyProbe=()=>Object.freeze({
  time:$('navigation-sky-time').value,clouds:$('navigation-sky-clouds').checked,
  mist:$('navigation-sky-mist').checked,stars:$('navigation-sky-stars').checked,
  cached:!!navSkyCache,stats:navSkyCache?.stats??null,
  size:navSkyCache?{width:navSkyCache.image.width,height:navSkyCache.image.height}:null
});
$('navigation-max-step').addEventListener('input',()=>{
  $('navigation-max-step-value').textContent=String(navigationMaxStep());
  navBlocked=false;navBlockReason=null;
  updateNavigationInfo(true);
});
$('navigation-camera-angle').addEventListener('input',()=>{
  $('navigation-camera-angle-value').textContent=$('navigation-camera-angle').value+'°';
  // The cache is unmodified; affine reprojection of the existing raster is cheap.
  if(navigationTesting){centerNavigationCamera();scheduleDraw();}
});
$('navigation-camera-zoom').addEventListener('input',()=>{
  $('navigation-camera-zoom-value').textContent=$('navigation-camera-zoom').value+' %';
  if(navigationTesting){
    zoom=navigationCameraZoom();$('zoom').value=String(Math.round(zoom*100));
    centerNavigationCamera();scheduleDraw();
  }
});
$('navigation-show-bridge-corridor').addEventListener('change',scheduleDraw);
$('navigation-speed').addEventListener('input',()=>{
  $('navigation-speed-value').textContent=$('navigation-speed').value;
  updateNavigationInfo(true);
});
$('navigation-toggle').addEventListener('click',()=>{
  // This click is the trusted user activation. Start playback BEFORE any
  // optional legacy-encounter confirm() can consume it on Android.
  if(!navigationTesting)explorationSoundtrack.start();
  setNavigationTesting(!navigationTesting);
  if(!navigationTesting)explorationSoundtrack.stop(); // No spawn / edit mode.
});
$('navigation-reset').addEventListener('click',()=>{
  if(!navigationTesting||sculptPendingEncounter)return;
  navActor=navigationSpawn();
  navVisualLevel=navHeight();
  const mode=$('navigation-locomotion').value;
  navActor.locomotion={modes:mode==='fly'?['fly']:mode==='swim'?['ground','swim']:['ground']};
  navBlocked=false;
  sculptEncounterController?.resetAnchor();sculptEncounterStep();
  centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
});
$('navigation-locomotion').addEventListener('change',()=>{
  if(!navigationTesting)return;
  const mode=$('navigation-locomotion').value;
  navActor.locomotion={modes:mode==='fly'?['fly']:mode==='swim'?['ground','swim']:['ground']};
  navBlocked=false;updateNavigationInfo(true);scheduleDraw();
});
window.addEventListener('keydown',event=>{
  if(!navigationTesting||event.ctrlKey||event.altKey||event.metaKey)return;
  const key=event.key.toLowerCase();
  if(!['arrowup','arrowdown','arrowleft','arrowright','z','q','s','d','w','a'].includes(key))return;
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;
  event.preventDefault();navKeys.add(key);
});
window.addEventListener('keyup',event=>navKeys.delete(event.key.toLowerCase()));
window.addEventListener('blur',()=>{navKeys.clear();navStick?.reset();});
window.addEventListener('pagehide',()=>sculptEncounterHost?.dispose(),{once:true});
window.__sculptNavProbe=()=>Object.freeze({
  enabled:navigationTesting,player:navActor?{x:navActor.x,y:navActor.y,
    level:navHeight(),locomotion:[...navActor.locomotion.modes]}:null,
  blocked:navBlocked,blockReason:navBlockReason,maxStep:navigationMaxStep(),
  speed:navSpeed(),zoom,fps:navFps,actualSpeed:navStepSpeed,
  inputElapsedMs:navInputElapsedMs,
  terrainCached:!!navTerrainCache,joystickAttached:!!navStick,activeFrames:navFrame>0,
  actorMotion:navActor?.moving?'walk':'idle',
  deckBridgeId:activeSculptBridge()?.id??null,
  stairId:navActor?.sculptStairId??null,stairHeight:navActor?navHeight():null,
  inclineKind:navActor?.sculptStairId
    ?[...resolvedSculptStairs(),...sculptTerrainRampProjections(terrain)]
      .find(o=>o.id===navActor.sculptStairId)?.kind??null:null,
  physicalBridgeLayer:navActor?.sculptBridgeId?'deck':'ground',
  bridgeCorridorVisible:$('navigation-show-bridge-corridor')?.checked??false,
  actorPrepared:!!navigationActorPreparer.get(navigationActorVisual.assetId),
  actorMotionTime:navVisualTime,actorVisualLevel:navVisualLevel,
  actorRenderTransform:navHeroRenderTransform,
  actorScreen:navActor?(()=>{
    const p=sculptCameraProject(cameraView(),navActor.x,
      navActor.y-(navVisualLevel??navHeight())*SCULPT_TILE.rise);
    return {x:pan.x+p.x*zoom,y:pan.y+p.y*zoom};
  })():null,
  sameTerrainVersion:terrain.schemaVersion===1
});


/* Native WorldObject definitions/placements and asset resolver own the catalog,
   dimensions and collision semantics. Sculpt remains geometry-only. */
function drawPlacedActors(maxY=Infinity,minY=-Infinity){
  if(!captureActorProvider||!captureActorRenderer||!placedActors.length)return;
  const renderActors=placedActors.filter(p=>p.y<maxY&&p.y>=minY)
    .map(p=>createPlacedMapActorView(p,captureActorProvider.resolveDefinition))
    .filter(Boolean)
    .map(actor=>{
      const footY=actor.y-sculptHeightAt(terrain,
        Math.floor(actor.x/SCULPT_TILE.width),
        Math.floor(actor.y/SCULPT_TILE.height))*SCULPT_TILE.rise+3;
      const point=navigationTesting
        ?sculptCameraProject(cameraView(),actor.x,footY)
        :{x:actor.x,y:footY};
      return {...actor,x:point.x,y:point.y};
    });
  if(renderActors.length)
    captureActorRenderer.draw(ctx,{camera:{x:0,y:0},
      actors:renderActors,timeSeconds:navVisualTime});
}
function drawPreviewObject(object,{foregroundRailOnly=false}={}){
  // V77: the ramp is terrain, not a bitmap billboard. Draw its quad in the
  // shared world projection, including its genuine rise from foot to head.
  if(object.kind==='ramp'){
    drawSculptRamp(ctx,object,terrain,{
      view:navigationTesting?cameraView():null,tileWidth:SCULPT_TILE.width,
      tileHeight:SCULPT_TILE.height,rise:SCULPT_TILE.rise,
      texture:currentTexture,
      baseColor:registry.require(displayedBaseMaterialId(),'surface')?.render?.baseColor??'#677955'
    });
    return;
  }
  const art=objectImage(object.visual?.assetId);
  if(!art||(art instanceof Image&&!art.complete)||
     !(art.naturalWidth??art.width))return;
  const rect=sculptObjectVisualRect(object,terrain,{
    tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height,rise:SCULPT_TILE.rise});
  const {width,height}=rect;
  const artShift=sculptBridgeDeckArtShift(rect,object);
  const point=navigationTesting?sculptCameraProject(cameraView(),rect.x,rect.y):rect;
  // Dense forests keep all canonical objects but need not rasterize offscreen
  // billboards. A generous radius preserves tall/rotated sprites and sheared
  // 2.5D perspective near the screen edges.
  const projection=cameraView();
  const visiblePoint=navigationTesting?point:{
    x:rect.x,y:projection.shear*rect.x+projection.pitch*rect.y
  };
  const radius=Math.hypot(width,height)*(2+Math.abs(projection.shear))+Math.abs(artShift);
  const viewport=previewObjectViewport;
  if(viewport&&(visiblePoint.x+radius<viewport.minX||visiblePoint.x-radius>viewport.maxX||
    visiblePoint.y+radius<viewport.minY||visiblePoint.y-radius>viewport.maxY))return;
  ctx.save();ctx.translate(point.x,point.y);
  // V78 R2: a stair is sloping GROUND, not an upright billboard.
  // The preview terrain already uses this exact camera matrix; match it
  // locally in Tester while leaving bridges, rails and buildings untouched.
  if(navigationTesting&&object.kind==='stairs'){
    const view=cameraView();
    ctx.transform(1,view.shear,0,view.pitch,0,0);
  }
  ctx.rotate(rect.angle);
  if(foregroundRailOnly){
    if(object.kind!=='bridge'){ctx.restore();return;}
    const regions=sculptBridgeForegroundRegions(rect,artShift,object);
    // One foreground path: vertical variants expose only their lateral
    // handrails; never repaint centre planks over a bridge-mounted actor.
    if(!regions.length){ctx.restore();return;}
    ctx.beginPath();
    for(const rail of regions)ctx.rect(rail.x,rail.y,rail.width,rail.height);
    ctx.clip();
  }
  // Artwork's wooden deck is aligned to the canonical corridor center.
  // All camera pitches project that same WorldObject point.
  // Preserve exact historic bridge/static draw and its regression-tested order.
  const waterfallArt=resolveWorldObjectAsset(object.visual?.assetId);
  if(waterfallArt?.animation)
    drawWorldObjectSprite(ctx,art,waterfallArt,
      {x:-width/2,y:-height+artShift,width,height},performance.now()/1000);
  else ctx.drawImage(art,-width/2,-height+artShift,width,height);
  if(!foregroundRailOnly&&objectEditing&&objectSelectedId===object.id){
    ctx.strokeStyle='#bdffe4';ctx.lineWidth=Math.max(1,2/Math.max(.5,zoom));
    ctx.setLineDash([7,4]);ctx.strokeRect(-width/2,-height+artShift,width,height);
  }
  ctx.restore();
}
let sortedPreviewObjectSource=null,sortedPreviewObjects=[];
function sortedResolvedPreviewObjects(){
  // The placement array is immutable. Re-resolve only after an actual edit,
  // not on every animation frame or either half of the actor depth pass.
  if(sortedPreviewObjectSource!==placedObjects){
    sortedPreviewObjectSource=placedObjects;
    sortedPreviewObjects=[...resolveWorldObjectPlacements(placedObjects,objectDefinitionCatalogV1)]
      .sort((a,b)=>a.transform.y-b.transform.y);
  }
  return sortedPreviewObjects;
}
function drawPreviewObjects(maxY=Infinity,minY=-Infinity,skipBridgeId=null,skipStairId=null){
  for(const o of sortedResolvedPreviewObjects()){
    if(o.transform.y<=maxY&&o.transform.y>minY&&
      o.id!==skipBridgeId&&o.id!==skipStairId)drawPreviewObject(o);
  }
}
function refreshObjectOptions(){
  const current=$('object-definition').value;
  const definitions=availableObjects.filter(o=>o.kind===$('object-category').value);
  $('object-definition').replaceChildren(...definitions.map(o=>{
    const option=document.createElement('option');
    option.value=o.id;option.textContent=o.label;return option;
  }));
  if(definitions.some(o=>o.id===current))$('object-definition').value=current;
  // Stairs and bridges share native axis controls; stairs ascend along Y.
  const bridgeMode=$('object-category').value==='bridge';
  const stairMode=$('object-category').value==='stairs';
  const rampMode=$('object-category').value==='ramp';
  const passageMode=bridgeMode||stairMode||rampMode;
  $('object-scale-wrap').hidden=passageMode;
  $('object-bridge-length-wrap').hidden=!passageMode;
  $('object-bridge-width-wrap').hidden=!passageMode;
  $('object-bridge-length-wrap').firstChild.textContent=stairMode?'🪜 Longueur ':rampMode?'⛰️ Longueur ':'🌉 Longueur ';
  $('object-bridge-width-wrap').firstChild.textContent=stairMode?'🪜 Largeur ':rampMode?'⛰️ Largeur ':'🌉 Largeur ';
  $('object-scale').max=passageMode?'300':'120';
  $('object-bridge-length').setAttribute('aria-label',stairMode
    ?'Longueur de l’escalier, peut relier plusieurs hauteurs'
    :rampMode?'Longueur de la pente naturelle, pour relier deux niveaux réels'
    :'Longueur du pont sans élargir le passage');
  $('object-bridge-width').setAttribute('aria-label',stairMode
    ?'Largeur du passage dans l’escalier'
    :rampMode?'Largeur praticable de la pente naturelle'
    :'Largeur du pont sans allonger le passage');
  if(Number($('object-scale').value)>Number($('object-scale').max)){
    $('object-scale').value=$('object-scale').max;
    $('object-scale-value').textContent=$('object-scale').value+' %';
  }
  refreshObjectVariants();
}
function refreshObjectVariants(preferred=null){
  const definitionId=$('object-definition').value;
  const definition=objectDefinitionCatalogV1.get(definitionId);
  const variants=sculptPreviewVariants(definitionId);
  $('object-variant-wrap').hidden=variants.length===0;
  $('object-variant').replaceChildren(...variants.map(v=>{
    const option=document.createElement('option');
    option.value=v.id;option.textContent=v.label;return option;
  }));
  if(variants.length){
    const wanted=variants.find(v=>v.id===preferred)?.id??
      definition.visual.defaultVariantId??variants[0].id;
    $('object-variant').value=wanted;
  }
}
// In World Builder a house links to its own canonical WorldArea/Portal.
// The old standalone Sculpt-only interior preview is not a world document room.
function currentWorldHouseLink(buildingId){
  if(!sculptWorldDraft||!sculptWorldAreaId)return null;
  return sculptWorldDraft.portals.find(portal=>
    portal.sourceAreaId===sculptWorldAreaId&&
    portal.trigger?.kind==='object-anchor'&&
    portal.trigger.objectId===buildingId&&
    portal.targetAreaId!==sculptWorldAreaId&&
    sculptWorldDraft.areas.some(area=>area.id===portal.targetAreaId&&area.kind==='interior'))??null;
}
function syncObjectSelectedControls(){
  const selected=placedObjects.find(o=>o.id===objectSelectedId);
  const selectedDef=selected?objectDefinitionCatalogV1.get(selected.objectDefinitionId):null;
  const buildingSelected=!!selected&&selectedDef?.kind==='building'&&!activeInteriorId&&
    (!sculptWorldDraft||sculptWorldArea()?.kind==='exterior');
  const selectedHouseId=buildingSelected?selected.id:null;
  const houseTemplate=$('object-interior-template');
  houseTemplate.parentElement.hidden=!!sculptWorldDraft; // only standalone Sculpt uses templates
  // The dropdown is a transient choice for THIS house only. Reusing its
  // previous DOM value when selecting another house silently cloned the same
  // template; opening an already-linked house could overwrite custom work.
  if(lastSelectedInteriorHouseId!==selectedHouseId){
    houseTemplate.value='';
    lastSelectedInteriorHouseId=selectedHouseId;
  }
  $('object-open-interior').hidden=!buildingSelected;
  $('object-interior-link').hidden=!buildingSelected;
  $('interior-house-link-info').hidden=!buildingSelected;
  if(buildingSelected){
    const linked=sculptWorldDraft?!!currentWorldHouseLink(selected.id):
      sculptInteriors.some(e=>e.buildingId===selected.id);
    // Once an interior exists, its authored content is the only truth.
    // Templates can be applied explicitly INSIDE its own editor instead.
    houseTemplate.disabled=linked||!!sculptWorldDraft;
    if(linked)houseTemplate.value='';
    $('object-open-interior').textContent=linked?'🏠 Modifier son intérieur lié':
      '🏠 Créer et lier un intérieur à cette maison';
    $('interior-house-link-info').textContent=linked?
      'Pièce indépendante de cette maison : modifier son intérieur ne modifie aucune autre maison.':
      sculptWorldDraft?'Aucun intérieur World Builder : le bouton crée une vraie WorldArea et ses deux Portals pour CETTE maison.':
        'Pièce libre ou modèle au choix pour CETTE maison uniquement.';
  }
  if(!buildingSelected)houseTemplate.disabled=true;
  if(!selected){objectSelectedId=null;$('object-selected').textContent='Aucun objet sélectionné';return;}
  const def=selectedDef;
  $('object-category').value=def.kind;refreshObjectOptions();
  $('object-definition').value=def.id;
  refreshObjectVariants(selected.overrides.visualVariantId);
  $('object-scale').value=String(Math.round(selected.transform.scaleX*100));
  $('object-scale-value').textContent=$('object-scale').value+' %';
  $('object-bridge-length').value=String(Math.round((['stairs','ramp'].includes(def.kind)?selected.transform.scaleY:selected.transform.scaleX)*100));
  $('object-bridge-width').value=String(Math.round((['stairs','ramp'].includes(def.kind)?selected.transform.scaleX:selected.transform.scaleY)*100));
  $('object-bridge-length-value').textContent=$('object-bridge-length').value+' %';
  $('object-bridge-width-value').textContent=$('object-bridge-width').value+' %';
  $('object-rotation').value=String(Math.round(selected.transform.rotationDeg));
  $('object-rotation-value').textContent=$('object-rotation').value+'°';
  $('object-selected').textContent='Sélection : '+def.label+' ('+selected.id+')';
}
function editSelectedObject(patch){
  if(!$('object-palette').hidden&&objectSelectedId){
    const changed=updateSculptPreviewObject(placedObjects,objectSelectedId,patch);
    if(objectCommit(changed)){
      syncObjectSelectedControls();
      status('Objet modifié · Annuler disponible · Exporter scène pour conserver');
    }
  }
}
function updateObjectCount(){
  $('object-count').textContent=placedObjects.length+' / '+SCULPT_OBJECT_LIMIT+' objet(s) sur le relief';
  $('object-undo').disabled=objectHistory.length===0;
  $('object-redo').disabled=objectRedo.length===0;
  if(objectSelectedId&&!placedObjects.some(o=>o.id===objectSelectedId))objectSelectedId=null;
  scheduleDraw();
}
function objectCommit(next){
  if(next===placedObjects)return false;
  if(next.length===placedObjects.length&&next.every((o,i)=>o===placedObjects[i]))return false;
  objectHistory.push(placedObjects);if(objectHistory.length>40)objectHistory.shift();
  objectRedo=[];placedObjects=next;updateObjectCount();return true;
}
// Surface authoring reuses WorldSurface v3; only this UI owns undo/redo.
function loadSurfacePaintAssets(){
  const used=new Set([...surface.routes,...surface.zones].map(f=>f.materialId));
  for(const meta of SCULPT_SURFACE_MATERIALS){
    if(!used.has(meta.id)||surfacePaintImages.has(meta.id))continue;
    imageFor(meta.id,meta.assetKind).then(texture=>{
      if(!texture)return;
      surfacePaintImages.set(meta.id,texture);navTerrainCache=null;scheduleDraw();
    });
  }
}
function updateSurfaceCount(){
  // UI reads the same WorldSurface as the painter, undo and scene import.
  if(surfaceBaseFamilySelect)surfaceBaseFamilySelect.value=surface.baseTerrainFamilyId;
  const count=surface.routes.length+surface.zones.length;
  $('surface-count').textContent=count+' route(s) / zone(s) peintes';
  $('surface-undo').disabled=!surfaceHistory.length;
  $('surface-redo').disabled=!surfaceRedo.length;
  navTerrainCache=null;scheduleDraw();
}
function surfaceCommit(next){
  if(JSON.stringify(next)===JSON.stringify(surface))return false;
  surfaceHistory.push(surface);if(surfaceHistory.length>40)surfaceHistory.shift();
  surfaceRedo=[];surface=next;
  loadSurfacePaintAssets();updateSurfaceCount();
  status('Peinture enregistrée sur la scène · exporter la scène pour sauvegarder');
  return true;
}
function setSurfaceEditing(active){
  if(active&&interiorConnectorMode)setInteriorConnectorMode(false);
  if(active&&interiorDoorMoving)setInteriorDoorMoving(false);
  if(active&&interiorWallMode)setInteriorWallMode(null);
  if(active&&objectEditing)setObjectEditing(false);
  if(active&&navigationTesting)setNavigationTesting(false);
  surfaceEditing=!!active;
  if(!surfaceEditing){surfaceDrawing=false;surfaceStrokePoints=[];surfaceLastCell='';}
  document.body.classList.toggle('surface-editing',surfaceEditing);
  $('surface-palette').hidden=!surfaceEditing;
  $('mode-surface').classList.toggle('active',surfaceEditing);
  $('mode-surface').setAttribute('aria-pressed',String(surfaceEditing));
  for(const domain of ['ground','water']){
    $('mode-'+domain).classList.toggle('active',!surfaceEditing&&editorKind===domain);
    $('mode-'+domain).setAttribute('aria-pressed',String(!surfaceEditing&&editorKind===domain));
  }
  if(surfaceEditing){
    $('active-tool-label').textContent='Textures · dessiner route ou zone';
    status('Pinceau textures : touche ou trace une ligne sur le relief');
    loadSurfacePaintAssets();
  }else $('active-tool-label').textContent=editorKind+' · '+selectedMode;
  updatePrecisionActions();scheduleDraw();
}
surfaceBaseFamilySelect?.addEventListener('change',()=>{
  surfaceCommit(normalizeSculptSurface({...surface,
    baseTerrainFamilyId:surfaceBaseFamilySelect.value}));
});
$('surface-width').addEventListener('input',()=>{
  $('surface-width-value').textContent=$('surface-width').value+' cases';
});
$('surface-undo').addEventListener('click',()=>{
  if(!surfaceHistory.length)return;
  surfaceRedo.push(surface);surface=surfaceHistory.pop();
  updateSurfaceCount();
});
$('surface-redo').addEventListener('click',()=>{
  if(!surfaceRedo.length)return;
  surfaceHistory.push(surface);surface=surfaceRedo.pop();
  loadSurfacePaintAssets();updateSurfaceCount();
});
window.__sculptSurfaceProbe=()=>Object.freeze({
  active:surfaceEditing,
  routes:surface.routes.length,zones:surface.zones.length,
  baseTerrainFamilyId:surface.baseTerrainFamilyId,
  features:[...surface.routes,...surface.zones].map(f=>({
    id:f.id,materialId:f.materialId,terrainFamilyId:f.terrainFamilyId,width:f.width,points:f.points.length
  })),
  texturesLoaded:[...surfacePaintImages.keys()],
  undoCount:surfaceHistory.length
});

// Actor definitions, visuals and asset paths are owned by Capture,
 // while this sculpt preview stores only native WorldActorPlacement references.
async function loadCaptureActorCatalog(){
  try{
    const provider=await createCaptureActorPreviewProviderV1();
    const assets=provider.listAssets();
    const loader=createImageAssetLoader({resolveAsset:createMapActorAssetResolver(assets)});
    const results=await loader.load(assets.map(a=>a.id));
    if(results.ready!==assets.length||results.missing||results.errors)
      throw Error('Visuels Capture indisponibles : '+JSON.stringify(results));
    const preparer=createMapActorVisualPreparer({imageLoader:loader});
    const prepared=preparer.prepare(assets.map(a=>a.id));
    if(prepared.ready!==assets.length||prepared.errors)
      throw Error('Préparation visuelle Capture impossible');
    captureActorProvider=provider;
    captureActorRenderer=createMapActorRenderer({preparedVisuals:preparer});
    captureActorImageLoader=loader;
    const definitions=provider.listDefinitions();
    $('actor-definition').replaceChildren(...definitions.map(def=>{
      const opt=document.createElement('option');
      opt.value=def.id;opt.textContent=(def.displayName||def.id)+' · '+def.role;
      return opt;
    }));
    $('actor-definition').disabled=!definitions.length;
    $('actor-source-status').textContent=definitions.length+
      ' acteur(s) disponibles depuis Capture · vues natives';
    syncActorViewAvailability();
    scheduleDraw();
  }catch(e){
    $('actor-definition').disabled=true;
    $('actor-source-status').textContent='Catalogue Capture indisponible : '+e.message;
  }
}
function syncActorViewAvailability(){
  const definition=captureActorProvider?.resolveDefinition($('actor-definition').value);
  const back=$('actor-view').querySelector('option[value="back"]');
  if(back)back.disabled=!definition?.mapVisualByView?.back;
  if(back?.disabled&&$('actor-view').value==='back')$('actor-view').value='front';
}
function syncActorSelectedControls(){
  const selected=placedActors.find(actor=>actor.id===actorSelectedId);
  $('actor-selected').textContent=selected?
    'Acteur sélectionné : '+selected.id:'Aucun acteur sélectionné';
  if(!selected)return;
  $('actor-definition').value=selected.actorDefinitionId;
  syncActorViewAvailability();
  $('actor-facing').value=String(selected.facingX);
  $('actor-view').value=selected.visualView==='back'&&
    !!captureActorProvider?.resolveDefinition(selected.actorDefinitionId)?.mapVisualByView?.back
    ?'back':'front';
  $('actor-scale').value=String(Math.round((selected.visualScale??1)*100));
  $('actor-scale-value').textContent=$('actor-scale').value+' %';
}
function editSelectedActor(patch){
  if(!actorSelectedId||$('actor-action').value!=='select')return;
  if(actorCommit(updateSculptPreviewActor(placedActors,actorSelectedId,patch)))
    status('Acteur modifié : taille/orientation enregistrées dans la scène');
}
function updateActorCount(){
  $('actor-count').textContent=placedActors.length+' acteur(s) placés';
  $('actor-undo').disabled=!actorHistory.length;
  $('actor-redo').disabled=!actorRedo.length;
  scheduleDraw();
}
function actorCommit(next){
  if(next.length===placedActors.length&&next.every((a,i)=>a===placedActors[i]))return false;
  actorHistory.push(placedActors);if(actorHistory.length>40)actorHistory.shift();
  actorRedo=[];placedActors=next;updateActorCount();
  syncActorSelectedControls();
  return true;
}
function setActorSubmode(active){
  actorSubmode=!!active;
  if(!actorSubmode)actorSelectedId=null;
  $('object-controls').hidden=actorSubmode;
  $('actor-controls').hidden=!actorSubmode;
  $('active-tool-label').textContent=actorSubmode?'Objets · Acteurs Capture':'Objets · toucher pour placer ou supprimer';
  status(actorSubmode?'Acteurs : choisis une définition Capture et touche la carte':'Palette des objets ouverte');
  scheduleDraw();
}
function applyActorAtCell(cell){
  const x=(cell.x+.5)*SCULPT_TILE.width,y=(cell.y+.5)*SCULPT_TILE.height;
  if($('actor-action').value==='select'){
    const found=findSculptPreviewActorNear(placedActors,x,y);
    actorSelectedId=found?.id??null;
    syncActorSelectedControls();scheduleDraw();
    status(found?'Acteur sélectionné : modifie taille, vue ou direction':
      'Aucun acteur proche à sélectionner');
    return;
  }
  if($('actor-action').value==='remove'){
    actorSelectedId=null;syncActorSelectedControls();
    if(actorCommit(removeSculptPreviewActorAt(placedActors,x,y)))status('Acteur supprimé');
    else status('Aucun acteur proche à supprimer');
    return;
  }
  const definitionId=$('actor-definition').value;
  if(!captureActorProvider?.resolveDefinition(definitionId)){
    status('Définition Capture non chargée : aucun acteur placé');return;
  }
  syncActorViewAvailability();
  if(actorCommit(appendSculptPreviewActor(placedActors,{
    definitionId,x,y,facingX:Number($('actor-facing').value),
    visualScale:Number($('actor-scale').value)/100,
    visualView:$('actor-view').value
  })))status('Acteur Capture placé · exporter la scène pour sauvegarder');
}
$('actor-definition').addEventListener('change',syncActorViewAvailability);
$('actor-action').addEventListener('change',()=>{
  if($('actor-action').value!=='select')actorSelectedId=null;
  syncActorSelectedControls();scheduleDraw();
});
$('actor-scale').addEventListener('input',()=>{
  $('actor-scale-value').textContent=$('actor-scale').value+' %';
});
$('actor-scale').addEventListener('change',()=>
  editSelectedActor({visualScale:Number($('actor-scale').value)/100}));
$('actor-facing').addEventListener('change',()=>
  editSelectedActor({facingX:Number($('actor-facing').value)}));
$('actor-view').addEventListener('change',()=>
  editSelectedActor({visualView:$('actor-view').value}));
$('actor-open').addEventListener('click',()=>setActorSubmode(true));
$('actor-back').addEventListener('click',()=>setActorSubmode(false));
$('actor-undo').addEventListener('click',()=>{
  if(!actorHistory.length)return;
  actorRedo.push(placedActors);placedActors=actorHistory.pop();updateActorCount();
  syncActorSelectedControls();
});
$('actor-redo').addEventListener('click',()=>{
  if(!actorRedo.length)return;
  actorHistory.push(placedActors);placedActors=actorRedo.pop();updateActorCount();
  syncActorSelectedControls();
});
window.__sculptActorsProbe=()=>Object.freeze({
  active:objectEditing&&actorSubmode,
  catalogReady:!!captureActorProvider,
  definitions:captureActorProvider?.listDefinitions().map(d=>d.id)??[],
  count:placedActors.length,selectedId:actorSelectedId,
  viewChoices:[...$('actor-view').options].map(o=>({value:o.value,disabled:o.disabled})),
  actors:placedActors.map(p=>({id:p.id,definitionId:p.actorDefinitionId,
    x:p.x,y:p.y,facingX:p.facingX,visualScale:p.visualScale??1,
    visualView:p.visualView??'front'})),
  undoCount:actorHistory.length,redoCount:actorRedo.length
});
loadCaptureActorCatalog();
function setObjectEditing(active){
  if(active&&interiorConnectorMode)setInteriorConnectorMode(false);
  if(active&&interiorDoorMoving)setInteriorDoorMoving(false);
  if(active&&interiorWallMode)setInteriorWallMode(null);
  if(active&&surfaceEditing)setSurfaceEditing(false);
  objectEditing=!!active;
  if(!objectEditing){
    actorSubmode=false;$('object-controls').hidden=false;$('actor-controls').hidden=true;
  }
  document.body.classList.toggle('object-editing',objectEditing);
  $('object-palette').hidden=!objectEditing;
  $('mode-objects').classList.toggle('active',objectEditing);
  $('mode-objects').setAttribute('aria-pressed',String(objectEditing));
  if(objectEditing){
    for(const domain of ['ground','water']){
      $('mode-'+domain).classList.remove('active');
      $('mode-'+domain).setAttribute('aria-pressed','false');
    }
    $('active-tool-label').textContent='Objets · toucher pour placer ou supprimer';
    status('Choisis une catégorie : Escaliers ou Pentes (herbe, terre, roche), puis touche la carte.');
  }else{
    for(const domain of ['ground','water']){
      const active=editorKind===domain;
      $('mode-'+domain).classList.toggle('active',active);
      $('mode-'+domain).setAttribute('aria-pressed',String(active));
    }
    $('active-tool-label').textContent=editorKind+' · '+selectedMode;
  }
  updatePrecisionActions();scheduleDraw();
}
function applyObjectAtCell(cell){
  if(!objectEditing)return;
  const x=(cell.x+.5)*SCULPT_TILE.width,y=(cell.y+.5)*SCULPT_TILE.height;
  if($('object-action').value==='select'){
    const found=findSculptPreviewObjectNear(placedObjects,x,y);
    objectSelectedId=found?.id??null;
    syncObjectSelectedControls();scheduleDraw();
    status(found?'Objet sélectionné : garde le doigt appuyé et glisse pour le déplacer':'Aucun objet proche à sélectionner');
    return;
  }
  if($('object-action').value==='remove'){
    const found=findSculptPreviewObjectNear(placedObjects,x,y);
    if(!found){status('Aucun objet proche à supprimer');return;}
    if(objectCommit(removeSculptPreviewObject(placedObjects,found.id))){
      syncObjectSelectedControls();
      status('Objet supprimé : '+objectDefinitionCatalogV1.get(found.objectDefinitionId)?.label);
    }
    return;
  }
  const definitionId=$('object-definition').value;
  // Placement and drag use one Scene Preview authoring permission.
  if(!sculptObjectCanOccupyCell(terrain,definitionId,cell.x,cell.y)){
    status('Pose refusée dans l’eau : choisir une case de terre sèche');return;
  }
  const kind=objectDefinitionCatalogV1.get(definitionId)?.kind;
  const bridgeMode=kind==='bridge',stairMode=kind==='stairs'||kind==='ramp';
  const next=appendSculptPreviewObject(placedObjects,{definitionId,x,y,
    scale:Number($('object-scale').value)/100,
    scaleX:bridgeMode?Number($('object-bridge-length').value)/100:
      stairMode?Number($('object-bridge-width').value)/100:undefined,
    scaleY:bridgeMode?Number($('object-bridge-width').value)/100:
      stairMode?Number($('object-bridge-length').value)/100:undefined,
    rotationDeg:Number($('object-rotation').value),
    variantId:$('object-variant-wrap').hidden?null:$('object-variant').value});
  if(objectCommit(next))status('Objet placé : '+objectDefinitionCatalogV1.get(definitionId)?.label+
    ' · Exporter scène pour conserver le décor');
  else status('Limite de '+SCULPT_OBJECT_LIMIT+' objets atteinte');
}
$('object-category').addEventListener('change',()=>{objectSelectedId=null;
  syncObjectSelectedControls();refreshObjectOptions();});
$('object-definition').addEventListener('change',()=>{objectSelectedId=null;
  syncObjectSelectedControls();refreshObjectVariants();});
$('object-variant').addEventListener('change',()=>editSelectedObject({
  variantId:$('object-variant').value
}));
$('object-action').addEventListener('change',()=>{
  if($('object-action').value!=='select'){objectSelectedId=null;syncObjectSelectedControls();scheduleDraw();}
});
for(const [control,output,unit] of [['object-scale','object-scale-value',' %'],
  ['object-rotation','object-rotation-value','°']]){
  $(control).addEventListener('input',()=>{$(output).textContent=$(control).value+unit;});
  $(control).addEventListener('change',()=>editSelectedObject(
    control==='object-scale'?{scale:Number($(control).value)/100}:
    {rotationDeg:Number($(control).value)}));
}
for(const [id,bridgeAxis,stairAxis] of [['object-bridge-length','scaleX','scaleY'],['object-bridge-width','scaleY','scaleX']]){
  const control=$(id),output=$(id+'-value');
  control.addEventListener('input',()=>{output.textContent=control.value+' %';});
  control.addEventListener('change',()=>editSelectedObject({
    [[ 'stairs','ramp' ].includes($('object-category').value)?stairAxis:bridgeAxis]:Number(control.value)/100}));
}
for(const [id,direction] of [['object-turn-left',-45],['object-turn-right',45]]){
  $(id).addEventListener('click',()=>{
    const next=(Number($('object-rotation').value)+direction+360)%360;
    $('object-rotation').value=String(next);
    $('object-rotation-value').textContent=next+'°';
    editSelectedObject({rotationDeg:next});
  });
}
$('object-undo').addEventListener('click',()=>{
  if(!objectHistory.length)return;
  objectRedo.push(placedObjects);placedObjects=objectHistory.pop();updateObjectCount();syncObjectSelectedControls();
});
$('object-redo').addEventListener('click',()=>{
  if(!objectRedo.length)return;
  objectHistory.push(placedObjects);placedObjects=objectRedo.pop();updateObjectCount();syncObjectSelectedControls();
});
refreshObjectOptions();updateObjectCount();
window.__sculptObjectsProbe=()=>Object.freeze({
  active:objectEditing,paletteExpanded:$('object-palette').open,
  count:placedObjects.length,selectedId:objectSelectedId,
  terrainRasterBuilds,cachedGround:!!navTerrainCache,
  undoCount:objectHistory.length,redoCount:objectRedo.length,
  variantChoices:[...$('object-variant').options].map(o=>o.value),
  definitions:availableObjects.length,
  categories:[...$('object-category').options].map(o=>o.value),
  filteredDefinitions:[...$('object-definition').options].map(o=>o.value),
  objects:placedObjects.map(o=>({id:o.id,definition:o.objectDefinitionId,
    x:o.transform.x,y:o.transform.y,rotationDeg:o.transform.rotationDeg,
    scaleX:o.transform.scaleX,scaleY:o.transform.scaleY,
    visualVariantId:o.overrides.visualVariantId})),
  bridgeDimensionsVisible:!$('object-bridge-length-wrap').hidden&&
    !$('object-bridge-width-wrap').hidden,
  bridgeLengthPercent:Number($('object-bridge-length').value),
  bridgeWidthPercent:Number($('object-bridge-width').value),
  exportsIncludeObjects:JSON.parse(serializeSculptPreviewScene(terrain,placedObjects)).objects.length===placedObjects.length
});

canvas.addEventListener('pointerdown',begin);
canvas.addEventListener('pointermove',stroke);
canvas.addEventListener('pointerup',stop);
canvas.addEventListener('pointercancel',stop);
canvas.addEventListener('pointerleave',()=>{
  if(!drawing&&!precisionDragging){
    // A touch pointer often emits leave immediately on release; clearing the
    // preview here made the sphere brush vanish after every placement.
    if(!selectedMode.startsWith('sphere-'))hoverCell=null;
    scheduleDraw();
  }
});
canvas.addEventListener('lostpointercapture',stop);
canvas.addEventListener('wheel',event=>{
  event.preventDefault();
  const previous=zoom;
  zoom=Math.max(.32,Math.min(2.4,zoom*(event.deltaY>0?.90:1.1)));
  const rect=canvas.getBoundingClientRect();
  const mouseX=event.clientX-rect.left,mouseY=event.clientY-rect.top;
  pan.x=mouseX-(mouseX-pan.x)*zoom/previous;
  pan.y=mouseY-(mouseY-pan.y)*zoom/previous;
  if(navigationTesting)centerNavigationCamera();
  $('zoom').value=String(Math.round(zoom*100));scheduleDraw();
},{passive:false});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>selectMode(button.dataset.mode)));
$('quick-tool').addEventListener('change',()=>selectMode($('quick-tool').value));
$('ramp-cancel').addEventListener('click',()=>{
  rampStart=null;rampEnd=null;rampGesture=null;
  updateRampGuide();status('Pied annulé : touche un nouveau départ plus bas.');
  scheduleDraw();
});
$('quick-level-minus').addEventListener('click',()=>adjustQuickLevel(-1));
$('quick-level-plus').addEventListener('click',()=>adjustQuickLevel(1));
$('radius-minus').addEventListener('click',()=>adjustBrushSize(-.5));
$('radius-plus').addEventListener('click',()=>adjustBrushSize(.5));

$('mode-ground').addEventListener('click',()=>setEditorKind('ground'));
$('mode-water').addEventListener('click',()=>setEditorKind('water'));
$('mode-objects').addEventListener('click',()=>setObjectEditing(!objectEditing));
$('mode-surface').addEventListener('click',()=>setSurfaceEditing(!surfaceEditing));
$('fullscreen-toggle').addEventListener('click',toggleImmersive);
$('palette-toggle').addEventListener('click',()=>{
  const collapsed=document.body.classList.toggle('palette-collapsed');
  $('palette-toggle').setAttribute('aria-expanded',String(!collapsed));
  $('palette-toggle').setAttribute('aria-label',collapsed?'Afficher la palette d’outils':'Réduire la palette d’outils');
  $('palette-toggle').textContent=collapsed?'▾':'▴';
});
document.addEventListener('fullscreenchange',()=>{
  if(document.fullscreenElement)nativeFullscreenEntered=true;
  else if(nativeFullscreenEntered){
    nativeFullscreenEntered=false;
    if(document.body.classList.contains('sculpt-immersive'))setImmersive(false);
  }
  requestAnimationFrame(fit);
});
$('precision-mode').addEventListener('change',()=>{
  precisionCell=null;precisionDragging=false;
  $('preview-cursor').checked=true;
  spherePreviewDismissed=false;
  if($('precision-mode').checked&&selectedMode.startsWith('sphere-'))
    precisionCell={x:Math.floor(terrain.width/2),y:Math.floor(terrain.height/2)};
  updatePrecisionActions();
  status($('precision-mode').checked?
   'Placement précis : vise, ajuste avec les flèches, puis Appliquer. Aucun geste ne modifie la carte avant confirmation.':
   'Pinceau direct : touche et glisse pour peindre.');
});
$('apply-precision').addEventListener('click',precisionApply);
for(const [id,dx,dy] of [['nudge-left',-1,0],['nudge-up',0,-1],
   ['nudge-down',0,1],['nudge-right',1,0]]){
  $(id).addEventListener('click',()=>{
    if(!precisionCell)return;
    precisionCell={x:Math.max(0,Math.min(terrain.width-1,precisionCell.x+dx)),
      y:Math.max(0,Math.min(terrain.height-1,precisionCell.y+dy))};
    spherePreviewDismissed=false;
    updatePrecisionActions();
  });
}
$('undo').addEventListener('click',undo);
$('redo').addEventListener('click',redo);
window.addEventListener('keydown',event=>{
  if(!(event.ctrlKey||event.metaKey)||event.key.toLowerCase()!=='z'&&event.key.toLowerCase()!=='y')return;
  if(['TEXTAREA','INPUT'].includes(document.activeElement?.tagName))return;
  event.preventDefault();if(event.key.toLowerCase()==='y'||event.shiftKey)redo();else undo();
});
// New scene is a deliberately separate action from "flatten current terrain".
// Everything deleted is explicit in the confirm dialog, with no hidden state.
function setNewMapPanel(open){
  const value=!!open;
  $('new-map-panel').hidden=!value;
  $('new-map-toggle').setAttribute('aria-expanded',String(value));
  if(value){
    $('new-map-width').value=String(terrain.width);
    $('new-map-height').value=String(terrain.height);
    // A WorldArea owns its dimensions. Reset ONLY its authored scene.
    $('new-map-width').disabled=!!sculptWorldDraft;
    $('new-map-height').disabled=!!sculptWorldDraft;
    $('new-map-warning').textContent=sculptWorldDraft
      ?'Vider cette carte sans changer sa taille ni supprimer ses passages. Pour une autre taille, crée une zone dans le panneau Monde.'
      :'Sol plat, sans eau ni objet. La carte actuelle et ses annulations seront effacées.';
    $('world-area-new-map-hint').hidden=!sculptWorldDraft;
    $('new-map-confirm').checked=false;
    $('new-map-create').disabled=true;
    $('new-map-width').focus();
  }else $('new-map-toggle').focus();
}
$('new-map-toggle').addEventListener('click',()=>setNewMapPanel($('new-map-panel').hidden));
$('new-map-cancel').addEventListener('click',()=>setNewMapPanel(false));
$('new-map-confirm').addEventListener('change',()=>{
  $('new-map-create').disabled=!$('new-map-confirm').checked;
});
$('new-map-form').addEventListener('submit',event=>{
  event.preventDefault();
  if(!$('new-map-confirm').checked||!$('new-map-form').reportValidity())return;
  const width=Number($('new-map-width').value),height=Number($('new-map-height').value);
  if(!Number.isInteger(width)||width<8||width>80||
     !Number.isInteger(height)||height<8||height>64)return;
  if(navigationTesting)setNavigationTesting(false);
  if(objectEditing)setObjectEditing(false);
  if(surfaceEditing)setSurfaceEditing(false);
  const blank=createBlankSculptPreviewScene({width,height});
  // The World Builder's document de monde keeps Portal/Spawn and Encounter config.
  // Standalone Sculpt is allowed to start a fresh Encounter scene.
  if(!sculptWorldDraft){
    sculptEncounterConfig=sculptPreviewEncounterConfig;
    sculptExteriorEncounters=Object.freeze({randomEnabled:true});
  }
  sculptEncounterAreaCache=null;
  mountSculptArea(blank);
  refreshSculptEncounterEditor();
  drawing=false;strokeUndo=null;strokePoints=[];lastCell='';
  surfaceStrokePoints=[];surfaceDrawing=false;navLastState='';
  $('json').value='';$('json').hidden=true;
  updatePrecisionActions();setNewMapPanel(false);fit();
  if(sculptWorldDraft)refreshSculptWorldPanel();
  status('Carte vierge créée : '+width+' × '+height+
    ' cases · passages et arrivées du World Builder conservés.');
});
window.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!$('new-map-panel').hidden){event.preventDefault();setNewMapPanel(false);}
});
$('reset').addEventListener('click',()=>{
  const old=terrain;terrain=sculptDemo();exampleRoadEnabled=true;$('show-road').disabled=false;
  if(ribbonTextures.road)ribbonTextures.road.visible=$('show-road').checked;
  commitUndo(old);scheduleDraw();
  status('Relief exemple rechargé (36 × 24) ; objets déjà placés conservés');
});
$('flat').addEventListener('click',()=>{
  const old=terrain;
  terrain=createSculptTerrain({width:old.width,height:old.height});
  commitUndo(old);scheduleDraw();
  status('Sol plat : dimensions et objets conservés, eau effacée comme avant');
});
$('fit').addEventListener('click',fit);
$('camera-view').addEventListener('change',()=>{
  fit();
  status($('camera-view').value==='threeQuarter'
    ?'Vue trois-quarts pilote : caméra inclinée ; les hauteurs, collisions et coups de pinceau restent identiques.'
    :'Vue précédente restaurée : aucun changement des données de terrain.');
});
$('material').addEventListener('change',()=>{
  if(activeInteriorId||sculptWorldCurrentInterior())return;
  const baseMaterialId=$('material').value;
  if(!themes.includes(baseMaterialId))return;
  // The same WorldSurface used for serialization, collisions and painting
  // owns the author's material choice, not a global select DOM node.
  surfaceCommit(normalizeSculptSurface({...surface,baseMaterialId}));
  setTheme();
});
$('water-material').addEventListener('change',setWaterMaterial);
$('rock').addEventListener('change',()=>{navTerrainCache=null;scheduleDraw();});
$('rock-moss').addEventListener('change',()=>{navTerrainCache=null;scheduleDraw();});
$('show-water').addEventListener('change',()=>toggleRibbon('water'));
$('show-road').addEventListener('change',()=>toggleRibbon('road'));
$('preview-cursor').addEventListener('change',scheduleDraw);
$('zoom').addEventListener('input',()=>{
 const old=zoom;zoom=Number($('zoom').value)/100;
 const {width,height}=dimensions();
 pan.x=width/2-(width/2-pan.x)*zoom/old;
 pan.y=height/2-(height/2-pan.y)*zoom/old;
 if(navigationTesting)centerNavigationCamera();
 scheduleDraw();
});
$('sphere-summit-ratio').addEventListener('input',()=>{
  $('sphere-summit-ratio-value').textContent=$('sphere-summit-ratio').value+' %';
  spherePreviewDismissed=false;scheduleDraw();
});
$('sphere-wall-material').addEventListener('change',()=>{spherePreviewDismissed=false;scheduleDraw();});
$('radius').addEventListener('input',()=>{
  $('radius-value').textContent=$('radius').value;
  if(rampToolActive())updateRampGuide();
  scheduleDraw();
});
$('brush-shape').addEventListener('change',()=>{scheduleDraw();status('Forme du pinceau : '+$('brush-shape').selectedOptions[0].textContent);});
$('strength').addEventListener('input',()=>{$('strength-value').textContent=$('strength').value;scheduleDraw();});
$('edge').addEventListener('input',()=>{$('edge-value').textContent=$('edge').value+' %';scheduleDraw();});
$('water-target').addEventListener('input',()=>{
  $('water-target-value').textContent=$('water-target').value;
  syncQuickToolbar();status('Surface d’eau absolue : niveau '+$('water-target').value);scheduleDraw();
});
function changeTarget(level){
 const value=Math.max(selectedMode==='sphere-hill'||selectedMode==='sphere-basin'?1:0,
    Math.min(7,Number(level)));
 $('target').value=String(value);$('target-value').textContent=String(value);
 syncQuickToolbar();status(selectedMode==='sphere-basin'?'Profondeur sphérique : −'+value+' niveaux':
    selectedMode==='sphere-hill'?'Hauteur sphérique : +'+value+' niveaux':
      'Hauteur plateau : niveau '+value+' (bord '+$('edge').value+' %)');scheduleDraw();}
$('target').addEventListener('input',()=>changeTarget($('target').value));
$('level-down').addEventListener('click',()=>changeTarget(Number($('target').value)-1));
$('level-up').addEventListener('click',()=>changeTarget(Number($('target').value)+1));

// Point projection/inverse is already owned by Camera: snap only the
// authoring input. The snapped endpoints are stored by the ONE WorldArea model.
function interiorWallPointFromEvent(event,from=null){
  const raw=screenToWorldPoint(event);
  if(!Number.isFinite(raw.x)||!Number.isFinite(raw.y))return null;
  return snapInteriorWallPoint(raw,currentSculptInterior()?.area.walls??[],{
    grid:14,snapRadius:Math.min(22,14/zoom),from,
    orthogonal:!$('interior-wall-diagonal').checked,
    width:terrain.width*SCULPT_TILE.width,
    height:terrain.height*SCULPT_TILE.height
  });
}
function interiorDoorPointFromEvent(event){
  const raw=screenToWorldPoint(event);
  if(!Number.isFinite(raw.x)||!Number.isFinite(raw.y))return null;
  return {x:Math.max(26,Math.min(terrain.width*SCULPT_TILE.width-26,raw.x)),
    y:Math.max(30,Math.min(terrain.height*SCULPT_TILE.height-17,raw.y))};
}
function updateInteriorDoorControls(){
  const entry=currentSculptInterior();
  $('interior-door-move').disabled=!entry||entry.floorIndex!==0;
  $('interior-door-asset').disabled=!entry||entry.floorIndex!==0;
  $('interior-door-asset').value=entry?.exitPortal.visual.assetId??'default';
  $('interior-door-scale').disabled=!entry||entry.floorIndex!==0;
  $('interior-door-move').setAttribute('aria-pressed',String(interiorDoorMoving));
  $('interior-door-move').classList.toggle('active',interiorDoorMoving);
  const size=Math.round(100*(entry?.exitPortal.visual.scale??.58));
  $('interior-door-scale').value=String(size);
  $('interior-door-scale-value').textContent=size+' %';
  $('interior-door-move').textContent=interiorDoorMoving?
    '✓ Terminer le déplacement':'Déplacer la porte';
}
function setInteriorDoorMoving(on){
  if(on&&interiorConnectorMode)setInteriorConnectorMode(false);
  if(on&&(!activeInteriorId||currentSculptInterior()?.floorIndex!==0))return;
  if(on){
    if(interiorWallMode)setInteriorWallMode(null);
    if(navigationTesting)setNavigationTesting(false);
    if(objectEditing)setObjectEditing(false);
    if(surfaceEditing)setSurfaceEditing(false);
  }
  interiorDoorMoving=!!on;interiorDoorGesture=null;interiorDoorPreview=null;
  document.body.classList.toggle('interior-door-authoring',interiorDoorMoving);
  updateInteriorDoorControls();scheduleDraw();
}
function commitInteriorDoor(point,{scale=null,assetId=null}={}){
  const entry=currentSculptInterior();if(!entry||entry.floorIndex!==0)return;
  const updated=updateSculptInteriorDoor(entry,{...point,
    ...(scale!==null?{scale}:{}),...(assetId!==null?{assetId}:{})});
  sculptInteriors=Object.freeze(sculptInteriors.map(e=>
    e.area.id===entry.area.id?updated:e));
  updateInteriorDoorControls();scheduleDraw();
  status('Porte déplacée/redimensionnée : le Portal et le point d’arrivée sont raccordés.');
}
$('interior-door-asset').addEventListener('change',()=>{
  commitInteriorDoor({},{assetId:$('interior-door-asset').value});
});
$('interior-door-move').addEventListener('click',()=>{
  setInteriorDoorMoving(!interiorDoorMoving);
});
$('interior-door-scale').addEventListener('input',()=>{
  if(!currentSculptInterior())return;
  commitInteriorDoor({}, {scale:Number($('interior-door-scale').value)/100});
});

// Each connector is a canonical Portal/Spawn pair, with editor-only selection.
function interiorConnectorPortals(){
  return sculptInteriors.flatMap(e=>[e.entryPortal,e.exitPortal])
    .filter(p=>p.sourceAreaId===activeInteriorId&&p.visual.marker==='portal');
}
function updateInteriorConnectorControls(){
  const select=$('interior-connector-link'),previous=select.value;
  const portals=interiorConnectorPortals();
  select.replaceChildren(...(portals.length?portals.map(p=>
    new Option(p.visual.label??p.id,p.id)):
    [new Option('Ajoute d’abord un étage','')]));
  select.value=portals.some(p=>p.id===previous)?previous:(portals[0]?.id??'');
  const chosen=portals.find(p=>p.id===select.value);
  $('interior-connector-place').disabled=!chosen;
  $('interior-connector-asset').disabled=!chosen;
  $('interior-connector-asset').value=chosen?.visual.assetId??'stairs.wood';
  $('interior-connector-rotation').disabled=!chosen;
  $('interior-connector-turn-left').disabled=!chosen;
  $('interior-connector-turn-right').disabled=!chosen;
  $('interior-connector-rotation').value=String(chosen?.visual.rotationDeg??0);
  $('interior-connector-rotation-value').textContent=
    String(chosen?.visual.rotationDeg??0)+'°';
  $('interior-connector-place').setAttribute('aria-pressed',String(interiorConnectorMode));
  $('interior-connector-place').textContent=interiorConnectorMode?
    '✓ Terminer le placement':'📍 Positionner le passage sur la carte';
  $('interior-connector-hint').textContent=chosen?
    'Choisis escalier ou échelle, puis place le passage au doigt.':
    'Ajoute d’abord un étage pour placer un passage.';
}
function setInteriorConnectorMode(on){
  if(on&&(!activeInteriorId||!interiorConnectorPortals().length))return;
  if(on){
    if(interiorWallMode)setInteriorWallMode(null);
    if(interiorDoorMoving)setInteriorDoorMoving(false);
    if(navigationTesting)setNavigationTesting(false);
    if(objectEditing)setObjectEditing(false);
    if(surfaceEditing)setSurfaceEditing(false);
  }
  interiorConnectorMode=!!on;interiorConnectorGesture=null;interiorConnectorPreview=null;
  document.body.classList.toggle('interior-connector-authoring',interiorConnectorMode);
  updateInteriorConnectorControls();scheduleDraw();
}
$('interior-connector-place').addEventListener('click',()=>{
  setInteriorConnectorMode(!interiorConnectorMode);
});
$('interior-connector-link').addEventListener('change',()=>{
  updateInteriorConnectorControls();scheduleDraw();
});
$('interior-connector-asset').addEventListener('change',()=>{
  const portal=interiorConnectorPortals().find(p=>p.id===$('interior-connector-link').value);
  if(!portal)return;
  try{
    sculptInteriors=updateSculptFloorConnector(sculptInteriors,{
      sourceAreaId:activeInteriorId,portalId:portal.id,
      x:portal.trigger.x,y:portal.trigger.y,assetId:$('interior-connector-asset').value});
    updateInteriorConnectorControls();scheduleDraw();
    status('Escalier ou échelle changé, le Portal reste lié au bon étage.');
  }catch(error){status(error.message);}
});
function setInteriorConnectorRotation(degrees){
  const portal=interiorConnectorPortals().find(p=>p.id===$('interior-connector-link').value);
  if(!portal)return;
  try{
    sculptInteriors=updateSculptFloorConnector(sculptInteriors,{
      sourceAreaId:activeInteriorId,portalId:portal.id,
      x:portal.trigger.x,y:portal.trigger.y,
      assetId:portal.visual.assetId??'stairs.wood',rotationDeg:degrees
    });
    updateInteriorConnectorControls();scheduleDraw();
  }catch(error){status(error.message);}
}
$('interior-connector-rotation').addEventListener('input',()=>{
  setInteriorConnectorRotation(Number($('interior-connector-rotation').value));
});
$('interior-connector-turn-left').addEventListener('click',()=>{
  setInteriorConnectorRotation((Number($('interior-connector-rotation').value)+315)%360);
});
$('interior-connector-turn-right').addEventListener('click',()=>{
  setInteriorConnectorRotation((Number($('interior-connector-rotation').value)+45)%360);
});
$('interior-wall-material').addEventListener('change',()=>{
  const entry=currentSculptInterior();if(!entry)return;
  const area=normalizeWorldArea({...entry.area,wallMaterialId:$('interior-wall-material').value});
  sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===entry.area.id?
    updateSculptInterior(e,{area}):e));
  scheduleDraw();status('Texture des murs enregistrée pour cet étage.');
});
// Wall authoring reads/writes ONLY the canonical WorldArea.walls.
// There is no editor-owned persisted copy and no visual collision shortcut.
function currentSculptInterior(){
  return sculptInteriors.find(e=>e.area.id===activeInteriorId)??null;
}
function updateInteriorWallControls(){
  const entry=currentSculptInterior(),count=entry?.area.walls.length??0;
  $('interior-wall-toggle').disabled=!entry;
  $('interior-wall-remove').disabled=!entry||count===0;
  $('interior-wall-cancel').disabled=!interiorWallStart;
  $('interior-wall-undo').disabled=!entry||!interiorWallHistory.length;
  $('interior-wall-redo').disabled=!entry||!interiorWallRedo.length;
  for(const [id,mode] of [['interior-wall-toggle','place'],['interior-wall-remove','remove']]){
    $(id).setAttribute('aria-pressed',String(interiorWallMode===mode));
    $(id).classList.toggle('active',interiorWallMode===mode);
  }
  $('interior-wall-info').textContent=interiorWallStart?
    'Départ choisi : glisse vers la fin ou touche le point suivant.':
    count+' mur(s) · '+(interiorWallMode==='place'?
      'glisse pour tracer · 2 appuis possibles · '+($('interior-wall-diagonal').checked?
        'diagonales libres':'angles droits avec grille'):
      interiorWallMode==='remove'?'touche un mur pour le supprimer':
      'choisis Placer des murs');
}
function setInteriorWallMode(mode){
  if(mode&&interiorConnectorMode)setInteriorConnectorMode(false);
  if(mode&& !activeInteriorId)return;
  if(mode){
    if(interiorDoorMoving)setInteriorDoorMoving(false);
    if(navigationTesting)setNavigationTesting(false);
    if(objectEditing)setObjectEditing(false);
    if(surfaceEditing)setSurfaceEditing(false);
  }
  interiorWallMode=mode;interiorWallStart=null;interiorWallPreview=null;
  interiorWallGesture=null;
  document.body.classList.toggle('interior-wall-authoring',!!mode);
  updateInteriorWallControls();scheduleDraw();
}
function commitInteriorWalls(walls,{history=true}={}){
  const entry=currentSculptInterior();
  if(!entry||walls===entry.area.walls||
    JSON.stringify(walls)===JSON.stringify(entry.area.walls))return false;
  if(history){
    interiorWallHistory.push(entry.area.walls);
    if(interiorWallHistory.length>40)interiorWallHistory.shift();
    interiorWallRedo=[];
  }
  const area=normalizeWorldArea({...entry.area,walls});
  sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===entry.area.id?
    updateSculptInterior(e,{area}):e));
  updateInteriorWallControls();scheduleDraw();
  status('Murs sauvegardés avec cet intérieur · '+area.walls.length+' segment(s)');
  return true;
}
$('interior-wall-diagonal').addEventListener('change',()=>{
  updateInteriorWallControls();scheduleDraw();
});
$('interior-wall-toggle').addEventListener('click',()=>{
  setInteriorWallMode(interiorWallMode==='place'?null:'place');
});
$('interior-wall-remove').addEventListener('click',()=>{
  setInteriorWallMode(interiorWallMode==='remove'?null:'remove');
});
$('interior-wall-cancel').addEventListener('click',()=>{
  interiorWallStart=null;interiorWallPreview=null;interiorWallGesture=null;
  updateInteriorWallControls();scheduleDraw();
});
$('interior-wall-undo').addEventListener('click',()=>{
  const entry=currentSculptInterior();if(!entry||!interiorWallHistory.length)return;
  const before=interiorWallHistory.pop();interiorWallRedo.push(entry.area.walls);
  commitInteriorWalls(before,{history:false});
});
$('interior-wall-redo').addEventListener('click',()=>{
  const entry=currentSculptInterior();if(!entry||!interiorWallRedo.length)return;
  const next=interiorWallRedo.pop();interiorWallHistory.push(entry.area.walls);
  commitInteriorWalls(next,{history:false});
});

// V79 isolated, reversible area authoring. No reload, no alternative camera or
// gameplay collision engine; portal links use WorldArea/Portal v1 throughout.
function captureSculptArea(){
  return {terrain,objects:placedObjects,actors:placedActors,surface};
}
function mountSculptArea(snapshot){
  terrain=snapshot.terrain;placedObjects=snapshot.objects;placedActors=snapshot.actors;
  surface=normalizeSculptSurface(snapshot.surface);
  // Restore the base surface before raster invalidation and any asynchronous
  // image load. Every WorldArea (including user-authored ones) has its own
  // material in its own saved area record.
  if(!activeInteriorId&&!sculptWorldCurrentInterior()&&themes.includes(surface.baseMaterialId))
    $('material').value=surface.baseMaterialId;
  history=[];redoHistory=[];objectHistory=[];objectRedo=[];
  actorHistory=[];actorRedo=[];surfaceHistory=[];surfaceRedo=[];
  objectSelectedId=null;actorSelectedId=null;
  rampStart=null;rampEnd=null;rampGesture=null;hoverCell=null;precisionCell=null;
  navTerrainCache=null;navBridgePlacements=null;navStairProjection=null;
  exampleRoadEnabled=false;$('show-road').checked=false;$('show-road').disabled=true;
  if(ribbonTextures.road)ribbonTextures.road.visible=false;
  updateHistoryButtons();updateObjectCount();updateActorCount();
  updateSurfaceCount();loadSurfacePaintAssets();syncObjectSelectedControls();
  if(activeInteriorId||sculptWorldCurrentInterior()){
    const base=interiorFloorMaterials.includes(surface.baseMaterialId)?
      surface.baseMaterialId:'floor.wood.house';
    $('interior-floor-base').value=base;
    $('surface-material').value=base;
  }else $('surface-material').value='road.dirt';
  setTheme();
}
function updateSculptAreaControls(){
  const entry=sculptInteriors.find(e=>e.area.id===activeInteriorId);
  $('interior-area-bar').hidden=!entry;
  document.body.classList.toggle('sculpt-interior-area',!!entry);
  $('interior-area-label').textContent=entry?
    '🏠 '+(entry.floorIndex===0?'Rez-de-chaussée':'Étage '+entry.floorIndex)+
      ' · '+entry.buildingId:'🏞 Extérieur';
  if(entry){
    const floors=sculptInteriors.filter(e=>e.buildingId===entry.buildingId)
      .sort((a,b)=>a.floorIndex-b.floorIndex);
    const selector=$('interior-level-select');
    selector.replaceChildren(...floors.map(e=>new Option(e.floorIndex===0?
      'Rez-de-chaussée':'Étage '+e.floorIndex,String(e.floorIndex))));
    selector.value=String(entry.floorIndex);
    $('interior-level-add').disabled=floors.length>=SCULPT_INTERIOR_FLOOR_LIMIT||
      sculptInteriors.length>=SCULPT_INTERIOR_LIMIT||
      entry.floorIndex!==floors[floors.length-1].floorIndex;
    // Resizing a lower floor would detach staircase Portals placed on it.
    // Keep all linked portals correct; define its size before creating above.
    $('interior-layout-apply').disabled=false;
  }
  if(entry){
    $('interior-width').value=String(entry.terrain.width);
    $('interior-height').value=String(entry.terrain.height);
    const kind=sculptInteriorShapeId(entry.area);
    $('interior-shape').value=kind==='custom'?'rectangle':kind;
    $('interior-layout-apply').disabled=kind==='custom';
  }
  $('new-map-toggle').disabled=!!entry;
  for(const option of $('surface-material').options)
    option.disabled=entry?!option.value.startsWith('floor.'):
      option.value.startsWith('floor.');
  $('interior-template-apply').disabled=!entry||!$('interior-template-select').value;
  $('object-open-interior').hidden=!!entry||!objectSelectedId||
    objectDefinitionCatalogV1.get(placedObjects.find(o=>o.id===objectSelectedId)
      ?.objectDefinitionId)?.kind!=='building';
  updateSculptDoorAction();
  updateInteriorWallControls();updateInteriorDoorControls();updateInteriorConnectorControls();
  if(entry)$('interior-wall-material').value=entry.area.wallMaterialId??'plaster';updateInteriorConnectorControls();
  if(entry)$('interior-wall-material').value=entry.area.wallMaterialId??'plaster';
}
function changeSculptArea(nextAreaId,{spawn=null}={}){
  if(activeInteriorId===nextAreaId||(!activeInteriorId&&
     nextAreaId===SCULPT_EXTERIOR_AREA_ID))return;
  const wasTesting=navigationTesting;
  if(wasTesting)setNavigationTesting(false);
  if(objectEditing)setObjectEditing(false);
  if(surfaceEditing)setSurfaceEditing(false);
  setInteriorWallMode(null);setInteriorDoorMoving(false);setInteriorConnectorMode(false);
  interiorWallHistory=[];interiorWallRedo=[];
  if(activeInteriorId){
    const snapshot=captureSculptArea();
    sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===activeInteriorId?
      updateSculptInterior(e,snapshot):e));
  }else{
    outsideAreaSnapshot=captureSculptArea();
  }
  if(nextAreaId===SCULPT_EXTERIOR_AREA_ID){
    if(!outsideAreaSnapshot)throw Error('Extérieur non chargé');
    activeInteriorId=null;mountSculptArea(outsideAreaSnapshot);
    outsideAreaSnapshot=null;
  }else{
    const entry=sculptInteriors.find(e=>e.area.id===nextAreaId);
    if(!entry)throw Error('Intérieur introuvable');
    activeInteriorId=entry.area.id;
    mountSculptArea(entry);
  }
  updateSculptAreaControls();refreshSculptEncounterEditor();fit();
  if(wasTesting){
    $('navigation-camera-angle').value=activeInteriorId?
      $('interior-camera-angle').value:$('navigation-camera-angle').value;
    $('navigation-camera-angle').dispatchEvent(new Event('input'));
    setNavigationTesting(true);
    if(spawn&&navActor){navActor.x=spawn.x;navActor.y=spawn.y;
      sculptEncounterController?.resetAnchor();sculptEncounterStep();
      navVisualLevel=navHeight();centerNavigationCamera();updateNavigationInfo(true);}
  }
  status(activeInteriorId?'Intérieur lié à cette maison : porte, sol, murs et modèles indépendants.':
    'Extérieur restauré · maison et relief conservés.');
}
function openSelectedSculptInterior(){
  if(activeInteriorId)return;
  const selected=placedObjects.find(o=>o.id===objectSelectedId);
  const resolved=resolveWorldObjectPlacements(selected?[selected]:[],
    objectDefinitionCatalogV1)[0];
  if(resolved?.kind!=='building'){status('Sélectionne une maison avant de modifier son intérieur.');return;}

  if(sculptWorldDraft){
    // One world document and one set of portals: never open a detached Sculpt
    // prototype that cannot be saved/entered through the World Builder.
    if(sculptWorldArea()?.kind!=='exterior'||!sculptWorldAreaMounted){
      sculptWorldStatus('Ouvre une maison depuis sa carte extérieure World Builder.',true);
      return;
    }
    try{
      commitCurrentSculptWorldArea();
      let portal=currentWorldHouseLink(resolved.id);
      if(!portal){
        sculptWorldDraft=createBuildingInteriorLink(sculptWorldDraft,{
          sourceAreaId:sculptWorldAreaId,buildingId:resolved.id,anchorId:'main-door',
          interiorSize:{width:18*28,height:14*21}
        });
        portal=currentWorldHouseLink(resolved.id);
      }
      if(!portal)throw Error('Liaison intérieur/porte non créée : vérifier la définition de cette maison');
      const room=sculptWorldDraft.areas.find(a=>a.id===portal.targetAreaId);
      sculptWorldAreaScene(room); // Validate before abandoning the exterior editor.
      saveWorldAssemblerDraft(window.localStorage,sculptWorldDraft);
      if(objectEditing)setObjectEditing(false);
      if(surfaceEditing)setSurfaceEditing(false);
      mountWorldSculptArea(room.id);
      sculptWorldStatus('Pièce indépendante liée à cette maison, enregistrée dans le même monde.');
    }catch(error){sculptWorldStatus('Intérieur de maison indisponible : '+error.message,true);}
    return;
  }
  let entry=sculptInteriors.find(e=>e.buildingId===resolved.id&&e.floorIndex===0);
  const wanted=sculptInteriorTemplates.find(t=>t.id===$('object-interior-template').value);
  if(!entry){
    if(sculptInteriors.length>=SCULPT_INTERIOR_LIMIT){
      status('Limite de '+SCULPT_INTERIOR_LIMIT+' intérieurs pour cette scène pilote.');return;
    }
    entry=createSculptInteriorArea(resolved,placedObjects);
    if(!entry){status('Bâtiment sans porte canonique : intérieur non créé.');return;}
    if(wanted)entry=applySculptInteriorTemplate(entry,wanted);
    sculptInteriors=Object.freeze([...sculptInteriors,entry]);
  }
  // Never re-apply a previously selected template when editing an existing
  // room. The explicit "Appliquer le modèle choisi" control belongs INSIDE
  // that room and leaves every other house unchanged.
  changeSculptArea(entry.area.id);
}
function updateSculptDoorAction(){
  const button=$('navigation-area-door');
  if(!navigationTesting||!navActor||!sculptInteriors.length){
    button.hidden=true;return;
  }
  const entries=sculptInteriors;
  const external=outsideAreaSnapshot?.objects??placedObjects;
  const current=activeInteriorId??SCULPT_EXTERIOR_AREA_ID;
  const target=sculptInteriorTransition(external,entries,current,navActor);
  button.hidden=!target;
  const portal=sculptInteriorAvailablePortal(external,entries,current,navActor);
  button.textContent=portal?.visual.label?
    (portal.visual.marker==='portal'?'🪜 ':'🚪 ')+portal.visual.label:
    activeInteriorId?'🚪 Sortir':'🚪 Entrer';
  button.setAttribute('aria-label',button.textContent);
}
function refreshSculptTemplateSelector(){
  const select=$('interior-template-select'),current=select.value;
  const houseSelect=$('object-interior-template'),houseCurrent=houseSelect.value;
  houseSelect.replaceChildren(new Option('Pièce libre (ou intérieur déjà lié)',''),
    ...sculptInteriorTemplates.map(item=>new Option(item.name+' · '+item.terrain.width+'×'+item.terrain.height,item.id)));
  houseSelect.value=sculptInteriorTemplates.some(item=>item.id===houseCurrent)?houseCurrent:'';
  select.replaceChildren(new Option('Édition libre (aucun modèle)',''),
    ...sculptInteriorTemplates.map(item=>new Option(item.name,item.id)));
  select.value=sculptInteriorTemplates.some(item=>item.id===current)?current:'';
  $('interior-template-apply').disabled=!activeInteriorId||!select.value;
}
function persistSculptTemplates(){
  try{localStorage.setItem(SCULPT_INTERIOR_TEMPLATE_STORAGE,
    JSON.stringify(sculptInteriorTemplates));return true;}
  catch{return false;}
}
function loadSculptTemplates(){
  try{sculptInteriorTemplates=normalizeSculptInteriorTemplates(
    JSON.parse(localStorage.getItem(SCULPT_INTERIOR_TEMPLATE_STORAGE)||'[]'));}
  catch{sculptInteriorTemplates=Object.freeze([]);}
  refreshSculptTemplateSelector();
}
$('interior-level-select').addEventListener('change',()=>{
  const entry=currentSculptInterior();if(!entry)return;
  const floorIndex=Number($('interior-level-select').value);
  const target=sculptInteriors.find(e=>e.buildingId===entry.buildingId&&
    e.floorIndex===floorIndex);
  if(target)changeSculptArea(target.area.id);
});
$('interior-level-add').addEventListener('click',()=>{
  const entry=currentSculptInterior();if(!entry)return;
  if(sculptInteriors.length>=SCULPT_INTERIOR_LIMIT){
    status('Nombre de cartes intérieures maximal atteint.');return;
  }
  try{
    const fresh=updateSculptInterior(entry,captureSculptArea());
    const linked=createSculptUpperFloor(fresh);
    sculptInteriors=Object.freeze([
      ...sculptInteriors.map(e=>e.area.id===fresh.area.id?linked.below:e),
      linked.upper
    ]);
    changeSculptArea(linked.upper.area.id);
    status('Étage '+linked.upper.floorIndex+' créé avec montée/descente Portal.'+
      ' Modifie ses murs, son sol et sa taille indépendamment.');
  }catch(error){status(error.message);}
});
$('interior-shape').addEventListener('change',()=>{
  if(currentSculptInterior())$('interior-layout-apply').click();
});
$('interior-layout-apply').addEventListener('click',()=>{
  const entry=currentSculptInterior();if(!entry)return;
  if(sculptInteriors.some(e=>e.buildingId===entry.buildingId&&e.floorIndex>entry.floorIndex)&&
    (entry.terrain.width!==Number($('interior-width').value)||
     entry.terrain.height!==Number($('interior-height').value))){
    status('Redimensionnement impossible avec des étages au-dessus. La forme seule reste modifiable.');return;
  }
  try{
    const old={...entry,...captureSculptArea()};
    const next=resizeSculptInterior(old,{width:Number($('interior-width').value),
      height:Number($('interior-height').value),shape:$('interior-shape').value});
    sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===entry.area.id?next:e));
    mountSculptArea(next);updateSculptAreaControls();fit();
    status('Intérieur '+next.terrain.width+'×'+next.terrain.height+
      ' · forme '+$('interior-shape').value+' · limites WorldArea actives.');
  }catch(error){status(error.message);}
});
$('interior-template-select').addEventListener('change',refreshSculptTemplateSelector);
$('interior-floor-base').addEventListener('change',()=>{
  if(!activeInteriorId)return;
  const materialId=$('interior-floor-base').value;
  if(!interiorFloorMaterials.includes(materialId))return;
  surface={...surface,baseMaterialId:materialId};
  loadSurfacePaintAssets();updateSurfaceCount();setTheme();
  status('Sol intérieur choisi : '+materialId+' · conservé dans la scène JSON.');
});
$('interior-template-save').addEventListener('click',()=>{
  const entry=sculptInteriors.find(e=>e.area.id===activeInteriorId);
  if(!entry)return;
  const name=$('interior-template-name').value.trim();
  if(!name){status('Nomme ton modèle avant de l’enregistrer.');return;}
  if(sculptInteriorTemplates.length>=SCULPT_INTERIOR_TEMPLATE_LIMIT){
    status('Bibliothèque pleine : maximum 32 modèles.');return;
  }
  const ids=new Set(sculptInteriorTemplates.map(t=>t.id));
  let serial=1;while(ids.has('interior-template-'+serial))serial++;
  try{
    const item=createSculptInteriorTemplate(updateSculptInterior(entry,
      captureSculptArea()),{id:'interior-template-'+serial,name});
    sculptInteriorTemplates=normalizeSculptInteriorTemplates([...sculptInteriorTemplates,item]);
    refreshSculptTemplateSelector();
    $('interior-template-select').value=item.id;
    refreshSculptTemplateSelector();
    status(persistSculptTemplates()?'Modèle enregistré sur cet appareil et prêt pour les autres maisons.':
      'Modèle conservé pour cette session : exporte la scène JSON pour le garder.');
  }catch(e){status(e.message);}
});
$('interior-template-apply').addEventListener('click',()=>{
  const entry=sculptInteriors.find(e=>e.area.id===activeInteriorId);
  const template=sculptInteriorTemplates.find(t=>t.id===$('interior-template-select').value);
  if(!entry||!template)return;
  if(navigationTesting)setNavigationTesting(false);
  try{
    const updated=applySculptInteriorTemplate(entry,template);
    sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===entry.area.id?updated:e));
    mountSculptArea(updated);updateSculptAreaControls();fit();
    status('Modèle « '+template.name+' » appliqué à cette maison, modifiable librement.');
  }catch(e){status(e.message);}
});
$('object-open-interior').addEventListener('click',openSelectedSculptInterior);
$('interior-area-return').addEventListener('click',()=>
  changeSculptArea(SCULPT_EXTERIOR_AREA_ID));
$('interior-camera-angle').addEventListener('input',()=>{
  $('interior-camera-value').textContent=$('interior-camera-angle').value+'°';
  if(activeInteriorId){navTerrainCache=null;fit();}
});
$('navigation-area-door').addEventListener('click',()=>{
  if(!navActor||!navigationTesting)return;
  const outside=outsideAreaSnapshot?.objects??placedObjects;
  const current=activeInteriorId??SCULPT_EXTERIOR_AREA_ID;
  const transition=sculptInteriorTransition(outside,sculptInteriors,current,navActor);
  if(!transition){updateSculptDoorAction();return;}
  changeSculptArea(transition.currentAreaId,{spawn:transition});
});
$('scene-export').addEventListener('click',()=>{
  const active=captureSculptArea();
  const outdoors=outsideAreaSnapshot??active;
  const entries=activeInteriorId
    ?sculptInteriors.map(e=>e.area.id===activeInteriorId?
      updateSculptInterior(e,active):e):sculptInteriors;
  let scene;
  try{
    scene=JSON.parse(serializeSculptPreviewScene(outdoors.terrain,
      outdoors.objects,outdoors.surface,outdoors.actors,{
        encounterConfig:sculptEncounterConfig,
        exteriorEncounters:sculptExteriorEncounters
      }));
  }catch(error){
    status('Export bloqué : '+error.message);
    return;
  }
  if(entries.length)scene.interiors=serializeSculptInteriors(entries);
  if(sculptInteriorTemplates.length)
    scene.interiorTemplates=normalizeSculptInteriorTemplates(sculptInteriorTemplates);
  $('json').value=JSON.stringify(scene);
  $('json').hidden=false;
  status('Scène 2,5D exportée : extérieur + '+entries.length+' intérieur(s) + reliefs.');
});
$('export').addEventListener('click',()=>{
 $('json').value=serializeSculptTerrain(terrain);$('json').hidden=false;
 status('JSON de hauteur généré : copiez-le pour conserver votre test');
});
$('import').addEventListener('click',()=>{
 try{const imported=importSculptPreviewScene($('json').value);
  const raw=JSON.parse($('json').value);
  const nextInteriors=importSculptInteriors(raw.interiors??[],imported.objects);
  const incomingTemplates=normalizeSculptInteriorTemplates(raw.interiorTemplates??[]);
  const importedIds=new Set(incomingTemplates.map(t=>t.id));
  const nextTemplates=normalizeSculptInteriorTemplates([
    ...sculptInteriorTemplates.filter(t=>!importedIds.has(t.id)),...incomingTemplates]);
  if(navigationTesting)setNavigationTesting(false);
  sculptInteriors=nextInteriors;outsideAreaSnapshot=null;activeInteriorId=null;
  sculptInteriorTemplates=nextTemplates;refreshSculptTemplateSelector();
  persistSculptTemplates();
  const old=terrain;terrain=imported.terrain;commitUndo(old);
  exampleRoadEnabled=false;$('show-road').checked=false;$('show-road').disabled=true;
  if(ribbonTextures.road)ribbonTextures.road.visible=false;
  placedObjects=imported.objects;objectHistory=[];objectRedo=[];objectSelectedId=null;updateObjectCount();syncObjectSelectedControls();
  placedActors=imported.actors;actorSelectedId=null;actorHistory=[];actorRedo=[];
  updateActorCount();syncActorSelectedControls();
  surface=imported.surface;surfaceHistory=[];surfaceRedo=[];surfaceDrawing=false;
  sculptEncounterConfig=imported.encounterConfig??sculptPreviewEncounterConfig;
  sculptExteriorEncounters=imported.exteriorEncounters;
  sculptEncounterAreaCache=null;
  loadSurfacePaintAssets();updateSurfaceCount();refreshSculptEncounterEditor();
  updateSculptAreaControls();
  fit();status(imported.isScene?
    'Scène complète importée : objets et relief'+
      (nextInteriors.length?' · '+nextInteriors.length+' intérieur(s) 2,5D':''):
    'Relief ancien importé (sans objets)');}
 catch(e){status(e.message);}
});
$('json-toggle').addEventListener('click',()=>{$('json').hidden=!$('json').hidden;});
// Both viewport resize and fullscreen callbacks reuse the single fit owner.
window.addEventListener('resize',fit);
function rampPreviewValidForProbe(){
  const from=rampStart??rampGesture?.origin;
  const to=rampEnd??(from&&hoverCell?rampPointFromCell(hoverCell):null);
  return from&&to?appendSculptTerrainRamp(terrain,{
    x:from.x,y:from.y,endX:to.x,endY:to.y,width:rampWidth()})!==terrain:null;
}
window.__sculptLabProbe=(screenPoint=null)=>Object.freeze({
  probedCell:screenPoint?screenToCell({clientX:screenPoint.x,clientY:screenPoint.y}):null,
  surfaceEditing,precisionDragging,faceCount:sculptFaces(terrain).length,
  sphereCount:terrain.spheres?.length??0,spheres:(terrain.spheres??[]).map(f=>({...f})),
  terrainRampCount:terrain.ramps?.length??0,ramps:(terrain.ramps??[]).map(f=>({...f})),
  activeAreaId:activeInteriorId??SCULPT_EXTERIOR_AREA_ID,
  interiorCount:sculptInteriors.length,
  interiorWallCount:currentSculptInterior()?.area.walls.length??0,
  interiorWallMode,interiorWallPending:!!interiorWallStart,
  gameDoorVisible:!$('navigation-area-door').hidden,
  gameDoorInPlayfield:canvas.parentElement.contains($('navigation-area-door')),
  currentInteriorBuildingId:sculptInteriors.find(e=>e.area.id===activeInteriorId)?.buildingId??null,
  interiorAreaBarVisible:!$('interior-area-bar').hidden,
  interiorTemplateCount:sculptInteriorTemplates.length,
  interiorFloorId:$('interior-floor-base').value,
  interiorWallMaterial:currentSculptInterior()?.area.wallMaterialId??null,
  interiorConnectorMode,interiorConnectorCount:interiorConnectorPortals().length,
  interiorConnectorRotation:Number($('interior-connector-rotation').value),
  heroScreen:navActor?(()=>{
    const projected=sculptCameraProject(cameraView(),navActor.x,
      navActor.y-(navVisualLevel??navHeight())*SCULPT_TILE.rise);
    return {x:pan.x+projected.x*zoom,y:pan.y+projected.y*zoom};
  })():null,
  interiorShape:currentSculptInterior()?.area.boundary?.kind??null,
  interiorTemplateSelected:$('interior-template-select').value,
  interiorAngle:Number($('interior-camera-angle').value),
  rampStart:!!rampStart,rampGestureActive:!!rampGesture,
  rampGuideVisible:!$('ramp-guide').hidden,
  rampGuideText:$('ramp-step').textContent,
  rampPreviewValid:rampPreviewValidForProbe(),
  sphereMaterialAssets:{rock:cliffHDLoaded,grass:!!sphereWallImages.grass,
    earth:!!sphereWallImages.earth},
  terrainRasterBuilds,cachedGround:!!navTerrainCache,
  sphereGuideVisible:!spherePreviewDismissed&&selectedMode.startsWith('sphere-')&&
    ($('precision-mode').checked?!!precisionCell:!!hoverCell),
  summitRatio:Number($('sphere-summit-ratio').value)/100,
  wallMaterial:$('sphere-wall-material').value,
  objects:placedObjects.length,objectEditing,objectCategory:$('object-category').value,
  paintedRoutes:surface.routes.length,paintedZones:surface.zones.length,
  width:terrain.width,height:terrain.height,materialId:displayedBaseMaterialId(),
  cameraView:$('camera-view').value,
  cameraAngle:Number($('navigation-camera-angle').value),
  liveCameraPitch:cameraView().pitch,navigationTesting,
  cameraPan:{...pan},
  waterMaterialId:$('water-material').value,
  levelSpread:new Set(terrain.levels).size,zoom,
  previewCells:previewSummary?.cells??0,editorKind,
  brushSize:Number($('radius').value),brushShape:$('brush-shape').value,quickTool:$('quick-tool').value,
  canvasTop:canvas.getBoundingClientRect().top,canvasHeight:canvas.getBoundingClientRect().height,
  viewportHeight:window.innerHeight,
  immersiveMode:document.body.classList.contains('sculpt-immersive'),
  paletteCollapsed:document.body.classList.contains('palette-collapsed'),
  advancedOpen:$('sculpt-settings').open,
  precisionMode:$('precision-mode').checked,
  precisionTarget:precisionCell?{...precisionCell}:null,
  faceRuns:lastRenderStats?.faceRuns??0,waterCells:lastRenderStats?.waterCells??0,
  paintedCells:lastRenderStats?.paintedCells??0,
  roadCells:lastRenderStats?.roadCells??0,waterVisible:!!ribbonTextures.water?.visible,
  roadVisible:!!ribbonTextures.road?.visible,exampleRoadEnabled,
  authoredWaterCells:terrain.waterLevels.filter(v=>v>=0).length,
  wetCells:terrain.waterLevels.filter((v,i)=>v>terrain.levels[i]).length,
  centerWaterDepth:sculptWaterAt(terrain,Math.floor(terrain.width/2),Math.floor(terrain.height/2)),
  centerRoundness:terrain.roundness[Math.floor(terrain.height/2)*terrain.width+Math.floor(terrain.width/2)],
  undoCount:history.length,redoCount:redoHistory.length,
  highestLevel:Math.max(...terrain.levels),lowestLevel:Math.min(...terrain.levels),target:Number($('target').value),edge:Number($('edge').value)});

/* World Builder 2.5D: same world document v3 owns every WorldArea, Portal,
 * Spawn, paint, placement and relief. This pane edits only the selected Area.
 * The existing renderer and Collision World remain the ONLY movement owners.
 */
function sculptWorldArea(){
  return sculptWorldDraft?.areas.find(a=>a.id===sculptWorldAreaId)??null;
}
function sculptWorldHouseParentLink(){
  return sculptWorldDraft?.portals.find(p=>
    p.targetAreaId===sculptWorldAreaId&&p.trigger?.kind==='object-anchor'&&
    sculptWorldDraft.areas.some(a=>a.id===p.sourceAreaId&&a.kind==='exterior'))??null;
}

function worldOutboundPortals(){
  return sculptWorldDraft?.portals.filter(p=>p.sourceAreaId===sculptWorldAreaId)??[];
}
function sculptWorldStatus(message,error=false){
  const output=$('world-area-portal-status');
  if(output){output.textContent=message;output.style.color=error?'#ffd1bd':'#b2ece2';}
  status(message);
}
function currentWorldPortal(){
  const id=$('world-area-portal-select')?.value;
  return worldOutboundPortals().find(p=>p.id===id)??worldOutboundPortals()[0]??null;
}
function selectedWorldSpawn(){
  const area=sculptWorldArea();
  return area?.spawns.find(p=>p.id===$('world-area-spawn-select')?.value)
    ??area?.spawns[0]??null;
}
function refreshSculptWorldPanel(){
  const panel=$('world-area-portal-panel');
  if(!sculptWorldDraft||!panel)return;
  const area=sculptWorldArea();if(!area)return;
  $('world-area-house-back').hidden=!sculptWorldHouseParentLink();
  panel.hidden=false;
  $('world-area-current-name').textContent=(area.siteKind==='dungeon'?'🗝 ':'🏞 ')+
    (area.label??area.id);
  $('world-area-current-kind').textContent=(area.kind==='interior'
    ?'Instance / donjon':'Région extérieure')+' · '+terrain.width+' × '+terrain.height+' cases';
  const choices=worldOutboundPortals(),portalSelect=$('world-area-portal-select'),
        previous=portalSelect.value;
  portalSelect.replaceChildren(...choices.map(p=>{
    const target=sculptWorldDraft.areas.find(a=>a.id===p.targetAreaId);
    return new Option('🚪 → '+(target?.label??p.targetAreaId),p.id);
  }));
  if(choices.some(p=>p.id===previous))portalSelect.value=previous;
  const portal=currentWorldPortal(),hasPortal=!!portal;
  for(const id of ['world-area-portal-place','world-area-portal-save',
    'world-area-portal-label','world-area-portal-label-save',
    'world-area-portal-x','world-area-portal-y'])
    $(id).disabled=!hasPortal;
  $('world-area-portal-x').value=portal?.trigger.kind==='point'?
    String(Math.round(portal.trigger.x)):'';
  $('world-area-portal-y').value=portal?.trigger.kind==='point'?
    String(Math.round(portal.trigger.y)):'';
  $('world-area-portal-label').value=portal?.visual?.label??'';
  const spawns=area.spawns.filter(s=>Number.isFinite(s.x)&&Number.isFinite(s.y));
  const selector=$('world-area-spawn-select'),selected=selector.value;
  selector.replaceChildren(...spawns.map(s=>new Option(
    s.id===sculptWorldDraft.initialSpawnId&&area.id===sculptWorldDraft.initialAreaId
      ?'★ Point de départ':'📍 Arrivée '+s.id,s.id)));
  if(spawns.some(s=>s.id===selected))selector.value=selected;
  const spawn=selectedWorldSpawn();
  for(const id of ['world-area-spawn-place','world-area-spawn-save',
    'world-area-spawn-x','world-area-spawn-y'])$(id).disabled=!spawn;
  $('world-area-spawn-x').value=spawn?String(Math.round(spawn.x)):'';
  $('world-area-spawn-y').value=spawn?String(Math.round(spawn.y)):'';
  $('world-area-portal-place').textContent=
    sculptWorldPortalPlacement==='portal'?'✕ Annuler la pose de l’entrée':
      '📍 Pointer l’entrée sur le terrain';
  $('world-area-spawn-place').textContent=
    sculptWorldPortalPlacement==='spawn'?'✕ Annuler la pose de l’arrivée':
      '📍 Pointer l’arrivée sur le terrain';
  updateSculptWorldPortalAction();
  scheduleDraw();
}
function validSculptWorldAuthoringPoint(point){
  if(!Number.isFinite(point?.x)||!Number.isFinite(point?.y)||
     point.x<10||point.y<10||
     point.x>terrain.width*SCULPT_TILE.width-10||
     point.y>terrain.height*SCULPT_TILE.height-10)
    throw Error('Position en dehors de la carte');
  const sample=sculptNavigationSample(terrain,point.x,point.y,
    {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
  if(!sample||sample.waterDepth>0)
    throw Error('Place le passage sur un sol sec et accessible');
  const actor={x:point.x,y:point.y,radius:5,locomotion:{modes:['ground']}};
  if(isBlocked(navigationWorld(),actor,point.x,point.y,undefined,navigationContext()))
    throw Error('Passage bloqué par le relief, un mur ou un objet');
  return {x:Math.round(point.x),y:Math.round(point.y)};
}
function commitSculptWorldPortal(point){
  const portal=currentWorldPortal();
  if(!portal)throw Error('Aucun passage à placer dans cette zone');
  if(portal.trigger.kind!=='point')
    throw Error('Ce passage est ancré à une porte : modifie son bâtiment propriétaire');
  const position=validSculptWorldAuthoringPoint(point);
  sculptWorldDraft=placeSculptWorldPortal(sculptWorldDraft,portal.id,position);
  refreshSculptWorldPanel();
  sculptWorldStatus('Entrée du Portal enregistrée à X '+position.x+', Y '+position.y+
    ' · repère SORTIE visible sur la carte.');
}
function commitSculptWorldSpawn(point){
  const spawn=selectedWorldSpawn();
  if(!spawn)throw Error('Aucun Spawn modifiable dans cette zone');
  const position=validSculptWorldAuthoringPoint(point);
  sculptWorldDraft=placeSculptWorldSpawn(
    sculptWorldDraft,sculptWorldAreaId,spawn.id,position);
  refreshSculptWorldPanel();
  sculptWorldStatus('Point d’arrivée enregistré à X '+position.x+', Y '+position.y+
    ' · repère ARRIVÉE visible sur la carte.');
}
function applySculptWorldPointerPlacement(point){
  if(!sculptWorldPortalPlacement)return;
  const mode=sculptWorldPortalPlacement;
  sculptWorldPortalPlacement=null;
  try{
    if(mode==='portal')commitSculptWorldPortal(point);
    else commitSculptWorldSpawn(point);
  }catch(error){sculptWorldStatus(error.message,true);}
  refreshSculptWorldPanel();
}
function sculptWorldPortalAtHero(){
  if(!navigationTesting||!navActor||!sculptWorldDraft)return null;
  return findTriggeredPortal(sculptWorldDraft,sculptWorldAreaId,navActor);
}
function updateSculptWorldPortalAction(){
  const button=$('world-portal-traverse');
  if(!button)return;
  const exits=worldOutboundPortals().filter(p=>p.enabled===true);
  const canConnect=!exits.length&&playableExteriorArea(sculptWorldArea());
  button.hidden=!navigationTesting||!sculptWorldDraft||
    (!exits.length&&!canConnect)||!!sculptPendingEncounter;
  if(button.hidden)return;
  // This action never teleports: it can explicitly create missing canonical
  // Portals, then the player must physically walk into their true hitboxes.
  if(canConnect){
    button.disabled=false;
    button.textContent='🔗 Créer un passage vers une autre zone';
    button.title='Créer un vrai Portal aller-retour sans déplacer les cartes';
    return;
  }
  const portal=sculptWorldPortalAtHero();
  button.disabled=!portal;
  if(portal){
    const target=sculptWorldDraft.areas.find(a=>a.id===portal.targetAreaId);
    // The button must reflect actual Sculpt capacity BEFORE click. A legacy
    // 2400×1600 target cannot be mounted; do not advertise a fake transition.
    try{sculptWorldAreaScene(target);}
    catch(error){
      if(portal.trigger?.kind==='point'&&playableExteriorArea(sculptWorldArea())){
        button.disabled=false;
        button.textContent='🔗 Réparer ce passage';
        button.title='Destination ancienne/incompatible : réparation confirmée au toucher';
      }else{
        button.disabled=true;
        button.textContent='🚪 Passage impossible en 2,5D';
        button.title='Zone cible non compatible : '+error.message;
      }
      return;
    }
    button.textContent='🚪 Entrer : '+(target?.label??target?.id??'autre zone');
    button.title='Passage à portée : toucher pour charger la zone suivante';
  }else{
    const nearest=exits.map(p=>{
      const point=resolvePortalTriggerPoint(sculptWorldDraft.areas,p);
      return point?{p,distance:Math.max(0,Math.hypot(
        navActor.x-point.x,navActor.y-point.y)-point.radius)}:null;
    }).filter(Boolean).sort((a,b)=>a.distance-b.distance)[0];
    button.textContent=nearest?'🚪 Sortie · encore '+Math.ceil(nearest.distance)+' unités'
      :'🚪 Passage indisponible';
    button.title='Rejoins le cercle jaune SORTIE avec le héros';
  }
}
function drawSculptWorldPortalMarkers(){
  if(!sculptWorldDraft)return;
  // Markers are a read-only projection of the same Portal.trigger / Spawn
  // coordinates used by findTriggeredPortal and applyPortalTransition.
  const markers=markersForSculptWorldArea(sculptWorldDraft,sculptWorldAreaId,{
    testing:navigationTesting,selectedPortalId:currentWorldPortal()?.id
  });
  if(!markers.length)return;
  ctx.save();
  if(navigationTesting){
    const view=cameraView();
    ctx.transform(1,view.shear,0,view.pitch,0,0);
  }
  for(const marker of markers){
    const {x,y,radius}=marker;
    const level=sculptHeightAt(terrain,Math.floor(x/SCULPT_TILE.width),
      Math.floor(y/SCULPT_TILE.height));
    const viewY=y-level*SCULPT_TILE.rise;
    const exit=marker.kind==='exit',arrival=marker.kind==='arrival';
    const color=exit?'#ffd77a':arrival?'#71d4ff':'#dba7ff';
    const title=exit?'SORTIE → ':arrival?'ARRIVÉE ← ':'DÉPART · ';
    const name=(marker.label??'').slice(0,35);
    const caption=title+name;
    // This ring is EXACTLY the real Portal trigger radius, not an enlarged
    // fake interaction zone. A separate fixed-screen-size label stays legible.
    ctx.beginPath();ctx.arc(x,viewY,radius,0,Math.PI*2);
    ctx.fillStyle=exit?'rgba(255,215,122,.20)':arrival
      ?'rgba(113,212,255,.20)':'rgba(219,167,255,.20)';
    ctx.strokeStyle=color;ctx.lineWidth=(marker.selected?3.6:2.6)/Math.max(zoom,.3);
    ctx.fill();ctx.stroke();
    if(marker.selected){
      ctx.beginPath();ctx.arc(x,viewY,radius+4/Math.max(zoom,.3),0,Math.PI*2);
      ctx.strokeStyle='#f1fff7';ctx.lineWidth=1.3/Math.max(zoom,.3);ctx.stroke();
    }
    const size=12/Math.max(zoom,.3);
    const pad=5/Math.max(zoom,.3),height=20/Math.max(zoom,.3);
    ctx.font='bold '+size+'px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    const width=ctx.measureText(caption).width+2*pad;
    const centerY=viewY-radius-height/2-8/Math.max(zoom,.3);
    ctx.fillStyle='rgba(9,30,41,.92)';
    ctx.fillRect(x-width/2,centerY-height/2,width,height);
    ctx.strokeStyle=color;ctx.lineWidth=1/Math.max(zoom,.3);
    ctx.strokeRect(x-width/2,centerY-height/2,width,height);
    ctx.fillStyle='#f8fbff';ctx.fillText(caption,x,centerY);
  }
  ctx.restore();
}
function commitCurrentSculptWorldArea(){
  if(!sculptWorldDraft||!sculptWorldAreaId)return null;
  if(!sculptWorldAreaMounted)throw Error('Zone 2,5D non chargée : aucune scène démo ne doit remplacer la WorldArea');
  const updated=saveSculptWorldArea(sculptWorldDraft,sculptWorldAreaId,captureSculptArea());
  const areas=updated.areas.map(a=>a.id===sculptWorldAreaId
    ?{...a,encounters:sculptExteriorEncounters}:a);
  // One EncounterConfig on the whole document, same Builder commands.
  sculptWorldDraft=createWorldBuilderDraft({
    ...updated,areas,encounterConfig:sculptEncounterConfig
  });
  return sculptWorldDraft;
}
function mountWorldSculptArea(areaId){
  sculptWorldAreaMounted=false;
  const area=sculptWorldDraft?.areas.find(a=>a.id===areaId);
  if(!area)throw Error('WorldArea cible absente');
  document.querySelector('header h1').textContent='World Builder · '+(area.label??'Carte');
  document.querySelector('header p').textContent='Un seul monde · deux panneaux · '+area.width/28+' × '+area.height/21+' cases';
  const scene=sculptWorldAreaScene(area);
  sculptWorldAreaId=areaId;
  activeInteriorId=null;sculptInteriors=Object.freeze([]);
  outsideAreaSnapshot=null;
  mountSculptArea(scene);
  // The preset filename belongs to the selected WorldArea, not the previously
  // visited region. Never accidentally overwrite 'Area A' after visiting B.
  const presetInput=$('sculpt-map-preset-name');
  if(presetInput){
    const areaName=(area.label?.trim()||'Ma carte').slice(0,64);
    const builtin=builtinSculptMapPresets().some(p=>
      p.name.toLocaleLowerCase('fr')===areaName.toLocaleLowerCase('fr'));
    presetInput.value=builtin?(areaName.slice(0,49)+' (personnelle)'):areaName;
  }
  // The Encounter editor follows the selected Area's actual terrain family.
  // It edits the same single saved EncounterConfig, never a local duplicate.
  selectedSculptEncounterFamilyId=surface.baseTerrainFamilyId;
  sculptWorldAreaMounted=true;
  sculptExteriorEncounters=area.encounters;
  sculptEncounterConfig=sculptWorldDraft.encounterConfig;
  sculptEncounterAreaCache=null;
  updateSculptAreaControls();
  refreshSculptEncounterEditor();
  refreshSculptWorldPanel();
  fit();
}
function traverseSculptWorldPortal(){
  let portal=sculptWorldPortalAtHero();
  if(!portal){
    if(worldOutboundPortals().some(p=>p.enabled===true)||
       !playableExteriorArea(sculptWorldArea())||!navigationTesting)return;
    if(!window.confirm('Cette carte n’a pas de sortie. Créer des Portals aller-retour vers une autre région jouable ? '+ 
        'Le héros devra rejoindre le cercle SORTIE pour traverser. Les anciennes zones seront conservées.'))return;
    try{
      const document=commitCurrentSculptWorldArea();
      const repaired=makePlayableZoneRoute(document,{
        selectedAreaId:sculptWorldAreaId,initializeEncounters:true
      });
      sculptWorldDraft=repaired.document;
      sculptEncounterConfig=sculptWorldDraft.encounterConfig;
      refreshSculptEncounterEditor();
      refreshSculptWorldPanel();
      sculptWorldStatus('✓ Sortie créée sur le chemin. Rejoins le cercle SORTIE pour changer de zone.');
    }catch(error){sculptWorldStatus('Raccord refusé : '+error.message,true);}
    return;
  }
  try{
    let target=sculptWorldDraft.areas.find(a=>a.id===portal.targetAreaId);
    try{sculptWorldAreaScene(target);}
    catch(error){
      if(portal.trigger?.kind!=='point'||!playableExteriorArea(sculptWorldArea()))throw error;
      if(!window.confirm('Cette sortie mène à une ancienne zone non jouable en 2,5D. '+ 
          'Réparer les passages vers les cartes compatibles et activer les rencontres non configurées ? '+ 
          'La zone historique, ses dimensions et ses objets resteront intacts.'))return;
      const current=commitCurrentSculptWorldArea();
      const repaired=makePlayableZoneRoute(current,{
        selectedAreaId:sculptWorldAreaId,initializeEncounters:true
      });
      sculptWorldDraft=repaired.document;
      sculptEncounterConfig=sculptWorldDraft.encounterConfig;
      portal=sculptWorldDraft.portals.find(p=>p.id===portal.id);
      if(!portal)throw Error('Portal réparé introuvable');
      target=sculptWorldDraft.areas.find(a=>a.id===portal.targetAreaId);
      sculptWorldAreaScene(target);
    }
    // The SAME runtime Portal resolver used by the 2D world document.
    const document=commitCurrentSculptWorldArea();
    const transition=applyPortalTransition(document,{
      currentAreaId:sculptWorldAreaId,x:navActor.x,y:navActor.y
    },portal);
    if(!transition)throw Error('Portal / Spawn cible invalide');
    // Load and validate the destination BEFORE releasing the current Area.
    sculptWorldAreaScene(document.areas.find(a=>a.id===transition.currentAreaId));
    if(navigationTesting)setNavigationTesting(false);
    mountWorldSculptArea(transition.currentAreaId);
    setNavigationTesting(true);
    if(!navActor)throw Error('Zone de destination non praticable');
    navActor.x=transition.x;navActor.y=transition.y;
    navActor.moving=false;
    sculptEncounterController?.resetAnchor();
    navVisualLevel=navHeight();
    centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
    sculptWorldStatus('Passage franchi : '+sculptWorldArea().label+
      ' · arrivée par Spawn '+portal.targetSpawnId);
    const feedback=$('world-portal-feedback');
    feedback.textContent='✓ Arrivée : '+(sculptWorldArea().label??sculptWorldAreaId);
    feedback.dataset.error='false';feedback.hidden=false;
  }catch(error){
    sculptWorldStatus('Passage indisponible : '+error.message,true);
    const feedback=$('world-portal-feedback');
    feedback.textContent='Passage bloqué : '+error.message;
    feedback.dataset.error='true';feedback.hidden=false;
  }
}
function installSculptWorldAreaEditing(){
  if(new URLSearchParams(window.location.search).get('worldAssembler')!=='1')return;
  document.body.classList.add('world-area-editing');
  $('world-workspace-tabs').hidden=false;
  $('world-area-portal-panel').open=false;
  const requestedAreaId=new URLSearchParams(window.location.search).get('areaId');
  // The handoff is intentionally consumed once. On a page refresh we
  // restore from the SAME canonical world document saved by World Builder,
  // never from an independent Sculpt scene or parallel WorldGraph.
  const transfer=readWorldAssemblerHandoff(window.sessionStorage)??(()=>{
    const document=readWorldAssemblerDraft(window.localStorage);
    return document&&requestedAreaId&&
      document.areas.some(a=>a.id===requestedAreaId)
      ?{document,areaId:requestedAreaId}:null;
  })();
  if(!transfer){
    const unavailable=$('world-area-unavailable');
    unavailable.hidden=false;
    $('world-area-unavailable-message').textContent=
      'Le contexte World Builder est absent. Reviens au panneau Monde pour sélectionner une carte.';
    $('world-area-unavailable-return').addEventListener('click',()=>
      window.location.assign('./world-assembler.html'));
    $('world-area-unavailable-create').addEventListener('click',()=>
      window.location.assign('./world-assembler.html?createArea=1'));
    document.body.classList.add('world-area-unavailable');
    sculptWorldStatus('Session World Builder absente. Retourne au constructeur de mondes.',true);
    return;
  }
  sculptWorldDraft=transfer.document;sculptWorldAreaId=transfer.areaId;
  $('world-area-portal-panel').hidden=false;
  $('new-map-toggle').disabled=false; // dimensions locked inside confirmation, scene reset allowed
  $('import').disabled=true; // standalone Sculpt scene cannot replace a world document
  $('new-map-toggle').title='Créer une carte vierge de même taille sans supprimer les passages';
  function persistCurrentWorldSculpt(){
    // A legacy WorldArea which could not be mounted is read-only. Its canonical
    // original world data is persisted intact; the independent demo canvas is NEVER
    // serialized into the user's zone.
    if(sculptWorldAreaMounted)commitCurrentSculptWorldArea();
    // The single world document is written into its canonical storage key.
    // No independent map/scene key or duplicate portal owner is introduced.
    saveWorldAssemblerDraft(window.localStorage,sculptWorldDraft);
    return sculptWorldDraft;
  }
  function saveAndReturnWorldArea({newArea=false}={}){
    try{
      persistCurrentWorldSculpt();
      saveWorldAssemblerHandoff(
        window.sessionStorage,sculptWorldDraft,sculptWorldAreaId);
      window.location.assign('./world-assembler.html?return=1&portalUi=compact1&marker=visible2&maps=presets3'+
        (newArea?'&createArea=1':''));
    }catch(error){
      sculptWorldStatus('Enregistrement bloqué : '+error.message,true);
      const feedback=$('world-portal-feedback');
      feedback.textContent='Enregistrement bloqué : '+error.message;
      feedback.dataset.error='true';feedback.hidden=false;
    }
  }
  $('world-area-unavailable-return').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-area-unavailable-create').addEventListener('click',()=>saveAndReturnWorldArea({newArea:true}));
  $('world-area-house-back').addEventListener('click',()=>{
    const parent=sculptWorldHouseParentLink();
    if(!parent||!sculptWorldAreaMounted)return;
    try{
      commitCurrentSculptWorldArea();
      saveWorldAssemblerDraft(window.localStorage,sculptWorldDraft);
      mountWorldSculptArea(parent.sourceAreaId);
      sculptWorldStatus('Maison retrouvée : intérieur et extérieur sauvegardés dans le même monde.');
    }catch(error){sculptWorldStatus('Retour à la maison impossible : '+error.message,true);}
  });
  $('world-area-return').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-workspace-world').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-workspace-return-float').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-area-create-another').addEventListener('click',()=>saveAndReturnWorldArea({newArea:true}));
  // The header World Builder link must never silently discard pending edits.
  document.querySelector('.world-entry-links a[href="./world-assembler.html"]')
    ?.addEventListener('click',event=>{
      event.preventDefault();
      saveAndReturnWorldArea();
    });
  $('world-area-portal-select').addEventListener('change',refreshSculptWorldPanel);
  $('world-area-spawn-select').addEventListener('change',refreshSculptWorldPanel);
  for(const [id,mode] of [
    ['world-area-portal-place','portal'],['world-area-spawn-place','spawn']]){
    $(id).addEventListener('click',()=>{
      if(navigationTesting){sculptWorldStatus('Quitte le mode Tester avant de poser le point.',true);return;}
      sculptWorldPortalPlacement=sculptWorldPortalPlacement===mode?null:mode;
      if(sculptWorldPortalPlacement)$('world-area-portal-panel').open=false;
      refreshSculptWorldPanel();
      sculptWorldStatus(sculptWorldPortalPlacement
        ?'Touche directement l’emplacement voulu sur le terrain 2,5D.'
        :'Placement annulé.');
    });
  }
  $('world-area-portal-label-save').addEventListener('click',()=>{
    const portal=currentWorldPortal();
    if(!portal){sculptWorldStatus('Aucun passage à nommer dans cette zone',true);return;}
    try{
      sculptWorldDraft=setSculptWorldPortalLabel(sculptWorldDraft,portal.id,
        $('world-area-portal-label').value);
      refreshSculptWorldPanel();
      sculptWorldStatus('Nom du repère SORTIE enregistré sur le Portal.');
    }catch(error){sculptWorldStatus(error.message,true);}
  });
  $('world-area-portal-save').addEventListener('click',()=>{
    try{commitSculptWorldPortal({
      x:Number($('world-area-portal-x').value),
      y:Number($('world-area-portal-y').value)
    });}catch(error){sculptWorldStatus(error.message,true);}
  });
  $('world-area-spawn-save').addEventListener('click',()=>{
    try{commitSculptWorldSpawn({
      x:Number($('world-area-spawn-x').value),
      y:Number($('world-area-spawn-y').value)
    });}catch(error){sculptWorldStatus(error.message,true);}
  });
  $('world-portal-traverse').addEventListener('click',traverseSculptWorldPortal);
  // Persist on refresh/navigation as well; the landing screen can recover
  // the selected area using areaId and this exact world document.
  window.addEventListener('pagehide',()=>{
    try{persistCurrentWorldSculpt();}
    catch(error){console.warn('WorldArea non sauvegardée au changement de page :',error);}
  },{once:true});
  try{
    mountWorldSculptArea(transfer.areaId);
    sculptWorldStatus('WorldArea '+sculptWorldArea().label+
      ' chargée : place ses passages, teste-les, puis enregistre le monde.');
  }catch(error){
    // A legacy/oversized Area must not display the separate demo terrain as if
    // it were the user's editable map; navigation remains possible.
    document.body.classList.add('world-area-unavailable');
    $('world-area-portal-panel').hidden=true;
    $('new-map-toggle').disabled=true;
    $('world-area-unavailable').hidden=false;
    $('world-area-unavailable-message').textContent=
      'Cette ancienne zone ('+sculptWorldArea().width+' × '+sculptWorldArea().height+
      ' unités) ne peut pas encore s’ouvrir en 2,5D. '+error.message+
      ' Son contenu n’a pas été modifié. Reviens au Monde, ou crée une nouvelle carte de taille compatible.';
    sculptWorldStatus('Zone non ouvrable en 2,5D : '+error.message+
      ' · carte et liens conservés, retour au Monde disponible.',true);
  }
  window.__sculptWorldProbe=()=>Object.freeze({
    inspectorOpen:$('world-area-portal-panel').open,
    fullscreenActive:document.body.classList.contains('sculpt-immersive'),
    fullscreenActionVisible:!$('fullscreen-toggle').hidden,
    enabled:!!sculptWorldDraft,areaId:sculptWorldAreaId,
    areaKind:sculptWorldArea()?.kind??null,
    siteKind:sculptWorldArea()?.siteKind??null,
    areaCount:sculptWorldDraft?.areas.length??0,
    portalCount:sculptWorldDraft?.portals.length??0,
    outgoing:worldOutboundPortals().map(p=>({id:p.id,targetAreaId:p.targetAreaId,
      trigger:p.trigger})),
    spawns:sculptWorldArea()?.spawns??[],
    terrainWidth:terrain.width,terrainHeight:terrain.height,
    editable:sculptWorldAreaMounted,
    traverseVisible:!$('world-portal-traverse').hidden,
    placementMode:sculptWorldPortalPlacement
  });
}

// Local templates are versioned snapshots of the existing Sculpt scene, not
// an alternative document de monde. Reusing them always enters the regular editor.
function installSculptMapPresetPalette(){
  const select=$('sculpt-map-preset-select'),nameInput=$('sculpt-map-preset-name');
  const presetStatus=(message,error=false)=>{
    const label=$('sculpt-map-preset-status');
    label.textContent=message;label.style.color=error?'#ffccbb':'#b7f2d6';
    status(message);
  };
  const personal=()=>readSculptMapPresets(window.localStorage);
  const selected=()=>listAvailableSculptMapPresets(window.localStorage)
    .find(p=>p.id===select.value);
  const reserved=name=>builtinSculptMapPresets().some(p=>
    p.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'));
  function suggestName(){
    const area=sculptWorldDraft?.areas.find(a=>a.id===sculptWorldAreaId);
    const label=area?.label?.trim()||'Ma carte';
    // A builtin label is a protected name. Copying its map never overwrites it.
    return reserved(label)?(label+' (personnelle)').slice(0,64):label.slice(0,64);
  }
  function refresh(selectedId){
    try{
      const library=listAvailableSculptMapPresets(window.localStorage);
      const previous=selectedId??select.value;
      select.replaceChildren(new Option('Sélectionner une carte',''),
        ...library.map(p=>new Option(p.name,p.id)));
      if(library.some(p=>p.id===previous))select.value=previous;
      const available=!!select.value;
      $('sculpt-map-preset-apply').disabled=!available;
      $('sculpt-map-preset-export').disabled=!available;
      $('sculpt-map-preset-count').textContent=personal().length+
        ' carte(s) personnelle(s) · disponibles aussi dans World Builder';
      return library;
    }catch(error){presetStatus(error.message,true);return [];}
  }
  function storeCurrent(){
    let name=nameInput.value.trim()||suggestName();
    nameInput.value=name;
    if(reserved(name))throw Error('Ce nom appartient à un modèle fourni : choisis un autre nom.');
    const existing=personal().find(p=>
      p.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'));
    if(existing&&!window.confirm('Remplacer ta carte enregistrée « '+existing.name+' » ?'))return null;
    // The snapshot comes from the SAME Sculpt/WorldArea state as gameplay.
    const saved=saveSculptMapPreset(window.localStorage,captureSculptArea(),name);
    refresh(saved.id);
    return saved;
  }
  function downloadPreset(preset){
    const content=serializeSculptMapPresetForShare(preset);
    const blob=new Blob([content],{type:'application/json'});
    const url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=sculptMapPresetFilename(preset);
    document.body.append(link);link.click();link.remove();
    // A Chrome/Android download must retain the object URL until the browser
    // has accepted the click. Immediate revocation broke some mobile exports.
    window.setTimeout(()=>URL.revokeObjectURL(url),30000);
    presetStatus('Fichier « '+link.download+' » téléchargé. Tu peux me le joindre ici.');
  }
  async function sharePreset(preset){
    const content=serializeSculptMapPresetForShare(preset);
    const filename=sculptMapPresetFilename(preset);
    if(typeof File==='function'&&typeof navigator.share==='function'&&
        typeof navigator.canShare==='function'){
      const file=new File([content],filename,{type:'application/json'});
      if(navigator.canShare({files:[file]})){
        try{
          await navigator.share({title:'Carte '+preset.name,files:[file]});
          presetStatus('Carte partagée : '+preset.name);
          return;
        }catch(error){
          if(error?.name==='AbortError'){
            presetStatus('Partage annulé · ta carte reste dans la bibliothèque.');
            return;
          }
          // Native file sharing is optional. The identical validated file
          // remains available as a normal download when Share fails.
        }
      }
    }
    downloadPreset(preset);
  }
  select.addEventListener('change',()=>{
    const preset=selected();
    if(preset)nameInput.value=reserved(preset.name)
      ?(preset.name.slice(0,49)+' (personnelle)'):preset.name;
    refresh(select.value);
  });
  $('sculpt-map-preset-save').addEventListener('click',()=>{
    try{
      const saved=storeCurrent();
      if(saved)presetStatus('✓ Carte « '+saved.name+' » conservée dans mes cartes et World Builder.');
    }catch(error){presetStatus('Sauvegarde impossible : '+error.message+
      '. Utilise « Enregistrer et partager » pour récupérer ton fichier.',true);}
  });
  $('sculpt-map-preset-save-share').addEventListener('click',async()=>{
    let preset;
    try{
      preset=storeCurrent();
      if(!preset)return;
    }catch(error){
      // Storage quota / private navigation cannot silently discard the map.
      // Offer the real validated attachment without pretending it was saved.
      const name=nameInput.value.trim()||suggestName();
      if(reserved(name)){presetStatus('Choisis un nom différent du modèle fourni.',true);return;}
      try{
        preset=createSculptMapPreset(captureSculptArea(),{name});
        presetStatus('Stockage local indisponible : partage le fichier maintenant.',true);
      }catch(validationError){
        presetStatus('Sauvegarde et fichier impossibles : '+validationError.message,true);
        return;
      }
    }
    try{await sharePreset(preset);}
    catch(error){presetStatus('Partage impossible : '+error.message,true);}
  });
  $('sculpt-map-preset-apply').addEventListener('click',()=>{
    try{
      const preset=selected();
      if(!preset)throw Error('Choisis une carte enregistrée');
      const scene=importSculptPreviewScene(preset.scene);
      if(sculptWorldDraft&&(scene.terrain.width!==terrain.width||
          scene.terrain.height!==terrain.height))
        throw Error('Préset de taille différente : crée plutôt une nouvelle zone depuis ce préset dans le World Builder.');
      if(!window.confirm('Remplacer le relief, les textures et les assets de cette carte par le préset « '+preset.name+' » ?'))return;
      if(navigationTesting)setNavigationTesting(false);
      if(objectEditing)setObjectEditing(false);
      if(surfaceEditing)setSurfaceEditing(false);
      mountSculptArea(scene);
      if(!sculptWorldDraft){
        // A map template does not carry gameplay Encounter settings.
        sculptEncounterConfig=sculptPreviewEncounterConfig;
        sculptExteriorEncounters=Object.freeze({randomEnabled:true});
      }
      sculptEncounterAreaCache=null;refreshSculptEncounterEditor();
      fit();
      presetStatus('Préset « '+preset.name+' » appliqué · passages et arrivées inchangés.');
    }catch(error){presetStatus(error.message,true);}
  });

  $('sculpt-map-preset-export').addEventListener('click',()=>{
    try{
      const preset=selected();if(!preset)throw Error('Choisis une carte enregistrée');
      downloadPreset(preset);
    }catch(error){presetStatus('Export impossible : '+error.message,true);}
  });
  $('sculpt-map-preset-import').addEventListener('change',async event=>{
    const input=event.currentTarget,file=input.files?.[0];if(!file)return;
    try{
      const imported=importSculptMapPreset(await file.text());
      const existing=personal().find(p=>
        p.name.toLocaleLowerCase('fr')===imported.name.toLocaleLowerCase('fr'));
      if(existing&&!window.confirm('Remplacer le préset « '+existing.name+' » ?'))return;
      if(reserved(imported.name))
        throw Error('Ce nom est déjà celui d’une carte fournie. Renomme le préset avant import.');
      const saved=addImportedSculptMapPreset(window.localStorage,imported);
      refresh(saved.id);nameInput.value=saved.name;
      presetStatus('✓ Carte « '+saved.name+' » importée dans la bibliothèque, sans toucher au monde en cours.');
    }catch(error){presetStatus('Import refusé : '+error.message,true);}
    finally{input.value='';}
  });
  nameInput.value=suggestName();
  refresh();
}

selectMode('dig');
setEditorKind('ground');
if(window.matchMedia?.('(pointer: coarse)').matches){
  $('precision-mode').checked=true;
}
updatePrecisionActions();
updateHistoryButtons();updateSurfaceCount();loadSculptTemplates();setTheme();setupRibbons();loadSphereWallImages();fit();
installSculptWorldAreaEditing();
installSculptMapPresetPalette();
