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

// The native raster cache uses integer cells with fractional DPR. Adjacent
// clips must meet at one physical pixel boundary without old .65 px overlaps.
test('painted dirt texture clips align on device pixels at 150% scale',()=>{
 const rects=[];
 const ctx={
   beginPath(){},clip(){},
   getTransform(){return {a:1.5,b:0,c:0,d:1.5,e:27,f:24};},
   rect(x,y,width,height){rects.push({x,y,width,height});}
 };
 const {width:w,height:h}=SCULPT_TILE;
 sculptPaintCellClipV1(ctx,0,0,w,h);
 sculptPaintCellClipV1(ctx,w,0,w,h);
 sculptPaintCellClipV1(ctx,0,h,w,h);
 const px=rect=>({left:Math.round(rect.x*1.5+27),right:Math.round((rect.x+rect.width)*1.5+27),
   top:Math.round(rect.y*1.5+24),bottom:Math.round((rect.y+rect.height)*1.5+24)});
 const [a,b,c]=rects.map(px);
 assert.equal(a.right,b.left);
 assert.equal(a.bottom,c.top);
 assert.ok(rects.every(rect=>Number.isInteger(rect.width*1.5)));
 assert.ok(rects.every(rect=>Number.isInteger(rect.height*1.5)));
});
test('skewed camera retains unmodified logical clipping bounds',()=>{
 const rects=[];
 const ctx={beginPath(){},clip(){},rect(...v){rects.push(v)},
   getTransform(){return {a:1.5,b:0.4,c:0,d:1,e:0,f:0}}};
 sculptPaintCellClipV1(ctx,0,0,SCULPT_TILE.width,SCULPT_TILE.height);
 assert.deepEqual(rects,[[0,0,SCULPT_TILE.width,SCULPT_TILE.height]]);
});
