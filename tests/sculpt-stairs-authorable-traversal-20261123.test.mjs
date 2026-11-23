import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject,updateSculptPreviewObject,
  serializeSculptPreviewScene,importSculptPreviewScene}
  from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {sculptStairCorridor} from '../src/core/sculpt-stair-traversal.js';
import {sculptNavigationRoute} from '../src/core/sculpt-navigation-collision.js';

const W=16,H=16,CW=28,CH=21;
const pt=(col,row)=>({x:(col+.5)*CW,y:(row+.5)*CH});
const terrain=(water=false)=>createSculptTerrain({
  width:W,height:H,
  levels:Array.from({length:W*H},(_,i)=>Math.floor(i/W)<8?5:2),
  waterLevels:water?Array.from({length:W*H},(_,i)=>
    Math.floor(i/W)===12&&i%W===8?6:-1):null
});
const id='objectdef.stairs.earth_log_path_2p5d.01';
const foot=pt(8,12),head=pt(8,3);
const source=()=>appendSculptPreviewObject([],{
  definitionId:id,x:foot.x,y:foot.y,scale:.6,variantId:'side_alt'
});
const custom=(at=foot,end=head)=>({
  footOffsetX:at.x-foot.x,footOffsetY:at.y-foot.y,
  headOffsetX:end.x-foot.x,headOffsetY:end.y-foot.y,
  width:86
});
const resolved=placements=>resolveWorldObjectPlacements(
  placements,objectDefinitionCatalogV1)[0];

test('an adjusted side stair reuses the original placement and canonical collision corridor',()=>{
  const objects=source();
  assert.equal(objects.length,1);
  assert.equal(objects[0].overrides.stairTraversal,undefined,
    'legacy maps are unchanged without an author path');
  const adjusted=updateSculptPreviewObject(objects,objects[0].id,
    {stairTraversal:custom()});
  assert.equal(adjusted.length,1,'no second WorldObject / phantom stair');
  assert.equal(adjusted[0].id,objects[0].id);
  assert.equal(adjusted[0].overrides.visualVariantId,'side_alt');
  const stair=resolved(adjusted);
  assert.deepEqual(stair.stairTraversal,custom());
  const corridor=sculptStairCorridor(terrain(),stair);
  assert.ok(corridor);
  assert.equal(corridor.id,objects[0].id);
  assert.deepEqual(corridor.foot,foot);
  assert.deepEqual(corridor.head,head);
  assert.equal(corridor.bottomLevel,2);
  assert.equal(corridor.topLevel,5);
  assert.equal(corridor.width,86);
  const sample=terrain(),entity={x:foot.x,y:foot.y,radius:5,
    locomotion:{modes:['ground']}};
  const nav={terrain:sample,stairs:[stair],bridges:[],
    cellWidth:CW,cellHeight:CH,projectionRise:18,maxStepUp:0,maxStepDown:0};
  const walked=sculptNavigationRoute(nav,entity,head.x,head.y);
  assert.equal(walked.reason,null,
    'walking on the authored stair uses existing Collision World only');
  assert.equal(sample.ramps.length,0,'no separate slope created');
  assert.equal(objects[0].overrides.stairTraversal,undefined);
});

test('normalizing, exporting/importing and reverting retain the exact original stair ID',()=>{
  const t=terrain(),placed=source();
  const altered=updateSculptPreviewObject(placed,placed[0].id,
    {stairTraversal:custom()});
  const json=serializeSculptPreviewScene(t,altered);
  const restored=importSculptPreviewScene(json);
  assert.equal(restored.objects.length,1);
  assert.equal(restored.objects[0].id,placed[0].id);
  assert.deepEqual(restored.objects[0].overrides.stairTraversal,custom());
  const reset=updateSculptPreviewObject(altered,placed[0].id,
    {stairTraversal:null});
  assert.equal(reset[0].overrides.stairTraversal,undefined);
  assert.equal(reset[0].id,placed[0].id);
  assert.equal(placed[0].overrides.stairTraversal,undefined);
  const nonStair=appendSculptPreviewObject([],
    {definitionId:'objectdef.tree.conifer.01',x:80,y:80,scale:.5});
  if(nonStair.length){
    const result=updateSculptPreviewObject(nonStair,nonStair[0].id,
      {stairTraversal:custom()});
    assert.equal(result[0].overrides.stairTraversal,undefined,
      'only stairs accept this metadata');
  }
});

test('manual route requires valid dry endpoints and real ascent',()=>{
  const placed=source(),o=updateSculptPreviewObject(placed,placed[0].id,
    {stairTraversal:custom()});
  assert.equal(sculptStairCorridor(terrain(true),resolved(o)),null,
    'wet foot is not a supported stair');
  const bad=updateSculptPreviewObject(placed,placed[0].id,{
    stairTraversal:custom(foot,pt(8,11))});
  assert.equal(sculptStairCorridor(terrain(),resolved(bad)),null,
    'two points on a flat level cannot authorize a vertical passage');
  const malformed=updateSculptPreviewObject(placed,placed[0].id,{
    stairTraversal:{...custom(),width:-200}});
  assert.equal(malformed[0].overrides.stairTraversal,undefined,
    'bad authoring data does not persist');
});

test('existing Objets palette owns the stair authoring gesture and Undo',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  for(const id of ['object-stair-path','object-stair-trace','object-stair-reset'])
    assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
  assert.match(js,/stairTraceMode/);
  assert.match(js,/stairTraceGesture/);
  assert.match(js,/sculptStairCorridor\(terrain,resolved\)/);
  assert.match(js,/objectCommit\(next\)/);
  assert.match(js,/stairTraversal:null/);
  assert.match(html,/Trace le chemin physique sur la carte/);
});
