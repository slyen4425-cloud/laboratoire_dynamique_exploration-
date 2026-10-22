import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptSphere,removeSculptSphereAt,
  sculptSphereAt,sculptSphereDisplacementAt,serializeSculptTerrain,
  importSculptTerrain,applySculptStroke} from '../src/world/sculpt-height-model.js';
import {sculptNavigationBlockDetail} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';
import {drawSculptSphereMeshes} from '../src/render/sculpt-sphere-mesh.js';

const tile={width:28,height:21,rise:18};
const base=()=>createSculptTerrain({width:40,height:40});
const x=560,y=420,r=112;
const sphere=(kind='hill')=>appendSculptSphere(base(),{kind,x,y,radius:r,height:3});
const entity=(pos,modes=['ground'])=>({x:pos,y,radius:5,locomotion:{modes}});
const world={width:1120,height:840,objects:[],obstacles:[]};
const config=terrain=>({terrain,cellWidth:28,cellHeight:21,projectionRise:18,
  maxStepUp:0,maxStepDown:0});

test('V76 a single tap creates an ANALYTIC circular hemisphere, not rounded tiles',()=>{
  const original=base(),t=sphere();
  assert.equal(t.spheres.length,1);
  assert.deepEqual(t.levels,original.levels,'existing heightfield untouched');
  assert.deepEqual(t.waterLevels,original.waterLevels);
  assert.equal(t.spheres[0].baseLevel,2);
  assert.equal(sculptSphereDisplacementAt(t,x,y),3);
  assert.equal(sculptSphereDisplacementAt(t,x+r,y),0);
  assert.equal(sculptSphereDisplacementAt(t,x,y+r),0);
  assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*.5,y)-
    3*Math.sqrt(.75))<1e-9);
  assert.ok(Math.abs(sculptSphereDisplacementAt(t,x,y+r*.5)-
    sculptSphereDisplacementAt(t,x+r*.5,y))<1e-9,
    'equal world radii have equal height: true circle');
  assert.equal(sculptSphereAt(t,x+r+6,y),null);
  assert.equal(sculptSphereAt(t,x+r+4,y,5)?.kind,'hill',
    'actor radius is accounted for by collision');
});
test('V76 basin is a continuous hemispherical excavation with undo/delete',()=>{
  const t=sphere('basin');
  assert.equal(sculptSphereDisplacementAt(t,x,y),-3);
  assert.ok(sculptSphereDisplacementAt(t,x+r*.8,y)<0);
  assert.equal(sculptSphereDisplacementAt(t,x+r,y),0);
  assert.deepEqual(removeSculptSphereAt(t,x,y).spheres,[]);
  const host=base();
  assert.equal(appendSculptSphere(t,{kind:'hill',x:x+70,y,radius:56,height:2}),t,
    'overlapping spheres must not generate two authorities');
  assert.equal(appendSculptSphere(host,{kind:'hill',x:12,y,radius:112,height:2}),host,
    'full circle must fit inside the world');
});
test('V76 object serialization and reimport preserve the exact canonical sphere',()=>{
  const a=sphere('basin'),json=serializeSculptTerrain(a),b=importSculptTerrain(json);
  assert.deepEqual(b.spheres,a.spheres);
  assert.equal(serializeSculptTerrain(b),json);
  assert.deepEqual(importSculptTerrain(serializeSculptTerrain(base())).spheres,[]);
  const invalid=JSON.parse(json);invalid.spheres[0].radius=-9;
  assert.throws(()=>importSculptTerrain(invalid),/invalide/);
  const oldHeight=appendSculptSphere(base(),{kind:'hill',x,y,radius:84,height:2});
  const changed=applySculptStroke(oldHeight,{points:[{x:x/28,y:y/21}],mode:'raise',radius:1});
  assert.equal(changed.levels[Math.floor(y/21)*40+Math.floor(x/28)],2,
    'grid must not be raised secretly inside a continuous spherical relief');
});
test('V76 walking never enters a hemisphere; flight and flat ground still work',()=>{
  for(const kind of ['hill','basin']){
    const t=sphere(kind),c=config(t),from=x-r-11,to=x-r+11;
    const e=entity(from),reason=sculptNavigationBlockDetail(c,e,to,y);
    assert.equal(reason?.kind,'sphere-wall',kind);
    assert.equal(isBlocked(world,e,to,y,undefined,{sculptNavigation:c}),true);
    stepMovement(world,e,{x:1,y:0},1,{maxSpeed:22},undefined,{sculptNavigation:c});
    assert.equal(e.x,from,'real Engine may not walk into '+kind);
    const fly=entity(from,['fly']);
    assert.equal(sculptNavigationBlockDetail(c,fly,to,y),null);
    stepMovement(world,fly,{x:1,y:0},1,{maxSpeed:22},undefined,{sculptNavigation:c});
    assert.equal(fly.x,to,'flight preserved');
  }
});
test('V76 renderer samples the same true spherical surface without cell-stroke artifacts',()=>{
  const t=sphere(),frames=[];
  const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
    save(){},restore(){},beginPath(){},moveTo(a,b){frames.push([a,b]);},
    lineTo(){},closePath(){},fill(){},ellipse(){},stroke(){},
    createPattern(){return null;}};
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:t,tile}),1);
  assert.ok(frames.length>700,'actual radial polygons from geometric profile');
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:base(),tile}),0);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(html,/data-mode="sphere-hill"/);
  assert.match(html,/data-mode="sphere-basin"/);
  assert.match(html,/sphere-v76/);
});
