import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createSculptPlaySceneReadinessCacheV1} from
 '../src/play/sculpt-play-scene-readiness-cache-v1.js';

test('2.5D portal HUD validates expensive destination exactly once per WorldDocument',()=>{
 let calls=0;
 const preview=createSculptPlaySceneReadinessCacheV1(area=>{
  calls++;
  if(area?.invalid)throw new Error('Destination incompatible');
 });
 const world1={},target={id:'mountain'};
 for(let frame=0;frame<120;frame++)assert.equal(preview(target,world1).ok,true);
 assert.equal(calls,1,'walking near the portal for two seconds must not re-import the target 120 times');
 const world2={},changedTarget={id:'mountain'};
 assert.equal(preview(changedTarget,world2).ok,true);
 assert.equal(calls,2,'a newly authored world must be validated again');
});

test('invalid destination stays blocked but is rechecked after world edit',()=>{
 let calls=0;
 const preview=createSculptPlaySceneReadinessCacheV1(area=>{
  calls++;if(area.invalid)throw Error('WorldArea illisible');
 });
 const bad={invalid:true},world1={};
 for(let frame=0;frame<90;frame++){
  const status=preview(bad,world1);
  assert.equal(status.ok,false);
  assert.equal(status.error,'WorldArea illisible');
 }
 assert.equal(calls,1,'invalid maps must not be parsed on each draw either');
 bad.invalid=false;
 assert.equal(preview(bad,{}).ok,true,'changing the WorldDocument invalidates cached readiness');
 assert.equal(calls,2);
 assert.throws(()=>createSculptPlaySceneReadinessCacheV1(null),/validator/);
});

test('static gameplay: actual portal entry keeps its independent authoritative revalidation',()=>{
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(main,/sculptPortalPreviewReadiness\(target,sculptWorldDraft\)/);
 assert.match(main,/const scene=sculptWorldAreaScene\(area\)/,
  'entering or changing a WorldArea still mounts the real native scene');
 assert.match(main,/sculptWorldAreaScene\(document\.areas\.find\(a=>a\.id===transition\.currentAreaId\)\)/,
  'portal traversal still validates the destination independently, not from HUD cache');
 assert.match(main,/navRampTerrain!==terrain/,
  'native ramp geometry is refreshed when the terrain identity changes');
 assert.match(main,/stairs:\[\.\.\.resolvedSculptStairs\(\),\.\.\.resolvedSculptTerrainRamps\(\)\]/);
});
