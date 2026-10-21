// Visual-only hit testing for the SAME resolved WorldObject rectangles
// used by the sculpt renderer. Never creates a gameplay collision shape.
import {sculptHeightAt} from '../world/sculpt-height-model.js';
import {sculptBridgeDeckHeight} from '../core/sculpt-navigation-collision.js?rev=sculpt-bridge-crossing-v60';
import {resolveWorldObjectPlacements} from '../world/world-object-placement-model.js';
import {objectDefinitionCatalogV1} from '../objects/object-definition-catalog.js';

export function sculptObjectVisualRect(object,terrain,{tileWidth=28,tileHeight=21,rise=18}={}){
  const t=object.transform,base=object.baseSize;
  const col=Math.floor(t.x/tileWidth),row=Math.floor(t.y/tileHeight);
  const groundLevel=terrain&&col>=0&&row>=0&&col<terrain.width&&row<terrain.height
    ?sculptHeightAt(terrain,col,row):0;
  // The anchor for the 2.5D bridge image is its DECK, not the riverbed below.
  // Its true walkable support altitude already belongs to canonical WorldObject
  // navigation; reuse it read-only. Other object types retain exact V44 anchor.
  const bridgeDeck=terrain&&object.kind==='bridge'&&
    object.visual?.assetId?.includes('_2p5d.')
    ?sculptBridgeDeckHeight(terrain,[object],t.x,t.y,
      {cellWidth:tileWidth,cellHeight:tileHeight}):null;
  const level=bridgeDeck??groundLevel;
  return Object.freeze({
    x:t.x,y:t.y-level*rise,
    width:(base?.width??base?.length??80)*t.scaleX,
    height:(base?.height??base?.width??80)*t.scaleY,
    angle:(t.rotationDeg??0)*Math.PI/180
  });
}
export function findSculptVisualObjectAtPoint(placements,terrain,{x,y},{
  zoom=1,paddingPx=9
}={}){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  const padding=Math.min(22,Math.max(5,paddingPx/Math.max(.2,zoom)));
  const objects=resolveWorldObjectPlacements(placements,objectDefinitionCatalogV1);
  // Painter's order: the last (largest Y) intersected sprite owns this pixel.
  let found=null,depth=-Infinity;
  for(const object of objects){
    const rect=sculptObjectVisualRect(object,terrain);
    const dx=x-rect.x,dy=y-rect.y;
    const cos=Math.cos(rect.angle),sin=Math.sin(rect.angle);
    const localX=dx*cos+dy*sin,localY=-dx*sin+dy*cos;
    if(Math.abs(localX)>rect.width/2+padding||
       Math.abs(localY)>rect.height/2+padding)continue;
    if(object.transform.y>=depth){found=object;depth=object.transform.y;}
  }
  return found;
}
