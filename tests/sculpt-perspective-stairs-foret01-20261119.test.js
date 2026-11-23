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
    assert.ok(corridor.uy<0,'all views must climb uphill');
    if(variant==='side_alt')assert.ok(corridor.ux>0,
      'new Profil A bitmap steps rise LEFT → RIGHT, not the old side corridor');
    else assert.ok(corridor.ux<0,'historical side/oblique keep original geometry');
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
    if(variant==='side_alt')assert.ok(a.dx>0&&b.dx<0,
      'Profil A mirrors its observed left-to-right ascent');
    else assert.ok(a.dx<0&&b.dx>0,
      'legacy profiles retain the original orientation');
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

// The cleaned artwork is the source of truth for the variant's step direction.
// Using a generic side corridor would move the player against visible stairs.
test('cleaned Profil A and legacy side have different ascents without changing asset IDs',()=>{
  const a=object('side_alt',{rotationDeg:0}),b=object('side',{rotationDeg:0});
  const al=sculptStairArtFrame(a),bl=sculptStairArtFrame(b);
  assert.equal(a.objectDefinitionId,b.objectDefinitionId);
  assert.equal(a.visual.variantId,'side_alt');
  assert.equal(b.visual.variantId,'side');
  assert.ok(al.dx>0&&al.dy<0,'Profil A: foot lower-left, landing upper-right');
  assert.ok(bl.dx<0&&bl.dy<0,'historical side: no silent saved-map movement rewrite');
  const flipped=sculptStairArtFrame(object('side_alt',{rotationDeg:0,flipX:true}));
  assert.ok(flipped.dx<0&&flipped.dy<0);
  assert.ok(Math.abs(al.length-flipped.length)<1e-8);
});

test('Profil A does not invent an underwater landing or a 14-level shortcut',()=>{
  const stair=object('side_alt');
  const corridor=sculptStairCorridor(terrain,stair);
  assert.ok(corridor);
  const tipX=corridor.head.x+corridor.ux*5;
  const tipY=corridor.head.y+corridor.uy*5;
  const c=Math.floor(tipX/CW),r=Math.floor(tipY/CH);
  const waterLevels=Array(W*H).fill(-1);
  waterLevels[r*W+c]=12;
  const flooded=createSculptTerrain({width:W,height:H,levels,waterLevels});
  assert.equal(sculptStairCorridor(flooded,stair),null,
    'a painted stair must never be treated as a bridge over deep water');
  const tooHigh=createSculptTerrain({width:W,height:H,
    levels:levels.map((n,i)=>Math.floor(i/W)<40?16:2)});
  assert.equal(sculptStairCorridor(tooHigh,stair),null,
    'a short model does not bypass the real terrain rise cap');
});
