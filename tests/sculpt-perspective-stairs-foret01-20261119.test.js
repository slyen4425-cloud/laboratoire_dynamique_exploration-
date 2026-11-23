import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptStairArtFrame,sculptStairCorridor} from '../src/core/sculpt-stair-traversal.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {stepMovement} from '../src/core/movement.js';

const W=80,H=60,CW=28,CH=21;
const stairsId='objectdef.stairs.earth_log_path_2p5d.01';
// Exact scale/angle/position of the user's Foret_01 stair, on a deterministic
// two-level cliff (2->8). No copy of the user's map or actor saves is stored.
const STAIR={x:599.1264828767432,y:902.0944862087385,
  scaleX:.7,scaleY:.85,rotationDeg:350};
const levels=Array.from({length:W*H},(_,i)=>Math.floor(i/W)<40?8:2);
const terrain=createSculptTerrain({width:W,height:H,levels});
const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};
function object(variant,patch={}){
  return resolveWorldObjectPlacements(appendSculptPreviewObject([],{
    definitionId:stairsId,...STAIR,...patch,variantId:variant
  }))[0];
}
function actor(x,y){return {x,y,radius:5,locomotion:{modes:['ground']}};}
function context(stair){return {sculptNavigation:{terrain,
  stairs:[stair],bridges:[],projectionRise:18,cellWidth:CW,cellHeight:CH,
  maxStepUp:0,maxStepDown:0}};}

test('Foret_01 perspectives incl. cleaned side_alt have physical foot/head matching authored art',()=>{
  for(const variant of ['oblique','side','side_alt']){
    const stair=object(variant);
    const art=sculptStairArtFrame(stair);
    const corridor=sculptStairCorridor(terrain,stair);
    assert.ok(art,variant+' artwork has a canonical foot/head');
    assert.ok(corridor,variant+' must be traversable at the authored 85%');
    assert.equal(corridor.bottomLevel,2);
    assert.equal(corridor.topLevel,8);
    assert.ok(Math.abs(corridor.head.x-STAIR.x-art.dx)<1e-5);
    assert.ok(Math.abs(corridor.head.y-STAIR.y-art.dy)<1e-5);
    assert.ok(corridor.ux<0&&corridor.uy<0,'both variants climb towards image upper-left');
    assert.ok(corridor.length>100&&corridor.width>20);
  }
  // Already-validated front contract must not be silently relaxed.
  assert.equal(sculptStairArtFrame(object('front')),null);
});

test('perspective views keep artwork proportions instead of stretching image by 6*18 on corridor activation',()=>{
  for(const variant of ['oblique','side','side_alt']){
    const stair=object(variant),rect=sculptObjectVisualRect(stair,terrain);
    assert.equal(rect.width,210*STAIR.scaleX);
    assert.equal(rect.height,190*STAIR.scaleY);
    assert.equal(rect.stairArtVariant,variant);
    assert.ok(Number.isFinite(rect.stairArtFootOffsetX));
    assert.ok(Number.isFinite(rect.stairArtFootOffsetY));
  }
  assert.equal(sculptObjectVisualRect(object('front'),terrain).stairArtVariant,undefined);
});

test('mirror + rotation affect side, side_alt and oblique direction; front stays historical',()=>{
  for(const variant of ['oblique','side','side_alt']){
    const plain=object(variant,{rotationDeg:0});
    const mirrored=object(variant,{rotationDeg:0,flipX:true});
    const a=sculptStairArtFrame(plain),b=sculptStairArtFrame(mirrored);
    assert.ok(a.dx<0&&b.dx>0);
    assert.ok(Math.abs(a.dy-b.dy)<1e-8);
    assert.ok(Math.abs(a.length-b.length)<1e-8);
  }
  const front=sculptStairCorridor(terrain,object('front'));
  // Its long-standing V78 footprint can be unbridgeable at 85%.
  assert.equal(front,null);
});

test('the user can climb and descend all perspective stairs without disabling nearby cliffs',()=>{
  for(const variant of ['oblique','side','side_alt']){
    const stair=object(variant),corridor=sculptStairCorridor(terrain,stair);
    const ctx=context(stair);
    const player=actor(corridor.foot.x-corridor.ux*9,
      corridor.foot.y-corridor.uy*9);
    for(let i=0;i<68;i++){
      stepMovement(world,player,{x:corridor.ux,y:corridor.uy},.04,
        {maxSpeed:95},undefined,ctx);
    }
    assert.ok(player.y<corridor.head.y+6,
      variant+' hero must reach the upper platform; y='+player.y);
    assert.equal(player.sculptStairId,null);
    for(let i=0;i<68;i++){
      stepMovement(world,player,{x:-corridor.ux,y:-corridor.uy},.04,
        {maxSpeed:95},undefined,ctx);
    }
    assert.ok(player.y>corridor.foot.y-10,variant+' hero must descend');
    assert.equal(player.sculptStairId,null);
  }
});
