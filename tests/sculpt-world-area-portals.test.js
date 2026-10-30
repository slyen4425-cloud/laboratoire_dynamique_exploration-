import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
  updatePortal,serializeWorldBuilderDraft,importWorldBuilderDocument
} from '../src/builder/world-builder-draft.js';
import {normalizeWorldDocument} from '../src/world/world-document-model.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptSurfaceStroke,createSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {
  sculptWorldAreaScene,saveSculptWorldArea,placeSculptWorldPortal,placeSculptWorldSpawn
} from '../src/builder/sculpt-world-area-link.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';

function world(){
  const d=createBlankWorldBuilderDraft({id:'monde-test',width:1008,height:504});
  return addWorldArea(d,{name:'Donjon ancien',kind:'dungeon'});
}
test('WorldArea canonical kind exterior hosts a dungeon instance linked by a real Portal',()=>{
  const a=world(),exterior=a.areas[0],dungeon=a.areas[1];
  assert.equal(dungeon.kind,'interior');
  assert.equal(dungeon.siteKind,'dungeon');
  assert.equal(dungeon.width,18*28);
  assert.equal(dungeon.height,14*21);
  const linked=connectWorldAreas(a,{sourceAreaId:exterior.id,targetAreaId:dungeon.id,returnPortal:true});
  assert.equal(linked.portals.length,2);
  assert.equal(linked.portals[0].sourceAreaId,exterior.id);
  assert.equal(linked.portals[0].targetAreaId,dungeon.id);
  assert.equal(linked.portals[1].targetAreaId,exterior.id);
  const persisted=importWorldBuilderDocument(serializeWorldBuilderDraft(linked));
  assert.equal(persisted.areas[1].siteKind,'dungeon');
  assert.equal(persisted.portals.length,2);
});
test('heightfield is optional canonical WorldArea geometry, not a second WorldGraph or scene save',()=>{
  const a=world(),forest=a.areas[0],original=sculptWorldAreaScene(forest);
  assert.equal(original.terrain.width,36);
  assert.equal(original.terrain.height,24);
  const changedTerrain=createSculptTerrain({width:36,height:24,levels:Array(36*24).fill(4)});
  const changedSurface=appendSculptSurfaceStroke(createSculptSurface(),{
    materialId:'grass.forest',terrainFamilyId:'forest',width:80,
    points:[{x:65,y:50},{x:300,y:50}]
  });
  const updated=saveSculptWorldArea(a,forest.id,{
    terrain:changedTerrain,objects:[],actors:[],surface:changedSurface
  });
  assert.equal(updated.areas[0].sculptTerrain.levels[0],4);
  assert.equal(updated.areas[0].surface.zones[0].terrainFamilyId,'forest');
  assert.equal(updated.areas[0].surface.baseTerrainFamilyId,changedSurface.baseTerrainFamilyId);
  assert.equal(updated.areas[0].surface.zones.length,1);
  const exported=serializeWorldBuilderDraft(updated);
  assert.equal(JSON.parse(exported).areas[0].sculptTerrain.levels[0],4);
  const restored=importWorldBuilderDocument(exported);
  assert.deepEqual(sculptWorldAreaScene(restored.areas[0]).terrain.levels,changedTerrain.levels);
  assert.equal(restored.areas[0].surface.zones.length,1);
});
test('Portal placed on source 2.5D terrain uses same runtime Portal transition and target Spawn',()=>{
  let d=world();
  const source=d.areas[0],target=d.areas[1];
  d=connectWorldAreas(d,{sourceAreaId:source.id,targetAreaId:target.id,returnPortal:true});
  const portal=d.portals.find(p=>p.sourceAreaId===source.id);
  d=placeSculptWorldPortal(d,portal.id,{x:255,y:205});
  d=placeSculptWorldSpawn(d,target.id,target.spawns[0].id,{x:196,y:126});
  const crossed=findTriggeredPortal(d,source.id,{x:255,y:205});
  assert.equal(crossed.id,portal.id);
  const arrived=applyPortalTransition(d,{currentAreaId:source.id,x:255,y:205},crossed);
  assert.deepEqual({areaId:arrived.currentAreaId,x:arrived.x,y:arrived.y},
    {areaId:target.id,x:196,y:126});
  assert.deepEqual(importWorldBuilderDocument(serializeWorldBuilderDraft(d)).portals[0].trigger,
    crossed.trigger);
});
test('invalid portal coordinates or inconsistent heightfield cannot silently save',()=>{
  let d=world();
  d=connectWorldAreas(d,{sourceAreaId:d.areas[0].id,targetAreaId:d.areas[1].id});
  assert.throws(()=>placeSculptWorldPortal(d,d.portals[0].id,{x:-3,y:400}),/carte|zone|limite/i);
  assert.throws(()=>placeSculptWorldSpawn(d,d.areas[1].id,'arrivee',{x:30000,y:9}),/carte|zone|limite/i);
  assert.throws(()=>saveSculptWorldArea(d,d.areas[0].id,{
    terrain:createSculptTerrain({width:20,height:14}),objects:[],actors:[],
    surface:createSculptSurface()
  }),/dimension|taille|redimension/i);
  assert.equal(d.areas[0].sculptTerrain,undefined);
});
test('60x60 is not a WorldDocument maximum: existing Sculpt model supports 72x62; larger needs a real scalable heightfield',()=>{
  const d=addWorldArea(world(),{name:'Grande forêt',kind:'exterior',width:72*28,height:62*21});
  const area=d.areas.at(-1);
  assert.equal(sculptWorldAreaScene(area).terrain.width,72);
  assert.equal(sculptWorldAreaScene(area).terrain.height,62);
  const beyond=addWorldArea(d,{name:'Continent',kind:'exterior',width:112*28,height:80*21});
  assert.equal(beyond.areas.at(-1).width,3136,'WorldDocument supports dimensions beyond current sculpt preview');
  assert.throws(()=>sculptWorldAreaScene(beyond.areas.at(-1)),/terrain 2,5D|limite|prise en charge/i);
  assert.equal(beyond.areas.at(-1).width,3136,'cannot silently shrink large authored areas');
});
