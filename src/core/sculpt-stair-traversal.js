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
// These two native WebPs already contain a painted 2.5D perspective.
// Keep their observable step-foot and landing on the same geometry consumed
// by Collision World AND the image renderer; the front V78 axis is untouched.
const stairArtLandmarks=Object.freeze({
  oblique:Object.freeze({footX:.72,footY:.92,headX:.48,headY:.13}),
  side:Object.freeze({footX:.78,footY:.85,headX:.16,headY:.13}),
  // The cleaned 'Profil A' bitmap rises from LOWER LEFT to UPPER RIGHT,
  // unlike the previous side profile. Keep the original side geometry and
  // WorldObject IDs untouched; this named variant owns its physical axis.
  side_alt:Object.freeze({footX:.12,footY:.74,headX:.87,headY:.28})
});
export function sculptStairArtFrame(stair){
  // New cleaned assets have distinct authored step directions. Prefer
  // the exact visual variant; the historical side axis stays unchanged.
  // Unknown side_* variants retain the existing guarded legacy fallback.
  const variant=stair?.visual?.variantId;
  const art=stair?.kind==='stairs'
    ?(stairArtLandmarks[variant]??(typeof variant==='string'&&
      variant.startsWith('side_')?stairArtLandmarks.side:null)):null;
  if(!art||!stair.transform||!stair.baseSize)return null;
  const t=stair.transform;
  const width=stair.baseSize.width*t.scaleX;
  const height=stair.baseSize.height*t.scaleY;
  const a=(t.rotationDeg||0)*Math.PI/180;
  const flip=t.flipX===true?-1:1;
  // The canvas scales X for mirror *before* rotating the authored sprite.
  const localX=(art.headX-art.footX)*width*flip;
  const localY=(art.headY-art.footY)*height;
  const dx=localX*Math.cos(a)-localY*Math.sin(a);
  const dy=localX*Math.sin(a)+localY*Math.cos(a);
  return Object.freeze({
    variant:stair.visual.variantId,
    footOffsetX:(art.footX-.5)*width,
    footOffsetY:(1-art.footY)*height,
    dx,dy,length:Math.hypot(dx,dy),authorHeight:height
  });
}
export function sculptStairCorridor(terrain,stair,{cellWidth=28,cellHeight=21}={}){
  if(!terrain||!['stairs','ramp'].includes(stair?.kind)||
    !stair.transform||!stair.baseSize)return null;
  const t=stair.transform,w=Number(cellWidth)||28,h=Number(cellHeight)||21;
  const artFrame=sculptStairArtFrame(stair);
  // Authored corrections live ON the stair placement. No secondary ramp,
  // ID or collision override is made: the native route consumes this corridor.
  const custom=stair.kind==='stairs'?stair.stairTraversal:null;
  const authoredFoot=custom?{x:t.x+custom.footOffsetX,y:t.y+custom.footOffsetY}:null;
  const authoredHead=custom?{x:t.x+custom.headOffsetX,y:t.y+custom.headOffsetY}:null;
  const length=custom?Math.hypot(authoredHead.x-authoredFoot.x,
    authoredHead.y-authoredFoot.y):artFrame?.length??stair.baseSize.height*t.scaleY;
  const width=custom?.width??stair.baseSize.width*t.scaleX*.68;
  if(!(length>=h*1.2&&length<=1400&&width>=12&&width<=448))return null;
  // Face uses the historical up-axis. Side and oblique art use the real
  // painted step direction, including user rotation/mirror, not an assumed
  // north-facing vector unrelated to the visible steps.
  const angle=(t.rotationDeg||0)*Math.PI/180;
  const ux=custom?(authoredHead.x-authoredFoot.x)/length:
    artFrame?artFrame.dx/length:Math.sin(angle);
  const uy=custom?(authoredHead.y-authoredFoot.y)/length:
    artFrame?artFrame.dy/length:-Math.cos(angle);
  const foot=authoredFoot??{x:t.x,y:t.y};
  const head=authoredHead??{x:foot.x+ux*length,y:foot.y+uy*length};
  const endProbe=Math.max(3,Math.min(7,h*.24));
  const bottomLevel=readLevel(terrain,foot.x-ux*endProbe,foot.y-uy*endProbe,w,h);
  const topLevel=readLevel(terrain,head.x+ux*endProbe,head.y+uy*endProbe,w,h);
  if(bottomLevel===null||topLevel===null||topLevel<=bottomLevel)return null;
  // A short authored incline cannot bridge a huge vertical cliff. Stretching it
  // increases the maximum ascent, but the TWO REAL terrain heights decide it.
  // The painted perspective stair's footprint is shorter than its authored
  // vertical run. Do not force oversized artwork merely to reach the next
  // full-height cell. Front and ordinary ramp V78 behaviour stays unchanged.
  const supportedRise=Math.max(1,custom?
    Math.floor(length/Math.max(w,h)):artFrame?
    Math.ceil(artFrame.authorHeight/Math.max(w,h)):
    Math.floor(length/Math.max(w,h)));
  if(topLevel-bottomLevel>supportedRise)return null;
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
