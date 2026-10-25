import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptCameraInteriorView,sculptCameraProject,sculptCameraFollowActor}
  from '../src/render/sculpt-camera-projection.js';

test('R3E : camera math keeps identical projected hero for angles 35/55/80/90',()=>{
  for(const zoom of [.4,1,1.75,2.4]){
    for(const angle of [35,55,80,90]){
      const view=sculptCameraInteriorView(angle);
      const follow=sculptCameraFollowActor(view,
        {x:260,y:155,level:0,rise:18},{width:390,height:690,zoom,anchorY:.54});
      const projected=sculptCameraProject(view,260,155);
      assert.ok(Math.abs(follow.x+projected.x*zoom-195)<1e-5);
      assert.ok(Math.abs(follow.y+projected.y*zoom-690*.54)<1e-5);
    }
  }
});
test('R3E : polygon masking owns a scoped Canvas state, hero rendered after balanced restore',()=>{
  const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const first=js.indexOf("if(boundaryArea?.boundary?.kind==='polygon')");
  const second=js.indexOf('// In Tester the ground is projected',first);
  const section=js.slice(first,second);
  assert.ok(first>=0&&second>first);
  // One save for polygon transform + one for painting, BOTH restored.
  assert.equal((section.match(/ctx\.save\(\)/g)??[]).length,2);
  assert.equal((section.match(/ctx\.restore\(\)/g)??[]).length,2);
  assert.match(section,/ctx\.restore\(\);\s*}\s*$/);
  assert.match(js,/actorRenderTransform:navHeroRenderTransform/);
});
test('R3E : stair artwork retains Portal logic without intrusive badge overlay',()=>{
  const renderer=readFileSync(
    new URL('../src/render/sculpt-interior-walls.js',import.meta.url),'utf8');
  const start=renderer.indexOf('for(const portal of stairPortals)');
  const end=renderer.indexOf('// Temporary asset-independent door',start);
  const section=renderer.slice(start,end);
  assert.ok(start>=0&&end>start);
  assert.match(section,/ctx\.rotate\(rotation\)/);
  assert.match(section,/connectorImages\?\.get/);
  assert.doesNotMatch(section,/fillText\(/);
  assert.doesNotMatch(section,/ctx\.arc\(/);
});
