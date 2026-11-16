import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptCliffEdgeFootprintBlock,sculptEastCliffProjectionBlock,
  sculptNorthCliffProjectionBlock,sculptNavigationRoute}
  from '../src/core/sculpt-navigation-collision.js';
import {isBlocked} from '../src/core/collision.js';
import {stepMovement} from '../src/core/movement.js';

const W=12,H=24,CW=28,CH=21,R=18;
const cfg=terrain=>({terrain,cellWidth:CW,cellHeight:CH,
  projectionRise:R,maxStepUp:0,maxStepDown:0});
const actor=(x,y,modes=['ground'])=>({x,y,radius:5,
  locomotion:{modes},facingX:1,moving:false});
const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};
const terrainWith=(entries)=>{const levels=Array(W*H).fill(2);
  for(const [col,row,level] of entries)levels[row*W+col]=level;
  return createSculptTerrain({width:W,height:H,levels});};
const boundary=5*CW;

test('no invisible collision on flat ground and a normal step height allowance',()=>{
 const flat=terrainWith([]),low=actor(boundary+2,5*CH+10);
 assert.equal(sculptCliffEdgeFootprintBlock(flat,low.x,low.y,{radius:5}),null);
 assert.equal(sculptEastCliffProjectionBlock(flat,low.x,low.y,{radius:5}),null);
 assert.equal(sculptNavigationRoute(cfg(flat),low,boundary-2,low.y).reason,null);
 const gentle=terrainWith([[4,5,3]]);
 const allowed={...cfg(gentle),maxStepUp:1,maxStepDown:1};
 assert.equal(sculptNavigationRoute(allowed,low,boundary-2,low.y).reason,null);
});

test('cliff side is solid for the full HERO circle before its centre enters a tall tile',()=>{
 const t=terrainWith([[4,5,8]]),initial=actor(boundary+10,5*CH+10);
 const before=serializeSculptTerrain(t);
 assert.equal(sculptNavigationRoute(cfg(t),initial,boundary+3,initial.y).reason?.kind,'cliff-edge');
 assert.equal(isBlocked(world,initial,boundary+3,initial.y,undefined,
  {sculptNavigation:cfg(t)}),true);
 stepMovement(world,initial,{x:-1,y:0},.28,{maxSpeed:28},undefined,
  {sculptNavigation:cfg(t)});
 assert.ok(initial.x>=boundary+5-1e-6,
  'actual movement cannot put hero radius into the elevated left wall');
 assert.equal(serializeSculptTerrain(t),before,'WorldDocument height cells stay untouched');
});

test('convex cliff corner blocks diagonal clip-through; outside the circular foot is free',()=>{
 const t=terrainWith([[4,5,9]]);
 const corner={x:boundary,y:6*CH};
 const before=actor(corner.x+9,corner.y+9);
 assert.equal(sculptNavigationRoute(cfg(t),before,corner.x+2,corner.y+2).reason?.kind,
  'cliff-edge');
 assert.equal(sculptNavigationRoute(cfg(t),before,corner.x+6,corner.y+6).reason,null,
  'a clear path at distance > hero radius remains walkable');
 const flying=actor(before.x,before.y,['fly']);
 assert.equal(sculptNavigationRoute(cfg(t),flying,corner.x+2,corner.y+2).reason,null);
});

test('east projected rock face blocks lateral entry BEFORE the logical height row',()=>{
 const t=terrainWith([[4,9,14]]),at=actor(boundary+12,6*CH+10);
 const opt={radius:5,projectionRise:R,cellWidth:CW,cellHeight:CH};
 const target={x:boundary+3,y:at.y};
 assert.equal(sculptCliffEdgeFootprintBlock(t,target.x,target.y,opt),null,
  'the tall rock billboard is far from the HIGH cell in the saved X/Y grid');
 assert.equal(sculptNorthCliffProjectionBlock(t,target.x,target.y,opt),null,
  'the old north-only gate misses the right edge completely');
 assert.equal(sculptEastCliffProjectionBlock(t,target.x,target.y,opt)?.kind,'cliff-projection');
 assert.equal(sculptNavigationRoute(cfg(t),at,target.x,target.y).reason?.kind,'cliff-projection');
 assert.equal(sculptNavigationRoute(cfg(t),at,boundary+8,at.y).reason,null,
  'sufficient lateral clearance leaves nearby flat ground walkable');
 const clipped=actor(boundary+3,at.y);
 assert.equal(sculptNavigationRoute(cfg(t),clipped,boundary+9,at.y).reason,null,
  'a player from an old save can retreat outward instead of getting trapped');
});

test('tall level-16 northern cliff is seen beyond the obsolete seven-level lookahead',()=>{
 const t=terrainWith([[4,20,16]]),x=(4.5)*CW,y=220;
 const opt={cellWidth:CW,cellHeight:CH,projectionRise:R,radius:5};
 assert.equal(sculptNorthCliffProjectionBlock(t,x,y,opt)?.kind,'cliff-projection');
 assert.equal(sculptNavigationRoute(cfg(t),actor(x,y),x,y+2).reason?.kind,'cliff-projection');
 assert.equal(sculptNavigationRoute(cfg(t),actor((2.5)*CW,y),(2.5)*CW,y+2).reason,null);
});

test('previously stranded body radius can retreat without a teleport, bridge/stair remain owner',()=>{
 const t=terrainWith([[4,5,8]]),clipped=actor(boundary+3,5*CH+10);
 assert.equal(sculptNavigationRoute(cfg(t),clipped,boundary+9,clipped.y).reason,null);
 assert.equal(sculptNavigationRoute(cfg(t),clipped,boundary+1,clipped.y).reason?.kind,'cliff-edge');
 const flight=actor(clipped.x,clipped.y,['fly']);
 assert.equal(sculptNavigationRoute(cfg(t),flight,boundary-6,flight.y).reason,null);
});
