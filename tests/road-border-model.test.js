import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldSurface} from '../src/world/surface-model.js';
import {createSculptSurface,appendSculptSurfaceStroke,eraseSculptSurfaceStroke,editSculptRoute,normalizeSculptSurface} from '../src/world/sculpt-surface-paint.js';
import {routeKnotsFromPoints} from '../src/world/road-edit-geometry-v1.js';
import {roadBorderSamples} from '../src/render/road-border-renderer-v1.js';

const route={id:'route-a',width:50,materialId:'road.dirt',terrainFamilyId:'road',
  traversalRuleId:'terrain.road',points:[{x:20,y:30},{x:80,y:40}]};
const style={assetId:'road-border.bordure_naturelle',width:8,scale:1,offset:0,spacing:2,opacity:.8};

test('legacy route stays identical and has no border field',()=>{
  const actual=normalizeWorldSurface({routes:[route]}).routes[0];
  assert.deepEqual(actual,route);
  assert.equal('border' in actual,false);
});
test('two independent sides survive JSON export/import without changing route geometry',()=>{
  const input={...route,border:{enabled:true,left:style,right:{...style,assetId:'road-border.bordure_beton'}}};
  const surface=normalizeWorldSurface({routes:[input]});
  assert.deepEqual(surface.routes[0],input);
  assert.deepEqual(normalizeWorldSurface(JSON.parse(JSON.stringify(surface))),surface);
  assert.ok(Object.isFrozen(surface.routes[0].border.left));
});
test('disabled route keeps selected style, absent side stays absent',()=>{
  const input={...route,border:{enabled:false,left:style}};
  assert.deepEqual(normalizeWorldSurface({routes:[input]}).routes[0],input);
});
test('invalid asset references fail closed and visual settings stay bounded',()=>{
  const input={...route,border:{enabled:true,left:{...style,assetId:'../../outside'},right:{...style,width:-3,opacity:99,scale:0}}};
  const result=normalizeWorldSurface({routes:[input]}).routes[0].border;
  assert.equal(result.left,undefined);
  assert.equal(result.right.width,1);
  assert.equal(result.right.opacity,1);
  assert.equal(result.right.scale,.1);
  assert.equal(normalizeWorldSurface({routes:[{...route,border:{enabled:true,left:{assetId:'https://invalid.example'}}}]}).routes[0].border,undefined);
});
test('zones and rivers do not acquire route border settings',()=>{
  const stroke={...route,border:{enabled:true,left:style}};
  const surface=normalizeWorldSurface({zones:[stroke],rivers:[stroke]});
  assert.equal('border' in surface.zones[0],false);
  assert.equal('border' in surface.rivers[0],false);
});

const straight=()=>appendSculptSurfaceStroke(createSculptSurface(),{materialId:'road.dirt',points:[{x:10,y:100},{x:290,y:100}],width:24,border:{enabled:true,left:style,right:style}});
test('drag eraser cuts a local road section and preserves the other pieces',()=>{
  const before=straight(),after=eraseSculptSurfaceStroke(before,{points:[{x:150,y:90},{x:150,y:110}],width:24,kind:'routes'});
  assert.equal(after.routes.length,2);assert.equal(after.routes[0].id,before.routes[0].id);
  assert.notEqual(after.routes[0].id,after.routes[1].id);
  assert.deepEqual(after.routes[1].border,before.routes[0].border);
  assert.equal(after.routes[1].terrainFamilyId,'road');
  assert.ok(Math.abs(after.routes[0].points.at(-1).x-126)<1e-6);
  assert.ok(Math.abs(after.routes[1].points[0].x-174)<1e-6);
  assert.deepEqual(normalizeSculptSurface(JSON.parse(JSON.stringify(after))),after);
});
test('curve handles determine canonical sampled points with bounded map coordinates',()=>{
  const before=straight(),knots=routeKnotsFromPoints([{x:5,y:10},{x:90,y:75},{x:95,y:10}],{width:100,height:100});
  const after=editSculptRoute(before,before.routes[0].id,{knots});
  assert.ok(after.routes[0].points.length>3);
  assert.ok(after.routes[0].points.every(p=>p.x>=0&&p.y>=0&&p.x<100&&p.y<100));
  assert.deepEqual(normalizeSculptSurface(JSON.parse(JSON.stringify(after))),after);
});
test('the two visual edges follow the road and suppress crossing interiors',()=>{
  const before=straight(),samples=roadBorderSamples(before.routes);
  assert.ok(samples.some(p=>p.y===88)&&samples.some(p=>p.y===112));
  const off=editSculptRoute(before,before.routes[0].id,{border:{enabled:false,left:style}});
  assert.equal(roadBorderSamples(off.routes).length,0);
  const crossing=appendSculptSurfaceStroke(before,{materialId:'road.dirt',width:28,points:[{x:150,y:20},{x:150,y:180}]});
  const result=roadBorderSamples(crossing.routes);
  assert.ok(result.length<samples.length);assert.ok(result.every(p=>Math.abs(p.x-150)>=13.99));
});
