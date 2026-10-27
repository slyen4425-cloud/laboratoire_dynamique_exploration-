import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {isSculptNavigationBlocked} from '../src/core/sculpt-navigation-collision.js';
import {sculptPreviewCollisionCatalog} from '../src/core/sculpt-preview-object-collisions.js';
import {objectDefinitionCatalogV1} from '../src/objects/object-definition-catalog.js';
import {appendSculptPreviewObject} from '../src/world/sculpt-scene-preview.js';
import {isBlocked} from '../src/core/collision.js';
import {worldObjectObstacleRect} from '../src/world/world-object-model.js';
import {resolveWorldObjectPlacements} from '../src/world/world-object-placement-model.js';

const base=(terrain,objects=[])=>({width:terrain.width*28,height:terrain.height*21,objects,obstacles:[]});
const actor=(x,y,modes=['ground'])=>({x,y,radius:5,locomotion:{modes}});
const context=terrain=>({sculptNavigation:{terrain,cellWidth:28,cellHeight:21,
  maxStepUp:1,maxStepDown:1,shoreEntryFraction:.14},
  objectCatalog:sculptPreviewCollisionCatalog});
test('V22 shore: ground may wade only 14% of a wet cell, swimmer crosses',()=>{
  const width=10,height=8,levels=Array(width*height).fill(2),waterLevels=Array(width*height).fill(-1);
  for(let c=4;c<=7;c++)waterLevels[3*width+c]=5;
  const terrain=createSculptTerrain({width,height,levels,waterLevels});
  const who=actor(3.5*28,3.5*21),cfg=context(terrain).sculptNavigation;
  assert.equal(isSculptNavigationBlocked(cfg,who,4*28+2,who.y),false);
  assert.equal(isSculptNavigationBlocked(cfg,who,4*28+10,who.y),true);
  assert.equal(isSculptNavigationBlocked(cfg,who,6*28,who.y),true);
  const swimmer=actor(who.x,who.y,['ground','swim']);
  assert.equal(isSculptNavigationBlocked(cfg,swimmer,6*28,who.y),false);
  assert.equal(isSculptNavigationBlocked({...cfg,shoreEntryFraction:0},who,4*28+2,who.y),true,
    'V17 default remains strict when opt-in margin absent');
});
test('V22 rock edge contact is narrower than canonical but blocks the center',()=>{
  const terrain=createSculptTerrain({width:24,height:16});
  const objects=appendSculptPreviewObject([],{definitionId:'objectdef.rock.forest.boulder.01',
    x:280,y:160,scale:.6});
  const w=base(terrain,objects),contact=context(terrain);
  const canon=resolveWorldObjectPlacements(objects,objectDefinitionCatalogV1)[0];
  const preview=resolveWorldObjectPlacements(objects,sculptPreviewCollisionCatalog)[0];
  const oldRect=worldObjectObstacleRect(canon),newRect=worldObjectObstacleRect(preview);
  assert.ok(newRect.length<oldRect.length&&newRect.width<oldRect.width);
  assert.equal(isBlocked(w,actor(200,160),280,160,undefined,contact),true);
  const edgeX=280+newRect.length/2+6;
  assert.equal(isBlocked(w,actor(200,160),edgeX,160,undefined,contact),false);
  assert.equal(isBlocked(w,actor(200,160),edgeX,160),true,
    'Builder default continues to use existing canonical object profile');
});
test('V22 trees and houses block foot region, not the empty area behind the silhouette',()=>{
  const terrain=createSculptTerrain({width:24,height:16});
  for(const def of ['objectdef.tree.forest.oak.01','objectdef.building.house.blue_cottage.01']){
    const objects=appendSculptPreviewObject([],{definitionId:def,x:280,y:180,scale:.55});
    const w=base(terrain,objects),contact=context(terrain);
    const rect=worldObjectObstacleRect(resolveWorldObjectPlacements(objects,sculptPreviewCollisionCatalog)[0]);
    assert.ok(rect.y<180,'contact is positioned just above its visual foot');
    assert.ok(rect.width < 65,'contact is less deep than full building/tree sprite');
    assert.equal(isBlocked(w,actor(200,150),280,rect.y,undefined,contact),true);
    assert.equal(isBlocked(w,actor(200,150),280,rect.y-rect.width/2-7,undefined,contact),false);
  }
});
