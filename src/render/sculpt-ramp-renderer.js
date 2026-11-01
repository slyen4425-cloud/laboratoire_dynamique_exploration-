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
    samples.push(Object.freeze({left:project(-1),right:project(1),level,worldX:cx,worldY:cy}));
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
  texture=null,baseColor='#677955',paintSurface=null,paintImages=null
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
  // The incline keeps the ONE canonical mesh and base material. A WorldSurface
  // road is a stroke in world coordinates; never turn an entire mesh strip into
  // the sampled centre texture (that incorrectly made 24px roads 140px wide).
  for(let i=1;i<rows.length;i++){
    const a=rows[i-1],b=rows[i];
    ctx.beginPath();ctx.moveTo(a.left.x,a.left.y);
    ctx.lineTo(b.left.x,b.left.y);ctx.lineTo(b.right.x,b.right.y);
    ctx.lineTo(a.right.x,a.right.y);ctx.closePath();ctx.fill();
  }
  if(paintSurface&&paintImages){
    const features=[...(paintSurface.zones??[]),...(paintSurface.routes??[])];
    if(features.length){
      const foot=rows[0],head=rows.at(-1);
      const dx=head.worldX-foot.worldX,dy=head.worldY-foot.worldY;
      const lengthSq=dx*dx+dy*dy;
      if(lengthSq>0){
        // The slope is an affine elevation plane. Use its SAME physical rise
        // to map standard WorldSurface strokes without a new paint model.
        const projected=(x,y)=>{
          const t=((x-foot.worldX)*dx+(y-foot.worldY)*dy)/lengthSq;
          const level=foot.level+(head.level-foot.level)*t;
          const raisedY=y-level*rise;
          return view?sculptCameraProject(view,x,raisedY):{x,y:raisedY};
        };
        const origin=projected(0,0),xAxis=projected(1,0),yAxis=projected(0,1);
        const width=(object.baseSize?.width??0)*
          (object.transform?.scaleX??1)*.68;
        const minX=Math.min(foot.worldX,head.worldX)-width*.5-6;
        const maxX=Math.max(foot.worldX,head.worldX)+width*.5+6;
        const minY=Math.min(foot.worldY,head.worldY)-width*.5-6;
        const maxY=Math.max(foot.worldY,head.worldY)+width*.5+6;
        ctx.save();
        // Clip all strokes to the whole incline polygon; a path can cross
        // from grass to ramp to grass without painting beyond its edges.
        ctx.beginPath();ctx.moveTo(rows[0].left.x,rows[0].left.y);
        for(let i=1;i<rows.length;i++)ctx.lineTo(rows[i].left.x,rows[i].left.y);
        for(let i=rows.length-1;i>=0;i--)ctx.lineTo(rows[i].right.x,rows[i].right.y);
        ctx.closePath();ctx.clip();
        ctx.transform(xAxis.x-origin.x,xAxis.y-origin.y,
          yAxis.x-origin.x,yAxis.y-origin.y,origin.x,origin.y);
        ctx.lineCap='round';ctx.lineJoin='round';
        const patterns=new Map();
        for(const feature of features){
          if(!feature?.materialId||!Array.isArray(feature.points)||
            feature.points.length<2||!Number.isFinite(feature.width))continue;
          const rad=feature.width*.5+6;
          if(!feature.points.some(p=>p.x>=minX-rad&&p.x<=maxX+rad&&
             p.y>=minY-rad&&p.y<=maxY+rad) &&
             !feature.points.some((point,i)=>{
               if(!i)return false;
               const other=feature.points[i-1];
               return Math.max(point.x,other.x)>=minX-rad &&
                 Math.min(point.x,other.x)<=maxX+rad &&
                 Math.max(point.y,other.y)>=minY-rad &&
                 Math.min(point.y,other.y)<=maxY+rad;
             }))continue;
          let painted=patterns.get(feature.materialId);
          if(painted===undefined){
            const image=paintImages.get(feature.materialId);
            painted=image?.naturalWidth&&typeof ctx.createPattern==='function'
              ?ctx.createPattern(image,'repeat'):null;
            if(painted?.setTransform&&typeof DOMMatrix!=='undefined')
              painted.setTransform(new DOMMatrix().scale(.55));
            patterns.set(feature.materialId,painted);
          }
          if(!painted)continue;
          ctx.beginPath();
          ctx.moveTo(feature.points[0].x,feature.points[0].y);
          for(let i=1;i<feature.points.length;i++)
            ctx.lineTo(feature.points[i].x,feature.points[i].y);
          ctx.strokeStyle=painted;
          ctx.lineWidth=feature.width+6;ctx.globalAlpha=.20;ctx.stroke();
          ctx.lineWidth=feature.width;ctx.globalAlpha=.95;ctx.stroke();
        }
        ctx.restore();
      }
    }
  }
  // Very subtle world-space soil/grass seam, with no cartoon edge outline.
  const first=rows[0],last=rows.at(-1);
  ctx.beginPath();
  ctx.moveTo(first.left.x,first.left.y);ctx.lineTo(last.left.x,last.left.y);
  ctx.moveTo(first.right.x,first.right.y);ctx.lineTo(last.right.x,last.right.y);
  ctx.strokeStyle='rgba(25,42,26,.15)';ctx.lineWidth=.7;ctx.stroke();
  ctx.restore();return true;
}
