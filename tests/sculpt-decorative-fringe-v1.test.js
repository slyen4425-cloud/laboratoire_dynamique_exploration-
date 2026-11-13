import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SCULPT_DECORATIVE_FRINGE_SCHEMA,createSculptDecorativeFringeV1,
  sculptDecorativeFringeCellIsOuterV1,paintSculptDecorativeFringeV1,
  placeSculptDecorativeFringeObjectV1,normalizeSculptDecorativeFringeV1
} from '../src/world/sculpt-decorative-fringe-v1.js';
import {normalizeWorldArea} from '../src/world/world-area-model.js';
import {sculptWorldAreaScene,saveSculptWorldArea} from '../src/builder/sculpt-world-area-link.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {readFileSync} from 'node:fs';

const raw={id:'forest',kind:'exterior',width:36*28,height:24*21,
  spawns:[{id:'home',x:300,y:200}],objects:[],
  encounters:{randomEnabled:true}};
const original=normalizeWorldArea(raw);

test('the editable fringe is outside all FOUR original gameplay borders',()=>{
  for(const [x,y] of [[-1,12],[36,12],[12,-1],[12,24]])
    assert.equal(sculptDecorativeFringeCellIsOuterV1(original,x,y),true);
  for(const [x,y] of [[0,0],[35,23],[-9,0],[44,0],[0,32]])
    assert.equal(sculptDecorativeFringeCellIsOuterV1(original,x,y),false);
});

test('decorative sculpt uses exactly the original terrain brush and cannot touch playable terrain',()=>{
  const fringe=createSculptDecorativeFringeV1(original);
  const after=paintSculptDecorativeFringeV1(fringe,original,
    {col:-2,row:6,mode:'raise',strength:3,radius:.5});
  assert.equal(after.schema,SCULPT_DECORATIVE_FRINGE_SCHEMA);
  assert.ok(after.chunks.length>=4,'four surrounding sides are prefilled');
  const chunk=after.chunks.find(item=>item.col===-8&&item.row===0);
  assert.ok(chunk);
  assert.equal(chunk.col,-8);
  assert.equal(chunk.row,0);
  assert.equal(chunk.terrain.levels[6*8+6],5);
  assert.throws(()=>paintSculptDecorativeFringeV1(after,original,{col:2,row:6,mode:'raise'}),/outside playable/);
  assert.deepEqual(original,normalizeWorldArea(raw),'gameplay area remains byte-for-byte equal');
  assert.deepEqual(normalizeSculptDecorativeFringeV1(JSON.parse(JSON.stringify(after)),original),after);
});

test('decorative objects remain outside base world and are never copied into collisions',()=>{
  const fringe=createSculptDecorativeFringeV1(original);
  const outdoor={id:'visual-rock',objectDefinitionId:'rock-granite',
    transform:{x:-28,y:12*21,rotationDeg:0,scaleX:1,scaleY:1}};
  const updated=placeSculptDecorativeFringeObjectV1(fringe,original,outdoor);
  const world=normalizeWorldArea({...raw,decorativeFringe:updated});
  assert.equal(world.objects.length,0);
  assert.equal(world.spawns[0].x,300);
  assert.equal(world.width,raw.width);
  assert.equal(world.height,raw.height);
  assert.equal(world.decorativeFringe.objects.length,1);
  assert.equal(sculptWorldAreaScene(world).decorativeFringe.objects.length,1);
  assert.throws(()=>placeSculptDecorativeFringeObjectV1(updated,original,
    {...outdoor,id:'illegal',transform:{x:300,y:200}}),/outside the playable area/);
});

test('WorldDocument round-trip retains decorative sculpt and objects with no new playable cells',()=>{
  const draft=createBlankWorldBuilderDraft({id:'fringe-world',width:36*28,height:24*21});
  const area=draft.areas[0],scene=sculptWorldAreaScene(area);
  const painted=paintSculptDecorativeFringeV1(
    createSculptDecorativeFringeV1(area),area,
    {col:area.width/28,row:6,mode:'raise',strength:2,radius:.5});
  const saved=saveSculptWorldArea(draft,area.id,{...scene,decorativeFringe:painted});
  const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(saved));
  const final=restored.areas[0];
  assert.equal(final.width,area.width);
  assert.equal(final.height,area.height);
  assert.deepEqual(final.spawns,area.spawns);
  assert.deepEqual(final.boundary,area.boundary);
  assert.deepEqual(final.encounters,area.encounters);
  assert.deepEqual(sculptWorldAreaScene(final).terrain,scene.terrain);
  assert.equal(final.decorativeFringe.chunks.length,painted.chunks.length);
  assert.equal(final.decorativeFringe.schema,SCULPT_DECORATIVE_FRINGE_SCHEMA);
});

test('2.5D editor renders north fringe only while collision remains on the core area',()=>{
  const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const first=source.indexOf('function navigationWorld(){');
  const last=source.indexOf('function navigationMaxStep(){',first);
  assert.ok(first>0&&last>first);
  assert.doesNotMatch(source.slice(first,last),/decorativeFringe/);
  assert.match(source,/sculptExteriorFringeCameraBoundsV1/);
  assert.match(source,/fringeRows:8/);
  assert.match(source,/skyFraction:\.12/);
  assert.match(source,/drawDecorativeFringeTerrain\(\)/);
  assert.match(source,/drawDecorativeFringeObjects\(\)/);
  assert.match(source,/if\(chunk\.row>=0\|\|chunk\.col<0/);
  assert.match(source,/ctx\.clip\(\)/);
  assert.match(source,/return \{\.\.\.coreBounds,minY,height:coreBounds\.maxY-minY\}/);
  assert.match(source,/screenToDecorativeFringeCell/);
  assert.match(source,/paintSculptDecorativeFringeV1/);
  assert.match(html,/id="scenery-fringe-toggle"/);
  assert.match(html,/hors zone jouable/);
});

test('80 by 64 allows eight exterior decorative cells on all sides',()=>{
  const maximum={...raw,width:80*28,height:64*21};
  const ring=createSculptDecorativeFringeV1(maximum);
  assert.ok(ring.chunks.length>0&&ring.chunks.length<=80);
  for(const [x,y] of [[-8,0],[87,10],[10,-8],[10,71]])
    assert.equal(sculptDecorativeFringeCellIsOuterV1(maximum,x,y),true);
  for(const [x,y] of [[-9,0],[88,0],[0,-9],[0,72],[0,0],[79,63]])
    assert.equal(sculptDecorativeFringeCellIsOuterV1(maximum,x,y),false);
  const painted=paintSculptDecorativeFringeV1(ring,maximum,
    {col:80,row:63,mode:'raise',radius:.5,strength:1});
  assert.equal(painted.schema,SCULPT_DECORATIVE_FRINGE_SCHEMA);
  assert.equal(maximum.width,2240);
  assert.equal(maximum.height,1344);
});
