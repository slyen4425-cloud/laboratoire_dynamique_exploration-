import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWorldTriggerGeometry,
  resolveWorldTriggerPoint,
  worldTriggerContainsPoint
} from '../src/world/world-trigger-geometry.js';
import {
  normalizeWorldDocument
} from '../src/world/world-document-model.js';

test('shared trigger geometry normalizes a free point', () => {
  const trigger = normalizeWorldTriggerGeometry({
    kind: 'point',
    x: 120,
    y: 240,
    radius: 36
  });

  assert.deepEqual(trigger, {
    kind: 'point',
    x: 120,
    y: 240,
    radius: 36
  });
});

test('legacy building-door trigger migrates to shared object-anchor geometry', () => {
  const trigger = normalizeWorldTriggerGeometry({
    kind: 'building-door',
    objectId: 'house-1',
    anchorId: 'main-door',
    radius: 30
  });

  assert.deepEqual(trigger, {
    kind: 'object-anchor',
    objectId: 'house-1',
    anchorId: 'main-door',
    radius: 30
  });
});

test('object-anchor trigger resolves from Object Catalog geometry, never pixels', () => {
  const document = normalizeWorldDocument({
    areas: [
      {
        id: 'outside',
        width: 800,
        height: 600,
        surface: { baseMaterialId: 'grass.forest' },
        spawns: [{ id: 'start', x: 50, y: 50 }],
        objects: [
          {
            id: 'house-1',
            objectDefinitionId:
              'objectdef.building.house.fantasy_wood_stone.01',
            transform: {
              x: 300,
              y: 300,
              rotationDeg: 90,
              scaleX: 1,
              scaleY: 1
            },
            overrides: {
              traversalSurfaceFeatureIds: []
            }
          }
        ]
      }
    ],
    initialAreaId: 'outside',
    initialSpawnId: 'start'
  });

  const trigger = normalizeWorldTriggerGeometry({
    kind: 'object-anchor',
    objectId: 'house-1',
    anchorId: 'main-door',
    radius: 30
  });
  const point = resolveWorldTriggerPoint(
    document.areas[0],
    trigger
  );

  assert.ok(Math.abs(point.x - 186) < 1e-9);
  assert.ok(Math.abs(point.y - 300) < 1e-9);
  assert.equal(point.radius, 30);
});

test('shared trigger geometry owns containment detection', () => {
  const trigger = {
    kind: 'point',
    x: 100,
    y: 100,
    radius: 20
  };

  assert.equal(
    worldTriggerContainsPoint(
      { x: 100, y: 119 },
      trigger
    ),
    true
  );
  assert.equal(
    worldTriggerContainsPoint(
      { x: 100, y: 121 },
      trigger
    ),
    false
  );
});

test('Portal normalization consumes shared trigger geometry', async () => {
  const {
    normalizePortal
  } = await import('../src/world/portal-model.js');

  const portal = normalizePortal({
    id: 'enter',
    sourceAreaId: 'outside',
    trigger: {
      kind: 'building-door',
      objectId: 'house-1',
      anchorId: 'main-door',
      radius: 30
    },
    targetAreaId: 'inside',
    targetSpawnId: 'entry'
  });

  assert.equal(portal.trigger.kind, 'object-anchor');
});


test('Portal model contains no private trigger distance or Building anchor resolver', async () => {
  const { readFile } = await import('node:fs/promises');
  const source = await readFile(
    new URL('../src/world/portal-model.js', import.meta.url),
    'utf8'
  );

  assert.equal(source.includes('buildingDoorAnchorWorld'), false);
  assert.equal(source.includes('dx * dx + dy * dy'), false);
  assert.match(source, /resolveWorldTriggerPoint/);
  assert.match(source, /worldTriggerContainsPoint/);
});
