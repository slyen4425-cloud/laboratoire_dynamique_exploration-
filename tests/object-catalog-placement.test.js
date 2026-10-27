import test from 'node:test';
import assert from 'node:assert/strict';

import {
  objectDefinitionCatalogV1
} from '../src/objects/object-definition-catalog.js';
import {
  normalizeWorldObjectPlacements,
  resolveWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';
import {
  addWorldObject
} from '../src/builder/world-builder-draft.js';
import { demoWorldDocument } from '../src/world/demo-world.js';

test('Object Catalog owns intrinsic WorldObject definition data', () => {
  const bridge = objectDefinitionCatalogV1.require(
    'objectdef.bridge.wood.rustic_bank.01'
  );
  const house = objectDefinitionCatalogV1.require(
    'objectdef.building.house.fantasy_wood_stone.01'
  );

  assert.equal(bridge.kind, 'bridge');
  assert.equal(
    bridge.visual.assetId,
    'object.bridge.wood.rustic_bank.01'
  );
  assert.equal(bridge.baseSize.length, 170);
  assert.equal(house.kind, 'building');
  assert.equal(house.doorAnchors[0].id, 'main-door');
});

test('WorldObject placement stores reference + transform + local overrides only', () => {
  const placement = normalizeWorldObjectPlacements([
    {
      id: 'bridge-1',
      objectDefinitionId: 'objectdef.bridge.wood.rustic_bank.01',
      transform: {
        x: 200,
        y: 300,
        rotationDeg: 90,
        scaleX: 1.2,
        scaleY: 0.8
      },
      overrides: {
        traversalSurfaceFeatureIds: ['river-1']
      },
      visual: { assetId: 'must-not-survive' },
      baseSize: { length: 999, width: 999 },
      kind: 'bridge'
    }
  ])[0];

  assert.deepEqual(Object.keys(placement).sort(), [
    'id',
    'objectDefinitionId',
    'overrides',
    'schemaVersion',
    'transform'
  ]);
  assert.equal('visual' in placement, false);
  assert.equal('baseSize' in placement, false);
  assert.equal('kind' in placement, false);
});

test('resolved WorldObject derives intrinsic data from catalog and local data from placement', () => {
  const placement = normalizeWorldObjectPlacements([
    {
      id: 'bridge-1',
      objectDefinitionId: 'objectdef.bridge.wood.rustic_bank.01',
      transform: {
        x: 200,
        y: 300,
        rotationDeg: 90,
        scaleX: 1.2,
        scaleY: 0.8
      },
      overrides: {
        traversalSurfaceFeatureIds: ['river-1']
      }
    }
  ])[0];

  const resolved = resolveWorldObjectPlacement(
    placement,
    objectDefinitionCatalogV1
  );

  assert.equal(resolved.kind, 'bridge');
  assert.equal(
    resolved.visual.assetId,
    'object.bridge.wood.rustic_bank.01'
  );
  assert.equal(resolved.transform.x, 200);
  assert.deepEqual(
    resolved.traversal.overridesSurfaceFeatureIds,
    ['river-1']
  );
});

test('demo WorldDocument persists placements without copied intrinsic object data', () => {
  for (const area of demoWorldDocument.areas) {
    for (const placement of area.objects) {
      assert.equal(typeof placement.objectDefinitionId, 'string');
      for (const forbidden of [
        'kind',
        'visual',
        'baseSize',
        'footprint',
        'doorAnchors',
        'traversal'
      ]) {
        assert.equal(forbidden in placement, false);
      }
    }
  }
});

test('Builder adds a WorldObject by definition reference only', () => {
  const next = addWorldObject(
    JSON.parse(JSON.stringify(demoWorldDocument)),
    'forest-exterior',
    {
      objectDefinitionId:
        'objectdef.bridge.stone.medieval_bank.01',
      transform: {
        x: 500,
        y: 500,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1
      },
      overrides: {
        traversalSurfaceFeatureIds: []
      }
    }
  );

  const placement = next.areas[0].objects.at(-1);

  assert.equal(
    placement.objectDefinitionId,
    'objectdef.bridge.stone.medieval_bank.01'
  );
  assert.equal('visual' in placement, false);
  assert.equal('kind' in placement, false);
});
