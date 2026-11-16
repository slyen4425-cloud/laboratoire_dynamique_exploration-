import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,sculptFaces} from '../src/world/sculpt-height-model.js';
import {sculptObjectInFrontOfCliffV1} from '../src/render/sculpt-cliff-object-depth-v1.js';

const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const begin=main.indexOf('const nearObjects=sculptPlayObjectDrawCache.get(');
const foreground=main.slice(begin,main.indexOf('  drawEditorPlayableLimit();',begin));
test('Tester redraws a cliff-front hero without requiring any nearby WorldObject',()=>{
 assert.ok(begin>0);
 assert.match(foreground,/\}else\{[\s\S]*?if\(navActor\)\{\s*const footLevel=navVisualLevel\?\?navHeight\(\)/);
 assert.doesNotMatch(foreground,/else if\(nearObjects\.length\)|if\(navActor&&nearObjects\.some/);
 assert.match(foreground,/const cliffPlan=sculptActorCliffDepthPlanV2\(terrain,[\s\S]*?faces:cached\.depthFaces\}\);[\s\S]*?if\(cliffPlan\.redraw\)\{[\s\S]*?drawNavigationActor\(\)/);
 assert.match(foreground,/if\(cliffPlan\.frontRects\.length\)[\s\S]*?ctx\.clip\(\)/);
 assert.equal((foreground.match(/drawNavigationActor\(\)/g)||[]).length,1);
});
test('foot-depth remains correct for a hero in front / behind a cliff',()=>{
 const levels=Array(64).fill(2);levels[2*8+3]=6;
 const terrain=createSculptTerrain({width:8,height:8,levels}),faces=sculptFaces(terrain);
 const actor=(y)=>({x:98,y:y-36,width:44,height:90});
 const foot=(y)=>({x:98,y});
 assert.equal(sculptObjectInFrontOfCliffV1(terrain,actor(94.5),foot(94.5),{faces}),true);
 assert.equal(sculptObjectInFrontOfCliffV1(terrain,actor(36.75),foot(36.75),{faces}),false);
 assert.equal(sculptObjectInFrontOfCliffV1(terrain,actor(94.5),foot(94.5),{faces:[]}),false);
});
