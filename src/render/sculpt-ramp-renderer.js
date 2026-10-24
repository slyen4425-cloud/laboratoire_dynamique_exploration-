// Procedural landscape ramp, visual-only. The canonical WorldObject
// incline shared with stairs is the sole elevation and collision source.
import {sculptHeightAt} from '../world/sculpt-height-model.js';
import {sculptStairCorridor} from '../core/sculpt-stair-traversal.js';
import {sculptCameraProject} from './sculpt-camera-projection.js';

const PALETTE={
  grass:{bands:['#4d7541','#548048','#60894e'],edge:'#29432a',rim:'#9cae78'},
  earth:{bands:['#997349','#a57b50','#ae8659'],edge:'#64472b',rim:'#d2b183'},
  stone:{bands:['#858d89','#939b96','#a6ada7'],edge:'#59605e',rim:'#c4cbc7'}
};
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
export function drawSculptRamp(ctx,object,terrain,{
  view=null,tileWidth=28,tileHeight=21,rise=18,selected=false
}={}){
  const mesh=sculptRampVisualMesh(terrain,object,
    {cellWidth:tileWidth,cellHeight:tileHeight,rise,view});
  if(!mesh)return false;
  const kind=object.objectDefinitionId?.split('.')[2];
  const palette=PALETTE[kind]??PALETTE.grass;
  const samples=mesh.samples,foot=samples[0],head=samples[samples.length-1];
  ctx.save();
  if(!mesh.valid){
    // Visible dashed guide when either bank is not physically connected.
    ctx.beginPath();ctx.moveTo(foot.left.x,foot.left.y);
    ctx.lineTo(head.left.x,head.left.y);ctx.lineTo(head.right.x,head.right.y);
    ctx.lineTo(foot.right.x,foot.right.y);ctx.closePath();
    ctx.fillStyle='rgba(161,72,48,.12)';ctx.fill();
    ctx.setLineDash([8,5]);ctx.lineWidth=2;ctx.strokeStyle='#ed9a79';
    ctx.stroke();ctx.restore();return false;
  }
  for(let i=1;i<samples.length;i++){
    const low=samples[i-1],high=samples[i];
    ctx.beginPath();ctx.moveTo(low.left.x,low.left.y);
    ctx.lineTo(high.left.x,high.left.y);ctx.lineTo(high.right.x,high.right.y);
    ctx.lineTo(low.right.x,low.right.y);ctx.closePath();
    ctx.fillStyle=palette.bands[i%palette.bands.length];ctx.fill();
  }
  ctx.lineWidth=selected?2.5:1.5;ctx.strokeStyle=selected?'#bdffe4':palette.edge;
  ctx.beginPath();ctx.moveTo(foot.left.x,foot.left.y);
  ctx.lineTo(head.left.x,head.left.y);ctx.moveTo(foot.right.x,foot.right.y);
  ctx.lineTo(head.right.x,head.right.y);ctx.stroke();
  ctx.lineWidth=1;ctx.strokeStyle=palette.rim;
  ctx.beginPath();ctx.moveTo(head.left.x,head.left.y);
  ctx.lineTo(head.right.x,head.right.y);ctx.stroke();
  ctx.restore();return true;
}
