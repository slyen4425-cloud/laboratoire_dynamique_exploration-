// Optional sculpt laboratory collision adapter. The Collision World remains the
// authority: it calls this pure geometry check through collisionContext only.
// Never persist this preview adapter in WorldDocument or a gameplay save.
import {sculptHeightAt,sculptWaterAt} from '../world/sculpt-height-model.js';
import {bridgeTraversalRect} from '../world/world-object-model.js?rev=sculpt-bridge-crossing-v55';
import {circleFitsOrientedRect,orientedLocalPoint} from './geometry.js';

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

// Canonical Bridge corridor is the only authority for allowing walking above
// authored sculpt water. It is supplied from resolved WorldObject definitions;
// neither image alpha nor rounded hill pixels decide traversal.
export function sculptBridgeDeckAt(bridges=[],x,y,radius=0){
  for(const bridge of bridges){
    const corridor=bridgeTraversalRect(bridge);
    if(corridor&&circleFitsOrientedRect(x,y,radius,corridor))return corridor;
  }
  return null;
}
// Two actual dry bridgeheads are required before a bridge may override a
// large depth step. The old V55 water-only gate still blocks dry ravines.
// Using the WorldObject corridor prevents pixels from granting locomotion.
export function sculptBridgeBankHeights(terrain,corridor,{cellWidth=28,cellHeight=21}={}){
  if(!terrain||!corridor)return null;
  const heights=[];
  for(const direction of [-1,1]){
    let land=null;
    for(const fraction of [.50,.56,.62,.68]){
      const px=corridor.x+direction*Math.cos(corridor.rotation)*corridor.length*fraction;
      const py=corridor.y+direction*Math.sin(corridor.rotation)*corridor.length*fraction;
      const sample=sculptNavigationSample(terrain,px,py,{cellWidth,cellHeight});
      if(sample&&sample.waterDepth===0){land=sample.level;break;}
    }
    if(land===null)return null;
    heights.push(land);
  }
  return Object.freeze(heights);
}
export function sculptBridgeDeckHeight(terrain,bridges=[],x,y,options={}){
  const corridor=sculptBridgeDeckAt(bridges,x,y,0);
  if(!corridor)return null;
  const heights=sculptBridgeBankHeights(terrain,corridor,options);
  return heights?Math.max(...heights):null;
}
function bridgeEndTransition(corridor,fromX,fromY,toX,toY,radius){
  const from=orientedLocalPoint(fromX,fromY,corridor);
  const to=orientedLocalPoint(toX,toY,corridor);
  const edge=corridor.length/2;
  const near=radius+Math.max(2,Math.min(7,corridor.width*.12));
  return Math.abs(from.x)>=edge-near||Math.abs(to.x)>=edge-near;
}
export function sculptNavigationBlockDetail({
  terrain,cellWidth=28,cellHeight=21,maxStepUp=1,maxStepDown=1,
  shoreEntryFraction=0,bridges=[]
}={},entity,targetX,targetY){
  if(!terrain||!entity)return null; // opt-in only: ordinary 2D runtime unchanged
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
  if(!origin||!target)return Object.freeze({kind:'bounds'});
  // Sample the whole segment, not only its end: a slow frame or large dt may
  // never tunnel through a one-cell cliff or a thin stretch of water.
  const dx=targetX-entity.x,dy=targetY-entity.y;
  const stride=Math.max(1,Math.ceil(Math.hypot(dx,dy)/
    (Math.min(finitePositive(cellWidth,28),finitePositive(cellHeight,21))*.4)));
  let previous=origin;
  let previousX=entity.x,previousY=entity.y;
  let previousDeck=sculptBridgeDeckAt(bridges,previousX,previousY,
    Math.max(0,Number(entity.radius)||0));
  for(let step=1;step<=stride;step++){
    const t=step/stride;
    const x=entity.x+dx*t,y=entity.y+dy*t;
    const sample=sculptNavigationSample(terrain,x,y,options);
    if(!sample)return Object.freeze({kind:'bounds'});
    const radius=Math.max(0,Number(entity.radius)||0);
    const deck=sculptBridgeDeckAt(bridges,x,y,radius);
    if(!flying){
      const onDeck=deck!==null;
      if(sample.waterDepth>0&&!swimming&&!onDeck&&
         !shorePermitted(entity.x+dx*t,entity.y+dy*t,sample))
        return Object.freeze({kind:'water',col:sample.col,row:sample.row,waterDepth:sample.waterDepth});
      const rise=sample.level-previous.level;
      const crossingDeck=deck??previousDeck;
      const banks=crossingDeck?sculptBridgeBankHeights(terrain,crossingDeck,options):null;
      const highestBank=banks?Math.max(...banks):null;
      // Skip ONLY the artificial fall/rise of a supported bridge above a
      // depression. A tall rock SPIKE through its deck is still a cliff.
      // Side-entry from outside the corridor cannot evade cliffs either.
      const endEntry=deck&&previousDeck||crossingDeck&&bridgeEndTransition(
        crossingDeck,previousX,previousY,x,y,radius);
      const levelIsBelowDeck=banks&&Math.min(previous.level,sample.level)<Math.min(...banks);
      const supportedBridgeStep=Boolean(banks&&endEntry&&levelIsBelowDeck&&
        Math.max(previous.level,sample.level)<=highestBank);
      if(!supportedBridgeStep&&
         (rise>Math.max(0,maxStepUp)||-rise>Math.max(0,maxStepDown)))
        return Object.freeze({kind:rise>0?'height-up':'height-down',
          col:sample.col,row:sample.row,from:previous.level,to:sample.level,
          delta:Math.abs(rise),limit:rise>0?Math.max(0,maxStepUp):Math.max(0,maxStepDown)});
    }
    previous=sample;
    previousX=x;previousY=y;previousDeck=deck;
  }
  return null;
}

// Boolean Collision World adapter and user-facing diagnostics read the exact
// SAME canonical swept-cell check. No visual rounding becomes gameplay physics.
export function isSculptNavigationBlocked(config,entity,targetX,targetY){
  return sculptNavigationBlockDetail(config,entity,targetX,targetY)!==null;
}

