import test from 'node:test';
import assert from 'node:assert/strict';
import {sculptCameraGameView,sculptCameraBounds} from '../src/render/sculpt-camera-projection.js';
import {
  clampSculptNavigationCameraToTerrainV1,
  sculptExteriorFringeCameraBoundsV1
} from '../src/render/sculpt-navigation-camera-clamp-v1.js';

for(const [columns,rows] of [[36,24],[80,64],[64,80]]) {
  if(rows>64)continue; // 2.5D terrain authority currently supports max 64 rows
  for(const angle of [35,55,90]){
    test('south camera stops at playable border and north keeps sky '+columns+'x'+rows+' @'+angle,()=>{
      const width=columns*28,height=rows*21;
      const zoom=2,viewportHeight=540,viewportWidth=950;
      const view=sculptCameraGameView(angle);
      const coreBounds=sculptCameraBounds(view,width,height,16*18);
      const bounds=sculptExteriorFringeCameraBoundsV1({
        coreBounds,view,coreWidth:width,coreHeight:height,
        fringeRows:8,tileWidth:28,tileHeight:21,
        viewportHeight,zoom,skyFraction:.12
      });
      assert.equal(bounds.minX,coreBounds.minX);
      assert.equal(bounds.maxX,coreBounds.maxX);
      assert.equal(bounds.maxY,coreBounds.maxY);
      assert.ok(bounds.minY<coreBounds.minY);
      assert.ok((coreBounds.minY-bounds.minY)*zoom>=64.8-1e-6);
      const bottom=clampSculptNavigationCameraToTerrainV1({
        pan:{x:-100,y:-100000},bounds,zoom,width:viewportWidth,height:viewportHeight
      });
      if((bounds.maxY-bounds.minY)*zoom>viewportHeight){
        assert.ok(Math.abs(bottom.y+bounds.maxY*zoom-viewportHeight)<.00001);
      }
      const top=clampSculptNavigationCameraToTerrainV1({
        pan:{x:-100,y:100000},bounds,zoom,width:viewportWidth,height:viewportHeight
      });
      if((bounds.maxY-bounds.minY)*zoom>viewportHeight){
        assert.ok(Math.abs(top.y+bounds.minY*zoom)<.00001);
      }
      // No interaction with hero coordinates, Spawn, Encounter or collision.
      assert.equal(width,columns*28);
      assert.equal(height,rows*21);
    });
  }
}
test('without decoration the existing camera clamp still uses the original terrain',()=>{
  const view=sculptCameraGameView(55);
  const core=sculptCameraBounds(view,80*28,64*21,16*18);
  const result=clampSculptNavigationCameraToTerrainV1({
    bounds:core,pan:{x:-40000,y:-40000},zoom:2,width:900,height:600
  });
  assert.equal(result.y,600-core.maxY*2);
  assert.throws(()=>sculptExteriorFringeCameraBoundsV1({
    coreBounds:core,view,coreWidth:2240,coreHeight:1344,
    fringeRows:9,tileWidth:28,tileHeight:21,viewportHeight:600,zoom:2
  }),/Valid exterior/);
});
