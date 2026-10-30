import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,applySculptWaterStroke,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptNavigationSample,isSculptNavigationBlocked} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';
import {readFileSync} from 'node:fs';

const T={cellWidth:28,cellHeight:21,maxStepUp:1,maxStepDown:1};
const point=(c,r)=>({x:(c+.5)*28,y:(r+.5)*21});
const actor=(c=3,r=3,modes=['ground'])=>({...point(c,r),radius:5,
  locomotion:{modes},facingX:1});
const world=(terrain)=>({width:terrain.width*28,height:terrain.height*21,
  objects:[],obstacles:[]});
const context=terrain=>({sculptNavigation:{terrain,...T}});
const move=(terrain,entity,input,dt=.5)=>
  stepMovement(world(terrain),entity,input,dt,{maxSpeed:56},undefined,context(terrain));
function makeRidge({height=6,col=4,width=10,rows=8}={}){
  const levels=Array(width*rows).fill(2);
  for(let r=0;r<rows;r++)levels[r*width+col]=height;
  return createSculptTerrain({width,height:rows,levels});
}
test('V17 movement core can walk on flat sculpt terrain, diagonal speed normalized',()=>{
  const terrain=createSculptTerrain({width:10,height:8});
  const player=actor();const before={...player};
  move(terrain,player,{x:1,y:0},.4);
  assert.ok(player.x>before.x);
  assert.equal(player.y,before.y);
  const diag=actor();move(terrain,diag,{x:1,y:1},.4);
  assert.ok(Math.abs(Math.hypot(diag.x-before.x,diag.y-before.y)-
    (player.x-before.x))<1e-6,'diagonal speed must match cardinal');
});
test('V17 steep cliff blocks both upward and downward pedestrian movement',()=>{
  const terrain=makeRidge();
  const approaching=actor(3,3);
  assert.equal(isBlocked(world(terrain),approaching,...Object.values(point(4,3)),
    undefined,context(terrain)),true);
  move(terrain,approaching,{x:1,y:0},.8);
  assert.ok(approaching.x<4*28);
  const descending=actor(4,3);
  move(terrain,descending,{x:1,y:0},.8);
  assert.ok(descending.x<5*28);
  assert.equal(sculptNavigationSample(terrain,descending.x,descending.y,T).level,6);
});
test('V17 diagonal movement slides on the obstacle instead of crossing cliff',()=>{
  const terrain=makeRidge();
  const start=actor(3,3);
  move(terrain,start,{x:1,y:1},.8);
  assert.ok(start.x<4*28);
  assert.ok(start.y>point(3,3).y,'unblocked Y axis must still be usable');
});
test('V17 surface water prevents walking but swim and fly modes may enter',()=>{
  const original=createSculptTerrain({width:10,height:8});
  const terrain=applySculptWaterStroke(original,{mode:'water-fill',target:5,
    radius:.5,points:[{x:4.5,y:3.5}]});
  const before=serializeSculptTerrain(terrain);
  const walking=actor();move(terrain,walking,{x:1,y:0},.8);
  assert.ok(walking.x<4*28,'ground locomotion cannot enter wet cell');
  const swimming=actor(3,3,['ground','swim']);move(terrain,swimming,{x:1,y:0},.8);
  assert.ok(swimming.x>4*28,'swim mode is allowed in water');
  const flying=actor(3,3,['fly']);move(terrain,flying,{x:1,y:0},.8);
  assert.ok(flying.x>4*28,'flight bypasses water');
  assert.equal(before,serializeSculptTerrain(terrain),'navigation never sculpts water');
});
test('V17 flying can cross steep slopes, but cannot escape area boundary',()=>{
  const terrain=makeRidge();
  const flyer=actor(3,3,['fly']);move(terrain,flyer,{x:1,y:0},.8);
  assert.ok(flyer.x>4*28);
  const edge=actor(9,3,['fly']);move(terrain,edge,{x:1,y:0},.8);
  assert.ok(edge.x<=world(terrain).width-edge.radius+1e-6);
});
test('V17 movement always checks swept path, no tunneling through a narrow cliff',()=>{
  const ridge=makeRidge({col:4,height:6,width:12});
  const player=actor(2,3);
  assert.equal(isSculptNavigationBlocked({terrain:ridge,...T},player,...Object.values(point(6,3))),true);
  move(ridge,player,{x:1,y:0},1.9);
  assert.ok(player.x<4*28,'target beyond narrow ridge must not bypass it');
});
test('V17 opt-in only: ordinary 2D collision is unchanged without navigation context',()=>{
  const ridge=makeRidge();
  const player=actor(3,3);
  assert.equal(isBlocked(world(ridge),player,point(4,3).x,point(4,3).y),
    false,'2D runtime ignores sculpt-only heightfield unless explicitly supplied');
});
test('V17 preview uses existing movement/input/map actor assets; edit map remains isolated',()=>{
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const page=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(main,/stepMovement\(/);
  assert.match(main,/createVirtualStick/);
  assert.match(main,/resolveMapActorAsset/);
  assert.match(main,/cancelAnimationFrame\(navFrame\)/);
  assert.match(main,/navStick\?\.dispose\(\)/);
  for(const id of ['navigation-toggle','navigation-hud','navigation-stick',
    'navigation-locomotion','navigation-status','navigation-reset']){
    assert.equal((page.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
  }
  for(const p of ['index.html','builder.html'])
    assert.doesNotMatch(readFileSync(new URL('../'+p,import.meta.url),'utf8'),
      /sculpt-navigation-v17/);
});
