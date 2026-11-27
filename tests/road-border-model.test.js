import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeWorldSurface} from '../src/world/surface-model.js';

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
