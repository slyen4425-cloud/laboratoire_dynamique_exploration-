import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,sculptHeightAt} from '../src/world/sculpt-height-model.js';
import {sculptNavigationSample,sculptNavigationRoute,sculptNavigationBlockDetail,sculptNorthCliffProjectionBlock,
  SCULPT_NAVIGATION_PROBE_DEFAULTS} from '../src/core/sculpt-navigation-collision.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {bridgeTraversalRect} from '../src/world/world-object-model.js';
import {orientedWorldPoint} from '../src/core/geometry.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';

const W=12,H=12,CW=28,CH=21;
const at=(x,y)=>({x:(x+.5)*CW,y:(y+.5)*CH});
const player=(x,y,modes=['ground'])=>({...at(x,y),radius:5,
  locomotion:{modes},facingX:1,moving:false});
const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};
const cfg=terrain=>({terrain,cellWidth:CW,cellHeight:CH,
  maxStepUp:SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepUp,
  maxStepDown:SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepDown});
const map=top=>createSculptTerrain({width:W,height:H,
  levels:Array.from({length:W*H},(_,i)=>{
    const x=i%W,y=Math.floor(i/W);
    return x>=4&&x<=7&&y>=4&&y<=7?top:2;
  })});
const neighbors=[[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
const fromEdge=(dx,dy)=>{
  const hx=dx<0?4:dx>0?7:5,hy=dy<0?4:dy>0?7:5;
  return {high:[hx,hy],low:[hx+dx,hy+dy]};
};

test('V75 all abrupt changes (even ONE level) are denied from upper and lower sides in 8 directions',()=>{
  assert.equal(SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepUp,0);
  assert.equal(SCULPT_NAVIGATION_PROBE_DEFAULTS.maxStepDown,0);
  for(let top=3;top<=7;top++){
    const t=map(top),conf=cfg(t);
    for(const [dx,dy] of neighbors){
      const {high,low}=fromEdge(dx,dy);
      for(const [source,dest,kind] of [
        [low,high,'height-up'],[high,low,'height-down']
      ]){
        const a=player(...source),to=at(...dest);
        const reason=sculptNavigationBlockDetail(conf,a,to.x,to.y);
        assert.equal(reason?.kind,kind,`top=${top}, ${dx}/${dy}, ${kind}`);
        assert.equal(reason?.limit,0);
        assert.equal(reason?.delta,top-2);
        assert.equal(isBlocked(world,a,to.x,to.y,undefined,{sculptNavigation:conf}),true);
        const dist=Math.hypot(to.x-a.x,to.y-a.y);
        stepMovement(world,a,{x:to.x-a.x,y:to.y-a.y},1,
          {maxSpeed:dist},undefined,{sculptNavigation:conf});
        assert.equal(sculptNavigationSample(t,a.x,a.y,conf).level,
          kind==='height-up'?2:top,
          'real stepMovement cannot slide/diagonal-tunnel through sheer height');
      }
    }
  }
});
test('V75 flat terrain remains traversable, flight bypasses cliffs, legacy 2D stays independent',()=>{
  const raised=map(4),conf=cfg(raised),start=player(3,5),target=at(4,5);
  const flat=createSculptTerrain({width:W,height:H,levels:Array(W*H).fill(2)});
  const mover=player(3,5);
  assert.equal(sculptNavigationRoute(cfg(flat),mover,target.x,target.y).reason,null);
  stepMovement(world,mover,{x:1,y:0},1,{maxSpeed:CW},undefined,
    {sculptNavigation:cfg(flat)});
  assert.ok(mover.x>=target.x-1e-6);
  const flyer=player(3,5,['fly']);
  assert.equal(sculptNavigationRoute(conf,flyer,target.x,target.y).reason,null);
  stepMovement(world,flyer,{x:1,y:0},1,{maxSpeed:CW},undefined,
    {sculptNavigation:conf});
  assert.ok(flyer.x>=target.x-1e-6);
  assert.equal(isBlocked(world,start,target.x,target.y),false,
    'classic 2D gameplay has no Sculpt context and stays frozen');
  assert.equal(sculptHeightAt(raised,4,5),4,
    'no deformation or heightmap rewrite by collision');
});
test('V75 bridge carried deck crossing remains possible at zero terrestrial cliff permission',()=>{
  const levels=Array.from({length:40*40},(_,i)=>{
    const col=i%40;return col>=15&&col<=24?0:6;
  });
  const terrain=createSculptTerrain({width:40,height:40,levels});
  const placements=appendSculptPreviewObject([],{definitionId:'objectdef.bridge.wood_rustic_2p5d.01',
    variantId:'horizontal',x:560,y:420,scale:2.5});
  const bridge=resolveWorldObjectPlacements(placements)[0];
  const deck=bridgeTraversalRect(bridge);
  const from=orientedWorldPoint(-deck.length*.36,0,deck);
  const to=orientedWorldPoint(deck.length*.36,0,deck);
  const carrying={x:from.x,y:from.y,radius:5,locomotion:{modes:['ground']},
    sculptBridgeId:bridge.id};
  const conf={...cfg(terrain),bridges:[bridge]};
  const route=sculptNavigationRoute(conf,carrying,to.x,to.y);
  assert.equal(route.reason,null);
  assert.equal(route.bridgeId,bridge.id);
  const under={x:deck.x,y:deck.y,radius:5,locomotion:{modes:['ground']},
    sculptBridgeId:null};
  const sideways=orientedWorldPoint(0,deck.width,deck);
  assert.equal(sculptNavigationRoute(conf,under,sideways.x,sideways.y).bridgeId,null,
    'cannot mount a bridge from below through the side');
});
test('V75 Tester cannot re-enable cliff climbing via a permissive slider or camera',()=>{
  const src=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(src,/return SCULPT_NAVIGATION_PROBE_DEFAULTS\.maxStepUp/);
  assert.match(src,/maxStepUp:maxStep,maxStepDown:maxStep/);
  assert.match(src,/falaise infranchissable/);
  assert.match(html,/id="navigation-max-step"[^\n]*min="0" max="0"[^\n]*value="0" disabled/);
  assert.match(html,/Falaises : franchissement libre interdit/);
  // Another approved lot published Waterfalls V3 concurrently. Preserve its
  // module revision AND this cliff-lock revision in the same entrypoint.
  assert.match(html,/waterfalls-v3-cliff-lock-v75/);
  assert.doesNotMatch(src,/navActor\.y\s*[-+]=\s*sculpt/);
});

// Reproduces the Pixel report: the visual top of a north-facing cliff is
// projected ABOVE its canonical cell boundary. Both steps here are on the
// exact same lower cell; V75's eight-direction test did not detect this.
test('V75 R2: north approach stops before the projected cliff cap, in the REAL movement path',()=>{
  const levels=Array.from({length:W*H},(_,i)=>{
    const x=i%W,y=Math.floor(i/W);
    return x>=4&&x<=7&&y>=8&&y<=10?6:2;
  });
  const terrain=createSculptTerrain({width:W,height:H,levels});
  const config={...cfg(terrain),projectionRise:18},x=at(5,4).x;
  const northEdge=8*CH,visibleEdge=northEdge-(6-2)*18;
  const actor={...player(5,4),x,y:visibleEdge-10};
  const targetY=visibleEdge+8;
  assert.equal(sculptNavigationSample(terrain,x,actor.y,config).level,2);
  assert.equal(sculptNavigationSample(terrain,x,targetY,config).level,2,
    'regression must take place entirely BEFORE the logical cliff cell');
  assert.equal(sculptNorthCliffProjectionBlock(terrain,x,actor.y,{radius:5}),null);
  assert.equal(sculptNorthCliffProjectionBlock(terrain,x,targetY,{radius:5})?.kind,'cliff-projection');
  assert.equal(isBlocked(world,actor,x,targetY,undefined,{sculptNavigation:config}),true);
  const originalY=actor.y;
  stepMovement(world,actor,{x:0,y:1},1,{maxSpeed:targetY-originalY},undefined,
    {sculptNavigation:config});
  assert.equal(actor.y,originalY,'the REAL player must not walk into raised plateau artwork');
  const offEdge={...player(2,4),y:originalY};
  assert.equal(sculptNavigationRoute(config,offEdge,offEdge.x,targetY).reason,null,
    'same-distance flat travel away from the cliff stays available');
  const airborne={...actor,locomotion:{modes:['fly']}};
  assert.equal(sculptNavigationRoute(config,airborne,airborne.x,targetY).reason,null,
    'flight stays exempt');
  const trapped={...actor,y:targetY};
  assert.equal(sculptNavigationRoute(config,trapped,trapped.x,originalY).reason,null,
    'older saved positions can still retreat north to safety');
});
