import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptStairArtFrame,sculptStairCorridor} from '../src/core/sculpt-stair-traversal.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {stepMovement} from '../src/core/movement.js';

const W=80,H=60,CW=28,CH=21;
const id='objectdef.stairs.earth_log_path_2p5d.01';
const pos={x:599.1264828767432,y:902.0944862087385,scaleX:.7,scaleY:.85,rotationDeg:350};
const levels=Array.from({length:W*H},(_,i)=>Math.floor(i/W)<40?8:2);
const terrain=createSculptTerrain({width:W,height:H,levels});
const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};
const build=(variant,patch={})=>resolveWorldObjectPlacements(appendSculptPreviewObject([],{
  definitionId:id,...pos,...patch,variantId:variant
}))[0];
const actor=(x,y)=>({x,y,radius:5,locomotion:{modes:['ground']}});
const context=(stair,scene=terrain)=>({sculptNavigation:{
  terrain:scene,stairs:[stair],bridges:[],projectionRise:18,
  cellWidth:CW,cellHeight:CH,maxStepUp:0,maxStepDown:0
}});

test('cleaned Profil A side_alt owns a real foot/upper-landing geometry aligned with its bitmap',()=>{
  const stair=build('side_alt'),art=sculptStairArtFrame(stair);
  assert.equal(stair.visual.variantId,'side_alt');
  assert.ok(art,'new native variant must have its own visual + physical frame');
  assert.ok(art.dx>0&&art.dy<0,'the bitmap climbs from lower-left to upper-right');
  const corridor=sculptStairCorridor(terrain,stair);
  assert.ok(corridor,'a real 2->8 cliff is traversable at the original 85% stair scale');
  assert.equal(corridor.bottomLevel,2);
  assert.equal(corridor.topLevel,8);
  assert.ok(corridor.ux>0&&corridor.uy<0);
  assert.ok(Math.abs(corridor.head.x-pos.x-art.dx)<1e-5);
  assert.ok(Math.abs(corridor.head.y-pos.y-art.dy)<1e-5);
  const rect=sculptObjectVisualRect(stair,terrain);
  assert.equal(rect.stairArtVariant,'side_alt');
  assert.ok(Number.isFinite(rect.stairArtFootOffsetX));
  assert.ok(Number.isFinite(rect.stairArtFootOffsetY));
  // In the same family, historical side / oblique profiles must not change.
  const oldSide=sculptStairArtFrame(build('side'));
  assert.ok(oldSide.dx<0&&oldSide.dy<0);
});

test('Profil A mirrors horizontally and honors scene rotation without changing asset ID',()=>{
  const stair=build('side_alt',{rotationDeg:0});
  const mirrored=build('side_alt',{rotationDeg:0,flipX:true});
  const a=sculptStairArtFrame(stair),b=sculptStairArtFrame(mirrored);
  assert.ok(a.dx>0&&b.dx<0);
  assert.ok(a.dy<0&&b.dy<0);
  assert.ok(Math.abs(a.length-b.length)<1e-8);
  assert.equal(stair.objectDefinitionId,mirrored.objectDefinitionId);
  assert.equal(stair.visual.assetId,mirrored.visual.assetId);
});

test('native movement climbs and descends cleaned Profil A using Collision World only',()=>{
  const stair=build('side_alt'),corridor=sculptStairCorridor(terrain,stair);
  assert.ok(corridor);
  const player=actor(corridor.foot.x-corridor.ux*9,corridor.foot.y-corridor.uy*9);
  for(let i=0;i<68;i++)stepMovement(world,player,
    {x:corridor.ux,y:corridor.uy},.04,{maxSpeed:95},undefined,context(stair));
  assert.ok(player.y<corridor.head.y+6,'hero must reach the upper plateau: '+player.y);
  assert.equal(player.sculptStairId,null);
  for(let i=0;i<68;i++)stepMovement(world,player,
    {x:-corridor.ux,y:-corridor.uy},.04,{maxSpeed:95},undefined,context(stair));
  assert.ok(player.y>corridor.foot.y-10,'hero must descend: '+player.y);
  assert.equal(player.sculptStairId,null);
});

test('no imaginary passage when the landing is underwater or too high',()=>{
  const stair=build('side_alt'),corridor=sculptStairCorridor(terrain,stair);
  assert.ok(corridor);
  const c=Math.floor((corridor.head.x+corridor.ux*5)/CW);
  const row=Math.floor((corridor.head.y+corridor.uy*5)/CH);
  const waterLevels=Array(W*H).fill(-1);
  waterLevels[row*W+c]=10;
  const flooded=createSculptTerrain({width:W,height:H,levels,waterLevels});
  assert.equal(sculptStairCorridor(flooded,stair),null,
    'water at the landing cannot be used as a solid upper platform');
  const higher=levels.map((v,i)=>Math.floor(i/W)<40?16:2);
  const tooHigh=createSculptTerrain({width:W,height:H,levels:higher});
  assert.equal(sculptStairCorridor(tooHigh,stair),null,
    'artwork must not silently bridge a fourteen-level cliff');
});
