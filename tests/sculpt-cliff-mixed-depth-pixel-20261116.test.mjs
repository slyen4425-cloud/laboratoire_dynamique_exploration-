import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptTerrain,sculptFaces} from '../src/world/sculpt-height-model.js';
import {sculptObjectInFrontOfCliffV1,sculptActorCliffDepthPlanV2}
  from '../src/render/sculpt-cliff-object-depth-v1.js';

const W=8,H=16,w=28,h=21,rise=18;
const terrainWith=(entries)=>{
  const levels=Array(W*H).fill(2);
  for(const [x,y,level] of entries)levels[y*W+x]=level;
  return createSculptTerrain({width:W,height:H,levels});
};
const foot=(x,y)=>({x,y});
const sprite=(x,y,level=2)=>({x,y:y-level*rise,width:44,height:90});

test('Pixel C3: hero between two visible walls restores the REAR wall only',()=>{
 const t=terrainWith([[3,5,8],[3,7,8]]);
 const pos=foot(3.5*w,6*h+10);
 const b=sculptObjectInFrontOfCliffV1(t,sprite(pos.x,pos.y),pos);
 assert.equal(b,false,'old all-or-nothing depth decision loses the hero');
 const plan=sculptActorCliffDepthPlanV2(t,sprite(pos.x,pos.y),pos);
 assert.equal(plan.redraw,true,'rear wall must not hide the hero body');
 assert.ok(plan.frontRects.some(r=>r.x===3*w&&r.y===8*h-8*rise),
  'wall in front of the hero remains an occluder');
 assert.equal(JSON.stringify(t),JSON.stringify(terrainWith([[3,5,8],[3,7,8]])));
});
test('unobstructed actor or actor entirely behind wall: no replay',()=>{
 const flat=terrainWith([]),t=terrainWith([[3,7,8]]);
 const pos=foot(3.5*w,6*h+10);
 assert.deepEqual(sculptActorCliffDepthPlanV2(flat,sprite(pos.x,pos.y),pos),
  {redraw:false,frontRects:[]});
 const plan=sculptActorCliffDepthPlanV2(t,sprite(pos.x,pos.y),pos);
 assert.equal(plan.redraw,false);
 assert.ok(plan.frontRects.length>=1);
});
test('east-facing side uses the lower-right foot, not the south-row test',()=>{
 const t=terrainWith([[2,6,8]]);
 const pos=foot(3.5*w,6*h+10);
 const plan=sculptActorCliffDepthPlanV2(t,sprite(pos.x,pos.y),pos);
 assert.equal(plan.redraw,true);
 const far=foot(1.5*w,6*h+10);
 assert.equal(sculptActorCliffDepthPlanV2(t,sprite(far.x,far.y),far).redraw,false);
});
test('Tester composites one cached wall mask, one hero replay, and front clip only',()=>{
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const fragment=source.slice(source.indexOf('const cliffPlan=sculptActorCliffDepthPlanV2'),
  source.indexOf('for(const object of nearObjects)\n          if(object.transform.y>heroY)'));
 assert.match(fragment,/if\(cliffPlan\.redraw\)\{[\s\S]*drawNavigationActor\(\)/);
 assert.match(fragment,/for\(const rect of cliffPlan\.frontRects\)[\s\S]*ctx\.clip\(\)/);
 assert.match(fragment,/ctx\.drawImage\(cached\.cliffOcclusionImage/);
 assert.doesNotMatch(fragment,/drawSculptTerrain\(/);
});
