import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWorldDocument } from '../src/world/world-document-model.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';
import { createWorldTraversalRuleRegistry, resolveSurfaceTraversal } from '../src/core/surface-traversal.js';
import { stepMovement } from '../src/core/movement.js';
import { createWorldBuilderDraft, updateTerrainFamilyDefinition, serializeWorldBuilderDraft, importWorldBuilderDocument } from '../src/builder/world-builder-draft.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import fs from 'node:fs';

const actor = (x, y, modes = ['ground']) => ({ x, y, radius: 5, locomotion: { modes } });

test('legacy document preserves ground 100%, route 125%, water swim 75% and fly 100%', () => {
  const doc = normalizeWorldDocument(demoWorldDocument);
  const registry = createWorldTraversalRuleRegistry(doc);
  assert.equal(registry.require('terrain.family.forest').modes.ground, 1);
  assert.equal(registry.require('terrain.family.road').modes.ground, 1.25);
  assert.equal(registry.require('terrain.family.sea').modes.swim, 0.75);
  assert.equal(registry.require('terrain.family.sea').modes.ground, undefined);
  assert.equal(registry.require('terrain.family.sea').modes.fly, 1);
  assert.equal(registry.require('terrain.bridge').modes.ground, 1);
});

test('different painted families change speed through the same movement core', () => {
  const doc = normalizeWorldDocument({
    terrainFamilies: [
      { id: 'forest', label: 'Forêt', paintKind: 'terrain', traversalModes: { ground: 0.6, fly: 1 } },
      { id: 'snow', label: 'Neige', paintKind: 'terrain', traversalModes: { ground: 0.4, fly: 1 } },
      { id: 'road', label: 'Route', paintKind: 'route', traversalModes: { ground: 1.5, fly: 1 } },
      { id: 'sea', label: 'Mer', paintKind: 'river', traversalModes: { swim: 0.8, fly: 1 } }
    ],
    areas: [{ id: 'outside', width: 1000, height: 1000, surface: {
      baseTerrainFamilyId: 'forest',
      zones: [{ id: 'snow-paint', width: 150, terrainFamilyId: 'snow', materialId: 'snow.visual.only', points: [{ x: 100, y: 300 }, { x: 700, y: 300 }] }],
      routes: [{ id: 'road-path', width: 70, terrainFamilyId: 'road', points: [{ x: 100, y: 500 }, { x: 700, y: 500 }] }],
      rivers: [{ id: 'sea-path', width: 70, terrainFamilyId: 'sea', points: [{ x: 100, y: 700 }, { x: 700, y: 700 }] }]
    }, spawns: [{ id: 'start', x: 100, y: 100 }] }]
  });
  const world = doc.areas[0];
  const registry = createWorldTraversalRuleRegistry(doc);
  const snow = resolveSurfaceTraversal(world, actor(200, 300), 200, 300, registry);
  assert.equal(snow.featureKind, 'zone');
  assert.equal(snow.ruleId, 'terrain.family.snow');
  assert.equal(snow.speedMultiplier, 0.4);
  assert.equal(resolveSurfaceTraversal(world, actor(200, 100), 200, 100, registry).speedMultiplier, 0.6);
  assert.equal(resolveSurfaceTraversal(world, actor(200, 500), 200, 500, registry).speedMultiplier, 1.5);
  assert.equal(resolveSurfaceTraversal(world, actor(200, 700, ['swim']), 200, 700, registry).speedMultiplier, 0.8);
  assert.equal(resolveSurfaceTraversal(world, actor(200, 700), 200, 700, registry).passable, false);
  const moving = actor(200, 300);
  stepMovement(world, moving, { x: 1, y: 0 }, 1, { maxSpeed: 100 }, registry);
  assert.equal(moving.x, 240);
});

test('overlap resolution remains deterministic with river above route above painted zone', () => {
  const doc = normalizeWorldDocument({
    areas: [{ id: 'overlap', width: 800, height: 800, surface: {
      baseTerrainFamilyId: 'forest',
      zones: [{ id:'zone', width: 300, terrainFamilyId: 'snow', points: [{x:0,y:200},{x:800,y:200}] }],
      routes: [{ id:'route', width: 180, terrainFamilyId: 'road', points: [{x:0,y:200},{x:800,y:200}] }],
      rivers: [{ id:'river', width: 80, terrainFamilyId: 'sea', points: [{x:0,y:200},{x:800,y:200}] }]
    }, spawns: [{id:'start',x:100,y:100}] }]
  });
  const registry=createWorldTraversalRuleRegistry(doc);
  const world=doc.areas[0];
  assert.equal(resolveSurfaceTraversal(world,actor(100,200,['swim']),100,200,registry).featureKind,'river');
  assert.equal(resolveSurfaceTraversal(world,actor(100,270),100,270,registry).featureKind,'route');
  assert.equal(resolveSurfaceTraversal(world,actor(100,320),100,320,registry).featureKind,'zone');
});

test('Builder saves and reloads numeric family settings without changing materials', () => {
  let draft=createWorldBuilderDraft(demoWorldDocument);
  const before=draft.areas[0].surface.baseMaterialId;
  draft=updateTerrainFamilyDefinition(draft,'forest',{traversalModes:{ground:0.65,swim:0,fly:0}});
  const roundtrip=importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
  const family=roundtrip.terrainFamilies.find(x=>x.id==='forest');
  assert.deepEqual(family.traversalModes,{ground:0.65,swim:0,fly:0});
  assert.equal(roundtrip.areas[0].surface.baseMaterialId,before);
  const registry=createWorldTraversalRuleRegistry(roundtrip);
  assert.equal(registry.require('terrain.family.forest').modes.ground,0.65);
  assert.equal(registry.require('terrain.family.forest').modes.fly,undefined);
});

test('invalid multipliers fail closed to legacy family defaults without creating duplicate authorities', () => {
  const doc=normalizeWorldDocument({terrainFamilies:[{id:'road',label:'Route',paintKind:'route',traversalModes:{ground:-1,fly:Infinity}}]});
  assert.deepEqual(doc.terrainFamilies[0].traversalModes,{ground:1.25,swim:0,fly:1});
});

test('Builder exposes terrain family movement speeds, single authority, and no material-based speed', () => {
  const html=fs.readFileSync(new URL('../builder.html', import.meta.url),'utf8');
  const builder=fs.readFileSync(new URL('../src/builder/world-builder-main.js', import.meta.url),'utf8');
  const runtime=fs.readFileSync(new URL('../src/main.js', import.meta.url),'utf8');
  for(const mode of ['ground','swim','fly']){
    assert.match(html,new RegExp('id="terrain-family-speed-'+mode+'"'));
    assert.match(builder,new RegExp("terrain-family-speed-"+mode));
  }
  assert.match(runtime,/createWorldTraversalRuleRegistry\(\s*activeWorldDocument\s*\)/);
  assert.doesNotMatch(builder,/materialId\s*\*\s*speed/i);
});
