// Self-contained optional heightfield experiment. Never changes the live 2D Builder.
import {createMaterialRegistry} from './materials/material-registry.js';
import {materialPackV1} from './materials/material-pack-v1.js';
import {resolveMaterialAsset} from './assets/material-asset-adapter.js';
import {createSculptTerrain,sculptDemo,applySculptStroke,serializeSculptTerrain,importSculptTerrain,sculptHeightAt,sculptFaces} from './world/sculpt-height-model.js';
import {SCULPT_TILE,drawSculptTerrain} from './render/sculpt-height-renderer.js';

const $=id=>document.getElementById(id);
const canvas=$('sculpt-canvas'),ctx=canvas.getContext('2d',{alpha:false});
const registry=createMaterialRegistry(materialPackV1);
let terrain=sculptDemo(),selectedMode='dig',drawing=false,strokeUndo=null;
let lastCell='',strokePoints=[],history=[],currentTexture=null,zoom=1,pan={x:0,y:0};
let framePending=false;
const images=new Map();
const themes=['grass.forest','ground.snow','ground.sand','ground.volcanic_ash_lava'];
function imageFor(materialId){
  const material=registry.require(materialId,'surface');
  const id=material.assets?.base;
  const path=resolveMaterialAsset(id)?.path;
  if(!path)return Promise.resolve(null);
  if(images.has(id))return images.get(id);
  const promise=new Promise(resolve=>{
    const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>resolve(null);
    img.src=path;
  });
  images.set(id,promise);return promise;
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
  const result=drawSculptTerrain(ctx,{terrain,material,texture:currentTexture,rockPalette:$('rock').value,visualSmoothness:Number($('visual-smooth').value)/100});
  $('stats').textContent=terrain.width+' × '+terrain.height+' cases · '+result.faceCount+
    ' parois générées · '+Math.round(zoom*100)+' %';
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
function selectMode(mode){
  selectedMode=mode;document.querySelectorAll('[data-mode]').forEach(button=>{
    const active=button.dataset.mode===mode;
    button.classList.toggle('active',active);
    button.setAttribute('aria-pressed',String(active));
  });
  status({dig:'Creuser : abaisse le terrain et crée la paroi',raise:'Surélever : pousse le plateau vers le haut',
    flatten:'Aplanir : nivelle vers la première hauteur touchée',smooth:'Adoucir : lisse les différences de niveau',plateau:'Plateau : pose exactement le niveau sélectionné, sans empiler les passages'}[mode]);
}
function undo(){
  if(!history.length){status('Aucune action à annuler');return;}
  terrain=history.pop();scheduleDraw();status('Dernier coup de pinceau annulé');
}
function begin(event){
  if(event.button!==undefined&&event.button!==0)return;
  const cell=screenToCell(event);if(!cell)return;
  event.preventDefault();canvas.setPointerCapture(event.pointerId);
  drawing=true;lastCell='';strokePoints=[];strokeUndo=terrain;
  stroke(event);
}
function stroke(event){
  if(!drawing)return;
  const cell=screenToCell(event);if(!cell)return;
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
  const target=selectedMode==='plateau' ? Number($('target').value)
    : sculptHeightAt(strokeUndo,Math.floor(first.x),Math.floor(first.y));
  terrain=applySculptStroke(strokeUndo,{
    points:strokePoints,radius:Number($('radius').value),
    strength:Number($('strength').value),mode:selectedMode,target,
    edgeSoftness:Number($('edge').value)/100
  });
  scheduleDraw();
}
function stop(){
  if(drawing&&strokeUndo){
    if(strokeUndo!==terrain){history.push(strokeUndo);if(history.length>40)history.shift();}
    strokeUndo=null;
  }
  drawing=false;lastCell='';strokePoints=[];
}
canvas.addEventListener('pointerdown',begin);
canvas.addEventListener('pointermove',stroke);
canvas.addEventListener('pointerup',stop);
canvas.addEventListener('pointercancel',stop);
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
$('undo').addEventListener('click',undo);
$('reset').addEventListener('click',()=>{history.push(terrain);terrain=sculptDemo();scheduleDraw();status('Relief exemple rechargé');});
$('flat').addEventListener('click',()=>{history.push(terrain);terrain=createSculptTerrain();scheduleDraw();status('Terrain plat : prêt à sculpter');});
$('fit').addEventListener('click',fit);
$('material').addEventListener('change',setTheme);
$('rock').addEventListener('change',scheduleDraw);
$('zoom').addEventListener('input',()=>{
 const old=zoom;zoom=Number($('zoom').value)/100;
 const {width,height}=dimensions();
 pan.x=width/2-(width/2-pan.x)*zoom/old;
 pan.y=height/2-(height/2-pan.y)*zoom/old;scheduleDraw();
});
$('radius').addEventListener('input',()=>{$('radius-value').textContent=$('radius').value;});
$('strength').addEventListener('input',()=>{$('strength-value').textContent=$('strength').value;});
$('edge').addEventListener('input',()=>{$('edge-value').textContent=$('edge').value+' %';});
$('visual-smooth').addEventListener('input',()=>{$('visual-smooth-value').textContent=$('visual-smooth').value+' %';scheduleDraw();});
function changeTarget(level){
 const value=Math.max(0,Math.min(7,Number(level)));
 $('target').value=String(value);$('target-value').textContent=String(value);
 status('Hauteur plateau : niveau '+value+' (bord '+$('edge').value+' %)');}
$('target').addEventListener('input',()=>changeTarget($('target').value));
$('level-down').addEventListener('click',()=>changeTarget(Number($('target').value)-1));
$('level-up').addEventListener('click',()=>changeTarget(Number($('target').value)+1));
$('export').addEventListener('click',()=>{
 $('json').value=serializeSculptTerrain(terrain);$('json').hidden=false;
 status('JSON de hauteur généré : copiez-le pour conserver votre test');
});
$('import').addEventListener('click',()=>{
 try{const imported=importSculptTerrain($('json').value);
  history.push(terrain);terrain=imported;fit();status('Relief JSON importé');}
 catch(e){status(e.message);}
});
$('json-toggle').addEventListener('click',()=>{$('json').hidden=!$('json').hidden;});
window.addEventListener('resize',fit);
window.__sculptLabProbe=()=>Object.freeze({faceCount:sculptFaces(terrain).length,
  width:terrain.width,height:terrain.height,materialId:$('material').value,
  levelSpread:new Set(terrain.levels).size,zoom,highestLevel:Math.max(...terrain.levels),lowestLevel:Math.min(...terrain.levels),target:Number($('target').value),edge:Number($('edge').value),visualSmooth:Number($('visual-smooth').value)});
selectMode('dig');setTheme();fit();
