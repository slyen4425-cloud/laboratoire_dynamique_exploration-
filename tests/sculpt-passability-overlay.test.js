import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptPassabilityCells} from '../src/core/sculpt-passability-diagnostics.js';

const area=(terrain,other={})=>({
  world:{width:terrain.width*28,height:terrain.height*21,
    objects:[],obstacles:[],walls:[],...other},
  terrain,
  collisionContext:{sculptNavigation:{terrain,cellWidth:28,cellHeight:21,
    projectionRise:18,maxStepUp:0,maxStepDown:0,shoreEntryFraction:.14,
    bridges:[],stairs:[]}},
  tileWidth:28,tileHeight:21,radius:5
});
const cell=(cells,x,y)=>cells.find(c=>c.col===x&&c.row===y);

test('read-only passability sample reuses same collision world for object, wall and map bounds',()=>{
 const t=createSculptTerrain({width:4,height:4});
 const source=area(t,{obstacles:[{x:28,y:21,w:28,h:21}]});
 const before=JSON.stringify(source.world)+JSON.stringify(t);
 const cells=sculptPassabilityCells(source);
 assert.equal(cells.length,t.width*t.height,'terrain dimension normalization is authoritative');
 assert.equal(cell(cells,1,1).kind,'blocked');
 assert.equal(cell(cells,3,3).kind,'passable');
 assert.equal(JSON.stringify(source.world)+JSON.stringify(t),before);
 assert.ok(Object.isFrozen(cells));
});

test('water on the canonical heightfield is blocked to a ground walker',()=>{
 const levels=Array(64).fill(0),waterLevels=Array(64).fill(-1);
 waterLevels[9]=2; // the physical (col=1,row=1) tile of an 8-wide heightfield
 const t=createSculptTerrain({width:8,height:8,levels,waterLevels});
 const cells=sculptPassabilityCells(area(t));
 assert.equal(cell(cells,1,1).kind,'blocked');
 assert.equal(cell(cells,3,3).kind,'passable');
});

test('isolated raised land is limited by the canonical swept cliff transition',()=>{
 const levels=Array(64).fill(0);levels[9]=4;
 const t=createSculptTerrain({width:8,height:8,levels});
 const cells=sculptPassabilityCells(area(t));
 assert.equal(cell(cells,1,1).kind,'limited','standing possible but approaching from flat ground is restricted');
 assert.equal(cell(cells,6,6).kind,'passable');
});

test('UI is opt-in, disabled during Tester, drawn with same canvas and never exported',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/id="passability-overlay-toggle"/);
 assert.match(html,/aria-pressed="false"/);
 assert.match(html,/id="passability-overlay-legend"/);
 assert.match(main,/sculptPassabilityCells/);
 assert.match(main,/isBlocked/);
 assert.match(main,/if\(!navigationTesting&&passabilityOverlayEnabled\)/);
 assert.match(main,/if\(passabilityToggle\)passabilityToggle\.addEventListener/);
 assert.match(main,/passabilityToggle\?\.setAttribute/);
 assert.match(main,/drawSculptPassabilityOverlay/);
});
