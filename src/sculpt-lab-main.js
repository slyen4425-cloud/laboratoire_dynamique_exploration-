// Self-contained optional heightfield experiment. Never changes the live 2D Builder.
import {createMaterialRegistry} from './materials/material-registry.js';
import {materialPackV1} from './materials/material-pack-v1.js';
import {resolveMaterialAsset} from './assets/material-asset-adapter.js';
import {SCULPT_TERRAIN_MAX_LEVEL,createSculptTerrain,sculptDemo,applySculptStroke,applySculptWaterStroke,sculptWaterAt,serializeSculptTerrain,importSculptTerrain,sculptHeightAt,sculptFaces,appendSculptSphere,removeSculptSphereAt,sculptSphereAt,sculptSphereDisplacementAt,sculptTerrainRampProjections,appendSculptTerrainRamp,removeSculptTerrainRampAt} from './world/sculpt-height-model.js?rev=terrain-sixteen-author-maps-three-v1-repaired-20261115';
import {SCULPT_TILE,drawSculptTerrain,drawSculptBrushPreview,SCULPT_PREVIEW_RIBBONS} from './render/sculpt-height-renderer.js?rev=sculpt-whole-hill-v61-sphere-v76-volume-r2-frustum-r9-depth-r11-altitude-r12-grass-corners-hero-r13-square-corners-r14-cliff-occlusion-20261115';
import {drawSculptSphereCursor} from './render/sculpt-sphere-mesh.js?rev=real-spherical-v76-volume-r2-frustum-r9-depth-r11-altitude-r12';
import {resolveSculptCliffAtlasUrl} from './render/sculpt-cliff-atlas.js';
import {resolveSculptCliffHDUrl,sculptCliffHDReady} from './render/sculpt-cliff-hd.js';
import {shouldPaintSculptNavigationFrame} from './render/sculpt-navigation-frame-pacing.js';
import {sculptCameraView,sculptCameraProject,sculptCameraProjectBridgeFoot,sculptCameraProjectBridgeCorridor,sculptCameraWorldInput,sculptCameraBounds,sculptCameraScreenToWorld,sculptCameraGameView,sculptCameraInteriorView,sculptCameraFollowActor,sculptPlayableCameraZoom} from './render/sculpt-camera-projection.js?rev=interior-v79-r3d-actor-follow';
import {cameraAngleFromAdventurePlayUrlV1,cameraInitialZoomFromAdventurePlayUrlV1} from './play/exploration-creator-camera-v1.js';
import {readCaptureLoadingArtSceneV1,createCaptureLoadingArtCycleV1,mountCaptureLoadingArtCrossfadeV1} from './play/exploration-loading-art-v1.js';
import {clampSculptNavigationCameraToTerrainV1,sculptExteriorFringeCameraBoundsV1,sculptExteriorSouthEdgeAtActorV1} from './render/sculpt-navigation-camera-clamp-v1.js';
import {sculptPlayableBoundaryOutlineV1} from './render/sculpt-playable-boundary-outline-v1.js';
import {sculptFringeResolvedPaintSurfaceV1} from './render/sculpt-fringe-visual-surface-v1.js';
import {sculptNpcScreenUiPositionV1} from './render/sculpt-npc-screen-ui-position-v1.js';
import {
  createSculptDecorativeFringeV1,normalizeSculptDecorativeFringeV1,
  paintSculptDecorativeFringeV1,paintSculptDecorativeFringeSurfaceV1,
  sculptDecorativeFringeCellIsOuterV1
} from './world/sculpt-decorative-fringe-v1.js';
import {createSculptPlaySceneReadinessCacheV1} from './play/sculpt-play-scene-readiness-cache-v1.js';
import {waitForSculptVisualImageV1,waitForSculptVisualSetV1} from './play/sculpt-play-visual-readiness-v1.js';
import {drawSculptSkyBackdrop} from './render/sculpt-sky-backdrop.js';
import {normalizeSculptBorderPreview,resolveSculptBorderBiome,
  drawSculptBorderExtension,drawSculptDistantBorders
} from './render/sculpt-border-scenery-v1.js';
import {stepMovement} from './core/movement.js?rev=bridge-grade-v69-deck-v70-rails-v71-north-r2-sphere-v76-stairs-v78-ramp-v77';
import {SCULPT_NAVIGATION_PROBE_DEFAULTS,sculptNavigationSample,sculptNavigationBlockDetail,sculptSphereProjectionBlock,sculptBridgeDeckAt,sculptBridgeDeckHeight} from './core/sculpt-navigation-collision.js?rev=sculpt-stairs-dynamic-height-v78-ramp-v77';
import {sculptStairHeightAt} from './core/sculpt-stair-traversal.js?rev=natural-ramp-v77';
import {sculptRampVisualMesh} from './render/sculpt-ramp-renderer.js?rev=terrain-native-v77-r2';
import {normalizeWorldArea} from './world/world-area-model.js?rev=interior-r3c-wall-materials';
import {INTERIOR_DOOR_ASSETS,INTERIOR_CONNECTOR_ASSETS} from './world/interior-material-catalog.js';
import {worldAreaBoundaryPoints,pointInWorldAreaBoundary} from './world/world-area-geometry.js';
import {sculptInteriorShapeId,sculptInteriorBoundary,resizeSculptInterior} from './world/sculpt-interior-layout.js?rev=interior-r3c-shapes';
import {appendInteriorWall,removeInteriorWallNear,INTERIOR_WALL_LIMIT,snapInteriorWallPoint} from './world/interior-wall-model.js';
import {drawSculptInteriorWalls} from './render/sculpt-interior-walls.js?rev=interior-v79-r3e-no-stair-marker';
import {SCULPT_EXTERIOR_AREA_ID,SCULPT_INTERIOR_LIMIT,
 SCULPT_INTERIOR_TEMPLATE_LIMIT,SCULPT_INTERIOR_FLOOR_LIMIT,createSculptInteriorArea,createSculptUpperFloor,updateSculptInterior,updateSculptInteriorDoor,updateSculptFloorConnector,
 serializeSculptInteriors,importSculptInteriors,sculptInteriorTransition,sculptInteriorAvailablePortal,
 normalizeSculptInteriorTemplates,createSculptInteriorTemplate,
 applySculptInteriorTemplate} from './world/sculpt-interior-area-link.js?rev=interior-v79-r3d-connector-rotation';
import {sculptPreviewCollisionCatalog} from './core/sculpt-preview-object-collisions.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71-ramp-v77';
import {sculptNavigationFrameSteps} from './core/sculpt-navigation-frame-clock.js';
import {sculptVisualHeightStep} from './core/sculpt-visual-height-step.js';
import {sculptAltitudeVisualState} from './render/sculpt-altitude-visual.js?rev=hero-depth-v76-r13';
import {createVirtualStick} from './input/virtual-stick.js';
import {resolveMapActorAsset,createMapActorAssetResolver} from './assets/map-actor-asset-adapter.js';
import {createImageAssetLoader} from './assets/image-asset-loader.js';
import {createCaptureActorPreviewProviderV1} from './capture/capture-actor-preview-loader-v1.js';
import {createPlacedMapActorView} from './actors/placed-map-actor-view.js';
import {nearestAggressiveTrainerV1,nearestDialogNpcV1,NPC_TRAINER_ROSTER_LIMIT_V1} from './actors/map-actor-npc-settings-v1.js?rev=trainer-test-paths-v1';
import {createNpcWanderRuntimeV1} from './actors/npc-wander-runtime-v1.js';
import {loadCaptureShowcaseEncounterSourceV1} from './capture/capture-showcase-encounter-source-v1.js';
import {createMapActorVisualPreparer} from './assets/map-actor-visual-preparer.js';
import {createMapActorRenderer} from './render/map-actor-renderer.js';
import {normalizeMapActorVisual} from './actors/map-actor-visual-model.js';
import {createUserHeroStoreV1} from './storage/user-hero-store-v1.js';
import {createUserNpcStoreV1} from './storage/user-npc-store-v1.js';
import {createUserNpcAssetResolverV1,resolvePlacedNpcDefinitionsV1} from './actors/user-npc-definition-v1.js';
import {createExplorationUniverseWorkspaceStorageV1} from './storage/exploration-universe-workspace-storage-v1.js';
import {createExplorationUniverseWorldProjectsV1} from './builder/exploration-universe-world-projects-v1.js';
import {createUserHeroAssetResolverV1} from './actors/user-hero-definition-v1.js';
import {readScopedAdventureHeroSelectionV1,readScopedAdventureHeroDisplayNameV1} from './actors/scoped-adventure-hero-v1.js';
import {resolveWorldObjectAsset} from './assets/world-object-asset-adapter.js?rev=waterfalls-v3';
import {drawWorldObjectSprite} from './render/world-object-frame-selector.js?rev=waterfalls-v3';
import {drawWorldObjectContactShadowV1} from './render/world-object-renderer.js';
import {normalizeWorldObjectShadowSettingsV1,WORLD_OBJECT_SHADOW_DEFAULT_V1,normalizeWorldObjectShadowProfilesV1,worldObjectShadowProfileForAssetV1,setWorldObjectShadowProfileV1} from './world/world-object-shadow-settings-v1.js?rev=shadow-model-profiles-20261115';
import {createSculptPlayObjectDrawCacheV1} from './render/sculpt-play-object-draw-cache-v1.js';
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
  findSculptPreviewActorNear,updateSculptPreviewActor} from './world/sculpt-scene-preview.js?rev=sculpt-bridge-tactile-v64-deck-v70-rails-v71-axes-v72-waterfalls-v3-stairs-visible-r15-ramp-v77-dense-forest-20261115';
import {createSculptSurface,normalizeSculptSurface,appendSculptSurfaceStroke,removeSculptSurfaceAt,
  SCULPT_SURFACE_MATERIALS,sculptEncounterFamilyForMaterial,alignSculptSurfaceEncounterFamilies} from './world/sculpt-surface-paint.js';
import {terrainFamilyRegistry} from './world/terrain-family-registry.js';

import {createCaptureCreatureCatalogProvider} from './capture/capture-creature-catalog-provider.js';
import {
  loadCaptureAuthorEncounterBundleV1,
  projectCaptureShowcaseEncounterSourceV1
} from './capture/capture-showcase-encounter-source-v1.js';
import {readScopedAdventurePlayingPartyV1} from './encounters/adventure-playing-party-v1.js';
import {acquireAdventureEncounterLeaseV1,requestAdventureCombatHostV1} from './encounters/adventure-combat-host-client-v1.js';
import {consumeCombatResult,readCombatHandoff} from './encounters/combat-handoff-store.js';
import {readScopedAdventurePublishedEncountersV1} from './encounters/adventure-published-encounters-v1.js';
import {createEncounterController} from './encounters/encounter-controller.js';
import {resolveTerrainFamilyAtPoint} from './encounters/terrain-family-resolver.js';
import {normalizeTerrainFamilyEncounterConfig} from './encounters/terrain-family-encounter-config.js';
import {setAreaEncounterRandomEnabled,updateTerrainFamilyEncounterProfile,
  setTerrainFamilyEncounterElementEnabled} from './builder/world-builder-draft.js?rev=preset-travel-encounters-v2';
import {createSculptEncounterArea,sculptPreviewEncounterConfig} from './encounters/sculpt-encounter-area-adapter.js';
import {snapshotFromEncounterIntent} from './encounters/encounter-bridge.js';
import {createCaptureEncounterSnapshot} from './encounters/capture-encounter-contract.js';
import {worldCombatArenaIdsV1} from './world/world-combat-arena-v1.js';
import {launchCombatHandoffNavigation} from './encounters/combat-handoff-navigation.js';
import {resolveExplorationCombatReturn} from './encounters/combat-return.js';
import {createImmersiveEncounterHostV1} from './encounters/immersive-encounter-host-v1.js';
import {createCaptureCombatWarmupV1} from './encounters/capture-combat-warmup-v1.js';
import {createExplorationSoundtrackV1} from './audio/exploration-soundtrack-v1.js?rev=mobile-real-play-r2';
import {findTriggeredPortal,applyPortalTransition,resolvePortalTriggerPoint} from './world/portal-model.js';
import {createSculptMapPreset,saveSculptMapPreset,readSculptMapPresets,
  addImportedSculptMapPreset,importSculptMapPreset,
  deleteSculptMapPreset,clearPersonalSculptMapPresets} from './builder/sculpt-map-preset-library.js?rev=author-maps-three-v1';
import {sculptWorldAreaScene,saveSculptWorldArea,snapshotSculptWorldAreaForRecovery,
  placeSculptWorldPortal,placeSculptWorldSpawn,setSculptWorldPortalLabel,
  ensureFreeWorldInitialSpawnV1,linkSculptWorldBuildingInteriorV1} from './builder/sculpt-world-area-link.js';
import {markersForSculptWorldArea,pickSculptWorldEditorMarkerV1} from './builder/sculpt-world-portal-markers.js';
import {describeWorldAreaSpawnsForEditorV1,describeWorldAreaIncomingPortalsForEditorV1} from './builder/sculpt-world-spawn-controls-v1.js';
import {readWorldAssemblerHandoff,saveWorldAssemblerHandoff,readWorldAssemblerDraft,saveWorldAssemblerDraft} from './builder/world-assembler-handoff.js';
import {readExplorationPlay,createExplorationPlayProgressWriter} from './play/exploration-play-session.js';
import {emitExplorationPlayNavigationCommittedV1
} from './play/exploration-play-events-v1.js';
import {createExplorationPeerVisualProjectionV1,EXPLORATION_PEER_SNAPSHOT_EVENT_V1,
 EXPLORATION_PEER_RECEIVER_READY_EVENT_V1,
 explorationPeerOverlapVisualOffsetV1
} from './play/exploration-peer-visual-projection-v1.js';
import {listAvailableSculptMapPresets,builtinSculptMapPresets} from './builder/sculpt-builtin-map-presets.js?rev=author-maps-three-v1';
import {renderSculptMapPresetChoicesV1} from './builder/sculpt-map-preset-choices-ui-v1.js?rev=library-ux-20261118';
import {createWorldBuilderDraft,addTerrainFamilyDefinition,updateTerrainFamilyElementChance,connectWorldAreas,ensureWorldPortalIndependentArrivalV1,initializeWorldPresetEncounters,validateWorldBuilderDraft} from './builder/world-builder-draft.js?rev=preset-travel-encounters-v2';
import {worldInteriorFloors,worldInteriorFloorPortals,worldInteriorHouseExit,
  addWorldInteriorFloor,changeWorldInteriorConnector,changeWorldInteriorDoor}
  from './builder/sculpt-world-interior-floors-v1.js?rev=restore-world-interior-tools-20261115';
import {makePlayableZoneRoute,playableExteriorArea} from './builder/sculpt-playable-zone-route.js?rev=preset-travel-encounters-v2';
import {encounterConfigNeedsExplicitInitialization} from './builder/preset-encounter-defaults.js';

const $=id=>document.getElementById(id);
// One visible toolbar entry opens the EXISTING atelier accordion; no duplicate
// controls or secondary settings state is stored outside the HTML details.
const sculptSettingsPanel=$('sculpt-settings');
const sculptSettingsToggle=$('sculpt-settings-toggle');
if(sculptSettingsPanel&&sculptSettingsToggle){
  const syncSculptSettingsToggle=()=>{
    const open=sculptSettingsPanel.open;
    sculptSettingsToggle.setAttribute('aria-expanded',String(open));
    sculptSettingsToggle.textContent=open?'✕ Réglages':'⚙ Réglages';
  };
  sculptSettingsToggle.addEventListener('click',()=>{
    sculptSettingsPanel.open=!sculptSettingsPanel.open;
    syncSculptSettingsToggle();
  });
  sculptSettingsPanel.addEventListener('toggle',syncSculptSettingsToggle);
  syncSculptSettingsToggle();
}
const sculptUniverseId=new URLSearchParams(window.location.search).get('universe');
const universeWorldProjects=sculptUniverseId===null?null:createExplorationUniverseWorldProjectsV1({
 storage:window.localStorage,makeId:()=>crypto.randomUUID()
});
if(universeWorldProjects&&universeWorldProjects.list(sculptUniverseId).length===0)
 throw new Error('Univers sans WorldDocument natif : aucune scène historique ouverte');
const worldStorage=sculptUniverseId===null?window.localStorage:
 createExplorationUniverseWorkspaceStorageV1(window.localStorage,sculptUniverseId);
const worldSessionStorage=sculptUniverseId===null?window.sessionStorage:
 createExplorationUniverseWorkspaceStorageV1(window.sessionStorage,sculptUniverseId);
// Only the official Capture host may supply a SoundtrackProject Map scene;
 // the native Explorer still owns all decoding and playback.
let captureMapMusicScene=null;
const soundtrackParam=new URLSearchParams(window.location.search).get('soundtrackMusic');
if(soundtrackParam!==null){
  try {
    if(soundtrackParam.length>2000)throw new Error('Map soundtrack config too large');
    captureMapMusicScene=JSON.parse(soundtrackParam);
  }catch(error){
    console.warn('Configuration musicale Capture ignorée :',error);
  }
}
let explorationSoundtrack;
try{explorationSoundtrack=createExplorationSoundtrackV1({sceneMusic:captureMapMusicScene});}
catch(error){
 console.warn('Configuration Map non reconnue : lecture Exploration historique maintenue',error);
 explorationSoundtrack=createExplorationSoundtrackV1();
}
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
 // A standalone Sculpt preview can export the same official profile format;
 // the WorldBuilder path instead edits its ONE canonical world record.
 let sculptStandaloneShadowProfiles=Object.freeze([]);
 let shadowProfileHistory=[],shadowProfileRedo=[];
let actorSubmode=false,placedActors=Object.freeze([]),actorHistory=[],actorRedo=[];
// A single transient runtime projection; WorldArea.actors is never advanced by gameplay.
const npcWanderRuntime=createNpcWanderRuntimeV1({move:stepMovement});
let npcWanderElapsed=0,npcWanderAggressiveNearId=null;
function npcActorsWithDefinitions(){
  return resolvePlacedNpcDefinitionsV1(placedActors,
    captureActorProvider?.resolveDefinition??(()=>null));
}
function gameplayPlacedActors(){
  const actors=npcActorsWithDefinitions();
  return navigationTesting?npcWanderRuntime.project(actors):actors;
}
let actorSelectedId=null;
let captureActorProvider=null,captureActorRenderer=null,captureActorImageLoader=null;
let captureActorPreparer=null,npcMediaResolver=null;
const authoredNpcStore=createUserNpcStoreV1();
let authoredNpcRecords=Object.freeze([]),npcCatalogRefreshPending=false;
let npcOfficialCreatures=Object.freeze([]);
let npcCatalogLoading=false;
let npcMerchantChoices=Object.freeze([]),npcMerchantRequestId=null;
let npcRewardChoices=Object.freeze([]),npcRewardRequestId=null;
let surface=createSculptSurface(),surfaceEditing=false,surfaceDrawing=false;
// Same WorldArea authoring data; fringe cells are never passed to Collision World.
let decorativeFringe=null,fringeEditing=false,fringeGesture=null;
let fringeSurfaceGesture=null,fringeObjectDrag=null;
// Unsaved visual fallback is derived from the authoritative WorldArea terrain;
// painting the ring explicitly still creates the only persistent fringe.
let visualFringeTerrain=null,visualFringeAreaId=null,visualFringeCache=null;
let fringeHistory=[],fringeRedo=[];
const fringeRasterCache=new Map();
window.__sculptFringeProbe=()=>Object.freeze({
  available:!!sculptWorldDraft&&sculptWorldAreaMounted&&!activeInteriorId,
  editing:fringeEditing,active:!!decorativeFringe,
  chunks:decorativeFringe?.chunks.length??0,
  objects:decorativeFringe?.objects.length??0,
  levelSum:decorativeFringe?.chunks.reduce((sum,c)=>
    sum+c.terrain.levels.reduce((a,b)=>a+b,0),0)??0,
  initialWidth:terrain.width,initialHeight:terrain.height,
  margin:8,pan:{...pan},zoom,
  bounds:cameraBounds(),
  navigationTesting
});
// The frozen V80 HTML lacks the newer semantic palette. The shared module
// supports its existing WorldSurface authoring without a second control path.
const surfaceBaseFamilySelect=$('surface-base-family');
const surfacePaintFamilySelect=$('surface-family');
if(Boolean(surfaceBaseFamilySelect)!==Boolean(surfacePaintFamilySelect))
  throw Error('Incomplete terrain family palette in sculpt editor HTML');
// In World Builder, the canonical WorldDocument defines custom families.
// Standalone Sculpt / V80 continue to use the historical defaults.
const sculptTerrainFamilies=()=>sculptWorldDraft?.terrainFamilies?.length
  ?sculptWorldDraft.terrainFamilies:terrainFamilyRegistry.list();
let sculptPaintFamilyManuallyChosen=false;
function refreshSculptTerrainFamilySelectors(){
  if(!surfaceBaseFamilySelect)return;
  const families=sculptTerrainFamilies();
  const ids=new Set(families.map(f=>f.id));
  const preferredPaint=surfacePaintFamilySelect.value;
  for(const selector of [surfaceBaseFamilySelect,surfacePaintFamilySelect]){
    const desired=selector===surfaceBaseFamilySelect
      ?surface.baseTerrainFamilyId:preferredPaint;
    selector.replaceChildren(...families.map(f=>new Option(f.label,f.id)));
    selector.value=ids.has(desired)?desired:
      (ids.has(surface.baseTerrainFamilyId)?surface.baseTerrainFamilyId:families[0]?.id??'');
  }
}
if(surfaceBaseFamilySelect){
  refreshSculptTerrainFamilySelectors();
  surfacePaintFamilySelect.value=sculptEncounterFamilyForMaterial($('surface-material').value)??surface.baseTerrainFamilyId;
  surfacePaintFamilySelect.addEventListener('change',()=>{sculptPaintFamilyManuallyChosen=true;});
}
let surfaceStrokePoints=[],surfaceLastCell='',surfaceHistory=[],surfaceRedo=[];
const surfacePaintImages=new Map();
let objectSelectedId=null,objectDrag=null;
let shadowControlsOwnerId=null; // UI identity only; WorldObject owns the settings.
const objectImages=new Map(),availableObjects=listSculptPlaceableDefinitions();
// Frame state is owned once before image callbacks register. Decoding can
// finish while this ES module is suspended at top-level await; never queue a
// draw until all canvas/WorldArea/camera dependencies have initialized.
let framePending=false;
let sculptBootReady=false;
let initialRibbonImagesReady=Promise.resolve(),initialSphereImagesReady=Promise.resolve();
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
  picture.src=sourceCleaned2p5d?resolved.path+'?source-clean-v75':resolved.path;
  objectImages.set(assetId,picture);
  return picture;
}
let navigationTesting=false,navActor=null,navFrame=0,navPreviousTime=null,navStick=null;
// The Adventure host chooses ONLY the angle. The authoritative camera
// projection remains here, and each player keeps the native zoom slider.
const sculptCreatorCameraAngle=cameraAngleFromAdventurePlayUrlV1(window.location.search);
if(sculptCreatorCameraAngle!==null){
  $('navigation-camera-angle').value=String(sculptCreatorCameraAngle);
  $('navigation-camera-angle').disabled=true;
  $('navigation-camera-angle-value').textContent=sculptCreatorCameraAngle+'° · créateur';
}
const sculptPlayRequested=new URL(document.URL).searchParams.get('play')==='1';
if(sculptPlayRequested&&window.frameElement){
  // The host Capture document owns browser fullscreen and the Sac/Équipe HUD.
  // Never allow its nested Exploration editor to replace this top layer.
  $('fullscreen-toggle').hidden=true;
}
if(sculptPlayRequested){
  // Same camera and zoom slider as the native Tester. Apply a creator-chosen
  // starting distance without locking later player pinch/slider zoom.
  const initialZoom=cameraInitialZoomFromAdventurePlayUrlV1(window.location.search);
  if(initialZoom!==null){
    $('navigation-camera-zoom').value=String(initialZoom);
    $('navigation-camera-zoom-value').textContent=initialZoom+' % · départ';
  }
}
// GenSRPG only supplies a creator preference. Native Exploration still owns
// the actual movement speed, collision and simulation clock.
if(sculptPlayRequested){
  const requested=new URL(document.URL).searchParams.get('moveSpeed');
  const parsed=requested===null?90:Number(requested);
  const speed=Number.isSafeInteger(parsed)&&parsed>=90&&parsed<=360&&
    (parsed-90)%10===0?parsed:90;
  $('navigation-speed').value=String(speed);
  $('navigation-speed-value').textContent=String(speed);
}
const adventureSessionId=new URL(document.URL).searchParams.get('adventureSession');
const playOptions=adventureSessionId===null?undefined:{sessionId:adventureSessionId};
const sculptCombatSessionId=sculptPlayRequested?playOptions?.sessionId:undefined;
const sculptCombatStorage=sculptCombatSessionId===undefined?window.sessionStorage:window.localStorage;
const sculptPreviewPartyRef='capture-party-player-v1';
let sculptPlayActive=false,playLastCheckpointAt=0,playPositionWriter=null;

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
const sculptEncounterTest=!sculptPlayRequested&&new URL(document.URL).searchParams.get('encounterTest')==='1';
const newSculptEncounterIds=()=>({
  encounterId:'encounter-'+window.crypto.randomUUID(),
  returnToken:'return-'+window.crypto.randomUUID()
});
const sculptEncounterController=sculptEncounterDialog?createEncounterController({
  checkDistance:sculptEncounterTest?80:160,
  // Only a GenSRPG-owned AdventureSession needs stable uniqueness across
  // page reloads. The official Tester keeps deterministic sequential IDs.
  // This does not grant permission to spawn unpublished creatures in Jouer.
  createCorrelationIds:sculptPlayRequested&&adventureSessionId!==null
    ?newSculptEncounterIds
    :undefined
}):null;
// Combat's official Showcase is required for encounters, NOT for drawing the
// WorldArea. Fail encounters closed with the real error, while the terrain,
// editor, collision and camera keep their original independent owners.
let sculptEncounterCatalog=null,sculptEncounterSourceError=null;
let sculptEncounterSource=null,sculptEncounterSourceBundle=null;
let sculptPlayPublishedCount=0,scopedEncounter=null;
if(sculptEncounterController){
  try{
    sculptEncounterSourceBundle=await loadCaptureAuthorEncounterBundleV1(
      sculptPlayRequested&&playOptions
        ?{releaseLoadId:window.crypto.randomUUID()}
        : {}
    );
    sculptEncounterSource=projectCaptureShowcaseEncounterSourceV1(
      sculptEncounterSourceBundle.creatureTransfers);
    sculptEncounterCatalog=createCaptureCreatureCatalogProvider(sculptEncounterSource);
  }catch(error){
    sculptEncounterSourceError=error;
    console.error('Rencontres Capture indisponibles : source Combat officielle requise',error);
  }
}
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
  const families=sculptTerrainFamilies();
  const ids=new Set(families.map(x=>x.id));
  if(!ids.has(selectedSculptEncounterFamilyId))
    selectedSculptEncounterFamilyId=ids.has(surface.baseTerrainFamilyId)
      ?surface.baseTerrainFamilyId:families[0]?.id??'';
  const select=$('sculpt-encounter-family');
  // Labels can change in the official World Builder; do not rely only on length.
  if(select.options.length!==families.length||
      [...select.options].some((option,i)=>option.value!==families[i].id||option.text!==families[i].label))
    select.replaceChildren(...families.map(x=>new Option(x.label,x.id)));
  select.value=selectedSculptEncounterFamilyId;
  const familyTemplate=$('sculpt-family-template');
  if(familyTemplate){
    const before=familyTemplate.value||'forest';
    familyTemplate.replaceChildren(...families.map(x=>new Option(x.label,x.id)));
    familyTemplate.value=ids.has(before)?before:(ids.has('forest')?'forest':families[0]?.id??'');
    const createButton=$('sculpt-family-create');
    if(createButton)createButton.disabled=!sculptWorldDraft||!sculptWorldAreaMounted;
    $('sculpt-family-create-status').textContent=!sculptWorldDraft
      ?'Crée ou ouvre une carte dans World Builder pour enregistrer une nouvelle famille.'
      :!sculptWorldAreaMounted
        ?'Aucune carte 2,5D chargée : création indisponible.'
        :'Les familles appartiennent au monde actuel, pas à une image.';
  }
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
  if(!sculptEncounterCatalog){
    $('sculpt-encounter-catalog-summary').textContent=sculptEncounterSourceError
      ?'Rencontres indisponibles (Combat officiel requis) : '+sculptEncounterSourceError.message
      :'Rencontres indisponibles : source Combat non chargée';
    refreshSculptEncounterAuthoringStatus();
    return;
  }
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
      sculptEncounterConfig=normalizeTerrainFamilyEncounterConfig(updated.encounterConfig,sculptTerrainFamilies().map(f=>f.id));
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
  if(on&&sculptSettingsPanel)sculptSettingsPanel.open=false;
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
  $('sculpt-family-create')?.addEventListener('click',()=>{
    if(!sculptWorldDraft||!sculptWorldAreaMounted){
      status('Ouvre d’abord une carte 2,5D dans le World Builder.');return;
    }
    const name=$('sculpt-family-name').value.trim();
    const feedback=$('sculpt-family-create-status');
    if(!name){feedback.textContent='Indique un nom de famille.';return;}
    if(sculptTerrainFamilies().some(f=>f.label.toLocaleLowerCase()===name.toLocaleLowerCase())){
      feedback.textContent='Cette famille existe déjà. Sélectionne-la dans la liste.';return;
    }
    if(sculptTerrainFamilies().length>=64){
      feedback.textContent='Limite de 64 familles dans ce monde.';return;
    }
    const oldIds=new Set(sculptTerrainFamilies().map(f=>f.id));
    const sourceId=$('sculpt-family-template').value;
    const source=sculptEncounterConfig.families.find(f=>f.terrainFamilyId===sourceId);
    const chance=Math.max(0,Math.min(100,Number($('sculpt-family-chance').value)||0));
    // The encounter pane may contain unsaved edits to existing families.
    // Apply the Builder command to the current canonical encounter draft,
    // never overwrite those edits with sculptWorldDraft's older snapshot.
    let next=addTerrainFamilyDefinition({
      ...sculptWorldDraft,encounterConfig:sculptEncounterConfig
    },{label:name,paintKind:$('sculpt-family-kind').value});
    const created=next.terrainFamilies.find(f=>!oldIds.has(f.id));
    if(!created){feedback.textContent='Création impossible, aucune famille ajoutée.';return;}
    // Reuse the canonical Builder commands: no parallel encounter table.
    for(const element of source?.elementChances??[])
      next=updateTerrainFamilyElementChance(next,created.id,element.elementId,element.chancePercent);
    // Preserve the entered percentage. Without elements, the existing
    // validator asks for a selection instead of silently setting it to 0.
    next=updateTerrainFamilyEncounterProfile(next,created.id,{
      encounterChancePercent:chance
    });
    sculptWorldDraft=next;
    sculptEncounterConfig=normalizeTerrainFamilyEncounterConfig(
      next.encounterConfig,next.terrainFamilies.map(f=>f.id));
    selectedSculptEncounterFamilyId=created.id;
    refreshSculptTerrainFamilySelectors();
    if(surfacePaintFamilySelect){
      surfacePaintFamilySelect.value=created.id;
      sculptPaintFamilyManuallyChosen=true;
    }
    refreshSculptEncounterEditor();
    $('sculpt-family-name').value='';
    feedback.textContent='Famille « '+created.label+' » ajoutée.'+
      (source?.elementChances?.some(e=>e.chancePercent>0)
        ?' Éléments du modèle repris.':' Choisis au moins un élément pour activer les rencontres.')+
      ' Elle est disponible dans le monde actuel.';
    status('Famille '+created.label+' ajoutée au World Builder · configure les rencontres puis enregistre le monde.');
  });
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
    sculptEncounterConfig=normalizeTerrainFamilyEncounterConfig(updated.encounterConfig,sculptTerrainFamilies().map(f=>f.id));
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
  // Jouer may only spawn from the scoped Bestiary with an active Core host.
  if(sculptPlayRequested&&(!scopedEncounter?.armed||scopedEncounter.party.active.hp===0))return null;
  if(!sculptEncounterController||!sculptEncounterCatalog||!navigationTesting||!navActor||sculptPendingEncounter)
    return null;
  const area=navigationEncounterArea();
  const intent=sculptEncounterController.step({
    area,player:{currentAreaId:area.id,x:navActor.x,y:navActor.y},
    encounterConfig:sculptEncounterConfig,
    captureCatalog:sculptEncounterCatalog,
    playerPartyRef:scopedEncounter?.party.partyRef??sculptPreviewPartyRef,rulesetId:'capture.standard.1v1',
    random:sculptEncounterRandom
  });
  if(!intent)return null;
  return presentSculptEncounter(snapshotFromEncounterIntent(intent, {
    combatArenaIds:sculptBattleArenaIds(area)
  }));
}
function sculptBattleArenaIds(area){
  const interior = activeInteriorId && sculptInteriors.find(entry => entry.area.id === area.id);
  const host = interior ? {
    building: outsideAreaSnapshot?.objects.find(object => object.id === interior.buildingId),
    exteriorArea: {encounters:sculptExteriorEncounters}
  } : undefined;
  return worldCombatArenaIdsV1(sculptWorldDraft, area, host);
}
function presentSculptEncounter(snapshot,recovered=false){
  sculptPendingEncounter=snapshot;
  $('sculpt-encounter-continue').hidden=recovered;
  navActor.moving=false;
  navKeys.clear();navStick?.reset();
  const creatureId=sculptPendingEncounter.opponents[0].creatureId;
  // Prewarm only the two real author-selected creature portraits while the
  // player reads the encounter dialog. No gameplay change or visual fallback.
  void sculptCombatWarmup.warmCreature(creatureId,scopedEncounter?.party?.active?.speciesId??null);
  const creature=sculptEncounterCatalog.resolveCreature(creatureId);
  const trainerId=snapshot.context.trainerActorId;
  const title=trainerId?'Combat de dresseur':'Rencontre sauvage !';
  if($('sculpt-encounter-title'))$('sculpt-encounter-title').textContent=title;
  sculptEncounterDialog.setAttribute('aria-label',title);
  $('sculpt-encounter-summary').textContent=trainerId
    ?(placedActors.find(actor=>actor.id===trainerId)?.npc?.name||'Dresseur')+
      ' · '+snapshot.opponents.length+' créature(s)'
    :(creature?.name??creatureId)+' · '+snapshot.context.terrainFamilyId+
      ' · élément '+snapshot.context.elementId;
  if($('sculpt-encounter-wild-hint'))$('sculpt-encounter-wild-hint').hidden=Boolean(trainerId);
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
function restoreSculptEncounterPosition(envelope){
  const area=navigationEncounterArea();
  const restored=resolveExplorationCombatReturn({
    envelope,worldDocument:{areas:[area]}
  });
  const point={...navActor,x:restored.x,y:restored.y};
  if(sculptPlayActive&&isBlocked(navigationWorld(),point,point.x,point.y,undefined,navigationContext()))
    throw Error('Position de retour du combat bloquée');
  navActor.x=restored.x;navActor.y=restored.y;navActor.moving=false;
  navVisualLevel=navHeight();
  zoom=navigationCameraZoom();
  $('zoom').value=String(Math.round(zoom*100));
  centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
}
function finishSculptEncounter(envelope){
  if(!releaseSculptEncounter())return;
  updateNpcInteraction();
  queueMicrotask(()=>{if(navigationTesting)explorationSoundtrack.resume();});
  status('Combat terminé : '+envelope.result.outcome+' · exploration reprise');
}
async function commitScopedSculptEncounter(envelope){
  const response=await requestAdventureCombatHostV1(window.frameElement,sculptCombatSessionId,'commit');
  const receipt=response?.receipt;
  const key=envelope.snapshot.encounterId+':'+envelope.snapshot.returnToken;
  if(receipt?.persisted!==true||receipt.session?.sessionId!==sculptCombatSessionId||
     !receipt.session.processedEncounterKeys?.includes(key))
    throw Error('Le Core Aventure n’a pas confirmé ce combat');
  const party=readScopedAdventurePlayingPartyV1(scopedEncounter.context);
  if(!party)throw Error('Équipe Aventure non actualisée');
  restoreSculptEncounterPosition(envelope);
  if(!persistPlayNavigationCheckpoint())throw Error('Position de retour non enregistrée');
  scopedEncounter.party=party;
  return receipt;
}
const sculptEncounterHost=sculptEncounterController?createImmersiveEncounterHostV1({
  windowRef:window,documentRef:document,storage:sculptCombatStorage,
  sessionId:sculptCombatSessionId,
  onCompleted(envelope){
    if(!sculptPendingEncounter||
       envelope.snapshot.encounterId!==sculptPendingEncounter.encounterId||
       envelope.snapshot.returnToken!==sculptPendingEncounter.returnToken)return false;
    if(scopedEncounter)return commitScopedSculptEncounter(envelope);
    restoreSculptEncounterPosition(envelope);
    return true;
  },
  onAcknowledged:finishSculptEncounter,
  onFailure(error){status('Combat conservé pour la reprise : '+error.message);}
}):null;

function launchSculptEncounter(){
  if(!sculptPendingEncounter||sculptEncounterHost.active)return;
  if(scopedEncounter&&!persistPlayNavigationCheckpoint())return;
  explorationSoundtrack.pause(); // Battle owns the music while its iframe is active.
  const player={currentAreaId:navigationEncounterArea().id,x:navActor.x,y:navActor.y};
  try{
    launchCombatHandoffNavigation({
      snapshot:sculptPendingEncounter,player,
      storage:sculptCombatStorage,documentUrl:document.URL,sessionId:sculptCombatSessionId,
      navigate(url){
        if(scopedEncounter)$('sculpt-encounter-continue').hidden=true;
        sculptEncounterHost.open({url,snapshot:sculptPendingEncounter});
      }
    });
  }catch(error){
    explorationSoundtrack.resume();
    status('Combat indisponible : '+error.message);
  }
}
if(sculptEncounterDialog){
  $('sculpt-encounter-combat').addEventListener('click',launchSculptEncounter);
  $('sculpt-encounter-continue').addEventListener('click',()=>{
    if(!sculptEncounterHost.active&&!$('sculpt-encounter-continue').hidden)releaseSculptEncounter();
  });
}
window.__sculptEncounterProbe=()=>Object.freeze({
  supported:!!sculptEncounterController,
  testing:navigationTesting,
  playPublishedCount:sculptPlayPublishedCount,
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
const navSpeed=()=>Math.max(90,Math.min(360,Number($('navigation-speed').value)||
  (sculptPlayRequested?90:220)));
let navViewport=null,navLastState='',navBlocked=false,navBlockReason=null;
let navFps=0,navRenderFps=0,navStepSpeed=0,navMetricLast=0;
let navMetricFrames=0,navPaintFrames=0,navMetricDistance=0;
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
// V1 preview owns only disposable visual options. Canonical WorldArea geometry,
// encounters, collisions, and saves remain unchanged until separately validated.
const sculptBorderPreviewByArea=new Map();
const sculptBorderControlsAvailable=!!$('scenery-border-enabled')&&
  !!$('scenery-border-biome')&&!!$('scenery-border-side')&&
  !!$('scenery-border-style')&&!!$('scenery-border-density')&&
  !!$('scenery-border-density-value')&&!!$('scenery-border-regenerate');
let sculptBorderUiAreaKey=null;
function sculptBorderAreaKey(){return sculptWorldAreaId??'unlinked-preview';}
function sculptBorderConfig(){
  const key=sculptBorderAreaKey();
  if(!sculptBorderPreviewByArea.has(key))
    sculptBorderPreviewByArea.set(key,normalizeSculptBorderPreview());
  const settings=sculptBorderPreviewByArea.get(key);
  const biome=resolveSculptBorderBiome(settings.biome,surface?.baseTerrainFamilyId);
  const terrainSignature=terrain.width+'x'+terrain.height+'-'+terrain.levels.slice(0,8).join(',');
  return {...settings,biome,mapKey:key==='unlinked-preview'?terrainSignature:key};
}
function updateSculptBorderPreview(update){
  const key=sculptBorderAreaKey();
  const original=sculptBorderPreviewByArea.get(key)??normalizeSculptBorderPreview();
  sculptBorderPreviewByArea.set(key,normalizeSculptBorderPreview(update(original)));
  navSkyCache=null;
  scheduleDraw();
}
function syncSculptBorderControls(){
  if(!sculptBorderControlsAvailable)return;
  const key=sculptBorderAreaKey(),settings=sculptBorderPreviewByArea.get(key)??normalizeSculptBorderPreview();
  const side=$('scenery-border-side').value||'front';
  const selected=settings.sides[side]??settings.sides.front;
  $('scenery-border-enabled').checked=settings.enabled;
  $('scenery-border-biome').value=settings.biome;
  $('scenery-border-style').value=selected.style;
  $('scenery-border-density').value=String(selected.density);
  $('scenery-border-density-value').textContent=selected.density+' %';
  sculptBorderUiAreaKey=key;
}
window.__sculptBorderPreviewProbe=()=>Object.freeze({
  areaKey:sculptBorderAreaKey(),config:sculptBorderConfig(),
  editorOnly:true,visualOnly:true,available:sculptBorderControlsAvailable
});
// Background only. Cache by actual viewport + sky options, not by character
// position or frame: stars/clouds never allocate a new canvas each movement.
function navigationSkyBackdrop(width,height){
  const time=$('navigation-sky-time').value;
  const clouds=$('navigation-sky-clouds').checked;
  const mist=$('navigation-sky-mist').checked;
  const stars=$('navigation-sky-stars').checked;
  const border=sculptBorderConfig();
  const isExterior=sculptBorderControlsAvailable&&
    !activeInteriorId&&!sculptWorldCurrentInterior();
  const key=[Math.ceil(width),Math.ceil(height),time,clouds,mist,stars,
    isExterior,border.mapKey,JSON.stringify(border)].join('|');
  if(navSkyCache?.key===key)return navSkyCache;
  const scale=Math.min(1.5,Math.max(1,window.devicePixelRatio||1));
  const image=document.createElement('canvas');
  image.width=Math.ceil(width*scale);image.height=Math.ceil(height*scale);
  const imageCtx=image.getContext('2d',{alpha:false});
  imageCtx.setTransform(scale,0,0,scale,0,0);
  const stats=drawSculptSkyBackdrop(imageCtx,{width,height,time,clouds,mist,stars});
  if(isExterior)drawSculptDistantBorders(imageCtx,{width,height,config:border,mapKey:border.mapKey});
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
    navTerrainCache.paintSurface===surface&&
    navTerrainCache.fringePresent===Boolean(decorativeFringe);
  if(same)return navTerrainCache;
  const paddingX=18,paddingY=SCULPT_TERRAIN_MAX_LEVEL*SCULPT_TILE.rise+18;
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
    paintSurface:surface,paintImages:surfacePaintImages,
    drawOuterSouthRim:false});
  // Pre-#468 paint order: cache one native terrain raster, then draw
  // objects/actors normally. Never build an extra cliff alpha overlay.
  terrainRasterBuilds++;
  navTerrainCache={terrain,texture:currentTexture,signature,
    waterTexture:ribbonTextures.water?.texture,roadTexture:ribbonTextures.road?.texture,
    paintSurface:surface,fringePresent:Boolean(decorativeFringe),image:raster,scale,paddingX,paddingY,result};
  return navTerrainCache;
}
const demoActorImage=new Image(),demoActorAsset=resolveMapActorAsset('actor.demo.hero.traveler.01');
let navigationActorVisual=normalizeMapActorVisual({
  assetId:'actor.demo.hero.traveler.01',role:'hero',targetHeight:37,
  motion:{idleAmplitude:.55,idleFrequency:.8,walkAmplitude:2.0,walkFrequency:3.8}
});
const demoNavigationActorPreparer=createMapActorVisualPreparer({imageLoader:{
  get:id=>id===demoActorAsset?.id?demoActorImage:null
}});
let navigationActorPreparer=demoNavigationActorPreparer;
let navigationActorRenderer=createMapActorRenderer({preparedVisuals:navigationActorPreparer});
let authoredHeroMedia=null,sculptPlayHeroDefinitionId=null,sculptPlayHeroDisplayName=null;
// Remote participants use the SAME official MapActorRenderer, purely in
// memory. Their poses never enter local navigation, collisions or saves.
const explorationPeerRenderer=createMapActorRenderer({
 preparedVisuals:demoNavigationActorPreparer
});
const explorationPeerVisual=normalizeMapActorVisual({
 assetId:demoActorAsset?.id??null,role:'hero',targetHeight:37,
 motion:{idleAmplitude:.55,idleFrequency:.8,walkAmplitude:2,walkFrequency:3.8}
});
let sculptPeerProjection=null,explorationPeerPaints=0;
function acceptExplorationPeerSnapshot(event){
 if(!sculptPlayActive||!playOptions||!sculptPeerProjection)return;
 if(sculptPeerProjection.apply(event?.detail)){
  updatePeerInteraction();scheduleDraw();
 }
}


// The canonical UserHeroStore owns all image bytes. This adapter only
// switches the existing Map Actor Visual/Preparer/Renderer once every asset
// has been decoded. It never writes actor coordinates, locomotion or camera.
async function installAuthoredHeroMapActor(heroDefinitionId){
 const store=createUserHeroStoreV1();
 const definition=await store.get(heroDefinitionId);
 if(!definition)
  throw new Error('Héros sélectionné introuvable dans la bibliothèque locale : '+heroDefinitionId);
 const resolver=createUserHeroAssetResolverV1(definition);
 const loader=createImageAssetLoader({resolveAsset:resolver.resolve});
 let preparer=null;
 try{
  const ids=resolver.list().map(entry=>entry.id);
  const loaded=await loader.load(ids);
  if(loaded.ready!==ids.length)
   throw new Error('Images du héros sélectionné indisponibles : '+loaded.ready+'/'+ids.length);
  preparer=createMapActorVisualPreparer({imageLoader:loader});
  const prepared=preparer.prepare(ids,{
   preserveCanvas:definition.mapVisual.animation.mode==='frames'
  });
  if(prepared.ready!==ids.length)
   throw new Error('Sprites du héros non préparés : '+prepared.ready+'/'+ids.length);
  const renderer=createMapActorRenderer({preparedVisuals:preparer});
  // The switch is atomic. No fallback to a demo actor after selection.
  navigationActorVisual=definition.mapVisual;
  navigationActorPreparer=preparer;
  navigationActorRenderer=renderer;
  sculptPlayHeroDefinitionId=definition.id;
  authoredHeroMedia={resolver,loader,preparer};
  scheduleDraw();
 }catch(error){
  preparer?.dispose();
  loader.dispose();
  resolver.dispose();
  throw error;
 }
}
window.addEventListener('pagehide',()=>{
 const owned=authoredHeroMedia;
 authoredHeroMedia=null;
 if(owned){
  owned.preparer.dispose();
  owned.loader.dispose();
  owned.resolver.dispose();
 }
}, {once:true});
let navVisualTime=0,navLastVisualPaint=-Infinity;
if(demoActorAsset){
  demoActorImage.onload=()=>{
    demoNavigationActorPreparer.prepare([demoActorAsset.id]);scheduleDraw();
  };
  demoActorImage.src=demoActorAsset.path;
}

const ribbonTextures={water:null,road:null};
// The legacy visual road belongs to the example only, not blank scene data.
let exampleRoadEnabled=true;
let waterMaterialRevision=0,groundMaterialRevision=0;
// V76 R5: source material artwork from the existing Material Registry.
const sphereWallImages={grass:null,earth:null};
let sphereTexturesLoaded=0;
// Single canonical exterior selection projected from the existing paint catalog.
const sculptGroundMaterials=Object.freeze(SCULPT_SURFACE_MATERIALS
  .filter(meta=>meta.kind==='zone'&&!meta.id.startsWith('floor.'))
  .map(meta=>meta.id));
const sculptWaterMaterials=Object.freeze(['water.clear_blue','water.turquoise',
  'water.forest_stream','water.swamp']);
const images=new Map();
const themes=sculptGroundMaterials;
const interiorFloorMaterials=Object.freeze(SCULPT_SURFACE_MATERIALS.filter(meta=>
  meta.id.startsWith('floor.')).map(meta=>meta.id));
const sculptWorldCurrentInterior=()=>sculptWorldDraft?.areas.find(a=>a.id===sculptWorldAreaId)?.kind==='interior';
// The two mutually exclusive views project ONE canonical material catalog.
const worldInteriorFloorBase=$('world-interior-floor-base');
// Frozen V80 ships the same Sculpt source without this new DOM node.
if(worldInteriorFloorBase)worldInteriorFloorBase.replaceChildren(...[...$('interior-floor-base').options]
  .map(option=>option.cloneNode(true)));
const displayedBaseMaterialId=()=>activeInteriorId||sculptWorldCurrentInterior()?
  $('interior-floor-base').value:surface.baseMaterialId;
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
  const texture=await imageFor(id);
  if(revision!==groundMaterialRevision)return;
  currentTexture=texture;
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
  const view=cameraView(),coreW=terrain.width*SCULPT_TILE.width,
    coreH=terrain.height*SCULPT_TILE.height;
  // Camera follows the same playable hero. Decorative display is north-only;
  // south and lateral camera limits remain at the playable terrain boundary.
  const coreBounds=sculptCameraBounds(view,coreW,coreH,16*SCULPT_TILE.rise);
  if(navigationTesting){
    const followingExterior=!!navActor&&!activeInteriorId&&!sculptWorldCurrentInterior();
    const visibleBounds=followingExterior?sculptExteriorSouthEdgeAtActorV1({
      bounds:coreBounds,view,coreWidth:coreW,coreHeight:coreH,
      actorX:navActor.x
    }):coreBounds;
    return decorativeFringe&&followingExterior
      ?sculptExteriorFringeCameraBoundsV1({
        coreBounds:visibleBounds,view,coreWidth:coreW,coreHeight:coreH,
        fringeRows:8,tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height,
        viewportHeight:dimensions().height,zoom,skyFraction:.12
      })
      :visibleBounds;
  }
  if(!visualDecorativeFringe()||activeInteriorId||sculptWorldCurrentInterior())
    return coreBounds;
  // Editor frames BOTH editable vertical skirts. They are WorldArea-owned
  // decorative cells, not an enlargement of gameplay, Spawn or collision.
  const skirt=8*SCULPT_TILE.height;
  const northY=Math.min(
    sculptCameraProject(view,0,-skirt-16*SCULPT_TILE.rise).y,
    sculptCameraProject(view,coreW,-skirt-16*SCULPT_TILE.rise).y
  );
  const southY=Math.max(
    sculptCameraProject(view,0,coreH+skirt).y,
    sculptCameraProject(view,coreW,coreH+skirt).y
  );
  const minY=Math.min(coreBounds.minY,northY);
  const maxY=Math.max(coreBounds.maxY,southY);
  return {...coreBounds,minY,maxY,height:maxY-minY};
}
function clampSculptEditorCamera(){
 if(navigationTesting||activeInteriorId||sculptWorldCurrentInterior())return;
 const {width,height}=dimensions();
 const next=clampSculptNavigationCameraToTerrainV1({
   pan,bounds:cameraBounds(),zoom,width,height
 });
 pan.x=next.x;pan.y=next.y;
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
  pan={x:Math.round((width-bounds.width*zoom)/2-bounds.minX*zoom),
    y:Math.round((height-bounds.height*zoom)/2-bounds.minY*zoom)};
}
// Render with the existing Sculpt terrain renderer. Chunk rasters cache static
// background relief; no extra per-frame terrain engine or gameplay collision.
function decorativeFringeRaster(chunk){
  const key=chunk.col+':'+chunk.row;
  const signature=[$('rock').value,displayedBaseMaterialId(),
    cliffAtlasReady,cliffHDLoaded,!!$('rock-moss')?.checked].join('|');
  const previous=fringeRasterCache.get(key);
  if(previous?.terrain===chunk.terrain&&previous.paintSurface===chunk.surface&&
     previous.sourceSurface===surface&&previous.texture===currentTexture&&
     previous.signature===signature)return previous;
  // Only an unpainted decorative chunk inherits the nearest saved WorldSurface
  // texture visually. Explicit authored fringe texture is never overwritten.
  const fringePaintSurface=sculptFringeResolvedPaintSurfaceV1(chunk.surface,surface,{
    col:chunk.col,row:chunk.row,columns:terrain.width,rows:terrain.height,
    tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height
  });
  const paddingX=18,paddingY=16*SCULPT_TILE.rise+18;
  const scale=Math.min(1.5,Math.max(1,window.devicePixelRatio||1));
  const image=document.createElement('canvas');
  image.width=Math.ceil((8*SCULPT_TILE.width+2*paddingX)*scale);
  image.height=Math.ceil((8*SCULPT_TILE.height+paddingY+48)*scale);
  const context=image.getContext('2d',{alpha:true});
  context.setTransform(scale,0,0,scale,0,0);
  context.translate(paddingX,paddingY);
  drawSculptTerrain(context,{terrain:chunk.terrain,
    material:registry.require(displayedBaseMaterialId(),'surface'),
    texture:currentTexture,rockPalette:$('rock').value,
    cliffAtlas:cliffAtlasImage,cliffHD:cliffHDImage,
    cliffMoss:$('rock-moss')?.checked,
    sphereWallImages,overlays:ribbonTextures,
    paintSurface:fringePaintSurface,paintImages:surfacePaintImages,
    drawOuterSouthRim:false});
  const raster={terrain:chunk.terrain,paintSurface:chunk.surface,sourceSurface:surface,
    texture:currentTexture,signature,
    image,scale,paddingX,paddingY};
  fringeRasterCache.set(key,raster);
  return raster;
}
function drawEditorPlayableLimit(){
  // Projection-only marker: no second boundary, no changes to saved terrain,
  // encounter placement, hero collisions or runtime overlays.
  if(navigationTesting||!decorativeFringe||!fringeEditing||activeInteriorId||
     sculptWorldCurrentInterior())return;
  const outline=sculptPlayableBoundaryOutlineV1(terrain,{
    tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height,
    rise:SCULPT_TILE.rise,heightAt:sculptHeightAt
  });
  ctx.save();
  ctx.lineJoin='round';
  ctx.lineCap='round';
  ctx.beginPath();
  outline.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));
  ctx.closePath();
  // Strong dark underlay remains legible on snow and light textures.
  ctx.setLineDash([]);
  ctx.strokeStyle='rgba(18,34,44,.92)';
  ctx.lineWidth=5/Math.max(.32,zoom);ctx.stroke();
  ctx.setLineDash([9/Math.max(.32,zoom),6/Math.max(.32,zoom)]);
  ctx.strokeStyle='#ffe39c';
  ctx.lineWidth=2.8/Math.max(.32,zoom);ctx.stroke();
  ctx.restore();
}
function drawDecorativeFringeTerrain(){
  const fringe=visualDecorativeFringe();
  if(!fringe)return;
  const view=cameraView(),margin=8;
  ctx.save();
  // Show both north and south skirts, using the SAME saved decorative chunks.
  // Clip before rendering: side chunks and overlap with playable terrain
  // never paint over the canonical ground, even on non-8-aligned maps.
  if(navigationTesting)ctx.transform(1,view.shear,0,view.pitch,0,0);
  ctx.beginPath();
  ctx.rect(0,-margin*SCULPT_TILE.height,
    terrain.width*SCULPT_TILE.width,margin*SCULPT_TILE.height);
  ctx.rect(0,terrain.height*SCULPT_TILE.height,
    terrain.width*SCULPT_TILE.width,margin*SCULPT_TILE.height);
  ctx.clip();
  for(const chunk of fringe.chunks){
    if(chunk.col<0||chunk.col>=terrain.width||
       !(chunk.row<0||chunk.row+8>terrain.height))continue;
    const raster=decorativeFringeRaster(chunk);
    ctx.drawImage(raster.image,
      chunk.col*SCULPT_TILE.width-raster.paddingX,
      chunk.row*SCULPT_TILE.height-raster.paddingY,
      raster.image.width/raster.scale,raster.image.height/raster.scale);
  }
  ctx.restore();
}
function drawDecorativeFringeObjects(layer='back'){
  const fringe=visualDecorativeFringe();
  if(!fringe)return;
  const view=cameraView();
  const objects=resolveWorldObjectPlacements(fringe.objects,objectDefinitionCatalogV1)
    .filter(o=>(layer==='front'
      ?o.transform.y>=terrain.height*SCULPT_TILE.height:o.transform.y<0)&&
      o.transform.x>=0&&o.transform.x<terrain.width*SCULPT_TILE.width)
    .sort((a,b)=>a.transform.y-b.transform.y);
  for(const object of objects){
    const col=Math.floor(object.transform.x/SCULPT_TILE.width/8)*8;
    const row=Math.floor(object.transform.y/SCULPT_TILE.height/8)*8;
    const chunk=fringe.chunks.find(c=>c.col===col&&c.row===row);
    if(!chunk)continue;
    const x=col*SCULPT_TILE.width,y=row*SCULPT_TILE.height;
    const local={...object,transform:{...object.transform,
      x:object.transform.x-x,y:object.transform.y-y}};
    ctx.save();
    if(navigationTesting){
      const point=sculptCameraProject(view,x,y);
      ctx.translate(point.x,point.y);
    }else ctx.translate(x,y);
    drawPreviewObject(local,{visualTerrain:chunk.terrain,decorative:true});
    ctx.restore();
  }
}
let previewObjectViewport=null;
function draw(){
  framePending=false;
  if(sculptBorderUiAreaKey!==sculptBorderAreaKey())syncSculptBorderControls();
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
  const view=cameraView();
  // The upper strip is reserved for the actual sky/time-of-day renderer.
  // Decorative land MUST NOT paint over the entire frame when the camera
  // follows a hero close to a WorldArea edge or on a small landscape screen.
  if(sculptBorderControlsAvailable&&navigationTesting&&
     !activeInteriorId&&!sculptWorldCurrentInterior()){
    const border=sculptBorderConfig();
    ctx.save();
    const skySafetyBand=Math.min(24,height*.05);
    ctx.beginPath();ctx.rect(0,skySafetyBand,width,height-skySafetyBand);ctx.clip();
    ctx.translate(pan.x,pan.y);ctx.scale(zoom,zoom);
    ctx.transform(1,view.shear,0,view.pitch,0,0);
    drawSculptBorderExtension(ctx,{terrain,tile:SCULPT_TILE,config:border,mapKey:border.mapKey});
    ctx.restore();
  }
  ctx.translate(pan.x,pan.y);ctx.scale(zoom,zoom);
  // Conservative culling uses the presentation camera only. Saved placements,
  // collisions, picking and WorldArea documents remain unchanged.
  previewObjectViewport={minX:-pan.x/zoom,maxX:(width-pan.x)/zoom,
    minY:-pan.y/zoom,maxY:(height-pan.y)/zoom};
  // Editor keeps the published V38 exact inverse pointer projection. In
  // Tester, project only the background texture, not standing actor sprites.
  if(!navigationTesting)ctx.transform(1,view.shear,0,view.pitch,0,0);
  drawDecorativeFringeTerrain();
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
      sphereWallImages,overlays:ribbonTextures,paintSurface:surface,paintImages:surfacePaintImages,
      drawOuterSouthRim:false});
  }
  lastRenderStats=result;
  // North decoration belongs behind the playable scene. South trees have
  // a foot below every playable hero and must be composited in front.
  drawDecorativeFringeObjects('back');
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
      stairPortals:interiorConnectorPortals()
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
    drawExplorationPeerActors(navActor?.y??Infinity);
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
    drawExplorationPeerActors(Infinity,navActor?.y??Infinity);
  }else{
    drawPreviewObjects();
    drawPlacedActors();
  }
  // The southern NON-COLLIDING decoration is the foreground of the SAME
  // WorldArea. Composite it after hero/objects so trees do not sink behind
  // the playable scene. No saved Y position, mask or collision is changed.
  drawDecorativeFringeObjects('front');
  // Author-approved rollback: the terrain has already been fully painted.
  // Keep the original object/actor Y-order above it (before PR #468).
  // No later cliff-mask replay may cut a tree, building or the hero.
  drawEditorPlayableLimit();
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
  if(navigationTesting)navPaintFrames++; // Real Canvas paints (not RAF movement ticks).
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
function scheduleDraw(){
  if(!sculptBootReady)return; // The single boot boundary, not a retry loop.
  if(!framePending){framePending=true;requestAnimationFrame(draw);}
}
function screenToWorldPoint(event){
  const rect=canvas.getBoundingClientRect();
  // One inverse shared by brush picking and object drag; drag itself NEVER
  // snaps to a painted cell or subtracts an invented height offset.
  return sculptCameraScreenToWorld(cameraView(),{
    screenX:event.clientX-rect.left,screenY:event.clientY-rect.top,pan,zoom});
}
function decorativeFringeArea(){
  return {width:terrain.width*SCULPT_TILE.width,
    height:terrain.height*SCULPT_TILE.height,sculptTerrain:terrain};
}
function visualDecorativeFringe(){
  if(activeInteriorId||sculptWorldCurrentInterior())return null;
  if(decorativeFringe)return decorativeFringe;
  if(!sculptWorldDraft||!sculptWorldAreaMounted)return null;
  if(visualFringeTerrain!==terrain||visualFringeAreaId!==sculptWorldAreaId){
    visualFringeCache=createSculptDecorativeFringeV1(decorativeFringeArea());
    visualFringeTerrain=terrain;visualFringeAreaId=sculptWorldAreaId;
    fringeRasterCache.clear();
  }
  return visualFringeCache;
}
function decorativeFringeHeightAt(col,row){
  const patch=decorativeFringe?.chunks.find(p=>p.col===Math.floor(col/8)*8&&
    p.row===Math.floor(row/8)*8);
  return patch?sculptHeightAt(patch.terrain,col-patch.col,row-patch.row):2;
}
function screenToDecorativeFringeCell(event){
  if(!decorativeFringe||!fringeEditing)return null;
  const {x,y}=screenToWorldPoint(event),col=Math.floor(x/SCULPT_TILE.width);
  if(!Number.isFinite(col)||col< -8||col>=terrain.width+8)return null;
  const area=decorativeFringeArea();
  for(let row=terrain.height+7;row>=-8;row--){
    if(!sculptDecorativeFringeCellIsOuterV1(area,col,row))continue;
    const top=row*SCULPT_TILE.height-decorativeFringeHeightAt(col,row)*SCULPT_TILE.rise;
    if(y>=top&&y<=top+SCULPT_TILE.height)return {x:col,y:row};
  }
  const row=Math.floor(y/SCULPT_TILE.height);
  return sculptDecorativeFringeCellIsOuterV1(area,col,row)?{x:col,y:row}:null;
}
function recordDecorativeFringe(previous){
  if(JSON.stringify(previous)===JSON.stringify(decorativeFringe))return false;
  fringeHistory.push(previous);
  if(fringeHistory.length>40)fringeHistory.shift();
  fringeRedo=[];
  fringeRasterCache.clear();
  updateHistoryButtons();scheduleDraw();
  return true;
}
function paintDecorativeFringeCell(cell){
  const mode=selectedMode;
  if(!['raise','dig','flatten','smooth','plateau',
        'water-fill','water-rise','water-lower','water-erase','water-smooth'].includes(mode)){
    status('Décor extérieur : choisis un pinceau Terre ou Eau, sans pente ni sphère pour le moment.');
    return false;
  }
  const old=decorativeFringe;
  const target=mode.startsWith('water-')?Number($('water-target').value):
    mode==='plateau'?Number($('target').value):decorativeFringeHeightAt(cell.x,cell.y);
  decorativeFringe=paintSculptDecorativeFringeV1(old,decorativeFringeArea(),{
    col:cell.x,row:cell.y,mode,target,
    strength:Number($('strength').value),radius:Number($('radius').value),
    edgeSoftness:Number($('edge').value)/100,shape:$('brush-shape').value});
  fringeRasterCache.clear();scheduleDraw();
  return true;
}

function fringeSurfacePoint(cell){
 return {x:(cell.x+.5)*SCULPT_TILE.width,y:(cell.y+.5)*SCULPT_TILE.height};
}
function appendFringeSurfacePoint(cell){
 const gesture=fringeSurfaceGesture;
 if(!gesture||gesture.points.length>=512)return;
 const key=cell.x+','+cell.y;
 if(gesture.last===key)return;
 const [x,y]=gesture.last.split(',').map(Number);
 const steps=Math.max(1,Math.abs(cell.x-x),Math.abs(cell.y-y));
 for(let i=1;i<=steps&&gesture.points.length<512;i++){
   const candidate={x:Math.round(x+(cell.x-x)*i/steps),
     y:Math.round(y+(cell.y-y)*i/steps)};
   if(sculptDecorativeFringeCellIsOuterV1(decorativeFringeArea(),candidate.x,candidate.y))
     gesture.points.push(fringeSurfacePoint(candidate));
 }
 gesture.last=key;
}
function commitFringeSurface(points,erase=false){
 const before=decorativeFringe;
 const next=paintSculptDecorativeFringeSurfaceV1(before,decorativeFringeArea(),{
   points,materialId:$('surface-material').value,
   terrainFamilyId:surfacePaintFamilySelect?.value,
   width:Number($('surface-width').value)*SCULPT_TILE.width,erase
 });
 decorativeFringe=next;fringeRasterCache.clear();loadSurfacePaintAssets();
 if(recordDecorativeFringe(before))
   status('Texture décorative enregistrée hors zone jouable (aucune rencontre ou collision ajoutée)');
}
function handleDecorativeFringeObject(cell,event){
  const x=(cell.x+.5)*SCULPT_TILE.width,y=(cell.y+.5)*SCULPT_TILE.height;
  const before=decorativeFringe,action=$('object-action').value;
  if(action==='select'){
    const hit=findSculptPreviewObjectNear(before.objects,x,y);
    fringeObjectDrag=hit?{pointerId:event.pointerId,id:hit.id,
      start:screenToWorldPoint(event),origin:{...hit.transform},
      before,client:{x:event.clientX,y:event.clientY},active:false}:null;
    status(hit?'Objet décoratif sélectionné : glisse le doigt pour le déplacer':
      'Aucun objet décoratif à cet endroit');
    return;
  }
  if(action==='remove'){
    const hit=findSculptPreviewObjectNear(before.objects,x,y);
    if(hit)decorativeFringe=normalizeSculptDecorativeFringeV1({
      ...before,objects:removeSculptPreviewObject(before.objects,hit.id)
    },decorativeFringeArea());
    else status('Aucun décor à retirer dans la frange');
  }else if(action==='place'){
    const definitionId=$('object-definition').value;
    const candidate=appendSculptPreviewObject(before.objects,{
      definitionId,x,y,scale:Number($('object-scale').value)/100,
      rotationDeg:Number($('object-rotation').value),
      variantId:$('object-variant-wrap').hidden?null:$('object-variant').value
    });
    if(candidate.length>before.objects.length){
      decorativeFringe=normalizeSculptDecorativeFringeV1({
        ...before,objects:candidate
      },decorativeFringeArea());
    }else status('Décor indisponible ou limite des objets atteinte');
  }else status('Périphérie : passe en mode Poser ou Retirer pour ses décorations');
  if(recordDecorativeFringe(before))
    status('Décor hors carte mis à jour · la zone jouable reste inchangée');
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
  // Opening the corresponding workshop is purely presentational. The quick
  // toolbar and native terrain tools remain the ONLY command owners.
  const activeToolGroup=$(kind==='ground'?'ground-tools':'water-tools')
    .closest('.sculpt-tool-group');
  if(activeToolGroup)activeToolGroup.open=true;
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
  const limit=editorKind==='water'?10:SCULPT_TERRAIN_MAX_LEVEL;
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
  // In the embedded game, Capture owns the fullscreen top layer. This must
  // remain true after entering Combat and returning to the Exploration map.
  if(sculptPlayRequested&&window.frameElement){
    setImmersive(true);
    return;
  }
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
  const past=fringeEditing?fringeHistory:history;
  const future=fringeEditing?fringeRedo:redoHistory;
  $('undo').disabled=past.length===0;
  $('redo').disabled=future.length===0;
  $('undo').textContent='↶ Annuler ('+past.length+')';
  $('redo').textContent='↷ Rétablir ('+future.length+')';
}
function undo(){
  if(fringeEditing){
    if(!fringeHistory.length){status('Aucun décor extérieur à annuler');return;}
    fringeRedo.push(decorativeFringe);
    decorativeFringe=fringeHistory.pop();
    fringeRasterCache.clear();updateHistoryButtons();scheduleDraw();return;
  }
  if(!history.length){status('Aucune action à annuler');return;}
  redoHistory.push(terrain);terrain=history.pop();
  updateHistoryButtons();scheduleDraw();status('Dernière action annulée (sol / eau)');
}
function redo(){
  if(fringeEditing){
    if(!fringeRedo.length){status('Aucun décor extérieur à rétablir');return;}
    fringeHistory.push(decorativeFringe);
    decorativeFringe=fringeRedo.pop();
    fringeRasterCache.clear();updateHistoryButtons();scheduleDraw();return;
  }
  if(!redoHistory.length){status('Aucune action à rétablir');return;}
  history.push(terrain);terrain=redoHistory.pop();
  updateHistoryButtons();scheduleDraw();status('Action rétablie');
}
function begin(event){
  if(navigationTesting)return;
  if(event.button!==undefined&&event.button!==0)return;
  if(objectEditing&&!actorSubmode&&sculptWorldDraft&&!sculptWorldPortalPlacement){
    const point=screenToWorldPoint(event),marker=pickedVisibleWaypoint(point);
    if(marker){
      event.preventDefault();canvas.setPointerCapture(event.pointerId);
      selectedWaypointKey=waypointKey(marker);
      syncObjectWaypoints();
      const anchor=marker.kind==='exit'
        ?sculptWorldDraft.portals.find(p=>p.id===marker.portalId)?.trigger?.kind!=='point'
        :!!sculptWorldArea()?.spawns.find(p=>p.id===marker.spawnId)?.anchor;
      if(anchor){sculptWorldStatus('Ce point appartient à une porte : déplace le bâtiment ou sa porte.');return;}
      waypointDrag={pointerId:event.pointerId,key:selectedWaypointKey,
        marker,origin:{x:marker.x,y:marker.y},start:point,preview:null,
        client:{x:event.clientX,y:event.clientY},moved:false};
      scheduleDraw();return;
    }
  }
  if(fringeEditing){
    const cell=screenToDecorativeFringeCell(event);
    if(!cell)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    if(objectEditing){handleDecorativeFringeObject(cell,event);return;}
    if(surfaceEditing){
      if($('surface-action').value==='erase'){
        try{commitFringeSurface([fringeSurfacePoint(cell)],true)}
        catch(error){status(error.message)}
      }else fringeSurfaceGesture={pointerId:event.pointerId,
        points:[fringeSurfacePoint(cell)],last:cell.x+','+cell.y};
      return;
    }
    fringeGesture={pointerId:event.pointerId,last:cell.x+','+cell.y,before:decorativeFringe};
    paintDecorativeFringeCell(cell);
    return;
  }
  if(sculptWorldPortalPlacement){
    event.preventDefault();
    // Pick the exposed native terrain face, not the raw projected Y value:
    // high terrain would otherwise shift Spawn/Portal markers after touch.
    const cell=screenToCell(event);
    if(!cell){sculptWorldStatus('Touche un sol de la carte jouable.',true);return;}
    applySculptWorldPointerPlacement({x:(cell.x+.5)*SCULPT_TILE.width,
      y:(cell.y+.5)*SCULPT_TILE.height});
    return;
  }
  if((activeInteriorId||sculptWorldCurrentInterior())&&interiorConnectorMode){
    const point=screenToWorldPoint(event);
    if(!Number.isFinite(point.x)||!Number.isFinite(point.y))return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    interiorConnectorGesture={pointerId:event.pointerId,point};
    interiorConnectorPreview={id:$('interior-connector-link').value,...point};
    scheduleDraw();return;
  }
  if((activeInteriorId||sculptWorldCurrentInterior())&&interiorDoorMoving){
    const point=interiorDoorPointFromEvent(event);
    if(!point)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    interiorDoorGesture={pointerId:event.pointerId,point};
    interiorDoorPreview={...(currentSculptInterior()?.exitPortal??worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId)?.exit).trigger,...point};
    scheduleDraw();return;
  }
  if((activeInteriorId||sculptWorldCurrentInterior())&&interiorWallMode){
    const point=interiorWallPointFromEvent(event);
    if(!point)return;
    event.preventDefault();canvas.setPointerCapture(event.pointerId);
    if(interiorWallMode==='remove'){
      const area=currentInteriorArea();
      commitInteriorWalls(removeInteriorWallNear(area.walls,point.x,point.y,24/zoom));
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
  if(waypointDrag){
    if(event.pointerId!==waypointDrag.pointerId)return;
    const world=screenToWorldPoint(event),drag=waypointDrag;
    if(!Number.isFinite(world.x)||!Number.isFinite(world.y))return;
    if(!drag.moved&&Math.hypot(event.clientX-drag.client.x,
      event.clientY-drag.client.y)<4)return;
    drag.moved=true;
    drag.preview={x:Math.max(10,Math.min(terrain.width*SCULPT_TILE.width-10,
      drag.origin.x+world.x-drag.start.x)),
      y:Math.max(10,Math.min(terrain.height*SCULPT_TILE.height-10,
      drag.origin.y+world.y-drag.start.y))};
    scheduleDraw();return;
  }
  if(fringeEditing){
    if(fringeSurfaceGesture){
      if(fringeSurfaceGesture.pointerId!==event.pointerId)return;
      const cell=screenToDecorativeFringeCell(event);
      if(cell)appendFringeSurfacePoint(cell);
      return;
    }
    if(fringeObjectDrag){
      if(fringeObjectDrag.pointerId!==event.pointerId)return;
      const world=screenToWorldPoint(event),drag=fringeObjectDrag;
      if(!Number.isFinite(world.x)||!Number.isFinite(world.y))return;
      if(!drag.active&&Math.hypot(event.clientX-drag.client.x,
        event.clientY-drag.client.y)<4)return;
      const x=drag.origin.x+world.x-drag.start.x;
      const y=drag.origin.y+world.y-drag.start.y;
      if(!sculptDecorativeFringeCellIsOuterV1(decorativeFringeArea(),
        Math.floor(x/SCULPT_TILE.width),Math.floor(y/SCULPT_TILE.height)))return;
      try{
        const objects=updateSculptPreviewObject(decorativeFringe.objects,drag.id,{x,y});
        decorativeFringe=normalizeSculptDecorativeFringeV1({...decorativeFringe,objects},
          decorativeFringeArea());
        drag.active=true;scheduleDraw();
      }catch{ /* Invalid drag never moves a gameplay object. */ }
      return;
    }
    if(!fringeGesture||fringeGesture.pointerId!==event.pointerId)return;
    const cell=screenToDecorativeFringeCell(event);
    if(!cell)return;
    const key=cell.x+','+cell.y;
    if(key===fringeGesture.last)return;
    const [previousX,previousY]=fringeGesture.last.split(',').map(Number);
    const steps=Math.max(Math.abs(cell.x-previousX),Math.abs(cell.y-previousY));
    for(let i=1;i<=steps;i++){
      const next={x:Math.round(previousX+(cell.x-previousX)*i/steps),
        y:Math.round(previousY+(cell.y-previousY)*i/steps)};
      if(sculptDecorativeFringeCellIsOuterV1(decorativeFringeArea(),next.x,next.y))
        paintDecorativeFringeCell(next);
    }
    fringeGesture.last=key;
    return;
  }
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
        interiorDoorPreview={...(currentSculptInterior()?.exitPortal??worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId)?.exit).trigger,...point};
        scheduleDraw();}
    }
    return;
  }
  if((activeInteriorId||sculptWorldCurrentInterior())&&interiorWallMode){
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
  if(waypointDrag){
    if(event.pointerId!==waypointDrag.pointerId)return;
    const drag=waypointDrag;waypointDrag=null;
    if(drag.moved&&drag.preview&&event.type!=='pointercancel'&&
      event.type!=='lostpointercapture'){
      try{
        const point=validSculptWorldAuthoringPoint(drag.preview);
        if(drag.marker.kind==='exit')sculptWorldDraft=placeSculptWorldPortal(
          sculptWorldDraft,drag.marker.portalId,point);
        else sculptWorldDraft=placeSculptWorldSpawn(
          sculptWorldDraft,sculptWorldAreaId,drag.marker.spawnId,point);
        sculptWorldStatus('Repère déplacé et enregistré sur la carte.');
      }catch(error){sculptWorldStatus('Déplacement refusé : '+error.message,true);}
    }
    refreshSculptWorldPanel();scheduleDraw();return;
  }
  if(fringeSurfaceGesture){
    if(event.pointerId!==fringeSurfaceGesture.pointerId)return;
    const gesture=fringeSurfaceGesture;fringeSurfaceGesture=null;
    if(event.type!=='pointercancel'&&event.type!=='lostpointercapture'){
      try{commitFringeSurface(gesture.points)}catch(error){status(error.message)}
    }
    return;
  }
  if(fringeObjectDrag){
    if(event.pointerId!==fringeObjectDrag.pointerId)return;
    const drag=fringeObjectDrag;fringeObjectDrag=null;
    if(event.type==='pointercancel'||event.type==='lostpointercapture'){
      decorativeFringe=drag.before;fringeRasterCache.clear();scheduleDraw();
    }else if(drag.active&&recordDecorativeFringe(drag.before))
      status('Objet décoratif déplacé hors zone jouable');
    return;
  }
  if(fringeGesture){
    if(event.pointerId!==fringeGesture.pointerId)return;
    const before=fringeGesture.before;
    const cancelled=event.type==='pointercancel'||event.type==='lostpointercapture';
    fringeGesture=null;
    if(cancelled){decorativeFringe=before;fringeRasterCache.clear();scheduleDraw();}
    else if(recordDecorativeFringe(before))
      status('Pourtour sculpté · la carte accessible au héros est inchangée');
    return;
  }
  if(interiorConnectorGesture){
    const gesture=interiorConnectorGesture;
    if(event.pointerId!==gesture.pointerId)return;
    interiorConnectorGesture=null;interiorConnectorPreview=null;
    if(event.type!=='pointercancel'){
      try{
        if(sculptWorldCurrentInterior())sculptWorldDraft=
          changeWorldInteriorConnector(sculptWorldDraft,$('interior-connector-link').value,{
            x:gesture.point.x,y:gesture.point.y,
            assetId:$('interior-connector-asset').value,
            rotationDeg:Number($('interior-connector-rotation').value)});
        else sculptInteriors=updateSculptFloorConnector(sculptInteriors,{
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
      try{commitInteriorWalls(appendInteriorWall(currentInteriorArea().walls,
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
// Heightfield ramps are immutable until the terrain identity changes. Never
// allocate their projections in each 60 Hz movement/collision tick.
let navRampTerrain=null,navRampProjections=null;
function resolvedSculptTerrainRamps(){
  if(navRampTerrain!==terrain){
    navRampTerrain=terrain;
    navRampProjections=sculptTerrainRampProjections(terrain);
  }
  return navRampProjections;
}
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
      stairs:[...resolvedSculptStairs(),...resolvedSculptTerrainRamps()]}};
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
    [...resolvedSculptStairs(),...resolvedSculptTerrainRamps()],
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
    // Official WorldArea exteriors previously had unbounded follow, while
    // the simple Tester was clamped. One terrain projection now owns BOTH.
    // Keep interiors free for doorway and staircase camera composition.
    const next=activeInteriorId||sculptWorldCurrentInterior()
      ?follow
      :clampSculptNavigationCameraToTerrainV1({
        pan:follow,bounds:cameraBounds(),zoom,width,height
      });
    pan.x=next.x;pan.y=next.y;return;
  }
  const bounds=cameraBounds(),point=sculptCameraProject(cameraView(),
    navActor.x,navActor.y-(navVisualLevel??navHeight())*SCULPT_TILE.rise);
  const next=clampSculptNavigationCameraToTerrainV1({
    pan:{x:width*.5-point.x*zoom,y:height*.57-point.y*zoom},
    bounds,zoom,width,height
  });
  pan.x=next.x;pan.y=next.y;
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
        directionX:navActor.directionX??0,directionY:navActor.directionY??1,
        moving:navActor.moving,mapVisual:navigationActorVisual,
         visualScale:sculptAltitudeVisualState(navVisualLevel??navHeight()).heroScale}],
      timeSeconds:navVisualTime
    });
  // Display-only nameplate: the Exploration actor renderer still owns the
  // sprite, camera and world coordinates. The label never changes collision.
  if(sculptPlayHeroDisplayName){
    const visualScale=sculptAltitudeVisualState(navVisualLevel??navHeight()).heroScale;
    const name=sculptPlayHeroDisplayName;
    ctx.save();
    ctx.translate(projected.x,projected.y-navigationActorVisual.targetHeight*visualScale-7);
    ctx.scale(1/Math.max(.32,zoom),1/Math.max(.32,zoom));
    ctx.font='bold 13px system-ui,sans-serif';
    ctx.textAlign='center';ctx.textBaseline='bottom';
    // Readable above any biome without a gloomy opaque rectangle. The
    // native actor canvas owns this text; no DOM overlay or second renderer.
    ctx.lineJoin='round';ctx.lineWidth=3.5;
    ctx.strokeStyle='rgba(10,22,33,.9)';
    ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=3;
    ctx.strokeText(name,0,-3,320);
    ctx.shadowBlur=0;
    ctx.fillStyle='#e9fff8';ctx.fillText(name,0,-3,320);
    ctx.restore();
  }
}
// Same canonical canvas/render space for the nickname, kept separate from
// the position-only peer drawing contract and its historical regression guard.
function paintExplorationPeerName(actor){
 if(!actor.displayName)return;
 ctx.save();
 ctx.translate(actor.x,actor.y-actor.mapVisual.targetHeight*actor.visualScale-7);
 ctx.scale(1/Math.max(.32,zoom),1/Math.max(.32,zoom));
 ctx.font='bold 13px system-ui,sans-serif';
 ctx.textAlign='center';ctx.textBaseline='bottom';
 ctx.lineJoin='round';ctx.lineWidth=3.5;
 ctx.strokeStyle='#122b38';ctx.fillStyle='#e9fff8';
 ctx.strokeText(actor.displayName,0,-3,320);
 ctx.fillText(actor.displayName,0,-3,320);
 ctx.restore();
}
// Strictly a visual projection: never update navActor or the authored world.
function drawExplorationPeerActors(maxY=Infinity,minY=-Infinity){
 if(!sculptPlayActive||!sculptPeerProjection||!demoActorAsset||
    !demoNavigationActorPreparer.get(demoActorAsset.id))return;
 const actors=sculptPeerProjection.sampleForArea(sculptWorldAreaId)
  .filter(peer=>peer.y<maxY&&peer.y>=minY)
  .map(peer=>{
   const level=sculptHeightAt(terrain,
    Math.floor(peer.x/SCULPT_TILE.width),
    Math.floor(peer.y/SCULPT_TILE.height));
   const projected=sculptCameraProject(cameraView(),peer.x,
    peer.y-level*SCULPT_TILE.rise+3);
   const drawOffset=explorationPeerOverlapVisualOffsetV1({
    actorId:peer.actorId,remoteX:peer.x,remoteY:peer.y,
    localX:navActor?.x,localY:navActor?.y
   });
   return {x:projected.x+drawOffset.x,y:projected.y+drawOffset.y,
    facingX:peer.facingX,moving:peer.moving,
    directionX:peer.directionX,directionY:peer.directionY,
    mapVisual:explorationPeerVisual,
    visualScale:sculptAltitudeVisualState(level).heroScale,
    displayName:peer.displayName??null};
  });
 if(actors.length){
  explorationPeerRenderer.draw(ctx,{
   camera:{x:0,y:0},actors,timeSeconds:navVisualTime
  });
  // The SAME native canvas and camera draw the network player's name.
  // No second DOM avatar, NPC actor or collision authority is created.
  actors.forEach(paintExplorationPeerName);
  explorationPeerPaints+=actors.length;
 }
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
      locomotion:{modes:['ground']},facingX:1,directionX:0,directionY:1,moving:false};
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
      radius:5,locomotion:{modes:['ground']},facingX:1,directionX:0,directionY:1,moving:false};
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
let npcDialogueOpen=false,npcDialogueLines=[],npcDialogueIndex=0,npcDialogueMerchant=null,npcDialogueTrainer=null;
let npcDialogueAnchor=null;
// Every DOM widget follows the currently selected NPC via the EXISTING 2.5D
// camera projection; it never receives a second actor coordinate authority.
function placeNpcScreenUi(actor,element,{panel=false}={}){
 if(!actor||!element||!navigationTesting)return;
 const level=sculptNavigationSample(terrain,actor.x,actor.y,{
  cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height
 })?.level??0;
 const view=cameraView();
 const projected=sculptCameraProject(view,actor.x,
  actor.y-level*SCULPT_TILE.rise);
 const rect=element.getBoundingClientRect();
 const at=sculptNpcScreenUiPositionV1({
  projected,pan,zoom,canvasRect:canvas.getBoundingClientRect(),
  viewportWidth:window.innerWidth,viewportHeight:window.innerHeight,
  boxWidth:Math.max(1,rect.width||(panel?350:130)),
  boxHeight:Math.max(1,rect.height||(panel?180:42)),
  aboveGap:panel?22:50
 });
 element.style.left=at.left+'px';
 element.style.top=at.top+'px';
}
function placeActiveNpcDialog(){
 if(npcDialogueOpen&&npcDialogueAnchor)
  placeNpcScreenUi(npcDialogueAnchor,document.querySelector('.npc-dialogue-panel'),{panel:true});
}

let npcDialogueTrainerNotice='',navTrainerArrivalPending=false;
function closeNpcDialogue(){
  npcDialogueOpen=false;
  if($('npc-dialogue-overlay'))$('npc-dialogue-overlay').hidden=true;
  npcDialogueAnchor=null;
  npcDialogueLines=[];npcDialogueIndex=0;npcDialogueMerchant=null;
  npcDialogueTrainer=null;npcDialogueTrainerNotice='';
  if($('npc-dialogue-trade'))$('npc-dialogue-trade').hidden=true;
}
function sculptTrainerChallengeNotice(actor){
  const team=actor.npc.trainerRoster;
  if(!team?.length)return 'Ce dresseur n’a pas encore d’équipe.';
  if(sculptCombatSessionId!==undefined&&!scopedEncounter?.armed)
    return 'Ouvre le monde depuis Aventure pour utiliser l’équipe de cette partie.';
  if(scopedEncounter?.party.active.hp===0)return 'Ton combattant actif est K.O.';
  const areaId=activeInteriorId??sculptWorldAreaId;
  if(scopedEncounter?.party.trainerVictories?.some(entry=>entry.areaId===areaId&&entry.actorId===actor.id))
    return 'Tu as déjà battu ce dresseur.';
  if(!sculptEncounterCatalog)return 'Le bestiaire officiel est indisponible.';
  if(team.some(member=>!sculptEncounterCatalog.resolveCreature(member.creatureId)))
    return 'Une créature du dresseur est absente du bestiaire de cette partie.';
  return '';
}
function canChallengeSculptTrainer(actor){
  return actor.npc?.kind==='trainer'&&!sculptTrainerChallengeNotice(actor);
}
function startSculptTrainerBattle(actor){
  if(sculptPendingEncounter||sculptPortalLoading||!navActor||!canChallengeSculptTrainer(actor))return false;
  const area=navigationEncounterArea();
  const opponents=actor.npc.trainerRoster;
  const creature=sculptEncounterCatalog.resolveCreature(opponents[0].creatureId);
  const terrain=resolveTerrainFamilyAtPoint(area.surface,navActor.x,navActor.y);
  const snapshot=createCaptureEncounterSnapshot({
    ...newSculptEncounterIds(),source:'npc-trainer',trainerActorId:actor.id,opponents,
    ...(actor.npc.trainerReward?{trainerReward:actor.npc.trainerReward}:{}),
    ...(actor.npc.allowFlee===false?{fleeAllowed:false}:{}),
    playerPartyRef:scopedEncounter?.party.partyRef??sculptPreviewPartyRef,areaId:area.id,
    terrainFamilyId:terrain.terrainFamilyId??area.surface.baseTerrainFamilyId,
    elementId:creature.elements[0]??'neutral',rulesetId:'capture.standard.1v1',
    combatArenaIds:sculptBattleArenaIds(area)
  });
  if(!sculptEncounterController.restore(snapshot.encounterId))return false;
  presentSculptEncounter(snapshot);
  launchSculptEncounter();
  return true;
}
function startNearbyAggressiveTrainer(previous){
  if(sculptPortalLoading)return false;
  // The first movement after a spawn can already be within the trainer's range.
  const origin=navTrainerArrivalPending?null:previous;
  navTrainerArrivalPending=false;
  const trainer=nearestAggressiveTrainerV1(gameplayPlacedActors(),origin,navActor,canChallengeSculptTrainer);
  return trainer!==null&&startSculptTrainerBattle(trainer);
}
function nearbyNpcForDialogue(){
  return navigationTesting&&!sculptPendingEncounter&&navActor
    ?nearestDialogNpcV1(gameplayPlacedActors(),navActor,undefined,canChallengeSculptTrainer):null;
}
// Scoped player greeting. Official Navigation is the ONLY position authority.
// This is a cosmetic interaction, not a duel, reward or world-state mutation.
function nearestExplorationPeerForGreeting(){
 if(!sculptPlayActive||!sculptPeerProjection||!navActor)return null;
 return sculptPeerProjection.forArea(sculptWorldAreaId)
  .filter(peer=>Math.hypot(peer.x-navActor.x,peer.y-navActor.y)<=70)
  .sort((a,b)=>Math.hypot(a.x-navActor.x,a.y-navActor.y)-
    Math.hypot(b.x-navActor.x,b.y-navActor.y))[0]??null;
}
function updatePeerInteraction(){
 const button=$('peer-greet');
 if(!button)return;
 const peer=nearestExplorationPeerForGreeting();
 button.hidden=!peer||npcDialogueOpen;
 if(!button.hidden){
  button.textContent='👋 Saluer '+(peer.displayName??'le joueur');
  button.setAttribute('aria-label','Saluer le joueur '+(peer.displayName??'proche'));
  placeNpcScreenUi(peer,button);
 }
}
// Only this official Exploration frame can paint in-game greeting feedback.
// No persistent notification, second chat history or shared save mutation.
let peerGreetingNoticeTimer=null;
function onCapturePeerGreetingReceived(event){
 if(!sculptPlayActive||event?.detail?.sessionId!==playOptions?.sessionId)return;
 const notice=$('peer-greet-notice');
 if(!notice)return;
 notice.textContent='👋 Un joueur te salue !';
 notice.hidden=false;
 if(peerGreetingNoticeTimer!==null)clearTimeout(peerGreetingNoticeTimer);
 peerGreetingNoticeTimer=setTimeout(()=>{
  notice.hidden=true;peerGreetingNoticeTimer=null;
 },2400);
}
window.addEventListener('gensrpg.exploration.play.peer-greeting-received.v1',
 onCapturePeerGreetingReceived);
window.addEventListener('pagehide',()=>{
 window.removeEventListener('gensrpg.exploration.play.peer-greeting-received.v1',
  onCapturePeerGreetingReceived);
 if(peerGreetingNoticeTimer!==null)clearTimeout(peerGreetingNoticeTimer);
},{once:true});

$('peer-greet')?.addEventListener('click',()=>{
 const peer=nearestExplorationPeerForGreeting();
 if(!peer||!playOptions?.sessionId||window.parent===window)return;
 // The parent Capture network owner will independently verify the room,
 // membership and target against its authenticated room transport.
 window.parent.postMessage({
  schema:'gensrpg.exploration.play.peer-greet.v1',
  sessionId:playOptions.sessionId,targetActorId:peer.actorId
 },window.location.origin);
});

function updateNpcInteraction(){
  // Legacy V80 does not expose the new dialogue overlay.
  if(!$('npc-talk'))return;
  const npc=nearbyNpcForDialogue();
  $('npc-talk').hidden=!npc||npcDialogueOpen;
  if(npc){
    const challenge=canChallengeSculptTrainer(npc)&&!npc.npc.dialogue;
    $('npc-talk').textContent=(challenge?'⚔ ':npc.npc.kind==='merchant'?'🛒 ':'💬 ')+
      (npc.npc.name||(challenge?'Défier':'Parler'));
    $('npc-talk').setAttribute('aria-label',challenge?'Défier '+(npc.npc.name||'le dresseur'):'Parler au PNJ proche');
    placeNpcScreenUi(npc,$('npc-talk'));
  }
}
function requestNpcMerchantShop(actor){
  if(!actor?.npc?.merchantId)return;
  if(!adventureSessionId||window.parent===window){
    status('Cette boutique est utilisable depuis une partie Monster Capture.');
    return;
  }
  window.parent.postMessage({
    schema:'gensrpg.exploration.npc.merchant.open.v1',
    sessionId:adventureSessionId,merchantId:actor.npc.merchantId,
    actorId:actor.id
  },window.location.origin);
}
$('npc-talk')?.addEventListener('click',()=>{
  const npc=nearbyNpcForDialogue();if(!npc)return;
  const canShop=npc.npc.kind==='merchant'&&!!npc.npc.merchantId;
  const trainer=npc.npc.kind==='trainer';
  npcDialogueTrainerNotice=trainer?sculptTrainerChallengeNotice(npc):'';
  const canChallenge=trainer&&!npcDialogueTrainerNotice;
  if(canShop&&!npc.npc.dialogue.trim()){
    requestNpcMerchantShop(npc);return;
  }
  npcDialogueLines=npc.npc.dialogue.split(/\r?\n/).map(t=>t.trim()).filter(Boolean);
  if(!npcDialogueLines.length&&!canChallenge)return;
  npcDialogueMerchant=canShop?npc:null;
  npcDialogueTrainer=canChallenge?npc:null;
  if($('npc-dialogue-trade'))$('npc-dialogue-trade').hidden=!canShop;
  npcDialogueIndex=0;npcDialogueOpen=true;npcDialogueAnchor=npc;
  $('npc-dialogue-speaker').textContent=npc.npc.name||'Personnage';
  renderNpcDialogueStep();
  $('npc-dialogue-overlay').hidden=false;
  placeActiveNpcDialog();updateNpcInteraction();
});
$('npc-dialogue-trade')?.addEventListener('click',()=>{
  const actor=npcDialogueMerchant;
  if(!actor||!npcDialogueOpen)return;
  closeNpcDialogue();requestNpcMerchantShop(actor);updateNpcInteraction();
});
function renderNpcDialogueStep(){
  const line=npcDialogueLines[npcDialogueIndex]??'';
  const hasNextLine=npcDialogueIndex<npcDialogueLines.length-1;
  const offersDuel=!hasNextLine&&npcDialogueTrainer!==null;
  $('npc-dialogue-text').textContent=line;
  $('npc-dialogue-text').hidden=!line;
  const notice=$('npc-dialogue-duel-offer');
  if(notice){
    notice.textContent=offersDuel?'Ce dresseur te propose un duel.':npcDialogueTrainerNotice;
    notice.hidden=hasNextLine||!notice.textContent;
  }
  $('npc-dialogue-next').textContent=hasNextLine?'Suivant':offersDuel?'Accepter le duel':'Terminer';
  $('npc-dialogue-close').textContent=offersDuel?'Refuser':'Fermer';
  if(npcDialogueOpen&&!$('npc-dialogue-overlay').hidden)
    requestAnimationFrame(placeActiveNpcDialog);
}
$('npc-dialogue-next')?.addEventListener('click',()=>{
  if(!npcDialogueOpen)return;
  npcDialogueIndex+=1;
  if(npcDialogueIndex>=npcDialogueLines.length){
    const trainer=npcDialogueTrainer;
    closeNpcDialogue();
    if(trainer)startSculptTrainerBattle(trainer);
    updateNpcInteraction();
    return;
  }
  renderNpcDialogueStep();
});
$('npc-dialogue-close')?.addEventListener('click',()=>{
  closeNpcDialogue();updateNpcInteraction();
});
window.addEventListener('resize',()=>{
 if(npcDialogueOpen)placeActiveNpcDialog();
 else if(navigationTesting)updateNpcInteraction();
});
function updateNavigationInfo(forced=false){
  if(!navigationTesting||!navActor)return;
  updateNpcInteraction();
  updatePeerInteraction();
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
  if(npcDialogueOpen){
    navPreviousTime=time;
    if(navActor)navActor.moving=false;
    navFrame=requestAnimationFrame(navigationTick);
    return;
  }
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
    // Reuse the hero's existing RAF and Movement/Collision World. Only the
    // transient projection moves; no interval, second physics or saved XY.
    if(npcWanderRuntime.count){
      npcWanderElapsed+=Math.min(250,elapsed)/1000;
      if(npcWanderElapsed>=.085){
        const npcChanged=npcWanderRuntime.step({
          actors:npcActorsWithDefinitions(),elapsedSeconds:npcWanderElapsed,
          world:navigationWorld(),collisionContext:navigationContext(),player:navActor
        });
        npcWanderElapsed=0;
        if(npcChanged){
          updateNpcInteraction();scheduleDraw();
          // A mobile aggressive trainer may enter the hero's radius even
          // while the hero is standing still. Use the EXISTING trainer gate.
          const mobile=gameplayPlacedActors().filter(a=>a.npc?.movement?.mode==='wander');
          const near=nearestAggressiveTrainerV1(
            mobile,null,navActor,canChallengeSculptTrainer);
          if(near&&near.id!==npcWanderAggressiveNearId&&
             startSculptTrainerBattle(near))npcWanderAggressiveNearId=near.id;
          else if(!near)npcWanderAggressiveNearId=null;
        }
      }
    }
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
      if(navActor.moving){
        navActor.directionX=intent.x;
        navActor.directionY=intent.y;
      }
      if(sculptPlayActive&&moved>.001&&time-playLastCheckpointAt>(playOptions?.sessionId?120:1500)){
        persistPlayNavigationCheckpoint();playLastCheckpointAt=time;
      }
      // Trigger only from canonical post-collision hero coordinates.
      // No dice roll from materials, pixels, or pre-collision input.
      if(!navActor.moving||!startNearbyAggressiveTrainer({x:previousX,y:previousY}))sculptEncounterStep();
      // Camera tracks x/y and the smoothed altitude after the movement loop.
      updateNavigationInfo();
    }else if(navActor.moving){
      navActor.moving=false;
      // Persist final official post-collision pose when controls are released.
      if(sculptPlayActive&&playOptions?.sessionId&&persistPlayNavigationCheckpoint())
       playLastCheckpointAt=time;
      scheduleDraw();
    }
    const previousVisualLevel=navVisualLevel;
    navVisualLevel=sculptVisualHeightStep(navVisualLevel,navHeight(),elapsed);
    // Smooth only the pictured elevation and vertical follow, never collision.
    if(Math.hypot(intent.x,intent.y)>.13 ||
       Math.abs(navVisualLevel-previousVisualLevel)>.0001)
      centerNavigationCamera();
    // Camera and walking are painted with the browser's display RAF clock;
    // scheduleDraw() coalesces concurrent requests into one Canvas paint.
    // Only idle remains lower-rate for portable devices.
    if(shouldPaintSculptNavigationFrame({
      moving:navActor.moving,
      altitudeChanging:Math.abs(navVisualLevel-previousVisualLevel)>.0001,
      elapsedSincePaintMs:time-navLastVisualPaint
    })||sculptPeerProjection?.isAnimating(sculptWorldAreaId,time)){
      navLastVisualPaint=time;scheduleDraw();
    }
    if(!navMetricLast)navMetricLast=time;
    if(time-navMetricLast>=900){
      const elapsedSec=(time-navMetricLast)/1000;
      navFps=Math.round(navMetricFrames/elapsedSec);
      navRenderFps=Math.round(navPaintFrames/elapsedSec);
      navStepSpeed=Math.round(navMetricDistance/elapsedSec);
      $('navigation-metrics').textContent='Rendu '+navRenderFps+' FPS · Calcul '+
        navFps+' FPS · '+navStepSpeed+' unités/s réelles'+
        (navBlocked?' · obstacle':'');
      navMetricFrames=0;navPaintFrames=0;navMetricDistance=0;navMetricLast=time;
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
  if(on&&!sculptPlayActive&&sculptWorldDraft&&!sculptEncounterSetupOffered&&
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
    fringeEditing=false;fringeGesture=null;
    if($('scenery-fringe-toggle'))$('scenery-fringe-toggle').checked=false;
    if($('scenery-fringe-panel'))$('scenery-fringe-panel').hidden=true;
    if(interiorConnectorMode)setInteriorConnectorMode(false);
    if(interiorWallMode)setInteriorWallMode(null);
    if(interiorDoorMoving)setInteriorDoorMoving(false);
    if(objectEditing)setObjectEditing(false); // keep object palette out of the walking HUD
    if(surfaceEditing)setSurfaceEditing(false);
    navActor=navigationSpawn();
    if(!navActor){status('Aucune case sèche disponible pour le test');return;}
    navigationTesting=true;
    npcWanderRuntime.reset(npcActorsWithDefinitions());npcWanderElapsed=0;
    npcWanderAggressiveNearId=null;
    navTrainerArrivalPending=true;
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
    navTerrainCache=null;navFps=0;navRenderFps=0;navStepSpeed=0;
    navVisualLevel=navHeight();
    navVisualTime=0;navLastVisualPaint=-Infinity;
    navMetricLast=0;navMetricFrames=0;navPaintFrames=0;navMetricDistance=0;
    navInputElapsedMs=0;
    $('navigation-metrics').textContent='Mesure de fluidité en cours…';
    centerNavigationCamera();
    updatePrecisionActions();updateNavigationInfo(true);
    // Legacy Tester has no Adventure Core receipt. Recover its exact
    // single pending handoff instead of overwriting it with a new encounter;
    // in Aventure, ONLY GenSRPG Core may acknowledge a persisted result.
    let testerHandoffRecovered=false;
    if(!sculptPlayRequested&&sculptEncounterController){
      try{
        const pending=readCombatHandoff(sculptCombatStorage);
        if(pending?.result){
          if(!consumeCombatResult(sculptCombatStorage))
            throw Error('Résultat du test non acquittable');
          status('Résultat du précédent test retrouvé et acquitté (sans récompense Aventure).');
        }else if(pending){
          if(pending.snapshot.context.areaId===navigationEncounterArea().id&&
             sculptEncounterController.restore(pending.snapshot.encounterId)){
            presentSculptEncounter(pending.snapshot,true);
            testerHandoffRecovered=true;
            status('Combat interrompu retrouvé : relance le même combat, aucune donnée effacée.');
          }else{
            testerHandoffRecovered=true;
            status('Combat interrompu dans une autre zone. Rouvre sa carte pour le reprendre.');
          }
        }
      }catch(error){
        testerHandoffRecovered=true;
        status('Journal Combat conservé, reprise nécessaire : '+error.message);
      }
    }
    if(!testerHandoffRecovered)sculptEncounterController?.resetAnchor();
    if(!testerHandoffRecovered)sculptEncounterStep(); // seed only after recovery
    navPreviousTime=null;navFrame=requestAnimationFrame(navigationTick);
    status(sculptWorldDraft
      ?'Test de navigation : approche du cercle SORTIE puis appuie sur « 🚪 Entrer » pour changer de zone.'
      :'Test de navigation : joystick à maintenir · vitesse réglable dans la palette de droite.');
  }else{
    if($('scenery-fringe-panel'))$('scenery-fringe-panel').hidden=
      !sculptWorldDraft||sculptPlayRequested||!!activeInteriorId||!!sculptWorldCurrentInterior();
    if(sculptEncounterHost?.active)return; // Combat owns the overlay until completion
    releaseSculptEncounter();
    sculptEncounterController?.resetAnchor();
    navigationTesting=false;
    npcWanderRuntime.reset();npcWanderElapsed=0;
    npcWanderAggressiveNearId=null;
    closeNpcDialogue();
    if($('npc-talk'))$('npc-talk').hidden=true;
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
if(sculptBorderControlsAvailable){
for(const id of ['scenery-border-enabled','scenery-border-biome']){
  $(id).addEventListener('change',()=>{
    updateSculptBorderPreview(current=>({
      ...current,
      enabled:$('scenery-border-enabled').checked,
      biome:$('scenery-border-biome').value
    }));
  });
}
$('scenery-border-side').addEventListener('change',syncSculptBorderControls);
for(const id of ['scenery-border-style','scenery-border-density']){
  $(id).addEventListener(id==='scenery-border-density'?'input':'change',()=>{
    const side=$('scenery-border-side').value;
    updateSculptBorderPreview(current=>({...current,sides:{
      ...current.sides,[side]:{
        ...current.sides[side],style:$('scenery-border-style').value,
        density:Number($('scenery-border-density').value)
      }
    }}));
    syncSculptBorderControls();
  });
}
$('scenery-border-regenerate').addEventListener('click',()=>{
  const side=$('scenery-border-side').value;
  updateSculptBorderPreview(current=>({...current,sides:{
    ...current.sides,[side]:{...current.sides[side],
      revision:current.sides[side].revision+1}
  }}));
  status('Nouvelle variante du décor '+side+' (test visuel, non sauvegardé).');
});
syncSculptBorderControls();
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
  // Do not allow a player's synthetic input to override the creator's angle.
  if(sculptCreatorCameraAngle!==null)
    $('navigation-camera-angle').value=String(sculptCreatorCameraAngle);
  $('navigation-camera-angle-value').textContent=$('navigation-camera-angle').value+'°'+
    (sculptCreatorCameraAngle!==null?' · créateur':'');
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
  navTrainerArrivalPending=true;
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
  speed:navSpeed(),zoom,fps:navFps,renderFps:navRenderFps,
  actualSpeed:navStepSpeed,
  inputElapsedMs:navInputElapsedMs,
  terrainCached:!!navTerrainCache,joystickAttached:!!navStick,activeFrames:navFrame>0,
  actorMotion:navActor?.moving?'walk':'idle',
  deckBridgeId:activeSculptBridge()?.id??null,
  stairId:navActor?.sculptStairId??null,stairHeight:navActor?navHeight():null,
  inclineKind:navActor?.sculptStairId
    ?[...resolvedSculptStairs(),...resolvedSculptTerrainRamps()]
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
  const renderActors=gameplayPlacedActors().filter(p=>p.y<maxY&&p.y>=minY)
    .map(p=>{
      const view=createPlacedMapActorView(p,captureActorProvider.resolveDefinition);
      return view?{...view,moving:p.moving===true}:null;
    })
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
function drawPreviewObject(object,{foregroundRailOnly=false,visualTerrain=terrain,decorative=false}={}){
  // V77: the ramp is terrain, not a bitmap billboard. Draw its quad in the
  // shared world projection, including its genuine rise from foot to head.
  if(object.kind==='ramp'){
    drawSculptRamp(ctx,object,visualTerrain,{
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
  const rect=sculptObjectVisualRect(object,visualTerrain,{
    tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height,rise:SCULPT_TILE.rise});
  const {width,height}=rect;
  const artShift=sculptBridgeDeckArtShift(rect,object);
  const point=navigationTesting?sculptCameraProject(cameraView(),rect.x,rect.y):rect;
  const projection=cameraView();
  const visiblePoint=navigationTesting?point:{
    x:rect.x,y:projection.shear*rect.x+projection.pitch*rect.y
  };
  const radius=Math.hypot(width,height)*(2+Math.abs(projection.shear))+Math.abs(artShift);
  const viewport=previewObjectViewport;
  // Decorative placements are converted to chunk-local coordinates for
  // their native terrain height. The viewport is WORLD-global: culling the
  // local position here incorrectly removes valid border trees on mobile.
  if(viewport&&!decorative&&
    (visiblePoint.x+radius<viewport.minX||visiblePoint.x-radius>viewport.maxX||
     visiblePoint.y+radius<viewport.minY||visiblePoint.y-radius>viewport.maxY))return;
  // Native drawing (pre-#468): no upper-cap clipping of WorldObjects.
  ctx.save();
  ctx.translate(point.x,point.y);
  // V78 R2: a stair is sloping GROUND, not an upright billboard.
  // The preview terrain already uses this exact camera matrix; match it
  // locally in Tester while leaving bridges, rails and buildings untouched.
  // Face keeps its validated V78 terrain projection. Oblique and side
  // variants are already drawn in perspective: applying another pitch makes
  // their real step axis diverge from the authored collision corridor.
  const perspectiveStairArt=Number.isFinite(rect.stairArtFootOffsetX);
  if(navigationTesting&&object.kind==='stairs'&&!perspectiveStairArt){
    const view=cameraView();
    ctx.transform(1,view.shear,0,view.pitch,0,0);
  }
  ctx.rotate(rect.angle);
  // Same mirror affects the existing image and silhouette shadow.
  ctx.scale(object.transform?.flipX===true?-1:1,1);
  // One WorldObject foot for image, shadows, hit testing and Collision World.
  if(perspectiveStairArt)ctx.translate(-rect.stairArtFootOffsetX,
    rect.stairArtFootOffsetY);
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
  // Contact shadows are drawn at the grounded WorldObject foot by the same
  // visual renderer, before the image. No phantom collision or second decal.
  // Foreground rails must never stamp an extra shadow on top of the actor.
  const waterfallArt=resolveWorldObjectAsset(object.visual?.assetId);
  const visualAssetId=object.visual?.assetId;
  const modelShadow=worldObjectShadowProfileForAssetV1(currentWorldShadowProfiles(),visualAssetId);
  const inspecting=objectEditing&&$('object-shadow-details')&&objectSelectedId;
  const sameModel=inspecting&&$('object-shadow-scope').value==='model'&&
    visualAssetId===selectedShadowVisualAssetId();
  // The unsaved model form previews immediately across identical assets
  // while pre-existing individual exceptions remain visually authoritative.
  const sharedShadow=sameModel&&!object.shadow?readSelectedObjectShadowControlsV1():
    object.shadow??modelShadow;
  // The old selected-object path remains the sole explicit visual override.
  if(!foregroundRailOnly)drawWorldObjectContactShadowV1(ctx,{
    kind:object.kind,width,height,footOffset:artShift,
    pitch:navigationTesting?cameraView().pitch:1,image:art,asset:waterfallArt,
    shadow:objectEditing&&objectSelectedId===object.id&&$('object-shadow-details')?
      ($('object-shadow-scope').value==='object'?
        readSelectedObjectShadowControlsV1():sharedShadow):sharedShadow
  });
  // Artwork's wooden deck is aligned to the canonical corridor center.
  // All camera pitches project that same WorldObject point.
  // Preserve exact historic bridge/static draw and its regression-tested order.
  if(waterfallArt?.animation)
    drawWorldObjectSprite(ctx,art,waterfallArt,
      {x:-width/2,y:-height+artShift,width,height},performance.now()/1000);
  else ctx.drawImage(art,-width/2,-height+artShift,width,height);
  if(!foregroundRailOnly&&objectEditing&&!decorative&&objectSelectedId===object.id){
    ctx.strokeStyle='#bdffe4';ctx.lineWidth=Math.max(1,2/Math.max(.5,zoom));
    ctx.setLineDash([7,4]);ctx.strokeRect(-width/2,-height+artShift,width,height);
  }
  ctx.restore();
}
// WorldArea / Sculpt scene is the ONLY object owner. Cache only derived
// depth order during play, and always recalculate live editor placements.
const sculptPlayObjectDrawCache=createSculptPlayObjectDrawCacheV1(
  placements=>resolveWorldObjectPlacements(placements,objectDefinitionCatalogV1));
function drawPreviewObjects(maxY=Infinity,minY=-Infinity,skipBridgeId=null,skipStairId=null){
  const objects=sculptPlayObjectDrawCache.get(placedObjects,{playing:navigationTesting});
  for(const object of objects){
    if(object.transform.y>maxY||object.transform.y<=minY||
       object.id===skipBridgeId||object.id===skipStairId)continue;
    drawPreviewObject(object);
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
function currentWorldShadowProfiles(){
 return sculptWorldDraft?(sculptWorldDraft.objectShadowProfiles??[]):sculptStandaloneShadowProfiles;
}
function selectedShadowVisualAssetId(){
 const selected=placedObjects.find(item=>item.id===objectSelectedId);
 if(!selected)return null;
 return resolveWorldObjectPlacements([selected],objectDefinitionCatalogV1)[0]?.visual?.assetId??null;
}
function changeWorldShadowProfiles(next){
 if(sculptWorldDraft){
   // The editor draft is the SAME world record written by the existing
   // WorldBuilder handoff. No per-map shadow table or storage key is created.
   sculptWorldDraft=createWorldBuilderDraft({...sculptWorldDraft,
     objectShadowProfiles:next});
 }else sculptStandaloneShadowProfiles=next;
 scheduleDraw();
}
function commitShadowModelProfile(rawShadow){
 const assetId=selectedShadowVisualAssetId();
 if(!assetId)return false;
 const before=currentWorldShadowProfiles();
 const next=setWorldObjectShadowProfileV1(before,assetId,rawShadow);
 if(JSON.stringify(next)===JSON.stringify(before))return false;
 shadowProfileHistory.push(before);
 if(shadowProfileHistory.length>40)shadowProfileHistory.shift();
 shadowProfileRedo=[];
 changeWorldShadowProfiles(next);
 refreshSelectedObjectShadowControlsV1(placedObjects.find(o=>o.id===objectSelectedId));
 return true;
}
function updateShadowModelHistoryButtons(){
 const model=$('object-shadow-scope')?.value==='model';
 $('object-shadow-profile-undo').hidden=!model;
 $('object-shadow-profile-redo').hidden=!model;
 $('object-shadow-profile-undo').disabled=!shadowProfileHistory.length;
 $('object-shadow-profile-redo').disabled=!shadowProfileRedo.length;
}
function readSelectedObjectShadowControlsV1(){
 if(!$('object-shadow-details')||$('object-shadow-mode').value!=='custom')return null;
 return normalizeWorldObjectShadowSettingsV1({
  mode:'custom',
  widthPct:Number($('object-shadow-width').value),
  heightPct:Number($('object-shadow-height').value),
  offsetXPct:Number($('object-shadow-x').value),
  offsetYPct:Number($('object-shadow-y').value),
  opacityPct:Number($('object-shadow-opacity').value)
 });
}
function refreshSelectedObjectShadowControlsV1(selected){
 const details=$('object-shadow-details');
 // V80 is a frozen legacy editor which intentionally has no new panel.
 if(!details)return;
 const kind=selected?objectDefinitionCatalogV1.get(selected.objectDefinitionId)?.kind:null;
 const allowed=!!selected&&!['bridge','stairs','ramp','waterfall','water','ground','portal'].includes(kind);
 details.hidden=!allowed;
 if(shadowControlsOwnerId!==selected?.id){
  details.open=false; // Collapse again on a different selected object.
  shadowControlsOwnerId=selected?.id??null;
  $('object-shadow-scope').value='object';
 }
 const model=$('object-shadow-scope').value==='model';
 const assetId=selectedShadowVisualAssetId();
 const modelValue=worldObjectShadowProfileForAssetV1(currentWorldShadowProfiles(),assetId);
 const shadow=model?modelValue:normalizeWorldObjectShadowSettingsV1(selected?.overrides?.shadow);
 const matches=assetId?placedObjects.filter(o=>
  resolveWorldObjectPlacements([o],objectDefinitionCatalogV1)[0]?.visual?.assetId===assetId):[];
 const exceptions=matches.filter(o=>!!o.overrides?.shadow).length;
 $('object-shadow-scope-info').textContent=model
  ?'Tous les objets de ce visuel dans le monde ('+matches.length+
    ' sur cette carte). '+(exceptions?exceptions+' exception(s) individuelles conservées.':
    'Les nouveaux objets identiques suivront aussi ce réglage.')
  :'Ce réglage reste propre à l’objet sélectionné. Le profil du modèle sert de valeur par défaut.';
 $('object-shadow-mode').value=shadow?'custom':'auto';
 for(const [control,key] of [
  ['width','widthPct'],['height','heightPct'],['x','offsetXPct'],
  ['y','offsetYPct'],['opacity','opacityPct']
 ]){
  const input=$('object-shadow-'+control);
  input.value=String((shadow??(!model?modelValue:null)??WORLD_OBJECT_SHADOW_DEFAULT_V1)[key]);
  $('object-shadow-'+control+'-value').textContent=input.value+' %';
 }
 $('object-shadow-fields').hidden=!shadow;
 $('object-shadow-summary').textContent=(model?'Modèle · ':'')+(shadow?'Personnalisée':(!model&&modelValue?'Héritée du modèle':'Auto'));
 updateShadowModelHistoryButtons();
}
function syncObjectSelectedControls(){
  const selected=placedObjects.find(o=>o.id===objectSelectedId);
  refreshSelectedObjectShadowControlsV1(selected);
  const selectedDef=selected?objectDefinitionCatalogV1.get(selected.objectDefinitionId):null;
  const buildingSelected=!!selected&&selectedDef?.kind==='building'&&!activeInteriorId;
  $('object-open-interior').hidden=!buildingSelected;
  $('object-interior-link').hidden=!buildingSelected;
  $('interior-house-link-info').hidden=!buildingSelected;
  if(buildingSelected){
    const linked=sculptWorldDraft
      ?sculptWorldDraft.portals.some(p=>p.sourceAreaId===sculptWorldAreaId&&
        p.trigger?.kind==='object-anchor'&&p.trigger.objectId===selected.id)
      :sculptInteriors.some(e=>e.buildingId===selected.id);
    $('object-open-interior').textContent=linked?'🏠 Modifier son intérieur lié':
      '🏠 Créer et lier un intérieur à cette maison';
    $('interior-house-link-info').textContent=linked?
      'Intérieur lié à la porte : un seul passage World Builder, sans deuxième réglage.':
      'Associe la porte sur cette carte : l’intérieur, le retour et les points d’arrivée seront enregistrés automatiquement dans World Builder.';
    // Legacy scene templates are for standalone Sculpt only. Never insert
    // their independent Portal graph into an authored world.
    $('object-interior-template').parentElement.hidden=!!sculptWorldDraft;
  }
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
  if($('object-flip-x'))$('object-flip-x').checked=selected.transform.flipX===true;
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
// A linked house remains a single WorldArea object, referenced by its
// canonical Portal trigger and possibly a destination Spawn. Removing it
// in Object authoring must be refused NOW, not one hour later on Save.
function worldLinkedBuildingWouldDisappear(next){
  if(!sculptWorldDraft||!sculptWorldAreaId)return null;
  const area=sculptWorldDraft.areas.find(a=>a.id===sculptWorldAreaId);
  const linkedIds=new Set([
    ...(sculptWorldDraft.portals??[])
      .filter(p=>p.sourceAreaId===sculptWorldAreaId&&p.trigger?.kind==='object-anchor')
      .map(p=>p.trigger.objectId),
    ...(area?.spawns??[])
      .filter(spawn=>spawn.anchor?.kind==='building-door')
      .map(spawn=>spawn.anchor.objectId)
  ]);
  if(!linkedIds.size)return null;
  const buildings=resolveWorldObjectPlacements(next,objectDefinitionCatalogV1)
    .filter(object=>object.kind==='building');
  return [...linkedIds].find(id=>!buildings.some(object=>object.id===id))??null;
}
function allowWorldLinkedObjects(next){
  const id=worldLinkedBuildingWouldDisappear(next);
  if(!id)return true;
  status('Objet conservé : ce bâtiment possède un passage ou une arrivée liée. '+
    'Supprime ou déplace d’abord le passage dans World Builder.');return false;
}
function objectCommit(next){
  if(next===placedObjects)return false;
  if(next.length===placedObjects.length&&next.every((o,i)=>o===placedObjects[i]))return false;
  if(!allowWorldLinkedObjects(next))return false;
  objectHistory.push(placedObjects);if(objectHistory.length>40)objectHistory.shift();
  objectRedo=[];placedObjects=next;updateObjectCount();return true;
}
// Surface authoring reuses WorldSurface v3; only this UI owns undo/redo.
function loadSurfacePaintAssets(){
  const used=new Set([...surface.routes,...surface.zones,
    ...(decorativeFringe?.chunks??[]).flatMap(chunk=>[
      ...(chunk.surface?.routes??[]),...(chunk.surface?.zones??[])
    ])].map(f=>f.materialId));
  // The outside rendering is visual only, but snow (or another semantic base)
  // needs the SAME existing texture even on legacy grass-backed WorldAreas.
  const edgeMaterials={snow:'ground.snow',sand:'ground.sand',
    mountain:'ground.mountain_rock',forest:'grass.forest',plain:'grass.forest'};
  if(edgeMaterials[surface.baseTerrainFamilyId])
    used.add(edgeMaterials[surface.baseTerrainFamilyId]);
  const pending=[];
  for(const meta of SCULPT_SURFACE_MATERIALS){
    if(!used.has(meta.id)||surfacePaintImages.has(meta.id))continue;
    pending.push(imageFor(meta.id,meta.assetKind).then(texture=>{
      if(!texture)return;
      surfacePaintImages.set(meta.id,texture);navTerrainCache=null;
      fringeRasterCache.clear();scheduleDraw();
    }));
  }
  // The map launch may await the exact existing surface image promises;
  // edits still use the same asynchronous image registry and cache.
  return Promise.all(pending);
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
  if(active&&sculptSettingsPanel)sculptSettingsPanel.open=false;
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
$('surface-material').addEventListener('change',()=>{
  // Suggest a family only before the author deliberately selects one.
  // Example: painting another grass texture must NOT erase "Haute herbe".
  const family=sculptEncounterFamilyForMaterial($('surface-material').value);
  if(!sculptPaintFamilyManuallyChosen&&family&&surfacePaintFamilySelect)
    surfacePaintFamilySelect.value=family;
});
$('surface-configure-encounters')?.addEventListener('click',()=>{
  setSculptEncounterEditorOpen(true);
});
$('surface-align-families')?.addEventListener('click',()=>{
  // Legacy authored maps are never rewritten at import. The user chooses an
  // undoable migration if visual snow/road and encounter family disagree.
  const aligned=alignSculptSurfaceEncounterFamilies(surface);
  if(surfaceCommit(aligned))
    status('Familles de rencontres alignées sur les textures · ↶ Texture pour annuler');
  else status('Les familles de rencontres correspondent déjà aux textures connues');
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
// NPCs and Capture assets share the existing renderer, never their databases.
function npcFrameReferences(def){
 const a=def.mapVisual.animation;
 return [def.mapVisual.assetId,...(a.mode==='frames'?[...a.idle,...a.walk]:
  a.mode==='directions'?Object.values(a.directions).flat():[])];
}
async function loadCaptureActorCatalog(){
 if(npcCatalogRefreshPending)return;
 npcCatalogRefreshPending=true;
 let newResolver=null,newLoader=null,newPreparer=null;
 try{
   let source=null,sourceError=null;
   try{source=await createCaptureActorPreviewProviderV1();}
   catch(error){sourceError=error;}
   const generic=demoActorAsset?Object.freeze({
     id:'exploration:npc:generic-v1',displayName:'PNJ générique (voyageur)',
     role:'npc',mapVisual:normalizeMapActorVisual({
       assetId:demoActorAsset.id,role:'npc',targetHeight:62})
   }):null;
   const authored=await authoredNpcStore.list();
   newResolver=createUserNpcAssetResolverV1(authored);
   const originalAssets=[...(source?.listAssets()??[]),...(generic?[demoActorAsset]:[])];
   const assets=Object.freeze([...originalAssets,...newResolver.list()]);
   const definitions=Object.freeze([...(source?.listDefinitions()??[]),
     ...(generic?[generic]:[]),...authored.map(record=>Object.freeze({
       ...record,displayName:record.name
     }))]);
   const byId=new Map(definitions.map(def=>[def.id,def]));
   const assetById=new Map(assets.map(asset=>[asset.id,asset]));
   const provider=Object.freeze({
     listAssets:()=>assets,listDefinitions:()=>definitions,
     resolveDefinition:id=>byId.get(id)??null,
     resolveAsset:id=>assetById.get(id)??null
   });
   newLoader=createImageAssetLoader({resolveAsset:createMapActorAssetResolver(assets)});
   const loaded=await newLoader.load(assets.map(asset=>asset.id));
   if(loaded.ready!==assets.length||loaded.missing||loaded.errors)
     throw Error('Images Capture/PNJ indisponibles : '+JSON.stringify(loaded));
   newPreparer=createMapActorVisualPreparer({imageLoader:newLoader});
   const prepared=newPreparer.prepare(originalAssets.map(a=>a.id));
   if(prepared.ready!==originalAssets.length||prepared.errors)
     throw Error('Préparation visuelle Capture impossible');
   for(const record of authored){
     const ids=npcFrameReferences(record);
     const result=newPreparer.prepare(ids,{
       preserveCanvas:record.mapVisual.animation.mode!=='image'
     });
     if(result.ready!==ids.length||result.errors)
       throw Error('Sprites du PNJ '+record.name+' non préparés');
   }
   const prior={resolver:npcMediaResolver,loader:captureActorImageLoader,
     preparer:captureActorPreparer};
   captureActorProvider=provider;
   captureActorRenderer=createMapActorRenderer({preparedVisuals:newPreparer});
   captureActorImageLoader=newLoader;
   captureActorPreparer=newPreparer;
   npcMediaResolver=newResolver;
   authoredNpcRecords=Object.freeze(authored);
   newResolver=null;newLoader=null;newPreparer=null;
   prior.preparer?.dispose();prior.loader?.dispose();prior.resolver?.dispose();
   // Selection is allowed to change while Capture/IndexedDB assets load.
   // Read the chosen definition at COMMIT time, not before the await chain:
   // otherwise a completed background refresh silently restores the generic
   // actor after the user picked an authored NPC from the visual gallery.
   const chosen=$('actor-definition').value;
   $('actor-definition').replaceChildren(...definitions.map(def=>{
     const opt=document.createElement('option');
     opt.value=def.id;opt.textContent=(def.displayName||def.id)+' · '+def.role;
     return opt;
   }));
   $('actor-definition').disabled=!definitions.length;
   if(definitions.some(def=>def.id===chosen))$('actor-definition').value=chosen;
   const missingNpcRefs=[...new Set(placedActors
     .filter(actor=>actor.actorDefinitionId.startsWith('npc.user.')&&
       !provider.resolveDefinition(actor.actorDefinitionId))
     .map(actor=>actor.actorDefinitionId))];
   $('actor-source-status').textContent=definitions.length+
     ' visuel(s) disponibles (Capture + PNJ Exploration)'+
     (sourceError?' · Capture indisponible : '+sourceError.message:'')+
     (missingNpcRefs.length?' · ⚠ '+missingNpcRefs.length+
      ' définition(s) PNJ absentes de cet appareil : importe leur fichier JSON depuis l’éditeur PNJ. Les placements restent conservés.':'');
   if(missingNpcRefs.length)console.warn('PNJ référencés mais non importés sur cet appareil',missingNpcRefs);
   syncActorViewAvailability();
   renderNpcLibraryGallery();
   scheduleDraw();
 }catch(error){
   $('actor-source-status').textContent='Catalogue indisponible : '+error.message;
   if(!captureActorProvider)$('actor-definition').disabled=true;
 }finally{
   newPreparer?.dispose();newLoader?.dispose();newResolver?.dispose();
   npcCatalogRefreshPending=false;
 }
}
function renderNpcLibraryGallery(){
 const grid=$('actor-npc-gallery');if(!grid)return;
 const filter=($('actor-npc-filter')?.value??'').toLocaleLowerCase('fr');
 grid.replaceChildren();
 const records=authoredNpcRecords.filter(def=>
   (def.name+' '+def.role).toLocaleLowerCase('fr').includes(filter));
 for(const def of records){
   const button=document.createElement('button');button.type='button';
   button.className='actor-npc-card';
   const image=document.createElement('img');
   image.src=npcMediaResolver.resolve(def.mapVisual.assetId).path;
   image.alt='Sprite de '+def.name;
   const title=document.createElement('strong');title.textContent=def.name;
   const caption=document.createElement('small');caption.textContent=def.role;
   button.append(image,title,caption);
   button.addEventListener('click',()=>{
     $('actor-definition').value=def.id;
     $('actor-action').value='place';
     actorSelectedId=null;
     syncActorViewAvailability();syncActorSelectedControls();
     $('actor-npc-library').close();
     status('PNJ '+def.name+' sélectionné. Touche la carte pour le placer.');
   });
   grid.append(button);
 }
 if(!records.length){
   const hint=document.createElement('p');
   hint.textContent=authoredNpcRecords.length?'Aucun PNJ correspondant.':
    'Bibliothèque vide : crée un PNJ dans l’éditeur dédié.';
   grid.append(hint);
 }
}
// Native embedded authoring view keeps the current WorldArea mounted. The
// iframe can request official catalog data only through the EXISTING Capture
// parent bridge; this handler is a narrow relay, never a catalog/store.
const npcWorkshopFrame=$('actor-npc-workshop-frame');
const npcWorkshop=$('actor-npc-workshop');
const npcWorkshopPending=new Map();
function openNpcWorkshop(id=null){
 npcWorkshopPending.clear();
 const url=new URL('./npc-editor.html',window.location.href);
 if(id)url.searchParams.set('edit',id);
 // The same selected universe follows the native Sculpt → NPC → Capture
 // chain, never falling back silently to the legacy global shop catalog.
 const universe=new URLSearchParams(window.location.search).get('universe');
 if(universe)url.searchParams.set('universe',universe);
 npcWorkshopFrame.src=url.href;
 if(!npcWorkshop.open)npcWorkshop.showModal();
}
function closeNpcWorkshop(){
 if(npcWorkshop.open)npcWorkshop.close();
 npcWorkshopPending.clear();
 npcWorkshopFrame.removeAttribute('src');
 void loadCaptureActorCatalog();
}
$('actor-npc-workshop-open')?.addEventListener('click',()=>openNpcWorkshop());
$('actor-npc-workshop-close')?.addEventListener('click',closeNpcWorkshop);
$('actor-npc-workshop')?.addEventListener('close',()=>{
 npcWorkshopPending.clear();
 npcWorkshopFrame.removeAttribute('src');
 void loadCaptureActorCatalog();
});
$('actor-npc-edit-definition')?.addEventListener('click',event=>{
 const selected=npcSelectedActor();
 if(selected?.actorDefinitionId.startsWith('npc.user.')){
  event.preventDefault();
  openNpcWorkshop(selected.actorDefinitionId);
 }
});
window.addEventListener('message',event=>{
 if(event.origin!==window.location.origin)return;
 const requestSchemas={
  'gensrpg.exploration.npc.merchant.catalog.request.v1':
    'gensrpg.capture.v2.npc.merchant.catalog.response.v1',
  'gensrpg.exploration.npc.reward.catalog.request.v1':
    'gensrpg.capture.v2.npc.reward.catalog.response.v1'
 };
 const id=event.data?.requestId;
 if(event.source===npcWorkshopFrame?.contentWindow){
  if(window.parent===window||!npcWorkshop.open||
    typeof id!=='string'||!/^[a-f0-9-]{36}$/.test(id))return;
  const reply=requestSchemas[event.data?.schema];
  if(!reply)return;
  npcWorkshopPending.set(id,reply);
  window.parent.postMessage(event.data,window.location.origin);
 }else if(event.source===window.parent&&window.parent!==window){
  if(typeof id!=='string'||npcWorkshopPending.get(id)!==event.data?.schema)return;
  npcWorkshopPending.delete(id);
  if(npcWorkshop.open)npcWorkshopFrame.contentWindow?.postMessage(event.data,window.location.origin);
 }
});

$('actor-npc-library-open')?.addEventListener('click',()=>{
 renderNpcLibraryGallery();$('actor-npc-library').showModal();
});
$('actor-npc-library-close')?.addEventListener('click',()=>$('actor-npc-library').close());
$('actor-npc-library-reload')?.addEventListener('click',()=>{void loadCaptureActorCatalog();});
$('actor-npc-filter')?.addEventListener('input',renderNpcLibraryGallery);
window.addEventListener('focus',()=>{
 if(actorSubmode&&!navigationTesting)void loadCaptureActorCatalog();
});
function syncActorViewAvailability(){
  const definition=captureActorProvider?.resolveDefinition($('actor-definition').value);
  const back=$('actor-view').querySelector('option[value="back"]');
  if(back)back.disabled=!definition?.mapVisualByView?.back;
  if(back?.disabled&&$('actor-view').value==='back')$('actor-view').value='front';
}
function npcSelectedActor(){
  return placedActors.find(actor=>actor.id===actorSelectedId)??null;
}
function npcCreatureName(creatureId){
  return npcOfficialCreatures.find(creature=>creature.id===creatureId)?.name??
    'Créature non trouvée dans le bestiaire officiel';
}
function npcMerchantPickerRefresh(){
  const picker=$('npc-merchant-picker');if(!picker)return;
  const npc=npcSelectedActor()?.npc,selected=npc?.merchantId??'';
  const found=npcMerchantChoices.some(shop=>shop.id===selected);
  picker.replaceChildren(new Option('Aucune boutique associée',''),
    ...npcMerchantChoices.map(shop=>new Option(shop.name,shop.id)));
  if(selected&&!found)
    picker.append(new Option('Boutique précédente indisponible (liaison conservée)',selected));
  picker.value=selected;
  picker.disabled=!npcSelectedActor()||!npcMerchantChoices.length;
  $('npc-merchant-clear').disabled=!npcSelectedActor()||!selected;
}
function npcRewardCatalogRefresh(){
 const picker=$('npc-reward-item');
 if(!picker)return;
 const selected=npcSelectedActor();
 const reward=selected?.npc?.trainerReward??{currency:0,items:[]};
 const kind=$('actor-npc-kind')?.value;
 const former=picker.value;
 picker.replaceChildren(new Option('Choisir un objet publié…',''),
  ...npcRewardChoices.map(item=>new Option(item.name,item.id)));
 if(npcRewardChoices.some(item=>item.id===former))picker.value=former;
 picker.disabled=!selected||kind!=='trainer'||!npcRewardChoices.length;
 $('npc-reward-add').disabled=picker.disabled;
 $('npc-reward-currency').value=String(reward.currency);
 $('npc-reward-currency').disabled=!selected||kind!=='trainer';
 const list=$('npc-reward-list');
 list.replaceChildren();
 for(const entry of reward.items){
  const found=npcRewardChoices.find(item=>item.id===entry.itemId);
  const row=document.createElement('div');row.className='npc-reward-row';
  const label=document.createElement('span');
  label.textContent=(found?.name??'Objet indisponible — référence conservée')+' ×'+entry.quantity;
  const remove=document.createElement('button');remove.type='button';
  remove.textContent='✕';remove.setAttribute('aria-label','Retirer la récompense objet');
  remove.disabled=!selected||kind!=='trainer';
  remove.addEventListener('click',()=>npcApplyAuthoringPatch({trainerReward:{
   currency:reward.currency,items:reward.items.filter(item=>item.itemId!==entry.itemId)
  }}));
  row.append(label,remove);list.append(row);
 }
 if(!reward.items.length){
  const note=document.createElement('small');note.textContent='Aucun objet offert par ce PNJ.';
  list.append(note);
 }
}
function requestNpcRewardCatalog(){
 if(!$('npc-reward-item'))return;
 if(window.parent===window){
  $('npc-reward-status').textContent='Ouvre cet éditeur depuis GenSRPG pour choisir un objet officiel.';
  return;
 }
 npcRewardRequestId=crypto.randomUUID();
 window.parent.postMessage({
  schema:'gensrpg.exploration.npc.reward.catalog.request.v1',
  requestId:npcRewardRequestId
 },window.location.origin);
 $('npc-reward-status').textContent='Lecture des objets depuis Monster Capture…';
}
function requestNpcMerchantCatalog(){
  if(!$('npc-merchant-picker'))return;
  if(window.parent===window){
    $('npc-merchant-status').textContent=
      'Ouvre cet éditeur depuis Monster Capture dans GenSRPG pour choisir une boutique.';
    return;
  }
  npcMerchantRequestId=crypto.randomUUID();
  window.parent.postMessage({
    schema:'gensrpg.exploration.npc.merchant.catalog.request.v1',
    requestId:npcMerchantRequestId
  },window.location.origin);
  $('npc-merchant-status').textContent='Lecture des marchands depuis Monster Capture…';
}
window.addEventListener('message',event=>{
  if(event.origin!==window.location.origin||event.source!==window.parent)return;
  if(event.data?.schema==='gensrpg.capture.v2.npc.merchant.catalog.response.v1'&&
     event.data.requestId===npcMerchantRequestId){
    npcMerchantRequestId=null;
    const incoming=event.data.merchants;
    npcMerchantChoices=Object.freeze(Array.isArray(incoming)?
      incoming.filter(shop=>typeof shop?.id==='string'&&
        /^[a-z0-9][a-z0-9_:.-]{0,119}$/i.test(shop.id)&&
        typeof shop.name==='string'&&shop.name.length>0&&shop.name.length<=80)
        .map(shop=>Object.freeze({id:shop.id,name:shop.name})):[]);
    $('npc-merchant-status').textContent=event.data.error
      ?'Catalogue indisponible : '+String(event.data.error).slice(0,150)
      :npcMerchantChoices.length+' marchand(s) disponibles depuis Monster Capture.';
    npcMerchantPickerRefresh();
  }
  if(event.data?.schema==='gensrpg.capture.v2.npc.reward.catalog.response.v1'&&
     npcRewardRequestId&&event.data.requestId===npcRewardRequestId){
    npcRewardRequestId=null;
    const incoming=event.data.items;
    npcRewardChoices=Object.freeze(Array.isArray(incoming)?
      incoming.filter(item=>typeof item?.id==='string'&&
        /^[a-z0-9][a-z0-9_:.-]{0,129}$/i.test(item.id)&&
        typeof item.name==='string'&&item.name.length>0&&item.name.length<=80)
        .map(item=>Object.freeze({id:item.id,name:item.name})):[]);
    const currency=typeof event.data.currencyLabel==='string'&&
      event.data.currencyLabel.length<=40?event.data.currencyLabel:'pièces';
    $('npc-reward-status').textContent=event.data.error
      ?'Objets indisponibles : '+String(event.data.error).slice(0,150)
      :npcRewardChoices.length+' objet(s) disponibles · monnaie : '+currency+'.';
    npcRewardCatalogRefresh();
  }
  if(event.data?.schema==='gensrpg.capture.v2.npc.merchant.open-ack.v1'&&
     event.data.sessionId===adventureSessionId){
    npcDialogueOpen=true;updateNpcInteraction();
  }
  if(event.data?.schema==='gensrpg.capture.v2.npc.merchant.closed.v1'&&
     event.data.sessionId===adventureSessionId){
    npcDialogueOpen=false;updateNpcInteraction();
  }
});
function npcSettingsFromControls(){
  // Old V80 has no NPC editor. Legacy external references are preserved in
  // exported WorldArea.actors, but never shown as editable technical IDs.
  if(!$('actor-npc-kind'))return null;
  const current=npcSelectedActor()?.npc??null;
  const kind=$('actor-npc-kind').value;
  const trainerEngagement=kind==='trainer'
    ?$('npc-trainer-engagement')?.value||current?.trainerEngagement:current?.trainerEngagement;
  const chosenWild=$('npc-wild-creature')?.value||current?.wildCreature?.creatureId;
  return {
    kind,name:$('actor-npc-name').value,
    movement:{mode:$('actor-npc-movement').value,
      radius:Number($('actor-npc-radius').value)},
    dialogue:$('actor-npc-dialogue').value,
    questId:current?.questId??'',
    trainerTeamId:current?.trainerTeamId??'',
    merchantId:current?.merchantId??'',
    ...(current?.trainerRoster?{trainerRoster:current.trainerRoster}:{}),
    ...(current?.trainerReward?{trainerReward:current.trainerReward}:{}),
    ...(trainerEngagement?{trainerEngagement}:{}),
    ...(kind==='trainer'?{allowFlee:$('npc-trainer-allow-flee')?.checked!==false}:
      current&&Object.hasOwn(current,'allowFlee')?{allowFlee:current.allowFlee}:{}),
    ...(chosenWild?{wildCreature:{creatureId:chosenWild,
      level:Number($('npc-wild-level')?.value??current?.wildCreature?.level??10)}}:{})
  };
}
function npcApplyAuthoringPatch(patch){
  const selected=npcSelectedActor();
  if(!selected||$('actor-action').value!=='select'){
    status('Place un PNJ, puis touche-le pour modifier sa fiche.');return;
  }
  try{editSelectedActor({npc:{...npcSettingsFromControls(),...patch}});}
  catch(error){status('Fiche PNJ non enregistrée : '+error.message);}
}
function closeNpcAuthoringDialog(){
  const dialog=$('npc-authoring-dialog');
  if(dialog?.open)dialog.close();
}
function openNpcAuthoringDialog(){
  const dialog=$('npc-authoring-dialog');
  if(!dialog||!npcSelectedActor()||$('actor-action').value!=='select')return;
  $('actor-npc-settings')?.setAttribute('open','');
  if(!dialog.open)dialog.showModal();
}
function npcRoleEditorRefresh(){
  // The shared Sculpt engine also boots on immutable V80.
  if(!$('npc-trainer-editor'))return;
  const kind=$('actor-npc-kind').value;
  $('npc-trainer-editor').hidden=kind!=='trainer';
  $('npc-wild-editor').hidden=kind!=='wild';
  if($('npc-merchant-editor'))$('npc-merchant-editor').hidden=kind!=='merchant';
  $('npc-role-pending').hidden=kind!=='quest';
  const selected=npcSelectedActor(),npc=selected?.npc;
  const engagement=$('npc-trainer-engagement');
  if(engagement){
    engagement.value=npc?.trainerEngagement??'offer';
    engagement.disabled=!selected;
  }
  const flee=$('npc-trainer-allow-flee');
  if(flee){flee.checked=npc?.allowFlee!==false;flee.disabled=!selected;}
  npcMerchantPickerRefresh();
  npcRewardCatalogRefresh();
  const roster=npc?.trainerRoster??[];
  $('npc-team-summary').textContent=!selected
    ?'Pose un PNJ sur la carte pour configurer son équipe.'
    :!npcOfficialCreatures.length
      ?'Aucune créature disponible : recharge le bestiaire officiel Combat ci-dessous.'
      :roster.length>=NPC_TRAINER_ROSTER_LIMIT_V1
        ?'Équipe complète : '+NPC_TRAINER_ROSTER_LIMIT_V1+' créatures.'
        :roster.length+' / '+NPC_TRAINER_ROSTER_LIMIT_V1+' créature(s) configurées';
  $('npc-team-add').disabled=!selected||kind!=='trainer'||npcCatalogLoading||
    !npcOfficialCreatures.length||roster.length>=NPC_TRAINER_ROSTER_LIMIT_V1;
  const list=$('npc-team-list');
  list.replaceChildren();
  roster.forEach((slot,index)=>{
    const row=document.createElement('div');
    row.className='npc-team-row';
    const title=document.createElement('span');title.className='npc-slot-title';
    title.textContent=(index+1)+'. '+npcCreatureName(slot.creatureId);
    row.append(title);
    const level=document.createElement('input');
    level.type='number';level.min='1';level.max='9999';level.step='1';
    level.value=String(slot.level);level.setAttribute('aria-label','Niveau de '+npcCreatureName(slot.creatureId));
    level.style.width='74px';
    level.addEventListener('change',()=>{
      const changed=[...roster];changed[index]={...slot,level:Number(level.value)};
      npcApplyAuthoringPatch({trainerRoster:changed});
    });
    row.append(level);
    for(const [label,delta] of [['↑',-1],['↓',1]]){
      const button=document.createElement('button');button.type='button';
      button.textContent=label;
      button.setAttribute('aria-label',label==='↑'?'Monter la créature':'Descendre la créature');
      button.disabled=index+delta<0||index+delta>=roster.length;
      button.addEventListener('click',()=>{
        const changed=[...roster];
        [changed[index],changed[index+delta]]=[changed[index+delta],changed[index]];
        npcApplyAuthoringPatch({trainerRoster:changed});
      });
      row.append(button);
    }
    const remove=document.createElement('button');remove.type='button';
    remove.textContent='✕';remove.setAttribute('aria-label','Retirer la créature');
    remove.addEventListener('click',()=>npcApplyAuthoringPatch({
      trainerRoster:roster.filter((_,i)=>i!==index)
    }));
    row.append(remove);list.append(row);
  });
  const copy=$('npc-team-copy-source'),oldChoice=copy.value;
  copy.replaceChildren(new Option('Choisir un autre dresseur…',''),...placedActors
    .filter(actor=>actor.id!==selected?.id&&actor.npc?.trainerRoster?.length)
    .map(actor=>new Option(actor.npc.name||'Dresseur sans nom',actor.id)));
  if([...copy.options].some(option=>option.value===oldChoice))copy.value=oldChoice;
  $('npc-team-copy').disabled=!selected||!copy.value;
  if($('npc-wild-creature')){
    const wild=npc?.wildCreature;
    if(wild)$('npc-wild-creature').value=wild.creatureId;
    else $('npc-wild-creature').value='';
    $('npc-wild-level').value=String(wild?.level??10);
  }
}
async function loadNpcOfficialCreatureChoices(){
  if(!$('npc-team-creature')||npcCatalogLoading)return;
  npcCatalogLoading=true;
  if($('npc-catalog-retry'))$('npc-catalog-retry').disabled=true;
  $('npc-catalog-status').textContent='Chargement du bestiaire officiel Combat…';
  npcRoleEditorRefresh();
  try{
    // Read CURRENT published Combat transfers; no fallback IDs or cloned bestiary.
    const source=await loadCaptureShowcaseEncounterSourceV1();
    if(!Array.isArray(source.creatures)||!source.creatures.length)
      throw new Error('aucune créature publiée dans la source officielle');
    npcOfficialCreatures=source.creatures;
    for(const id of ['npc-team-creature','npc-wild-creature']){
      const select=$(id),selected=select.value;
      select.replaceChildren(new Option('Choisir une créature publiée…',''),
        ...npcOfficialCreatures.map(creature=>new Option(
          creature.name+' · '+creature.elements.join(' / '),creature.id)));
      if(npcOfficialCreatures.some(creature=>creature.id===selected))select.value=selected;
    }
    $('npc-catalog-status').textContent=npcOfficialCreatures.length+
      ' créature(s) du bestiaire officiel Combat disponibles.';
  }catch(error){
    npcOfficialCreatures=Object.freeze([]);
    for(const id of ['npc-team-creature','npc-wild-creature']){
      $(id)?.replaceChildren(new Option('Bestiaire indisponible — réessayer',''));
    }
    $('npc-catalog-status').textContent='Bestiaire officiel indisponible : '+
      error.message+'. Réessaie avec le bouton ci-dessous ; aucun catalogue de secours.';
  }finally{
    npcCatalogLoading=false;
    if($('npc-catalog-retry'))$('npc-catalog-retry').disabled=false;
    npcRoleEditorRefresh();
  }
}
function syncActorSelectedControls(){
  const selected=npcSelectedActor();
  $('actor-selected').textContent=selected?
    'PNJ sélectionné : '+(selected.npc?.name||
      captureActorProvider?.resolveDefinition(selected.actorDefinitionId)?.displayName||
      'sans nom'):'Aucun acteur sélectionné';
  if($('npc-authoring-open'))$('npc-authoring-open').disabled=!selected;
  if(!selected){closeNpcAuthoringDialog();
    if($('actor-npc-edit-definition'))$('actor-npc-edit-definition').hidden=true;
    npcRoleEditorRefresh();return;
  }
  const linkedNpc=selected.actorDefinitionId.startsWith('npc.user.');
  $('npc-authoring-open').disabled=linkedNpc;
  if($('actor-npc-edit-definition')){
    $('actor-npc-edit-definition').hidden=!linkedNpc;
    $('actor-npc-edit-definition').href='./npc-editor.html?edit='+encodeURIComponent(selected.actorDefinitionId);
  }
  const npc=selected.npc??captureActorProvider?.resolveDefinition(selected.actorDefinitionId)?.npc;
  if($('actor-npc-kind')){
    $('actor-npc-kind').value=npc?.kind??'dialogue';
    $('actor-npc-name').value=npc?.name??'';
    $('actor-npc-movement').value=npc?.movement.mode??'static';
    $('actor-npc-radius').value=String(npc?.movement.radius??90);
    $('actor-npc-dialogue').value=npc?.dialogue??'';
  }
  $('actor-definition').value=selected.actorDefinitionId;
  syncActorViewAvailability();
  $('actor-facing').value=String(selected.facingX);
  $('actor-view').value=selected.visualView==='back'&&
    !!captureActorProvider?.resolveDefinition(selected.actorDefinitionId)?.mapVisualByView?.back
    ?'back':'front';
  $('actor-scale').value=String(Math.round((selected.visualScale??1)*100));
  $('actor-scale-value').textContent=$('actor-scale').value+' %';
  npcRoleEditorRefresh();
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
  if(!actorSubmode){closeNpcAuthoringDialog();actorSelectedId=null;}
  $('object-controls').hidden=actorSubmode;
  $('actor-controls').hidden=!actorSubmode;
  $('active-tool-label').textContent=actorSubmode?'Objets · Acteurs Capture':'Objets · toucher pour placer ou supprimer';
  status(actorSubmode?'Acteurs : choisis une définition Capture et touche la carte':'Palette des objets ouverte');
  scheduleDraw();
}
function applyActorAtCell(cell){
  const x=(cell.x+.5)*SCULPT_TILE.width,y=(cell.y+.5)*SCULPT_TILE.height;
  // One natural touch opens the placed actor's details instead of duplicating
  // it. WorldArea.actors remains the only placement authority.
  if($('actor-action').value==='place'){
    const existing=findSculptPreviewActorNear(placedActors,x,y);
    if(existing){
      actorSelectedId=existing.id;
      $('actor-action').value='select';
      syncActorSelectedControls();
      $('actor-npc-settings')?.setAttribute('open','');
      if(!existing.actorDefinitionId.startsWith('npc.user.'))openNpcAuthoringDialog();
      scheduleDraw();
      status('Acteur sélectionné : modifier sa fiche ci-dessous');
      return;
    }
  }
  if($('actor-action').value==='select'){
    const found=findSculptPreviewActorNear(placedActors,x,y);
    actorSelectedId=found?.id??null;
    syncActorSelectedControls();scheduleDraw();
    if(found&&!found.actorDefinitionId.startsWith('npc.user.'))openNpcAuthoringDialog();
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
  const linkedNpc=definitionId.startsWith('npc.user.');
  const nextActors=appendSculptPreviewActor(placedActors,{
    definitionId,x,y,facingX:Number($('actor-facing').value),
    visualScale:Number($('actor-scale').value)/100,
    visualView:$('actor-view').value,
    npc:linkedNpc?null:npcSettingsFromControls()
  });
  if(actorCommit(nextActors)){
    // An author who just placed a trainer must be able to compose its team
    // immediately. The newly created WorldArea actor remains the sole owner.
    actorSelectedId=nextActors.at(-1)?.id??null;
    $('actor-action').value='select';
    syncActorSelectedControls();
    if(!linkedNpc){
      $('actor-npc-settings')?.setAttribute('open','');
      openNpcAuthoringDialog();
    }
    status(linkedNpc?'PNJ réutilisable placé : définition conservée dans la bibliothèque.':
      'PNJ posé et sélectionné : configure son rôle et son équipe dans la fenêtre.');
  }
}
$('actor-definition').addEventListener('change',syncActorViewAvailability);
$('npc-merchant-reload')?.addEventListener('click',requestNpcMerchantCatalog);
$('npc-merchant-picker')?.addEventListener('change',()=>{
  npcApplyAuthoringPatch({merchantId:$('npc-merchant-picker').value});
});
$('npc-merchant-clear')?.addEventListener('click',()=>{
  npcApplyAuthoringPatch({merchantId:''});
});
for(const id of ['actor-npc-kind','actor-npc-name','actor-npc-movement',
  'actor-npc-radius','actor-npc-dialogue','npc-trainer-engagement','npc-trainer-allow-flee','npc-wild-creature','npc-wild-level']){
  $(id)?.addEventListener('change',()=>{
    try{editSelectedActor({npc:npcSettingsFromControls()});}
    catch(error){status('Fiche PNJ non enregistrée : '+error.message);}
    npcRoleEditorRefresh();
  });
}
$('npc-reward-reload')?.addEventListener('click',requestNpcRewardCatalog);
$('npc-reward-currency')?.addEventListener('change',()=>{
 const amount=Number($('npc-reward-currency').value);
 const previous=npcSelectedActor()?.npc?.trainerReward??{currency:0,items:[]};
 npcApplyAuthoringPatch({trainerReward:{currency:amount,items:previous.items}});
});
$('npc-reward-add')?.addEventListener('click',()=>{
 const itemId=$('npc-reward-item').value;
 if(!npcRewardChoices.some(item=>item.id===itemId)){
  status('Choisis un objet du catalogue officiel GenSRPG.');return;
 }
 const quantity=Number($('npc-reward-quantity').value);
 const previous=npcSelectedActor()?.npc?.trainerReward??{currency:0,items:[]};
 const matched=previous.items.find(item=>item.itemId===itemId);
 const items=matched?previous.items.map(item=>
  item.itemId===itemId?{itemId,quantity}:item):[...previous.items,{itemId,quantity}];
 npcApplyAuthoringPatch({trainerReward:{currency:previous.currency,items}});
});
$('npc-team-add')?.addEventListener('click',()=>{
  const species=$('npc-team-creature').value;
  const level=Number($('npc-team-level').value);
  if(!npcOfficialCreatures.some(creature=>creature.id===species)){
    status('Sélectionne une créature dans le bestiaire officiel.');return;
  }
  const roster=npcSelectedActor()?.npc?.trainerRoster??[];
  if(roster.length>=NPC_TRAINER_ROSTER_LIMIT_V1){
    status('Équipe complète : six créatures maximum.');return;
  }
  npcApplyAuthoringPatch({trainerRoster:[...roster,{creatureId:species,level}]});
});
$('npc-team-copy-source')?.addEventListener('change',npcRoleEditorRefresh);
$('npc-team-copy')?.addEventListener('click',()=>{
  const source=placedActors.find(actor=>actor.id===$('npc-team-copy-source').value);
  if(!source?.npc?.trainerRoster?.length)return;
  npcApplyAuthoringPatch({trainerRoster:source.npc.trainerRoster.map(slot=>({
    creatureId:slot.creatureId,level:slot.level
  }))});
});
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
$('npc-authoring-open')?.addEventListener('click',openNpcAuthoringDialog);
$('npc-authoring-close')?.addEventListener('click',closeNpcAuthoringDialog);
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
// Read-only test probe: author anchors and transient NPC positions remain distinct.
window.__sculptNpcWanderProbe=()=>Object.freeze({
  active:navigationTesting,count:npcWanderRuntime.count,
  runtime:npcWanderRuntime.snapshot()
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
loadNpcOfficialCreatureChoices();
$('npc-catalog-retry')?.addEventListener('click',()=>{void loadNpcOfficialCreatureChoices();});
requestNpcMerchantCatalog();
requestNpcRewardCatalog();
function setObjectEditing(active){
  if(active&&sculptSettingsPanel)sculptSettingsPanel.open=false;
  if(active&&interiorConnectorMode)setInteriorConnectorMode(false);
  if(active&&interiorDoorMoving)setInteriorDoorMoving(false);
  if(active&&interiorWallMode)setInteriorWallMode(null);
  if(active&&surfaceEditing)setSurfaceEditing(false);
  objectEditing=!!active;
  if(!objectEditing){
    closeNpcAuthoringDialog();
    actorSubmode=false;$('object-controls').hidden=false;$('actor-controls').hidden=true;
  }
  document.body.classList.toggle('object-editing',objectEditing);
  $('object-palette').hidden=!objectEditing;
  if(objectEditing&&sculptWorldDraft&&!navigationTesting){
    syncObjectWaypoints();
    if(!$('object-waypoints-panel').hidden)$('object-waypoints-panel').open=true;
  }
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
    flipX:$('object-flip-x')?.checked===true,
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
if($('object-flip-x'))$('object-flip-x').addEventListener('change',()=>{
  if(objectSelectedId)editSelectedObject({flipX:$('object-flip-x').checked});
  else scheduleDraw();
});
// Native collapsed panel. Slider input redraws the preview with NO history;
// each committed change enters the existing single undo/redo WorldObject path.
if($('object-shadow-details')){
$('object-shadow-scope').addEventListener('change',()=>{
  refreshSelectedObjectShadowControlsV1(placedObjects.find(o=>o.id===objectSelectedId));
  scheduleDraw();
});
function applySelectedShadowControl(){
 const shadow=readSelectedObjectShadowControlsV1();
 if($('object-shadow-scope').value==='model'){
   if(commitShadowModelProfile(shadow))
     status('Ombre du modèle enregistrée dans le monde · tous les objets identiques suivent ce réglage.');
 }else editSelectedObject({shadow});
 scheduleDraw();
}
$('object-shadow-mode').addEventListener('change',()=>{
 $('object-shadow-fields').hidden=$('object-shadow-mode').value!=='custom';
 $('object-shadow-summary').textContent=$('object-shadow-mode').value==='custom'?'Personnalisée':'Auto';
 applySelectedShadowControl();
});
for(const id of ['width','height','x','y','opacity']){
 const input=$('object-shadow-'+id);
 input.addEventListener('input',()=>{
  $('object-shadow-'+id+'-value').textContent=input.value+' %';
  scheduleDraw();
 });
 input.addEventListener('change',applySelectedShadowControl);
}
$('object-shadow-reset').addEventListener('click',()=>{
 $('object-shadow-mode').value='auto';
 applySelectedShadowControl();
 syncObjectSelectedControls();
 scheduleDraw();
});
$('object-shadow-profile-undo').addEventListener('click',()=>{
 if(!shadowProfileHistory.length)return;
 const previous=shadowProfileHistory.pop();
 shadowProfileRedo.push(currentWorldShadowProfiles());
 changeWorldShadowProfiles(previous);
 refreshSelectedObjectShadowControlsV1(placedObjects.find(o=>o.id===objectSelectedId));
 status('Ombres de ce modèle : précédent réglage restauré.');
});
$('object-shadow-profile-redo').addEventListener('click',()=>{
 if(!shadowProfileRedo.length)return;
 const next=shadowProfileRedo.pop();
 shadowProfileHistory.push(currentWorldShadowProfiles());
 changeWorldShadowProfiles(next);
 refreshSelectedObjectShadowControlsV1(placedObjects.find(o=>o.id===objectSelectedId));
 status('Ombres de ce modèle : réglage réappliqué.');
});
}
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
  if(!objectHistory.length||!allowWorldLinkedObjects(objectHistory.at(-1)))return;
  objectRedo.push(placedObjects);placedObjects=objectHistory.pop();updateObjectCount();syncObjectSelectedControls();
});
$('object-redo').addEventListener('click',()=>{
  if(!objectRedo.length||!allowWorldLinkedObjects(objectRedo.at(-1)))return;
  objectHistory.push(placedObjects);placedObjects=objectRedo.pop();updateObjectCount();syncObjectSelectedControls();
});
refreshObjectOptions();updateObjectCount();
window.__sculptObjectsProbe=()=>Object.freeze({
  active:objectEditing,count:placedObjects.length,selectedId:objectSelectedId,
  terrainRasterBuilds,cachedGround:!!navTerrainCache,
  shadowModelCount:currentWorldShadowProfiles().length,
  shadowModelHistoryCount:shadowProfileHistory.length,
  undoCount:objectHistory.length,redoCount:objectRedo.length,
  variantChoices:[...$('object-variant').options].map(o=>o.value),
  definitions:availableObjects.length,
  categories:[...$('object-category').options].map(o=>o.value),
  filteredDefinitions:[...$('object-definition').options].map(o=>o.value),
  objects:placedObjects.map(o=>{
    // Read the SAME cached Image the native object painter actually consumes;
    // PerformanceResourceTiming can be absent for already cached WebPs.
    const placement=resolveWorldObjectPlacements([o],objectDefinitionCatalogV1)[0];
    const art=objectImage(placement?.visual?.assetId);
    return {id:o.id,definition:o.objectDefinitionId,
      x:o.transform.x,y:o.transform.y,rotationDeg:o.transform.rotationDeg,
      scaleX:o.transform.scaleX,scaleY:o.transform.scaleY,
      visualVariantId:o.overrides.visualVariantId,
      visualAssetReady:Boolean(art?.complete&&(art?.naturalWidth??art?.width)>0)};
  }),
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
  // Gameplay zoom-out is bounded to 200% (minimum native scale .5).
  // The editor retains its independent .32 scale for authoring large maps.
  const requestedZoom=zoom*(event.deltaY>0?.90:1.1);
  zoom=navigationTesting?sculptPlayableCameraZoom(requestedZoom):
    Math.max(.32,Math.min(2.4,requestedZoom));
  const rect=canvas.getBoundingClientRect();
  const mouseX=event.clientX-rect.left,mouseY=event.clientY-rect.top;
  pan.x=mouseX-(mouseX-pan.x)*zoom/previous;
  pan.y=mouseY-(mouseY-pan.y)*zoom/previous;
  if(navigationTesting)centerNavigationCamera();
  else clampSculptEditorCamera();
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

$('scenery-fringe-toggle')?.addEventListener('change',()=>{
  if(!sculptWorldDraft||!sculptWorldAreaMounted||activeInteriorId||
     sculptWorldCurrentInterior()||navigationTesting){
    $('scenery-fringe-toggle').checked=false;
    fringeEditing=false;
    status('Décor hors zone uniquement disponible dans une WorldArea extérieure en édition');
    return;
  }
  fringeEditing=$('scenery-fringe-toggle').checked;
  if(fringeEditing&&!decorativeFringe){
    decorativeFringe=createSculptDecorativeFringeV1(decorativeFringeArea());
    fringeRasterCache.clear();
    status('Pourtour de 8 cases ajouté sur les quatre côtés · sculptable et décoratif uniquement');
    fit();
  }else status(fringeEditing?'Mode pourtour actif : peins les textures ou déplace les objets au-delà de la carte':
    'Retour à la zone de base');
  updateHistoryButtons();scheduleDraw();
});
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
  const next=$('material').value;
  if(!themes.includes(next))return;
  surfaceCommit(normalizeSculptSurface({...surface,baseMaterialId:next}));
  setTheme();
});
$('water-material').addEventListener('change',setWaterMaterial);
$('rock').addEventListener('change',()=>{navTerrainCache=null;scheduleDraw();});
$('rock-moss').addEventListener('change',()=>{navTerrainCache=null;scheduleDraw();});
$('show-water').addEventListener('change',()=>toggleRibbon('water'));
$('show-road').addEventListener('change',()=>toggleRibbon('road'));
$('preview-cursor').addEventListener('change',scheduleDraw);
$('zoom').addEventListener('input',()=>{
 const old=zoom;
 const desiredZoom=Number($('zoom').value)/100;
 zoom=navigationTesting?sculptPlayableCameraZoom(desiredZoom):desiredZoom;
 if(navigationTesting)$('zoom').value=String(Math.round(zoom*100));
 const {width,height}=dimensions();
 pan.x=width/2-(width/2-pan.x)*zoom/old;
 pan.y=height/2-(height/2-pan.y)*zoom/old;
 if(navigationTesting)centerNavigationCamera();
 else clampSculptEditorCamera();
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
    Math.min(SCULPT_TERRAIN_MAX_LEVEL,Number(level)));
 $('target').value=String(value);$('target-value').textContent=String(value);
 syncQuickToolbar();status(selectedMode==='sphere-basin'?'Profondeur sphérique : −'+value+' niveaux':
    selectedMode==='sphere-hill'?'Hauteur sphérique : +'+value+' niveaux':
      'Hauteur plateau : niveau '+value+' (bord '+$('edge').value+' %)');scheduleDraw();}
$('target').addEventListener('input',()=>changeTarget($('target').value));
// Frozen V80 retains its historical buttons; the main editor uses the
// quickbar +/- pair and this single exact-value slider instead.
$('level-down')?.addEventListener('click',()=>changeTarget(Number($('target').value)-1));
$('level-up')?.addEventListener('click',()=>changeTarget(Number($('target').value)+1));

// Point projection/inverse is already owned by Camera: snap only the
// authoring input. The snapped endpoints are stored by the ONE WorldArea model.
function interiorWallPointFromEvent(event,from=null){
  const raw=screenToWorldPoint(event);
  if(!Number.isFinite(raw.x)||!Number.isFinite(raw.y))return null;
  return snapInteriorWallPoint(raw,currentInteriorArea()?.walls??[],{
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
  const house=sculptWorldCurrentInterior()?worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId):null;
  const worldDoor=house?.rootAreaId===sculptWorldAreaId?house.exit:null;
  const portal=entry?.exitPortal??worldDoor;
  const allowed=!!portal&&(entry?entry.floorIndex===0:true);
  $('interior-door-move').disabled=!allowed;
  $('interior-door-asset').disabled=!allowed;
  $('interior-door-asset').value=portal?.visual.assetId??'default';
  $('interior-door-scale').disabled=!allowed;
  $('interior-door-move').setAttribute('aria-pressed',String(interiorDoorMoving));
  $('interior-door-move').classList.toggle('active',interiorDoorMoving);
  const size=Math.round(100*(portal?.visual.scale??.58));
  $('interior-door-scale').value=String(size);
  $('interior-door-scale-value').textContent=size+' %';
  $('interior-door-move').textContent=interiorDoorMoving?
    '✓ Terminer le déplacement':'Déplacer la porte';
}
function setInteriorDoorMoving(on){
  if(on&&interiorConnectorMode)setInteriorConnectorMode(false);
  if(on&&(!(activeInteriorId||sculptWorldCurrentInterior())||
    (sculptWorldCurrentInterior()&&
      worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId)?.rootAreaId!==sculptWorldAreaId)||
    (currentSculptInterior()&&currentSculptInterior().floorIndex!==0)))return;
  if(on){
    if(interiorWallMode)setInteriorWallMode(null);
    if(navigationTesting)setNavigationTesting(false);
    if(objectEditing)setObjectEditing(false);
    if(surfaceEditing)setSurfaceEditing(false);
  }
  if(on&&$('interior-controls-details'))$('interior-controls-details').open=false;
  interiorDoorMoving=!!on;interiorDoorGesture=null;interiorDoorPreview=null;
  document.body.classList.toggle('interior-door-authoring',interiorDoorMoving);
  updateInteriorDoorControls();scheduleDraw();
}
function commitInteriorDoor(point,{scale=null,assetId=null}={}){
  if(sculptWorldCurrentInterior()){
    try{
      sculptWorldDraft=changeWorldInteriorDoor(sculptWorldDraft,sculptWorldAreaId,{
        ...point,...(scale!==null?{scale}:{}),
        ...(assetId!==null?{assetId}:{})});
      updateInteriorDoorControls();scheduleDraw();
      status('Porte intérieure modifiée : sortie officielle conservée dans le monde.');
    }catch(error){status('Porte inchangée : '+error.message);}
    return;
  }
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
  if(!currentInteriorArea())return;
  commitInteriorDoor({}, {scale:Number($('interior-door-scale').value)/100});
});

// Each connector is a canonical Portal/Spawn pair, with editor-only selection.
function interiorConnectorPortals(){
  if(sculptWorldCurrentInterior())
    return worldInteriorFloorPortals(sculptWorldDraft,sculptWorldAreaId);
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
  if(on&&(!currentInteriorArea()||!interiorConnectorPortals().length))return;
  if(on){
    if(interiorWallMode)setInteriorWallMode(null);
    if(interiorDoorMoving)setInteriorDoorMoving(false);
    if(navigationTesting)setNavigationTesting(false);
    if(objectEditing)setObjectEditing(false);
    if(surfaceEditing)setSurfaceEditing(false);
  }
  if(on&&$('interior-controls-details'))$('interior-controls-details').open=false;
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
    if(sculptWorldCurrentInterior())sculptWorldDraft=
      changeWorldInteriorConnector(sculptWorldDraft,portal.id,{
        x:portal.trigger.x,y:portal.trigger.y,assetId:$('interior-connector-asset').value,
        rotationDeg:portal.visual.rotationDeg??0});
    else sculptInteriors=updateSculptFloorConnector(sculptInteriors,{
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
    if(sculptWorldCurrentInterior())sculptWorldDraft=
      changeWorldInteriorConnector(sculptWorldDraft,portal.id,{
        x:portal.trigger.x,y:portal.trigger.y,
        assetId:portal.visual.assetId??'stairs.wood',rotationDeg:degrees});
    else sculptInteriors=updateSculptFloorConnector(sculptInteriors,{
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
  if(sculptWorldCurrentInterior()){
    try{commitWorldInteriorAreaPatch({wallMaterialId:$('interior-wall-material').value});
      status('Texture des murs enregistrée dans la carte intérieure du monde.');}
    catch(error){status(error.message);}
    return;
  }
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
function currentInteriorArea(){
  return currentSculptInterior()?.area??(sculptWorldCurrentInterior()?sculptWorldArea():null);
}
function commitWorldInteriorAreaPatch(patch){
  const area=sculptWorldArea();
  if(!sculptWorldCurrentInterior()||!sculptWorldAreaMounted||!area)
    throw Error('Intérieur du monde non chargé : modification refusée');
  const updated=normalizeWorldArea({...area,...patch});
  const next=createWorldBuilderDraft({...sculptWorldDraft,
    areas:sculptWorldDraft.areas.map(a=>a.id===area.id?updated:a)});
  const checked=validateWorldBuilderDraft(next);
  if(!checked.valid)throw Error('Intérieur invalide : '+checked.errors.join(', '));
  sculptWorldDraft=createWorldBuilderDraft(checked.document);
  scheduleDraw();
  return updated;
}
function updateInteriorWallControls(){
  const area=currentInteriorArea(),count=area?.walls.length??0;
  $('interior-wall-toggle').disabled=!area;
  $('interior-wall-remove').disabled=!area||count===0;
  $('interior-wall-cancel').disabled=!interiorWallStart;
  $('interior-wall-undo').disabled=!area||!interiorWallHistory.length;
  $('interior-wall-redo').disabled=!area||!interiorWallRedo.length;
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
  if(mode&&!currentInteriorArea())return;
  if(mode){
    if(interiorDoorMoving)setInteriorDoorMoving(false);
    if(navigationTesting)setNavigationTesting(false);
    if(objectEditing)setObjectEditing(false);
    if(surfaceEditing)setSurfaceEditing(false);
  }
  if(mode&&$('interior-controls-details'))$('interior-controls-details').open=false;
  interiorWallMode=mode;interiorWallStart=null;interiorWallPreview=null;
  interiorWallGesture=null;
  document.body.classList.toggle('interior-wall-authoring',!!mode);
  updateInteriorWallControls();scheduleDraw();
}
function commitInteriorWalls(walls,{history=true}={}){
  const area=currentInteriorArea();
  if(!area||walls===area.walls||
    JSON.stringify(walls)===JSON.stringify(area.walls))return false;
  if(history){
    interiorWallHistory.push(area.walls);
    if(interiorWallHistory.length>40)interiorWallHistory.shift();
    interiorWallRedo=[];
  }
  if(sculptWorldCurrentInterior())commitWorldInteriorAreaPatch({walls});
  else{
    const entry=currentSculptInterior();
    const updated=normalizeWorldArea({...entry.area,walls});
    sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===entry.area.id?
      updateSculptInterior(e,{area:updated}):e));
  }
  updateInteriorWallControls();scheduleDraw();
  status('Murs sauvegardés avec cet intérieur · '+walls.length+' segment(s)');
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
  const area=currentInteriorArea();if(!area||!interiorWallHistory.length)return;
  const before=interiorWallHistory.pop();interiorWallRedo.push(area.walls);
  commitInteriorWalls(before,{history:false});
});
$('interior-wall-redo').addEventListener('click',()=>{
  const area=currentInteriorArea();if(!area||!interiorWallRedo.length)return;
  const next=interiorWallRedo.pop();interiorWallHistory.push(area.walls);
  commitInteriorWalls(next,{history:false});
});

// V79 isolated, reversible area authoring. No reload, no alternative camera or
// gameplay collision engine; portal links use WorldArea/Portal v1 throughout.
function captureSculptArea(){
  return {terrain,objects:placedObjects,actors:placedActors,surface,
    ...(!sculptWorldDraft&&sculptStandaloneShadowProfiles.length
      ?{objectShadowProfiles:sculptStandaloneShadowProfiles}:{}),
    ...(decorativeFringe?{decorativeFringe}:{})};
}
function mountSculptArea(snapshot){
  // One read-only presentation label; WorldArea/WorldSurface remains sole
  // source of the loaded map and gameplay settings.
  if($('sculpt-map-preset-loaded'))
   $('sculpt-map-preset-loaded').textContent=
     'Carte affichée : zone active (relief, textures, objets). Les réglages de rencontres, passages et héros restent ceux du monde/de la partie.';
  closeNpcDialogue();
  if($('npc-talk'))$('npc-talk').hidden=true;
  terrain=snapshot.terrain;placedObjects=snapshot.objects;placedActors=snapshot.actors;
  surface=snapshot.surface;
  if(!sculptWorldDraft&&(!activeInteriorId||snapshot.objectShadowProfiles!==undefined))
    sculptStandaloneShadowProfiles=normalizeWorldObjectShadowProfilesV1(
      snapshot.objectShadowProfiles);
  if(!sculptWorldDraft){shadowProfileHistory=[];shadowProfileRedo=[];}
  decorativeFringe=snapshot.decorativeFringe??null;
  fringeEditing=false;fringeGesture=null;fringeHistory=[];fringeRedo=[];
  fringeRasterCache.clear();
  if($('scenery-fringe-toggle'))$('scenery-fringe-toggle').checked=false;
  history=[];redoHistory=[];objectHistory=[];objectRedo=[];
  actorHistory=[];actorRedo=[];surfaceHistory=[];surfaceRedo=[];
  objectSelectedId=null;actorSelectedId=null;
  rampStart=null;rampEnd=null;rampGesture=null;hoverCell=null;precisionCell=null;
  navTerrainCache=null;navBridgePlacements=null;navStairProjection=null;
  exampleRoadEnabled=false;$('show-road').checked=false;$('show-road').disabled=true;
  if(ribbonTextures.road)ribbonTextures.road.visible=false;
  updateHistoryButtons();updateObjectCount();updateActorCount();
  updateSurfaceCount();loadSurfacePaintAssets();syncObjectSelectedControls();
  if(!activeInteriorId&&!sculptWorldCurrentInterior()&&
      [...$('material').options].some(option=>option.value===surface.baseMaterialId))
    $('material').value=surface.baseMaterialId;
  if(activeInteriorId||sculptWorldCurrentInterior()){
    const base=interiorFloorMaterials.includes(surface.baseMaterialId)?
      surface.baseMaterialId:'floor.wood.house';
    $('interior-floor-base').value=base;
    if(worldInteriorFloorBase)worldInteriorFloorBase.value=base;
    $('surface-material').value=base;
  }else $('surface-material').value='road.dirt';
  setTheme();
}
function updateSculptAreaControls(){
  const entry=sculptInteriors.find(e=>e.area.id===activeInteriorId);
  const worldInterior=!entry&&sculptWorldCurrentInterior();
  const inInterior=!!entry||worldInterior;
  $('interior-area-bar').hidden=!inInterior;
  $('interior-area-return').textContent=worldInterior&&
    !worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId)
      ?'🌍 Retour au Monde':'← Retour extérieur';
  document.body.classList.toggle('sculpt-interior-area',inInterior);
  const worldFloors=worldInterior?worldInteriorFloors(sculptWorldDraft,sculptWorldAreaId):[];
  const worldFloor=worldFloors.find(f=>f.areaId===sculptWorldAreaId);
  $('interior-area-label').textContent=entry?
    '🏠 '+(entry.floorIndex===0?'Rez-de-chaussée':'Étage '+entry.floorIndex)+
      ' · '+entry.buildingId:worldInterior?
    '🏠 '+(worldFloor?.label??'Intérieur')+' · '+(sculptWorldArea()?.label??'Maison'):
    '🏞 Extérieur';
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
  if(worldInterior){
    // Expose the EXISTING native inspector for a linked WorldArea.
    const selector=$('interior-level-select'),old=selector.value;
    selector.replaceChildren(...worldFloors.map(f=>new Option(f.label,f.areaId)));
    selector.value=worldFloors.some(f=>f.areaId===sculptWorldAreaId)?
      sculptWorldAreaId:(worldFloors[0]?.areaId??'');
    const level=worldFloor?.level??0;
    $('interior-level-add').disabled=worldFloors.length>=SCULPT_INTERIOR_FLOOR_LIMIT||
      level!==worldFloors.length-1||!worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId);
    $('interior-width').value=String(terrain.width);
    $('interior-height').value=String(terrain.height);
    $('interior-width').disabled=true;
    $('interior-height').disabled=true;
    $('interior-layout-apply').textContent='Appliquer la forme';
    const shape=sculptInteriorShapeId(sculptWorldArea());
    $('interior-layout-apply').disabled=shape==='custom';
    $('interior-shape').value=shape==='custom'?'rectangle':shape;
    $('interior-shape').disabled=shape==='custom';
    $('interior-shape-hint').textContent=shape==='custom'?
      'Forme personnalisée déjà enregistrée. Modifie-la depuis World Builder sans l’écraser.':
      'Forme du sol modifiable ici. Dimensions verrouillées dans la WorldArea pour protéger les portes, murs et points d’arrivée.';
    $('interior-wall-material').value=sculptWorldArea()?.wallMaterialId??'plaster';
    // Historical templates are tied to standalone interiors, never copied
    // into the playable world save behind a user's back.
    $('interior-template-save').disabled=true;
    $('interior-template-apply').disabled=true;
    $('interior-template-save').title='Les modèles de pièce sont réservés au Labo isolé';
  }else{
    $('interior-width').disabled=false;
    $('interior-height').disabled=false;
    $('interior-shape').disabled=false;
    $('interior-layout-apply').textContent='Appliquer forme et taille';
    $('interior-shape-hint').textContent=
      "Choisir une forme l'applique directement. Pour la taille, utilise Appliquer.";
    $('interior-template-save').disabled=false;
  }
  $('new-map-toggle').disabled=!!entry;
  const worldInteriorFloorRow=$('world-interior-floor-base-row');
  if(worldInteriorFloorRow)worldInteriorFloorRow.hidden=!worldInterior;
  if(worldInterior&&worldInteriorFloorBase)worldInteriorFloorBase.value=
    interiorFloorMaterials.includes(surface.baseMaterialId)
      ?surface.baseMaterialId:'floor.wood.house';
  for(const option of $('surface-material').options)
    option.disabled=(entry||worldInterior)
      ?!option.value.startsWith('floor.')
      :option.value.startsWith('floor.');
  $('interior-template-apply').disabled=!entry||!$('interior-template-select').value;
  $('object-open-interior').hidden=!!entry||!objectSelectedId||
    objectDefinitionCatalogV1.get(placedObjects.find(o=>o.id===objectSelectedId)
      ?.objectDefinitionId)?.kind!=='building';
  updateSculptDoorAction();
  updateInteriorWallControls();updateInteriorDoorControls();updateInteriorConnectorControls();
  if(entry)$('interior-wall-material').value=entry.area.wallMaterialId??'plaster';
  updateInteriorConnectorControls();
  $('interior-door-move').closest('.interior-door-tools').hidden=worldInterior&&
    worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId)?.rootAreaId!==sculptWorldAreaId;
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
    if(sculptCreatorCameraAngle===null)
      $('navigation-camera-angle').value=activeInteriorId?
        $('interior-camera-angle').value:$('navigation-camera-angle').value;
    else $('navigation-camera-angle').value=String(sculptCreatorCameraAngle);
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
    if(sculptPlayRequested||navigationTesting){status('Passe en édition 2,5D pour lier une maison.');return;}
    try{
      // Capture the *current* object placement before resolving its one real
      // door. An unsaved preview must never create an orphan Builder link.
      commitCurrentSculptWorldArea();
      const link=linkSculptWorldBuildingInteriorV1(sculptWorldDraft,{
        sourceAreaId:sculptWorldAreaId,buildingId:resolved.id
      });
      // Validate the destination BEFORE replacing the current displayed Area.
      const target=link.document.areas.find(a=>a.id===link.targetAreaId);
      const scene=sculptWorldAreaScene(target);
      sculptWorldDraft=link.document;
      saveWorldAssemblerDraft(worldStorage,sculptWorldDraft);
      mountWorldSculptArea(link.targetAreaId,scene);
      $('world-area-portal-panel').open=false;
      status((link.created?'Intérieur créé et lié':'Intérieur lié retrouvé')+
        ' : porte extérieure, arrivée et sortie déjà enregistrées dans World Builder.');
    }catch(error){status('Maison non liée : '+error.message);}
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
  }else if(wanted){
    // Deliberate model selection in house palette updates ONLY this house's
    // WorldArea content; entryPortal still points to its own area + doorAnchor.
    entry=applySculptInteriorTemplate(entry,wanted);
    sculptInteriors=Object.freeze(sculptInteriors.map(e=>e.area.id===entry.area.id?entry:e));
  }
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
  try{worldStorage.setItem(SCULPT_INTERIOR_TEMPLATE_STORAGE,
    JSON.stringify(sculptInteriorTemplates));return true;}
  catch{return false;}
}
function loadSculptTemplates(){
  try{sculptInteriorTemplates=normalizeSculptInteriorTemplates(
    JSON.parse(worldStorage.getItem(SCULPT_INTERIOR_TEMPLATE_STORAGE)||'[]'));}
  catch{sculptInteriorTemplates=Object.freeze([]);}
  refreshSculptTemplateSelector();
}
$('interior-level-select').addEventListener('change',()=>{
  if(sculptWorldCurrentInterior()){
    try{
      const destination=$('interior-level-select').value;
      if(!worldInteriorFloors(sculptWorldDraft,sculptWorldAreaId)
         .some(f=>f.areaId===destination))throw Error('Étage inexistant');
      commitCurrentSculptWorldArea();
      mountWorldSculptArea(destination);
      saveWorldAssemblerDraft(worldStorage,sculptWorldDraft);
      status('Étage '+(worldInteriorFloors(sculptWorldDraft,destination)
        .find(f=>f.areaId===destination)?.label??'lié')+' ouvert et sauvegardé.');
    }catch(error){status('Impossible de changer d’étage : '+error.message);
      updateSculptAreaControls();}
    return;
  }
  const entry=currentSculptInterior();if(!entry)return;
  const floorIndex=Number($('interior-level-select').value);
  const target=sculptInteriors.find(e=>e.buildingId===entry.buildingId&&
    e.floorIndex===floorIndex);
  if(target)changeSculptArea(target.area.id);
});
$('interior-level-add').addEventListener('click',()=>{
  if(sculptWorldCurrentInterior()){
    try{
      commitCurrentSculptWorldArea();
      const newFloor=addWorldInteriorFloor(sculptWorldDraft,sculptWorldAreaId);
      sculptWorldDraft=newFloor.document;
      saveWorldAssemblerDraft(worldStorage,sculptWorldDraft);
      mountWorldSculptArea(newFloor.areaId);
      status('Étage créé et relié par vrais passages aller-retour. Place un escalier/une échelle dans le panneau.');
    }catch(error){status('Étage non créé : '+error.message);}
    return;
  }
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
  if(currentSculptInterior()||sculptWorldCurrentInterior())
    $('interior-layout-apply').click();
});
$('interior-layout-apply').addEventListener('click',()=>{
  if(sculptWorldCurrentInterior()){
    try{
      const area=sculptWorldArea(),shape=$('interior-shape').value;
      const boundary=sculptInteriorBoundary(shape);
      const candidate=normalizeWorldArea({...area,boundary});
      const inside=p=>pointInWorldAreaBoundary(candidate,p.x,p.y);
      if(area.walls.some(w=>!inside(w.a)||!inside(w.b))||
        area.objects.some(o=>!inside(o.transform))||
        area.actors.some(o=>!inside(o))||
        area.spawns.some(p=>!p.anchor&&!inside(p))||
        sculptWorldDraft.portals.some(p=>p.sourceAreaId===area.id&&
          p.trigger?.kind==='point'&&!inside(p.trigger)))
        throw Error('Forme incompatible : déplace les murs, objets, portes ou arrivées situés hors du nouveau sol.');
      commitWorldInteriorAreaPatch({boundary});
      updateSculptAreaControls();fit();
      status('Forme du sol de cet intérieur enregistrée dans la même WorldArea.');
    }catch(error){status('Forme conservée : '+error.message);
      updateSculptAreaControls();}
    return;
  }
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
function setCurrentInteriorBaseMaterial(materialId){
  if(!activeInteriorId&&!sculptWorldCurrentInterior())return;
  if(!interiorFloorMaterials.includes(materialId))return;
  // Single WorldSurface; the existing saveSculptWorldArea owner persists it.
  surface={...surface,baseMaterialId:materialId};
  $('interior-floor-base').value=materialId;
  if(worldInteriorFloorBase)worldInteriorFloorBase.value=materialId;
  loadSurfacePaintAssets();updateSurfaceCount();setTheme();
  status('Sol intérieur choisi : '+materialId+' · conservé dans la WorldArea 2,5D.');
}
$('interior-floor-base').addEventListener('change',()=>
  setCurrentInteriorBaseMaterial($('interior-floor-base').value));
worldInteriorFloorBase?.addEventListener('change',()=>
  setCurrentInteriorBaseMaterial(worldInteriorFloorBase.value));
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
$('interior-area-return').addEventListener('click',()=>{
  if(sculptWorldCurrentInterior()){
    if(worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId))
      $('world-area-return-house').click();
    else $('world-area-return').click();
  }
  else changeSculptArea(SCULPT_EXTERIOR_AREA_ID);
});
$('interior-camera-angle').addEventListener('input',()=>{
  $('interior-camera-value').textContent=$('interior-camera-angle').value+'°';
  if(activeInteriorId||sculptWorldCurrentInterior()){navTerrainCache=null;fit();}
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
      },currentWorldShadowProfiles()));
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
  placedObjects=imported.objects;objectHistory=[];objectRedo=[];objectSelectedId=null;
  if(!sculptWorldDraft){
    sculptStandaloneShadowProfiles=normalizeWorldObjectShadowProfilesV1(imported.objectShadowProfiles);
    shadowProfileHistory=[];shadowProfileRedo=[];
  }
  updateObjectCount();syncObjectSelectedControls();
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
  interiorWallCount:currentInteriorArea()?.walls.length??0,
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
function worldOutboundPortals(){
  return sculptWorldDraft?.portals.filter(p=>p.sourceAreaId===sculptWorldAreaId)??[];
}
// Editor-only target awaiting a tap. The document du monde is not changed until
// placement has passed the native terrain/collision checks.
let sculptWorldPendingPassageTarget=null;
// UI selection/drag ONLY: real coordinates remain in Portal.trigger and Area.spawns.
let selectedWaypointKey=null,waypointDrag=null;
const waypointKey=marker=>marker.kind==='exit'
  ?'portal:'+marker.portalId:'spawn:'+marker.spawnId;
function pickedVisibleWaypoint(point){
  if(!sculptWorldDraft||!Number.isFinite(point?.x)||!Number.isFinite(point?.y))return null;
  let winner=null,nearest=Infinity;
  for(const marker of markersForSculptWorldArea(sculptWorldDraft,
    sculptWorldAreaId,{testing:false})){
    const level=sculptHeightAt(terrain,Math.floor(marker.x/SCULPT_TILE.width),
      Math.floor(marker.y/SCULPT_TILE.height));
    const distance=Math.hypot(point.x-marker.x,
      point.y-(marker.y-level*SCULPT_TILE.rise));
    if(distance<nearest&&distance<=Math.max(24/Math.max(.6,zoom),marker.radius)){
      nearest=distance;winner=marker;
    }
  }
  return winner;
}
function syncObjectWaypoints(){
  const panel=$('object-waypoints-panel');
  if(!panel)return;
  const available=!!sculptWorldDraft&&sculptWorldAreaMounted&&!navigationTesting;
  panel.hidden=!available;
  if(!available)return;
  const markers=markersForSculptWorldArea(sculptWorldDraft,sculptWorldAreaId,{testing:false});
  const selected=$('object-waypoint-select'),old=selectedWaypointKey??selected.value;
  selected.replaceChildren(...markers.map(marker=>{
    const label=marker.kind==='exit'?'🟡 Sortie vers '+marker.label:
      marker.isInitial?'🟣 Départ du monde':'🔵 Arrivée depuis '+marker.label;
    return new Option(label,waypointKey(marker));
  }));
  if(markers.some(marker=>waypointKey(marker)===old))selected.value=old;
  selectedWaypointKey=selected.value||null;
  const current=markers.find(marker=>waypointKey(marker)===selectedWaypointKey);
  if(current?.kind==='exit')$('world-area-portal-select').value=current.portalId;
  else if(current?.spawnId)$('world-area-spawn-select').value=current.spawnId;
  const targetSelect=$('object-waypoint-target'),former=targetSelect.value;
  const targets=sculptWorldDraft.areas.filter(a=>a.id!==sculptWorldAreaId&&
    a.kind==='exterior'&&a.spawns?.length);
  targetSelect.replaceChildren(...targets.map(a=>new Option(a.label??a.id,a.id)));
  if(targets.some(a=>a.id===former))targetSelect.value=former;
  $('object-waypoint-create-button').disabled=!targets.length;
  $('object-waypoint-place').textContent=sculptWorldPortalPlacement===
    (current?.kind==='exit'?'portal':'spawn')
      ?'✕ Annuler le placement':'📍 Placer le repère sur la carte';
  $('object-waypoint-place').disabled=!current||
    (current.kind==='exit'
      ?sculptWorldDraft.portals.find(p=>p.id===current.portalId)?.trigger?.kind!=='point'
      :!!sculptWorldArea()?.spawns.find(p=>p.id===current.spawnId)?.anchor);
  $('object-waypoint-destination').disabled=current?.kind!=='exit';
  // Every incoming Portal is selectable, even when historical maps reused
  // the same Spawn and therefore painted only one arrival ring.
  const arrivals=describeWorldAreaIncomingPortalsForEditorV1(
    sculptWorldDraft,sculptWorldAreaId);
  const arrivalsPanel=$('object-waypoint-arrivals');
  arrivalsPanel.hidden=!arrivals.length;
  const arrivalSelect=$('object-waypoint-arrival-select'),prior=arrivalSelect.value;
  arrivalSelect.replaceChildren(...arrivals.map(link=>
    new Option(link.label+(link.shared?' · arrivée partagée':''),link.portalId)));
  if(arrivals.some(link=>link.portalId===prior))arrivalSelect.value=prior;
  const arrival=arrivals.find(link=>link.portalId===arrivalSelect.value);
  $('object-waypoint-arrival-place').disabled=!arrival?.editable;
  $('object-waypoint-arrival-info').textContent=!arrival?'Aucune entrée reliée à cette carte.':
    !arrival.editable?'Cette arrivée est liée à une porte : modifie la porte propriétaire.':
    arrival.shared?'Ce point est partagé avec une autre entrée ou le départ du monde : une arrivée indépendante sera créée pour ce chemin.':
    'Cette arrivée appartient à ce chemin : place-la au bord de la carte où le héros doit apparaître.';
  $('object-waypoint-feedback').textContent=!current?'Aucun repère ici : crée un passage.':
    $('object-waypoint-place').disabled?'Ce point est attaché à un bâtiment : règle sa porte.':
    'Touche son cercle sur la carte puis glisse-le, ou utilise « Placer ».';
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
  return area?.spawns.find(p=>p.id===$('world-area-spawn-select')?.value)??null;
}
function refreshSculptWorldPanel(){
  const panel=$('world-area-portal-panel');
  if(!sculptWorldDraft||!panel)return;
  const area=sculptWorldArea();if(!area)return;
  // The old coordinate-heavy inspector remains available to existing code,
  // but the official authoring controls now live visibly under Objets.
  panel.hidden=true;
  $('world-area-current-name').textContent=(area.siteKind==='dungeon'?'🗝 ':'🏞 ')+
    (area.label??area.id);
  $('world-area-current-kind').textContent=(area.kind==='interior'
    ?'Instance / donjon':'Région extérieure')+' · '+terrain.width+' × '+terrain.height+' cases';
  const houseReturn=worldInteriorHouseExit(sculptWorldDraft,area.id);
  $('world-area-return-house').hidden=!houseReturn;
  const targetSelect=$('world-area-passages-target'),
        priorTarget=targetSelect.value,
        targetAreas=sculptWorldDraft.areas.filter(other=>other.id!==area.id&&
          other.kind==='exterior'&&other.spawns?.length);
  targetSelect.replaceChildren(...targetAreas.map(other=>
    new Option(other.label??other.id,other.id)));
  if(targetAreas.some(other=>other.id===priorTarget))targetSelect.value=priorTarget;
  $('world-area-passages-create').disabled=!targetAreas.length;
  $('world-area-passages-create').textContent=
    sculptWorldPortalPlacement==='new-portal'?'✕ Annuler la création du passage':
      '＋ Créer un passage aller-retour';
  const choices=worldOutboundPortals(),portalSelect=$('world-area-portal-select'),
        previous=portalSelect.value;
  portalSelect.replaceChildren(...choices.map(p=>{
    const target=sculptWorldDraft.areas.find(a=>a.id===p.targetAreaId);
    return new Option('🚪 → '+(target?.label??p.targetAreaId),p.id);
  }));
  if(choices.some(p=>p.id===previous))portalSelect.value=previous;
  const portal=currentWorldPortal(),hasPortal=!!portal;
  const portalIsFree=hasPortal&&portal.trigger.kind==='point';
  for(const id of ['world-area-portal-place','world-area-portal-save',
    'world-area-portal-x','world-area-portal-y'])$(id).disabled=!portalIsFree;
  for(const id of ['world-area-portal-label','world-area-portal-label-save'])
    $(id).disabled=!hasPortal;
  const destination=portal&&sculptWorldDraft.areas.find(a=>a.id===portal.targetAreaId);
  const targetSpawn=destination?.spawns.find(s=>s.id===portal.targetSpawnId);
  $('world-area-portal-direction').textContent=portal
    ?'🟡 SORTIE depuis '+(area.label??area.id)+' → '+
      (destination?.label??destination?.id??'zone indisponible')+
      ' · 🔵 ARRIVÉE : '+(targetSpawn?.id??'point introuvable')+
      (portalIsFree?' · position libre':' · passage attaché à une porte')
    :'Aucun passage ici. Choisis une carte de destination, puis place la sortie sur le terrain.';
  $('world-area-edit-destination').disabled=!destination;
  $('world-area-portal-x').value=portal?.trigger.kind==='point'?
    String(Math.round(portal.trigger.x)):'';
  $('world-area-portal-y').value=portal?.trigger.kind==='point'?
    String(Math.round(portal.trigger.y)):'';
  $('world-area-portal-label').value=portal?.visual?.label??'';
  const spawnOptions=describeWorldAreaSpawnsForEditorV1(sculptWorldDraft,sculptWorldAreaId);
  const selector=$('world-area-spawn-select'),selected=selector.value;
  selector.replaceChildren(...spawnOptions.map(spawn=>new Option(spawn.label,spawn.id)));
  if(spawnOptions.some(spawn=>spawn.id===selected))selector.value=selected;
  const spawnOption=spawnOptions.find(spawn=>spawn.id===selector.value)??null;
  const spawnEditable=spawnOption?.editable===true&&!!spawnOption.point;
  for(const id of ['world-area-spawn-place','world-area-spawn-save',
    'world-area-spawn-x','world-area-spawn-y'])$(id).disabled=!spawnEditable;
  $('world-area-spawn-x').value=spawnOption?.point?String(Math.round(spawnOption.point.x)):'';
  $('world-area-spawn-y').value=spawnOption?.point?String(Math.round(spawnOption.point.y)):'';
  $('world-area-spawn-select-start').disabled=area.id!==sculptWorldDraft.initialAreaId;
  $('world-area-spawn-info').textContent=!spawnOption
    ?'Aucun point de départ ou d’arrivée défini pour cette zone.'
    :!spawnOption.editable
      ?'Point lié à une porte : sa position appartient au bâtiment et se règle dans Objets > Porte, pas avec un Spawn libre.'
      :spawnOption.initial
        ?'★ Départ principal du monde : déplace-le ici ou directement sur le terrain.'
        :'Point d’arrivée libre : position modifiable sur le terrain.';
  $('world-area-portal-place').textContent=
    sculptWorldPortalPlacement==='portal'?'✕ Annuler le déplacement de sortie':
      '📍 Déplacer la sortie sur la carte';
  $('world-area-spawn-place').textContent=
    sculptWorldPortalPlacement==='spawn'?'✕ Annuler le déplacement du point':
      (spawnOption?.initial?'📍 Déplacer le départ sur la carte':'📍 Déplacer ce point sur la carte');
  $('world-area-marker-pick').textContent=
    sculptWorldPortalPlacement==='select'?'✕ Annuler la sélection':
      '🎯 Sélectionner un repère sur la carte';
  syncObjectWaypoints();
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
  sculptWorldStatus('Sortie enregistrée à X '+position.x+', Y '+position.y+
    ' · destination et arrivée inchangées.');
}
function commitSculptWorldSpawn(point){
  const spawn=selectedWorldSpawn();
  if(!spawn)throw Error('Aucun Spawn sélectionné dans cette zone');
  if(spawn.anchor)throw Error('Ce Spawn est ancré à une porte : modifie la porte dans le bâtiment propriétaire');
  const position=validSculptWorldAuthoringPoint(point);
  sculptWorldDraft=placeSculptWorldSpawn(
    sculptWorldDraft,sculptWorldAreaId,spawn.id,position);
  refreshSculptWorldPanel();
  sculptWorldStatus((spawn.id===sculptWorldDraft.initialSpawnId&&
    sculptWorldAreaId===sculptWorldDraft.initialAreaId?'Départ initial':'Arrivée')+
    ' enregistré à X '+position.x+', Y '+position.y+'.');
}
// A return into the current map should start just INSIDE its source exit,
// not at the first Spawn or in the exit trigger. Validate with the one native
// collision owner. If no offset is safe, keep the already-validated exit point
// and allow the editor to move its own arrival afterwards.
function suggestedSculptReturnArrivalPoint(point){
  const area=sculptWorldArea();
  if(!area)return point;
  const towards=(value,center,distance)=>
    value+Math.sign(center-value)*Math.min(distance,Math.abs(center-value));
  for(const offset of [66,48,30,0]){
    const candidate={x:towards(point.x,area.width/2,offset),
      y:towards(point.y,area.height/2,offset)};
    try{return validSculptWorldAuthoringPoint(candidate);}catch{ /* next candidate */ }
  }
  return validSculptWorldAuthoringPoint(point);
}
function applySculptWorldPointerPlacement(point){
  if(!sculptWorldPortalPlacement)return;
  const mode=sculptWorldPortalPlacement;
  sculptWorldPortalPlacement=null;
  try{
    if(mode==='new-portal'){
      // One atomic authoring action: no orphan Portal if the tap is invalid.
      const target=sculptWorldPendingPassageTarget;
      sculptWorldPendingPassageTarget=null;
      if(!target)throw Error('Choisis une carte de destination');
      const position=validSculptWorldAuthoringPoint(point);
      let next=connectWorldAreas(sculptWorldDraft,{
        sourceAreaId:sculptWorldAreaId,targetAreaId:target,returnPortal:true,
        sourceExitPoint:position,
        returnArrivalPoint:suggestedSculptReturnArrivalPoint(position)
      });
      const portal=next.portals.find(p=>p.sourceAreaId===sculptWorldAreaId&&
        p.targetAreaId===target&&p.trigger.kind==='point');
      if(!portal)throw Error('Passage déjà lié à une porte : ouvre le bâtiment associé');
      next=placeSculptWorldPortal(next,portal.id,position);
      sculptWorldDraft=next;
      refreshSculptWorldPanel();
      $('world-area-portal-select').value=portal.id;
      selectedWaypointKey='portal:'+portal.id;
      syncObjectWaypoints();
      sculptWorldStatus('Passage aller-retour créé : chaque entrée possède son point d’arrivée. Le retour est placé près de cette sortie ; ouvre la carte cible pour placer l’autre arrivée.');
    }else if(mode==='portal')commitSculptWorldPortal(point);
    else if(mode==='spawn')commitSculptWorldSpawn(point);
    else if(mode==='select'){
      const marker=pickSculptWorldEditorMarkerV1(sculptWorldDraft,
        sculptWorldAreaId,point,{radius:36});
      if(!marker)throw Error('Aucun repère proche de ce point. Zoome sur un cercle SORTIE / ARRIVÉE / DÉPART.');
      if(marker.kind==='exit')$('world-area-portal-select').value=marker.portalId;
      else $('world-area-spawn-select').value=marker.spawnId;
      $('world-area-portal-panel').open=true;
      sculptWorldStatus('Repère '+(marker.kind==='exit'?'SORTIE':marker.isInitial?'DÉPART':'ARRIVÉE')+
        ' sélectionné. Choisis Déplacer pour repositionner.');
    }
  }catch(error){sculptWorldStatus(error.message,true);}
  refreshSculptWorldPanel();
}
// Only the Portal HUD preview is cached. The actual traversal still validates
// the destination independently, so no stale readiness can permit entry.
const sculptPortalPreviewReadiness=createSculptPlaySceneReadinessCacheV1(sculptWorldAreaScene);
function sculptWorldPortalAtHero(){
  if(!navigationTesting||!navActor||!sculptWorldDraft)return null;
  return findTriggeredPortal(sculptWorldDraft,sculptWorldAreaId,navActor);
}
function updateSculptWorldPortalAction(){
  const button=$('world-portal-traverse');
  if(!button)return;
  const exits=worldOutboundPortals().filter(p=>p.enabled===true);
  const canConnect=!sculptPlayActive&&!exits.length&&playableExteriorArea(sculptWorldArea());
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
    // Preview once per immutable area and its enclosing draft, instead of
    // importing/normalizing the full destination on EVERY walking frame.
    // The actual transition keeps its own independent validation.
    const readiness=sculptPortalPreviewReadiness(target,sculptWorldDraft);
    if(!readiness.ok){
      if(!sculptPlayActive&&portal.trigger?.kind==='point'&&playableExteriorArea(sculptWorldArea())){
        button.disabled=false;
        button.textContent='🔗 Réparer ce passage';
        button.title='Destination ancienne/incompatible : réparation confirmée au toucher';
      }else{
        button.disabled=true;
        button.textContent='🚪 Passage impossible en 2,5D';
        button.title='Zone cible non compatible : '+readiness.error;
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
    const ghost=waypointDrag?.key===waypointKey(marker)?waypointDrag.preview:null;
    const {x,y}=ghost??marker,radius=marker.radius;
    const selected=selectedWaypointKey===waypointKey(marker);
    const level=sculptHeightAt(terrain,Math.floor(x/SCULPT_TILE.width),
      Math.floor(y/SCULPT_TILE.height));
    const viewY=y-level*SCULPT_TILE.rise;
    const exit=marker.kind==='exit',arrival=marker.kind==='arrival'&&!marker.isInitial;
    const color=exit?'#ffd77a':arrival?'#71d4ff':'#dba7ff';
    const title=exit?'SORTIE → ':arrival?'ARRIVÉE ← ':'DÉPART · ';
    const name=(marker.label??'').slice(0,35);
    const caption=title+name;
    // This ring is EXACTLY the real Portal trigger radius, not an enlarged
    // fake interaction zone. A separate fixed-screen-size label stays legible.
    ctx.beginPath();ctx.arc(x,viewY,radius,0,Math.PI*2);
    ctx.fillStyle=exit?'rgba(255,215,122,.20)':arrival
      ?'rgba(113,212,255,.20)':'rgba(219,167,255,.20)';
    ctx.strokeStyle=color;ctx.lineWidth=(selected?3.6:2.6)/Math.max(zoom,.3);
    ctx.fill();ctx.stroke();
    if(selected){
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
  // Scene-saving validates the WorldDocument before it returns. Always feed
  // the latest family encounter edits into that FIRST validation, otherwise a
  // just-created family can still appear with stale, empty elements and block
  // the save even though the editor shows the author-selected elements.
  const updated=saveSculptWorldArea({
    ...sculptWorldDraft,encounterConfig:sculptEncounterConfig
  },sculptWorldAreaId,captureSculptArea());
  const areas=updated.areas.map(a=>a.id===sculptWorldAreaId
    ?{...a,encounters:sculptExteriorEncounters}:a);
  // One EncounterConfig on the whole document, same Builder commands.
  sculptWorldDraft=createWorldBuilderDraft({
    ...updated,areas,encounterConfig:sculptEncounterConfig
  });
  return sculptWorldDraft;
}
function mountWorldSculptArea(areaId,validatedScene=null){
  sculptWorldAreaMounted=false;
  const area=sculptWorldDraft?.areas.find(a=>a.id===areaId);
  if(!area)throw Error('WorldArea cible absente');
  document.querySelector('header h1').textContent='World Builder · '+(area.label??'Carte');
  document.querySelector('header p').textContent='Un seul monde · deux panneaux · '+area.width/28+' × '+area.height/21+' cases';
  // Use the already validated destination scene after a real Portal. Rebuilding
  // it two or three times on the same transition blocks Android's render thread.
  const scene=validatedScene??sculptWorldAreaScene(area);
  sculptWorldAreaId=areaId;
  activeInteriorId=null;sculptInteriors=Object.freeze([]);
  outsideAreaSnapshot=null;
  mountSculptArea(scene);
  if($('scenery-fringe-panel'))$('scenery-fringe-panel').hidden=
    area.kind!=='exterior'||sculptPlayRequested;
  // The Encounter editor follows the selected Area's actual terrain family.
  // It edits the same single saved EncounterConfig, never a local duplicate.
  selectedSculptEncounterFamilyId=surface.baseTerrainFamilyId;
  sculptWorldAreaMounted=true;
  sculptExteriorEncounters=area.encounters;
  sculptEncounterConfig=sculptWorldDraft.encounterConfig;
  sculptPaintFamilyManuallyChosen=false;
  refreshSculptTerrainFamilySelectors();
  sculptEncounterAreaCache=null;
  if(area.kind==='exterior'){
    if([...$('material').options].some(o=>o.value===area.surface.baseMaterialId))
      $('material').value=area.surface.baseMaterialId;
  }
  updateSculptAreaControls();
  // In native Jouer all authoring panels are hidden. Rebuilding their element
  // lists, thumbnails and portal selectors on every area switch used to
  // synchronously delay the next painted gameplay frame.
  if(!sculptPlayRequested){
    refreshSculptEncounterEditor();
    refreshSculptWorldPanel();
    setTheme(); // Editor-only refresh; mountSculptArea already loaded the texture.
  }
  fit();
}
// One readiness gate for the existing Sculpt art/image promises, never a
// second map loader. It is called only when the native gameplay cover is shown.
async function awaitSculptPlayArtReady(){
  await Promise.all([setTheme(),loadSurfacePaintAssets(),initialRibbonImagesReady,initialSphereImagesReady]);
  const objects=[...placedObjects,...(decorativeFringe?.objects??[])];
  // objectImage is the official renderer's memoized asset source.
  await waitForSculptVisualSetV1(objects.map(o=>o.visual?.assetId)
    .filter(Boolean).map(id=>objectImage(id)));
  const visibleDoors=[...placedObjects].map(o=>
    interiorVisualImages.get(o.visual?.assetId)).filter(Boolean);
  await waitForSculptVisualSetV1(visibleDoors);
  // Atlas images are optional visual enhancements; if unavailable,
  // fall back to the same existing terrain renderer after they settle.
  await Promise.all([
    waitForSculptVisualImageV1(cliffAtlasLoader,{optional:true}),
    waitForSculptVisualImageV1(cliffHDLoader,{optional:true})
  ]);
  navTerrainCache=null;
  scheduleDraw();
  // First final paint is after decoded assets, not before their load callbacks.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
}
const zoneLoadingImages=readCaptureLoadingArtSceneV1({
 href:location.href,scene:'zone',origin:location.origin
});
const zoneLoadingArtCycle=createCaptureLoadingArtCycleV1(zoneLoadingImages);
let sculptPortalLoading=false;
// The native Portal remains the sole loading owner. Capture only receives a
// validated presentation signal to hide its own HUD and parent Shell return.
function reportScopedPlayZoneLoadingV1(visible){
  if(!sculptPlayActive||!playOptions?.sessionId||window.parent===window)return;
  window.parent.postMessage({
    schema:'gensrpg.exploration.play.loading.v1',
    sessionId:playOptions.sessionId,visible
  },window.location.origin);
}
async function traverseSculptWorldPortal(){
  if(sculptPortalLoading)return;
  let portal=sculptWorldPortalAtHero();
  if(!portal){
    if(sculptPlayActive)return; // Gameplay never creates a Portal.
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
  const overlay=sculptPlayActive?$('play-area-loading'):null;
  let crossfade=null;
  if(overlay){
    sculptPortalLoading=true;
    overlay.hidden=false;
    reportScopedPlayZoneLoadingV1(true);
    const sceneArt=zoneLoadingArtCycle.next();
    if(sceneArt){
      // A complete, uncropped foreground on top of the same artwork filling
      // the margins; neither author title nor creature silhouette is cut.
      overlay.style.backgroundImage='url("'+sceneArt+'"),linear-gradient(180deg,#07151d40 20%,#07151ddc 100%),url("'+sceneArt+'")';
      overlay.style.backgroundPosition='center';
      overlay.style.backgroundSize='contain, 100% 100%, cover';
      const idx=zoneLoadingImages.indexOf(sceneArt);
      const ordered=[...zoneLoadingImages.slice(idx),...zoneLoadingImages.slice(0,idx)];
      if(ordered.length>1)crossfade=mountCaptureLoadingArtCrossfadeV1({
        host:overlay,images:ordered,documentRef:document,windowRef:window
      });
    }
    // Yield a real painted frame BEFORE the expensive destination mount.
    await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
  }
  try{
    let target=sculptWorldDraft.areas.find(a=>a.id===portal.targetAreaId);
    let validatedTargetScene=null;
    try{validatedTargetScene=sculptWorldAreaScene(target);}
    catch(error){
      if(sculptPlayActive||portal.trigger?.kind!=='point'||!playableExteriorArea(sculptWorldArea()))throw error;
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
      validatedTargetScene=sculptWorldAreaScene(target);
    }
    // The SAME runtime Portal resolver used by the 2D world document.
    // Gameplay may traverse existing Portals but cannot commit an authored map.
    const document=sculptPlayActive?sculptWorldDraft:commitCurrentSculptWorldArea();
    const transition=applyPortalTransition(document,{
      currentAreaId:sculptWorldAreaId,x:navActor.x,y:navActor.y
    },portal);
    if(!transition)throw Error('Portal / Spawn cible invalide');
    // The destination was validated before we released the current Area.
    // In Jouer, reuse that exact pure scene projection instead of building
    // it THREE times during one Portal transition (Android main-thread stalls).
    // Editor repair can change document bytes, so it always revalidates once.
    const destinationScene=sculptPlayActive&&transition.currentAreaId===target.id
      ?validatedTargetScene
      :sculptWorldAreaScene(document.areas.find(a=>a.id===transition.currentAreaId));
    if(!destinationScene)throw Error('Scene de destination invalide');
    if(navigationTesting)setNavigationTesting(false);
    mountWorldSculptArea(transition.currentAreaId,destinationScene);
    setNavigationTesting(true);
    if(!navActor)throw Error('Zone de destination non praticable');
    if(sculptPlayActive){
      const arrival={...navActor,x:transition.x,y:transition.y};
      if(isBlocked(navigationWorld(),arrival,arrival.x,arrival.y,undefined,navigationContext()))
        throw Error('Spawn cible bloqué par le relief ou un objet');
    }
    navActor.x=transition.x;navActor.y=transition.y;
    navActor.moving=false;
    sculptEncounterController?.resetAnchor();
    navVisualLevel=navHeight();
    centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
    if(sculptPlayActive)persistPlayNavigationCheckpoint();
    sculptWorldStatus('Passage franchi : '+sculptWorldArea().label+
      ' · arrivée par Spawn '+portal.targetSpawnId);
    const feedback=$('world-portal-feedback');
    // The native Portal button is the single persistent travel indicator.
    // A completed arrival is already shown by the new world; avoid a second
    // persistent success banner in Capture play. Errors remain visible.
    feedback.textContent='✓ Arrivée : '+(sculptWorldArea().label??sculptWorldAreaId);
    feedback.dataset.error='false';feedback.hidden=Boolean(sculptPlayActive);
  }catch(error){
    sculptWorldStatus('Passage indisponible : '+error.message,true);
    const feedback=$('world-portal-feedback');
    feedback.textContent='Passage bloqué : '+error.message;
    feedback.dataset.error='true';feedback.hidden=false;
  }finally{
    if(overlay){
      // On successful Portal navigation, retain the SAME cover until the
      // destination's native texture and object images have decoded.
      try{await awaitSculptPlayArtReady();}
      catch(error){
        const feedback=$('world-portal-feedback');
        feedback.textContent='Texture de destination indisponible : '+error.message;
        feedback.dataset.error='true';feedback.hidden=false;
      }
      crossfade?.dispose();
      overlay.hidden=true;
      reportScopedPlayZoneLoadingV1(false);
      sculptPortalLoading=false;
    }
  }
}
function persistPlayNavigationCheckpoint(){
  if(!sculptPlayActive||!navigationTesting||!navActor||!sculptWorldDraft)return false;
  try{
    const committed=playPositionWriter({
      currentAreaId:sculptWorldAreaId,x:navActor.x,y:navActor.y
    });
    // An opt-in scoped consumer may observe the SAME canonical checkpoint.
    // The notification is never allowed to change the result of a save.
    try{
      emitExplorationPlayNavigationCommittedV1({
        target:window,navigation:committed
      });
    }catch(error){
      console.warn('Navigation du joueur enregistrée, notification indisponible',error);
    }
    const output=$('play-save-status');
    if(output){
      // A successful automatic checkpoint must not repeatedly toast over the map.
      // Errors remain visible through the existing native status owner.
      output.textContent=sculptPlayActive&&playOptions?'':'Partie enregistrée';
      output.dataset.error='false';
    }
    if($('play-location'))$('play-location').textContent='🌍 '+
      (sculptWorldArea()?.label||sculptWorldAreaId);
    return true;
  }catch(error){
    const output=$('play-save-status');
    if(output){output.textContent='Sauvegarde impossible : '+error.message;output.dataset.error='true';}
    console.error('Checkpoint de navigation refusé :',error);
    return false;
  }
}
async function installScopedSculptEncounters(world,allowedCreatureIds){
  if(!allowedCreatureIds?.length||!window.frameElement)return;
  let ready;
  try{
    ready=await requestAdventureCombatHostV1(window.frameElement,sculptCombatSessionId,'ready');
  }catch(error){
    console.warn('Rencontres Aventure indisponibles :',error.message);
    return;
  }
  if(ready?.ready!==true)return;
  const context={
    storage:window.sessionStorage,sessionId:sculptCombatSessionId,worldId:world.id,
    authorSha:sculptEncounterSourceBundle.authorSha,engineSha:sculptEncounterSourceBundle.engineSha,
    allowedCreatureIds
  };
  const party=readScopedAdventurePlayingPartyV1(context);
  if(!party)return;
  const release=await acquireAdventureEncounterLeaseV1(window.navigator.locks,sculptCombatSessionId);
  if(!release)throw Error('Cette partie Aventure est déjà ouverte dans un autre onglet');
  window.addEventListener('pagehide',release,{once:true});
  scopedEncounter={context,party,release,armed:false};
}
async function recoverScopedSculptEncounter(pending){
  if(!pending)return;
  if(pending.snapshot.context.areaId!==navigationEncounterArea().id||
     pending.returnState.areaId!==navigationEncounterArea().id)
    throw Error('Zone du combat en attente différente de la sauvegarde');
  if(pending.snapshot.opponents.some(member=>!scopedEncounter.context.allowedCreatureIds.includes(member.creatureId)))
    throw Error('Le combat en attente concerne un adversaire hors Bestiaire autorisé');
  if(pending.result){
    const receipt=await commitScopedSculptEncounter(pending);
    if(!consumeCombatResult(sculptCombatStorage,{sessionId:sculptCombatSessionId,receipt}))
      throw Error('Le journal du combat en attente n’a pas été acquitté');
    status('Résultat du combat récupéré · exploration reprise');
    return;
  }
  if(!sculptEncounterController.restore(pending.snapshot.encounterId))
    throw Error('Le combat en attente ne peut pas être rouvert');
  presentSculptEncounter(pending.snapshot,true);
}
async function installSculptPlayMode(){
  if(!sculptPlayRequested)return;
  document.body.classList.add('sculpt-play-mode');
  const fail=error=>{
    document.body.classList.add('sculpt-play-unavailable','sculpt-immersive');
    $('play-start-error').hidden=false;
    $('play-start-error-message').textContent=error.message;
    $('sculpt-play-boot-mask')?.setAttribute('hidden','');
    document.documentElement.classList.remove('sculpt-play-booting');
    if(playOptions&&window.parent!==window)window.parent.postMessage({
      schema:'gensrpg.exploration.play.failed.v1',
      sessionId:playOptions.sessionId,message:error.message
    },window.location.origin);
    console.error('Lancement Jouer refusé :',error);
  };
  try{
    const world=readWorldAssemblerDraft(worldStorage);
    if(!world)throw Error('Aucun monde enregistré : crée-le dans World Builder avant de jouer.');
    const checkpoint=readExplorationPlay(worldStorage,world,playOptions);
    if(!checkpoint)throw Error('Aucune partie : reviens à Nouvelle partie.');
    // GenSRPG sends ONLY a short-lived projection of the true Combat
    // Bestiary. The native Exploration provider retains every actual
    // creature/element/spawnChance definition, and never invents an entry.
    // Without a grant, keep *all* real-play encounters disabled.
    if(playOptions&&sculptEncounterSourceBundle&&sculptEncounterSource){
      const ids=readScopedAdventurePublishedEncountersV1({
        storage:window.sessionStorage,
        sessionId:playOptions.sessionId,worldId:world.id,
        authorSha:sculptEncounterSourceBundle.authorSha,
        engineSha:sculptEncounterSourceBundle.engineSha
      });
      sculptEncounterCatalog=createCaptureCreatureCatalogProvider(
        sculptEncounterSource,{allowedCreatureIds:ids??[]});
      sculptPlayPublishedCount=ids?.length??0;
      await installScopedSculptEncounters(world,ids);
      if(ids===null)
        console.warn('Rencontres GenSRPG verrouillées : autorisation du Bestiaire officiel absente');
    }
    // Single world, scene, camera, renderer and collision authority: NO new
    // scene graph, competing world graph or authored area copy in save.
    sculptWorldDraft=world;
    sculptEncounterConfig=world.encounterConfig;
    document.body.classList.add('world-area-editing');
    mountWorldSculptArea(checkpoint.currentAreaId);
    // Selection is owned by GenSRPG, visual definitions/media by Exploration.
    // A missing grant preserves old standalone/Jouer saves. A requested but
    // missing/corrupted hero MUST fail visibly, never silently use demo art.
    if(playOptions){
      const selectedId=readScopedAdventureHeroSelectionV1({
        storage:window.sessionStorage,
        sessionId:playOptions.sessionId,worldId:world.id
      });
      if(selectedId)await installAuthoredHeroMapActor(selectedId);
      sculptPlayHeroDisplayName=readScopedAdventureHeroDisplayNameV1({
        storage:window.sessionStorage,
        sessionId:playOptions.sessionId,worldId:world.id
      });
    }
    playPositionWriter=createExplorationPlayProgressWriter(worldStorage,world,playOptions);
    sculptPlayActive=true;
    setImmersive(true);
    setNavigationTesting(true);
    if(!navigationTesting||!navActor)
      throw Error('Aucun emplacement de marche praticable dans cette carte.');
    const pending=scopedEncounter?readCombatHandoff(sculptCombatStorage,{sessionId:sculptCombatSessionId}):null;
    const point={...navActor,x:pending?.returnState.x??checkpoint.x,y:pending?.returnState.y??checkpoint.y};
    if(isBlocked(navigationWorld(),point,point.x,point.y,undefined,navigationContext()))
      throw Error('Position sauvegardée bloquée : corrige le Spawn ou la carte dans World Builder.');
    navActor.x=point.x;navActor.y=point.y;navActor.moving=false;
    navVisualLevel=navHeight();
    centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
    if(pending)await recoverScopedSculptEncounter(pending);
    if(scopedEncounter)scopedEncounter.armed=true;
    // C4: only Exploration renders the guests. The Capture parent can
    // notify this same-origin window of RLS-verified visual positions.
    if(playOptions&&checkpoint.worldFingerprint){
     sculptPeerProjection=createExplorationPeerVisualProjectionV1({
      sessionId:playOptions.sessionId,
      worldId:world.id,worldFingerprint:checkpoint.worldFingerprint
     });
     window.addEventListener(EXPLORATION_PEER_SNAPSHOT_EVENT_V1,
      acceptExplorationPeerSnapshot);
     const peerReady=Object.freeze({
      schema:EXPLORATION_PEER_RECEIVER_READY_EVENT_V1,version:1,
      sessionId:playOptions.sessionId,worldId:world.id,
      worldFingerprint:checkpoint.worldFingerprint
     });
     window.__sculptPeerReceiverReadyV1=peerReady;
     window.dispatchEvent(new CustomEvent(
      EXPLORATION_PEER_RECEIVER_READY_EVENT_V1,{detail:peerReady}
     ));
     window.addEventListener('pagehide',()=>{
      window.removeEventListener(EXPLORATION_PEER_SNAPSHOT_EVENT_V1,
       acceptExplorationPeerSnapshot);
      sculptPeerProjection?.dispose();sculptPeerProjection=null;
      window.__sculptPeerReceiverReadyV1=null;
     },{once:true});
    }
    updateNpcInteraction();
    $('play-menu-button').hidden=false;
    // Capture already presents the selected world outside the playfield.
    // Keep the location read-only for standalone Explorer, not as a second HUD.
    $('play-location').hidden=Boolean(playOptions);
    $('play-location').textContent='🌍 '+(sculptWorldArea()?.label||sculptWorldAreaId);
    const returnToTitle=()=>{
      if(!persistPlayNavigationCheckpoint())return false;
      if(playOptions&&window.parent!==window){
        window.parent.postMessage({
          schema:'gensrpg.exploration.play.return-title.v1',
          sessionId:playOptions.sessionId
        },window.location.origin);
      }else window.location.assign(playOptions?
        './play.html?adventureSession='+encodeURIComponent(playOptions.sessionId):
        './play.html');
      return true;
    };
    $('play-menu-button').addEventListener('click',()=>{
      if(playOptions&&window.parent!==window){
        // One native Explorer menu trigger. The Capture parent owns menu
        // presentation, fullscreen, result UI and the existing return contract.
        window.parent.postMessage({
          schema:'gensrpg.exploration.play.open-menu.v1',
          sessionId:playOptions.sessionId,
          areaLabel:sculptWorldArea()?.label??sculptWorldAreaId
        },window.location.origin);
      }else returnToTitle();
    });
    // Only this Exploration owner can commit the navigation position before
    // its Capture host closes the native iframe. No fake pagehide or direct DOM call.
    window.addEventListener('message',event=>{
      if(event.origin!==window.location.origin||event.source!==window.parent||
         event.data?.sessionId!==playOptions?.sessionId)return;
      if(event.data.schema==='gensrpg.capture.v2.save-and-title.v1')
        returnToTitle();
      else if(event.data.schema==='gensrpg.capture.v2.party-refresh.v1'&&
              scopedEncounter&&!sculptPendingEncounter){
        const latest=readScopedAdventurePlayingPartyV1(scopedEncounter.context);
        if(latest)scopedEncounter.party=latest;
      }
    });
    window.addEventListener('pagehide',persistPlayNavigationCheckpoint,{once:true});
    window.__sculptPlayProbe=()=>Object.freeze({
      active:sculptPlayActive,worldId:sculptWorldDraft?.id??null,
      heroDefinitionId:sculptPlayHeroDefinitionId,
      heroDisplayName:sculptPlayHeroDisplayName,
      heroVisualPrepared:!!navigationActorPreparer.get(navigationActorVisual.assetId),
      areaId:sculptWorldAreaId,playing:navigationTesting,
      creatorCameraAngle:sculptCreatorCameraAngle,
      zoomAdjustable:!$('navigation-camera-zoom').disabled,
      actor:navActor?{x:navActor.x,y:navActor.y}:null,
      remoteActors:sculptPeerProjection?.forArea(sculptWorldAreaId).length??0,
      remoteActorPaints:explorationPeerPaints,
      editorHidden:$('mode-ground').getClientRects().length===0,
      menuVisible:!$('play-menu-button').hidden
    });
    // The same native image/cache owner controls readiness. Do not send
    // "play.ready" while terrain, routes or visible object art can still pop in.
    await awaitSculptPlayArtReady();
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      const cover=$('sculpt-play-boot-mask');
      if(cover)cover.hidden=true;
      document.documentElement.classList.remove('sculpt-play-booting');
      if(playOptions&&window.parent!==window)window.parent.postMessage({
        schema:'gensrpg.exploration.play.ready.v1',
        sessionId:playOptions.sessionId,worldId:world.id,
        areaId:sculptWorldAreaId
      },window.location.origin);
    }));
  }catch(error){
    scopedEncounter?.release();
    scopedEncounter=null;
    sculptPlayActive=false;
    fail(error);
  }
}
function installSculptWorldAreaEditing(){
  if(new URLSearchParams(window.location.search).get('worldAssembler')!=='1')return;
  document.body.classList.add('world-area-editing');
  $('world-workspace-tabs').hidden=false;
  // Preserve the single canonical preset library after moving the waypoint
  // inspector to Objets. A hidden legacy panel must never hide card presets.
  $('object-controls').appendChild($('sculpt-map-preset-panel'));
  $('sculpt-map-preset-panel').open=false;
  $('world-area-portal-panel').open=false;
  const requestedAreaId=new URLSearchParams(window.location.search).get('areaId');
  // The handoff is intentionally consumed once. On a page refresh we
  // restore from the SAME canonical world document saved by World Builder,
  // never from an independent Sculpt scene or parallel WorldGraph.
  const transfer=readWorldAssemblerHandoff(worldSessionStorage)??(()=>{
    const document=readWorldAssemblerDraft(worldStorage);
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
      window.location.assign('./world-assembler.html'+(sculptUniverseId?'?universe='+encodeURIComponent(sculptUniverseId):'')));
    $('world-area-unavailable-create').addEventListener('click',()=>
      window.location.assign('./world-assembler.html?createArea=1'+(sculptUniverseId?'&universe='+encodeURIComponent(sculptUniverseId):'')));
    document.body.classList.add('world-area-unavailable');
    sculptWorldStatus('Session World Builder absente. Retourne au constructeur de mondes.',true);
    return;
  }
  sculptWorldDraft=transfer.document;sculptWorldAreaId=transfer.areaId;
  $('world-area-portal-panel').hidden=false;
  $('new-map-toggle').disabled=false; // dimensions locked inside confirmation, scene reset allowed
  $('import').disabled=true; // standalone Sculpt scene cannot replace a world document
  $('new-map-toggle').title='Créer une carte vierge de même taille sans supprimer les passages';
  // This is a *download*, never a second saved world, autosave key or
  // alternative Portal graph. Even an invalid Portal must not cost an hour
  // of terrain editing. Preserve the raw identities and all other Areas.
  function downloadWorldSculptRecovery(){
    if(!sculptWorldAreaMounted)throw Error('Aucune WorldArea éditée à récupérer');
    const snapshot=snapshotSculptWorldAreaForRecovery(
      sculptWorldDraft,sculptWorldAreaId,captureSculptArea());
    const recovery={...snapshot,
      areas:snapshot.areas.map(a=>a.id===sculptWorldAreaId
        ?{...a,encounters:sculptExteriorEncounters}:a),
      encounterConfig:sculptEncounterConfig};
    const json=JSON.stringify(recovery,null,2)+'\n';
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    const worldId=String(recovery.id??'monde').replace(/[^a-z0-9_-]+/gi,'-');
    const name=worldId+'.world-recovery.json';
    try{
      link.href=url;link.download=name;document.body.append(link);link.click();
    }finally{
      link.remove();URL.revokeObjectURL(url);
    }
    return name;
  }
  function persistCurrentWorldSculpt(){
    // A legacy WorldArea which could not be mounted is read-only. Its canonical
    // original world data is persisted intact; the independent demo canvas is NEVER
    // serialized into the user's zone.
    if(sculptWorldAreaMounted)commitCurrentSculptWorldArea();
    // The single world document is written into its canonical storage key.
    // No independent map/scene key or duplicate portal owner is introduced.
    saveWorldAssemblerDraft(worldStorage,sculptWorldDraft);
    return sculptWorldDraft;
  }
  function saveAndReturnWorldArea({newArea=false}={}){
    try{
      persistCurrentWorldSculpt();
      saveWorldAssemblerHandoff(
        worldSessionStorage,sculptWorldDraft,sculptWorldAreaId);
      window.location.assign('./world-assembler.html?return=1&portalUi=compact1&marker=visible2&maps=presets3'+
        (newArea?'&createArea=1':'')+(sculptUniverseId?'&universe='+encodeURIComponent(sculptUniverseId):''));
    }catch(error){
      let message='Enregistrement bloqué : '+error.message;
      try{
        const file=downloadWorldSculptRecovery();
        message+=' · Copie de secours '+file+' téléchargée (NON validée). '+
          'Conserve ce fichier et ne ferme pas la carte avant de le vérifier.';
      }catch(recoveryError){
        message+=' · Export de secours impossible : '+recoveryError.message+
          '. Garde cette page ouverte et utilise Exporter scène JSON.';
      }
      sculptWorldStatus(message,true);
      const feedback=$('world-portal-feedback');
      feedback.textContent=message;
      feedback.dataset.error='true';feedback.hidden=false;
    }
  }
  $('world-area-unavailable-return').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-area-unavailable-create').addEventListener('click',()=>saveAndReturnWorldArea({newArea:true}));
  $('world-area-return').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-area-return-house').addEventListener('click',()=>{
    try{
      const house=worldInteriorHouseExit(sculptWorldDraft,sculptWorldAreaId);
      if(!house)throw Error('Cette zone ne possède pas de porte extérieure liée');
      persistCurrentWorldSculpt();
      mountWorldSculptArea(house.outsideAreaId);
      saveWorldAssemblerDraft(worldStorage,sculptWorldDraft);
      status('Retour extérieur : carte maison retrouvée, portes et étages conservés.');
    }catch(error){sculptWorldStatus('Retour impossible : '+error.message,true);}
  });
  $('world-workspace-world').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-workspace-return-float').addEventListener('click',()=>saveAndReturnWorldArea());
  $('world-area-create-another').addEventListener('click',()=>saveAndReturnWorldArea({newArea:true}));
  // The header World Builder link must never silently discard pending edits.
  document.querySelector('.world-entry-links a[href="./world-assembler.html"]')
    ?.addEventListener('click',event=>{
      event.preventDefault();
      saveAndReturnWorldArea();
    });
  $('object-waypoint-select').addEventListener('change',()=>{
    selectedWaypointKey=$('object-waypoint-select').value;
    syncObjectWaypoints();scheduleDraw();
  });
  $('object-waypoint-place').addEventListener('click',()=>{
    const key=selectedWaypointKey;
    if(!key)return;
    const mode=key.startsWith('portal:')?'portal':'spawn';
    sculptWorldPortalPlacement=sculptWorldPortalPlacement===mode?null:mode;
    if(sculptWorldPortalPlacement){
      if(mode==='portal')$('world-area-portal-select').value=key.slice(7);
      else $('world-area-spawn-select').value=key.slice(6);
      sculptWorldStatus('Touche le sol pour placer ce repère. Aucun X/Y à saisir.');
    }else sculptWorldStatus('Placement annulé, rien n’a été déplacé.');
    refreshSculptWorldPanel();
  });
  $('object-waypoint-create-button').addEventListener('click',()=>{
    $('world-area-passages-target').value=$('object-waypoint-target').value;
    $('world-area-passages-create').click();
    if(sculptWorldPortalPlacement==='new-portal')
      sculptWorldStatus('Touche l’emplacement de la sortie, retour créé automatiquement.');
  });
  $('object-waypoint-destination').addEventListener('click',()=>{
    if(!selectedWaypointKey?.startsWith('portal:'))return;
    $('world-area-portal-select').value=selectedWaypointKey.slice(7);
    $('world-area-edit-destination').click();
  });
  $('object-waypoint-arrival-select').addEventListener('change',syncObjectWaypoints);
  $('object-waypoint-arrival-place').addEventListener('click',()=>{
    if(navigationTesting){
      sculptWorldStatus('Quitte Tester avant de déplacer une arrivée.',true);return;
    }
    const id=$('object-waypoint-arrival-select').value;
    const arrival=describeWorldAreaIncomingPortalsForEditorV1(
      sculptWorldDraft,sculptWorldAreaId).find(link=>link.portalId===id);
    if(!arrival||!arrival.editable){
      sculptWorldStatus('Arrivée non déplaçable : choisis un passage libre.',true);return;
    }
    try{
      // Split a legacy shared Spawn ONLY on explicit authoring action.
      // No other incoming Portal, saved world-start or building door is moved.
      const next=arrival.shared?
        ensureWorldPortalIndependentArrivalV1(sculptWorldDraft,id):sculptWorldDraft;
      const targetPortal=next.portals.find(portal=>portal.id===id);
      if(!targetPortal||targetPortal.targetAreaId!==sculptWorldAreaId)
        throw Error('Cette arrivée ne correspond plus au passage sélectionné');
      // The decorative fringe captures pointer taps ahead of waypoint placement.
      // Leave its brush mode cleanly before asking for an arrival location.
      if(fringeEditing){
        fringeEditing=false;
        $('scenery-fringe-toggle').checked=false;
        updateHistoryButtons();
      }
      sculptWorldDraft=next;
      $('world-area-spawn-select').value=targetPortal.targetSpawnId;
      selectedWaypointKey='spawn:'+targetPortal.targetSpawnId;
      sculptWorldPortalPlacement='spawn';
      refreshSculptWorldPanel();
      sculptWorldStatus('🔵 Arrivée depuis '+arrival.label.slice(7)+
        ' : touche le sol à l’endroit où le héros doit apparaître. Les autres arrivées restent inchangées.');
    }catch(error){sculptWorldStatus(error.message,true);}
  });
  $('world-area-portal-select').addEventListener('change',refreshSculptWorldPanel);
  $('world-area-spawn-select').addEventListener('change',refreshSculptWorldPanel);
  $('world-area-passages-create').addEventListener('click',()=>{
    if(navigationTesting){sculptWorldStatus('Quitte Tester pour créer un passage.',true);return;}
    if(sculptWorldPortalPlacement==='new-portal'){
      sculptWorldPortalPlacement=null;sculptWorldPendingPassageTarget=null;
      refreshSculptWorldPanel();sculptWorldStatus('Création annulée. Aucun passage ajouté.');return;
    }
    const target=$('world-area-passages-target').value;
    if(!sculptWorldDraft.areas.some(a=>a.id===target&&a.kind==='exterior'&&a.spawns?.length)){
      sculptWorldStatus('Choisis une destination jouable avec un point d’arrivée.',true);return;
    }
    // A decorative-brush gesture otherwise captures the tap first.
    // Leave authored fringe and its undo stack untouched.
    if(fringeEditing){
      fringeEditing=false;
      $('scenery-fringe-toggle').checked=false;
      updateHistoryButtons();
    }
    sculptWorldPendingPassageTarget=target;
    sculptWorldPortalPlacement='new-portal';
    $('world-area-portal-panel').open=false;
    refreshSculptWorldPanel();
    sculptWorldStatus('Touche le sol à l’endroit où placer la sortie vers la carte choisie.');
  });
  $('world-area-marker-pick').addEventListener('click',()=>{
    if(navigationTesting){sculptWorldStatus('Quitte Tester avant de sélectionner un repère.',true);return;}
    sculptWorldPortalPlacement=sculptWorldPortalPlacement==='select'?null:'select';
    if(sculptWorldPortalPlacement)$('world-area-portal-panel').open=false;
    refreshSculptWorldPanel();
    sculptWorldStatus(sculptWorldPortalPlacement
      ?'Touche un cercle SORTIE, ARRIVÉE ou DÉPART pour le sélectionner.':'Sélection annulée.');
  });
  $('world-area-spawn-select-start').addEventListener('click',()=>{
    if(sculptWorldAreaId!==sculptWorldDraft.initialAreaId){
      sculptWorldStatus('Ouvre d’abord la zone marquée ★ Départ dans le World Builder.',true);return;
    }
    try{
      // A door-linked old start remains intact; add an automatically-ID'd
      // movable initial Spawn rather than detaching the building's doorway.
      sculptWorldDraft=ensureFreeWorldInitialSpawnV1(sculptWorldDraft);
      refreshSculptWorldPanel();
      $('world-area-spawn-select').value=sculptWorldDraft.initialSpawnId;
      sculptWorldPortalPlacement='spawn';
      $('world-area-portal-panel').open=false;
      refreshSculptWorldPanel();
      sculptWorldStatus('★ Touche le nouveau départ sur la carte jouable (terrain sec).');
    }catch(error){sculptWorldStatus(error.message,true);}
  });
  $('world-area-edit-destination').addEventListener('click',()=>{
    const portal=currentWorldPortal();
    if(!portal){sculptWorldStatus('Sélectionne d’abord une sortie.',true);return;}
    try{
      persistCurrentWorldSculpt();
      const target=portal.targetAreaId;
      if(!sculptWorldDraft.areas.some(a=>a.id===target))throw Error('Zone cible indisponible');
      saveWorldAssemblerHandoff(worldSessionStorage,sculptWorldDraft,target);
      const url=new URL(window.location.href);
      url.searchParams.set('worldAssembler','1');
      url.searchParams.set('areaId',target);
      // Read-only editor focus: the real destination remains the existing
      // Portal.targetSpawnId in the document du monde, not a new arrival marker.
      url.searchParams.set('arrivalSpawnId',portal.targetSpawnId);
      window.location.assign(url.href);
    }catch(error){sculptWorldStatus('Zone cible : '+error.message,true);}
  });
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
  // Persist on refresh/navigation as well; the landing screen can recover
  // the selected area using areaId and this exact world document.
  window.addEventListener('pagehide',()=>{
    try{persistCurrentWorldSculpt();}
    catch(error){console.warn('WorldArea non sauvegardée au changement de page :',error);}
  },{once:true});
  try{
    mountWorldSculptArea(transfer.areaId);
    const arrivalId=new URL(window.location.href).searchParams.get('arrivalSpawnId');
    const selectedArrival=sculptWorldArea().spawns.find(p=>p.id===arrivalId);
    if(selectedArrival&&!selectedArrival.anchor){
      $('world-area-spawn-select').value=selectedArrival.id;
      sculptWorldPortalPlacement='spawn';
      $('world-area-portal-panel').open=false;
      refreshSculptWorldPanel();
      sculptWorldStatus('Touche le terrain pour placer l’arrivée de ce passage. La destination est déjà reliée.');
    }else if(selectedArrival?.anchor){
      sculptWorldStatus('Arrivée liée à une porte : modifie sa position sur le bâtiment.',true);
    }else sculptWorldStatus('WorldArea '+sculptWorldArea().label+
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
  const gallery=$('sculpt-map-preset-gallery');
  // The frozen V80 layout has no authored map-preset palette.
  // Preserve its editor without a second interface or hidden DOM clones.
  if(!gallery)return;
  const presetStatus=(message,error=false)=>{
    const label=$('sculpt-map-preset-status');
    label.textContent=message;label.style.color=error?'#ffccbb':'#b7f2d6';
    status(message);
  };
  function refresh(selectedId){
    try{
      const official=builtinSculptMapPresets(),personal=readSculptMapPresets(worldStorage);
      const library=[...official,...personal];
      const previous=selectedId??gallery.dataset.selectedId;
      renderSculptMapPresetChoicesV1({
        gallery,official,personal,
        selectedId:previous
      });
      const available=!!gallery.dataset.selectedId;
      $('sculpt-map-preset-apply').disabled=!available;
      $('sculpt-map-preset-export').disabled=!available;
      const local=personal.some(p=>p.id===gallery.dataset.selectedId)&&
        !official.some(p=>p.id===gallery.dataset.selectedId);
      $('sculpt-map-preset-delete').disabled=!local;
      $('sculpt-map-presets-clear').disabled=personal.length===0;
      $('sculpt-map-preset-count').textContent=personal.length+' carte(s) personnelle(s)';
      return library;
    }catch(error){presetStatus(error.message,true);return [];}
  }
  const selected=()=>listAvailableSculptMapPresets(worldStorage).find(p=>p.id===gallery.dataset.selectedId);
  gallery.addEventListener('change',()=>{
    // Preserve card focus while reflecting the chosen template. Rebuilding
    // all buttons on every tap hides keyboard focus on mobile/desktop.
    for(const card of gallery.querySelectorAll('.map-preset-card'))
      card.setAttribute('aria-pressed',String(card.dataset.presetId===gallery.dataset.selectedId));
    const available=!!gallery.dataset.selectedId;
    $('sculpt-map-preset-apply').disabled=!available;
    $('sculpt-map-preset-export').disabled=!available;
    const official=builtinSculptMapPresets();
    $('sculpt-map-preset-delete').disabled=!readSculptMapPresets(worldStorage)
      .some(p=>p.id===gallery.dataset.selectedId)||official.some(p=>p.id===gallery.dataset.selectedId);
    const preset=selected();
    presetStatus(preset
      ?'Modèle « '+preset.name+' » sélectionné, mais pas encore chargé sur la carte.'
      :'Aucun modèle choisi. La carte affichée reste inchangée.');
  });
  $('sculpt-map-preset-save').addEventListener('click',()=>{
    try{
      const name=$('sculpt-map-preset-name').value.trim();
      if(builtinSculptMapPresets().some(p=>p.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr')))
        throw Error('Ce nom appartient à un modèle fourni : choisis un nouveau nom pour ta copie.');
      const existing=readSculptMapPresets(worldStorage)
        .find(p=>p.name.toLocaleLowerCase('fr')===name.toLocaleLowerCase('fr'));
      if(existing&&!window.confirm('Remplacer le préset « '+existing.name+' » ?'))return;
      const preset=saveSculptMapPreset(worldStorage,captureSculptArea(),name);
      refresh(preset.id);
      presetStatus('Carte « '+preset.name+' » enregistrée. Réutilisable dans le World Builder.');
    }catch(error){presetStatus(error.message,true);}
  });
  $('sculpt-map-preset-delete').addEventListener('click',()=>{
    try{
      const personal=readSculptMapPresets(worldStorage);
      const preset=personal.find(p=>p.id===gallery.dataset.selectedId);
      if(!preset)throw Error('Choisis une carte personnelle : les cartes fournies sont protégées.');
      if(!window.confirm('Supprimer uniquement ta carte locale « '+preset.name+
        ' » de cet appareil ? Aucun monde ou sauvegarde ne sera effacé.'))return;
      deleteSculptMapPreset(worldStorage,preset.id);
      refresh('');
      presetStatus('Carte personnelle « '+preset.name+' » supprimée de cet appareil.');
    }catch(error){presetStatus(error.message,true);}
  });
  $('sculpt-map-presets-clear').addEventListener('click',()=>{
    try{
      const personal=readSculptMapPresets(worldStorage);
      if(!personal.length){presetStatus('Aucune carte personnelle à retirer.');return;}
      if(!window.confirm('Supprimer les '+personal.length+
        ' cartes personnelles enregistrées sur CET appareil ? Cela ne touche ni aux cartes fournies, ni à tes mondes, ni à tes sauvegardes. Exporte au besoin tes modèles avant de continuer.'))return;
      const count=clearPersonalSculptMapPresets(worldStorage);
      refresh('');
      presetStatus(count+' carte(s) personnelle(s) supprimée(s). Les cartes fournies sont intactes.');
    }catch(error){presetStatus(error.message,true);}
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
      if($('sculpt-map-preset-loaded'))
        $('sculpt-map-preset-loaded').textContent=
          'Carte affichée : « '+preset.name+' » CHARGÉE · relief, textures et objets du modèle. Les passages, les rencontres et le héros de la partie restent indépendants.';
      presetStatus('Carte « '+preset.name+' » chargée et affichée. Les réglages de la zone restent conservés séparément.');
    }catch(error){presetStatus(error.message,true);}
  });
  $('sculpt-map-preset-export').addEventListener('click',()=>{
    try{
      const preset=selected();if(!preset)throw Error('Choisis un préset à exporter');
      const blob=new Blob([JSON.stringify(preset,null,2)],{type:'application/json'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      link.href=url;link.download=preset.name.replace(/[^a-z0-9-_]+/gi,'-')+'.map-preset.json';
      document.body.append(link);link.click();link.remove();URL.revokeObjectURL(url);
      presetStatus('Préset JSON exporté.');
    }catch(error){presetStatus(error.message,true);}
  });
  $('sculpt-map-preset-import').addEventListener('change',async event=>{
    const input=event.currentTarget,file=input.files?.[0];if(!file)return;
    try{
      const imported=importSculptMapPreset(await file.text());
      const existing=readSculptMapPresets(worldStorage).find(p=>
        p.name.toLocaleLowerCase('fr')===imported.name.toLocaleLowerCase('fr'));
      if(existing&&!window.confirm('Remplacer le préset « '+existing.name+' » ?'))return;
      if(builtinSculptMapPresets().some(p=>p.name.toLocaleLowerCase('fr')===imported.name.toLocaleLowerCase('fr')))
        throw Error('Le nom de ce préset est réservé à une carte fournie : renomme le préset avant import.');
      const saved=addImportedSculptMapPreset(worldStorage,imported);
      refresh(saved.id);presetStatus('Préset « '+saved.name+' » importé.');
    }catch(error){presetStatus('Import refusé : '+error.message,true);}
    finally{input.value='';}
  });
  refresh();
}

selectMode('dig');
setEditorKind('ground');
if(window.matchMedia?.('(pointer: coarse)').matches){
  $('precision-mode').checked=true;
}
updatePrecisionActions();
updateHistoryButtons();updateSurfaceCount();loadSculptTemplates();setTheme();
initialRibbonImagesReady=setupRibbons();initialSphereImagesReady=loadSphereWallImages();
// All synchronously declared renderer/world/camera owners now exist. Asynchronous
// images arriving earlier will be included in this first canonical draw.
sculptBootReady=true;fit();
// The SAME canonical Portal action must be wired in both World Builder Tester
// and native scoped Jouer. The former editor-only registration left an
// enabled-looking door button inert in real play.
// Frozen V80 does not include the WorldArea Portal button. Modern Sculpt
// keeps its canonical action; the legacy editor must still boot completely.
$('world-portal-traverse')?.addEventListener('click',traverseSculptWorldPortal);
installSculptWorldAreaEditing();
installSculptPlayMode();
installSculptMapPresetPalette();
