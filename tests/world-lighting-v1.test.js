import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldLightingV1,worldShadowLocalRotationV1} from '../src/world/world-lighting-v1.js';
import {normalizeWorldDocument} from '../src/world/world-document-model.js';
import {createWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {worldObjectShadowProjectionV1} from '../src/render/world-object-renderer.js';
import {drawSculptWarmLightV1,drawSculptWorldCloudShadowsV1} from '../src/render/sculpt-world-lighting-v1.js';
test('lighting is opt-in; canonical world document and draft preserve it',()=>{
 const legacy=normalizeWorldDocument({});
 assert.equal(Object.hasOwn(legacy,'lighting'),false);
 const l=normalizeWorldLightingV1({enabled:true,directionDeg:-90,shadowColor:'bad',shadowOpacityPct:120,cloudsEnabled:true});
 assert.equal(l.directionDeg,270);assert.equal(l.shadowColor,'#1a1b3a');
 assert.equal(l.shadowOpacityPct,65);assert.equal(l.cloudsEnabled,true);
 const world=normalizeWorldDocument({...legacy,lighting:l});
 assert.deepEqual(createWorldBuilderDraft(JSON.parse(JSON.stringify(world))).lighting,l);
 assert.equal(Object.hasOwn(normalizeWorldDocument({...world,lighting:{enabled:false}}),'lighting'),false);
});
test('global direction survives local rotation and mirroring',()=>{
 for(const direction of [0,45,90,180,270])for(const a of [0,.5,Math.PI/2])for(const mirror of [false,true]){
  const flatten=.4,shear=-.48,theta=worldShadowLocalRotationV1(direction,a,mirror,flatten,shear);
  const x=-shear*Math.cos(theta)+flatten*Math.sin(theta),y=-shear*Math.sin(theta)-flatten*Math.cos(theta);
  const m=mirror?-1:1,wx=m*x*Math.cos(a)-y*Math.sin(a),wy=m*x*Math.sin(a)+y*Math.cos(a);
  const target=direction*Math.PI/180;
  assert.ok(Math.abs(Math.atan2(wy,wx)-target)<1e-9||Math.abs(Math.sin(Math.atan2(wy,wx)-target))<1e-9&&Math.cos(Math.atan2(wy,wx)-target)>.99);
 }
});
test('global projection settings, explicit opacity exception and old maps',()=>{
 const args={width:100,height:200};
 const legacy=worldObjectShadowProjectionV1(args);
 const lighting=normalizeWorldLightingV1({enabled:true});
 const modern=worldObjectShadowProjectionV1({...args,lighting});
 assert.equal(legacy.opacity,.25);assert.equal(legacy.flatten,.38);
 assert.equal(modern.opacity,.35);assert.equal(modern.flatten,.4);
 assert.equal(modern.footY,legacy.footY);
 assert.equal(worldObjectShadowProjectionV1({...args,lighting,shadow:{mode:'custom',opacityPct:15}}).opacity,.15);
});
test('disabled effects do not draw or require a DOM',()=>{
 assert.equal(drawSculptWarmLightV1(null,{lighting:null}),false);
 assert.equal(drawSculptWorldCloudShadowsV1(null,{lighting:null}),0);
});
test('warm light restores existing canvas transform',()=>{
 const calls=[];
 const ctx={save(){calls.push('save')},restore(){calls.push('restore')},setTransform(...v){calls.push(v)},fillRect(...v){calls.push(v)}};
 assert.equal(drawSculptWarmLightV1(ctx,{lighting:normalizeWorldLightingV1({enabled:true}),width:400,height:200,dpr:2}),true);
 assert.deepEqual(calls,['save',[2,0,0,2,0,0],[0,0,400,200],'restore']);
});
