import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,appendSculptSphere,removeSculptSphereAt,
  sculptSphereAt,sculptSphereDisplacementAt,serializeSculptTerrain,
  importSculptTerrain,applySculptStroke} from '../src/world/sculpt-height-model.js';
import {sculptNavigationBlockDetail} from '../src/core/sculpt-navigation-collision.js';
import {stepMovement} from '../src/core/movement.js';
import {isBlocked} from '../src/core/collision.js';
import {drawSculptSphereMeshes,sculptSphereProjectedPoint} from '../src/render/sculpt-sphere-mesh.js';

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
    lineTo(){},closePath(){},fill(){},ellipse(){},arc(){},clip(){},stroke(){},
    createPattern(){return null;}};
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:t,tile}),1);
  assert.ok(frames.length>700,'actual radial polygons from geometric profile');
  assert.equal(drawSculptSphereMeshes(ctx,{terrain:base(),tile}),0);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(html,/data-mode="sphere-hill"/);
  assert.match(html,/data-mode="sphere-basin"/);
  assert.match(html,/sphere-v76/);
});

test('V76 R2 hill and basin project real 1/3/7-level vertical relief, not flat discs',()=>{
  for(const kind of ['hill','basin']){
    for(const height of [1,3,7]){
      const t=appendSculptSphere(base(),{kind,x,y,radius:r,height});
      const f=t.spheres[0],center=sculptSphereProjectedPoint(t,f,0,0,tile);
      const edge=sculptSphereProjectedPoint(t,f,1,0,tile);
      const expected=kind==='hill'?height:
        -height*Math.min(1,r*.68/(7*tile.rise));
      assert.ok(Math.abs((edge.y-center.y)/tile.rise-expected)<1e-8,
        `kind ${kind} amplitude ${height} remains perceptibly proportional`);
      assert.equal(edge.level,2);
      assert.equal(center.level,kind==='hill'?2+height:2-height);
    }
  }
});
test('V76 R2 painter draws visible mineral flanks, contact shadow and a clipped recessed cavity',()=>{
  const draw=kind=>{
    const fills=[],shapes=[],strokes=[];
    const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){},moveTo(x,y){shapes.push({x,y});},
      lineTo(){},closePath(){},ellipse(){},arc(){},clip(){strokes.push('clipped');},
      fill(){fills.push(this.fillStyle);},stroke(){strokes.push(this.strokeStyle);},
      createPattern(){return null;}};
    drawSculptSphereMeshes(ctx,{terrain:sphere(kind),tile,baseColor:'#677955',
      rockPaletteColors:['#ded2be','#ad9f88','#776b5b','#3b4146']});
    return {fills,shapes,strokes};
  };
  const hill=draw('hill'),pit=draw('basin');
  assert.ok(hill.fills.includes('rgba(12,24,27,.29)'),'ground contact shadow');
  assert.ok(hill.fills.includes('#ad9f88')||hill.fills.includes('#776b5b')||
    hill.fills.includes('#3b4146'),'mineral height flanks');
  assert.ok(!hill.strokes.includes('clipped'),'hill rises above host perimeter');
  assert.ok(pit.strokes.includes('clipped'),'cavity is carved within circular rim');
  assert.ok(pit.fills.includes('#182b32'),'dark opening below host surface');
  assert.ok(pit.fills.some(s=>String(s).includes('rgba(9,18,32,')),
    'recessed walls are darker than ordinary ground');
  assert.ok(hill.shapes.length>1000&&pit.shapes.length>1000);
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.match(html,/id="height-label"/);
  assert.match(html,/sphere-v76-volume-r2/);
  assert.match(main,/mode==='sphere-basin'\?'Profondeur'/);
});


test('V76 R3 summit radius makes a REAL flat cap / flat cavity floor with unchanged collision footprint',()=>{
  for(const kind of ['hill','basin']){
    const t=appendSculptSphere(base(),{kind,x,y,radius:r,height:5,summitRatio:.6,wallMaterial:'grass'});
    const sign=kind==='hill'?1:-1;
    const f=t.spheres[0];
    assert.equal(f.summitRatio,.6);
    assert.equal(f.wallMaterial,'grass');
    for(const d of [0,.25,.5,.6])
      assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*d,y)-sign*5)<1e-8,
        'flat summit/floor extends exactly to the configured radius');
    const d=.8,local=(d-.6)/(1-.6);
    assert.ok(Math.abs(sculptSphereDisplacementAt(t,x+r*d,y)-sign*5*Math.sqrt(1-local*local))<1e-8);
    assert.equal(sculptSphereAt(t,x+r+6,y),null);
    assert.equal(sculptNavigationBlockDetail(config(t),entity(x-r-11),x-r+11,y)?.kind,'sphere-wall');
    assert.deepEqual(importSculptTerrain(serializeSculptTerrain(t)).spheres,t.spheres);
  }
  const column=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:7,summitRatio:.85,wallMaterial:'earth'});
  assert.equal(sculptSphereDisplacementAt(column,x+r*.8,y),7);
  assert.equal(sculptSphereDisplacementAt(column,x+r*.96,y)<7,true);
  const json=JSON.parse(serializeSculptTerrain(column));
  json.spheres[0].summitRatio=.9;
  assert.throws(()=>importSculptTerrain(json),/invalide/);
  json.spheres[0].summitRatio=.5;json.spheres[0].wallMaterial='glass';
  assert.throws(()=>importSculptTerrain(json),/invalide/);
});

test('V76 R3 old spherical JSON remains readable and material options change flank fill',()=>{
  const old=JSON.parse(serializeSculptTerrain(sphere()));
  delete old.spheres[0].summitRatio;delete old.spheres[0].wallMaterial;
  const legacy=importSculptTerrain(old);
  assert.equal(sculptSphereDisplacementAt(legacy,x+r*.5,y),3*Math.sqrt(.75));
  const colorFor=wallMaterial=>{
    const t=appendSculptSphere(base(),{kind:'hill',x,y,radius:r,height:4,wallMaterial});
    const colors=[];
    const ctx={fillStyle:'',strokeStyle:'',lineWidth:1,
      save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},
      ellipse(){},arc(){},clip(){},fill(){colors.push(this.fillStyle);},stroke(){},
      createPattern(){return null;}};
    drawSculptSphereMeshes(ctx,{terrain:t,tile,baseColor:'#677955',
      rockPaletteColors:['#bea28c','#947c70','#6c6064','#4b4a56']});
    return colors;
  };
  assert.ok(colorFor('rock').includes('#947c70'));
  assert.ok(colorFor('grass').includes('#638c45'));
  assert.ok(colorFor('earth').includes('#94765a'));
  const mesh=readFileSync(new URL('../src/render/sculpt-sphere-mesh.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.ok(!mesh.includes('paintContours(ctx'),'no permanent concentric brush rings on authored relief');
  assert.match(html,/id="sphere-summit-ratio"/);
  assert.match(html,/id="sphere-wall-material"/);
  assert.match(main,/spherePreviewDismissed=true;hoverCell=null;scheduleDraw/);
  assert.ok(main.includes("summitRatio:Number($(\'sphere-summit-ratio\').value)/100"));
});
