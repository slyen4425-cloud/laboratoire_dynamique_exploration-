// Optional sculpt laboratory collision adapter. The Collision World remains the
// authority: it calls this pure geometry check through collisionContext only.
// Never persist this preview adapter in WorldDocument or a gameplay save.
import {sculptHeightAt,sculptWaterAt} from '../world/sculpt-height-model.js';

export const SCULPT_NAVIGATION_PROBE_DEFAULTS=Object.freeze({
  cellWidth:28,cellHeight:21,maxStepUp:1,maxStepDown:1
});
const finitePositive=(n,f)=>Number.isFinite(n)&&n>0?n:f;

export function sculptNavigationSample(terrain,x,y,{
  cellWidth=SCULPT_NAVIGATION_PROBE_DEFAULTS.cellWidth,
  cellHeight=SCULPT_NAVIGATION_PROBE_DEFAULTS.cellHeight
}={}){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return null;
  const w=finitePositive(cellWidth,28),h=finitePositive(cellHeight,21);
  const col=Math.floor(x/w),row=Math.floor(y/h);
  if(col<0||row<0||col>=terrain.width||row>=terrain.height)return null;
  return Object.freeze({col,row,level:sculptHeightAt(terrain,col,row),
    waterDepth:sculptWaterAt(terrain,col,row)});
}

export function isSculptNavigationBlocked({
  terrain,cellWidth=28,cellHeight=21,maxStepUp=1,maxStepDown=1,
  shoreEntryFraction=0
}={},entity,targetX,targetY){
  if(!terrain||!entity)return false; // no implicit activation in the 2D runtime
  const options={cellWidth,cellHeight};
  const flying=entity.locomotion?.modes?.includes('fly')===true;
  const swimming=entity.locomotion?.modes?.includes('swim')===true;
  // Only a narrow strip from dry shore into a wet cell is walkable in the
  // sculpt pilot. Swimming remains the sole way to cross the water body.
  // Default 0 preserves V17 and the ordinary 2D runtime unchanged.
  const shorePermitted=(x,y,sample)=>{
    const fraction=Math.max(0,Math.min(.22,Number(shoreEntryFraction)||0));
    if(fraction<=0||!sample||sample.waterDepth<=0)return false;
    const cx=sample.col,cy=sample.row;
    const localX=x-cx*cellWidth,localY=y-cy*cellHeight;
    const dry=(col,row)=>col>=0&&col<terrain.width&&row>=0&&row<terrain.height&&
      sculptWaterAt(terrain,col,row)<=0;
    return (dry(cx-1,cy)&&localX<=cellWidth*fraction)||
      (dry(cx+1,cy)&&localX>=cellWidth*(1-fraction))||
      (dry(cx,cy-1)&&localY<=cellHeight*fraction)||
      (dry(cx,cy+1)&&localY>=cellHeight*(1-fraction));
  };
  const origin=sculptNavigationSample(terrain,entity.x,entity.y,options);
  const target=sculptNavigationSample(terrain,targetX,targetY,options);
  if(!origin||!target)return true;
  // Sample the whole segment, not only its end: a slow frame or large dt may
  // never tunnel through a one-cell cliff or a thin stretch of water.
  const dx=targetX-entity.x,dy=targetY-entity.y;
  const stride=Math.max(1,Math.ceil(Math.hypot(dx,dy)/
    (Math.min(finitePositive(cellWidth,28),finitePositive(cellHeight,21))*.4)));
  let previous=origin;
  for(let step=1;step<=stride;step++){
    const t=step/stride;
    const sample=sculptNavigationSample(terrain,entity.x+dx*t,entity.y+dy*t,options);
    if(!sample)return true;
    if(!flying){
      if(sample.waterDepth>0&&!swimming&&!shorePermitted(entity.x+dx*t,entity.y+dy*t,sample))return true;
      const rise=sample.level-previous.level;
      if(rise>Math.max(0,maxStepUp)||-rise>Math.max(0,maxStepDown))return true;
    }
    previous=sample;
  }
  return false;
}
