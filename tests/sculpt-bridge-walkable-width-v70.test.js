import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {listNativeObjectDefinitions,objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect,bridgeVisualRect} from '../src/world/world-object-model.js';
import {orientedWorldPoint,orientedLocalPoint,circleFitsOrientedRect} from '../src/core/geometry.js';
import {sculptNavigationBlockDetail,sculptNavigationRoute,sculptBridgeDeckAt} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptCameraGameView,sculptCameraProjectBridgeCorridor} from '../src/render/sculpt-camera-projection.js';

const FAMILIES=listNativeObjectDefinitions().filter(d=>d.kind==='bridge'&&
  d.visual?.assetId?.includes('_2p5d.'));
const VARIANTS=['horizontal','vertical','diagonal_left','diagonal_right'];
const SCALES=[.5,1,1.8,3];
const TILE={cellWidth:28,cellHeight:21};
const t=createSculptTerrain({width:36,height:36,levels:Array(36*36).fill(6)});
const bridgeAt=(definitionId,variantId,scale,rotationDeg=0)=>{
  const placements=appendSculptPreviewObject([],{
    definitionId,variantId,scale,rotationDeg,x:504,y:378
  });
  const bridge=resolveWorldObjectPlacements(placements)[0];
  const ctx={terrain:t,bridges:[bridge],...TILE,maxStepUp:2,maxStepDown:2};
  return {bridge,ctx,world:{width:1008,height:756,objects:placements,obstacles:[]}};
};
const player=(p,bridgeId)=>({x:p.x,y:p.y,radius:5,
  locomotion:{modes:['ground']},facingX:1,moving:false,sculptBridgeId:bridgeId});

test('V70 the 28 authentic 2.5D bridge assets use narrow declared decking, never rail or art alpha',()=>{
  assert.equal(FAMILIES.length,7);
  for(const def of FAMILIES){
    assert.equal(def.traversal.widthRatio,.35,def.id);
    assert.equal(def.traversal.lengthRatio,.92,def.id);
    assert.equal(def.baseSize.width,96,def.id);
    assert.equal(def.baseSize.length,170,def.id);
    assert.deepEqual(def.traversal.viewAxesDeg,
      {horizontal:0,vertical:90,diagonal_left:-45,diagonal_right:45});
    assert.equal(def.visual.variants.length,4);
  }
  // Historical bridges have a different billboard perspective and are frozen.
  for(const def of listNativeObjectDefinitions().filter(d=>d.kind==='bridge'&&
    !d.visual?.assetId?.includes('_2p5d.'))){
    assert.equal(def.traversal.widthRatio,.82,def.id);
  }
  const model=readFileSync(new URL('../src/core/sculpt-navigation-collision.js',import.meta.url),'utf8');
  assert.doesNotMatch(model,/getImageData\(|drawImage\(|naturalWidth|image\.src/);
});
test('V70 every view, scale and rotation uses the exact authoring corridor for the entire actor footprint',()=>{
  for(const def of FAMILIES)for(const variantId of VARIANTS)
  for(const scale of SCALES)for(const rotationDeg of [0,20]){
    const {bridge,ctx}=bridgeAt(def.id,variantId,scale,rotationDeg);
    assert.equal(bridge.visual.variantId,variantId);
    const deck=bridgeTraversalRect(bridge),visual=bridgeVisualRect(bridge);
    assert.ok(deck);
    assert.ok(Math.abs(deck.width-visual.width*.35)<1e-8,def.id);
    assert.ok(Math.abs(deck.length-visual.length*.92)<1e-8,def.id);
    assert.ok(Math.abs(deck.rotation-(rotationDeg+def.traversal.viewAxesDeg[variantId])*
      Math.PI/180)<1e-8);
    const margin=deck.width*.5-5;
    assert.ok(margin>0,'even minimum-scale bridge fits actor radius');
    const onEdge=orientedWorldPoint(0,margin-.6,deck);
    const offPlanks=orientedWorldPoint(0,margin+2,deck);
    assert.ok(circleFitsOrientedRect(onEdge.x,onEdge.y,5,deck));
    assert.equal(circleFitsOrientedRect(offPlanks.x,offPlanks.y,5,deck),false);
    assert.ok(sculptBridgeDeckAt([bridge],onEdge.x,onEdge.y,5));
    assert.equal(sculptBridgeDeckAt([bridge],offPlanks.x,offPlanks.y,5),null);
    // At exact same X/Y, only a real stored DECK occupant collides with side rail.
    const rider=player(onEdge,bridge.id);
    const denial=sculptNavigationBlockDetail(ctx,rider,offPlanks.x,offPlanks.y);
    assert.equal(denial?.kind,'bridge-edge',
      def.id+'/'+variantId+'/'+scale+'/'+rotationDeg);
    assert.equal(sculptNavigationRoute(ctx,player(offPlanks,null),
      offPlanks.x,offPlanks.y).bridgeId,null,'outside stays on ground');
    // V70 still uses the camera only to project, not to authorize physics.
    for(const pitch of [35,55,80,90]){
      const corners=sculptCameraProjectBridgeCorridor(sculptCameraGameView(pitch),deck,{
        level:6,rise:18});
      assert.equal(corners.length,4);
      assert.equal(sculptNavigationBlockDetail(ctx,rider,offPlanks.x,offPlanks.y)?.kind,
        'bridge-edge');
    }
  }
});
test('V70 actual Collision World movement stops on plank edge (no invisible high pavement)',()=>{
  for(const variantId of VARIANTS)for(const scale of [.5,1,1.4,2.5]){
    const {bridge,ctx,world}=bridgeAt(FAMILIES[0].id,variantId,scale);
    const deck=bridgeTraversalRect(bridge),safe=deck.width*.5-5-1;
    const start=orientedWorldPoint(0,0,deck),on=orientedWorldPoint(0,safe,deck);
    const beyond=orientedWorldPoint(0,deck.width*.5,deck);
    const hero=player(start,bridge.id);
    const lateral={x:-Math.sin(deck.rotation),y:Math.cos(deck.rotation)};
    stepMovement(world,hero,lateral,safe/75,{maxSpeed:75},undefined,
      {sculptNavigation:ctx});
    assert.ok(Math.hypot(hero.x-on.x,hero.y-on.y)<.001,
      'must walk up to (but not through) the boards edge');
    const accepted={x:hero.x,y:hero.y,sculptBridgeId:hero.sculptBridgeId};
    stepMovement(world,hero,lateral,6/75,{maxSpeed:75},undefined,
      {sculptNavigation:ctx});
    assert.deepEqual({x:hero.x,y:hero.y,sculptBridgeId:hero.sculptBridgeId},accepted,
      'rails must stop movement even when solid terrain exists below');
    assert.equal(sculptNavigationBlockDetail(ctx,hero,beyond.x,beyond.y)?.kind,'bridge-edge');
  }
});
test('V70 ground-level underpass retains full passage width and no automatic elevation',()=>{
  for(const variantId of VARIANTS)for(const scale of [1,1.4,2]){
    const {bridge,ctx}=bridgeAt(FAMILIES[0].id,variantId,scale);
    const deck=bridgeTraversalRect(bridge);
    // A REAL low underpass cuts across the bridge, while actual bank ends
    // remain six levels high. Flat terrain at the same height as the deck
    // would quite correctly count as a supported high bridge approach.
    const lowStrip=Array.from({length:36*36},(_,i)=>{
      const point={x:(i%36+.5)*28,y:(Math.floor(i/36)+.5)*21};
      return Math.abs(orientedLocalPoint(point.x,point.y,deck).x)<42?0:6;
    });
    const c={...ctx,terrain:createSculptTerrain({width:36,height:36,levels:lowStrip})};
    const start=orientedWorldPoint(0,-deck.width*.65,deck);
    const ground=player(start,null);
    const end=orientedWorldPoint(0,deck.width*.65,deck);
    const route=sculptNavigationRoute(c,ground,end.x,end.y);
    assert.equal(route.reason,null,'ground underpass remains continuous on actual low dry floor');
    assert.equal(route.bridgeId,null,'must not mount from the middle or underside');
  }
});
