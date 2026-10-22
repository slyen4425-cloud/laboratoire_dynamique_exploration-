import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptNavigationBlockDetail,isSculptNavigationBlocked} from '../src/core/sculpt-navigation-collision.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';

const width=12,height=8,cellWidth=28,cellHeight=21;
const at=(col,row)=>({x:(col+.5)*cellWidth,y:(row+.5)*cellHeight});
const player=(col=3,row=3)=>({...at(col,row),radius:5,locomotion:{modes:['ground']}});
const world=()=>({width:width*cellWidth,height:height*cellHeight,objects:[],obstacles:[]});
const config=(terrain,maxStep)=>({terrain,cellWidth,cellHeight,maxStepUp:maxStep,maxStepDown:maxStep});
const context=(terrain,maxStep)=>({sculptNavigation:config(terrain,maxStep)});
const ridge=(level)=>{
  const levels=Array(width*height).fill(2);
  for(let row=0;row<height;row++)levels[row*width+4]=level;
  return createSculptTerrain({width,height,levels});
};

test('V40 user-made two-level ridge: 1 blocks, 2 permits through authoritative swept collision',()=>{
  const terrain=ridge(4),before=serializeSculptTerrain(terrain);
  const p=player(),target=at(5,3);
  assert.deepEqual(sculptNavigationBlockDetail(config(terrain,1),p,target.x,target.y),{
    kind:'height-up',col:4,row:3,from:2,to:4,delta:2,limit:1
  });
  assert.equal(isBlocked(world(),p,target.x,target.y,undefined,context(terrain,1)),true);
  assert.equal(isBlocked(world(),p,target.x,target.y,undefined,context(terrain,2)),false);
  assert.equal(isSculptNavigationBlocked(config(terrain,2),p,target.x,target.y),false);
  stepMovement(world(),p,{x:1,y:0},.75,{maxSpeed:56},undefined,context(terrain,2));
  assert.ok(p.x>4*cellWidth,'walking must reach a visually softened two-level rise');
  assert.equal(serializeSculptTerrain(terrain),before,'walking never edits the authored heightmap');
});

test('V40 descending steps use the same user-selected limit, without a one-way trap',()=>{
  const terrain=ridge(4);
  const p=player(4,3),target=at(5,3);
  assert.deepEqual(sculptNavigationBlockDetail(config(terrain,1),p,target.x,target.y),{
    kind:'height-down',col:5,row:3,from:4,to:2,delta:2,limit:1
  });
  assert.equal(isSculptNavigationBlocked(config(terrain,2),p,target.x,target.y),false);
});

test('V40 full cliffs remain blocked even in most permissive setting, never tunnel',()=>{
  const terrain=ridge(7),p=player(),target=at(6,3);
  const detail=sculptNavigationBlockDetail(config(terrain,3),p,target.x,target.y);
  assert.equal(detail?.kind,'height-up');
  assert.equal(detail.delta,5);
  assert.equal(detail.limit,3);
  stepMovement(world(),p,{x:1,y:0},1.5,{maxSpeed:56},undefined,context(terrain,3));
  assert.ok(p.x<4*cellWidth,'full-height cliffs must still stop walking');
});

test('V40 deep water and map bounds preserve their original authority',()=>{
  const terrain=ridge(2),water=[...terrain.waterLevels];
  water[3*width+4]=6;
  const wet=createSculptTerrain({width,height,levels:terrain.levels,waterLevels:water});
  const p=player(),target=at(4,3);
  assert.equal(sculptNavigationBlockDetail(config(wet,3),p,target.x,target.y)?.kind,'water');
  assert.equal(isBlocked(world(),p,target.x,target.y,undefined,context(wet,3)),true);
  assert.equal(sculptNavigationBlockDetail(config(wet,3),p,-10,p.y)?.kind,'bounds');
  assert.equal(isBlocked(world(),p,-10,p.y,undefined,context(wet,3)),true);
  assert.equal(isBlocked(world(),p,at(4,3).x,at(4,3).y),false,
    'without opt-in context the ordinary Exploration 2D runtime stays independent');
});

test('V40 gameplay HUD uses one setting and non-conflicting editor/camera authority',()=>{
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.equal((html.match(/id="navigation-max-step"/g)||[]).length,1);
  assert.match(js,/maxStepUp:maxStep,maxStepDown:maxStep/);
  assert.match(js,/sculptNavigationBlockDetail\(context\.sculptNavigation/);
  assert.match(js,/navigationTesting\s*\?sculptCameraGameView/);
  // V75 supersedes V40's intentionally permissive TESTER slider. The
  // low-level Collision World still owns all height checks; the live game
  // must now use the declared zero-step default until ramps are authored.
  assert.match(js,/return SCULPT_NAVIGATION_PROBE_DEFAULTS\.maxStepUp/);
  assert.match(html,/min="0" max="0" step="1" value="0" disabled/);
});
