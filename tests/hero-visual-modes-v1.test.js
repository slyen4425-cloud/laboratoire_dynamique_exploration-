import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMapActorVisual} from '../src/actors/map-actor-visual-model.js';
import {createMapActorRenderer} from '../src/render/map-actor-renderer.js';

const source=id=>({id,width:40,height:60});
function mockDraw(visual,actor={moving:true,facingX:1,x:100,y:50},timeSeconds=0){
 const drawn=[],moves=[],ctx={
  save(){},restore(){},beginPath(){},ellipse(){},fill(){},
  translate(...v){moves.push(v)},scale(...v){moves.push(['scale',...v])},
  drawImage(source,...rest){drawn.push({id:source.id,args:rest})}
 };
 const visuals=new Map([['hero.base',{source:source('hero.base'),anchor:{x:0.5,y:1},aspectRatio:2/3}],
  ...['hero.idle1','hero.idle2','hero.walk1','hero.walk2','hero.walk3'].map(id=>
   [id,{source:source(id),anchor:{x:.5,y:1},aspectRatio:2/3}])]);
 createMapActorRenderer({preparedVisuals:{get:id=>visuals.get(id)}}).draw(ctx,{
  camera:{x:0,y:0},actors:[{...actor,mapVisual:visual}],timeSeconds
 });
 return {drawn,moves,actor};
}
const animated=()=>normalizeMapActorVisual({assetId:'hero.base',role:'hero',shadow:{enabled:false},
 animation:{mode:'frames',framesPerSecond:4,
 idle:['hero.idle1','hero.idle2'],walk:['hero.walk1','hero.walk2','hero.walk3']}});
test('historic single image uses existing simulated idle/walk bob, without an animation catalog',()=>{
 const v=normalizeMapActorVisual({assetId:'hero.base',role:'hero'});
 assert.equal(v.animation.mode,'image');
 const d=mockDraw(v);
 assert.equal(d.drawn[0].id,'hero.base');
 const move=mockDraw(v,{x:100,y:50,moving:true,facingX:1},.1);
 assert.notEqual(move.moves[0][1],50,'existing simulated walk bob remains visible');
});
test('sprite option chooses actual idle and moving frames from prepared official asset IDs',()=>{
 const v=animated();
 assert.deepEqual(v.animation.walk,['hero.walk1','hero.walk2','hero.walk3']);
 assert.equal(mockDraw(v,{x:100,y:50,moving:false,facingX:1},0).drawn[0].id,'hero.idle1');
 assert.equal(mockDraw(v,{x:100,y:50,moving:false,facingX:1},.3).drawn[0].id,'hero.idle2');
 assert.equal(mockDraw(v,{x:100,y:50,moving:true,facingX:1},0).drawn[0].id,'hero.walk1');
 assert.equal(mockDraw(v,{x:100,y:50,moving:true,facingX:1},.26).drawn[0].id,'hero.walk2');
 assert.equal(mockDraw(v,{x:100,y:50,moving:true,facingX:1},.52).drawn[0].id,'hero.walk3');
 assert.equal(mockDraw(v,{x:100,y:50,moving:true,facingX:1},.77).drawn[0].id,'hero.walk1');
});
test('sprite mode does not add simulated bob, alter actor world coords or replace mirror policy',()=>{
 const v=animated();
 const actor={x:100,y:50,moving:true,facingX:-1};
 const before=JSON.stringify(actor);
 const d=mockDraw(v,actor,.3);
 assert.deepEqual(d.moves[0],[100,50]);
 assert.ok(d.moves.some(x=>x[0]==='scale'&&x[1]===-1));
 assert.equal(JSON.stringify(actor),before);
});
test('missing idle animation uses canonical still asset without inventing frames',()=>{
 const v=normalizeMapActorVisual({assetId:'hero.base',
  animation:{mode:'frames',framesPerSecond:5,walk:['hero.walk1','hero.walk2']}});
 assert.equal(mockDraw(v,{x:100,y:50,moving:false,facingX:1}).drawn[0].id,'hero.base');
 assert.equal(mockDraw(v).drawn[0].id,'hero.walk1');
});
test('hero sprite authoring rejects malformed references, duplicated assets and nonsensical speed',()=>{
 for(const animation of [
  {mode:'other'}, {mode:'frames',framesPerSecond:0,walk:['hero.walk1']},
  {mode:'frames',framesPerSecond:90,walk:['hero.walk1']},
  {mode:'frames',framesPerSecond:4,walk:['hero.walk1','hero.walk1']},
  {mode:'frames',framesPerSecond:4,walk:['unsafe/path.png']},
  {mode:'frames',framesPerSecond:4,walk:[]},
  {mode:'frames',framesPerSecond:4,walk:['hero.walk1'],unknown:3}
 ])assert.throws(()=>normalizeMapActorVisual({assetId:'hero.base',animation}));
});
