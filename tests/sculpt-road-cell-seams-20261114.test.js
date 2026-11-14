import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sculptPaintCellClipV1,SCULPT_TILE} from '../src/render/sculpt-height-renderer.js';

// Regression: a 0.65 px overlap on each painted cell re-stamps translucent
// WorldSurface dirt paths at every 28x21 grid boundary (bright/dark trails).
test('authored road/zone cells have exact non-overlapping clip bounds',()=>{
 const rects=[];
 const ctx={beginPath(){},rect(x,y,width,height){rects.push({x,y,width,height})},clip(){}};
 const {width:w,height:h}=SCULPT_TILE;
 sculptPaintCellClipV1(ctx,0,0,w,h);
 sculptPaintCellClipV1(ctx,w,0,w,h);
 sculptPaintCellClipV1(ctx,0,h,w,h);
 assert.deepEqual(rects,[{x:0,y:0,width:w,height:h},
  {x:w,y:0,width:w,height:h},{x:0,y:h,width:w,height:h}]);
 assert.equal(rects[0].x+rects[0].width,rects[1].x);
 assert.equal(rects[0].y+rects[0].height,rects[2].y);
});
test('the one native 2.5D WorldSurface painter clips routes to exact raster cells',()=>{
 const source=readFileSync(new URL('../src/render/sculpt-height-renderer.js',import.meta.url),'utf8');
 const from=source.indexOf('function sculptPaintByCell');
 const until=source.indexOf('export function sculptHillTopProfile',from);
 const painter=source.slice(from,until);
 assert.ok(from>=0&&until>from);
 assert.match(painter,/sculptPaintCellClipV1\(ctx,x,y,w,h\)/);
 assert.doesNotMatch(painter,/ctx\.rect\(x,y,w\+\.65,h\+\.65\)/);
 assert.match(painter,/feature\.points\[0\]\.x/);
 assert.match(painter,/feature\.width/);
 // No substitute geometry, no second WorldSurface or collision ownership.
 assert.doesNotMatch(painter,/new WorldSurface|new WorldDocument|localStorage/);
});
