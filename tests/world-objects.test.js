import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WORLD_OBJECT_LIMITS,
  bridgeTraversalRect,
  bridgeVisualRect,
  normalizeWorldObjects
} from '../src/world/world-object-model.js';
import {
  circleFitsOrientedRect,
  isBlocked,
  pointInOrientedRect
} from '../src/core/collision.js';
import { stepMovement } from '../src/core/movement.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';

function makeBridge(overridesSurfaceFeatureIds = ['river-1']) {
  return normalizeWorldObjects([
    {
      id: 'bridge-1',
      kind: 'bridge',
      transform: {
        x: 250,
        y: 250,
        rotationDeg: 90,
        scaleX: 1.25,
        scaleY: 1.5
      },
      baseSize: {
        length: 160,
        width: 80
      },
      visual: {
        assetId: 'object.bridge.wood.01'
      },
      traversal: {
        enabled: true,
        lengthRatio: 0.9,
        widthRatio: 0.75,
        overridesSurfaceFeatureIds
      }
    }
  ])[0];
}

test('bridge WorldObject normalizes transform for future Builder editing', () => {
  const bridge = normalizeWorldObjects([
    {
      kind: 'bridge',
      transform: {
        x: 320,
        y: 440,
        rotationDeg: 450,
        scaleX: 2,
        scaleY: 0.5
      },
      baseSize: {
        length: 180,
        width: 90
      }
    }
  ])[0];

  assert.equal(bridge.transform.x, 320);
  assert.equal(bridge.transform.y, 440);
  assert.equal(bridge.transform.rotationDeg, 90);
  assert.equal(bridge.transform.scaleX, 2);
  assert.equal(bridge.transform.scaleY, 0.5);
  assert.equal(bridge.baseSize.length, 180);
  assert.equal(bridge.baseSize.width, 90);
  assert.equal(bridge.traversal.edgeAssistRatio, 0.15);
  assert.equal(Object.isFrozen(bridge.transform), true);
});

test('invalid bridge scales fall back inside the declared WorldObject limits', () => {
  const bridge = normalizeWorldObjects([
    {
      kind: 'bridge',
      transform: {
        scaleX: WORLD_OBJECT_LIMITS.maxScale + 1,
        scaleY: WORLD_OBJECT_LIMITS.minScale - 0.1
      }
    }
  ])[0];

  assert.equal(bridge.transform.scaleX, 1);
  assert.equal(bridge.transform.scaleY, 1);
});

test('bridge visual and traversal rectangles derive from logical data, not pixels', () => {
  const bridge = makeBridge();
  const visual = bridgeVisualRect(bridge);
  const passage = bridgeTraversalRect(bridge);

  assert.equal(visual.length, 200);
  assert.equal(visual.width, 120);
  assert.ok(Math.abs(visual.rotation - Math.PI / 2) < 1e-12);

  assert.equal(passage.length, 180);
  assert.equal(passage.width, 90);
  assert.equal(passage.x, 250);
  assert.equal(passage.y, 250);
});

test('oriented passage respects bridge rotation', () => {
  const passage = bridgeTraversalRect(makeBridge());

  assert.equal(circleFitsOrientedRect(250, 320, 10, passage), true);
  assert.equal(circleFitsOrientedRect(310, 250, 10, passage), false);
  assert.equal(pointInOrientedRect(250, 320, passage), true);
  assert.equal(pointInOrientedRect(310, 250, passage), false);
});

test('bridge only overrides explicitly referenced surface features', () => {
  const bridge = makeBridge(['river-1']);
  const world = {
    width: 600,
    height: 600,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-1',
          width: 60,
          traversalRuleId: 'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    }),
    objects: [bridge],
    obstacles: []
  };
  const entity = {
    radius: 10,
    locomotion: { modes: ['ground'] }
  };

  assert.equal(isBlocked(world, entity, 250, 250), false);
  assert.equal(isBlocked(world, entity, 310, 250), true);

  const wrongFeatureWorld = {
    ...world,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-2',
          width: 60,
          traversalRuleId: 'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    })
  };

  assert.equal(isBlocked(wrongFeatureWorld, entity, 250, 250), true);
});
test('real movement can cross a blocking river through a rotated bridge corridor', () => {
  const bridge = normalizeWorldObjects([
    {
      id: 'bridge-crossing',
      kind: 'bridge',
      transform: {
        x: 250,
        y: 250,
        rotationDeg: 90,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        length: 180,
        width: 100
      },
      traversal: {
        enabled: true,
        lengthRatio: 1,
        widthRatio: 0.9,
        overridesSurfaceFeatureIds: ['river-crossing']
      }
    }
  ])[0];

  const world = {
    width: 600,
    height: 600,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-crossing',
          width: 60,
          traversalRuleId: 'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    }),
    objects: [bridge],
    obstacles: []
  };

  const entity = { x: 250, y: 190, radius: 10 };

  for (let step = 0; step < 14; step += 1) {
    stepMovement(
      world,
      entity,
      { x: 0, y: 1 },
      0.1,
      { maxSpeed: 100 }
    );
  }

  assert.equal(entity.y, 330);
  assert.equal(entity.x, 250);
});


test('regression: slightly off-center bridge crossing must not snag on invisible corridor edge', () => {
  const bridge = normalizeWorldObjects([
    {
      id: 'bridge-snag-regression',
      kind: 'bridge',
      transform: {
        x: 250,
        y: 250,
        rotationDeg: 90,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        length: 170,
        width: 96
      },
      traversal: {
        enabled: true,
        lengthRatio: 0.92,
        widthRatio: 0.82,
        overridesSurfaceFeatureIds: ['river-snag']
      }
    }
  ])[0];

  const world = {
    width: 600,
    height: 600,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-snag',
          width: 90,
          traversalRuleId: 'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    }),
    objects: [bridge],
    obstacles: []
  };

  const entity = { x: 278, y: 180, radius: 18 };

  for (let step = 0; step < 16; step += 1) {
    stepMovement(
      world,
      entity,
      { x: 0, y: 1 },
      0.1,
      { maxSpeed: 100 }
    );
  }

  assert.equal(entity.y, 340);
  assert.equal(entity.x, 278);
});


test('regression: diagonal approach slides onto bridge instead of sticking to river bank', () => {
  const bridge = normalizeWorldObjects([
    {
      id: 'bridge-diagonal-regression',
      kind: 'bridge',
      transform: {
        x: 250,
        y: 250,
        rotationDeg: 90,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        length: 170,
        width: 96
      },
      traversal: {
        enabled: true,
        lengthRatio: 0.92,
        widthRatio: 0.82,
        overridesSurfaceFeatureIds: ['river-diagonal']
      }
    }
  ])[0];

  const world = {
    width: 600,
    height: 600,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-diagonal',
          width: 90,
          traversalRuleId: 'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    }),
    objects: [bridge],
    obstacles: []
  };

  const entity = { x: 220, y: 145, radius: 18 };

  for (let step = 0; step < 20; step += 1) {
    stepMovement(
      world,
      entity,
      { x: -0.3, y: 1 },
      0.1,
      { maxSpeed: 100 }
    );
  }

  assert.ok(
    entity.y > 305,
    `expected to cross river, stopped at y=${entity.y}`
  );
});
