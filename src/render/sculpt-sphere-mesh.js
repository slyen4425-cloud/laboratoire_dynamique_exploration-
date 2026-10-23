// V76 R2 — visible volume from the SAME canonical analytic sphere.
// No new collision, bitmap geometry or persistent mesh. All Y displacement
// uses sculptSphereDisplacementAt, the same function as the sculpt model.
import {sculptSphereDisplacementAt} from '../world/sculpt-height-model.js';
const TAU=2*Math.PI;
const SECTORS=64, BANDS=16;
const bounded=(x,min,max)=>Math.max(min,Math.min(max,x));
export function sculptSphereProjectedPoint(terrain,sphere,ratio,angle,tile){
  const x=sphere.x+Math.cos(angle)*sphere.radius*ratio;
  const worldY=sphere.y+Math.sin(angle)*sphere.radius*ratio;
  const delta=sculptSphereDisplacementAt(terrain,x,worldY);
  const level=sphere.baseLevel+delta;
  // A crater floor must remain visible *inside* its circular aperture.
  // Perspective compresses ONLY the drawn vertical depth, never the stored
  // analytic height, footprint or collision. Deeper authoring still produces
  // a monotonically deeper floor through all 1..7 levels (no saturation).
  const depthViewScale=sphere.kind==='basin'
    ?Math.min(1,sphere.radius*.68/(7*tile.rise)):1;
  const screenY=worldY-sphere.baseLevel*tile.rise-delta*tile.rise*depthViewScale;
  return Object.freeze({x,y:screenY,worldY,level,delta});
}
function ringPath(ctx,terrain,sphere,ratio,tile){
  ctx.beginPath();
  for(let i=0;i<=SECTORS;i++){
    const p=sculptSphereProjectedPoint(terrain,sphere,ratio,i*TAU/SECTORS,tile);
    if(i===0)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);
  }
  ctx.closePath();
}
function rockColor(rockPaletteColors,angle,band){
  const defaultRock=['#b1a597','#908a80','#686d6a','#3b444a'];
  const palette=Array.isArray(rockPaletteColors)&&rockPaletteColors.length>=4
    ?rockPaletteColors:defaultRock;
  // Same selected cliff palette as the rest of the sculpt terrain.
  const light=Math.cos(angle-3.9);
  const index=bounded(Math.floor(band+1.05-light*.88),0,3);
  return palette[index];
}
function paintFaces(ctx,terrain,sphere,tile,pattern,baseColor,rockPaletteColors,rockPattern){
  const faces=[];
  for(let ring=0;ring<BANDS;ring++){
    const inner=ring/BANDS,outer=(ring+1)/BANDS;
    for(let sector=0;sector<SECTORS;sector++){
      const a=sector*TAU/SECTORS,b=(sector+1)*TAU/SECTORS;
      const quad=[sculptSphereProjectedPoint(terrain,sphere,inner,a,tile),
        sculptSphereProjectedPoint(terrain,sphere,inner,b,tile),
        sculptSphereProjectedPoint(terrain,sphere,outer,b,tile),
        sculptSphereProjectedPoint(terrain,sphere,outer,a,tile)];
      faces.push({quad,inner,outer,ring,sector,angle:(a+b)/2,
        depth:quad.reduce((v,p)=>v+p.worldY,0)/4});
    }
  }
  // Back to front in world depth; keep one deterministic Canvas painter.
  faces.sort((a,b)=>a.depth-b.depth);
  for(const face of faces){
    const {inner,angle,quad}=face;
    const isHill=sphere.kind==='hill';
    // Wall vs terrace follows the authored plateau radius, not a flat ring
    // texture that could disagree with the canonical height profile.
    const summit=sphere.summitRatio??0;
    const flank=Math.max(0,(inner-summit)/(1-summit));
    const isWall=isHill?flank>=.53:flank>=.33;
    const wallMaterial=sphere.wallMaterial??'rock';
    const light=Math.cos(angle-3.9);
    ctx.beginPath();ctx.moveTo(quad[0].x,quad[0].y);
    for(let i=1;i<quad.length;i++)ctx.lineTo(quad[i].x,quad[i].y);
    ctx.closePath();
    if(isWall){
      // Mineral flanks make the HEIGHT (or DEPTH) obvious even with the
      // exact same grass texture as surrounding ground. Band = actual slope.
      ctx.fillStyle=wallMaterial==='grass'?(pattern??'#638c45'):
        wallMaterial==='earth'?(isHill?'#94765a':'#796149'):
          rockColor(rockPaletteColors,angle,isHill?(flank>.81?1.7:.8):
            (flank>.76?1.15:2.15));
    }else{
      ctx.fillStyle=isHill?(pattern??baseColor):'#35483f';
    }
    ctx.fill();
    // Optical shading follows the actual flank rather than the global radius:
    // a wide flat summit must stay flat, even on a high column.
    if(isWall&&rockPattern&&wallMaterial!=='grass'){
      ctx.fillStyle=rockPattern;ctx.globalAlpha=wallMaterial==='rock'?.32:.16;
      ctx.fill();ctx.globalAlpha=1;
    }
    if(isWall&&face.ring%2===0&&face.sector%4===0){
      // Sparse mineral seams / soil flecks / short grass strokes: visible
      // texture even if the user has no external atlas loaded on mobile.
      const a=quad[2],b=quad[3];
      ctx.beginPath();ctx.moveTo(a.x*.7+b.x*.3,a.y*.7+b.y*.3);
      ctx.lineTo(a.x*.42+b.x*.58,a.y*.42+b.y*.58);
      ctx.strokeStyle=wallMaterial==='grass'?'rgba(169,216,130,.56)':
        wallMaterial==='earth'?'rgba(210,174,120,.49)':'rgba(219,209,190,.40)';
      ctx.lineWidth=wallMaterial==='grass'?1.1:.7;ctx.stroke();
    }
    const slope=flank/Math.sqrt(Math.max(.005,1-flank*flank));
    const directional=bounded(.5-light*.5,0,1);
    const alpha=isHill
      ?bounded(.06+Math.min(1,slope/3)*.21+directional*.22,0,.53)
      :bounded(.30+Math.min(1,slope/2)*.12+directional*.26,0,.75);
    ctx.fillStyle=isHill
      ?'rgba(16,29,34,'+alpha.toFixed(3)+')'
      :'rgba(9,18,32,'+alpha.toFixed(3)+')';
    ctx.fill();
  }
}
export function drawSculptSphereMeshes(ctx,{
  terrain,tile,texture=null,baseColor='#677955',rockPaletteColors=null,rockTexture=null
}={}){
  if(!terrain?.spheres?.length||!ctx)return 0;
  const pattern=texture&&typeof ctx.createPattern==='function'
    ?ctx.createPattern(texture,'repeat'):null;
  if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
    pattern.setTransform(new DOMMatrix().scale(.55));
  const rockPattern=rockTexture&&typeof ctx.createPattern==='function'
    ?ctx.createPattern(rockTexture,'repeat'):null;
  if(rockPattern?.setTransform&&typeof DOMMatrix!=='undefined')
    rockPattern.setTransform(new DOMMatrix().scale(.24));
  for(const sphere of terrain.spheres){
    const cy=sphere.y-sphere.baseLevel*tile.rise;
    const r=sphere.radius;
    ctx.save();
    if(sphere.kind==='hill'){
      // Contact shadow stays on the base surface while the mesh is lifted
      // by the true height (1..7 levels). No fake drop or second geometry.
      ctx.beginPath();ctx.ellipse(sphere.x+2,cy+4,r*1.065,r*1.04,0,0,TAU);
      ctx.fillStyle='rgba(12,24,27,.29)';ctx.fill();
      ctx.beginPath();ctx.ellipse(sphere.x,cy,r,r,0,0,TAU);
      ctx.strokeStyle='rgba(24,34,34,.35)';ctx.lineWidth=2;ctx.stroke();
    }else{
      // Cut a real circular aperture in the painted ground. Without this
      // clip the lowered polygons spill across adjacent terrain, and with
      // the old same-grass fill the crater resembled a flat tinted disc.
      ctx.beginPath();ctx.ellipse(sphere.x,cy,r,r,0,0,TAU);
      ctx.strokeStyle='rgba(12,22,30,.52)';ctx.lineWidth=8;ctx.stroke();
      ctx.clip();
      ctx.fillStyle='#182b32';ctx.fill();
    }
    paintFaces(ctx,terrain,sphere,tile,pattern,baseColor,rockPaletteColors,rockPattern);
    // R3: no permanent concentric guide rings. Brush circles are editor-only.
    ctx.restore();
    // A single canonical circular rim, like the actual collision outline.
    // The cavity's front lip is deliberately darker than its rear lip.
    ctx.save();
    ringPath(ctx,terrain,sphere,1,tile);
    ctx.lineWidth=sphere.kind==='hill'?1.1:2.5;
    ctx.strokeStyle=sphere.kind==='hill'
      ?'rgba(47,57,45,.68)':'rgba(15,28,34,.83)';
    ctx.stroke();ctx.restore();
  }
  return terrain.spheres.length;
}
export function drawSculptSphereCursor(ctx,{terrain,x,y,radius,tile,kind='hill'}={}){
  if(!ctx||!terrain)return;
  const col=Math.floor(x/tile.width),row=Math.floor(y/tile.height);
  if(col<0||row<0||col>=terrain.width||row>=terrain.height)return;
  const level=terrain.levels[row*terrain.width+col];
  ctx.save();ctx.beginPath();
  ctx.arc(x,y-level*tile.rise,Math.max(0,radius),0,TAU);
  ctx.lineWidth=1.7;ctx.strokeStyle=kind==='basin'?'#8edbff':'#e6ffbf';
  ctx.setLineDash?.([6,4]);ctx.stroke();ctx.restore();
}
