import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildingDoorAnchorWorld,
  buildingFootprintRect,
  buildingVisualRect,
  normalizeWorldObjects
} from '../src/world/world-object-model.js';
import {
  circleIntersectsOrientedRect,
  isBlocked
} from '../src/core/collision.js';

function makeBuilding(assetId = 'object.building.house.fantasy_wood_stone.01') {
  return normalizeWorldObjects([
    {
      id: 'house-1',
      kind: 'building',
      transform: {
        x: 300,
        y: 240,
        rotationDeg: 90,
        scaleX: 1.5,
        scaleY: 0.75
      },
      baseSize: {
        width: 200,
        height: 160
      },
      visual: { assetId },
      footprint: {
        enabled: true,
        widthRatio: 0.8,
        heightRatio: 0.6,
        offsetX: 0.1,
        offsetY: -0.05
      },
      doorAnchors: [
        { id: 'main-door', x: 0, y: 0.4 }
      ],
      portalRefs: [
        { doorAnchorId: 'main-door', portalId: 'portal-house-1' }
      ]
    }
  ])[0];
}

test('Building WorldObject normalizes editor-facing parameters', () => {
  const building = makeBuilding();

  assert.equal(building.kind, 'building');
  assert.equal(building.transform.x, 300);
  assert.equal(building.transform.y, 240);
  assert.equal(building.transform.rotationDeg, 90);
  assert.equal(building.transform.scaleX, 1.5);
  assert.equal(building.transform.scaleY, 0.75);
  assert.equal(building.baseSize.width, 200);
  assert.equal(building.baseSize.height, 160);
  assert.equal(building.footprint.widthRatio, 0.8);
  assert.equal(building.footprint.heightRatio, 0.6);
  assert.equal(building.footprint.offsetX, 0.1);
  assert.equal(building.footprint.offsetY, -0.05);
  assert.equal(building.doorAnchors[0].id, 'main-door');
  assert.equal(building.portalRefs[0].portalId, 'portal-house-1');
  assert.equal(Object.isFrozen(building.transform), true);
  assert.equal(Object.isFrozen(building.footprint), true);
  assert.equal(Object.isFrozen(building.doorAnchors), true);
});

test('Building door anchors follow position rotation and scale', () => {
  const building = makeBuilding();
  const anchor = buildingDoorAnchorWorld(building, 'main-door');

  // Local Y = 160 * 0.75 * 0.4 = 48.
  // A +90° rotation moves local +Y to world -X.
  assert.ok(Math.abs(anchor.x - 252) < 1e-9);
  assert.ok(Math.abs(anchor.y - 240) < 1e-9);
});

test('Building footprint derives from logical data and transform', () => {
  const building = makeBuilding();
  const visual = buildingVisualRect(building);
  const footprint = buildingFootprintRect(building);

  assert.equal(visual.width, 300);
  assert.equal(visual.height, 120);
  assert.equal(footprint.length, 240);
  assert.equal(footprint.width, 72);

  // Local offset (30, -6), rotated +90° => world (+6, +30).
  assert.ok(Math.abs(footprint.x - 306) < 1e-9);
  assert.ok(Math.abs(footprint.y - 270) < 1e-9);
});

test('Changing Building assetId never changes footprint or door anchors', () => {
  const first = makeBuilding('object.building.house.fantasy_wood_stone.01');
  const second = makeBuilding('object.building.house.future_variant.99');

  assert.deepEqual(buildingFootprintRect(first), buildingFootprintRect(second));
  assert.deepEqual(
    buildingDoorAnchorWorld(first, 'main-door'),
    buildingDoorAnchorWorld(second, 'main-door')
  );
  assert.notEqual(first.visual.assetId, second.visual.assetId);
});

test('Building collision is owned by Collision World logical footprint', () => {
  const building = normalizeWorldObjects([
    {
      id: 'house-collision',
      kind: 'building',
      transform: {
        x: 250,
        y: 250,
        rotationDeg: 30,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        width: 200,
        height: 160
      },
      footprint: {
        enabled: true,
        widthRatio: 0.8,
        heightRatio: 0.6,
        offsetX: 0,
        offsetY: 0
      }
    }
  ])[0];

  const world = {
    width: 700,
    height: 700,
    obstacles: [],
    objects: [building]
  };
  const entity = { radius: 18 };

  const footprint = buildingFootprintRect(building);

  assert.equal(
    circleIntersectsOrientedRect(250, 250, entity.radius, footprint),
    true
  );
  assert.equal(isBlocked(world, entity, 250, 250), true);
  assert.equal(isBlocked(world, entity, 500, 500), false);
});

test('Portal refs cannot target nonexistent Building door anchors', () => {
  const building = normalizeWorldObjects([
    {
      kind: 'building',
      doorAnchors: [
        { id: 'front', x: 0, y: 0.4 }
      ],
      portalRefs: [
        { doorAnchorId: 'front', portalId: 'portal-front' },
        { doorAnchorId: 'missing', portalId: 'portal-invalid' }
      ]
    }
  ])[0];

  assert.equal(building.portalRefs.length, 1);
  assert.equal(building.portalRefs[0].doorAnchorId, 'front');
});
