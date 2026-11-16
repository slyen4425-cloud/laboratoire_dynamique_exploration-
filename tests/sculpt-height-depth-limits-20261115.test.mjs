import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SCULPT_TERRAIN_MAX_LEVEL,createSculptTerrain,
  applySculptStroke,sculptHeightAt,importSculptTerrain,serializeSculptTerrain}
  from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE,sculptCliffOcclusionRectsV1,sculptOuterSouthCliffRuns}
  from '../src/render/sculpt-height-renderer.js';
import {SCULPT_OBJECT_LIMIT} from '../src/world/sculpt-scene-preview.js';

test('plateau quickbar uses the same 16-level owner as the heightfield and survives legacy JSON',()=>{
 assert.equal(SCULPT_TERRAIN_MAX_LEVEL,16);
 const previous=createSculptTerrain({width:32,height:24,
  levels:Array(32*24).fill(7)});
 const raised=applySculptStroke(previous,{mode:'plateau',target:16,radius:2,
  points:[{x:16.5,y:16.5}],edgeSoftness:0});
 assert.equal(sculptHeightAt(raised,16,16),16);
 assert.equal(sculptHeightAt(previous,16,16),7);
 assert.equal(sculptHeightAt(importSculptTerrain(serializeSculptTerrain(raised)),16,16),16);
 const editor=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 assert.match(editor,/editorKind==='water'\?10:SCULPT_TERRAIN_MAX_LEVEL/);
 assert.match(editor,/Math\.min\(SCULPT_TERRAIN_MAX_LEVEL,Number\(level\)\)/);
 assert.match(editor,/paddingY=SCULPT_TERRAIN_MAX_LEVEL\*SCULPT_TILE\.rise\+18/);
 assert.match(html,/id="target"[^>]*max="16"/);
});
test('published 2048-object budget and both UI paths refer to the same canonical bound',()=>{
 assert.equal(SCULPT_OBJECT_LIMIT,2048);
 const editor=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(editor,/placedObjects\.length\+' \/ '\+SCULPT_OBJECT_LIMIT/);
 assert.match(editor,/Limite de '\+SCULPT_OBJECT_LIMIT\+' objets atteinte/);
 assert.doesNotMatch(editor,/Limite de 128 objets atteinte/);
});
test('native cliff faces expose only their own render rectangles for depth masking',()=>{
 const count=8*8,levels=Array(count).fill(2);
 levels[3*8+4]=6;
 const terrain=createSculptTerrain({width:8,height:8,levels});
 const original=JSON.stringify(terrain);
 const rects=sculptCliffOcclusionRectsV1(terrain);
 assert.ok(rects.some(r=>r.x===4*SCULPT_TILE.width &&
  r.y===3*SCULPT_TILE.height-6*SCULPT_TILE.rise+SCULPT_TILE.height &&
  r.width===SCULPT_TILE.width && r.height===4*SCULPT_TILE.rise),
  'the south wall occludes the lower level without extending to the upper top');
 assert.ok(rects.some(r=>r.width<=3&&r.height===4*SCULPT_TILE.rise),
  'east wall follows the same native thin seam renderer');
 const rim=sculptOuterSouthCliffRuns(terrain);
 assert.equal(rim[0].level,2);
 assert.ok(rects.some(r=>r.x===0&&r.width===8*SCULPT_TILE.width&&
  r.y===8*SCULPT_TILE.height-2*SCULPT_TILE.rise&&
  r.height===2*SCULPT_TILE.rise),'the south boundary is closed by a native rock rim');
 assert.equal(JSON.stringify(terrain),original,'mask must not modify height/water/objects');
 assert.equal(sculptCliffOcclusionRectsV1(null).length,0);
});
test('editor and play reuse ONE cached terrain image and compositing mask',()=>{
 const editor=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(editor,/sculptCliffOcclusionRectsV1\(terrain,SCULPT_TILE,\{/);
 assert.match(editor,/includeOuterSouthRim:false/);
 assert.match(editor,/maskCtx\.globalCompositeOperation='destination-in'/);
 assert.match(editor,/cached\.cliffOcclusionImage/);
 assert.equal((editor.match(/drawOuterSouthRim:false/g)||[]).length,3,
  'cached, direct and decorative-fringe terrain draws never create a fake outer cliff; internal real faces still use the official mask');
 assert.match(editor,/function visualDecorativeFringe\(\)/);
 assert.match(editor,/visualFringeCache=createSculptDecorativeFringeV1\(decorativeFringeArea\(\)\)/);
 assert.match(editor,/if\(!sculptWorldDraft\|\|!sculptWorldAreaMounted\)return null/);
 assert.match(editor,/fringeRasterCache\.clear\(\)/);
 assert.doesNotMatch(editor,/paddingY=7\*SCULPT_TILE/);
});
