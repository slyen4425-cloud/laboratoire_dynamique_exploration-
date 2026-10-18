// Self-contained optional heightfield experiment. Never changes the live 2D Builder.
import {createMaterialRegistry} from './materials/material-registry.js';
import {materialPackV1} from './materials/material-pack-v1.js';
import {resolveMaterialAsset} from './assets/material-asset-adapter.js';
import {createSculptTerrain,sculptDemo,applySculptStroke,applySculptWaterStroke,sculptWaterAt,serializeSculptTerrain,importSculptTerrain,sculptHeightAt,sculptFaces} from './world/sculpt-height-model.js';
import {SCULPT_TILE,drawSculptTerrain,drawSculptBrushPreview,SCULPT_PREVIEW_RIBBONS} from './render/sculpt-height-renderer.js';

const $=id=>document.getElementById(id);
const canvas=$('sculpt-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const registry=createMaterialRegistry(materialPackV1);
let terrain=sculptDemo(),selectedMode='dig',drawing=false,strokeUndo=null;
let lastCell='',strokePoints=[],history=[],redoHistory=[],currentTexture=null,zoom=1,pan={x:0,y:0};
let hoverCell=null,previewSummary=null,lastRenderStats=null;
let editorKind='ground',lastGroundMode='dig',lastWaterMode='water-fill';
let precisionCell=null,precisionDragging=false;
const ribbonTextures={water:null,road:null};
let framePending=false;
const images=new Map();
const themes=['grass.forest','ground.snow','ground.sand','ground.volcanic_ash_lava'];
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
async function setupRibbons(){
  for(const [kind,definition] of Object.entries(SCULPT_PREVIEW_RIBBONS)){
    const material=registry.require(definition.materialId,definition.kind);
    ribbonTextures[kind]={visible:$('show-'+kind).checked,material,texture:null};
    // Never mutate a canonical world; these are preview-only materials.
    ribbonTextures[kind].texture=await imageFor(definition.materialId,definition.kind);
    scheduleDraw();
  }
}
function toggleRibbon(kind){
  if(ribbonTextures[kind]){
    ribbonTextures[kind].visible=$('show-'+kind).checked;scheduleDraw();
  }
}
async function setTheme(){
  const id=$('material').value;
  if(!themes.includes(id))return;
  currentTexture=await imageFor(id);
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
  center();scheduleDraw();
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
  previewSummary=null;
  const precisionOn=$('precision-mode').checked;
  const displayCell=precisionOn?precisionCell:hoverCell;
  if(displayCell&&(precisionOn||$('preview-cursor').checked)){
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
  const enabled=$('precision-mode').checked;
  $('precision-actions').hidden=!enabled;
  const hasTarget=enabled&&!!precisionCell;
  $('apply-precision').disabled=!hasTarget;
  for(const id of ['nudge-left','nudge-up','nudge-down','nudge-right'])
    $(id).disabled=!hasTarget;
  scheduleDraw();
}
function setEditorKind(kind){
  if(kind!=='ground'&&kind!=='water')return;
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
  if(event.button!==undefined&&event.button!==0)return;
  const cell=screenToCell(event);if(!cell)return;
  hoverCell=cell;
  event.preventDefault();canvas.setPointerCapture(event.pointerId);
  if($('precision-mode').checked){
    precisionDragging=true;precisionCell=cell;updatePrecisionActions();
    status('Visée ('+(cell.x+1)+','+(cell.y+1)+') : déplace ou ajuste avec les flèches, puis Appliquer');
    return;
  }
  drawing=true;lastCell='';strokePoints=[];strokeUndo=terrain;
  stroke(event);
}
function stroke(event){
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
$('export').addEventListener('click',()=>{
 $('json').value=serializeSculptTerrain(terrain);$('json').hidden=false;
 status('JSON de hauteur généré : copiez-le pour conserver votre test');
});
$('import').addEventListener('click',()=>{
 try{const imported=importSculptTerrain($('json').value);
  const old=terrain;terrain=imported;commitUndo(old);fit();status('Relief JSON importé');}
 catch(e){status(e.message);}
});
$('json-toggle').addEventListener('click',()=>{$('json').hidden=!$('json').hidden;});
window.addEventListener('resize',fit);
window.__sculptLabProbe=()=>Object.freeze({faceCount:sculptFaces(terrain).length,
  width:terrain.width,height:terrain.height,materialId:$('material').value,
  levelSpread:new Set(terrain.levels).size,zoom,
  previewCells:previewSummary?.cells??0,editorKind,
  brushSize:Number($('radius').value),quickTool:$('quick-tool').value,
  canvasTop:canvas.getBoundingClientRect().top,viewportHeight:window.innerHeight,
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
