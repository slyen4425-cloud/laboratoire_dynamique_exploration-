import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,sculptDemo,sculptHeightAt,applySculptBrush,
  sculptFaces,applySculptStroke,applySculptWaterStroke,sculptWaterAt,sculptBrushFootprint,importSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE,SCULPT_ROCK_PALETTES,sculptFaceContour,drawSculptTerrain,SCULPT_PREVIEW_RIBBONS,sculptRibbonY}
 from '../src/render/sculpt-height-renderer.js';
import {materialPackV1} from '../src/materials/material-pack-v1.js';
import {createMaterialRegistry} from '../src/materials/material-registry.js';
import {resolveMaterialAsset} from '../src/assets/material-asset-adapter.js';

test('flat 2D base has zero generated cliffs; brush is immutable, deterministic and reversible',()=>{
 const ground=createSculptTerrain({width:12,height:10});
 assert.equal(sculptFaces(ground).length,0);
 assert.equal(sculptHeightAt(ground,6,5),2);
 const edit={x:6.5,y:5.5,radius:2.8,mode:'dig',strength:2};
 const changed=applySculptBrush(ground,edit);
 assert.notEqual(changed,ground);
 assert.equal(sculptHeightAt(ground,6,5),2,'canonical original cannot be mutated');
 assert.equal(sculptHeightAt(changed,6,5),0);
 assert.ok(sculptFaces(changed).length>0,'sculpted height creates true face geometry');
 assert.deepEqual(applySculptBrush(ground,edit),changed);
 const higher=applySculptBrush(changed,{...edit,mode:'raise'});
 assert.ok(sculptHeightAt(higher,6,5)>sculptHeightAt(changed,6,5));
 assert.equal(sculptFaces(ground).length,0,'undo restores the exact prior object');
});

test('flatten/smooth and bounded brush keep legal levels without corrupting neighbors',()=>{
 const ground=createSculptTerrain({width:16,height:14});
 const raised=applySculptBrush(ground,{x:7.5,y:6.5,radius:3,strength:3,mode:'raise'});
 const flat=applySculptBrush(raised,{x:7.5,y:6.5,radius:2.5,mode:'flatten',target:2,strength:2});
 assert.ok(sculptHeightAt(flat,7,6)<sculptHeightAt(raised,7,6));
 const soft=applySculptBrush(raised,{x:7.5,y:6.5,radius:4,mode:'smooth'});
 assert.ok(soft.levels.every(n=>n>=0&&n<=7));
 assert.deepEqual(ground.levels.slice(0,16),raised.levels.slice(0,16));
 assert.equal(applySculptBrush(ground,{x:NaN,y:4}),ground);
});

test('JSON exact roundtrip, malicious or invalid dimensions refused, demo deterministic',()=>{
 const sample=sculptDemo();
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(sample)),sample);
 assert.deepEqual(sculptDemo(),sample);
 assert.ok(new Set(sample.levels).size>1);
 assert.throws(()=>importSculptTerrain('{}'),/invalide/);
 assert.throws(()=>importSculptTerrain(JSON.stringify({schemaVersion:1,width:9,height:9,
 levels:Array(81).fill(99)})),/invalide/);
});

test('rock cliffs derive from elevation deltas, never from source art or collision',()=>{
 const ground=createSculptTerrain({width:8,height:8});
 const edited=applySculptBrush(ground,{x:3.5,y:3.5,radius:1,mode:'raise',strength:2});
 const faces=sculptFaces(edited);
 assert.ok(faces.length>0);
 for(const face of faces){
  assert.ok(face.upper>face.lower);
  assert.equal(face.upper,sculptHeightAt(edited,face.x,face.y));
  assert.equal(face.lower,face.orientation==='south'
   ?sculptHeightAt(edited,face.x,face.y+1)
   :sculptHeightAt(edited,face.x+1,face.y));
 }
 assert.ok(SCULPT_TILE.rise>0);
 assert.ok(Object.keys(SCULPT_ROCK_PALETTES).length>=4);
 assert.equal(drawSculptTerrain(null,{terrain:edited}).faceCount,0);
});

test('lab uses existing Material Registry textures and lives outside 2D game Builder',()=>{
 const reg=createMaterialRegistry(materialPackV1);
 for(const id of ['grass.forest','ground.snow','ground.sand','ground.volcanic_ash_lava']){
  const mat=reg.require(id,'surface');
  assert.ok(resolveMaterialAsset(mat.assets.base)?.path);
 }
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/Terrain sculptable/);
 assert.match(html,/src\/sculpt-lab-main\.js/);
 assert.match(main,/createMaterialRegistry/);
 assert.match(main,/drawSculptTerrain/);
 assert.doesNotMatch(main,/WorldDocument|collision-world|location\.reload/);
 const game=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../builder.html',import.meta.url),'utf8');
 assert.doesNotMatch(game,/sculpt-lab-main|sculpt-height-model/);
 assert.doesNotMatch(builder,/sculpt-lab-main|sculpt-height-model/);
});

test('V11 plateau brush sets exact height 3 on first gesture and never stacks',()=>{
 const base=createSculptTerrain({width:20,height:16});
 const settings={mode:'plateau',target:3,radius:3,strength:1,
   edgeSoftness:0,points:[{x:10.5,y:8.5}]};
 const first=applySculptStroke(base,settings);
 assert.equal(sculptHeightAt(first,10,8),3);
 assert.equal(sculptHeightAt(first,8,8),3,'hard edge is a true flat plateau');
 assert.equal(sculptHeightAt(first,4,8),2);
 const overlap=applySculptStroke(base,{...settings,points:[
  {x:10.5,y:8.5},{x:10.5,y:8.5},{x:11.5,y:8.5},{x:10.5,y:8.5}]});
 assert.equal(sculptHeightAt(overlap,10,8),3);
 assert.equal(sculptHeightAt(overlap,11,8),3);
 assert.deepEqual(applySculptStroke(first,settings),first,'same target cannot stack heights');
 assert.deepEqual(base,createSculptTerrain({width:20,height:16}),'source immutable');
 const exported=serializeSculptTerrain(overlap);
 assert.deepEqual(importSculptTerrain(exported),overlap);
});
test('V11 feathered plateau has soft rim but interior stays EXACT target',()=>{
 const base=createSculptTerrain({width:20,height:20});
 const plateau=applySculptStroke(base,{mode:'plateau',target:7,edgeSoftness:.55,
   radius:5,points:[{x:10.5,y:10.5}],strength:1});
 assert.equal(sculptHeightAt(plateau,10,10),7);
 assert.equal(sculptHeightAt(plateau,11,10),7);
 assert.ok(sculptHeightAt(plateau,14,10)>2 && sculptHeightAt(plateau,14,10)<7);
 assert.equal(sculptHeightAt(plateau,16,10),2);
});
test('V11 brush stroke is monotonic and overlap-independent across pointer frames',()=>{
 const base=createSculptTerrain({width:26,height:18});
 const points=[{x:8.5,y:9.5},{x:9.5,y:9.5},{x:10.5,y:9.5},{x:11.5,y:9.5}];
 const full=applySculptStroke(base,{points,mode:'raise',strength:2,radius:2.5});
 const repeat=applySculptStroke(base,{points:[...points,...points],mode:'raise',strength:2,radius:2.5});
 assert.deepEqual(full,repeat,'overlap and repeats never compound elevation');
 assert.equal(sculptHeightAt(full,9,9),4,'one raise stroke uses strength 2, not 4/6');
 const depression=applySculptStroke(full,{points,mode:'dig',strength:2,radius:2.5});
 assert.equal(sculptHeightAt(depression,9,9),2);
 assert.equal(sculptFaces(base).length,0);
});
test('V11 visual rounding is separate from height data and preserves original 2D schema',()=>{
 const hard=sculptFaceContour({width:28,height:54,smoothness:0});
 const soft=sculptFaceContour({width:28,height:54,smoothness:.85});
 assert.equal(hard.corner,0);
 assert.ok(soft.corner>0&&soft.undulation>0);
 assert.deepEqual(createSculptTerrain(),createSculptTerrain());
 const source=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 assert.match(source,/ctx\.quadraticCurveTo/);
 assert.match(source,/visualSmoothness/);
 assert.doesNotMatch(source,/WorldDocument|collisionWorld|isBlocked/);
 const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 for(const marker of ['data-mode="plateau"','id="level-up"','id="level-down"',
   'id="target"','id="edge"','id="visual-smooth"']){
   assert.ok(page.includes(marker),marker);
 }
});

test('V12 brush visual footprint shares precisely the same influence with real stroke',()=>{
 const base=createSculptTerrain({width:22,height:16});
 const options={mode:'plateau',target:6,points:[{x:8.5,y:7.5},{x:10.5,y:7.5}],
   radius:4.5,edgeSoftness:.55,strength:1};
 const marks=sculptBrushFootprint(base,options);
 const candidate=applySculptStroke(base,options);
 assert.ok(marks.length>10);
 assert.ok(marks.some(p=>p.weight===1));
 assert.ok(marks.some(p=>p.weight>0&&p.weight<1));
 const changed=new Set(candidate.levels.map((v,i)=>v!==base.levels[i]?i:-1).filter(i=>i>=0));
 const preview=new Set(marks.map(p=>p.y*base.width+p.x));
 for(const i of changed)assert.ok(preview.has(i),'no painted cell outside preview');
 assert.deepEqual(candidate,applySculptStroke(base,options),'deterministic');
 assert.deepEqual(base,createSculptTerrain({width:22,height:16}),'original unchanged');
 assert.equal(sculptBrushFootprint(base,{points:[]}).length,0);
});

test('V12 continuous cliff foot has stronger toe than V11 square face; smoothing does not modify geometry',()=>{
 const cliff=sculptFaceContour({width:168,height:60,smoothness:1});
 const hard=sculptFaceContour({width:168,height:60,smoothness:0});
 assert.ok(cliff.foot>8,'large merged wall supports visibly round base');
 assert.ok(cliff.toe>5,'foot extends beyond its former vertical rectangular edge');
 assert.equal(hard.foot,0);
 assert.equal(hard.toe,0);
 assert.deepEqual(sculptDemo(),importSculptTerrain(serializeSculptTerrain(sculptDemo())));
});

test('V12 road and water are registry-backed visual ribbons, not gameplay surfaces',()=>{
 const registry=createMaterialRegistry(materialPackV1);
 for(const kind of ['road','water']){
  const ribbon=SCULPT_PREVIEW_RIBBONS[kind];
  const material=registry.require(ribbon.materialId,ribbon.kind);
  assert.ok(material);
  assert.ok(resolveMaterialAsset(material.assets.center)?.path);
  assert.ok(Number.isFinite(sculptRibbonY(kind,3.5)));
  assert.ok(ribbon.widthCells>1);
 }
 assert.notEqual(sculptRibbonY('road',14),sculptRibbonY('water',14));
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const render=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 for(const id of ['show-water','show-road','preview-cursor','brush-info']){
   assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(ui,/drawSculptBrushPreview/);
 assert.match(render,/sculptBrushFootprint/);
 assert.match(render,/faceRuns/);
 for(const path of ['index.html','builder.html']){
   assert.doesNotMatch(readFileSync(new URL('../'+path,import.meta.url),'utf8'),/sculpt-river-road-v12/);
 }
});


test('V13 local rock roundness applies on NEXT brush only, old regions stay fixed',()=>{
 const original=createSculptTerrain({width:20,height:16});
 const first=applySculptStroke(original,{points:[{x:5.5,y:6.5}],radius:2,mode:'raise',
   strength:2,rockRoundness:20});
 assert.equal(first.roundness[6*20+5],20);
 assert.equal(first.roundness[6*20+15],95);
 const second=applySculptStroke(first,{points:[{x:15.5,y:6.5}],radius:2,mode:'raise',
   strength:2,rockRoundness:150});
 assert.equal(second.roundness[6*20+5],20);
 assert.equal(second.roundness[6*20+15],150);
 assert.equal(first.roundness[6*20+15],95);
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(second)),second);
});

test('V13 water surface volume tracks relief; excavation restores water',()=>{
 const ground=createSculptTerrain({width:18,height:16});
 const cut=applySculptStroke(ground,{points:[{x:8.5,y:8.5}],radius:2,mode:'dig',strength:2});
 const water=applySculptWaterStroke(cut,{points:[{x:8.5,y:8.5}],radius:2.8,
   mode:'water-fill',target:3});
 assert.equal(sculptWaterAt(water,8,8),3);
 assert.equal(sculptWaterAt(water,1,1),0);
 assert.deepEqual(water.levels,cut.levels);
 const raised=applySculptStroke(water,{points:[{x:8.5,y:8.5}],radius:1,
   mode:'plateau',target:5});
 assert.equal(sculptWaterAt(raised,8,8),0);
 assert.equal(raised.waterLevels[8*18+8],3);
 const dug=applySculptStroke(raised,{points:[{x:8.5,y:8.5}],radius:1,
   mode:'plateau',target:0});
 assert.equal(sculptWaterAt(dug,8,8),3);
});

test('V13 water raise / lower / erase and JSON snapshots are deterministic',()=>{
 const flat=createSculptTerrain({width:18,height:14});
 const opts={points:[{x:8.5,y:7.5}],radius:2,edgeSoftness:0};
 const filled=applySculptWaterStroke(flat,{...opts,mode:'water-fill',target:5});
 const raised=applySculptWaterStroke(filled,{...opts,mode:'water-rise',strength:2});
 assert.equal(raised.waterLevels[7*18+8],7);
 assert.deepEqual(raised.levels,filled.levels);
 const lower=applySculptWaterStroke(raised,{...opts,mode:'water-lower',strength:1});
 assert.equal(lower.waterLevels[7*18+8],6);
 const erased=applySculptWaterStroke(lower,{...opts,mode:'water-erase'});
 assert.equal(erased.waterLevels[7*18+8],-1);
 const smooth=applySculptWaterStroke(raised,{...opts,mode:'water-smooth'});
 assert.ok(smooth.waterLevels.every(v=>v===-1||(v>=0&&v<=10)));
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(raised)),raised);
});

test('V13 import old height-only JSON, validate optional water/roundness arrays',()=>{
 const old=JSON.stringify({schemaVersion:1,width:8,height:8,levels:Array(64).fill(2)});
 const loaded=importSculptTerrain(old);
 assert.ok(loaded.waterLevels.every(x=>x===-1));
 assert.ok(loaded.roundness.every(x=>x===95));
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(loaded)),loaded);
 assert.throws(()=>importSculptTerrain(JSON.stringify({schemaVersion:1,width:8,height:8,
 levels:Array(64).fill(2),waterLevels:Array(64).fill(99)})),/invalide/);
});

test('V13 undo/redo, water tools and renderer live outside 2D runtime',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 for(const id of ['undo','redo','water-target'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/data-mode="water-fill"/);
 assert.match(main,/redoHistory/);assert.match(main,/commitUndo/);
 assert.match(renderer,/drawWaterVolume/);
 assert.doesNotMatch(main,/WorldDocument|collision-world/);
});


test('V14 precision size 0.5 edits exactly the one targeted 2D surface cell',()=>{
  const flat=createSculptTerrain({width:20,height:18});
  const stamp=applySculptStroke(flat,{points:[{x:10.5,y:9.5}],radius:.5,
    strength:3,mode:'plateau',target:3,edgeSoftness:0,rockRoundness:95});
  const edits=stamp.levels.flatMap((height,index)=>height===flat.levels[index]?[]:[index]);
  assert.deepEqual(edits,[9*20+10]);
  assert.equal(stamp.levels[edits[0]],3);
  const wet=applySculptWaterStroke(stamp,{points:[{x:10.5,y:9.5}],radius:.5,
    mode:'water-fill',target:5,edgeSoftness:0});
  const affected=wet.waterLevels.flatMap((value,index)=>value===stamp.waterLevels[index]?[]:[index]);
  assert.deepEqual(affected,edits);
  assert.deepEqual(wet.levels,stamp.levels,'authoring water cannot modify land height');
  assert.deepEqual(wet.roundness,stamp.roundness,'water tools must not reshape rocks');
});

test('V14 editor panels are exclusive, fine-step and confirm-before-commit by design',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const ui=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  for(const expected of ['id="mode-ground"','id="mode-water"','id="ground-tools"',
    'id="water-tools"','id="precision-mode"','id="apply-precision"',
    'id="nudge-left"','id="nudge-right"','id="nudge-up"','id="nudge-down"']){
    assert.ok(html.includes(expected),expected);
  }
  assert.match(html,/id="radius"[^>]*min="0\.5"[^>]*step="0\.5"/);
  assert.match(ui,/function setEditorKind/);
  assert.match(ui,/function precisionApply/);
  assert.match(ui,/precisionDragging/);
  assert.match(ui,/commitUndo\(previous\)/);
  assert.doesNotMatch(ui,/location\.reload|WorldDocument|collision-world/);
});
