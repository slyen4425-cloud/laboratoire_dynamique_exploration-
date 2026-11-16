import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain} from '../src/world/sculpt-height-model.js';
import {sculptObjectRaisedCapOcclusionV1,sculptActorCliffDepthPlanV2}
  from '../src/render/sculpt-cliff-object-depth-v1.js';
const W=12,H=16,w=28,h=21,rise=18;
const terrainWith=cells=>{const levels=Array(W*H).fill(2);
 for(const [col,row,level] of cells)levels[row*W+col]=level;
 return createSculptTerrain({width:W,height:H,levels});};
const p=(c,r)=>({x:(c+.5)*w,y:(r+.5)*h});
const rect=(foot,level=2,height=180,width=70)=>({
 x:foot.x,y:foot.y-level*rise,width,height});
const options={tileWidth:w,tileHeight:h,rise};
test('C4: upper snow surface masks a tree anchored on the lower floor',()=>{
 const t=terrainWith([[4,5,8]]),foot=p(4,8);
 const caps=sculptObjectRaisedCapOcclusionV1(t,rect(foot),foot,options);
 assert.equal(caps.length,1);
 assert.equal(caps[0].col,4);assert.equal(caps[0].row,5);
 assert.equal(caps[0].x,4*w);assert.equal(caps[0].y,5*h-8*rise);
});
test('C4: object genuinely planted on the upper surface keeps its whole sprite',()=>{
 const t=terrainWith([[4,5,8]]),foot=p(4,5);
 assert.deepEqual(sculptObjectRaisedCapOcclusionV1(t,rect(foot,8),foot,options),[]);
});
test('C4: flat ground and unrelated high cells never clip visual objects',()=>{
 const foot=p(4,8),spr=rect(foot);
 assert.deepEqual(sculptObjectRaisedCapOcclusionV1(terrainWith([]),spr,foot,options),[]);
 assert.deepEqual(sculptObjectRaisedCapOcclusionV1(terrainWith([[10,5,16]]),
   spr,foot,options),[]);
 assert.deepEqual(sculptObjectRaisedCapOcclusionV1(terrainWith([]),spr,
   {x:-99,y:foot.y},options),[]);
});
test('C4: both overlapping upper caps remain excluded, without evenodd holes',()=>{
 const t=terrainWith([[4,5,8],[4,6,8]]),foot=p(4,8);
 const caps=sculptObjectRaisedCapOcclusionV1(t,rect(foot),foot,options);
 assert.deepEqual(caps.map(cap=>cap.row),[5,6]);
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function clipPreviewObjectByUpperCaps('),
   source.indexOf('function drawPreviewObject(',source.indexOf('function clipPreviewObjectByUpperCaps(')));
 assert.match(body,/ctx\.rect\(-32768,-32768,65536,65536\)/);
 assert.match(body,/ctx\.moveTo\(a\.x,a\.y\);ctx\.lineTo\(b\.x,b\.y\)/);
 assert.match(body,/ctx\.clip\(\)/);
 assert.doesNotMatch(body,/clip\('evenodd'\)|drawSculptTerrain\(/);
});
test('C4: clip belongs ONLY to WorldObject painter, not hero/decks/stairs/ramps',()=>{
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const body=source.slice(source.indexOf('function drawPreviewObject('),
   source.indexOf('function drawPreviewObjects(',source.indexOf('function drawPreviewObject(')));
 assert.match(body,/object\.kind==='bridge'\|\|object\.kind==='stairs'/);
 assert.match(body,/object\.kind==='ramp'\?\[\]/);
 assert.match(body,/clipPreviewObjectByUpperCaps\(upperCaps\)/);
 const hero=source.slice(source.indexOf('function drawNavigationActor('),
   source.indexOf('function drawPlacedActors('));
 assert.doesNotMatch(hero,/clipPreviewObjectByUpperCaps/);
});
test('C4: use the existing hero collision-foot radius near cliff lip',()=>{
 const t=terrainWith([[4,6,8],[4,8,8]]);
 const edge=7*h,pos={x:4.5*w,y:edge-3};
 const small=sculptActorCliffDepthPlanV2(t,rect(pos,2,190,44),pos,options);
 const big=sculptActorCliffDepthPlanV2(t,rect(pos,2,190,44),pos,
   {...options,footRadius:5});
 assert.ok(big.redraw);
 assert.ok(big.frontRects.length<=small.frontRects.length);
 const far={...pos,y:edge-9};
 const front=sculptActorCliffDepthPlanV2(t,rect(far,2,190,44),far,
   {...options,footRadius:5});
 assert.ok(front.frontRects.some(x=>x.y===7*h-8*rise));
});
