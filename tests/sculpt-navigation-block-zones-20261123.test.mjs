import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,serializeSculptTerrain,importSculptTerrain,
  applySculptNavigationBlockStroke,sculptBrushFootprint} from '../src/world/sculpt-height-model.js';
import {sculptNavigationRoute} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';

const W=18,H=12,CW=28,CH=21;
const terrain=createSculptTerrain({width:W,height:H});
const mark=(base=terrain,action='block',shape='square',x=6.5,y=5.5,radius=.5)=>
  applySculptNavigationBlockStroke(base,{points:[{x,y}],radius,shape,action});
const nav=t=>({sculptNavigation:{terrain:t,cellWidth:CW,cellHeight:CH,
  projectionRise:18,maxStepUp:0,maxStepDown:0,stairs:[],bridges:[]}});
const actor=(x,y,modes=['ground'])=>({x,y,radius:5,locomotion:{modes}});
const world={width:W*CW,height:H*CH,objects:[],obstacles:[]};

test('old SculptTerrain keeps identical JSON without a no-go field',()=>{
 const source=serializeSculptTerrain(terrain);
 assert.equal(JSON.parse(source).navigationBlockedCells,undefined);
 assert.equal(serializeSculptTerrain(importSculptTerrain(source)),source);
 assert.equal(terrain.navigationBlockedCells,undefined);
});

test('original terrain brush shape paints and restores navigation cells, without changing heights/texture',()=>{
 const blocked=mark();
 const id=5*W+6;
 assert.deepEqual(blocked.navigationBlockedCells,[id]);
 assert.deepEqual(blocked.levels,terrain.levels);
 assert.deepEqual(blocked.waterLevels,terrain.waterLevels);
 assert.deepEqual(blocked.spheres,terrain.spheres);
 const untouched=mark(blocked,'block');
 assert.equal(untouched,blocked,'repainting does not add duplicate zones');
 const cleared=mark(blocked,'normal');
 assert.equal(cleared.navigationBlockedCells,undefined);
 assert.equal(serializeSculptTerrain(cleared),serializeSculptTerrain(terrain));
 assert.equal(mark(terrain,'normal'),terrain);
 const round=sculptBrushFootprint(terrain,{points:[{x:7.5,y:6.5}],radius:1.2,shape:'circle'});
 const square=sculptBrushFootprint(terrain,{points:[{x:7.5,y:6.5}],radius:1.2,shape:'square'});
 assert.ok(square.length>round.length,'square brush must include corners absent in round');
});

test('same Collision World swept route stops ground NPC and hero at actor radius; flying bypasses',()=>{
 const blocked=mark();
 const p=actor(5.5*CW,5.5*CH);
 const targetX=7.5*CW,targetY=p.y;
 const gate=sculptNavigationRoute(nav(blocked).sculptNavigation,p,targetX,targetY);
 assert.equal(gate.reason?.kind,'navigation-block');
 assert.equal(gate.reason?.col,6);
 assert.equal(gate.reason?.row,5);
 assert.equal(sculptNavigationRoute(nav(terrain).sculptNavigation,p,targetX,targetY).reason,null);
 assert.equal(sculptNavigationRoute(nav(blocked).sculptNavigation,
   actor(p.x,p.y,['fly']),targetX,targetY).reason,null);
 const touching=actor(6*CW-5.2,p.y);
 assert.equal(sculptNavigationRoute(nav(blocked).sculptNavigation,
   touching,6*CW-3.5,p.y).reason?.kind,'navigation-block',
   'body radius blocks entry even before its center crosses a tile');
 const moving=actor(p.x,p.y);
 for(let i=0;i<25;i++)stepMovement(world,moving,{x:1,y:0},.08,
   {maxSpeed:90},undefined,nav(blocked));
 assert.ok(moving.x<6*CW-3,'native movement must not cross the forbidden zone');
 const cleared=mark(blocked,'normal');
 for(let i=0;i<25;i++)stepMovement(world,moving,{x:1,y:0},.08,
   {maxSpeed:90},undefined,nav(cleared));
 assert.ok(moving.x>7*CW,'removing the mask restores the original route');
});

test('terrain-based no-go zones roundtrip through WorldArea and old imports remain safe',()=>{
 const blocked=mark(terrain,'block','square',6.5,5.5,1.5);
 const json=serializeSculptTerrain(blocked);
 assert.deepEqual(importSculptTerrain(json).navigationBlockedCells,blocked.navigationBlockedCells);
 const area={width:W*CW,height:H*CH,sculptTerrain:JSON.parse(json),
   surface:null,objects:[],actors:[]};
 assert.deepEqual(sculptWorldAreaScene(area).terrain.navigationBlockedCells,
   blocked.navigationBlockedCells,'WorldBuilder loads the very same SculptTerrain mask');
 const invalid=JSON.parse(json);
 invalid.navigationBlockedCells=[-1];
 assert.throws(()=>importSculptTerrain(invalid),/Carte sculptable invalide/);
 invalid.navigationBlockedCells=[5,5];
 assert.throws(()=>importSculptTerrain(invalid),/Carte sculptable invalide/);
});

test('Navigation → Zones de passage shows only one tool and uses existing brush, ramps and Undo',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 for(const id of ['navigation-zones-tools','nav-zone-block','nav-zone-normal',
   'nav-zone-stop','nav-zone-allow-ramp','nav-zone-count'])
   assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,id);
 assert.match(html,/Navigation · Zones de passage/);
 assert.match(script,/applySculptNavigationBlockStroke/);
 assert.match(script,/if\(navMaskGesture\)\{/);
 assert.match(script,/commitUndo\(gesture.before\)/);
 assert.match(script,/selectMode\('terrain-ramp'\)/);
 assert.match(script,/if\(reason.kind==='navigation-block'\)/);
 assert.match(script,/navigationMaskEditing\|\|\$\('navigation-zones-tools'\)\?\.open/);
 // Frozen V80 intentionally has NONE of these controls, yet loads the same
 // shared runtime source. No eager .addEventListener or paint overlay crash.
 for(const id of ['nav-zone-block','nav-zone-normal','nav-zone-stop','nav-zone-allow-ramp'])
   assert.ok(script.includes("$('"+id+"')?.addEventListener"),id+' needs optional hookup');
 assert.match(script,/\$\('nav-zone-block'\)\?\.classList/);
 assert.match(script,/\$\('nav-zone-normal'\)\?\.classList/);
 assert.match(script,/if\(\$\('nav-zone-stop'\)\)\$\('nav-zone-stop'\)\.disabled/);
});
