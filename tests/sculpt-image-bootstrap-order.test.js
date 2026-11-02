import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Regression from GenSrpg's real external Chromium preview:
// image.onload -> scheduleDraw() -> framePending temporal dead zone.
// Replay the *real registration and scheduler source* with an image whose
// load completes immediately. Never use a fake terrain or second renderer.
const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('early image completion schedules only the original Sculpt renderer',()=>{
  const callbackStart=source.indexOf('const interiorVisualImages=new Map();');
  const callbackEnd=source.indexOf('function objectImage(assetId)',callbackStart);
  const state='let framePending=false;';
  const stateStart=source.indexOf(state);
  const scheduler='function scheduleDraw(){if(!framePending){framePending=true;requestAnimationFrame(draw);}}';
  assert.ok(callbackStart>0&&callbackEnd>callbackStart,'official image registration must be present');
  assert.ok(stateStart>0&&source.indexOf(state,stateStart+1)===-1,'single frame state owner');
  assert.ok(source.includes(scheduler),'original scheduling contract must remain intact');
  const observed=[];
  class ImmediateImage{
    set src(value){
      assert.equal(value,'asset/door.png');
      this.onload?.();
    }
  }
  const sections=[
    {offset:stateStart,code:state},
    {offset:callbackStart,code:source.slice(callbackStart,callbackEnd)}
  ].sort((a,b)=>a.offset-b.offset);
  const program=`const INTERIOR_DOOR_ASSETS=[{id:"door",path:"asset/door.png"}];
const INTERIOR_CONNECTOR_ASSETS=[];
function draw(){}
${scheduler}
${sections.map(x=>x.code).join('\n')}
if(interiorVisualImages.size!==1)throw Error("Native image not registered");
`;
  assert.doesNotThrow(()=>vm.runInNewContext(program,{
    Image:ImmediateImage,
    requestAnimationFrame:(fn)=>{observed.push(fn.name);return 1;}
  },{filename:'sculpt-image-early-callback-replay.js'}));
  assert.deepEqual(observed,['draw'],'the existing render scheduler must queue exactly one native draw');
});

test('frame scheduler state is initialized before subscribing to native image callbacks',()=>{
  const start=source.indexOf('const interiorVisualImages=new Map();');
  assert.ok(source.indexOf('let framePending=false;')<start,
    'framePending must not remain in the temporal dead zone when a cached image loads');
});
