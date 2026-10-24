import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptAltitudeVisualState} from '../src/render/sculpt-altitude-visual.js';
import {createSculptTerrain,appendSculptSphere,sculptSphereDisplacementAt}
  from '../src/world/sculpt-height-model.js';
import {sculptGroundReliefLighting,sculptHillTopProfile}
  from '../src/render/sculpt-height-renderer.js';
import {sculptNavigationBlockDetail,sculptSphereSupportedSummit}
  from '../src/core/sculpt-navigation-collision.js';
import {createMapActorRenderer} from '../src/render/map-actor-renderer.js';

const W=40,H=40,x=560,y=420,r=112;
const plain=()=>createSculptTerrain({width:W,height:H});
const at=level=>{
  const heights=Array(W*H).fill(2);heights[12*W+10]=level;
  return createSculptTerrain({width:W,height:H,levels:heights});
};
test('V76 R12 contiguous altitude steps 0..7 monotonically brighten terrain and grow only visual hero',()=>{
  const values=Array.from({length:8},(_,level)=>sculptAltitudeVisualState(level));
  assert.equal(values[2].tint,0);
  assert.equal(values[2].heroScale,1);
  assert.ok(values[0].tint<values[1].tint&&values[1].tint<0);
  for(let n=3;n<=7;n++){
    assert.ok(values[n].tint>values[n-1].tint,'every raised level increases brightness '+n);
    assert.ok(values[n].heroScale>values[n-1].heroScale,'every raised level enlarges visual hero '+n);
  }
  assert.ok(values[7].tint>.2&&values[7].tint<=.3);
  assert.ok(values[0].tint<-.14);
  assert.ok(values[7].heroScale<1.2&&values[0].heroScale>.8);
  for(let level=0;level<=7;level++){
    const sample=sculptGroundReliefLighting(at(level),10,12);
    assert.equal(sample.tone,values[level].tint);
  }
  const low=sculptAltitudeVisualState(-5);
  assert.ok(low.tint<=-.29&&low.heroScale<values[0].heroScale);
  // The existing sculpt schema permits only levels 0..7; negative scene
  // elevations are a future explicit World Model change, not simulated here.
  assert.ok(Object.isFrozen(values[0]));
});

test('V76 R12 native actor renderer scales sprite and contact shadow at higher/lower altitude',()=>{
  const image={tag:'hero'},paint=[],shadows=[];
  const ctx={save(){},restore(){},beginPath(){},fill(){},translate(){},scale(){},
    ellipse(...v){shadows.push(v);},drawImage(...v){paint.push(v)}};
  const visual={assetId:'hero',targetHeight:78,mirrorHorizontal:true,
    sourceFacingX:1,anchorOverride:{},shadow:{enabled:true,opacity:.24,
      widthRatio:.58,heightRatio:.16},motion:{idleAmplitude:0,idleFrequency:1,
      walkAmplitude:0,walkFrequency:1}};
  const renderer=createMapActorRenderer({preparedVisuals:{get:()=>({
    source:image,aspectRatio:1,anchor:{x:.5,y:1}
  })}});
  for(const level of [0,2,4,7]){
    renderer.draw(ctx,{camera:{x:0,y:0},actors:[{x:99,y:101,mapVisual:visual,
      visualScale:sculptAltitudeVisualState(level).heroScale}],timeSeconds:0});
  }
  for(let i=0;i<4;i++){
    const scale=sculptAltitudeVisualState([0,2,4,7][i]).heroScale;
    assert.ok(Math.abs(paint[i][4]-78*scale)<1e-9);
    assert.ok(Math.abs(shadows[i][2]-78*scale*.58/2)<1e-9);
  }
  assert.equal(paint.length,4);
  const app=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  assert.ok(app.includes('visualScale:sculptAltitudeVisualState(navVisualLevel??navHeight()).heroScale'));
  assert.ok(app.includes('sculptSphereDisplacementAt(terrain,navActor.x,navActor.y)'));
});

test('V76 R12 top corners reuse authoritative HD cliff material, do not leave naked squares',()=>{
  const s=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
  assert.ok(s.includes('if(roundedHill||hill.radius>0)'));
  assert.ok(s.includes('drawSculptCliffAtlas(ctx,{image:cliffAtlas,hdImage:cliffHD,'));
  assert.ok(s.includes('ctx.rect(x,y,w,h);ctx.clip();'));
  assert.ok(s.includes('sculptClipRoundedHill(ctx,roundedHill,tile)'));
  // The untouched ordinary square hill remains square: only deliberately
  // sculpted rounded profiles use corner masks.
  const t=at(5);
  assert.equal(sculptHillTopProfile(t,10,12).radius,0);
});

test('V76 R12 already-held flat spherical summit is traversable, no free climbing from ground',()=>{
  for(const ratio of [.3,.5,.75,1]){
    const terrain=appendSculptSphere(plain(),{kind:'hill',x,y,radius:r,height:5,
      summitRatio:ratio});
    const top=terrain.spheres[0],safeR=r*ratio-5-1e-6;
    assert.ok(safeR>0);
    const actor={x,y,radius:5,locomotion:{modes:['ground']}};
    const options={terrain,cellWidth:28,cellHeight:21,projectionRise:18,
      maxStepUp:0,maxStepDown:0};
    assert.equal(sculptSphereSupportedSummit(terrain,x,y,5)?.id,top.id);
    assert.equal(sculptNavigationBlockDetail(options,actor,x+Math.min(safeR*.4,8),y),null,
      'walking on an already-held flat summit does not hit its own sphere-wall');
    assert.equal(sculptNavigationBlockDetail(options,actor,x,y+Math.min(safeR*.4,8)),null);
    const outside={x,y:y+r+30,radius:5,locomotion:{modes:['ground']}};
    assert.equal(sculptNavigationBlockDetail(options,outside,x,y+r*.8)?.kind,'sphere-wall',
      'ground actor still cannot climb the conical or cylindrical side');
    const nearEdge={x:x+safeR-.01,y,radius:5,locomotion:{modes:['ground']}};
    assert.equal(sculptNavigationBlockDetail(options,nearEdge,x+safeR+10,y)?.kind,'sphere-wall',
      'an existing top actor cannot step into the unvalidated V77 slope');
    assert.ok(sculptSphereDisplacementAt(terrain,x,y)>0);
  }
  const dome=appendSculptSphere(plain(),{kind:'hill',x,y,radius:r,height:4});
  assert.equal(sculptSphereSupportedSummit(dome,x,y,5),null,'round dome has no authored flat summit');
  const basin=appendSculptSphere(plain(),{kind:'basin',x,y,radius:r,height:4,summitRatio:.8});
  assert.equal(sculptSphereSupportedSummit(basin,x,y,5),null,'excavated basin remains impassable');
});
