import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {worldObjectContactShadowV1,drawWorldObjectContactShadowV1}
 from '../src/render/world-object-renderer.js';

test('one grounded contact shadow appears under buildings, trees and rocks',()=>{
 for(const kind of ['building','tree','rock']){
  const shape=worldObjectContactShadowV1({kind,width:120,height:180,pitch:.6});
  assert.ok(shape,kind);
  assert.ok(shape.radiusX>0&&shape.radiusY>0);
  assert.equal(shape.y,1);
 }
 for(const kind of ['bridge','stairs','ramp','waterfall','water','ground','portal'])
  assert.equal(worldObjectContactShadowV1({kind,width:100,height:100}),null,kind);
});
test('shadow uses the existing Canvas context, before sprites, without new state',()=>{
 const events=[];
 const ctx={save(){events.push('save')},restore(){events.push('restore')},
  beginPath(){events.push('begin')},ellipse(...args){events.push(['ellipse',...args])},
  fill(){events.push('fill')},set fillStyle(v){events.push(['fillStyle',v])}};
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'building',width:100,height:130,footOffset:3,pitch:.55}),true);
 assert.equal(events.filter(x=>x==='fill').length,1);
 assert.equal(events.find(Array.isArray)[0],'ellipse');
 assert.equal(drawWorldObjectContactShadowV1(ctx,
  {kind:'bridge',width:100,height:130}),false);
 assert.equal(drawWorldObjectContactShadowV1({},
  {kind:'building',width:100,height:130}),false);
 const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../src/render/world-object-renderer.js',import.meta.url),'utf8');
 assert.ok(main.includes('if(!foregroundRailOnly)drawWorldObjectContactShadowV1'));
 assert.ok(world.includes('drawWorldObjectContactShadowV1(ctx,{kind:object.kind'));
});
