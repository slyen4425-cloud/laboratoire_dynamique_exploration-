import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankSculptPreviewScene} from '../src/world/sculpt-scene-preview.js';
import {createBlankWorldBuilderDraft,addWorldArea,connectWorldAreas} from '../src/builder/world-builder-draft.js';
import {saveSculptWorldArea} from '../src/builder/sculpt-world-area-link.js';
import {
  createSculptMapPreset,importSculptMapPreset,saveSculptMapPreset,
  readSculptMapPresets,createWorldAreaFromSculptMapPreset
} from '../src/builder/sculpt-map-preset-library.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
const mem=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};};
const blank=()=>createBlankSculptPreviewScene({width:36,height:24});
test('map preset captures only a validated scene, without Portal/Spawn/WorldDocument identity',()=>{
  const p=createSculptMapPreset(blank(),{name:'  Clairière vide  '});
  assert.equal(p.name,'Clairière vide');
  assert.equal(p.scene.terrain.width,36);
  assert.equal(p.scene.terrain.height,24);
  assert.equal(p.scene.objects.length,0);
  assert.equal((p.scene.actors??[]).length,0);
  assert.ok(!('portals' in p.scene)&&!('spawns' in p.scene));
  assert.deepEqual(importSculptMapPreset(JSON.stringify(p)),p);
});
test('presets persist by name, can be overwritten and exported/imported without parallel world save',()=>{
  const storage=mem();
  const first=saveSculptMapPreset(storage,blank(),'Plaine simple');
  assert.equal(readSculptMapPresets(storage).length,1);
  const second=saveSculptMapPreset(storage,blank(),'Plaine simple');
  assert.equal(readSculptMapPresets(storage).length,1);
  assert.equal(second.id,first.id);
  assert.equal(importSculptMapPreset(JSON.stringify(second)).name,'Plaine simple');
  assert.throws(()=>importSculptMapPreset('{"kind":"world-document","areas":[]}'),/préset|format|carte/i);
});
test('creating map preset Area reuses WorldDocument, exact terrain and native Portal transition',()=>{
  let d=createBlankWorldBuilderDraft({id:'presets',width:36*28,height:24*21});
  const p=createSculptMapPreset(blank(),{name:'Crypte prête'});
  d=createWorldAreaFromSculptMapPreset(d,p,{name:'Donjon réutilisé',kind:'dungeon',hostAreaId:d.initialAreaId});
  assert.equal(d.areas.length,2);
  assert.equal(d.portals.length,2);
  assert.equal(d.areas[1].siteKind,'dungeon');
  assert.equal(d.areas[1].sculptTerrain.width,36);
  assert.equal(d.areas[1].objects.length,0);
  const exit=d.portals.find(x=>x.sourceAreaId===d.initialAreaId);
  const reached=findTriggeredPortal(d,d.initialAreaId,{x:exit.trigger.x,y:exit.trigger.y});
  assert.equal(applyPortalTransition(d,{currentAreaId:d.initialAreaId},reached).currentAreaId,d.areas[1].id);
});
test('replacing one linked area with a blank of the SAME size preserves portals and arrivals',()=>{
  let d=createBlankWorldBuilderDraft({id:'reset',width:36*28,height:24*21});
  d=addWorldArea(d,{name:'Donjon',kind:'dungeon'});
  d=connectWorldAreas(d,{sourceAreaId:d.initialAreaId,targetAreaId:d.areas[1].id,returnPortal:true});
  const before=JSON.stringify(d.portals),spawns=JSON.stringify(d.areas[0].spawns);
  d=saveSculptWorldArea(d,d.initialAreaId,blank());
  assert.equal(JSON.stringify(d.portals),before);
  assert.equal(JSON.stringify(d.areas[0].spawns),spawns);
  assert.equal(d.areas[0].sculptTerrain.width,36);
  assert.deepEqual(d.areas[0].objects,[]);
});
test('mobile test has a genuinely positioned passage action and linked new-map keeps dimensions',()=>{
  const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
  const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
  const assembler=readFileSync(new URL('../world-assembler.html',import.meta.url),'utf8');
  assert.match(html,/#world-portal-traverse\.in-game-door-action\s*\{[^}]*position:absolute/);
  assert.match(html,/#world-portal-traverse\[hidden\]/);
  assert.match(main,/button\.disabled=!portal/);
  assert.match(main,/new-map-width'\)\.disabled=!!sculptWorldDraft/);
  assert.doesNotMatch(main,/\$\('new-map-toggle'\)\.disabled=true; \/\/ never alter Area/);
  assert.match(html,/id="sculpt-map-preset-save"/);
  assert.match(html,/id="sculpt-map-preset-apply"/);
  assert.match(assembler,/id="world-map-preset-select"/);
});
