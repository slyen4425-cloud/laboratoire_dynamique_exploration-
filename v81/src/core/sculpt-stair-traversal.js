// One authored incline corridor shared by stairs and ground ramps.
// Collision World and presentation read the SAME WorldObject + real terrain;
// art alpha and painted shapes never grant elevation or passage.
import {sculptHeightAt,sculptWaterAt,sculptSphereAt} from '../world/sculpt-height-model.js';

const readLevel=(terrain,x,y,w,h)=>{
  const col=Math.floor(x/w),row=Math.floor(y/h);
  if(!terrain||col<0||row<0||col>=terrain.width||row>=terrain.height)return null;
  if(sculptWaterAt(terrain,col,row)>0)return null;
  if(sculptSphereAt(terrain,x,y,0))return null;
  return sculptHeightAt(terrain,col,row);
};
export function sculptStairCorridor(terrain,stair,{cellWidth=28,cellHeight=21}={}){
  if(!terrain||!['stairs','ramp'].includes(stair?.kind)||
    !stair.transform||!stair.baseSize)return null;
  const t=stair.transform,w=Number(cellWidth)||28,h=Number(cellHeight)||21;
  const length=stair.baseSize.height*t.scaleY;
  const width=stair.baseSize.width*t.scaleX*.68;
  if(!(length>=h*1.2&&width>0))return null;
  // The artwork's anchor is its BOTTOM FOOT, pointing toward the top edge.
  // WorldObject rotation rotates this canonical up-axis without visual alpha.
  const angle=(t.rotationDeg||0)*Math.PI/180;
  const ux=Math.sin(angle),uy=-Math.cos(angle);
  const foot={x:t.x,y:t.y};
  const head={x:foot.x+ux*length,y:foot.y+uy*length};
  const endProbe=Math.max(3,Math.min(7,h*.24));
  const bottomLevel=readLevel(terrain,foot.x-ux*endProbe,foot.y-uy*endProbe,w,h);
  const topLevel=readLevel(terrain,head.x+ux*endProbe,head.y+uy*endProbe,w,h);
  if(bottomLevel===null||topLevel===null||topLevel<=bottomLevel)return null;
  // A short authored incline cannot bridge a huge vertical cliff. Stretching it
  // increases the maximum ascent, but the TWO REAL terrain heights decide it.
  if(topLevel-bottomLevel>Math.max(1,Math.floor(length/Math.max(w,h))))return null;
  return Object.freeze({id:stair.id,kind:stair.kind,foot:Object.freeze(foot),head:Object.freeze(head),
    ux,uy,length,width,bottomLevel,topLevel});
}
export function sculptStairLocal(corridor,x,y){
  const dx=x-corridor.foot.x,dy=y-corridor.foot.y;
  return {along:dx*corridor.ux+dy*corridor.uy,
    sideways:dx*(-corridor.uy)+dy*corridor.ux};
}
export function sculptStairAt(corridors,x,y,radius=0){
  for(const corridor of corridors){
    const {along,sideways}=sculptStairLocal(corridor,x,y);
    if(along>=Math.max(0,radius)-1e-6&&along<=corridor.length-Math.max(0,radius)+1e-6&&
       Math.abs(sideways)<=corridor.width/2-Math.max(0,radius)+1e-6)
      return corridor;
  }
  return null;
}
export function sculptStairHeightAt(terrain,stairs,id,x,y,options={}){
  if(!id)return null;
  const corridor=sculptStairCorridor(terrain,stairs.find(s=>s.id===id),options);
  if(!corridor)return null;
  const local=sculptStairLocal(corridor,x,y);
  if(local.along<-8||local.along>corridor.length+8||
     Math.abs(local.sideways)>corridor.width/2+2)return null;
  const ratio=Math.max(0,Math.min(1,local.along/corridor.length));
  return corridor.bottomLevel+(corridor.topLevel-corridor.bottomLevel)*ratio;
}
