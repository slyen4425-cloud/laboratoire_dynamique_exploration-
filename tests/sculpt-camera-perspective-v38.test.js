import test from 'node:test';
import assert from 'node:assert/strict';
import {createSculptTerrain,serializeSculptTerrain} from '../src/world/sculpt-height-model.js';
import {SCULPT_TILE} from '../src/render/sculpt-height-renderer.js';
import {sculptCameraView,sculptCameraProject,sculptCameraUnproject,
  sculptCameraBounds,sculptCameraScreenToWorld} from '../src/render/sculpt-camera-projection.js';

test('V38 camera is a pure reversible visual projection, with a classic rollback',()=>{
  const world=createSculptTerrain({width:24,height:16});
  const old=serializeSculptTerrain(world);
  const three=sculptCameraView('threeQuarter'),classic=sculptCameraView('classic');
  assert.ok(three.pitch>0&&three.pitch<1,'ground is foreshortened');
  assert.ok(three.shear!==0,'oblique side component');
  assert.deepEqual(sculptCameraProject(classic,42,81),{x:42,y:81});
  for(const view of [three,classic])for(const [x,y] of [
    [0,0],[48,80],[442,240],[-12,-120],[0,900],[672,336]
  ]){
    const p=sculptCameraProject(view,x,y);
    const back=sculptCameraUnproject(view,p.x,p.y);
    assert.ok(Math.abs(back.x-x)<1e-8&&Math.abs(back.y-y)<1e-8);
    const screen=sculptCameraScreenToWorld(view,{
      screenX:p.x*1.2+27,screenY:p.y*1.2-17,
      pan:{x:27,y:-17},zoom:1.2});
    assert.ok(Math.abs(screen.x-x)<1e-8&&Math.abs(screen.y-y)<1e-8,
      'touch/click inversion must use the exact canvas camera');
  }
  assert.equal(serializeSculptTerrain(world),old,'camera never edits the WorldDocument');
  assert.equal(SCULPT_TILE.height,21,'physical cell height and collisions remain unchanged');
  assert.equal(SCULPT_TILE.rise,18,'physical relief steps remain unchanged');
});
test('V38 camera bounds include all world corners and maximum cliff elevation',()=>{
  const fullW=36*SCULPT_TILE.width,fullH=24*SCULPT_TILE.height,rise=7*SCULPT_TILE.rise;
  for(const key of ['classic','threeQuarter']){
    const view=sculptCameraView(key);
    const bounds=sculptCameraBounds(view,fullW,fullH,rise);
    assert.equal(bounds.width,fullW);
    assert.ok(bounds.height>0);
    for(const y of [-rise,fullH])for(const x of [0,fullW]){
      const projected=sculptCameraProject(view,x,y);
      assert.ok(projected.y>=bounds.minY-1e-7&&projected.y<=bounds.maxY+1e-7);
    }
  }
  assert.ok(sculptCameraBounds(sculptCameraView('threeQuarter'),fullW,fullH,rise).height<
    sculptCameraBounds(sculptCameraView('classic'),fullW,fullH,rise).height);
});
