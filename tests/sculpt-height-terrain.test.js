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
