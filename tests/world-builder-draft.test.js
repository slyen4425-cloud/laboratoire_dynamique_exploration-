import test from 'node:test';
import assert from 'node:assert/strict';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addPortal,
  addSpawn,
  addWorldObject,
  createWorldBuilderDraft,
  deletePortal,
  deleteSpawn,
  deleteWorldObject,
  duplicateWorldObject,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  updateAreaProperties,
  updatePortal,
  updateSpawn,
  updateWorldObjectTransform,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

function draft() {
  return createWorldBuilderDraft(demoWorldDocument);
}

test('Builder draft never mutates the GREEN source WorldDocument', () => {
  const source = demoWorldDocument;
  const next = updateAreaProperties(
    createWorldBuilderDraft(source),
    'forest-exterior',
    { width: 3333 }
  );

  assert.equal(source.areas[0].width, 2400);
  assert.equal(next.areas[0].width, 3333);
});

test('Builder edits Area dimensions and base material in draft data', () => {
  const next = updateAreaProperties(
    draft(),
    'house-interior-01',
    {
      width: 900,
      height: 700,
      baseMaterialId: 'floor.wood.house'
    }
  );
  const area = next.areas.find(
    (item) => item.id === 'house-interior-01'
  );

  assert.equal(area.width, 900);
  assert.equal(area.height, 700);
  assert.equal(area.surface.baseMaterialId, 'floor.wood.house');
});

test('Builder edits and adds named Spawns', () => {
  let next = updateSpawn(
    draft(),
    'forest-exterior',
    'start',
    { x: 321, y: 456 }
  );

  next = addSpawn(
    next,
    'forest-exterior',
    { x: 700, y: 800 }
  );

  const area = next.areas.find(
    (item) => item.id === 'forest-exterior'
  );

  assert.equal(area.spawns.find((item) => item.id === 'start').x, 321);
  assert.equal(area.spawns.at(-1).x, 700);
  assert.equal(area.spawns.at(-1).y, 800);
});

test('Builder refuses to delete initial or Portal-targeted Spawns', () => {
  const source = draft();

  const initialProtected = deleteSpawn(
    source,
    'forest-exterior',
    'start'
  );
  assert.equal(
    initialProtected.areas[0].spawns.some((item) => item.id === 'start'),
    true
  );

  const portalProtected = deleteSpawn(
    source,
    'house-interior-01',
    'house-entry'
  );
  const interior = portalProtected.areas.find(
    (item) => item.id === 'house-interior-01'
  );
  assert.equal(
    interior.spawns.some((item) => item.id === 'house-entry'),
    true
  );
});

test('Builder transform edits use WorldObject data, not renderer state', () => {
  const next = updateWorldObjectTransform(
    draft(),
    'forest-exterior',
    'forest-house-01',
    {
      x: 900,
      y: 1000,
      rotationDeg: 45,
      scaleX: 1.3,
      scaleY: 0.8
    }
  );

  const house = next.areas[0].objects.find(
    (item) => item.id === 'forest-house-01'
  );

  assert.deepEqual(house.transform, {
    x: 900,
    y: 1000,
    rotationDeg: 45,
    scaleX: 1.3,
    scaleY: 0.8
  });
});

test('Builder placement never owns intrinsic visual or geometry data', () => {
  const source = draft();
  const house = source.areas[0].objects.find(
    (item) =>
      item.id === 'forest-house-01'
  );

  assert.equal(
    house.objectDefinitionId,
    'objectdef.building.house.fantasy_wood_stone.01'
  );

  for (const key of [
    'visual',
    'baseSize',
    'footprint',
    'doorAnchors',
    'kind'
  ]) {
    assert.equal(
      key in house,
      false
    );
  }
});

test('Builder can duplicate an object with unique id and offset', () => {
  const next = duplicateWorldObject(
    draft(),
    'forest-exterior',
    'forest-house-01'
  );
  const houses = next.areas[0].objects.filter(
    (item) =>
      item.objectDefinitionId ===
      'objectdef.building.house.fantasy_wood_stone.01'
  );

  assert.equal(houses.length, 2);
  assert.notEqual(houses[0].id, houses[1].id);
  assert.equal(
    houses[1].transform.x,
    houses[0].transform.x + 24
  );
  assert.equal(
    houses[1].transform.y,
    houses[0].transform.y + 24
  );
});

test('Builder refuses to delete Building used by an object-anchor Portal', () => {
  const next = deleteWorldObject(
    draft(),
    'forest-exterior',
    'forest-house-01'
  );

  assert.equal(
    next.areas[0].objects.some(
      (item) => item.id === 'forest-house-01'
    ),
    true
  );
});

test('Builder adds a raw WorldObject without inventing a parallel map format', () => {
  const next = addWorldObject(
    draft(),
    'forest-exterior',
    {
      objectDefinitionId:
        'objectdef.bridge.wood.rustic_bank.01',
      transform: {
        x: 400,
        y: 400,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1
      },
      overrides: {
        traversalSurfaceFeatureIds: []
      }
    }
  );

  const result = validateWorldBuilderDraft(next);
  assert.equal(result.valid, true);
  assert.equal(result.document.areas[0].objects.length, 3);
});

test('Portal is edited only through Portal data authority', () => {
  const next = updatePortal(
    draft(),
    'portal-house-exit',
    (portal) => {
      portal.targetSpawnId = 'house-return-exterior';
      portal.visual.label = 'Retour';
    }
  );

  const portal = next.portals.find(
    (item) => item.id === 'portal-house-exit'
  );
  const house = next.areas[0].objects.find(
    (item) => item.id === 'forest-house-01'
  );

  assert.equal(portal.visual.label, 'Retour');
  assert.equal('portalRefs' in house, false);
});

test('Builder can add and remove a valid Portal draft', () => {
  let next = addPortal(
    draft(),
    {
      sourceAreaId: 'forest-exterior',
      trigger: {
        kind: 'point',
        x: 300,
        y: 300,
        radius: 28
      },
      targetAreaId: 'house-interior-01',
      targetSpawnId: 'house-entry',
      visual: {
        visible: true,
        marker: 'portal',
        label: 'Test'
      }
    }
  );

  assert.equal(next.portals.length, 3);
  const id = next.portals.at(-1).id;

  next = deletePortal(next, id);
  assert.equal(next.portals.length, 2);
});

test('Export then import preserves the validated WorldDocument', () => {
  let next = updateWorldObjectTransform(
    draft(),
    'forest-exterior',
    'forest-bridge-01',
    { rotationDeg: 135, scaleX: 1.25 }
  );

  next = updatePortal(
    next,
    'portal-house-exit',
    (portal) => {
      portal.visual.label = 'Sortie maison';
    }
  );

  const json = serializeWorldBuilderDraft(next);
  const imported = importWorldBuilderDocument(json);
  const reserialized = serializeWorldBuilderDraft(imported);

  assert.deepEqual(
    JSON.parse(reserialized),
    JSON.parse(json)
  );
});

test('Invalid Portal references block export instead of being silently lost', () => {
  const broken = updatePortal(
    draft(),
    'portal-house-enter',
    (portal) => {
      portal.targetSpawnId = 'missing-spawn';
    }
  );

  const result = validateWorldBuilderDraft(broken);
  assert.equal(result.valid, false);
  assert.ok(result.errors.includes('portal-invalid-or-duplicate'));

  assert.throws(
    () => serializeWorldBuilderDraft(broken),
    /Invalid World Builder draft/
  );
});


test('Builder cannot independently move a Spawn anchored to a Building door', () => {
  const source = draft();
  const before = source.areas[0].spawns.find(
    (spawn) => spawn.id === 'house-return-exterior'
  );

  const next = updateSpawn(
    source,
    'forest-exterior',
    'house-return-exterior',
    { x: 12, y: 34 }
  );
  const after = next.areas[0].spawns.find(
    (spawn) => spawn.id === 'house-return-exterior'
  );

  assert.deepEqual(after.anchor, before.anchor);
  assert.equal('x' in after, false);
  assert.equal('y' in after, false);
});
