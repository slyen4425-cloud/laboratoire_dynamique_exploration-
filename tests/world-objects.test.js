import test from 'node:test';
import assert from 'node:assert/strict';

import {
  WORLD_OBJECT_LIMITS,
  bridgeTraversalRect,
  bridgeVisualRect
} from '../src/world/world-object-model.js';
import {
  normalizeWorldObjectPlacements,
  resolveWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';
import {
  circleFitsOrientedRect,
  isBlocked,
  pointInOrientedRect
} from '../src/core/collision.js';
import { stepMovement } from '../src/core/movement.js';
import { normalizeWorldSurface } from '../src/world/surface-model.js';

function makeBridgePlacement(
  overridesSurfaceFeatureIds = ['river-1'],
  transform = {}
) {
  return normalizeWorldObjectPlacements([
    {
      id: 'bridge-1',
      objectDefinitionId:
        'objectdef.bridge.wood.rustic_bank.01',
      transform: {
        x: 250,
        y: 250,
        rotationDeg: 90,
        scaleX: 1.25,
        scaleY: 1.5,
        ...transform
      },
      overrides: {
        traversalSurfaceFeatureIds:
          overridesSurfaceFeatureIds
      }
    }
  ])[0];
}

function resolve(placement) {
  return resolveWorldObjectPlacement(
    placement
  );
}

test('WorldObject placement normalizes transform for Builder editing', () => {
  const placement =
    makeBridgePlacement(
      [],
      {
        x: 320,
        y: 440,
        rotationDeg: 450,
        scaleX: 2,
        scaleY: 0.5
      }
    );

  assert.equal(placement.transform.x, 320);
  assert.equal(placement.transform.y, 440);
  assert.equal(
    placement.transform.rotationDeg,
    90
  );
  assert.equal(placement.transform.scaleX, 2);
  assert.equal(placement.transform.scaleY, 0.5);
  assert.equal(
    placement.objectDefinitionId,
    'objectdef.bridge.wood.rustic_bank.01'
  );
  assert.equal('baseSize' in placement, false);
  assert.equal('visual' in placement, false);
  assert.equal(Object.isFrozen(placement.transform), true);
});

test('invalid placement scales fall back inside declared limits', () => {
  const placement =
    makeBridgePlacement(
      [],
      {
        scaleX:
          WORLD_OBJECT_LIMITS.maxScale + 1,
        scaleY:
          WORLD_OBJECT_LIMITS.minScale - 0.1
      }
    );

  assert.equal(placement.transform.scaleX, 1);
  assert.equal(placement.transform.scaleY, 1);
});

test('bridge geometry is derived from definition + placement, never pixels', () => {
  const bridge =
    resolve(makeBridgePlacement());
  const visual =
    bridgeVisualRect(bridge);
  const passage =
    bridgeTraversalRect(bridge);

  assert.equal(visual.length, 212.5);
  assert.equal(visual.width, 144);
  assert.ok(
    Math.abs(
      visual.rotation -
      Math.PI / 2
    ) < 1e-12
  );

  assert.equal(
    passage.length,
    212.5 * 0.92
  );
  assert.equal(
    passage.width,
    144 * 0.82
  );
  assert.equal(passage.x, 250);
  assert.equal(passage.y, 250);
});

test('oriented passage respects placement rotation', () => {
  const passage =
    bridgeTraversalRect(
      resolve(makeBridgePlacement())
    );

  assert.equal(
    circleFitsOrientedRect(
      250,
      320,
      10,
      passage
    ),
    true
  );
  assert.equal(
    pointInOrientedRect(
      250,
      320,
      passage
    ),
    true
  );
});

test('bridge placement only overrides explicitly referenced surface features', () => {
  const placement =
    makeBridgePlacement(['river-1']);

  const world = {
    width: 600,
    height: 600,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-1',
          width: 60,
          traversalRuleId:
            'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    }),
    objects: [placement],
    obstacles: []
  };
  const entity = {
    radius: 10,
    locomotion: {
      modes: ['ground']
    }
  };

  assert.equal(
    isBlocked(
      world,
      entity,
      250,
      250
    ),
    false
  );

  const wrongFeatureWorld = {
    ...world,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-2',
          width: 60,
          traversalRuleId:
            'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    })
  };

  assert.equal(
    isBlocked(
      wrongFeatureWorld,
      entity,
      250,
      250
    ),
    true
  );
});

test('real movement crosses blocking river through catalog-resolved bridge corridor', () => {
  const placement =
    makeBridgePlacement(
      ['river-crossing'],
      {
        x: 250,
        y: 250,
        rotationDeg: 90,
        scaleX: 1,
        scaleY: 1
      }
    );

  const world = {
    width: 600,
    height: 600,
    surface: normalizeWorldSurface({
      rivers: [
        {
          id: 'river-crossing',
          width: 60,
          traversalRuleId:
            'terrain.water',
          points: [
            { x: 100, y: 250 },
            { x: 400, y: 250 }
          ]
        }
      ]
    }),
    objects: [placement],
    obstacles: []
  };

  const entity = {
    x: 250,
    y: 190,
    radius: 10
  };

  for (
    let step = 0;
    step < 14;
    step += 1
  ) {
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
