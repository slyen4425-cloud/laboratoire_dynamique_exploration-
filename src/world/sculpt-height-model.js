import {normalizeSculptWaterMaterialRuns,validSculptWaterMaterialRuns,sculptWaterMaterialCells,compactSculptWaterMaterialCells,isSculptWaterMaterial,DEFAULT_SCULPT_WATER_MATERIAL} from './sculpt-water-materials-v1.js';
// Experimental heightfield. Isolated from WorldSurface/WorldDocument and Collision World.
// Cells, heights and brush results are deterministic, immutable, JSON-compatible data.
export const SCULPT_SCHEMA_VERSION=1;
// Shared terrain authoring bound; water and brush radius have separate limits.
export const SCULPT_TERRAIN_MAX_LEVEL=16;
// V76: canonical continuous spherical relief; never inferred from painted pixels.
export const SCULPT_SPHERE_LIMIT=24;
export const SCULPT_TERRAIN_RAMP_LIMIT=64;
const sphericalKinds=new Set(['hill','basin']);
export const SCULPT_SPHERE_WALL_MATERIALS=Object.freeze(['rock','grass','earth']);
const sphereWallMaterials=new Set(SCULPT_SPHERE_WALL_MATERIALS);
const validSphere=(f,w,h)=>f&&typeof f.id==='string'&&/^sculpt-sphere-[1-9][0-9]*$/.test(f.id)&&
  sphericalKinds.has(f.kind)&&[f.x,f.y,f.radius].every(Number.isFinite)&&
  f.radius>=14&&f.radius<=448&&f.x-f.radius>=0&&f.y-f.radius>=0&&
  f.x+f.radius<=w*28&&f.y+f.radius<=h*21&&
  Number.isInteger(f.height)&&f.height>=1&&f.height<=16&&
  Number.isInteger(f.baseLevel)&&f.baseLevel>=0&&f.baseLevel<=16&&
  (f.summitRatio===undefined||(Number.isFinite(f.summitRatio)&&f.summitRatio>=0&&f.summitRatio<=1))&&
  (f.wallMaterial===undefined||sphereWallMaterials.has(f.wallMaterial));
export function sculptSphereDisplacementAt(terrain,x,y){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return 0;
  let offset=0;
  for(const f of terrain.spheres??[]){
    const dx=(x-f.x)/f.radius,dy=(y-f.y)/f.radius;
    const d2=dx*dx+dy*dy;
    if(d2<1){
      // One canonical elevation profile for collision, gameplay and render.
      // Legacy round domes stay spherical. A flat-topped hill uses the user's
      // requested conical/frustum sides; 100% is a vertical-sided round plateau.
      const summit=f.summitRatio??0,radial=Math.sqrt(d2);
      const lift=summit>=1?1:summit>0?
        Math.max(0,Math.min(1,(1-radial)/(1-summit))):
        Math.sqrt(Math.max(0,1-d2));
      offset+=(f.kind==='hill'?1:-1)*f.height*lift;
    }
  }
  return offset;
}
export function sculptSphereAt(terrain,x,y,padding=0){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return null;
  return (terrain.spheres??[]).find(f=>Math.hypot(x-f.x,y-f.y)<f.radius+Math.max(0,padding))??null;
}
export function appendSculptSphere(terrain,{kind='hill',x,y,radius=112,height=3,
  summitRatio=0,wallMaterial='rock'}={}){
  if(!terrain||!sphericalKinds.has(kind)||!Number.isFinite(x)||!Number.isFinite(y)||
     !Number.isFinite(radius)||!Number.isInteger(height)||height<1||height>16||
     (terrain.spheres?.length??0)>=SCULPT_SPHERE_LIMIT)return terrain;
  const baseLevel=sculptHeightAt(terrain,Math.floor(x/28),Math.floor(y/21));
  const ids=new Set((terrain.spheres??[]).map(f=>f.id));
  let index=1;while(ids.has('sculpt-sphere-'+index))index++;
  const f=Object.freeze({id:'sculpt-sphere-'+index,kind,x,y,radius,height,baseLevel,
    summitRatio,wallMaterial});
  if(!validSphere(f,terrain.width,terrain.height))return terrain;
  // For V76, keep caps truly continuous: place only over a dry, flat patch
  // without overlapping another sphere or secretly modifying grid heights.
  const a=Math.floor((x-radius)/28),b=Math.min(terrain.width-1,Math.floor((x+radius)/28));
  const c=Math.floor((y-radius)/21),d=Math.min(terrain.height-1,Math.floor((y+radius)/21));
  for(let row=c;row<=d;row++)for(let col=a;col<=b;col++)
    if(sculptHeightAt(terrain,col,row)!==baseLevel||sculptWaterAt(terrain,col,row)>0)
      return terrain;
  if((terrain.spheres??[]).some(old=>Math.hypot(x-old.x,y-old.y)<radius+old.radius))
    return terrain;
  return Object.freeze({...terrain,spheres:Object.freeze([...(terrain.spheres??[]),f])});
}
export function removeSculptSphereAt(terrain,x,y){
  const found=sculptSphereAt(terrain,x,y);
  return found?Object.freeze({...terrain,spheres:Object.freeze(terrain.spheres.filter(f=>f.id!==found.id))}):terrain;
}

const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const int=(v,f)=>Number.isInteger(v)?v:f;
export function createSculptTerrain({width=36,height=24,levels=null,waterLevels=null,roundness=null,spheres=null,ramps=null,navigationBlockedCells=null,waterMaterialRuns=null}={}){
  const w=clamp(int(width,36),8,80),h=clamp(int(height,24),8,64);
  const data=Array.from({length:w*h},(_,i)=>clamp(int(levels?.[i],2),0,16));
  const water=Array.from({length:w*h},(_,i)=>clamp(int(waterLevels?.[i],-1),-1,10));
  const contours=Array.from({length:w*h},(_,i)=>clamp(int(roundness?.[i],95),0,150));
  // Optional canonical terrain mask. Existing documents without zones keep
  // their exact save shape; collision remains the only movement authority.
  const blocks=Array.isArray(navigationBlockedCells)
    ?[...new Set(navigationBlockedCells.filter(i=>Number.isInteger(i)&&i>=0&&i<w*h))].sort((a,b)=>a-b)
    :[];
  const waterMaterials=normalizeSculptWaterMaterialRuns(waterMaterialRuns,w*h);
  return Object.freeze({schemaVersion:SCULPT_SCHEMA_VERSION,width:w,height:h,
    ...(waterMaterials.length?{waterMaterialRuns:waterMaterials}:{}),
    levels:Object.freeze(data),waterLevels:Object.freeze(water),roundness:Object.freeze(contours),
    spheres:Object.freeze((Array.isArray(spheres)?spheres:[]).map(f=>Object.freeze({...f}))),
    ramps:Object.freeze((Array.isArray(ramps)?ramps:[]).map(f=>Object.freeze({...f}))),
    ...(blocks.length?{navigationBlockedCells:Object.freeze(blocks)}:{})});
}
// Native terrain incline, not a placed WorldObject. Kept alongside spheres
// in the sculpt height model, so Undo and Export heights share one authority.
const validTerrainRamp=(r,w,h)=>r&&typeof r.id==='string'&&
  /^sculpt-ramp-[1-9][0-9]*$/.test(r.id)&&
  [r.x,r.y,r.length,r.width,r.rotationDeg].every(Number.isFinite)&&
  r.length>=21&&r.length<=1400&&r.width>=12&&r.width<=448&&
  r.x>=0&&r.y>=0&&r.x<w*28&&r.y<h*21&&
  (r.navigationOnly===undefined||r.navigationOnly===true)&&
  (r.support===undefined||(r.navigationOnly===true&&r.support==='footbridge'))&&
  (r.visibleInPlay===undefined||(r.support==='footbridge'&&typeof r.visibleInPlay==='boolean'));
const rampFloor=(terrain,x,y)=>{
  const c=Math.floor(x/28),row=Math.floor(y/21);
  if(c<0||row<0||c>=terrain.width||row>=terrain.height||
    sculptWaterAt(terrain,c,row)>0||sculptSphereAt(terrain,x,y,0))return null;
  return sculptHeightAt(terrain,c,row);
};
export function sculptTerrainRampProjections(terrain){
  return Object.freeze((terrain?.ramps??[]).filter(r=>!r.support).map(r=>Object.freeze({
    id:r.id,kind:'ramp',...(r.navigationOnly===true?{navigationOnly:true}:{}),
    // Reuse the EXACT incline corridor consumed by Collision World and stairs.
    // Authoring owns only the terrain shape, not an object definition.
    transform:Object.freeze({x:r.x,y:r.y,scaleX:1,scaleY:1,rotationDeg:r.rotationDeg}),
    baseSize:Object.freeze({width:r.width/.68,height:r.length})
  })));
}
export function appendSculptTerrainRamp(terrain,{x,y,endX,endY,width=84}={}){
  if(!terrain||[x,y,endX,endY,width].some(n=>!Number.isFinite(n))||
     (terrain.ramps?.length??0)>=SCULPT_TERRAIN_RAMP_LIMIT)return terrain;
  const dx=endX-x,dy=endY-y,length=Math.hypot(dx,dy);
  if(length<21||length>1400||width<12||width>448)return terrain;
  const bottom=rampFloor(terrain,x,y),top=rampFloor(terrain,endX,endY);
  if(bottom===null||top===null||top<=bottom||
     top-bottom>Math.max(1,Math.floor(length/28)))return terrain;
  return appendTerrainCorridor(terrain,{x,y,length,width,rotationDeg:Math.atan2(dx,-dy)*180/Math.PI});
}
function appendTerrainCorridor(terrain,geometry){
  const ids=new Set((terrain.ramps??[]).map(r=>r.id));
  let index=1;
  while(ids.has('sculpt-ramp-'+index))index++;
  const entry=Object.freeze({id:'sculpt-ramp-'+index,...geometry});
  return Object.freeze({...terrain,ramps:Object.freeze([...(terrain.ramps??[]),entry])});
}
// A level deck has two full-width, dry banks. Recheck them whenever the
// immutable terrain changes, including after a flood or an imported map.
function waterSupportGeometry(terrain,ramp){
  const angle=(ramp.rotationDeg-90)*Math.PI/180,ux=Math.cos(angle),uy=Math.sin(angle);
  const endX=ramp.x+ux*ramp.length,endY=ramp.y+uy*ramp.length;
  const level=rampFloor(terrain,ramp.x,ramp.y);
  if(level===null||rampFloor(terrain,endX,endY)!==level)return null;
  const crossSteps=Math.max(2,Math.ceil(ramp.width/14));
  for(let j=0;j<=crossSteps;j++){
    const side=(j/crossSteps-.5)*ramp.width;
    if(rampFloor(terrain,ramp.x-uy*side,ramp.y+ux*side)!==level||
       rampFloor(terrain,endX-uy*side,endY+ux*side)!==level)return null;
  }
  const steps=Math.ceil(ramp.length/7);
  let overWater=false;
  for(let i=1;i<steps;i++){
    const x=ramp.x+ux*ramp.length*i/steps,y=ramp.y+uy*ramp.length*i/steps;
    const col=Math.floor(x/28),row=Math.floor(y/21);
    if(sculptHeightAt(terrain,col,row)>level||sculptSphereAt(terrain,x,y,0))return null;
    if(sculptWaterAt(terrain,col,row)>0)overWater=true;
  }
  if(!overWater)return null;
  return Object.freeze({id:ramp.id,kind:'bridge',navigationOnly:true,
    visibleInPlay:ramp.visibleInPlay===true,level,
    transform:Object.freeze({x:(ramp.x+endX)/2,y:(ramp.y+endY)/2,
      rotationDeg:ramp.rotationDeg-90,scaleX:1,scaleY:1}),
    baseSize:Object.freeze({length:ramp.length,width:ramp.width}),
    traversal:Object.freeze({enabled:true,lengthRatio:1,widthRatio:1})});
}
const supportedDecks=new WeakMap();
export function sculptNavigationWaterSupports(terrain){
  let decks=supportedDecks.get(terrain);
  if(!decks){
    decks=Object.freeze((terrain.ramps??[]).filter(r=>r.support==='footbridge')
      .map(r=>waterSupportGeometry(terrain,r)).filter(Boolean));
    supportedDecks.set(terrain,decks);
  }
  return decks;
}
// The Navigation "Autoriser" gesture is a direct authoring entry point for
// the ONE terrain ramp/corridor contract, not a permissive flag on painted land.
// The same real dry-bank, rise and width checks still run in the ramp builder.
// A deliberate author grant also clears any no-go paint intersecting THAT
// corridor; other forbidden cells and every old map remain untouched.
export function appendSculptNavigationAllowedCorridor(terrain,{
  x,y,endX,endY,width=84,support,visibleInPlay=false
}={}){
  if(!terrain||[x,y,endX,endY,width].some(v=>!Number.isFinite(v)))return terrain;
  const floorAt=(px,py)=>rampFloor(terrain,px,py);
  const start=floorAt(x,y),end=floorAt(endX,endY);
  if(start===null||end===null)return terrain;
  const foot=start<=end?{x,y}:{x:endX,y:endY};
  const head=start<=end?{x:endX,y:endY}:{x,y};
  const dx=head.x-foot.x,dy=head.y-foot.y,length=Math.hypot(dx,dy);
  let tagged;
  if(support==='footbridge'){
    const geometry={x:foot.x,y:foot.y,width,length,rotationDeg:Math.atan2(dx,-dy)*180/Math.PI,
      navigationOnly:true,support,...(visibleInPlay?{visibleInPlay:true}:{})};
    if((terrain.ramps?.length??0)>=SCULPT_TERRAIN_RAMP_LIMIT||length<21||length>1400||
       width<12||width>448||!waterSupportGeometry(terrain,geometry))return terrain;
    tagged=appendTerrainCorridor(terrain,geometry);
  }else{
    if(support!==undefined||start===end)return terrain;
    for(let i=1,steps=Math.ceil(length/7);i<steps;i++)
      if(sculptWaterAt(terrain,Math.floor((foot.x+dx*i/steps)/28),Math.floor((foot.y+dy*i/steps)/21))>0)return terrain;
    const next=appendSculptTerrainRamp(terrain,{x:foot.x,y:foot.y,endX:head.x,endY:head.y,width});
    if(next===terrain)return terrain;
    tagged=Object.freeze({...next,ramps:Object.freeze(next.ramps.map((r,i)=>
      i===next.ramps.length-1?Object.freeze({...r,navigationOnly:true}):r))});
  }
  if(!terrain.navigationBlockedCells?.length)return tagged;
  // Reuse the SAME brush footprint: only cells of the newly authored incline
  // can be unblocked. Do not alter heights, water, textures or remote slopes.
  const distance=Math.hypot(head.x-foot.x,head.y-foot.y);
  const segments=Math.max(1,Math.ceil(distance/7));
  const points=Array.from({length:segments+1},(_,i)=>{
    const t=i/segments;
    return {x:(foot.x+(head.x-foot.x)*t)/28,
      y:(foot.y+(head.y-foot.y)*t)/21};
  });
  return applySculptNavigationBlockStroke(tagged,{
    points,radius:Math.max(.5,width/56),shape:'circle',action:'normal'});
}

export function removeSculptTerrainRampAt(terrain,x,y){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return terrain;
  let match=null,best=Infinity;
  for(const ramp of terrain.ramps??[]){
    const angle=ramp.rotationDeg*Math.PI/180,ux=Math.sin(angle),uy=-Math.cos(angle);
    const dx=x-ramp.x,dy=y-ramp.y,along=dx*ux+dy*uy;
    const across=Math.abs(dx*(-uy)+dy*ux);
    if(along<-8||along>ramp.length+8||across>ramp.width*.5+8)continue;
    const distance=across+Math.max(0,-along,along-ramp.length);
    if(distance<best){best=distance;match=ramp;}
  }
  return match?Object.freeze({...terrain,ramps:Object.freeze(terrain.ramps.filter(r=>r!==match))}):terrain;
}
// Restore natural navigation without touching old sculpted ramps or their
// art: reuse the SAME ramp hit test, restricted to explicitly authored
// navigation-only ramps. Their native IDs cannot be accidentally duplicated.
export function removeSculptNavigationAllowedCorridorAt(terrain,x,y){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return terrain;
  const owned=(terrain.ramps??[]).filter(r=>r.navigationOnly===true);
  if(!owned.length)return terrain;
  const subset=Object.freeze({...terrain,ramps:Object.freeze(owned)});
  const updated=removeSculptTerrainRampAt(subset,x,y);
  if(updated===subset)return terrain;
  const retained=new Set(updated.ramps.map(r=>r.id));
  return Object.freeze({...terrain,ramps:Object.freeze(
    terrain.ramps.filter(r=>r.navigationOnly!==true||retained.has(r.id)))});
}

export function sculptHeightAt(terrain,x,y){
  if(!terrain||x<0||y<0||x>=terrain.width||y>=terrain.height)return 0;
  return terrain.levels[y*terrain.width+x];
}
// One height update per gesture, regardless of overlapping pointer samples.
// A stroke is calculated from its ORIGINAL terrain to avoid unintentional stacking.
// 'plateau' can set an exact level; soft edges are opt-in and remain deterministic.
// Shared footprint authority for BOTH actual strokes and the on-canvas preview.
export const SCULPT_BRUSH_SHAPES=Object.freeze(['circle','square','cross']);
function footprintWeights(terrain,clean,r,soften,{protectWater=false,shape='circle'}={}){
  const selected=SCULPT_BRUSH_SHAPES.includes(shape)?shape:'circle';
  const limit=terrain.width*terrain.height;
  const weights=new Float32Array(limit);
  for(const center of clean){
    const xmin=Math.max(0,Math.floor(center.x-r));
    const xmax=Math.min(terrain.width-1,Math.ceil(center.x+r));
    const ymin=Math.max(0,Math.floor(center.y-r));
    const ymax=Math.min(terrain.height-1,Math.ceil(center.y+r));
    for(let cy=ymin;cy<=ymax;cy++)for(let cx=xmin;cx<=xmax;cx++){
      const dx=Math.abs(cx+.5-center.x),dy=Math.abs(cy+.5-center.y);
      // All footprints use the same grid-cell centres as gameplay strokes.
      // A square is an entire filled rectangle, not a rounded fringe.
      if(selected==='cross'&&Math.min(dx,dy)>.001)continue;
      const distance=selected==='circle'?Math.hypot(dx,dy):Math.max(dx,dy);
      if(distance>r)continue;
      // Full opacity inside the inner radius; only the outer rim is feathered.
      const inner=r*(1-soften);
      const weight=soften===0||distance<=inner ? 1
        : clamp((r-distance)/(r-inner),0,1);
      const idx=cy*terrain.width+cx;
      // An authored water cell belongs to the WATER tool, not the land brush.
      // Skipping it also prevents moving the ground below visible water.
      if(protectWater && terrain.waterLevels?.[idx]>=0)continue;
      weights[idx]=Math.max(weights[idx],weight);
    }
  }
  return weights;
}
export function sculptBrushFootprint(terrain,{points=[],radius=3,edgeSoftness=0,mode='raise',allowUnderwaterTerrainEdit=false,shape='circle'}={}){
  if(!terrain||!Array.isArray(points))return Object.freeze([]);
  const clean=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512);
  const weights=footprintWeights(terrain,clean,clamp(Number.isFinite(radius)?radius:3,.5,16),clamp(Number.isFinite(edgeSoftness)?edgeSoftness:0,0,1),
    {protectWater:!mode.startsWith('water-')&&!allowUnderwaterTerrainEdit,shape});
  const visible=[];
  for(let i=0;i<weights.length;i++)if(weights[i]>0)visible.push(Object.freeze({x:i%terrain.width,y:Math.floor(i/terrain.width),weight:weights[i]}));
  return Object.freeze(visible);
}
// Paint blocked-navigation cells using the EXISTING Sculpt brush footprint.
// This is authored SculptTerrain data, not a second collision layer or owner.
export function applySculptNavigationBlockStroke(terrain,{
  points=[],radius=3,shape='circle',action='block'
}={}){
  if(!terrain||!['block','normal'].includes(action)||!Array.isArray(points)||!points.length)return terrain;
  const footprint=sculptBrushFootprint(terrain,{points,radius,shape,
    allowUnderwaterTerrainEdit:true});
  if(!footprint.length)return terrain;
  const old=terrain.navigationBlockedCells??[];
  const next=new Set(old);
  for(const cell of footprint){
    const id=cell.y*terrain.width+cell.x;
    if(action==='block')next.add(id);else next.delete(id);
  }
  const sorted=[...next].sort((a,b)=>a-b);
  if(sorted.length===old.length&&sorted.every((v,i)=>v===old[i]))return terrain;
  const {navigationBlockedCells:unused,...retained}=terrain;
  return Object.freeze({...retained,...(sorted.length
    ?{navigationBlockedCells:Object.freeze(sorted)}:{})});
}

export function applySculptStroke(terrain,{
  points=[],radius=3,strength=1,mode='raise',target=null,edgeSoftness=0,rockRoundness=null,
  allowUnderwaterTerrainEdit=false,shape='circle'
}={}){
  if(!terrain||!['raise','dig','flatten','smooth','plateau','cliff-round'].includes(mode)||
     !Array.isArray(points)||points.length===0)return terrain;
  const clean=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512);
  if(clean.length===0)return terrain;
  const r=clamp(Number.isFinite(radius)?radius:3,.5,16);
  const power=clamp(int(strength,1),1,3);
  const soften=clamp(Number.isFinite(edgeSoftness)?edgeSoftness:0,0,1);
  const limit=terrain.width*terrain.height;
  const weights=footprintWeights(terrain,clean,r,soften,{protectWater:!allowUnderwaterTerrainEdit,shape});
  const chosen=clamp(int(target,sculptHeightAt(terrain,
    Math.floor(clean[0].x),Math.floor(clean[0].y))),0,16);
  const next=[...terrain.levels];
  const profiles=[...terrain.roundness];
  const profile=rockRoundness===null?null:clamp(Math.round(Number(rockRoundness)||0),0,150);
  let modified=false;
  for(let i=0;i<limit;i++){
    const weight=weights[i];
    if(weight<=0)continue;
    const old=terrain.levels[i];
    // Keep the flat base under an authored continuous sphere immutable.
    if(sculptSphereAt(terrain,(i%terrain.width+.5)*28,
      (Math.floor(i/terrain.width)+.5)*21))continue;
    // An opt-in cosmetic brush: edit existing contour profile only. Reuse
    // the canonical brush footprint, never touch land/water or navigation.
    if(mode==='cliff-round'){
      if(profile!==null){
        const nextProfile=clamp(Math.round(profiles[i]+(profile-profiles[i])*weight),0,150);
        if(nextProfile!==profiles[i]){profiles[i]=nextProfile;modified=true;}
      }
      continue;
    }
    const step=Math.max(1,Math.round(power*weight));
    let value=old;
    if(mode==='raise')value=old+step;
    if(mode==='dig')value=old-step;
    if(mode==='flatten')value=old+clamp(chosen-old,-step,step);
    if(mode==='plateau')value=Math.round(old+(chosen-old)*weight);
    if(mode==='smooth'){
      const x=i%terrain.width,y=Math.floor(i/terrain.width);
      let sum=old*2,count=2;
      for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){
        const nx=x+dx,ny=y+dy;
        if(nx>=0&&ny>=0&&nx<terrain.width&&ny<terrain.height){
          sum+=sculptHeightAt(terrain,nx,ny);count++;
        }
      }
      value=old+clamp(Math.round(sum/count)-old,-step,step);
    }
    value=clamp(value,0,16);
    if(value!==old){next[i]=value;modified=true;}
    if(profile!==null && profiles[i]!==profile){profiles[i]=profile;modified=true;}
  }
  return modified ? Object.freeze({...terrain,
    levels:mode==='cliff-round'?terrain.levels:Object.freeze(next),
    roundness:Object.freeze(profiles)}) : terrain;
}
export function applySculptBrush(terrain,options={}){
  return applySculptStroke(terrain,{...options,
    points:[{x:options.x,y:options.y}]});
}

// Experimental absolute water surface height. -1 = no authored water; water has
// positive volume only when its surface is above the canonical land elevation.
export function sculptWaterAt(terrain,x,y){
  if(!terrain || x<0||y<0||x>=terrain.width||y>=terrain.height)return 0;
  const i=y*terrain.width+x;
  return Math.max(0,terrain.waterLevels[i]-terrain.levels[i]);
}
export function applySculptWaterStroke(terrain,{
  points=[],radius=3,strength=1,mode='water-fill',target=3,edgeSoftness=0,shape='circle',waterMaterialId=null
}={}){
  if(!terrain||!['water-fill','water-rise','water-lower','water-erase','water-smooth','water-paint'].includes(mode)
    ||!Array.isArray(points))return terrain;
  const clean=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512);
  if(!clean.length)return terrain;
  const weights=footprintWeights(terrain,clean,
    clamp(Number.isFinite(radius)?radius:3,.5,16),
    clamp(Number.isFinite(edgeSoftness)?edgeSoftness:0,0,1),{shape});
  const next=[...terrain.waterLevels];
  const materialCells=[...sculptWaterMaterialCells(terrain)];
  let materialChanged=false;
  const level=clamp(int(target,3),0,10);
  const power=clamp(int(strength,1),1,3);
  let changed=false;
  for(let i=0;i<weights.length;i++){
    const influence=weights[i];
    if(influence<=0)continue;
    const previous=terrain.waterLevels[i];
    const ground=terrain.levels[i];
    const step=Math.max(1,Math.round(power*influence));
    let value=previous;
    if(mode==='water-fill') {
      // A constant water plane: its depth comes directly from the land below.
      value=previous<0?Math.round(ground+(level-ground)*influence):
        Math.round(previous+(level-previous)*influence);
    }
    if(mode==='water-rise')value=(previous<0?ground:previous)+step;
    if(mode==='water-lower')value=previous<0?-1:previous-step;
    if(mode==='water-erase')value=influence>=.5?-1:previous;
    if(mode==='water-smooth'){
      let sum=0,count=0;const x=i%terrain.width,y=Math.floor(i/terrain.width);
      for(const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1],[0,1]]){
        const nx=x+dx,ny=y+dy;
        if(nx<0||ny<0||nx>=terrain.width||ny>=terrain.height)continue;
        const sample=terrain.waterLevels[ny*terrain.width+nx];
        if(sample>=0){sum+=sample;count++;}
      }
      if(count && previous>=0)value=Math.round(previous+(sum/count-previous)*influence);
    }
    value=clamp(value,-1,10);
    if(value!==previous){next[i]=value;changed=true;}
    const paint=mode==='water-paint'||mode==='water-fill'||(mode==='water-rise'&&previous<0);
    const nextMaterial=value<0?DEFAULT_SCULPT_WATER_MATERIAL:
      paint&&value>ground&&influence>=.5&&isSculptWaterMaterial(waterMaterialId)?waterMaterialId:materialCells[i];
    if(nextMaterial!==materialCells[i]){materialCells[i]=nextMaterial;materialChanged=true;}
  }
  if(!changed&&!materialChanged)return terrain;
  const {waterMaterialRuns:oldRuns,...base}=terrain;
  const runs=materialChanged?compactSculptWaterMaterialCells(materialCells):oldRuns;
  return Object.freeze({...base,waterLevels:changed?Object.freeze(next):terrain.waterLevels,
    ...(runs?.length?{waterMaterialRuns:runs}:{})});
}
export function applySculptWaterBrush(terrain,options={}){
  return applySculptWaterStroke(terrain,{...options,points:[{x:options.x,y:options.y}]});
}
export function sculptFaces(terrain){
  const faces=[];
  for(let y=0;y<terrain.height;y++)for(let x=0;x<terrain.width;x++){
    const level=sculptHeightAt(terrain,x,y);
    const south=sculptHeightAt(terrain,x,y+1),east=sculptHeightAt(terrain,x+1,y);
    if(y<terrain.height-1&&level>south)faces.push(Object.freeze({x,y,orientation:'south',upper:level,lower:south}));
    if(x<terrain.width-1&&level>east)faces.push(Object.freeze({x,y,orientation:'east',upper:level,lower:east}));
  }
  return Object.freeze(faces);
}
export function sculptDemo(){
  const map=createSculptTerrain();
  const levels=map.levels.map((_,i)=>{
    const x=i%map.width,y=Math.floor(i/map.width);
    // Natural compact terrace and a recessed winding streambed.
    const plateau=Math.hypot((x-18)*.8,(y-11)*1.4);
    const bank=plateau<8?5:plateau<11?4:2;
    const channel=Math.abs(y-(12+Math.sin(x*.32)*2.1));
    return channel<2.0?1:channel<3.1?2:bank;
  });
  const waterLevels=levels.map((land,i)=>{
    const x=i%map.width,y=Math.floor(i/map.width);
    return Math.abs(y-(12+Math.sin(x*.32)*2.1))<2.35&&land<3?3:-1;
  });
  return createSculptTerrain({width:map.width,height:map.height,levels,waterLevels});
}
export function serializeSculptTerrain(terrain){
  return JSON.stringify({schemaVersion:1,width:terrain.width,height:terrain.height,
    levels:[...terrain.levels],waterLevels:[...terrain.waterLevels],roundness:[...terrain.roundness],
    ...(terrain.waterMaterialRuns?.length?{waterMaterialRuns:terrain.waterMaterialRuns}:{}),
    spheres:(terrain.spheres??[]).map(f=>({...f})),
    ramps:(terrain.ramps??[]).map(f=>({...f})),
    ...(terrain.navigationBlockedCells?.length
      ?{navigationBlockedCells:[...terrain.navigationBlockedCells]}:{})});
}
export function importSculptTerrain(serialized){
  const input=typeof serialized==='string'?JSON.parse(serialized):serialized;
  if(!input||input.schemaVersion!==1||!Number.isInteger(input.width)||
     !Number.isInteger(input.height)||input.width<8||input.width>80||
     input.height<8||input.height>64||
     !Array.isArray(input.levels)||input.levels.length!==input.width*input.height||
     !input.levels.every(v=>Number.isInteger(v)&&v>=0&&v<=16)||
     (input.waterLevels!==undefined&&(!Array.isArray(input.waterLevels)||
      input.waterLevels.length!==input.width*input.height||
      !input.waterLevels.every(v=>Number.isInteger(v)&&v>=-1&&v<=10)))||
     (input.waterMaterialRuns!==undefined&&!validSculptWaterMaterialRuns(input.waterMaterialRuns,input.width*input.height))||
     (input.roundness!==undefined&&(!Array.isArray(input.roundness)||
      input.roundness.length!==input.width*input.height||
      !input.roundness.every(v=>Number.isInteger(v)&&v>=0&&v<=150)))||
     (input.spheres!==undefined&&(!Array.isArray(input.spheres)||
       input.spheres.length>SCULPT_SPHERE_LIMIT||
       !input.spheres.every(f=>validSphere(f,input.width,input.height))||
       new Set(input.spheres.map(f=>f.id)).size!==input.spheres.length))||
     (input.ramps!==undefined&&(!Array.isArray(input.ramps)||
       input.ramps.length>SCULPT_TERRAIN_RAMP_LIMIT||
       !input.ramps.every(f=>validTerrainRamp(f,input.width,input.height))||
       new Set(input.ramps.map(f=>f.id)).size!==input.ramps.length))||
      (input.navigationBlockedCells!==undefined&&
        (!Array.isArray(input.navigationBlockedCells)||
         input.navigationBlockedCells.length>input.width*input.height||
         input.navigationBlockedCells.some(i=>!Number.isInteger(i)||i<0||i>=input.width*input.height)||
         new Set(input.navigationBlockedCells).size!==input.navigationBlockedCells.length)))
    throw new Error('Carte sculptable invalide (schemaVersion 1)');
  return createSculptTerrain(input);
}
