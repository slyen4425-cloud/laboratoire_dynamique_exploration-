import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,sculptDemo,sculptHeightAt,applySculptBrush,
  sculptFaces,importSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE,SCULPT_ROCK_PALETTES,drawSculptTerrain}
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


test('V11 paints an exact three-level terrace with one touch (no repeated tapping)',()=>{
 const flat=createSculptTerrain({width:22,height:22,levels:Array(22*22).fill(0)});
 const terrace=applySculptBrush(flat,{x:11.5,y:11.5,radius:4,mode:'plateau',target:3,hardness:65});
 assert.equal(sculptHeightAt(flat,11,11),0);
 assert.equal(sculptHeightAt(terrace,11,11),3);
 assert.equal(sculptHeightAt(terrace,12,11),3);
 assert.equal(sculptHeightAt(terrace,11,12),3);
 assert.equal(sculptHeightAt(terrace,1,1),0);
 assert.ok(sculptFaces(terrace).some(face=>face.upper===3 && face.lower<3));
 assert.deepEqual(importSculptTerrain(serializeSculptTerrain(terrace)),terrace);
});

test('V11 hardness 100 has a crisp constant-height interior; soft falloff produces intermediate levels',()=>{
 const ground=createSculptTerrain({width:24,height:24,levels:Array(24*24).fill(0)});
 const settings={x:12.5,y:12.5,radius:5,mode:'plateau',target:5};
 const hard=applySculptBrush(ground,{...settings,hardness:100});
 const soft=applySculptBrush(ground,{...settings,hardness:0});
 assert.equal(sculptHeightAt(hard,12,12),5);
 assert.equal(sculptHeightAt(soft,12,12),5);
 assert.ok(hard.levels.every(v=>v===0||v===5));
 assert.ok(soft.levels.some(v=>v>0&&v<5),'feather ring must create gradual levels');
 assert.ok(sculptHeightAt(soft,16,12)<5);
 assert.notDeepEqual(hard,soft);
 assert.equal(sculptHeightAt(soft,0,0),0);
});

test('V11 raises and digs using prior terrain; visual smoothing remains 100% render-only',()=>{
 const original=sculptDemo();
 const raised=applySculptBrush(original,{x:14.5,y:9.5,radius:3,mode:'raise',hardness:45});
 const dug=applySculptBrush(raised,{x:14.5,y:9.5,radius:3,mode:'dig',strength:2,hardness:70});
 assert.ok(raised.levels.every(v=>v>=0&&v<=7));
 assert.ok(dug.levels.every(v=>v>=0&&v<=7));
 const before=JSON.stringify(dug);
 assert.equal(drawSculptTerrain(null,{terrain:dug,roundness:0}).faceCount,0);
 assert.equal(drawSculptTerrain(null,{terrain:dug,roundness:1}).faceCount,0);
 assert.equal(JSON.stringify(dug),before,'visual slider cannot mutate canonical terrain');
});

test('V11 uses independent authoring controls and no duplicate 2D camera authority',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const renderer=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 assert.match(html,/data-mode="plateau"/);
 for(const id of ['target','height-minus','height-plus','hardness','visual-smooth'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(main,/roundness:Number\(\$\('visual-smooth'\)/);
 assert.match(main,/hardness:Number\(\$\('hardness'\)/);
 assert.match(renderer,/ctx\.quadraticCurveTo/);
 assert.match(renderer,/ctx\.clip\(\)/);
 assert.doesNotMatch(main,/WorldDocument|collision-world/);
});
