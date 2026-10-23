// V76 R5: cached analytic projected geometry + one seamless material projection.
// World Model still owns all geometry. This file neither stores nor edits collision.
import {sculptSphereDisplacementAt} from '../world/sculpt-height-model.js';
import {sculptCliffHDLayers} from './sculpt-cliff-hd.js';
const TAU=2*Math.PI, SECTORS=36, BANDS=10;
const meshCache=new WeakMap();
// One radius is shared by the LAST grass crown ring and the FIRST rock wall
// ring. R7 split by a threshold half-way down the slope, leaving the crown
// wider than the rocks below (the user's "disc on a smaller cone" bug).
// At summitRatio > 0, this radius is EXACTLY the World Model's flat plateau.
// For legacy round spheres (summitRatio = 0), retain a curved grass crown.
export function sculptSphereVisualContact(sphere){
  const flat=sphere?.summitRatio??0;
  // A 100%-wide summit has a vertical wall. The canonical height remains
  // full until radius=1 and drops precisely at the perimeter; the tiny inner
  // rendering ring (~0.1px) supplies the vertical face without new geometry.
  return flat>=1?.999:flat>0?flat:(sphere?.kind==='basin'?.24:.45);
}
export function sculptSphereRadialRings(sphere){
  const seam=sculptSphereVisualContact(sphere);
  // Keep V76's light 10-band mesh; one extra ring enforces the exact seam
  // even for a summit such as 75%, which sits BETWEEN .7 and .8.
  const radii=Array.from({length:BANDS+1},(_,i)=>i/BANDS);
  if(!radii.some(r=>Math.abs(r-seam)<1e-9))radii.push(seam);
  radii.sort((a,b)=>a-b);
  return Object.freeze(radii);
}
// The same visual cues used by sculpt-height-renderer.js for standard cliffs:
// height-dependent terrain tint, contact shadows (max .37), a dark upper lip
// (max .52), directional rock light (.12 / .19) and a darker cliff foot.
// No separate height, collision or material authority is introduced here.
export function sculptSphereReliefLighting(sphere){
  const levels=Math.max(1,Math.min(7,Number(sphere?.height)||1));
  const signed=(sphere?.kind==='basin'?-1:1)*levels;
  return Object.freeze({
    topTone:Math.max(-.065,Math.min(.105,
      ((Number(sphere?.baseLevel)||0)+signed-2)*.029)),
    contactOpacity:Math.min(.37,.19+Math.min(levels,3)*.055),
    rimOpacity:Math.min(.52,.28+levels*.034),
    footOpacity:Math.min(.42,.20+levels*.032),
    lightOpacity:.12,
    sideOpacity:.19
  });
}
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
  const nodes=[],radii=sculptSphereRadialRings(sphere);
  const border=sculptSphereVisualContact(sphere);
  for(let band=0;band<radii.length;band++){
    const pts=[],radius=radii[band];
    for(let sector=0;sector<=SECTORS;sector++)
      pts.push(sculptSphereProjectedPoint(terrain,sphere,radius,
        sector*TAU/SECTORS,tile));
    nodes.push(pts);
  }
  const faces=[];
  for(let band=0;band<radii.length-1;band++){
    for(let sector=0;sector<SECTORS;sector++){
      const q=[nodes[band][sector],nodes[band][sector+1],
        nodes[band+1][sector+1],nodes[band+1][sector]];
      const innerRadius=radii[band],outerRadius=radii[band+1];
      const radial=(innerRadius+outerRadius)/2;
      // The same vertices define both sides: zero grass overhang, zero
      // unpainted gap and no approximate face threshold.
      faces.push({q,wall:innerRadius>=border-1e-9,
        innerRadius,outerRadius,radial,
        depth:q.reduce((v,p)=>v+p.worldY,0)/4});
    }
  }
  faces.sort((a,b)=>a.depth-b.depth);
  const mesh={terrain,rise:tile.rise,nodes,faces,radii,border};
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
// Paint all faces of one depth layer as ONE Canvas path. Rock/grass assets
// remain world-anchored; no tile is stamped onto an individual triangle.
function fillLayer(ctx,faces,color){
  if(!faces.length)return;
  ctx.beginPath();
  for(const face of faces)quad(ctx,face.q);
  ctx.fillStyle=color;ctx.fill();
}
function shadeLayer(ctx,faces,color){
  if(!faces.length)return;
  ctx.beginPath();
  for(const face of faces)quad(ctx,face.q);
  ctx.fillStyle=color;ctx.fill();
}
function paintMesh(ctx,terrain,sphere,tile,texture,baseColor,opts){
  const mesh=projectedMesh(terrain,sphere,tile);
  const ground=worldPattern(ctx,texture);
  const groundColor=sphere.kind==='hill'?(ground??baseColor):'#35483f';
  const rearWalls=[],frontWalls=[],crown=[];
  for(const face of mesh.faces){
    if(!face.wall)crown.push(face);
    else if(face.depth<sphere.y)rearWalls.push(face);
    else frontWalls.push(face);
  }
  const material=wallMaterial(ctx,sphere,tile,opts);
  const x=sphere.x,y=sphere.y-sphere.baseLevel*tile.rise,r=sphere.radius;
  const lighting=sculptSphereReliefLighting(sphere);
  const rock=sphere.wallMaterial!=='grass';
  // Standard cliffs use pale upper rock, medium neutral middle, and dark
  // lower foot. Both gradients are WORLD anchored and reused for all faces.
  const vertical=gradient(ctx,x,y-r-sphere.height*tile.rise,x,y+r,
    [
      rock?'rgba(245,227,197,.09)':'rgba(234,249,210,.07)',
      'rgba(16,31,34,.05)',
      'rgba(16,31,34,'+lighting.footOpacity+')'
    ],'rgba(16,31,34,.16)');
  const side=gradient(ctx,x-r,y,x+r,y,
    [
      'rgba(245,227,197,'+lighting.lightOpacity+')',
      'rgba(245,227,197,.015)',
      'rgba(19,30,46,'+lighting.sideOpacity+')'
    ],'rgba(19,30,46,.10)');
  const foot=gradient(ctx,x,y-r,x,y+r,
    ['rgba(16,31,34,0)','rgba(16,31,34,.06)',
      'rgba(16,31,34,'+lighting.contactOpacity+')'],
    'rgba(16,31,34,.16)');
  // Lower outside skirt only, shared by grass/earth/rock and scaled to height.
  const footRear=rearWalls.filter(f=>f.radial>=.78);
  const footFront=frontWalls.filter(f=>f.radial>=.78);
  // The upper grass keeps a lightly illuminated center and a FEATHERED
  // shadow band where its edge falls into the rock wall. No inked ring.
  const crownMax=crown.length?Math.max(...crown.map(f=>f.radial)):0;
  const crownLip=crown.filter(f=>f.radial>=crownMax-.105);
  // The natural contact tint is INSIDE the plateau only: rock and grass
  // meet at the same projected vertices, never a widened grass disc.
  const grassShoulder=crown.filter(f=>
    Math.abs(f.outerRadius-mesh.border)<1e-9);
  const rim=gradient(ctx,x-r,y-r,x+r,y+r,
    [
      'rgba(16,31,34,'+(lighting.rimOpacity*.74)+')',
      'rgba(16,31,34,'+(lighting.rimOpacity*.15)+')',
      'rgba(16,31,34,'+lighting.rimOpacity+')'
    ],'rgba(16,31,34,.20)');
  const tone=lighting.topTone>0
    ?'rgba(251,243,206,'+lighting.topTone+')'
    :'rgba(15,35,39,'+(-lighting.topTone)+')';
  // Preserve R6's validated occlusion order: the REAR rock/side shading goes
  // behind the green crown; only the near wall may overlap its front rim.
  fillLayer(ctx,mesh.faces,groundColor);
  fillLayer(ctx,rearWalls,material.color);
  shadeLayer(ctx,rearWalls,vertical);
  shadeLayer(ctx,rearWalls,side);
  shadeLayer(ctx,footRear,foot);
  if(sphere.kind==='basin')shadeLayer(ctx,rearWalls,'rgba(9,18,32,.30)');
  paintRearBand(ctx,sphere,mesh);
  fillLayer(ctx,crown,groundColor);
  if(lighting.topTone!==0)shadeLayer(ctx,crown,tone);
  shadeLayer(ctx,grassShoulder,
    sphere.kind==='hill'?'rgba(105,87,55,.11)':'rgba(68,73,50,.09)');
  shadeLayer(ctx,crownLip,rim);
  fillLayer(ctx,frontWalls,material.color);
  shadeLayer(ctx,frontWalls,vertical);
  shadeLayer(ctx,frontWalls,side);
  shadeLayer(ctx,footFront,foot);
  if(sphere.kind==='basin')shadeLayer(ctx,frontWalls,'rgba(9,18,32,.30)');
  return mesh;
}
function paintRearBand(ctx,sphere,mesh){
  // A shaded CRESCENT on the far/rear half gives readable volume without a
  // permanent black circle. Both its boundaries use the analytic mesh.
  const last=mesh.nodes.length-1;
  const outer=mesh.nodes[last],inner=mesh.nodes[Math.max(0,last-2)];
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
    // Shadow band already painted behind the crown by paintMesh.
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
