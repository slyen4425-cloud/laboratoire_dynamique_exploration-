import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWorldArea,
  normalizeWorldAreas,
  findWorldAreaSpawn
} from '../src/world/world-area-model.js';
import {
  normalizeWorldDocument,
  createInitialExplorationState,
  findWorldAreaById
} from '../src/world/world-document-model.js';
import {
  applyPortalTransition,
  findTriggeredPortal,
  resolvePortalTriggerPoint
} from '../src/world/portal-model.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { stepMovement } from '../src/core/movement.js';

function makeDocument() {
  return normalizeWorldDocument({
    id: 'portal-test-world',
    initialAreaId: 'outside',
    initialSpawnId: 'start',
    areas: [
      {
        id: 'outside',
        kind: 'exterior',
        width: 800,
        height: 600,
        surface: { baseMaterialId: 'grass.forest' },
        spawns: [
          { id: 'start', x: 80, y: 80 },
          { id: 'return', x: 300, y: 420 }
        ],
        objects: [
          {
            id: 'house-1',
            kind: 'building',
            transform: {
              x: 300,
              y: 300,
              rotationDeg: 90,
              scaleX: 1,
              scaleY: 1
            },
            baseSize: {
              width: 200,
              height: 160
            },
            doorAnchors: [
              {
                id: 'main-door',
                x: 0,
                y: 0.5
              }
            ],
            portalRefs: [
              {
                doorAnchorId: 'main-door',
                portalId: 'enter'
              }
            ]
          }
        ]
      },
      {
        id: 'inside',
        kind: 'interior',
        width: 500,
        height: 400,
        surface: { baseMaterialId: 'road.dirt' },
        spawns: [
          { id: 'entry', x: 250, y: 280 }
        ]
      }
    ],
    portals: [
      {
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
      },
      {
        id: 'exit',
        sourceAreaId: 'inside',
        trigger: {
          kind: 'point',
          x: 250,
          y: 360,
          radius: 24
        },
        targetAreaId: 'outside',
        targetSpawnId: 'return'
      }
    ]
  });
}

test('WorldArea v3 normalizes dimensions, surface, objects, actors and named spawns', () => {
  const area = normalizeWorldArea({
    id: 'home',
    kind: 'interior',
    width: 640,
    height: 480,
    surface: { baseMaterialId: 'road.dirt' },
    spawns: [
      { id: 'entry', x: 320, y: 400 }
    ]
  });

  assert.equal(area.schemaVersion, 3);
  assert.equal(area.id, 'home');
  assert.equal(area.kind, 'interior');
  assert.equal(area.width, 640);
  assert.equal(area.height, 480);
  assert.equal(area.surface.baseMaterialId, 'road.dirt');
  assert.deepEqual(findWorldAreaSpawn(area, 'entry'), {
    id: 'entry',
    x: 320,
    y: 400
  });
  assert.equal(Object.isFrozen(area), true);
});

test('WorldArea list rejects duplicate area ids', () => {
  const areas = normalizeWorldAreas([
    { id: 'same', spawns: [{ id: 'a', x: 1, y: 1 }] },
    { id: 'same', spawns: [{ id: 'b', x: 2, y: 2 }] }
  ]);

  assert.equal(areas.length, 1);
});

test('WorldDocument keeps only Portals with valid Area, Spawn and trigger references', () => {
  const document = normalizeWorldDocument({
    areas: [
      {
        id: 'a',
        spawns: [{ id: 'a-start', x: 20, y: 20 }]
      },
      {
        id: 'b',
        spawns: [{ id: 'b-start', x: 30, y: 30 }]
      }
    ],
    portals: [
      {
        id: 'valid',
        sourceAreaId: 'a',
        trigger: { kind: 'point', x: 50, y: 50, radius: 20 },
        targetAreaId: 'b',
        targetSpawnId: 'b-start'
      },
      {
        id: 'missing-target-spawn',
        sourceAreaId: 'a',
        trigger: { kind: 'point', x: 50, y: 50, radius: 20 },
        targetAreaId: 'b',
        targetSpawnId: 'nope'
      }
    ]
  });

  assert.deepEqual(
    document.portals.map((portal) => portal.id),
    ['valid']
  );
});

test('building-door Portal resolves from the GREEN Building doorAnchor, never from pixels', () => {
  const document = makeDocument();
  const portal = document.portals.find((item) => item.id === 'enter');
  const point = resolvePortalTriggerPoint(document.areas, portal);

  // Building is rotated 90°. Local door (0, +80) becomes world (-80, 0).
  assert.ok(Math.abs(point.x - 220) < 1e-9);
  assert.ok(Math.abs(point.y - 300) < 1e-9);
  assert.equal(point.radius, 30);
});

test('findTriggeredPortal detects only the active Area trigger', () => {
  const document = makeDocument();

  const enter = findTriggeredPortal(
    document,
    'outside',
    { x: 220, y: 300 }
  );
  assert.equal(enter?.id, 'enter');

  const wrongArea = findTriggeredPortal(
    document,
    'inside',
    { x: 220, y: 300 }
  );
  assert.equal(wrongArea, null);

  const exit = findTriggeredPortal(
    document,
    'inside',
    { x: 250, y: 360 }
  );
  assert.equal(exit?.id, 'exit');
});

test('Portal transition changes currentAreaId and X/Y only from explicit target Spawn', () => {
  const document = makeDocument();
  const state = {
    currentAreaId: 'outside',
    x: 220,
    y: 300
  };
  const portal = document.portals.find((item) => item.id === 'enter');

  const next = applyPortalTransition(document, state, portal);

  assert.deepEqual(next, {
    currentAreaId: 'inside',
    x: 250,
    y: 280,
    viaPortalId: 'enter'
  });
});

test('initial Exploration state comes from explicit initial Area and Spawn', () => {
  const document = makeDocument();
  const state = createInitialExplorationState(document);

  assert.deepEqual(state, {
    currentAreaId: 'outside',
    x: 80,
    y: 80,
    viaPortalId: null
  });
});

test('demo uses one Portal contract for entering and leaving the Building', () => {
  assert.equal(demoWorldDocument.areas.length, 2);
  assert.equal(demoWorldDocument.portals.length, 2);

  const outside = findWorldAreaById(
    demoWorldDocument,
    'forest-exterior'
  );
  const inside = findWorldAreaById(
    demoWorldDocument,
    'house-interior-01'
  );

  assert.ok(outside);
  assert.ok(inside);
  assert.equal(inside.kind, 'interior');

  const enter = demoWorldDocument.portals.find(
    (portal) => portal.id === 'portal-house-enter'
  );
  const exit = demoWorldDocument.portals.find(
    (portal) => portal.id === 'portal-house-exit'
  );

  assert.equal(enter.trigger.kind, 'building-door');
  assert.equal(exit.trigger.kind, 'point');
  assert.equal(enter.targetAreaId, 'house-interior-01');
  assert.equal(exit.targetAreaId, 'forest-exterior');
});


test('true path: movement reaches Building door, Portal changes Area, and target Spawn owns arrival', () => {
  const document = demoWorldDocument;
  const outside = findWorldAreaById(document, 'forest-exterior');
  const player = {
    currentAreaId: 'forest-exterior',
    x: 820,
    y: 1100,
    radius: 18
  };

  let transition = null;

  for (let step = 0; step < 12; step += 1) {
    stepMovement(
      outside,
      player,
      { x: 0, y: -1 },
      0.1,
      { maxSpeed: 100 }
    );

    const portal = findTriggeredPortal(
      document,
      player.currentAreaId,
      player
    );

    if (portal) {
      transition = applyPortalTransition(
        document,
        player,
        portal
      );
      break;
    }
  }

  assert.ok(transition, 'expected to reach the house entrance Portal');
  assert.equal(transition.currentAreaId, 'house-interior-01');
  assert.equal(transition.x, 360);
  assert.equal(transition.y, 390);
});


test('regression: every demo WorldArea base material must resolve as a surface material', async () => {
  const { materialPackV1 } = await import('../src/materials/material-pack-v1.js');
  const { createMaterialRegistry } = await import('../src/materials/material-registry.js');
  const registry = createMaterialRegistry(materialPackV1);

  for (const area of demoWorldDocument.areas) {
    assert.doesNotThrow(
      () => registry.require(area.surface.baseMaterialId, 'surface'),
      `${area.id}: invalid base surface material ${area.surface.baseMaterialId}`
    );
  }
});


test('regression: interior exit Portal declares an explicit visible marker', () => {
  const exit = demoWorldDocument.portals.find(
    (portal) => portal.id === 'portal-house-exit'
  );

  assert.ok(exit, 'missing interior exit Portal');
  assert.equal(exit.visual?.visible, true);
  assert.equal(exit.visual?.marker, 'exit');
  assert.equal(exit.visual?.label, 'Sortie');

  const point = resolvePortalTriggerPoint(
    demoWorldDocument.areas,
    exit
  );

  assert.equal(point.x, 360);
  assert.equal(point.y, 510);
  assert.equal(point.radius, 30);
});


test('regression: Building return follows the moved and scaled door instead of an old fixed spawn', async () => {
  const {
    createWorldBuilderDraft,
    updateWorldObjectTransform,
    validateWorldBuilderDraft
  } = await import('../src/builder/world-builder-draft.js');

  let draft = createWorldBuilderDraft(demoWorldDocument);

  draft = updateWorldObjectTransform(
    draft,
    'forest-exterior',
    'forest-house-01',
    {
      x: 1350,
      y: 700,
      rotationDeg: 0,
      scaleX: 1.4,
      scaleY: 1.2
    }
  );

  const validation = validateWorldBuilderDraft(draft);
  assert.equal(validation.valid, true);

  const document = validation.document;
  const exit = document.portals.find(
    (portal) => portal.id === 'portal-house-exit'
  );

  const next = applyPortalTransition(
    document,
    {
      currentAreaId: 'house-interior-01',
      x: 360,
      y: 510
    },
    exit
  );

  // main-door: y = 700 + (300 * 1.2 * 0.38) = 836.8
  // safe exterior offset: +56 world units = 892.8
  assert.ok(Math.abs(next.x - 1350) < 1e-9);
  assert.ok(Math.abs(next.y - 892.8) < 1e-9);
});


test('anchored Spawn stores no competing X/Y and resolves from its Building door', async () => {
  const {
    findWorldArea,
    findWorldAreaSpawn,
    resolveWorldAreaSpawnPoint
  } = await import('../src/world/world-area-model.js');

  const outside = findWorldArea(
    demoWorldDocument.areas,
    'forest-exterior'
  );
  const spawn = findWorldAreaSpawn(
    outside,
    'house-return-exterior'
  );
  const point = resolveWorldAreaSpawnPoint(
    outside,
    'house-return-exterior'
  );

  assert.equal(spawn.anchor.kind, 'building-door');
  assert.equal(spawn.anchor.objectId, 'forest-house-01');
  assert.equal(spawn.anchor.anchorId, 'main-door');
  assert.equal(spawn.anchor.offset, 56);
  assert.equal('x' in spawn, false);
  assert.equal('y' in spawn, false);

  assert.ok(Math.abs(point.x - 820) < 1e-9);
  assert.ok(Math.abs(point.y - 1100) < 1e-9);
});
