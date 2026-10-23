// V76 R5: cached analytic projected geometry + one seamless material projection.
// World Model still owns all geometry. This file neither stores nor edits collision.
import {sculptSphereDisplacementAt} from '../world/sculpt-height-model.js';
import {sculptCliffHDLayers} from './sculpt-cliff-hd.js';
const TAU=2*Math.PI, SECTORS=36, BANDS=10;
const meshCache=new WeakMap();
export function sculptSphereProjectedPoint(terrain,sphere,ratio,angle,tile){
  const x=sphere.x+Math.cos(angle)*sphere.radius*ratio;
  const worldY=sphere.y+Math.sin(angle)*sphere.radius*ratio;
  const delta=sculptSphereDisplacementAt(terrain,x,worldY);
  const level=sphere.baseLevel+delta;
  const depthViewScale=sphere.kind==='basin'
    ?Math.min(1,sphere.radius*.68/(7*tile.rise)):1;
  return Object.freeze({
    x,y:worldY-sphere.baseLevel*tile.rise-delta*tile.rise*depthViewScale,
    worldY,level,delta
  });
}
function projectedMesh(terrain,sphere,tile){
  const old=meshCache.get(sphere);
  if(old?.terrain===terrain&&old.rise===tile.rise)return old;
  const nodes=[];
  for(let band=0;band<=BANDS;band++){
    const pts=[],radius=band/BANDS;
    for(let sector=0;sector<=SECTORS;sector++)
      pts.push(sculptSphereProjectedPoint(terrain,sphere,radius,
        sector*TAU/SECTORS,tile));
    nodes.push(pts);
  }
  const faces=[];
  for(let band=0;band<BANDS;band++){
    for(let sector=0;sector<SECTORS;sector++){
      const q=[nodes[band][sector],nodes[band][sector+1],
        nodes[band+1][sector+1],nodes[band+1][sector]];
      const radial=(band+.5)/BANDS,summit=sphere.summitRatio??0;
      const flank=Math.max(0,(radial-summit)/(1-summit));
      faces.push({q,wall:sphere.kind==='hill'?flank>=.45:flank>=.24,
        depth:q.reduce((v,p)=>v+p.worldY,0)/4});
    }
  }
  faces.sort((a,b)=>a.depth-b.depth);
  const mesh={terrain,rise:tile.rise,nodes,faces};
  meshCache.set(sphere,mesh);
  return mesh;
}
function quad(ctx,q){
  ctx.moveTo(q[0].x,q[0].y);
  for(let i=1;i<q.length;i++)ctx.lineTo(q[i].x,q[i].y);
  ctx.closePath();
}
function gradient(ctx,x0,y0,x1,y1,colors,fallback){
  if(typeof ctx.createLinearGradient!=='function')return fallback;
  const g=ctx.createLinearGradient(x0,y0,x1,y1);
  for(let i=0;i<colors.length;i++)g.addColorStop(i/(colors.length-1),colors[i]);
  return g;
}
function worldPattern(ctx,image){
  if(!image||typeof ctx.createPattern!=='function')return null;
  // Same origin/scale across ALL quads, never reset the UVs per triangle.
  try{
    const pattern=ctx.createPattern(image,'repeat');
    if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
      pattern.setTransform(new DOMMatrix().scale(.83));
    return pattern;
  }catch{return null;}
}
function wallMaterial(ctx,sphere,tile,{
  sphereWallImages=null,rockTexture=null,rockPalette='warm',rockPaletteColors=null
}={}){
  const rock=Array.isArray(rockPaletteColors)&&rockPaletteColors.length>=4
    ?rockPaletteColors:['#b1a597','#908a80','#686d6a','#3b444a'];
  const mode=sphere.wallMaterial??'rock';
  // Reuse the *existing* HD V49 cliff artwork. The atlas layers are extracted
  // once through its own adapter, not sliced or reinterpreted here.
  const layers=sculptCliffHDLayers(rockTexture);
  const image=mode==='rock'?layers?.[
    ['warm','sandstone','ochre'].includes(rockPalette)?'ochre':'gray'
  ]:sphereWallImages?.[mode];
  const pattern=worldPattern(ctx,image);
  const colors=mode==='grass'?['#a1c17c','#679956','#487948','#365c3b']:
    mode==='earth'?['#baa07a','#94765a','#765c48','#55473a']:rock;
  const x=sphere.x,y=sphere.y-sphere.baseLevel*tile.rise,r=sphere.radius;
  const fallback=mode==='rock'?rock[1]:mode==='grass'?'#638c45':'#94765a';
  const color=pattern??gradient(ctx,x-r,y-r,x+r,y+r,colors,fallback);
  return {color,assetUsed:!!pattern};
}
function paintMesh(ctx,terrain,sphere,tile,texture,baseColor,opts){
  const mesh=projectedMesh(terrain,sphere,tile);
  const ground=worldPattern(ctx,texture);
  // Only two compound fills instead of 3,072 individually shaded triangles.
  // Geometry is built once per immutable sphere/terrain pair.
  ctx.beginPath();
  for(const face of mesh.faces)quad(ctx,face.q);
  ctx.fillStyle=sphere.kind==='hill'?(ground??baseColor):'#35483f';
  ctx.fill();
  ctx.beginPath();
  for(const face of mesh.faces)if(face.wall)quad(ctx,face.q);
  const material=wallMaterial(ctx,sphere,tile,opts);
  ctx.fillStyle=material.color;ctx.fill();
  // One continuous world-space light/shade pass over all wall fragments.
  const x=sphere.x,y=sphere.y-sphere.baseLevel*tile.rise,r=sphere.radius;
  ctx.fillStyle=gradient(ctx,x-r,y-r,x+r,y+r,
    ['rgba(246,230,194,.08)','rgba(20,27,25,0)','rgba(11,20,26,.35)'],
    'rgba(11,20,26,.15)');
  ctx.fill();
  if(sphere.kind==='basin'){
    ctx.fillStyle='rgba(9,18,32,.30)';ctx.fill();
  }
  return mesh;
}
function paintRearBand(ctx,sphere,mesh){
  // A shaded CRESCENT on the far/rear half gives readable volume without a
  // permanent black circle. Both its boundaries use the analytic mesh.
  const outer=mesh.nodes[BANDS],inner=mesh.nodes[Math.max(0,BANDS-2)];
  ctx.beginPath();
  for(let i=SECTORS/2;i<=SECTORS;i++){
    const p=outer[i];if(i===SECTORS/2)ctx.moveTo(p.x,p.y);
    else ctx.lineTo(p.x,p.y);
  }
  for(let i=SECTORS;i>=SECTORS/2;i--){const p=inner[i];ctx.lineTo(p.x,p.y);}
  ctx.closePath();
  ctx.fillStyle=sphere.kind==='hill'?'rgba(19,27,29,.24)':'rgba(7,17,29,.35)';
  ctx.fill();
}
export function drawSculptSphereMeshes(ctx,{
  terrain,tile,texture=null,baseColor='#677955',rockPaletteColors=null,
  rockTexture=null,rockPalette='warm',sphereWallImages=null
}={}){
  if(!terrain?.spheres?.length||!ctx)return 0;
  for(const sphere of terrain.spheres){
    const cy=sphere.y-sphere.baseLevel*tile.rise,r=sphere.radius;
    ctx.save();
    if(sphere.kind==='hill'){
      ctx.beginPath();ctx.ellipse(sphere.x+2,cy+4,r*1.065,r*1.04,0,0,TAU);
      ctx.fillStyle='rgba(12,24,27,.29)';ctx.fill();
    }else{
      ctx.beginPath();ctx.ellipse(sphere.x,cy,r,r,0,0,TAU);
      ctx.clip();ctx.fillStyle='#182b32';ctx.fill();
    }
    const mesh=paintMesh(ctx,terrain,sphere,tile,texture,baseColor,
      {rockTexture,rockPalette,rockPaletteColors,sphereWallImages});
    paintRearBand(ctx,sphere,mesh);
    ctx.restore();
  }
  return terrain.spheres.length;
}
export function drawSculptSphereCursor(ctx,{
  terrain,x,y,radius,tile,kind='hill',summitRatio=0
}={}){
  if(!ctx||!terrain)return;
  const col=Math.floor(x/tile.width),row=Math.floor(y/tile.height);
  if(col<0||row<0||col>=terrain.width||row>=terrain.height)return;
  const level=terrain.levels[row*terrain.width+col],yy=y-level*tile.rise;
  ctx.save();
  ctx.beginPath();ctx.arc(x,yy,Math.max(0,radius),0,TAU);
  ctx.lineWidth=2.8;ctx.strokeStyle=kind==='basin'?'#8edbff':'#dbffc2';
  ctx.setLineDash?.([8,5]);ctx.stroke();
  if(summitRatio>0){
    ctx.beginPath();ctx.arc(x,yy,Math.max(0,radius*summitRatio),0,TAU);
    ctx.lineWidth=1.6;ctx.setLineDash?.([3,6]);ctx.stroke();
  }
  ctx.restore();
}
