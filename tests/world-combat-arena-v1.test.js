import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createBlankWorldBuilderDraft,
  createBuildingInteriorLink,
  createWorldBuilderDraft,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  setWorldCombatArena
} from '../src/builder/world-builder-draft.js';
import {worldCombatArenaIdsV1} from '../src/world/world-combat-arena-v1.js';
import {snapshotFromEncounterIntent} from '../src/encounters/encounter-bridge.js';
import {createCombatHandoffEnvelope, readCombatHandoff, saveCombatHandoff} from '../src/encounters/combat-handoff-store.js';

function worldWithBuilding() {
  let world = createBlankWorldBuilderDraft({id:'arenes', width:1008, height:504});
  const exterior = world.areas[0];
  exterior.objects = [{
    id:'maison',
    objectDefinitionId:'objectdef.building.house.blue_cottage.01',
    transform:{x:600,y:260}
  }];
  world = createBuildingInteriorLink(world, {
    sourceAreaId:exterior.id,
    buildingId:'maison',
    interiorSize:{width:504,height:294}
  });
  return createWorldBuilderDraft(world);
}

test('an authored combat backdrop survives WorldDocument export and import at every scope', () => {
  let world = worldWithBuilding();
  const [exterior, interior] = world.areas;
  world = setWorldCombatArena(world, {arenaId:'forest'});
  world = setWorldCombatArena(world, {areaId:exterior.id, arenaId:'city'});
  world = setWorldCombatArena(world, {areaId:interior.id, arenaId:'cave'});
  world = setWorldCombatArena(world, {areaId:exterior.id, buildingId:'maison', arenaId:'snow'});

  const imported = importWorldBuilderDocument(serializeWorldBuilderDraft(world));
  assert.equal(imported.defaultCombatArenaId, 'forest');
  assert.equal(imported.areas[0].encounters.combatArenaId, 'city');
  assert.equal(imported.areas[0].objects[0].overrides.combatArenaId, 'snow');
  assert.equal(imported.areas[1].encounters.combatArenaId, 'cave');
  assert.deepEqual(imported.portals, world.portals);
  assert.deepEqual(worldCombatArenaIdsV1(imported, imported.areas[0]), ['city','forest']);
  assert.deepEqual(worldCombatArenaIdsV1(imported, imported.areas[1]), ['cave','snow','city','forest']);

  const inherit = setWorldCombatArena(imported, {areaId:interior.id, arenaId:''});
  assert.deepEqual(worldCombatArenaIdsV1(inherit, inherit.areas[1]), ['snow','city','forest']);
  const noBuilding = setWorldCombatArena(inherit, {areaId:exterior.id, buildingId:'maison', arenaId:''});
  assert.deepEqual(worldCombatArenaIdsV1(noBuilding, noBuilding.areas[1]), ['city','forest']);
});

test('wild and trainer handoffs preserve the backdrop chain and legacy handoffs keep their shape', () => {
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value)
  };
  const intent = {
    encounterId:'encounter-1', returnToken:'return-1', playerPartyRef:'party',
    areaId:'outside', opponentCreatureId:'crea_nat_1', opponentLevel:5,
    terrainFamilyId:'plain', elementId:'nature', rulesetId:'capture.standard.1v1'
  };
  const legacy = snapshotFromEncounterIntent(intent);
  assert.equal(Object.hasOwn(legacy.context, 'combatArenaIds'), false);
  for (const source of ['terrain-random','npc-trainer']) {
    data.clear();
    const snapshot = snapshotFromEncounterIntent({...intent,source}, {
      combatArenaIds:['unavailable-old-backdrop','city','city',null,'forest']
    });
    const envelope = createCombatHandoffEnvelope({snapshot,returnState:{
      areaId:'outside',x:100,y:150,returnUrl:'https://example.test/sculpt-lab.html'
    }});
    saveCombatHandoff(storage, envelope);
    assert.deepEqual(readCombatHandoff(storage).snapshot, snapshot);
    assert.deepEqual(snapshot.context.combatArenaIds, ['unavailable-old-backdrop','city','forest']);
  }
});
