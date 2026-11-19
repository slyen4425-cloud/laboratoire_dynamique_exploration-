import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas,
  serializeWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {
  sculptWorldAreaScene,saveSculptWorldArea,snapshotSculptWorldAreaForRecovery
} from '../src/builder/sculpt-world-area-link.js';

const starter=()=>createBlankWorldBuilderDraft({
  id:'foret-test',width:8*28,height:8*21
});
const terrain=()=>createSculptTerrain({width:8,height:8,levels:Array(64).fill(5)});

test('a linked world can save newly painted raised ground without losing its real portals',()=>{
 const first=starter();
 const two=addWorldArea(first,{name:'Second plateau',kind:'exterior',width:8*28,height:8*21});
 const world=connectWorldAreas(two,{
  sourceAreaId:two.areas[0].id,targetAreaId:two.areas[1].id,returnPortal:true
 });
 assert.equal(world.portals.length,2);
 const scene={...sculptWorldAreaScene(world.areas[0]),terrain:terrain()};
 const updated=saveSculptWorldArea(world,world.areas[0].id,scene);
 assert.deepEqual(updated.portals,world.portals,'all portal/spawn IDs are unchanged');
 assert.deepEqual(updated.areas[0].sculptTerrain.levels,terrain().levels);
 assert.equal(JSON.parse(serializeWorldBuilderDraft(updated)).portals.length,2);
});

test('a rejected portal graph still permits a full read-only WorldDocument recovery',()=>{
 const world=starter(),area=world.areas[0];
 const portal={id:'exit-1',sourceAreaId:area.id,targetAreaId:area.id,
  targetSpawnId:world.initialSpawnId,
  trigger:{kind:'point',x:42,y:40,radius:28},
  enabled:true};
 const invalid={...world,portals:[portal,{...portal}]};
 const scene={...sculptWorldAreaScene(area),terrain:terrain()};
 assert.throws(()=>saveSculptWorldArea(invalid,area.id,scene),
  /portal-invalid-or-duplicate/,'canonical storage must reject invalid portals');
 const recovered=snapshotSculptWorldAreaForRecovery(invalid,area.id,scene);
 assert.equal(recovered.portals.length,2,'do not silently drop duplicate or broken links');
 assert.deepEqual(recovered.portals,invalid.portals);
 assert.deepEqual(recovered.areas[0].sculptTerrain.levels,scene.terrain.levels);
 assert.equal(world.areas[0].sculptTerrain,undefined,'the original world is not mutated');
 assert.equal(JSON.parse(JSON.stringify(recovered)).areas.length,1);
});

test('save failure downloads the unsaved WorldDocument before allowing the editor to leave',()=>{
 const editor=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const start=editor.indexOf('function saveAndReturnWorldArea(');
 const end=editor.indexOf("  $('world-area-unavailable-return')",start);
 const save=editor.slice(start,end);
 assert.ok(start>0&&end>start);
 assert.match(save,/persistCurrentWorldSculpt\(\)/);
 assert.match(save,/downloadWorldSculptRecovery\(\)/);
 assert.match(editor,/snapshotSculptWorldAreaForRecovery\(/);
 assert.match(editor,/world-recovery\.json/);
 assert.match(save,/feedback\.textContent=message/);
 assert.match(save,/catch\(recoveryError\)/,'a failed download still leaves the editor open');
 assert.match(save,/window\.location\.assign/);
});
