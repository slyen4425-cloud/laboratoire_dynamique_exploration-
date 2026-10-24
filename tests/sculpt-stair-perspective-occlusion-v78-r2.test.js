import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';
import {sculptCameraGameView,sculptCameraProject} from '../src/render/sculpt-camera-projection.js';
import {sculptObjectVisualRect} from '../src/render/sculpt-object-picking.js';
import {sculptStairCorridor} from '../src/core/sculpt-stair-traversal.js';

const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const W=18,H=22;
const levels=Array.from({length:W*H},(_,i)=>Math.floor(i/W)<8?5:2);
const terrain=createSculptTerrain({width:W,height:H,levels});
const stair=resolveWorldObjectPlacements(appendSculptPreviewObject([],{
  definitionId:'objectdef.stairs.stone_rustic_2p5d.01',
  x:8.5*28,y:12.5*21,scaleX:.4,scaleY:1,variantId:'front'
}))[0];

test('V78 R2 the climbing hero is painted AFTER the stair and the active stair is excluded from both depth passes',()=>{
  const beginning=main.indexOf('const activeStair=navActor?.sculptStairId?');
  assert.ok(beginning>0,'active stair is resolved from official movement carrier');
  const behind=main.indexOf('if(activeStair)drawPreviewObject(activeStair);',beginning);
  const actor=main.indexOf('drawNavigationActor();',beginning);
  const front=main.indexOf('drawPreviewObjects(Infinity,navActor?.y??Infinity,layeredBridge?.id,activeStair?.id)',beginning);
  assert.ok(behind>beginning&&actor>behind&&front>actor,
    'active stair must be drawn only before actor, not over the avatar');
  const before=main.slice(beginning,behind);
  assert.match(before,/drawPreviewObjects\(navActor\?\.y\?\?Infinity,-Infinity,layeredBridge\?\.id,activeStair\?\.id\)/);
  assert.match(main,/o\.id!==skipBridgeId&&o\.id!==skipStairId/);
  assert.match(main,/if\(deckBridge\)drawPreviewObject\(deckBridge,\{foregroundRailOnly:true\}\)/,
    'the independent bridge near-rail pass is preserved');
});

test('V78 R2 stairs use the SAME affine camera matrix as the terrain in Tester, not a fixed-size billboard',()=>{
  assert.match(main,/if\(navigationTesting&&object\.kind==='stairs'\)\{\s*const view=cameraView\(\);\s*ctx\.transform\(1,view\.shear,0,view\.pitch,0,0\);/);
  assert.match(main,/ctx\.translate\(point\.x,point\.y\);/);
  assert.match(main,/ctx\.rotate\(rect\.angle\);/);
  assert.match(html,/stairs-dynamic-v78-stairs-depth-perspective-r2/);
  assert.ok(sculptStairCorridor(terrain,stair));
  const before=serializeSculptTerrain(terrain);
  const rect=sculptObjectVisualRect(stair,terrain,{rise:18});
  const heights=[];
  for(const angle of [90,55,35]){
    const view=sculptCameraGameView(angle);
    const bottom=sculptCameraProject(view,rect.x,rect.y);
    const top=sculptCameraProject(view,rect.x,rect.y-rect.height);
    const h=bottom.y-top.y;
    assert.ok(Math.abs(h-rect.height*view.pitch)<1e-6);
    heights.push(h);
  }
  assert.ok(heights[0]>heights[1]&&heights[1]>heights[2],
    'at 35° stair projection must become shorter than at 55° and 90°');
  assert.ok(Math.abs(heights[2]/heights[0]-Math.sin(35*Math.PI/180))<1e-6);
  assert.equal(serializeSculptTerrain(terrain),before,'presentation does not affect terrain');
});
