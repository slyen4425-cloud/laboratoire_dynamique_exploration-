// Optional sculpt laboratory collision adapter. The Collision World remains the
// authority: it calls this pure geometry check through collisionContext only.
// Never persist this preview adapter in WorldDocument or a gameplay save.
import {sculptHeightAt,sculptWaterAt,sculptSphereAt,
  sculptSphereDisplacementAt} from '../world/sculpt-height-model.js?rev=sphere-frustum-v76-r9';
import {bridgeTraversalRect} from '../world/world-object-model.js?rev=sculpt-bridge-crossing-v55-deck-v70-rails-v71';
import {circleFitsOrientedRect,orientedLocalPoint} from './geometry.js';

// V75: a heightfield cell boundary is a sheer CLIFF unless a later explicit
// world-owned ramp/stair authoring contract permits it. Never guess a walkable
// slope from camera projection or the softened cliff sprite. Bridges retain
// their existing separate carried-deck rule; flying still bypasses cliffs.
export const SCULPT_NAVIGATION_PROBE_DEFAULTS=Object.freeze({
  cellWidth:28,cellHeight:21,projectionRise:18,maxStepUp:0,maxStepDown:0
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

// R2 (Pixel): the raised north-facing terrain CAP is drawn at
// y = row * cellHeight - height * projectionRise. On a lower approach, the
// actor's foot is drawn at y - lowerHeight * projectionRise. Checking only
// floor(row) lets a walker advance *under the cap* for several ground cells,
// appearing to descend onto a cliff even while the old boundary test is GREEN.
// This is a read-only, world-height-derived cliff footprint owned by Collision
// World, not an alpha test, duplicate mesh or camera-specific rule.
export function sculptNorthCliffProjectionBlock(terrain,x,y,{
  cellWidth=SCULPT_NAVIGATION_PROBE_DEFAULTS.cellWidth,
  cellHeight=SCULPT_NAVIGATION_PROBE_DEFAULTS.cellHeight,
  projectionRise=SCULPT_NAVIGATION_PROBE_DEFAULTS.projectionRise,
  radius=0
}={}){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y))return null;
  const w=finitePositive(cellWidth,28),h=finitePositive(cellHeight,21);
  const rise=Number.isFinite(projectionRise)&&projectionRise>0?projectionRise:0;
  if(rise===0)return null;
  const here=sculptNavigationSample(terrain,x,y,{cellWidth:w,cellHeight:h});
  if(!here)return null;
  const rad=Math.max(0,Number(radius)||0);
  const reach=7*rise+rad;
  const lastRow=Math.min(terrain.height-1,Math.floor((y+reach)/h)+1);
  const fromCol=Math.max(0,Math.floor((x-rad)/w));
  const toCol=Math.min(terrain.width-1,Math.floor((x+rad)/w));
  for(let row=here.row+1;row<=lastRow;row++){
    const bankY=row*h;
    if(bankY>y+reach+1e-6)break;
    for(let col=fromCol;col<=toCol;col++){
      const upper=sculptHeightAt(terrain,col,row);
      if(upper<=here.level||upper<=sculptHeightAt(terrain,col,row-1))
        continue; // only an actually exposed northern cliff face
      const visibleStart=bankY-(upper-here.level)*rise;
      // An actor on the LOWER floor cannot enter the space visibly occupied
      // by a higher cap. A high-floor actor remains free on its own plateau.
      if(y+rad>=visibleStart-1e-6 && y-rad<bankY)
        return Object.freeze({kind:'cliff-projection',col,row,
          from:here.level,to:upper,delta:upper-here.level,limit:0});
    }
  }
  return null;
}

// V76 R9: ground characters must not visually walk INSIDE the lifted top
// of a hill when their actual coordinates remain behind its circular foot.
// This is a read-only, height-model-derived OCCLUSION footprint, analogous to
// the validated V75 projected north cliff gate above. It is not pixel alpha,
// and it never creates a second geometry, movement or collision authority.
export function sculptSphereProjectionBlock(terrain,x,y,{
  cellWidth=28,cellHeight=21,projectionRise=18,radius=0
}={}){
  if(!terrain||!Number.isFinite(x)||!Number.isFinite(y)||
     !(projectionRise>0))return null;
  const ground=sculptNavigationSample(terrain,x,y,{cellWidth,cellHeight});
  if(!ground)return null;
  const bodyRadius=Math.max(0,Number(radius)||0);
  // Small upper-lip safety margin owned by Collision World, scaled to
  // the actual actor footprint. At 205% camera zoom a 3–4 world-pixel
  // premature overlap is visibly large; this prevents feet reaching the
  // grass artwork while still physically on low ground. No texture test.
  const clearance=Math.min(6,Math.max(2,bodyRadius*.8));
  for(const hill of terrain.spheres??[]){
    if(hill.kind!=='hill'||hill.height<=0||ground.level!==hill.baseLevel)continue;
    const dx=x-hill.x,absX=Math.abs(dx);
    if(absX>hill.radius+bodyRadius)continue;
    const insideX=hill.x+Math.sign(dx||1)*Math.min(absX,hill.radius-1e-5);
    const width=Math.sqrt(Math.max(0,hill.radius*hill.radius-
      (insideX-hill.x)*(insideX-hill.x)));
    const northEdge=hill.y-width;
    // The character is physically on LOW GROUND north of the circular foot.
    // Physically entering the foot is already blocked by sculptSphereAt.
    if(y-bodyRadius>=northEdge+clearance+1e-6)continue;
    const base=hill.baseLevel*projectionRise;
    const projectedFoot=y-ground.level*projectionRise;
    let upper=Infinity;
    // The shape is smooth and capped at seven levels. These inexpensive
    // deterministic probes sample the CANONICAL elevation profile, not art.
    for(let i=0;i<=18;i++){
      const worldY=northEdge+(2*width*i/18);
      const level=sculptSphereDisplacementAt(terrain,insideX,worldY);
      upper=Math.min(upper,worldY-base-level*projectionRise);
    }
    // Also sample the exact rear lip of the flat plateau/frustum.
    const summit=hill.summitRatio??0;
    if(summit>0&&summit<1){
      const capR=hill.radius*summit;
      if(Math.abs(insideX-hill.x)<capR){
        const lipY=hill.y-Math.sqrt(capR*capR-
          (insideX-hill.x)*(insideX-hill.x));
        upper=Math.min(upper,lipY-base-hill.height*projectionRise);
      }
    }
    const depth=projectedFoot-upper;
    if(depth>=-bodyRadius-clearance&&projectedFoot<
      northEdge-base+bodyRadius+clearance+1e-6)
      return Object.freeze({kind:'sphere-projection',id:hill.id,
        variant:hill.kind,depth,centerX:hill.x,clearance,limit:0});
  }
  return null;
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
// A bridge has TWO physical layers at the same X/Y: ground below and a
// supported deck above. Only the Exploration movement owner persists the deck
// identifier, after Collision World has accepted the whole swept movement.
// Merely standing below the sprite never mounts the deck.
function bridgeCarrier(bridges,id){
  if(!id)return null;
  const bridge=bridges.find(candidate=>candidate.id===id);
  const corridor=bridge&&bridgeTraversalRect(bridge);
  return corridor?{bridge,corridor}:null;
}
function bridgeCarrierAt(bridges,x,y,radius){
  for(const bridge of bridges){
    const corridor=bridgeTraversalRect(bridge);
    if(corridor&&circleFitsOrientedRect(x,y,radius,corridor))
      return {bridge,corridor};
  }
  return null;
}
function bridgeEndGate(corridor,x,y,radius,cellWidth,cellHeight){
  const local=orientedLocalPoint(x,y,corridor);
  const margin=Math.max(radius+2,Math.min(cellWidth,cellHeight));
  return Math.abs(local.x)>=corridor.length/2-margin &&
    Math.abs(local.y)<=corridor.width/2-radius+1e-6;
}
function bridgeLongitudinal(corridor,dx,dy){
  const along=Math.abs(dx*Math.cos(corridor.rotation)+dy*Math.sin(corridor.rotation));
  const side=Math.abs(dy*Math.cos(corridor.rotation)-dx*Math.sin(corridor.rotation));
  return along>1e-8&&along>=side*.85;
}
function bridgeHeightReason(previous,sample,limit=0){
  return Object.freeze({kind:'height-up',col:sample.col,row:sample.row,
    from:previous.level,to:sample.level,delta:Math.max(0,sample.level-previous.level),limit});
}
// Return BOTH the collision decision and the proposed elevation layer.
// Renderer/input must never write the layer. isBlocked reads only "reason";
// stepMovement commits "bridgeId" along with accepted X/Y.
export function sculptNavigationRoute({
  terrain,cellWidth=28,cellHeight=21,
  maxStepUp=SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepUp,
  maxStepDown=SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepDown,
  shoreEntryFraction=0,bridges=[],projectionRise=0
}={},entity,targetX,targetY){
  if(!terrain||!entity)return Object.freeze({reason:null,bridgeId:entity?.sculptBridgeId??null});
  const options={cellWidth,cellHeight};
  const radius=Math.max(0,Number(entity.radius)||0);
  const flying=entity.locomotion?.modes?.includes('fly')===true;
  const swimming=entity.locomotion?.modes?.includes('swim')===true;
  const origin=sculptNavigationSample(terrain,entity.x,entity.y,options);
  const target=sculptNavigationSample(terrain,targetX,targetY,options);
  const reject=reason=>Object.freeze({reason,bridgeId:entity.sculptBridgeId??null});
  if(!origin||!target)return reject(Object.freeze({kind:'bounds'}));
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
  let previous=origin,previousX=entity.x,previousY=entity.y;
  let previousCarrier=bridgeCarrierAt(bridges,previousX,previousY,radius);
  // A hero may start on an actual dry bridgehead already *inside* a wide
  // corridor (V60). Bootstrap ONLY from a supported endpoint at bank height.
  let bridgeId=null;
  if(!flying){
    const stored=bridgeCarrier(bridges,entity.sculptBridgeId);
    if(stored&&circleFitsOrientedRect(previousX,previousY,radius,stored.corridor))
      bridgeId=stored.bridge.id;
    else if(previousCarrier&&origin.waterDepth===0){
      const corridor=previousCarrier.corridor;
      const banks=sculptBridgeBankHeights(terrain,corridor,options);
      const local=orientedLocalPoint(previousX,previousY,corridor);
      const bank=banks?.[local.x<0?0:1];
      // Wide bridge art can cover a large part of its real HIGH approach
      // bank, not merely its last 21px. Starting there is on the deck;
      // starting on the LOW floor below it is never on the deck.
      if(bank!==undefined&&origin.level>=bank-maxStepUp&&
        origin.level<=bank+maxStepDown)
        bridgeId=previousCarrier.bridge.id;
    }
  }
  const dx=targetX-entity.x,dy=targetY-entity.y;
  const stride=Math.max(1,Math.ceil(Math.hypot(dx,dy)/
    (Math.min(finitePositive(cellWidth,28),finitePositive(cellHeight,21))*.4)));
  for(let step=1;step<=stride;step++){
    const t=step/stride,x=entity.x+dx*t,y=entity.y+dy*t;
    const sample=sculptNavigationSample(terrain,x,y,options);
    if(!sample)return reject(Object.freeze({kind:'bounds'}));
    const candidate=bridgeCarrierAt(bridges,x,y,radius);
    const stepX=x-previousX,stepY=y-previousY;
    if(!flying){
      let dismounting=false;
      if(bridgeId&&candidate?.bridge.id!==bridgeId){
        const active=bridgeCarrier(bridges,bridgeId);
        const corridor=active?.corridor;
        // No step off the side rail, no leap down from the deck and no
        // transition to a second bridge without touching real dry land.
        const properExit=corridor&&bridgeEndGate(corridor,x,y,radius,
          cellWidth,cellHeight)&&bridgeLongitudinal(corridor,stepX,stepY);
        const banks=corridor?sculptBridgeBankHeights(terrain,corridor,options):null;
        const height=banks?Math.max(...banks):null;
        const safeBank=height!==null&&sample.waterDepth===0&&
          sample.level>=height-maxStepDown&&sample.level<=height+maxStepUp;
        if(!properExit||!safeBank)
          return reject(Object.freeze({kind:'bridge-edge'}));
        bridgeId=null;
        dismounting=true; // real deck->bank exit supersedes canyon floor sample
      }
      if(!bridgeId&&candidate&&previousCarrier?.bridge.id!==candidate.bridge.id){
        const crossingDeck=candidate.corridor;
        const banks=sculptBridgeBankHeights(terrain,crossingDeck,options);
        const oldLocal=orientedLocalPoint(previousX,previousY,crossingDeck);
        const bank=banks?.[oldLocal.x<0?0:1];
        // Boarding is an END transition from a supported dry bank at matching
        // height. Lateral entrance and under-bridge traversal stay on ground.
        const endEntry=bridgeEndGate(crossingDeck,x,y,radius,cellWidth,cellHeight);
        const walkingAlongDeck=bridgeLongitudinal(crossingDeck,stepX,stepY);
        if(bank!==undefined&&endEntry&&walkingAlongDeck&&previous.waterDepth===0&&
          previous.level>=bank-maxStepUp&&previous.level<=bank+maxStepDown)
          bridgeId=candidate.bridge.id;
      }
      const supportedBridgeStep=!!bridgeId&&candidate?.bridge.id===bridgeId;
      if(supportedBridgeStep){
        const crossingDeck=candidate.corridor;
        const banks=sculptBridgeBankHeights(terrain,crossingDeck,options);
        // Peaks higher than the deck remain real solid cliffs (V60 spike).
        if(banks&&sample.level>Math.max(...banks))
          return reject(bridgeHeightReason(previous,sample,maxStepUp));
      }else{
        // V76: the precise circle/radius in the sculpt data is the only
        // spherical collision footprint. No painted pixels or extra obstacles.
        // Spheres remain inaccessible on foot until authored V77 ramps; a
        // stranded actor already inside may retreat radially OUT, never enter.
        const sphere=sculptSphereAt(terrain,x,y,radius);
        const priorSphere=sculptSphereAt(terrain,previousX,previousY,radius);
        if(!dismounting&&sphere&&(!priorSphere||priorSphere.id!==sphere.id||
          Math.hypot(x-sphere.x,y-sphere.y)<
            Math.hypot(previousX-sphere.x,previousY-sphere.y)-1e-6))
          return reject(Object.freeze({kind:'sphere-wall',id:sphere.id,
            variant:sphere.kind,limit:0}));
        const projectedSphere=projectionRise>0&&!candidate&&!previousCarrier&&
          sculptSphereProjectionBlock(terrain,x,y,
            {cellWidth,cellHeight,projectionRise,radius});
        if(projectedSphere&&!dismounting){
          const priorProjection=sculptSphereProjectionBlock(terrain,
            previousX,previousY,{cellWidth,cellHeight,projectionRise,radius});
          // A stranded player may retreat NORTH or sideways OUT of the
          // visible hill. Movement deeper beneath the upper grass stays locked.
          const retreating=priorProjection?.id===projectedSphere.id&&(
            projectedSphere.depth<priorProjection.depth-1e-6||
            Math.abs(x-projectedSphere.centerX)>
              Math.abs(previousX-projectedSphere.centerX)+1e-6);
          if(!retreating)return reject(projectedSphere);
        }
        // The user must stop at the *visible* northern wall, not several
        // cells later at its unprojected footprint. The carried bridge deck
        // and flying locomotion are explicit exceptions, preserved above.
        // Allow retreat north from a previously stranded position.
        const projectionConfig={cellWidth,cellHeight,projectionRise,radius};
        const visualBlock=projectionRise>0&&!candidate&&!previousCarrier&&
          sculptNorthCliffProjectionBlock(terrain,x,y,projectionConfig);
        const priorVisualBlock=visualBlock&&sculptNorthCliffProjectionBlock(
          terrain,previousX,previousY,projectionConfig);
        if(!dismounting&&visualBlock&&
           (stepY>=-1e-7||!priorVisualBlock))
          return reject(visualBlock);
        if(sample.waterDepth>0&&!swimming&&!shorePermitted(x,y,sample))
          return reject(Object.freeze({kind:'water',col:sample.col,row:sample.row,
            waterDepth:sample.waterDepth}));
        const rise=sample.level-previous.level;
        if(!dismounting&&(rise>Math.max(0,maxStepUp)||-rise>Math.max(0,maxStepDown)))
          return reject(Object.freeze({kind:rise>0?'height-up':'height-down',
            col:sample.col,row:sample.row,from:previous.level,to:sample.level,
            delta:Math.abs(rise),limit:rise>0?Math.max(0,maxStepUp):Math.max(0,maxStepDown)}));
      }
    }
    previous=sample;previousX=x;previousY=y;previousCarrier=candidate;
  }
  return Object.freeze({reason:null,bridgeId:flying?null:bridgeId});
}
export function sculptNavigationBlockDetail(config,entity,targetX,targetY){
  return sculptNavigationRoute(config,entity,targetX,targetY).reason;
}
export function sculptNavigationNextBridgeId(config,entity,targetX,targetY){
  const result=sculptNavigationRoute(config,entity,targetX,targetY);
  return result.reason?entity?.sculptBridgeId??null:result.bridgeId;
}

// Boolean Collision World adapter and user-facing diagnostics read the exact
// SAME canonical swept-cell check. No visual rounding becomes gameplay physics.
export function isSculptNavigationBlocked(config,entity,targetX,targetY){
  return sculptNavigationBlockDetail(config,entity,targetX,targetY)!==null;
}

