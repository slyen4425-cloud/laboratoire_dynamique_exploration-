// Procedural landscape ramp, visual-only. The canonical WorldObject
// incline shared with stairs is the sole elevation and collision source.
import {sculptHeightAt} from '../world/sculpt-height-model.js';
import {sculptStairCorridor} from '../core/sculpt-stair-traversal.js?rev=natural-ramp-v77';
import {sculptCameraProject} from './sculpt-camera-projection.js';

export function sculptRampVisualMesh(terrain,object,{
  cellWidth=28,cellHeight=21,rise=18,view=null,segments=16
}={}){
  if(!terrain||object?.kind!=='ramp'||!object.transform)return null;
  const t=object.transform;
  const corridor=sculptStairCorridor(terrain,object,{cellWidth,cellHeight});
  const len=corridor?.length??object.baseSize.height*t.scaleY;
  const width=corridor?.width??object.baseSize.width*t.scaleX*.68;
  const a=(t.rotationDeg||0)*Math.PI/180;
  const ux=Math.sin(a),uy=-Math.cos(a),sx=-uy,sy=ux;
  const footLevel=corridor?.bottomLevel??sculptHeightAt(terrain,
    Math.floor(t.x/cellWidth),Math.floor(t.y/cellHeight));
  const count=Math.max(2,Math.min(48,Math.round(segments)));
  const samples=[];
  for(let i=0;i<=count;i++){
    const ratio=i/count,level=corridor
      ?corridor.bottomLevel+(corridor.topLevel-corridor.bottomLevel)*ratio:footLevel;
    const cx=t.x+ux*len*ratio,cy=t.y+uy*len*ratio;
    const project=sign=>{
      const x=cx+sx*sign*width*.5,y=cy+sy*sign*width*.5-level*rise;
      return Object.freeze(view?sculptCameraProject(view,x,y):{x,y});
    };
    samples.push(Object.freeze({left:project(-1),right:project(1),level}));
  }
  return Object.freeze({valid:!!corridor,id:object.id,
    footLevel:corridor?.bottomLevel??null,headLevel:corridor?.topLevel??null,
    samples:Object.freeze(samples)});
}
// The slope is now part of the terrain. Use the SAME pattern and baseColor
// as drawSculptTerrain's grassy tops: no bands, fake WorldObject artwork,
// or isolated color palette. Its mesh follows the canonical incline corridor.
export function drawSculptRamp(ctx,object,terrain,{
  view=null,tileWidth=28,tileHeight=21,rise=18,
  texture=null,baseColor='#677955'
}={}){
  const mesh=sculptRampVisualMesh(terrain,object,
    {cellWidth:tileWidth,cellHeight:tileHeight,rise,view,segments:24});
  if(!mesh?.valid)return false;
  const rows=mesh.samples;
  ctx.save();
  const pattern=texture&&typeof ctx.createPattern==='function'
    ?ctx.createPattern(texture,'repeat'):null;
  if(pattern?.setTransform&&typeof DOMMatrix!=='undefined')
    pattern.setTransform(new DOMMatrix().scale(.55));
  ctx.fillStyle=pattern??baseColor;
  // Slight overlap closes micro gaps created by device-pixel rasterization.
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1],b=rows[i];
    ctx.beginPath();ctx.moveTo(a.left.x,a.left.y);
    ctx.lineTo(b.left.x,b.left.y);ctx.lineTo(b.right.x,b.right.y);
    ctx.lineTo(a.right.x,a.right.y);ctx.closePath();ctx.fill();
  }
  // Very subtle world-space soil/grass seam, with no cartoon edge outline.
  const first=rows[0],last=rows.at(-1);
  ctx.beginPath();
  ctx.moveTo(first.left.x,first.left.y);ctx.lineTo(last.left.x,last.left.y);
  ctx.moveTo(first.right.x,first.right.y);ctx.lineTo(last.right.x,last.right.y);
  ctx.strokeStyle='rgba(25,42,26,.15)';ctx.lineWidth=.7;ctx.stroke();
  ctx.restore();return true;
}
