// Experimental heightfield. Isolated from WorldSurface/WorldDocument and Collision World.
// Cells, heights and brush results are deterministic, immutable, JSON-compatible data.
export const SCULPT_SCHEMA_VERSION=1;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const int=(v,f)=>Number.isInteger(v)?v:f;
export function createSculptTerrain({width=36,height=24,levels=null,waterLevels=null,roundness=null}={}){
  const w=clamp(int(width,36),8,80),h=clamp(int(height,24),8,64);
  const data=Array.from({length:w*h},(_,i)=>clamp(int(levels?.[i],2),0,7));
  const water=Array.from({length:w*h},(_,i)=>clamp(int(waterLevels?.[i],-1),-1,10));
  const contours=Array.from({length:w*h},(_,i)=>clamp(int(roundness?.[i],95),0,150));
  return Object.freeze({schemaVersion:SCULPT_SCHEMA_VERSION,width:w,height:h,
    levels:Object.freeze(data),waterLevels:Object.freeze(water),roundness:Object.freeze(contours)});
}
export function sculptHeightAt(terrain,x,y){
  if(!terrain||x<0||y<0||x>=terrain.width||y>=terrain.height)return 0;
  return terrain.levels[y*terrain.width+x];
}
// One height update per gesture, regardless of overlapping pointer samples.
// A stroke is calculated from its ORIGINAL terrain to avoid unintentional stacking.
// 'plateau' can set an exact level; soft edges are opt-in and remain deterministic.
// Shared footprint authority for BOTH actual strokes and the on-canvas preview.
function footprintWeights(terrain,clean,r,soften,{protectWater=false}={}){
  const limit=terrain.width*terrain.height;
  const weights=new Float32Array(limit);
  for(const center of clean){
    const xmin=Math.max(0,Math.floor(center.x-r));
    const xmax=Math.min(terrain.width-1,Math.ceil(center.x+r));
    const ymin=Math.max(0,Math.floor(center.y-r));
    const ymax=Math.min(terrain.height-1,Math.ceil(center.y+r));
    for(let cy=ymin;cy<=ymax;cy++)for(let cx=xmin;cx<=xmax;cx++){
      const distance=Math.hypot(cx+.5-center.x,cy+.5-center.y);
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
export function sculptBrushFootprint(terrain,{points=[],radius=3,edgeSoftness=0,mode='raise',allowUnderwaterTerrainEdit=false}={}){
  if(!terrain||!Array.isArray(points))return Object.freeze([]);
  const clean=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512);
  const weights=footprintWeights(terrain,clean,clamp(Number.isFinite(radius)?radius:3,.5,16),clamp(Number.isFinite(edgeSoftness)?edgeSoftness:0,0,1),
    {protectWater:!mode.startsWith('water-')&&!allowUnderwaterTerrainEdit});
  const visible=[];
  for(let i=0;i<weights.length;i++)if(weights[i]>0)visible.push(Object.freeze({x:i%terrain.width,y:Math.floor(i/terrain.width),weight:weights[i]}));
  return Object.freeze(visible);
}
export function applySculptStroke(terrain,{
  points=[],radius=3,strength=1,mode='raise',target=null,edgeSoftness=0,rockRoundness=null,
  allowUnderwaterTerrainEdit=false
}={}){
  if(!terrain||!['raise','dig','flatten','smooth','plateau'].includes(mode)||
     !Array.isArray(points)||points.length===0)return terrain;
  const clean=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512);
  if(clean.length===0)return terrain;
  const r=clamp(Number.isFinite(radius)?radius:3,.5,16);
  const power=clamp(int(strength,1),1,3);
  const soften=clamp(Number.isFinite(edgeSoftness)?edgeSoftness:0,0,1);
  const limit=terrain.width*terrain.height;
  const weights=footprintWeights(terrain,clean,r,soften,{protectWater:!allowUnderwaterTerrainEdit});
  const chosen=clamp(int(target,sculptHeightAt(terrain,
    Math.floor(clean[0].x),Math.floor(clean[0].y))),0,7);
  const next=[...terrain.levels];
  const profiles=[...terrain.roundness];
  const profile=rockRoundness===null?null:clamp(Math.round(Number(rockRoundness)||0),0,150);
  let modified=false;
  for(let i=0;i<limit;i++){
    const weight=weights[i];
    if(weight<=0)continue;
    const old=terrain.levels[i];
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
    value=clamp(value,0,7);
    if(value!==old){next[i]=value;modified=true;}
    if(profile!==null && profiles[i]!==profile){profiles[i]=profile;modified=true;}
  }
  return modified ? Object.freeze({...terrain,levels:Object.freeze(next),roundness:Object.freeze(profiles)}) : terrain;
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
  points=[],radius=3,strength=1,mode='water-fill',target=3,edgeSoftness=0
}={}){
  if(!terrain||!['water-fill','water-rise','water-lower','water-erase','water-smooth'].includes(mode)
    ||!Array.isArray(points))return terrain;
  const clean=points.filter(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)).slice(0,512);
  if(!clean.length)return terrain;
  const weights=footprintWeights(terrain,clean,
    clamp(Number.isFinite(radius)?radius:3,.5,16),
    clamp(Number.isFinite(edgeSoftness)?edgeSoftness:0,0,1));
  const next=[...terrain.waterLevels];
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
  }
  return changed?Object.freeze({...terrain,waterLevels:Object.freeze(next)}):terrain;
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
    levels:[...terrain.levels],waterLevels:[...terrain.waterLevels],roundness:[...terrain.roundness]});
}
export function importSculptTerrain(serialized){
  const input=typeof serialized==='string'?JSON.parse(serialized):serialized;
  if(!input||input.schemaVersion!==1||!Number.isInteger(input.width)||
     !Number.isInteger(input.height)||input.width<8||input.width>80||
     input.height<8||input.height>64||
     !Array.isArray(input.levels)||input.levels.length!==input.width*input.height||
     !input.levels.every(v=>Number.isInteger(v)&&v>=0&&v<=7)||
     (input.waterLevels!==undefined&&(!Array.isArray(input.waterLevels)||
      input.waterLevels.length!==input.width*input.height||
      !input.waterLevels.every(v=>Number.isInteger(v)&&v>=-1&&v<=10)))||
     (input.roundness!==undefined&&(!Array.isArray(input.roundness)||
      input.roundness.length!==input.width*input.height||
      !input.roundness.every(v=>Number.isInteger(v)&&v>=0&&v<=150))))
    throw new Error('Carte sculptable invalide (schemaVersion 1)');
  return createSculptTerrain(input);
}
