import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {isBlocked} from '../src/core/collision.js';
import {sculptCameraInteriorView,sculptCameraUnproject,sculptCameraProject} from '../src/render/sculpt-camera-projection.js';
import {appendInteriorWall,normalizeInteriorWalls,removeInteriorWallNear,
  interiorWallBlocksCircle} from '../src/world/interior-wall-model.js';
import {createSculptInteriorArea,updateSculptInterior,createSculptInteriorTemplate,
  applySculptInteriorTemplate,serializeSculptInteriors,importSculptInteriors,
  sculptInteriorPortalDocument,sculptInteriorTransition} from '../src/world/sculpt-interior-area-link.js';

const house=()=>{
  const objects=appendSculptPreviewObject([],{
    definitionId:'objectdef.building.house.fantasy_wood_stone.01',
    x:280,y:260,scale:.60
  });
  const building=resolveWorldObjectPlacements(objects)[0];
  return {objects,entry:createSculptInteriorArea(building,objects)};
};

test('R3A : true WorldArea wall segments are the sole source of collision',()=>{
  const wall={id:'interior-wall-1',a:{x:30,y:70},b:{x:170,y:70},thickness:8,height:72};
  const world=normalizeWorldArea({id:'interior-1',kind:'interior',
    width:504,height:294,walls:[wall]});
  assert.equal(world.walls.length,1);
  assert.equal(world.walls[0].id,wall.id);
  const actor={radius:5,locomotion:{modes:['ground']}};
  assert.equal(!!interiorWallBlocksCircle(world.walls,100,70,actor.radius),true);
  assert.equal(isBlocked(world,actor,100,70),true);
  assert.equal(interiorWallBlocksCircle(world.walls,100,105,actor.radius),null);
  const output=normalizeWorldArea(JSON.parse(JSON.stringify(world)));
  assert.deepEqual(output.walls,world.walls);
});

test('R3A : tactile placement, eraser, duplicate IDs and invalid geometry',()=>{
  const wallSet=appendInteriorWall([],{a:{x:30,y:70},b:{x:170,y:70}});
  assert.equal(wallSet.length,1);
  assert.equal(wallSet[0].id,'interior-wall-1');
  assert.equal(removeInteriorWallNear(wallSet,100,73).length,0);
  assert.equal(removeInteriorWallNear(wallSet,100,100).length,1);
  assert.throws(()=>appendInteriorWall([], {a:{x:10,y:10},b:{x:11,y:10}}),/invalide/);
  assert.throws(()=>normalizeInteriorWalls([...wallSet,...wallSet]),/invalide/);
  assert.throws(()=>normalizeInteriorWalls([{...wallSet[0],a:{x:-2,y:70}}]),/invalide/);
});

test('R3A : murs dans JSON et modèles neutres, Portals attachés au bâtiment',()=>{
  const {objects,entry}=house();
  const walls=appendInteriorWall([],{a:{x:55,y:78},b:{x:191,y:78}});
  const modified=updateSculptInterior(entry,{
    area:normalizeWorldArea({...entry.area,walls})
  });
  const template=createSculptInteriorTemplate(modified,{
    id:'interior-template-1',name:'Maison cloisonnée'
  });
  assert.equal(template.walls.length,1);
  assert.equal('area' in template,false);
  assert.equal('entryPortal' in template,false);
  const applied=applySculptInteriorTemplate(entry,template);
  assert.equal(applied.area.walls.length,1);
  assert.equal(applied.entryPortal.id,entry.entryPortal.id);
  assert.equal(applied.exitPortal.id,entry.exitPortal.id);
  assert.equal(applied.buildingId,entry.buildingId);
  const restored=importSculptInteriors(JSON.parse(
    JSON.stringify(serializeSculptInteriors([modified]))),objects);
  assert.equal(restored[0].area.walls.length,1);
  const saved=serializeSculptInteriors([entry])[0];
  assert.equal(importSculptInteriors([{...saved,area:{...saved.area,walls:undefined}}],objects)[0].area.walls.length,0);
  const docs=sculptInteriorPortalDocument(objects,[restored[0]]);
  assert.equal(docs.areas[1].walls.length,1);
  assert.equal(docs.portals.length,2);
  const portal=restored[0].exitPortal.trigger;
  assert.equal(sculptInteriorTransition(objects,restored,restored[0].area.id,
    {x:portal.x,y:portal.y}).currentAreaId,'sculpt-exterior');
});

test('R3A : 35°–90° preserves exact inverse without interior horizontal skew',()=>{
  for(const angle of [35,45,55,70,90]){
    const view=sculptCameraInteriorView(angle);
    assert.equal(view.angle,angle);
    assert.equal(view.shear,0);
    assert.ok(view.pitch>.5&&view.pitch<=1);
    const pos=sculptCameraProject(view,135,208);
    const back=sculptCameraUnproject(view,pos.x,pos.y);
    assert.ok(Math.abs(back.y-208)<1e-6);
  }
});

test('R3A : game action is an actual canvas overlay, never a testing option',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const canvas=html.indexOf('class="canvas-wrap"'),door=html.indexOf('id="navigation-area-door"');
  const hud=html.indexOf('id="navigation-hud"');
  assert.ok(canvas>=0&&door>canvas&&door<hud);
  assert.match(html,/#navigation-area-door\.in-game-door-action\{position:absolute/);
  assert.match(html,/id="interior-wall-toggle"/);
  assert.match(html,/id="interior-wall-remove"/);
  assert.match(html,/id="interior-house-link-info"/);
  assert.match(js,/cameraView\(\)[\s\S]{0,160}sculptCameraInteriorView/);
  assert.match(js,/walls:current\?\.area\.walls\?\?\[\]/);
  assert.match(js,/appendInteriorWall\(currentInteriorAuthoringArea\(\)\.walls/);
});
