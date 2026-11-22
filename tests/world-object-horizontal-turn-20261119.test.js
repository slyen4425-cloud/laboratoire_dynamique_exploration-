import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeWorldObjectPlacement} from '../src/world/world-object-placement-model.js';
import {worldObjectHorizontalTurnEnabledV1,worldObjectHorizontalTurnScaleXV1} from '../src/world/world-object-horizontal-turn-v1.js';
import {listSculptPlaceableDefinitions,createBlankSculptPreviewScene,appendSculptPreviewObject,updateSculptPreviewObject,serializeSculptPreviewScene,importSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createWorldObjectRenderer} from '../src/render/world-object-renderer.js';

const tree=listSculptPlaceableDefinitions().find(x=>x.kind==='tree');
function placement(rotationDeg=0) {
  return normalizeWorldObjectPlacement({id:'tree-1',objectDefinitionId:tree.id,
    transform:{x:60,y:90,rotationDeg,scaleX:1,scaleY:1},overrides:{}});
}

test('legacy placements retain planar rotation; new opt-in is retained across normalization',()=>{
  assert.ok(tree);
  const old=placement(45);
  assert.equal(Object.hasOwn(old.transform,'rotationAxis'),false);
  const yaw=normalizeWorldObjectPlacement({...old,transform:{...old.transform,rotationAxis:'horizontal'}});
  assert.equal(yaw.transform.rotationAxis,'horizontal');
  assert.equal(worldObjectHorizontalTurnEnabledV1({...yaw,kind:'tree'}),true);
  assert.equal(worldObjectHorizontalTurnEnabledV1({...yaw,kind:'bridge'}),false);
  assert.equal(worldObjectHorizontalTurnEnabledV1({...old,kind:'tree'}),false);
  assert.ok(Math.abs(worldObjectHorizontalTurnScaleXV1(0)-1)<1e-10);
  assert.ok(Math.abs(worldObjectHorizontalTurnScaleXV1(90))<1e-10);
  assert.ok(Math.abs(worldObjectHorizontalTurnScaleXV1(180)+1)<1e-10);
});

test('Sculpt authoring stores yaw on moved objects, retains undo-friendly old model and round-trips scene',()=>{
  const scene=createBlankSculptPreviewScene();
  const fresh=appendSculptPreviewObject([],{definitionId:tree.id,x:50,y:50,rotationDeg:0});
  assert.equal(fresh[0].transform.rotationAxis,undefined);
  const turned=updateSculptPreviewObject(fresh,fresh[0].id,{rotationDeg:90});
  assert.equal(turned[0].transform.rotationAxis,'horizontal');
  assert.equal(fresh[0].transform.rotationAxis,undefined);
  const restored=importSculptPreviewScene(serializeSculptPreviewScene(scene.terrain,turned,scene.surface));
  assert.equal(restored.objects[0].transform.rotationAxis,'horizontal');
  assert.equal(restored.objects[0].transform.rotationDeg,90);
  const placedAt45=appendSculptPreviewObject([],{definitionId:tree.id,x:70,y:80,rotationDeg:45});
  assert.equal(placedAt45[0].transform.rotationAxis,'horizontal');
});

test('the same native renderer turns sprite and silhouette around screen Y without tipping legacy sprites',()=>{
  const mock=(object)=>{
    const ev=[];
    const ctx={save(){ev.push('save')},restore(){ev.push('restore')},translate(){ev.push('translate')},
      rotate(deg){ev.push(['rotate',deg])},scale(x,y){ev.push(['scale',x,y])},
      beginPath(){},ellipse(){ev.push('shadow')},fill(){},drawImage(){ev.push('sprite')},
      set fillStyle(_){},set globalAlpha(_){}};
    const renderer=createWorldObjectRenderer({imageLoader:{get(){return {width:100,height:150}}},
      resolveVisualAsset(){return {render:{}}}});
    renderer.draw(ctx,{camera:{x:0,y:0},viewport:{width:2000,height:2000},objects:[object]});
    return ev;
  };
  const old=placement(30);
  const oldEvents=mock(old);
  assert.ok(oldEvents.some(x=>Array.isArray(x)&&x[0]==='rotate'&&Math.abs(x[1])>0.1));
  const rotated=normalizeWorldObjectPlacement({...old,transform:{...old.transform,rotationAxis:'horizontal'}});
  const ev=mock(rotated);
  const c=Math.cos(Math.PI/6);
  const pos=ev.findIndex(x=>Array.isArray(x)&&x[0]==='scale'&&Math.abs(x[1]-c)<1e-9);
  assert.ok(pos>=0,'horizontal projection is applied before shadow and sprite');
  assert.ok(ev.indexOf('shadow')>pos);
  assert.ok(ev.indexOf('sprite')>ev.indexOf('shadow'));
  assert.equal(ev.some(x=>Array.isArray(x)&&x[0]==='rotate'&&Math.abs(x[1])>0.1),false);
});

test('World Builder and Sculpt share one rotation field, no V80 modification',()=>{
  const world=readFileSync(new URL('../src/builder/world-builder-draft.js',import.meta.url),'utf8');
  const sculpt=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  assert.match(world,/rotationAxis = 'horizontal'/);
  assert.match(sculpt,/worldObjectHorizontalTurnEnabledV1\(object\)/);
  assert.match(html,/Orientation horizontale/);
  assert.doesNotMatch(readFileSync(new URL('../sculpt-lab-v80.html',import.meta.url),'utf8'),/Orientation horizontale/);
});
