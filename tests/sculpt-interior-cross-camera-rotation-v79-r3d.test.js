import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptInteriorBoundary} from '../src/world/sculpt-interior-layout.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {circleFitsWorldAreaBoundary} from '../src/world/world-area-geometry.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptCameraInteriorView,sculptCameraProject,
  sculptCameraFollowActor} from '../src/render/sculpt-camera-projection.js';
import {createSculptInteriorArea,createSculptUpperFloor,
  updateSculptFloorConnector,serializeSculptInteriors,importSculptInteriors,
  sculptInteriorTransition} from '../src/world/sculpt-interior-area-link.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';

const fixture=()=>{
  const objects=appendSculptPreviewObject([],{definitionId:
    'objectdef.building.house.fantasy_wood_stone.01',x:280,y:250,scale:.6});
  return {objects,entry:createSculptInteriorArea(
    resolveWorldObjectPlacements(objects)[0],objects)};
};

test('R3D : croix traversable de gauche à droite depuis le coeur, coins découpés restent bloqués',()=>{
  const width=24*28,height=18*21;
  const area=normalizeWorldArea({id:'cross-interior',kind:'interior',width,height,
    boundary:sculptInteriorBoundary('cross'),encounters:{randomEnabled:false}});
  const actor={x:width*.5,y:height*.5,radius:5,
    locomotion:{modes:['ground']}};
  for(let x=width*.5;x>=20;x-=7)
    assert.equal(circleFitsWorldAreaBoundary(area,x,height*.5,5),true,
      'bras gauche '+x);
  for(let x=width*.5;x<=width-20;x+=7)
    assert.equal(circleFitsWorldAreaBoundary(area,x,height*.5,5),true,
      'bras droit '+x);
  assert.equal(isBlocked(area,actor,25,25),true);
  assert.equal(isBlocked(area,actor,width-25,height-25),true);
  for(let i=0;i<75;i++)stepMovement(area,actor,{x:-1,y:0},.016,{maxSpeed:240});
  assert.ok(actor.x<80,'marcher jusqu’au bras gauche : '+actor.x);
  for(let i=0;i<145;i++)stepMovement(area,actor,{x:1,y:0},.016,{maxSpeed:240});
  assert.ok(actor.x>width-80,'traverser vers le bras droit : '+actor.x);
});

test('R3D : caméra acteur visible pour petites et grandes croix, toutes inclinaisons et zooms',()=>{
  for(const angle of [35,45,55,70,90]){
    const view=sculptCameraInteriorView(angle);
    assert.equal(view.shear,0);
    for(const zoom of [.32,.65,1,1.75,2.4]){
      for(const [x,y] of [[12,189],[336,189],[660,189],[336,20],[336,360]]){
        const frame={width:390,height:780,zoom};
        const pan=sculptCameraFollowActor(view,{x,y,level:2,rise:18},frame);
        const point=sculptCameraProject(view,x,y-36);
        const screen={x:pan.x+point.x*zoom,y:pan.y+point.y*zoom};
        assert.ok(Math.abs(screen.x-195)<.00001);
        assert.ok(Math.abs(screen.y-780*.54)<.00001);
      }
    }
  }
});

test('R3D : orientation 0..359° sauvegardée sur Portal sans altérer passage ni Spawn',()=>{
  const {entry,objects}=fixture();
  let linked=createSculptUpperFloor(entry);
  let entries=[linked.below,linked.upper];
  const source=entries[0].area.id,up=entries[1].entryPortal;
  entries=updateSculptFloorConnector(entries,{
    sourceAreaId:source,portalId:up.id,x:192,y:145,
    assetId:'stairs.stone',rotationDeg:135
  });
  assert.equal(entries[1].entryPortal.visual.rotationDeg,135);
  assert.equal(entries[1].entryPortal.trigger.x,192);
  assert.equal(entries[1].area.spawns.find(s=>s.id==='arrival-up').x,192);
  entries=updateSculptFloorConnector(entries,{
    sourceAreaId:source,portalId:up.id,x:192,y:145,
    assetId:'stairs.stone',rotationDeg:359
  });
  assert.equal(entries[1].entryPortal.visual.rotationDeg,359);
  assert.equal(sculptInteriorTransition(objects,entries,source,{x:192,y:145})
    .currentAreaId,entries[1].area.id);
  const restored=importSculptInteriors(JSON.parse(JSON.stringify(
    serializeSculptInteriors(entries))),objects);
  assert.equal(restored[1].entryPortal.visual.rotationDeg,359);
  assert.equal(restored[1].entryPortal.trigger.x,192);
});

test('R3D : commandes rotation et caméra visibles, renderer pivote seulement le visuel',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const renderer=readFileSync(new URL('../src/render/sculpt-interior-walls.js',import.meta.url),'utf8');
  assert.match(html,/id="interior-connector-rotation"/);
  assert.match(html,/id="interior-connector-turn-left"/);
  assert.match(html,/id="interior-connector-turn-right"/);
  assert.match(main,/function setInteriorConnectorRotation/);
  assert.match(main,/sculptCameraFollowActor\(cameraView\(\)/);
  assert.match(renderer,/ctx\.translate\(x,y\);ctx\.rotate\(rotation\)/);
});
