// Self-contained optional heightfield experiment. Never changes the live 2D Builder.
import {createMaterialRegistry} from './materials/material-registry.js';
import {materialPackV1} from './materials/material-pack-v1.js';
import {resolveMaterialAsset} from './assets/material-asset-adapter.js';
import {createSculptTerrain,sculptDemo,applySculptStroke,applySculptWaterStroke,sculptWaterAt,serializeSculptTerrain,importSculptTerrain,sculptHeightAt,sculptFaces,appendSculptSphere,removeSculptSphereAt,sculptSphereAt,sculptSphereDisplacementAt} from './world/sculpt-height-model.js?rev=sphere-frustum-v76-r9';
import {SCULPT_TILE,drawSculptTerrain,drawSculptBrushPreview,SCULPT_PREVIEW_RIBBONS} from './render/sculpt-height-renderer.js?rev=sculpt-whole-hill-v61-sphere-v76-volume-r2-frustum-r9-depth-r11-altitude-r12-grass-corners-hero-r13-square-corners-r14';
import {drawSculptSphereCursor} from './render/sculpt-sphere-mesh.js?rev=real-spherical-v76-volume-r2-frustum-r9-depth-r11-altitude-r12';
import {resolveSculptCliffAtlasUrl} from './render/sculpt-cliff-atlas.js';
import {resolveSculptCliffHDUrl,sculptCliffHDReady} from './render/sculpt-cliff-hd.js';
import {sculptCameraView,sculptCameraProject,sculptCameraProjectBridgeFoot,sculptCameraProjectBridgeCorridor,sculptCameraWorldInput,sculptCameraBounds,sculptCameraScreenToWorld,sculptCameraGameView} from './render/sculpt-camera-projection.js?rev=bridge-input-v66';
import {drawSculptSkyBackdrop} from './render/sculpt-sky-backdrop.js';
import {stepMovement} from './core/movement.js?rev=bridge-grade-v69-deck-v70-rails-v71-north-r2-sphere-v76-stairs-v78';
import {SCULPT_NAVIGATION_PROBE_DEFAULTS,sculptNavigationSample,sculptNavigationBlockDetail,sculptSphereProjectionBlock,sculptBridgeDeckAt,sculptBridgeDeckHeight} from './core/sculpt-navigation-collision.js?rev=sculpt-stairs-dynamic-height-v78';
import {sculptStairHeightAt} from './core/sculpt-stair-traversal.js';
import {sculptPreviewCollisionCatalog} from './core/sculpt-preview-object-collisions.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71';
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
import {objectDefinitionCatalogV1} from './objects/object-definition-catalog.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71-waterfalls-v3';
import {resolveWorldObjectPlacements} from './world/world-object-placement-model.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71-waterfalls-v3';
import {sculptObjectVisualRect,findSculptVisualObjectAtPoint} from './render/sculpt-object-picking.js?rev=sculpt-bridge-deck-anchor-v67-deck-v70-rails-v71-directions-v72-stairs-dynamic-v78';
import {sculptBridgeForegroundRegions,sculptBridgeVisualFootLift,sculptBridgeDeckArtShift} from './render/sculpt-bridge-deck-layers.js?rev=sculpt-bridge-deck-anchor-v67-mask-v68-vertical-v73';
import {isBlocked} from './core/collision.js?rev=sculpt-bridge-crossing-v60-deck-v70-rails-v71-north-r2-sphere-v76-stairs-v78';
import {sculptObjectCanOccupyCell,listSculptPlaceableDefinitions,appendSculptPreviewObject,
  updateSculptPreviewObject,sculptPreviewVariants,
  removeSculptPreviewObject,findSculptPreviewObjectNear,serializeSculptPreviewScene,
  importSculptPreviewScene,createBlankSculptPreviewScene,
  appendSculptPreviewActor,removeSculptPreviewActorAt,
  findSculptPreviewActorNear,updateSculptPreviewActor} from './world/sculpt-scene-preview.js?rev=sculpt-bridge-tactile-v64-deck-v70-rails-v71-axes-v72-waterfalls-v3-stairs-visible-r15';
import {createSculptSurface,appendSculptSurfaceStroke,removeSculptSurfaceAt,
  SCULPT_SURFACE_MATERIALS} from './world/sculpt-surface-paint.js';

const $=id=>document.getElementById(id);
const canvas=$('sculpt-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const registry=createMaterialRegistry(materialPackV1);
let terrain=sculptDemo(),selectedMode='dig',drawing=false,strokeUndo=null;
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
let surfaceStrokePoints=[],surfaceLastCell='',surfaceHistory=[],surfaceRedo=[];
const surfacePaintImages=new Map();
let objectSelectedId=null,objectDrag=null;
const objectImages=new Map(),availableObjects=listSculptPlaceableDefinitions();
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
// Display-only altitude, separate from native Collision World coordinates.
let navVisualLevel=null;
const navKeys=new Set();
// Preview-only navigation speed; authoritative runtime movement remains unchanged.
const navSpeed=()=>Math.max(90,Math.min(360,Number($('navigation-speed').value)||220));
let navViewport=null,navLastState='',navBlocked=false,navBlockReason=null;
let navFps=0,navStepSpeed=0,navMetricLast=0,navMetricFrames=0,navMetricDistance=0;
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
  const rockPalette=$('rock').value,materialId=$('material').value;
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
const sculptGroundMaterials=Object.freeze(['grass.forest','ground.forest_floor',
  'ground.mountain_rock','ground.snow','ground.sand','ground.volcanic_ash_lava']);
const sculptWaterMaterials=Object.freeze(['water.clear_blue','water.turquoise',
  'water.forest_stream','water.swamp']);
const images=new Map();
const themes=sculptGroundMaterials;
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
  const id=$('material').value;
  if(!themes.includes(id))return;
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
function cameraView(){return navigationTesting
  ?sculptCameraGameView(Number($('navigation-camera-angle').value))
  :sculptCameraView($('camera-view').value);}
function cameraBounds(){
  return sculptCameraBounds(cameraView(),terrain.width*SCULPT_TILE.width,
    terrain.height*SCULPT_TILE.height,7*SCULPT_TILE.rise);
}
function fit(){
  const {width,height}=dimensions();
  const bounds=cameraBounds();
  zoom=Math.max(.32,Math.min(1.6,Math.min((width-30)/bounds.width,(height-20)/bounds.height)));
  $('zoom').value=String(Math.round(zoom*100));
  if(navigationTesting)centerNavigationCamera();
  else center();
  scheduleDraw();
}
function center(){
  const {width,height}=dimensions(),bounds=cameraBounds();
  pan={x:Math.round((width-bounds.width*zoom)/2),
    y:Math.round((height-bounds.height*zoom)/2-bounds.minY*zoom)};
}
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
    const material=registry.require($('material').value,'surface');
    result=drawSculptTerrain(ctx,{terrain,material,texture:currentTexture,
      rockPalette:$('rock').value,cliffAtlas:cliffAtlasImage,cliffHD:cliffHDImage,
      cliffMoss:$('rock-moss')?.checked,
      sphereWallImages,overlays:ribbonTextures,paintSurface:surface,paintImages:surfacePaintImages});
  }
  lastRenderStats=result;
  if(navigationTesting){
    // V57: the collision-owned deck identifies which bridge actually carries
    // the hero. One bridge sprite is split into backdrop and near-rail pass.
    const deckBridge=activeSculptBridge();
    const underBridge=navActor&&!deckBridge?resolvedSculptBridges().find(bridge=>
      sculptBridgeDeckAt([bridge],navActor.x,navActor.y,
        Math.max(0,Number(navActor.radius)||0))):null;
    const layeredBridge=deckBridge??underBridge;
    drawPreviewObjects(navActor?.y??Infinity,-Infinity,layeredBridge?.id);
    drawPlacedActors(navActor?.y??Infinity);
    if(deckBridge)drawPreviewObject(deckBridge);
    drawNavigationActor();
    if(deckBridge)drawPreviewObject(deckBridge,{foregroundRailOnly:true});
    // Ground-level traffic is physically BELOW the entire bridge, not just
    // behind its low front rail. Do not promote it to the deck in the renderer.
    if(underBridge)drawPreviewObject(underBridge);
    if($('navigation-show-bridge-corridor')?.checked)drawNavigationBridgeCorridors();
    drawPreviewObjects(Infinity,navActor?.y??Infinity,layeredBridge?.id);
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
  previewSummary=null;
  const precisionOn=$('precision-mode').checked;
  const displayCell=precisionOn?precisionCell:hoverCell;
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
    }else previewSummary=drawSculptBrushPreview(ctx,{terrain:base,points,
      radius:Number($('radius').value),strength:Number($('strength').value),
      shape:$('brush-shape').value,edgeSoftness:Number($('edge').value)/100,mode:selectedMode,target,
      zoom});
  }
  $('stats').textContent=terrain.width+' × '+terrain.height+' cases · '+result.faceCount+
    ' parois ('+result.faceRuns+' sections) · '+Math.round(zoom*100)+' %';
  $('brush-info').textContent=displayCell ?
    (precisionOn?'Visée ('+(displayCell.x+1)+','+(displayCell.y+1)+') · ':'Pinceau : ')+
    (previewSummary?.cells??0)+' case(s) · '+selectedMode+
    (selectedMode==='plateau'?' niveau '+$('target').value:selectedMode.startsWith('water-')?' eau '+$('water-target').value:'')+
    (precisionOn?' · appuie sur Appliquer pour sculpter':' · bord '+$('edge').value+' %') :
    precisionOn?'Placement précis : vise au doigt sans modifier le terrain, puis confirme':'Déplace le pointeur ou touche le terrain : empreinte visible avant la sculpture';
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
  // Pick the exposed top face, not a static projected pixel geometry.
  for(let row=terrain.height-1;row>=0;row--){
    const top=row*SCULPT_TILE.height-sculptHeightAt(terrain,col,row)*SCULPT_TILE.rise;
    if(y>=top&&y<=top+SCULPT_TILE.height)return {x:col,y:row};
  }
  const row=Math.floor(y/SCULPT_TILE.height);
  return row>=0&&row<terrain.height?{x:col,y:row}:null;
}
function status(message){$('notice').textContent=message;}

function updatePrecisionActions(){
  const enabled=!navigationTesting&&!objectEditing&&!surfaceEditing&&$('precision-mode').checked;
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
  const nextKind=mode.startsWith('water-')?'water':'ground';
  selectedMode=mode;
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
  if(precisionDragging){
    const next=screenToCell(event);
    if(next){precisionCell=next;hoverCell=next;updatePrecisionActions();}
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
      materialId:$('surface-material').value,points:surfaceStrokePoints,
      width:Number($('surface-width').value)*SCULPT_TILE.width
    });
    surfaceStrokePoints=[];
    surfaceCommit(changed);return;
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
  return {width:terrain.width*SCULPT_TILE.width,
    height:terrain.height*SCULPT_TILE.height,objects:placedObjects,obstacles:[]};
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
      .filter(o=>o.kind==='stairs');
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
      shoreEntryFraction:.14,bridges:resolvedSculptBridges(),stairs:resolvedSculptStairs()}};
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
  if(reason.kind==='stair-edge')return 'escalier : accès uniquement par une extrémité praticable';
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
    resolvedSculptStairs(),navActor.sculptStairId,navActor.x,navActor.y,
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
  // Start in an area known to be dry in the default demo; valid for a
  // user-imported terrain too, because the fallback searches dry cells.
  const preferred=[[3,3],[2,2],[terrain.width-3,2],[2,terrain.height-3]];
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
  if(navPreviousTime!==null){
    const elapsed=Math.max(0,time-navPreviousTime);
    const rawIntent=navigationInput();
    // Joystick and keyboard are screen-relative; Collision World still
    // receives a normal, single-authority X/Y world movement intention.
    const intent=sculptCameraWorldInput(cameraView(),rawIntent.x,rawIntent.y);
    navMetricFrames++;
    navVisualTime+=Math.min(250,elapsed)/1000;
    if(elapsed>0&&Math.hypot(intent.x,intent.y)>.13){
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
  if(on){
    if(objectEditing)setObjectEditing(false); // keep object palette out of the walking HUD
    if(surfaceEditing)setSurfaceEditing(false);
    navActor=navigationSpawn();
    if(!navActor){status('Aucune case sèche disponible pour le test');return;}
    navigationTesting=true;
    navViewport={zoom,pan:{...pan}};
    navKeys.clear();navBlocked=false;navBlockReason=null;navLastState='';
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
    $('navigation-metrics').textContent='Mesure de fluidité en cours…';
    centerNavigationCamera();
    updatePrecisionActions();updateNavigationInfo(true);
    navPreviousTime=null;navFrame=requestAnimationFrame(navigationTick);
    status('Test de navigation : joystick à maintenir · vitesse réglable dans la palette de droite.');
  }else{
    navigationTesting=false;
    cancelAnimationFrame(navFrame);navFrame=0;navPreviousTime=null;
    navStick?.dispose();navStick=null;navKeys.clear();
    document.body.classList.remove('navigation-testing');
    $('navigation-hud').hidden=true;$('navigation-stick').hidden=true;
    $('navigation-toggle').textContent='🚶 Tester';
    $('navigation-toggle').setAttribute('aria-pressed','false');
    if(navViewport){zoom=navViewport.zoom;pan=navViewport.pan;}
    $('zoom').value=String(Math.round(zoom*100));
    navActor=null;navViewport=null;navBlocked=false;navBlockReason=null;navTerrainCache=null;
    navVisualLevel=null;
    navLastVisualPaint=-Infinity;
    updatePrecisionActions();scheduleDraw();
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
  setNavigationTesting(!navigationTesting);
});
$('navigation-reset').addEventListener('click',()=>{
  if(!navigationTesting)return;
  navActor=navigationSpawn();
  navVisualLevel=navHeight();
  const mode=$('navigation-locomotion').value;
  navActor.locomotion={modes:mode==='fly'?['fly']:mode==='swim'?['ground','swim']:['ground']};
  navBlocked=false;centerNavigationCamera();updateNavigationInfo(true);scheduleDraw();
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
window.__sculptNavProbe=()=>Object.freeze({
  enabled:navigationTesting,player:navActor?{x:navActor.x,y:navActor.y,
    level:navHeight(),locomotion:[...navActor.locomotion.modes]}:null,
  blocked:navBlocked,blockReason:navBlockReason,maxStep:navigationMaxStep(),
  speed:navSpeed(),zoom,fps:navFps,actualSpeed:navStepSpeed,
  terrainCached:!!navTerrainCache,joystickAttached:!!navStick,activeFrames:navFrame>0,
  actorMotion:navActor?.moving?'walk':'idle',
  deckBridgeId:activeSculptBridge()?.id??null,
  stairId:navActor?.sculptStairId??null,stairHeight:navActor?navHeight():null,
  physicalBridgeLayer:navActor?.sculptBridgeId?'deck':'ground',
  bridgeCorridorVisible:$('navigation-show-bridge-corridor')?.checked??false,
  actorPrepared:!!navigationActorPreparer.get(navigationActorVisual.assetId),
  actorMotionTime:navVisualTime,actorVisualLevel:navVisualLevel,
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
  const art=objectImage(object.visual?.assetId);
  if(!art||(art instanceof Image&&!art.complete)||
     !(art.naturalWidth??art.width))return;
  const rect=sculptObjectVisualRect(object,terrain,{
    tileWidth:SCULPT_TILE.width,tileHeight:SCULPT_TILE.height,rise:SCULPT_TILE.rise});
  const {width,height}=rect;
  const artShift=sculptBridgeDeckArtShift(rect,object);
  const point=navigationTesting?sculptCameraProject(cameraView(),rect.x,rect.y):rect;
  ctx.save();ctx.translate(point.x,point.y);ctx.rotate(rect.angle);
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
function drawPreviewObjects(maxY=Infinity,minY=-Infinity,skipBridgeId=null){
  const objects=resolveWorldObjectPlacements(placedObjects,objectDefinitionCatalogV1)
    .filter(o=>o.transform.y<=maxY&&o.transform.y>minY&&o.id!==skipBridgeId)
    .sort((a,b)=>a.transform.y-b.transform.y);
  for(const object of objects)drawPreviewObject(object);
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
  const passageMode=bridgeMode||stairMode;
  $('object-scale-wrap').hidden=passageMode;
  $('object-bridge-length-wrap').hidden=!passageMode;
  $('object-bridge-width-wrap').hidden=!passageMode;
  $('object-bridge-length-wrap').firstChild.textContent=stairMode?'🪜 Longueur ':'🌉 Longueur ';
  $('object-bridge-width-wrap').firstChild.textContent=stairMode?'🪜 Largeur ':'🌉 Largeur ';
  $('object-scale').max=passageMode?'300':'120';
  $('object-bridge-length').setAttribute('aria-label',stairMode
    ?'Longueur de l’escalier, peut relier plusieurs hauteurs'
    :'Longueur du pont sans élargir le passage');
  $('object-bridge-width').setAttribute('aria-label',stairMode
    ?'Largeur du passage dans l’escalier'
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
function syncObjectSelectedControls(){
  const selected=placedObjects.find(o=>o.id===objectSelectedId);
  if(!selected){objectSelectedId=null;$('object-selected').textContent='Aucun objet sélectionné';return;}
  const def=objectDefinitionCatalogV1.get(selected.objectDefinitionId);
  $('object-category').value=def.kind;refreshObjectOptions();
  $('object-definition').value=def.id;
  refreshObjectVariants(selected.overrides.visualVariantId);
  $('object-scale').value=String(Math.round(selected.transform.scaleX*100));
  $('object-scale-value').textContent=$('object-scale').value+' %';
  $('object-bridge-length').value=String(Math.round((def.kind==='stairs'?selected.transform.scaleY:selected.transform.scaleX)*100));
  $('object-bridge-width').value=String(Math.round((def.kind==='stairs'?selected.transform.scaleX:selected.transform.scaleY)*100));
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
  $('object-count').textContent=placedObjects.length+' objet(s) sur le relief';
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
  const count=surface.routes.length+surface.zones.length;
  $('surface-count').textContent=count+' route(s) / zone(s) peintes';
  $('surface-undo').disabled=!surfaceHistory.length;
  $('surface-redo').disabled=!surfaceRedo.length;
  navTerrainCache=null;scheduleDraw();
}
function surfaceCommit(next){
  if(JSON.stringify(next.routes)===JSON.stringify(surface.routes)&&
     JSON.stringify(next.zones)===JSON.stringify(surface.zones))return false;
  surfaceHistory.push(surface);if(surfaceHistory.length>40)surfaceHistory.shift();
  surfaceRedo=[];surface=next;
  loadSurfacePaintAssets();updateSurfaceCount();
  status('Peinture enregistrée sur la scène · exporter la scène pour sauvegarder');
  return true;
}
function setSurfaceEditing(active){
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
  features:[...surface.routes,...surface.zones].map(f=>({
    id:f.id,materialId:f.materialId,width:f.width,points:f.points.length
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
    status('Choisis une catégorie, notamment Escaliers (10 modèles 2,5D), puis touche la carte.');
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
  const bridgeMode=kind==='bridge',stairMode=kind==='stairs';
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
  else status('Limite de 128 objets atteinte');
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
    [$('object-category').value==='stairs'?stairAxis:bridgeAxis]:Number(control.value)/100}));
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
  active:objectEditing,count:placedObjects.length,selectedId:objectSelectedId,
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
  $('zoom').value=String(Math.round(zoom*100));scheduleDraw();
},{passive:false});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>selectMode(button.dataset.mode)));
$('quick-tool').addEventListener('change',()=>selectMode($('quick-tool').value));
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
  exampleRoadEnabled=false;$('show-road').checked=false;$('show-road').disabled=true;
  if(ribbonTextures.road)ribbonTextures.road.visible=false;
  terrain=blank.terrain;placedObjects=blank.objects;objectSelectedId=null;
  placedActors=blank.actors;actorSelectedId=null;actorHistory=[];actorRedo=[];
  updateActorCount();syncActorSelectedControls();
  surface=blank.surface;surfaceHistory=[];surfaceRedo=[];surfaceStrokePoints=[];surfaceDrawing=false;
  updateSurfaceCount();
  objectHistory=[];objectRedo=[];history=[];redoHistory=[];
  drawing=false;strokeUndo=null;strokePoints=[];lastCell='';
  hoverCell=null;precisionCell=null;precisionDragging=false;
  navTerrainCache=null;navLastState='';
  $('json').value='';$('json').hidden=true;
  updateHistoryButtons();updateObjectCount();syncObjectSelectedControls();
  updatePrecisionActions();setNewMapPanel(false);fit();
  status('Carte vierge créée : '+width+' × '+height+' cases · aucun objet · aucune eau. Prête à sculpter.');
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
$('material').addEventListener('change',setTheme);
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
 pan.y=height/2-(height/2-pan.y)*zoom/old;scheduleDraw();
});
$('sphere-summit-ratio').addEventListener('input',()=>{
  $('sphere-summit-ratio-value').textContent=$('sphere-summit-ratio').value+' %';
  spherePreviewDismissed=false;scheduleDraw();
});
$('sphere-wall-material').addEventListener('change',()=>{spherePreviewDismissed=false;scheduleDraw();});
$('radius').addEventListener('input',()=>{$('radius-value').textContent=$('radius').value;scheduleDraw();});
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
$('scene-export').addEventListener('click',()=>{
  $('json').value=serializeSculptPreviewScene(terrain,placedObjects,surface,placedActors);
  $('json').hidden=false;
  status('Scène complète exportée : relief et '+placedObjects.length+' objets, JSON à copier.');
});
$('export').addEventListener('click',()=>{
 $('json').value=serializeSculptTerrain(terrain);$('json').hidden=false;
 status('JSON de hauteur généré : copiez-le pour conserver votre test');
});
$('import').addEventListener('click',()=>{
 try{const imported=importSculptPreviewScene($('json').value);
  const old=terrain;terrain=imported.terrain;commitUndo(old);
  exampleRoadEnabled=false;$('show-road').checked=false;$('show-road').disabled=true;
  if(ribbonTextures.road)ribbonTextures.road.visible=false;
  placedObjects=imported.objects;objectHistory=[];objectRedo=[];objectSelectedId=null;updateObjectCount();syncObjectSelectedControls();
  placedActors=imported.actors;actorSelectedId=null;actorHistory=[];actorRedo=[];
  updateActorCount();syncActorSelectedControls();
  surface=imported.surface;surfaceHistory=[];surfaceRedo=[];surfaceDrawing=false;
  loadSurfacePaintAssets();updateSurfaceCount();
  fit();status(imported.isScene?'Scène complète importée : objets et relief':'Relief ancien importé (sans objets)');}
 catch(e){status(e.message);}
});
$('json-toggle').addEventListener('click',()=>{$('json').hidden=!$('json').hidden;});
window.addEventListener('resize',fit);
window.__sculptLabProbe=(screenPoint=null)=>Object.freeze({
  probedCell:screenPoint?screenToCell({clientX:screenPoint.x,clientY:screenPoint.y}):null,
  surfaceEditing,precisionDragging,faceCount:sculptFaces(terrain).length,
  sphereCount:terrain.spheres?.length??0,spheres:(terrain.spheres??[]).map(f=>({...f})),
  sphereMaterialAssets:{rock:cliffHDLoaded,grass:!!sphereWallImages.grass,
    earth:!!sphereWallImages.earth},
  terrainRasterBuilds,cachedGround:!!navTerrainCache,
  sphereGuideVisible:!spherePreviewDismissed&&selectedMode.startsWith('sphere-')&&
    ($('precision-mode').checked?!!precisionCell:!!hoverCell),
  summitRatio:Number($('sphere-summit-ratio').value)/100,
  wallMaterial:$('sphere-wall-material').value,
  objects:placedObjects.length,objectEditing,objectCategory:$('object-category').value,
  paintedRoutes:surface.routes.length,paintedZones:surface.zones.length,
  width:terrain.width,height:terrain.height,materialId:$('material').value,
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
selectMode('dig');
setEditorKind('ground');
if(window.matchMedia?.('(pointer: coarse)').matches){
  $('precision-mode').checked=true;
}
updatePrecisionActions();
updateHistoryButtons();updateSurfaceCount();setTheme();setupRibbons();loadSphereWallImages();fit();
