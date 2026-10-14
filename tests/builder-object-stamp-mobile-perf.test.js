import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createBlankWorldBuilderDraft,addWorldObject,validateWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument } from '../src/builder/world-builder-draft.js';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('repeated trees use canonical addWorldObject placements and round-trip',()=>{
 let world=createBlankWorldBuilderDraft();
 for(let i=0;i<3;i++)world=addWorldObject(world,world.initialAreaId,{
  objectDefinitionId:'objectdef.tree.oak.01',transform:{x:200+i*80,y:300,rotationDeg:0,scaleX:1,scaleY:1}
 });
 assert.equal(world.areas[0].objects.length,3);
 assert.equal(new Set(world.areas[0].objects.map(o=>o.id)).size,3);
 assert.equal(validateWorldBuilderDraft(world).valid,true);
 assert.equal(importWorldBuilderDocument(serializeWorldBuilderDraft(world)).areas[0].objects.length,3);
});

test('Builder offers explicit stamp and transform permission while full-screen', async()=>{
 const html=await read('builder.html'),main=await read('src/builder/world-builder-main.js');
 for(const id of ['map-tool-object','map-object-definition','map-object-transform-enabled']){
  assert.match(html,new RegExp('id="'+id+'"'));
  assert.match(main,new RegExp(id));
 }
 assert.match(main,/mapTool === 'object-stamp'/);
 assert.match(main,/\!\$\('map-object-transform-enabled'\)\.checked/);
 assert.match(main,/!isPaintKind\(mapTool\) && mapTool !== 'object-stamp'/);
 assert.match(main,/function stampSelectedWorldObject\(/);
 assert.match(main,/addWorldObject\(/);
});

test('drag object movement is coalesced per animation frame and no map focus upscale on touch',async()=>{
 const main=await read('src/builder/world-builder-main.js');
 assert.match(main,/let pendingObjectMove = null/);
 assert.match(main,/function flushPendingObjectMove\(/);
 assert.match(main,/flushPendingObjectMove\(\);/);
 const branch=main.split("if (pointerSession.mode === 'drag-object') {")[1].split('\n  if (')[0];
 assert.match(branch,/pendingObjectMove =/);
 assert.doesNotMatch(branch,/updateWorldObjectTransform\(/);
 const px=main.split('function previewPixelRatio() {')[1].split('\nfunction ')[0];
 assert.match(px,/mapFocusActive/);
 assert.doesNotMatch(px,/interacting \? 1 : 1\.5/);
});
