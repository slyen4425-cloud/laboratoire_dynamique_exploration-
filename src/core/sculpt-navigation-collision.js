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
  terrain,cellWidth=28,cellHeight=21,maxStepUp=1,maxStepDown=1
}={},entity,targetX,targetY){
  if(!terrain||!entity)return false; // no implicit activation in the 2D runtime
  const options={cellWidth,cellHeight};
  const flying=entity.locomotion?.modes?.includes('fly')===true;
  const swimming=entity.locomotion?.modes?.includes('swim')===true;
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
      if(sample.waterDepth>0&&!swimming)return true;
      const rise=sample.level-previous.level;
      if(rise>Math.max(0,maxStepUp)||-rise>Math.max(0,maxStepDown))return true;
    }
    previous=sample;
  }
  return false;
}
