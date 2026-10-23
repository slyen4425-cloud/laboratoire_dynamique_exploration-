// V76 R4: smooth continuous world-space surface shading, no atlas mosaics.
// Only sculptSphereDisplacementAt owns geometry. Collision World is unchanged.
import {sculptSphereDisplacementAt} from '../world/sculpt-height-model.js';
const TAU=2*Math.PI,SECTORS=64,BANDS=16;
const bounded=(x,a,b)=>Math.max(a,Math.min(b,x));
export function sculptSphereProjectedPoint(terrain,sphere,ratio,angle,tile){
  const x=sphere.x+Math.cos(angle)*sphere.radius*ratio;
  const worldY=sphere.y+Math.sin(angle)*sphere.radius*ratio;
  const delta=sculptSphereDisplacementAt(terrain,x,worldY);
  const level=sphere.baseLevel+delta;
  // R2 visibility: compressed crater depth is a projection only, not a height change.
  const scale=sphere.kind==='basin'?Math.min(1,sphere.radius*.68/(7*tile.rise)):1;
  return Object.freeze({x,y:worldY-sphere.baseLevel*tile.rise-delta*tile.rise*scale,
    worldY,level,delta});
}
function smoothGradient(ctx,x0,y0,x1,y1,colors,fallback){
  if(typeof ctx.createLinearGradient!=='function')return fallback;
  const gradient=ctx.createLinearGradient(x0,y0,x1,y1);
  for(let i=0;i<colors.length;i++)
    gradient.addColorStop(i/(colors.length-1),colors[i]);
  return gradient;
}
function sphereMaterials(ctx,sphere,rockPaletteColors){
  // Gradients share one continuous world-space coordinate frame ACROSS every
  // triangle. Never use the former atlas tiles or per-polygon rock palette:
  // both produced the small square checkerboard seen on the user's Pixel.
  const r=sphere.radius,x=sphere.x,y=sphere.y-sphere.baseLevel*18;
  const rock=Array.isArray(rockPaletteColors)&&rockPaletteColors.length>=4
    ?rockPaletteColors:['#b1a597','#908a80','#686d6a','#3b444a'];
  const material=sphere.wallMaterial??'rock';
  const colorStops=material==='grass'
    ?['#a1c17c','#679956','#487948','#365c3b']
    :material==='earth'
      ?['#baa07a','#94765a','#765c48','#55473a']
      :[rock[0],rock[1],rock[2],rock[3]];
  const fallback=material==='grass'?'#638c45':
    material==='earth'?'#94765a':rock[1];
  const wall=smoothGradient(ctx,x-r*.9,y-r*.9,x+r*.9,y+r*.82,colorStops,fallback);
  // One shared smooth light-to-shadow wash, not 1024 individually tinted quads.
  const shade=smoothGradient(ctx,x-r,y-r,x+r,y+r,
    ['rgba(250,246,218,.14)','rgba(20,27,25,0)','rgba(13,22,26,.25)'],
    'rgba(16,29,34,.10)');
  return {material,wall,shade};
}
function drawFaces(ctx,terrain,sphere,tile,pattern,baseColor,rockPaletteColors){
  const faces=[];
  const materials=sphereMaterials(ctx,sphere,rockPaletteColors);
  for(let ring=0;ring<BANDS;ring++){
    const inner=ring/BANDS,outer=(ring+1)/BANDS;
    for(let sector=0;sector<SECTORS;sector++){
      const a=sector*TAU/SECTORS,b=(sector+1)*TAU/SECTORS;
      const quad=[sculptSphereProjectedPoint(terrain,sphere,inner,a,tile),
        sculptSphereProjectedPoint(terrain,sphere,inner,b,tile),
        sculptSphereProjectedPoint(terrain,sphere,outer,b,tile),
        sculptSphereProjectedPoint(terrain,sphere,outer,a,tile)];
      faces.push({quad,inner,outer,depth:quad.reduce((v,p)=>v+p.worldY,0)/4});
    }
  }
  faces.sort((a,b)=>a.depth-b.depth);
  for(const face of faces){
    const summit=sphere.summitRatio??0;
    const radial=(face.inner+face.outer)*.5;
    const flank=Math.max(0,(radial-summit)/(1-summit));
    const isWall=sphere.kind==='hill'?flank>=.45:flank>=.24;
    const q=face.quad;
    ctx.beginPath();ctx.moveTo(q[0].x,q[0].y);
    for(let i=1;i<q.length;i++)ctx.lineTo(q[i].x,q[i].y);
    ctx.closePath();
    // Real terrain texture only on the crown or a grass slope. Mineral
    // walls are shaded as a coherent surface: no UV tile per triangle.
    ctx.fillStyle=isWall&&materials.material!=='grass'
      ?materials.wall
      :sphere.kind==='hill'?(pattern??baseColor)
        :isWall?materials.wall:'#35483f';
    ctx.fill();
    // Underlying gradient uses identical world coordinates on each polygon.
    ctx.fillStyle=materials.shade;
    ctx.fill();
    if(sphere.kind==='basin'){
      ctx.fillStyle='rgba(9,18,32,.30)';ctx.fill();
    }
  }
}
export function drawSculptSphereMeshes(ctx,{
  terrain,tile,texture=null,baseColor='#677955',rockPaletteColors=null,rockTexture=null
}={}){
  if(!terrain?.spheres?.length||!ctx)return 0;
  // rockTexture remains an optional input for API compatibility but is never
  // stamped into sphere quads. Cliff atlases may still texture legacy cliffs.
  void rockTexture;
  const pattern=texture&&typeof ctx.createPattern==='function'
    ?ctx.createPattern(texture,'repeat'):null;
  if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
    pattern.setTransform(new DOMMatrix().scale(.55));
  for(const sphere of terrain.spheres){
    const cy=sphere.y-sphere.baseLevel*tile.rise,r=sphere.radius;
    ctx.save();
    if(sphere.kind==='hill'){
      // Soft contact volume only; no permanent ring stroke at its boundary.
      ctx.beginPath();ctx.ellipse(sphere.x+2,cy+4,r*1.065,r*1.04,0,0,TAU);
      ctx.fillStyle='rgba(12,24,27,.29)';ctx.fill();
    }else{
      // Recess is clipped to its actual circular footprint. No black circular
      // outline is painted: depth, lighting and geometry reveal its edge.
      ctx.beginPath();ctx.ellipse(sphere.x,cy,r,r,0,0,TAU);
      ctx.clip();ctx.fillStyle='#182b32';ctx.fill();
    }
    drawFaces(ctx,terrain,sphere,tile,pattern,baseColor,rockPaletteColors);
    ctx.restore();
  }
  return terrain.spheres.length;
}
// The guide is ONLY an editor overlay, never baked into the terrain painter.
export function drawSculptSphereCursor(ctx,{
  terrain,x,y,radius,tile,kind='hill',summitRatio=0
}={}){
  if(!ctx||!terrain)return;
  const col=Math.floor(x/tile.width),row=Math.floor(y/tile.height);
  if(col<0||row<0||col>=terrain.width||row>=terrain.height)return;
  const level=terrain.levels[row*terrain.width+col];
  const yy=y-level*tile.rise;
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
