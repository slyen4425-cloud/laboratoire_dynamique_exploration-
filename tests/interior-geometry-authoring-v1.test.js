import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  normalizeWorldArea
} from '../src/world/world-area-model.js';
import {
  isBlocked
} from '../src/core/collision.js';
import * as draftApi from '../src/builder/world-builder-draft.js';
import {
  demoWorldDocument
} from '../src/world/demo-world.js';

async function source(path) {
  return readFile(
    new URL(`../${path}`, import.meta.url),
    'utf8'
  );
}

const L_BOUNDARY = Object.freeze({
  kind: 'polygon',
  vertices: Object.freeze([
    Object.freeze({ x: 0, y: 0 }),
    Object.freeze({ x: 0.58, y: 0 }),
    Object.freeze({ x: 0.58, y: 0.42 }),
    Object.freeze({ x: 1, y: 0.42 }),
    Object.freeze({ x: 1, y: 1 }),
    Object.freeze({ x: 0, y: 1 })
  ])
});

test('WorldArea v6 migrates legacy Areas to an explicit rectangular boundary', () => {
  const area = normalizeWorldArea({
    id: 'legacy-room',
    kind: 'interior',
    width: 640,
    height: 480,
    surface: {
      baseMaterialId: 'floor.wood.house'
    }
  });

  assert.equal(area.schemaVersion, 6);
  assert.deepEqual(area.boundary, {
    kind: 'rectangle'
  });
  assert.equal(Object.isFrozen(area.boundary), true);
});

test('WorldArea v6 preserves one normalized polygon boundary as canonical shape', () => {
  const area = normalizeWorldArea({
    id: 'l-room',
    kind: 'interior',
    width: 1000,
    height: 800,
    boundary: L_BOUNDARY
  });

  assert.equal(area.boundary.kind, 'polygon');
  assert.deepEqual(
    area.boundary.vertices,
    L_BOUNDARY.vertices
  );
  assert.equal(Object.isFrozen(area.boundary), true);
  assert.equal(Object.isFrozen(area.boundary.vertices), true);
  assert.equal(Object.isFrozen(area.boundary.vertices[0]), true);
});

test('WorldArea geometry resolves normalized vertices and circle fit from the same boundary', async () => {
  const {
    worldAreaBoundaryPoints,
    pointInWorldAreaBoundary,
    circleFitsWorldAreaBoundary
  } = await import(
    '../src/world/world-area-geometry.js'
  );

  const area = normalizeWorldArea({
    id: 'l-room',
    kind: 'interior',
    width: 1000,
    height: 800,
    boundary: L_BOUNDARY
  });

  assert.deepEqual(
    worldAreaBoundaryPoints(area),
    [
      { x: 0, y: 0 },
      { x: 580, y: 0 },
      { x: 580, y: 336 },
      { x: 1000, y: 336 },
      { x: 1000, y: 800 },
      { x: 0, y: 800 }
    ]
  );

  assert.equal(
    pointInWorldAreaBoundary(area, 300, 100),
    true
  );
  assert.equal(
    pointInWorldAreaBoundary(area, 800, 100),
    false
  );
  assert.equal(
    circleFitsWorldAreaBoundary(area, 800, 600, 18),
    true
  );
  assert.equal(
    circleFitsWorldAreaBoundary(area, 800, 100, 18),
    false
  );
});

test('Collision World blocks the cutout of an L interior while keeping its valid floor passable', () => {
  const area = normalizeWorldArea({
    id: 'l-room',
    kind: 'interior',
    width: 1000,
    height: 800,
    boundary: L_BOUNDARY,
    surface: {
      baseTraversalRuleId: 'terrain.ground'
    }
  });
  const entity = {
    radius: 18,
    locomotion: {
      modes: ['ground']
    }
  };

  assert.equal(
    isBlocked(area, entity, 800, 100),
    true,
    'top-right cutout must be outside the room'
  );
  assert.equal(
    isBlocked(area, entity, 800, 600),
    false,
    'bottom-right floor remains inside the L room'
  );
});

test('Builder boundary edit writes only canonical WorldArea data and survives resize', () => {
  assert.equal(
    typeof draftApi.updateAreaBoundary,
    'function'
  );

  let draft =
    draftApi.createWorldBuilderDraft(
      demoWorldDocument
    );

  draft =
    draftApi.updateAreaBoundary(
      draft,
      'house-interior-01',
      L_BOUNDARY
    );

  draft =
    draftApi.updateAreaProperties(
      draft,
      'house-interior-01',
      {
        width: 1200,
        height: 900
      }
    );

  const result =
    draftApi.validateWorldBuilderDraft(
      draft
    );

  assert.equal(result.valid, true);
  const area =
    result.document.areas.find(
      (item) =>
        item.id === 'house-interior-01'
    );

  assert.equal(area.width, 1200);
  assert.equal(area.height, 900);
  assert.deepEqual(
    area.boundary.vertices,
    L_BOUNDARY.vertices
  );

  const raw =
    draft.areas.find(
      (item) =>
        item.id === 'house-interior-01'
    );

  assert.equal(
    Object.hasOwn(raw, 'shapePresetId'),
    false
  );
});

test('interior shape presets are authoring commands, never a persisted geometry authority', async () => {
  const {
    listInteriorShapePresets,
    boundaryForInteriorShapePreset,
    interiorShapePresetIdForBoundary
  } = await import(
    '../src/builder/world-area-shape-presets.js'
  );

  assert.deepEqual(
    listInteriorShapePresets()
      .map((item) => item.id),
    ['rectangle', 'l', 't', 'cross']
  );

  for (const id of [
    'rectangle',
    'l',
    't',
    'cross'
  ]) {
    const boundary =
      boundaryForInteriorShapePreset(id);

    assert.ok(boundary);
    assert.equal(
      Object.hasOwn(
        boundary,
        'shapePresetId'
      ),
      false
    );
    assert.equal(
      interiorShapePresetIdForBoundary(
        boundary
      ),
      id
    );
  }
});

test('Builder exposes interior Forme + existing size controls through the canonical boundary helper', async () => {
  const [html, main] =
    await Promise.all([
      source('builder.html'),
      source(
        'src/builder/world-builder-main.js'
      )
    ]);

  assert.match(
    html,
    /id=["']area-shape-fields["']/
  );
  assert.match(
    html,
    /id=["']area-shape["']/
  );
  assert.match(html, />Forme intérieure</);
  assert.match(html, /id=["']area-width["']/);
  assert.match(html, /id=["']area-height["']/);

  assert.match(
    main,
    /updateAreaBoundary/
  );
  assert.match(
    main,
    /boundaryForInteriorShapePreset/
  );
  assert.equal(
    /shapePresetIds*=|shapePresetIds*:/.test(
      main
    ),
    false
  );
});

test('runtime and Builder reuse one read-only WorldArea clip instead of duplicating shape masks', async () => {
  const [runtime, builder, clip] =
    await Promise.all([
      source('src/main.js'),
      source(
        'src/builder/world-builder-main.js'
      ),
      source(
        'src/render/world-area-clip.js'
      )
    ]);

  assert.match(
    runtime,
    /clipWorldArea/
  );
  assert.match(
    builder,
    /clipWorldArea/
  );
  assert.match(
    clip,
    /worldAreaBoundaryPoints/
  );

  for (const sourceText of [
    runtime,
    builder,
    clip
  ]) {
    assert.equal(
      /shapePresetId/.test(sourceText),
      false
    );
  }
});
