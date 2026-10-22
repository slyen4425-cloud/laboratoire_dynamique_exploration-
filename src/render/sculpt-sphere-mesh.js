// V76: painter for the canonical continuous spherical sculpt features.
// Each vertex reads the same analytic surface as Collision World's footprint.
// No geometry is inferred from the bitmap, alpha, grid-cell contours or camera.
import {sculptSphereDisplacementAt} from '../world/sculpt-height-model.js';
const TWOPI=Math.PI*2;
const point=(terrain,f,ratio,angle,tile)=>{
  const x=f.x+Math.cos(angle)*f.radius*ratio;
  const y=f.y+Math.sin(angle)*f.radius*ratio;
  const level=f.baseLevel+sculptSphereDisplacementAt(terrain,x,y);
  return {x,y:y-level*tile.rise,worldY:y,level};
};
export function drawSculptSphereMeshes(ctx,{terrain,tile,texture=null,baseColor='#677955'}={}){
  if(!terrain?.spheres?.length||!ctx)return 0;
  const pattern=texture&&typeof ctx.createPattern==='function'
    ?ctx.createPattern(texture,'repeat'):null;
  if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
    pattern.setTransform(new DOMMatrix().scale(.55));
  const sections=56,bands=14;
  for(const f of terrain.spheres){
    const polygons=[];
    // Truly circular world footprint, analytic hemisphere profile at every
    // sub-tile vertex, triangulation only for Canvas rasterization.
    for(let band=0;band<bands;band++){
      const inner=band/bands,outer=(band+1)/bands;
      for(let sector=0;sector<sections;sector++){
        const a=sector*TWOPI/sections,b=(sector+1)*TWOPI/sections;
        const quad=[point(terrain,f,inner,a,tile),point(terrain,f,inner,b,tile),
          point(terrain,f,outer,b,tile),point(terrain,f,outer,a,tile)];
        polygons.push({quad,worldY:quad.reduce((v,p)=>v+p.worldY,0)/4,
          angle:(a+b)*.5,inner,outer});
      }
    }
    polygons.sort((a,b)=>a.worldY-b.worldY);
    ctx.save();
    for(const face of polygons){
      const a=face.quad;ctx.beginPath();ctx.moveTo(a[0].x,a[0].y);
      for(let i=1;i<a.length;i++)ctx.lineTo(a[i].x,a[i].y);
      ctx.closePath();
      ctx.fillStyle=pattern??baseColor;ctx.fill();
      // A radial light/shadow profile makes real heights readable without
      // drawing any tile grid. A basin darkens towards its recessed floor.
      const light=(Math.sin(face.angle)-Math.cos(face.angle))*.5;
      const depth=1-face.inner;
      const alpha=f.kind==='hill'
        ?Math.min(.32,.08+depth*.07+Math.max(0,light)*.13)
        :Math.min(.52,.15+depth*.25+Math.max(0,light)*.08);
      ctx.fillStyle=f.kind==='hill'
        ?'rgba(27,49,37,'+alpha.toFixed(3)+')'
        :'rgba(26,31,45,'+alpha.toFixed(3)+')';
      ctx.fill();
    }
    // Rim is a CIRCLE in authored world X/Y, not a square mask. Its altitude
    // equals the canonical flat host plateau at the feature boundary.
    ctx.beginPath();
    ctx.ellipse(f.x,f.y-f.baseLevel*tile.rise,f.radius,f.radius,0,0,TWOPI);
    ctx.strokeStyle=f.kind==='hill'?'rgba(30,45,30,.42)':'rgba(18,36,45,.58)';
    ctx.lineWidth=1.5;ctx.stroke();
    ctx.restore();
  }
  return terrain.spheres.length;
}
export function drawSculptSphereCursor(ctx,{terrain,x,y,radius,tile,kind='hill'}={}){
  if(!ctx||!terrain)return;
  const col=Math.floor(x/tile.width),row=Math.floor(y/tile.height);
  if(col<0||row<0||col>=terrain.width||row>=terrain.height)return;
  const level=terrain.levels[row*terrain.width+col];
  ctx.save();ctx.beginPath();
  ctx.arc(x,y-level*tile.rise,Math.max(0,radius),0,TWOPI);
  ctx.lineWidth=1.7;ctx.strokeStyle=kind==='basin'?'#8edbff':'#e6ffbf';
  ctx.setLineDash?.([6,4]);ctx.stroke();
  ctx.restore();
}
