// Experimental heightfield. Isolated from WorldSurface/WorldDocument and Collision World.
// Cells, heights and brush results are deterministic, immutable, JSON-compatible data.
export const SCULPT_SCHEMA_VERSION=1;
const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
const int=(v,f)=>Number.isInteger(v)?v:f;
export function createSculptTerrain({width=36,height=24,levels=null}={}){
  const w=clamp(int(width,36),8,80),h=clamp(int(height,24),8,64);
  const data=Array.from({length:w*h},(_,i)=>clamp(int(levels?.[i],2),0,7));
  return Object.freeze({schemaVersion:SCULPT_SCHEMA_VERSION,width:w,height:h,
    levels:Object.freeze(data)});
}
export function sculptHeightAt(terrain,x,y){
  if(!terrain||x<0||y<0||x>=terrain.width||y>=terrain.height)return 0;
  return terrain.levels[y*terrain.width+x];
}
export function applySculptBrush(terrain,{x,y,radius=3,strength=1,mode='raise',target=null}={}){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return terrain;
  if(!['raise','dig','flatten','smooth'].includes(mode))return terrain;
  const r=clamp(Number(radius)||1,0.5,9),power=clamp(int(strength,1),1,3);
  const out=[...terrain.levels],focus=int(target,sculptHeightAt(terrain,Math.floor(x),Math.floor(y)));
  for(let cy=Math.max(0,Math.floor(y-r));cy<=Math.min(terrain.height-1,Math.ceil(y+r));cy++){
    for(let cx=Math.max(0,Math.floor(x-r));cx<=Math.min(terrain.width-1,Math.ceil(x+r));cx++){
      const d=Math.hypot(cx+.5-x,cy+.5-y);
      if(d>r)continue;
      const p=clamp(1-d/(r+.5),0,1),idx=cy*terrain.width+cx,now=terrain.levels[idx];
      const step=clamp(Math.ceil(power*p),1,3);
      if(mode==='raise')out[idx]=clamp(now+step,0,7);
      if(mode==='dig')out[idx]=clamp(now-step,0,7);
      if(mode==='flatten')out[idx]=clamp(now+clamp(focus-now,-step,step),0,7);
      if(mode==='smooth'){
        const neighbors=[sculptHeightAt(terrain,cx-1,cy),sculptHeightAt(terrain,cx+1,cy),
          sculptHeightAt(terrain,cx,cy-1),sculptHeightAt(terrain,cx,cy+1)];
        const mean=Math.round((now*2+neighbors.reduce((a,b)=>a+b,0))/6);
        out[idx]=clamp(now+clamp(mean-now,-step,step),0,7);
      }
    }
  }
  return Object.freeze({...terrain,levels:Object.freeze(out)});
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
  return createSculptTerrain({width:map.width,height:map.height,levels});
}
export function serializeSculptTerrain(terrain){
  return JSON.stringify({schemaVersion:1,width:terrain.width,height:terrain.height,
    levels:[...terrain.levels]});
}
export function importSculptTerrain(serialized){
  const input=typeof serialized==='string'?JSON.parse(serialized):serialized;
  if(!input||input.schemaVersion!==1||!Number.isInteger(input.width)||
     !Number.isInteger(input.height)||input.width<8||input.width>80||
     input.height<8||input.height>64||
     !Array.isArray(input.levels)||input.levels.length!==input.width*input.height||
     !input.levels.every(v=>Number.isInteger(v)&&v>=0&&v<=7))
    throw new Error('Carte sculptable invalide (schemaVersion 1)');
  return createSculptTerrain(input);
}
