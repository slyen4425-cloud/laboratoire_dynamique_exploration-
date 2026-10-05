import test from 'node:test';
import assert from 'node:assert/strict';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addSurfacePath,
  createWorldBuilderDraft,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {
  createWorldBuilderTestHandoff,
  restoreWorldBuilderTestHandoff
} from '../src/builder/world-builder-test-handoff.js';
import {
  createTraversalRuleRegistry,
  resolveSurfaceTraversal
} from '../src/core/surface-traversal.js';
import { traversalRulePackV1 } from '../src/core/traversal-rule-pack-v1.js';
import { stepMovement } from '../src/core/movement.js';

test('Builder-created route keeps terrain.road x1.25 through real handoff and movement', () => {
  let draft =
    createWorldBuilderDraft(
      demoWorldDocument
    );
  const areaId = draft.initialAreaId;

  draft = addSurfacePath(
    draft,
    areaId,
    'route',
    {
      width: 82,
      terrainFamilyId: 'road',
      materialId: 'road.dirt',
      points: [
        { x: 80, y: 120 },
        { x: 780, y: 120 }
      ]
    }
  );

  const rawArea =
    draft.areas.find(
      (area) => area.id === areaId
    );
  const createdRaw =
    rawArea.surface.routes.at(-1);

  // Builder stays geometry-focused; traversal authority is
  // restored by canonical normalization, not duplicated here.
  assert.equal(
    Object.hasOwn(
      createdRaw,
      'traversalRuleId'
    ),
    false
  );

  const validation =
    validateWorldBuilderDraft(draft);
  assert.equal(validation.valid, true);

  const payload =
    createWorldBuilderTestHandoff(
      validation.document
    );
  const restored =
    restoreWorldBuilderTestHandoff(
      payload
    );
  const area =
    restored.areas.find(
      (entry) => entry.id === areaId
    );
  const route =
    area.surface.routes.find(
      (entry) =>
        entry.id === createdRaw.id
    );

  assert.ok(route);
  assert.equal(
    route.traversalRuleId,
    'terrain.road'
  );

  const registry =
    createTraversalRuleRegistry(
      traversalRulePackV1
    );
  assert.equal(
    registry.require('terrain.road')
      .modes.ground,
    1.25
  );

  const roadActor = {
    x: 100,
    y: 120,
    radius: 10,
    locomotion: {
      modes: ['ground']
    }
  };
  const groundActor = {
    x: 100,
    y: 300,
    radius: 10,
    locomotion: {
      modes: ['ground']
    }
  };

  const traversal =
    resolveSurfaceTraversal(
      area,
      roadActor,
      roadActor.x,
      roadActor.y,
      registry
    );

  assert.equal(
    traversal.ruleId,
    'terrain.road'
  );
  assert.equal(
    traversal.speedMultiplier,
    1.25
  );

  stepMovement(
    area,
    roadActor,
    { x: 1, y: 0 },
    1,
    { maxSpeed: 100 },
    registry
  );
  stepMovement(
    area,
    groundActor,
    { x: 1, y: 0 },
    1,
    { maxSpeed: 100 },
    registry
  );

  assert.equal(
    roadActor.x,
    225,
    'road movement must be 25% faster'
  );
  assert.equal(
    groundActor.x,
    200,
    'ground movement remains baseline'
  );
});

test('smooth visual envelope never replaces canonical route width as traversal authority', async () => {
  const {
    linearFeatherMaskPlan
  } = await import(
    '../src/render/surface-feather.js'
  );

  const plan =
    linearFeatherMaskPlan(
      82,
      100,
      {
        mode: 'feather',
        method: 'smooth-mask',
        widthRatio: 0.18,
        minWidth: 6,
        maxWidth: 64,
        edgeOpacity: 0,
        blurRatio: 0.58
      }
    );

  assert.equal(
    plan.innerWidth,
    82,
    'opaque visual core matches canonical route width'
  );
  assert.equal(
    plan.outerWidth,
    100,
    'only the visual feather extends into the pre-existing edge padding'
  );
});
