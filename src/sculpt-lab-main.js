// Self-contained optional heightfield experiment. Never changes the live 2D Builder.
import {createMaterialRegistry} from './materials/material-registry.js';
import {materialPackV1} from './materials/material-pack-v1.js';
import {resolveMaterialAsset} from './assets/material-asset-adapter.js';
import {createSculptTerrain,sculptDemo,applySculptStroke,applySculptWaterStroke,sculptWaterAt,serializeSculptTerrain,importSculptTerrain,sculptHeightAt,sculptFaces} from './world/sculpt-height-model.js';
import {SCULPT_TILE,drawSculptTerrain,drawSculptBrushPreview,SCULPT_PREVIEW_RIBBONS} from './render/sculpt-height-renderer.js';
import {stepMovement} from './core/movement.js';
import {sculptNavigationSample} from './core/sculpt-navigation-collision.js';
import {createVirtualStick} from './input/virtual-stick.js';
import {resolveMapActorAsset} from './assets/map-actor-asset-adapter.js';
import {resolveWorldObjectAsset} from './assets/world-object-asset-adapter.js';
import {objectDefinitionCatalogV1} from './objects/object-definition-catalog.js';
import {resolveWorldObjectPlacements} from './world/world-object-placement-model.js';
import {isBlocked} from './core/collision.js';
import {listSculptPlaceableDefinitions,appendSculptPreviewObject,
  removeSculptPreviewObject,findSculptPreviewObjectNear,serializeSculptPreviewScene,
  importSculptPreviewScene} from './world/sculpt-scene-preview.js';

const $=id=>document.getElementById(id);
const canvas=$('sculpt-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const registry=createMaterialRegistry(materialPackV1);
let terrain=sculptDemo(),selectedMode='dig',drawing=false,strokeUndo=null;
let lastCell='',strokePoints=[],history=[],redoHistory=[],currentTexture=null,zoom=1,pan={x:0,y:0};
let hoverCell=null,previewSummary=null,lastRenderStats=null;
let editorKind='ground',lastGroundMode='dig',lastWaterMode='water-fill';
let precisionCell=null,precisionDragging=false;
let nativeFullscreenEntered=false;
let objectEditing=false,placedObjects=Object.freeze([]),objectHistory=[],objectRedo=[];
const objectImages=new Map(),availableObjects=listSculptPlaceableDefinitions();
function objectImage(assetId){
  if(objectImages.has(assetId))return objectImages.get(assetId);
  const resolved=resolveWorldObjectAsset(assetId);
  if(!resolved)return null;
  const picture=new Image();
  picture.onload=scheduleDraw;
  picture.onerror=()=>status('Impossible de charger le visuel '+assetId);
  picture.src=resolved.path;
  objectImages.set(assetId,picture);
  return picture;
}
let navigationTesting=false,navActor=null,navFrame=0,navPreviousTime=null,navStick=null;
const navKeys=new Set();
// Preview-only navigation speed; authoritative runtime movement remains unchanged.
const navSpeed=()=>Math.max(90,Math.min(360,Number($('navigation-speed').value)||220));
let navViewport=null,navLastState='',navBlocked=false;
const demoActorImage=new Image(),demoActorAsset=resolveMapActorAsset('actor.demo.hero.traveler.01');
if(demoActorAsset){demoActorImage.onload=scheduleDraw;demoActorImage.src=demoActorAsset.path;}

const ribbonTextures={water:null,road:null};
let framePending=false;
let waterMaterialRevision=0,groundMaterialRevision=0;
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
  ribbonTextures.road={visible:$('show-road').checked,material,texture:null};
  ribbonTextures.road.texture=await imageFor(road.materialId,road.kind);
  scheduleDraw();
  await setWaterMaterial();
}
function toggleRibbon(kind){
  if(ribbonTextures[kind]){
    ribbonTextures[kind].visible=$('show-'+kind).checked;scheduleDraw();
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
function fit(){
  const {width,height}=dimensions();
  const worldWidth=terrain.width*SCULPT_TILE.width;
  const worldHeight=terrain.height*SCULPT_TILE.height+7*SCULPT_TILE.rise;
  zoom=Math.max(.32,Math.min(1.6,Math.min((width-30)/worldWidth,(height-20)/worldHeight)));
  $('zoom').value=String(Math.round(zoom*100));
  if(navigationTesting)centerNavigationCamera();
  else center();
  scheduleDraw();
}
function center(){
  const {width,height}=dimensions();
  const worldWidth=terrain.width*SCULPT_TILE.width;
  const worldHeight=terrain.height*SCULPT_TILE.height+7*SCULPT_TILE.rise;
  pan={x:Math.round((width-worldWidth*zoom)/2),
    y:Math.round((height-worldHeight*zoom)/2+7*SCULPT_TILE.rise*zoom)};
}
function draw(){
  framePending=false;
  const {width,height}=dimensions(),dpr=Math.min(2,window.devicePixelRatio||1);
  const desiredW=Math.max(1,Math.floor(width*dpr)),desiredH=Math.max(1,Math.floor(height*dpr));
  if(canvas.width!==desiredW)canvas.width=desiredW;
  if(canvas.height!==desiredH)canvas.height=desiredH;
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.fillStyle='#17232b';ctx.fillRect(0,0,width,height);
  ctx.translate(pan.x,pan.y);ctx.scale(zoom,zoom);
  const material=registry.require($('material').value,'surface');
  const result=drawSculptTerrain(ctx,{terrain,material,texture:currentTexture,
    rockPalette:$('rock').value,visualSmoothness:Number($('visual-smooth').value)/100,
    overlays:ribbonTextures});
  lastRenderStats=result;
  if(navigationTesting){
    drawPreviewObjects(navActor?.y??Infinity);
    drawNavigationActor();
    drawPreviewObjects(Infinity,navActor?.y??Infinity);
  }else drawPreviewObjects();
  previewSummary=null;
  const precisionOn=$('precision-mode').checked;
  const displayCell=precisionOn?precisionCell:hoverCell;
  if(!navigationTesting&&!objectEditing&&displayCell&&(precisionOn||$('preview-cursor').checked)){
    const points=precisionOn?[{x:displayCell.x+.5,y:displayCell.y+.5}]
      :drawing&&strokePoints.length?strokePoints:[{x:displayCell.x+.5,y:displayCell.y+.5}];
    const base=drawing&&strokeUndo ? strokeUndo : terrain;
    const first=points[0],target=selectedMode.startsWith('water-')?Number($('water-target').value):selectedMode==='plateau' ? Number($('target').value)
      : sculptHeightAt(base,Math.floor(first.x),Math.floor(first.y));
    previewSummary=drawSculptBrushPreview(ctx,{terrain:base,points,
      radius:Number($('radius').value),strength:Number($('strength').value),
      edgeSoftness:Number($('edge').value)/100,mode:selectedMode,target,zoom});
  }
  $('stats').textContent=terrain.width+' × '+terrain.height+' cases · '+result.faceCount+
    ' parois ('+result.faceRuns+' sections) · '+Math.round(zoom*100)+' %';
  $('brush-info').textContent=displayCell ?
    (precisionOn?'Visée ('+(displayCell.x+1)+','+(displayCell.y+1)+') · ':'Pinceau : ')+
    (previewSummary?.cells??0)+' case(s) · '+selectedMode+
    (selectedMode==='plateau'?' niveau '+$('target').value:selectedMode.startsWith('water-')?' eau '+$('water-target').value:'')+
    (precisionOn?' · appuie sur Appliquer pour sculpter':' · bord '+$('edge').value+' %') :
    precisionOn?'Placement précis : vise au doigt sans modifier le terrain, puis confirme':'Déplace le pointeur ou touche le terrain : empreinte visible avant la sculpture';
}
function scheduleDraw(){if(!framePending){framePending=true;requestAnimationFrame(draw);}}
function screenToCell(event){
  const rect=canvas.getBoundingClientRect();
  const x=((event.clientX-rect.left-pan.x)/zoom);
  const y=((event.clientY-rect.top-pan.y)/zoom);
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
  const enabled=!navigationTesting&&!objectEditing&&$('precision-mode').checked;
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
    mode:selectedMode,target:water?Number($('water-target').value):
       selectedMode==='plateau'?Number($('target').value):sculptHeightAt(previous,cell.x,cell.y),
    edgeSoftness:Number($('edge').value)/100};
  terrain=water?applySculptWaterStroke(previous,options):
    applySculptStroke(previous,{...options,rockRoundness:Number($('visual-smooth').value)});
  commitUndo(previous);
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
  $('quick-level-label').textContent=group==='water'?'Eau':'Hauteur';
  $('quick-level-value').textContent=group==='water'?
    $('water-target').value:$('target').value;
}
function adjustQuickLevel(delta){
  const el=editorKind==='water' ? $('water-target') : $('target');
  const limit=editorKind==='water'?10:7;
  el.value=String(Math.max(0,Math.min(limit,Number(el.value)+delta)));
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
  if(nextKind==='water')lastWaterMode=mode;else lastGroundMode=mode;
  if(editorKind!==nextKind)setEditorKind(nextKind);
  $('active-tool-label').textContent=(nextKind==='water'?'Eau':'Terre')+' · '+mode;
  document.querySelectorAll('[data-mode]').forEach(button=>{
    const active=button.dataset.mode===mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  syncQuickToolbar();
  status({dig:'Creuser : abaisse le terrain et crée la paroi',raise:'Surélever : pousse le plateau vers le haut',
    flatten:'Aplanir : nivelle vers la première hauteur touchée',smooth:'Adoucir : lisse les différences de niveau',plateau:'Plateau : pose exactement le niveau sélectionné, sans empiler les passages',
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
  updateHistoryButtons();scheduleDraw();status('Dernière action annulée (sol / eau / arrondi)');
}
function redo(){
  if(!redoHistory.length){status('Aucune action à rétablir');return;}
  history.push(terrain);terrain=redoHistory.pop();
  updateHistoryButtons();scheduleDraw();status('Action rétablie');
}
function begin(event){
  if(navigationTesting)return;
  if(event.button!==undefined&&event.button!==0)return;
  const cell=screenToCell(event);if(!cell)return;
  hoverCell=cell;
  event.preventDefault();canvas.setPointerCapture(event.pointerId);
  if(objectEditing){applyObjectAtCell(cell);return;}
  if($('precision-mode').checked){
    precisionDragging=true;precisionCell=cell;updatePrecisionActions();
    status('Visée ('+(cell.x+1)+','+(cell.y+1)+') : déplace ou ajuste avec les flèches, puis Appliquer');
    return;
  }
  drawing=true;lastCell='';strokePoints=[];strokeUndo=terrain;
  stroke(event);
}
function stroke(event){
  if(navigationTesting||objectEditing)return;
  if(precisionDragging){
    const next=screenToCell(event);
    if(next){precisionCell=next;hoverCell=next;updatePrecisionActions();}
    return;
  }
  if($('precision-mode').checked)return;
  if(!drawing){
    if(event.pointerType==='touch')return;
    hoverCell=screenToCell(event);
    scheduleDraw();return;
  }
  const cell=screenToCell(event);if(!cell)return;
  hoverCell=cell;
  const key=cell.x+','+cell.y;
  if(key===lastCell)return;
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
    strength:Number($('strength').value),mode:selectedMode,target,
    edgeSoftness:Number($('edge').value)/100};
  terrain=waterMode ?applySculptWaterStroke(strokeUndo,options):
    applySculptStroke(strokeUndo,{...options,rockRoundness:Number($('visual-smooth').value)});
  scheduleDraw();
}
function stop(){
  if(precisionDragging){
    precisionDragging=false;
    updatePrecisionActions();
    return;
  }
  if(drawing&&strokeUndo){
    commitUndo(strokeUndo);
    strokeUndo=null;
  }
  drawing=false;lastCell='';strokePoints=[];
}

/* V17 isolated gameplay probe. Position and movement use the existing Exploration
   stepMovement. Collision World alone decides whether the sculpt terrain blocks
   that movement. The editor never persists player navigation in map JSON. */
function navigationWorld(){
  return {width:terrain.width*SCULPT_TILE.width,
    height:terrain.height*SCULPT_TILE.height,objects:placedObjects,obstacles:[]};
}
function navigationContext(){
  return {sculptNavigation:{terrain,cellWidth:SCULPT_TILE.width,
    cellHeight:SCULPT_TILE.height,maxStepUp:1,maxStepDown:1}};
}
function navHeight(){
  const info=navActor&&sculptNavigationSample(terrain,navActor.x,navActor.y,
    {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
  return info?.level??0;
}
function centerNavigationCamera(){
  if(!navigationTesting||!navActor)return;
  const {width,height}=dimensions();
  const worldWidth=terrain.width*SCULPT_TILE.width*zoom;
  const worldHeight=(terrain.height*SCULPT_TILE.height+7*SCULPT_TILE.rise)*zoom;
  const targetX=width*.5-navActor.x*zoom;
  const targetY=height*.52-(navActor.y-navHeight()*SCULPT_TILE.rise)*zoom;
  pan.x=worldWidth<width?(width-worldWidth)*.5:
    Math.max(width-worldWidth,Math.min(0,targetX));
  // Heightfield can extend above row zero by a few rises; leave that margin.
  pan.y=worldHeight<height?(height-worldHeight)*.5+7*SCULPT_TILE.rise*zoom:
    Math.max(height-worldHeight,Math.min(7*SCULPT_TILE.rise*zoom,targetY));
}
function drawNavigationActor(){
  if(!navActor)return;
  const level=navHeight();
  const {x,y}=navActor,footY=y-level*SCULPT_TILE.rise+3;
  ctx.save();
  ctx.fillStyle='rgba(0,0,0,.24)';
  ctx.beginPath();ctx.ellipse(x,footY+2,8,3,0,0,Math.PI*2);ctx.fill();
  if(demoActorImage.complete&&demoActorImage.naturalWidth>0){
    const width=27,height=37;
    ctx.translate(x,footY);ctx.scale(navActor.facingX<0?-1:1,1);
    ctx.drawImage(demoActorImage,-width/2,-height,width,height);
  }else{
    ctx.fillStyle='#ffd9a5';ctx.beginPath();ctx.arc(x,footY-18,8,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#4262a3';ctx.fillRect(x-7,footY-15,14,15);
  }
  ctx.restore();
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
    if(level?.waterDepth===0&&!isBlocked(navigationWorld(),candidate,candidate.x,candidate.y,undefined,navigationContext()))return candidate;
  }
  return null;
}
function updateNavigationInfo(forced=false){
  if(!navigationTesting||!navActor)return;
  const info=sculptNavigationSample(terrain,navActor.x,navActor.y,
    {cellWidth:SCULPT_TILE.width,cellHeight:SCULPT_TILE.height});
  const value=info?'Case '+(info.col+1)+' / '+(info.row+1)+' · hauteur '+info.level+
    (info.waterDepth>0?' · eau '+info.waterDepth:'')+
    (navBlocked?' · obstacle (falaise, eau ou limite)':''):'Hors zone';
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
    const dt=Math.min(.032,Math.max(0,(time-navPreviousTime)/1000));
    const intent=navigationInput();
    if(dt>0&&Math.hypot(intent.x,intent.y)>.13){
      const previousX=navActor.x,previousY=navActor.y;
      stepMovement(navigationWorld(),navActor,intent,dt,
        {maxSpeed:navSpeed()},undefined,navigationContext());
      const moved=Math.hypot(navActor.x-previousX,navActor.y-previousY);
      navBlocked=moved<.001;
      navActor.moving=moved>.001;
      if(intent.x!==0)navActor.facingX=intent.x<0?-1:1;
      if(moved>.001){centerNavigationCamera();scheduleDraw();}
      updateNavigationInfo();
    }else if(navActor.moving){navActor.moving=false;scheduleDraw();}
  }
  navPreviousTime=time;
  navFrame=requestAnimationFrame(navigationTick);
}
function setNavigationTesting(on){
  if(on===navigationTesting)return;
  if(on){
    navActor=navigationSpawn();
    if(!navActor){status('Aucune case sèche disponible pour le test');return;}
    navigationTesting=true;
    navViewport={zoom,pan:{...pan}};
    navKeys.clear();navBlocked=false;navLastState='';
    $('navigation-hud').hidden=false;$('navigation-stick').hidden=false;
    $('navigation-toggle').textContent='✎ Éditer';
    $('navigation-toggle').setAttribute('aria-pressed','true');
    document.body.classList.add('navigation-testing');
    $('navigation-locomotion').value='ground';
    navActor.locomotion={modes:['ground']};
    navStick=createVirtualStick($('navigation-stick'),$('navigation-knob'),30);
    // Keep the hero and movement legible on a small phone display.
    zoom=Math.max(1.25,zoom);
    $('zoom').value=String(Math.round(zoom*100));
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
    navActor=null;navViewport=null;navBlocked=false;
    updatePrecisionActions();scheduleDraw();
    status('Édition réactivée : le test de marche n’a modifié aucune donnée.');
  }
  scheduleDraw();
}
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
  blocked:navBlocked,speed:navSpeed(),zoom,joystickAttached:!!navStick,activeFrames:navFrame>0,
  sameTerrainVersion:terrain.schemaVersion===1
});


/* Native WorldObject definitions/placements and asset resolver own the catalog,
   dimensions and collision semantics. Sculpt remains geometry-only. */
function drawPreviewObjects(maxY=Infinity,minY=-Infinity){
  const objects=resolveWorldObjectPlacements(placedObjects,objectDefinitionCatalogV1)
    .filter(o=>o.transform.y<=maxY&&o.transform.y>minY)
    .sort((a,b)=>a.transform.y-b.transform.y);
  for(const object of objects){
    const art=objectImage(object.visual?.assetId);
    if(!art?.complete||!art.naturalWidth)continue;
    const t=object.transform,base=object.baseSize;
    const width=(base?.width??base?.length??80)*t.scaleX;
    const height=(base?.height??base?.width??80)*t.scaleY;
    const x=t.x,y=t.y-sculptHeightAt(terrain,
      Math.floor(t.x/SCULPT_TILE.width),Math.floor(t.y/SCULPT_TILE.height))*SCULPT_TILE.rise;
    ctx.save();ctx.translate(x,y);ctx.rotate(t.rotationDeg*Math.PI/180);
    ctx.drawImage(art,-width/2,-height,width,height);
    ctx.restore();
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
}
function updateObjectCount(){
  $('object-count').textContent=placedObjects.length+' objet(s) sur le relief';
  $('object-undo').disabled=objectHistory.length===0;
  $('object-redo').disabled=objectRedo.length===0;
  scheduleDraw();
}
function objectCommit(next){
  if(next===placedObjects)return false;
  if(next.length===placedObjects.length&&next.every((o,i)=>o===placedObjects[i]))return false;
  objectHistory.push(placedObjects);if(objectHistory.length>40)objectHistory.shift();
  objectRedo=[];placedObjects=next;updateObjectCount();return true;
}
function setObjectEditing(active){
  objectEditing=!!active;
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
    status('Choisis Bâtiments, Arbres ou Rochers, puis touche la carte.');
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
  if($('object-action').value==='remove'){
    const found=findSculptPreviewObjectNear(placedObjects,x,y);
    if(!found){status('Aucun objet proche à supprimer');return;}
    if(objectCommit(removeSculptPreviewObject(placedObjects,found.id)))
      status('Objet supprimé : '+objectDefinitionCatalogV1.get(found.objectDefinitionId)?.label);
    return;
  }
  if(sculptWaterAt(terrain,cell.x,cell.y)>0){
    status('Pose refusée dans l’eau : choisir une case de terre sèche');return;
  }
  const definitionId=$('object-definition').value;
  const next=appendSculptPreviewObject(placedObjects,{definitionId,x,y,
    scale:Number($('object-scale').value)/100,
    rotationDeg:Number($('object-rotation').value)});
  if(objectCommit(next))status('Objet placé : '+objectDefinitionCatalogV1.get(definitionId)?.label+
    ' · Exporter scène pour conserver le décor');
  else status('Limite de 128 objets atteinte');
}
$('object-category').addEventListener('change',refreshObjectOptions);
for(const [control,output,unit] of [['object-scale','object-scale-value',' %'],
  ['object-rotation','object-rotation-value','°']]){
  $(control).addEventListener('input',()=>{$(output).textContent=$(control).value+unit;});
}
$('object-undo').addEventListener('click',()=>{
  if(!objectHistory.length)return;
  objectRedo.push(placedObjects);placedObjects=objectHistory.pop();updateObjectCount();
});
$('object-redo').addEventListener('click',()=>{
  if(!objectRedo.length)return;
  objectHistory.push(placedObjects);placedObjects=objectRedo.pop();updateObjectCount();
});
refreshObjectOptions();updateObjectCount();
window.__sculptObjectsProbe=()=>Object.freeze({
  active:objectEditing,count:placedObjects.length,
  definitions:availableObjects.length,
  objects:placedObjects.map(o=>({id:o.id,definition:o.objectDefinitionId,
    x:o.transform.x,y:o.transform.y})),
  exportsIncludeObjects:JSON.parse(serializeSculptPreviewScene(terrain,placedObjects)).objects.length===placedObjects.length
});

canvas.addEventListener('pointerdown',begin);
canvas.addEventListener('pointermove',stroke);
canvas.addEventListener('pointerup',stop);
canvas.addEventListener('pointercancel',stop);
canvas.addEventListener('pointerleave',()=>{if(!drawing&&!precisionDragging){hoverCell=null;scheduleDraw();}});
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
$('reset').addEventListener('click',()=>{const old=terrain;terrain=sculptDemo();commitUndo(old);scheduleDraw();status('Relief exemple rechargé');});
$('flat').addEventListener('click',()=>{const old=terrain;terrain=createSculptTerrain();commitUndo(old);scheduleDraw();status('Terrain plat : prêt à sculpter');});
$('fit').addEventListener('click',fit);
$('material').addEventListener('change',setTheme);
$('water-material').addEventListener('change',setWaterMaterial);
$('rock').addEventListener('change',scheduleDraw);
$('show-water').addEventListener('change',()=>toggleRibbon('water'));
$('show-road').addEventListener('change',()=>toggleRibbon('road'));
$('preview-cursor').addEventListener('change',scheduleDraw);
$('zoom').addEventListener('input',()=>{
 const old=zoom;zoom=Number($('zoom').value)/100;
 const {width,height}=dimensions();
 pan.x=width/2-(width/2-pan.x)*zoom/old;
 pan.y=height/2-(height/2-pan.y)*zoom/old;scheduleDraw();
});
$('radius').addEventListener('input',()=>{$('radius-value').textContent=$('radius').value;scheduleDraw();});
$('strength').addEventListener('input',()=>{$('strength-value').textContent=$('strength').value;scheduleDraw();});
$('edge').addEventListener('input',()=>{$('edge-value').textContent=$('edge').value+' %';scheduleDraw();});
$('visual-smooth').addEventListener('input',()=>{$('visual-smooth-value').textContent=$('visual-smooth').value+' %';
  status('Arrondi '+$('visual-smooth').value+' % : uniquement au prochain passage de pinceau');
  scheduleDraw();});
$('water-target').addEventListener('input',()=>{
  $('water-target-value').textContent=$('water-target').value;
  syncQuickToolbar();status('Surface d’eau absolue : niveau '+$('water-target').value);scheduleDraw();
});
function changeTarget(level){
 const value=Math.max(0,Math.min(7,Number(level)));
 $('target').value=String(value);$('target-value').textContent=String(value);
 syncQuickToolbar();status('Hauteur plateau : niveau '+value+' (bord '+$('edge').value+' %)');scheduleDraw();}
$('target').addEventListener('input',()=>changeTarget($('target').value));
$('level-down').addEventListener('click',()=>changeTarget(Number($('target').value)-1));
$('level-up').addEventListener('click',()=>changeTarget(Number($('target').value)+1));
$('scene-export').addEventListener('click',()=>{
  $('json').value=serializeSculptPreviewScene(terrain,placedObjects);
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
  placedObjects=imported.objects;objectHistory=[];objectRedo=[];updateObjectCount();
  fit();status(imported.isScene?'Scène complète importée : objets et relief':'Relief ancien importé (sans objets)');}
 catch(e){status(e.message);}
});
$('json-toggle').addEventListener('click',()=>{$('json').hidden=!$('json').hidden;});
window.addEventListener('resize',fit);
window.__sculptLabProbe=()=>Object.freeze({faceCount:sculptFaces(terrain).length,
  objects:placedObjects.length,objectEditing,objectCategory:$('object-category').value,
  width:terrain.width,height:terrain.height,materialId:$('material').value,
  waterMaterialId:$('water-material').value,
  levelSpread:new Set(terrain.levels).size,zoom,
  previewCells:previewSummary?.cells??0,editorKind,
  brushSize:Number($('radius').value),quickTool:$('quick-tool').value,
  canvasTop:canvas.getBoundingClientRect().top,canvasHeight:canvas.getBoundingClientRect().height,
  viewportHeight:window.innerHeight,
  immersiveMode:document.body.classList.contains('sculpt-immersive'),
  paletteCollapsed:document.body.classList.contains('palette-collapsed'),
  advancedOpen:$('sculpt-settings').open,
  precisionMode:$('precision-mode').checked,
  precisionTarget:precisionCell?{...precisionCell}:null,
  faceRuns:lastRenderStats?.faceRuns??0,waterCells:lastRenderStats?.waterCells??0,
  roadCells:lastRenderStats?.roadCells??0,waterVisible:!!ribbonTextures.water?.visible,
  roadVisible:!!ribbonTextures.road?.visible,
  authoredWaterCells:terrain.waterLevels.filter(v=>v>=0).length,
  wetCells:terrain.waterLevels.filter((v,i)=>v>terrain.levels[i]).length,
  centerWaterDepth:sculptWaterAt(terrain,Math.floor(terrain.width/2),Math.floor(terrain.height/2)),
  centerRoundness:terrain.roundness[Math.floor(terrain.height/2)*terrain.width+Math.floor(terrain.width/2)],
  undoCount:history.length,redoCount:redoHistory.length,
  highestLevel:Math.max(...terrain.levels),lowestLevel:Math.min(...terrain.levels),target:Number($('target').value),edge:Number($('edge').value),visualSmooth:Number($('visual-smooth').value)});
selectMode('dig');
setEditorKind('ground');
if(window.matchMedia?.('(pointer: coarse)').matches){
  $('precision-mode').checked=true;
}
updatePrecisionActions();
updateHistoryButtons();setTheme();setupRibbons();fit();
