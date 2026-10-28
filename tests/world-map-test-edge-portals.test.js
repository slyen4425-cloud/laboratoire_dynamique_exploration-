import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {builtinSculptMapPresets} from '../src/builder/sculpt-builtin-map-presets.js';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {createWorldAreaFromSculptMapPreset} from '../src/builder/sculpt-map-preset-library.js';
import {findTriggeredPortal,applyPortalTransition} from '../src/world/portal-model.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';
import {sculptWaterAt} from '../src/world/sculpt-height-model.js';

test('each native map links to its host using distinct edge entry and exit with real two-way traversal',()=>{
 for(const preset of builtinSculptMapPresets()){
  const host=createBlankWorldBuilderDraft({id:'essai',width:36*28,height:24*21});
  const document=createWorldAreaFromSculptMapPreset(host,preset,{
    name:preset.name,kind:'exterior',hostAreaId:host.initialAreaId});
  const houses=document.areas[1].objects.filter(o=>o.objectDefinitionId.includes('.building.')).length;
  assert.equal(document.areas.length,2+houses,preset.name+' and its interior rooms');
  assert.equal(document.portals.length,2+2*houses,'each house and map route requires reciprocal real Portals: '+preset.name);
  const area=document.areas[1];
  const spawn=area.spawns[0];
  assert.ok(spawn.x<area.width*.2,preset.name+' entry should be near left boundary');
  const outbound=document.portals.find(p=>p.sourceAreaId===area.id);
  assert.ok(outbound.trigger.x>area.width*.8,preset.name+' exit should be near right boundary');
  assert.ok(Math.abs(spawn.x-outbound.trigger.x)>area.width*.6,preset.name+' must cross the map');
  const scene=sculptWorldAreaScene(area);
  for(const point of [spawn,outbound.trigger]){
    const col=Math.floor(point.x/28),row=Math.floor(point.y/21);
    assert.equal(sculptWaterAt(scene.terrain,col,row),0,preset.name+' wet gateway');
  }
  const leaving=findTriggeredPortal(document,area.id,outbound.trigger);
  assert.ok(leaving,preset.name+' must have a usable active exit');
  const arrived=applyPortalTransition(document,{currentAreaId:area.id,...outbound.trigger},leaving);
  assert.equal(arrived.currentAreaId,host.initialAreaId);
  assert.ok(arrived.x<host.areas[0].width*.2,'host return arrival must be an edge');
  const hostGate=document.portals.find(p=>p.sourceAreaId===host.initialAreaId);
  const entering=findTriggeredPortal(document,host.initialAreaId,hostGate.trigger);
  assert.ok(entering,preset.name+' host gate must be interactive');
  const entered=applyPortalTransition(document,{currentAreaId:host.initialAreaId,...hostGate.trigger},entering);
  assert.equal(entered.currentAreaId,area.id);
  assert.equal(entered.x,spawn.x);assert.equal(entered.y,spawn.y);
  assert.ok(serializeWorldBuilderDraft(document).includes(area.id));
 }
});

test('test options collapse by default and remain reopenable from the playfield',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/<details id="navigation-hud"[^>]*hidden>/);
 assert.match(html,/<summary[^>]*>[^<]*Options[^<]*<\/summary>/);
 assert.match(html,/#navigation-hud:not\(\[open\]\)/);
 assert.match(script,/\$\('navigation-hud'\)\.open=false/);
});
