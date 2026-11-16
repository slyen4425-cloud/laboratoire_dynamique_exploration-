import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldObjectPlacement,resolveWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {worldObjectObstacleRect,buildingDoorAnchorWorld} from '../src/world/world-object-model.js';
import {listSculptPlaceableDefinitions,createBlankSculptPreviewScene,appendSculptPreviewObject,updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {copyWorldObjectAsStamp,worldObjectStampInput} from '../src/builder/world-object-stamp-preset.js';
import {createWorldObjectRenderer} from '../src/render/world-object-renderer.js';
const tree=listSculptPlaceableDefinitions().find(d=>d.kind==='tree');
const original=()=>normalizeWorldObjectPlacement({id:'tree-1',objectDefinitionId:tree.id,transform:{x:40,y:60,rotationDeg:0,scaleX:1,scaleY:1},overrides:{}});
test('mirror is optional: older WorldObject placement save shapes remain unchanged',()=>{
 assert.ok(tree);
 const normal=original();assert.equal(Object.hasOwn(normal.transform,'flipX'),false);
 const mirrored=normalizeWorldObjectPlacement({...normal,transform:{...normal.transform,flipX:true}});
 assert.equal(mirrored.transform.flipX,true);
 const back=normalizeWorldObjectPlacement({...mirrored,transform:{...mirrored.transform,flipX:false}});
 assert.deepEqual(back,normal);
 assert.equal(resolveWorldObjectPlacement(mirrored).transform.flipX,true);
});
test('Sculpt native add, select, undo and scene export/import keep one mirrored object',()=>{
 const scene=createBlankSculptPreviewScene();
 const start=appendSculptPreviewObject([],{definitionId:tree.id,x:50,y:50,flipX:true});
 assert.equal(start.length,1);assert.equal(start[0].transform.flipX,true);
 const restore=updateSculptPreviewObject(start,start[0].id,{flipX:false});
 assert.equal(restore[0].transform.flipX,undefined);
 assert.deepEqual(updateSculptPreviewObject(restore,restore[0].id,{flipX:false})[0],restore[0]);
 const again=updateSculptPreviewObject(restore,restore[0].id,{flipX:true});
 const parsed=importSculptPreviewScene(serializeSculptPreviewScene(scene.terrain,again,scene.surface));
 assert.equal(parsed.objects[0].transform.flipX,true);
 assert.equal(parsed.objects[0].transform.x,50);
 assert.equal(parsed.objects[0].objectDefinitionId,tree.id);
});
test('World Builder copied placement keeps orientation and original asset authority',()=>{
 const orig=original();
 const mirrored=normalizeWorldObjectPlacement({...orig,transform:{...orig.transform,flipX:true}});
 const copy=copyWorldObjectAsStamp(mirrored);assert.equal(copy.flipX,true);
 const input=worldObjectStampInput({definitionId:tree.id,preset:copy,point:{x:15,y:15},area:{width:100,height:100}});
 assert.equal(input.transform.flipX,true);assert.equal(input.objectDefinitionId,tree.id);
 const reset=worldObjectStampInput({definitionId:tree.id,point:{x:15,y:15},area:{width:100,height:100}});
 assert.equal(Object.hasOwn(reset.transform,'flipX'),false);
});
test('mirror follows asymmetric obstacle offsets and linked building door anchors',()=>{
 const building={kind:'building',transform:{x:100,y:100,rotationDeg:0,scaleX:1,scaleY:1},
  baseSize:{width:100,height:100},collision:{role:'obstacle',shape:'box',offsetX:.2,offsetY:0},
  footprint:{enabled:true},doorAnchors:[{id:'front',x:.4,y:.2}]};
 const plainFoot=worldObjectObstacleRect(building),plainDoor=buildingDoorAnchorWorld(building,'front');
 const mirrored={...building,transform:{...building.transform,flipX:true}};
 const mirrorFoot=worldObjectObstacleRect(mirrored),mirrorDoor=buildingDoorAnchorWorld(mirrored,'front');
 assert.equal(plainFoot.x,120);assert.equal(mirrorFoot.x,80);
 assert.equal(plainDoor.x,140);assert.equal(mirrorDoor.x,60);
 assert.equal(mirrorFoot.y,plainFoot.y);
});
test('native canvas mirrors the existing shadow silhouette/fallback AND the sprite',()=>{
 const base=original();
 const placement=normalizeWorldObjectPlacement({...base,transform:{...base.transform,flipX:true}});
 const ev=[];
 const ctx={save(){ev.push('save')},restore(){ev.push('restore')},translate(){ev.push('translate')},
 rotate(){ev.push('rotate')},scale(x,y){ev.push(['scale',x,y])},beginPath(){},ellipse(){ev.push('shadow')},
 fill(){},drawImage(){ev.push('sprite')},set fillStyle(_){},set globalAlpha(_){}};
 const renderer=createWorldObjectRenderer({imageLoader:{get(){return {width:100,height:150}}},
  resolveVisualAsset(){return {render:{}}}});
 renderer.draw(ctx,{camera:{x:0,y:0},viewport:{width:1000,height:1000},objects:[placement]});
 const index=ev.findIndex(x=>Array.isArray(x)&&x[0]==='scale'&&x[1]===-1&&x[2]===1);
 assert.ok(index>=0);assert.ok(ev.indexOf('shadow')>index,'shadow mirrors first');
 assert.ok(ev.indexOf('sprite')>ev.indexOf('shadow'),'sprite painted after native shadow');
 assert.equal(placement.transform.x,40);assert.equal(placement.transform.y,60);
});
test('both authoring interfaces expose mirror, frozen V80 has no new control',()=>{
 const sculpt=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const builder=readFileSync(new URL('../builder.html',import.meta.url),'utf8');
 const scene=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const world=readFileSync(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
 assert.match(sculpt,/id="object-flip-x"/);assert.match(builder,/id="object-flip-x"/);
 assert.ok(scene.includes('ctx.scale(object.transform?.flipX===true?-1:1,1)'));
 assert.ok(world.includes("flipX: $('object-flip-x').checked"));
 assert.equal(readFileSync(new URL('../sculpt-lab-v80.html',import.meta.url),'utf8').includes('object-flip-x'),false);
});
