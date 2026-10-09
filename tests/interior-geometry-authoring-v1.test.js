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


test('public cache chain reaches canonical interior geometry through Builder and runtime', async () => {
  const revision =
    'interior-geometry-authoring-v1';

  const [
    builderHtml,
    indexHtml,
    builderMain,
    builderDraft,
    worldDocument,
    runtimeMain,
    movement,
    living
  ] = await Promise.all([
    source('builder.html'),
    source('index.html'),
    source(
      'src/builder/world-builder-main.js'
    ),
    source(
      'src/builder/world-builder-draft.js'
    ),
    source(
      'src/world/world-document-model.js'
    ),
    source('src/main.js'),
    source('src/core/movement.js'),
    source('src/living/living-runtime.js')
  ]);

  assert.match(
    builderHtml,
    new RegExp(
      `world-builder-main\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    builderHtml,
    new RegExp(
      `world-builder\\.css\\?rev=${revision}`
    )
  );
  assert.match(
    builderHtml,
    new RegExp(
      `index\\.html\\?builderTest=1&rev=${revision}`
    )
  );
  assert.match(
    indexHtml,
    new RegExp(
      `main\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    indexHtml,
    new RegExp(
      `style\\.css\\?rev=${revision}`
    )
  );

  assert.match(
    builderMain,
    new RegExp(
      `world-builder-draft\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    builderDraft,
    new RegExp(
      `world-document-model\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    worldDocument,
    new RegExp(
      `world-area-model\\.js\\?rev=${revision}`
    )
  );

  assert.match(
    runtimeMain,
    new RegExp(
      `core/movement\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    runtimeMain,
    new RegExp(
      `world-document-model\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    runtimeMain,
    new RegExp(
      `living/living-runtime\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    movement,
    new RegExp(
      `collision\\.js\\?rev=${revision}`
    )
  );
  assert.match(
    living,
    new RegExp(
      `core/collision\\.js\\?rev=${revision}`
    )
  );
});


test('regression: changing a newly linked interior to T keeps Portal arrival and exit inside the playable boundary', async () => {
  const {
    boundaryForInteriorShapePreset
  } = await import(
    '../src/builder/world-area-shape-presets.js'
  );
  const {
    resolveWorldAreaSpawnPoint
  } = await import(
    '../src/world/world-area-model.js'
  );
  const {
    circleFitsWorldAreaBoundary
  } = await import(
    '../src/world/world-area-geometry.js'
  );
  const {
    resolvePortalTriggerPoint,
    applyPortalTransition
  } = await import(
    '../src/world/portal-model.js'
  );
  const {
    stepMovement
  } = await import(
    '../src/core/movement.js'
  );

  let draft =
    draftApi.createWorldBuilderDraft({
      id: 't-entry-regression',
      initialAreaId: 'outside',
      initialSpawnId: 'start',
      areas: [
        {
          id: 'outside',
          kind: 'exterior',
          width: 1200,
          height: 900,
          surface: {
            baseTerrainFamilyId: 'plain',
            baseMaterialId: 'grass.forest',
            baseTraversalRuleId:
              'terrain.ground',
            zones: [],
            routes: [],
            rivers: []
          },
          objects: [
            {
              id: 'house-new',
              objectDefinitionId:
                'objectdef.building.house.fantasy_wood_stone.01',
              transform: {
                x: 600,
                y: 450,
                rotationDeg: 0,
                scaleX: 1,
                scaleY: 1
              },
              overrides: {
                traversalSurfaceFeatureIds: []
              }
            }
          ],
          actors: [],
          obstacles: [],
          spawns: [
            {
              id: 'start',
              x: 120,
              y: 120
            }
          ]
        }
      ],
      portals: []
    });

  draft =
    draftApi.createBuildingInteriorLink(
      draft,
      {
        sourceAreaId: 'outside',
        buildingId: 'house-new'
      }
    );

  const enterBefore =
    draft.portals.find(
      (portal) =>
        portal.sourceAreaId ===
          'outside' &&
        portal.targetAreaId !==
          'outside'
    );

  assert.ok(enterBefore);

  draft =
    draftApi.updateAreaBoundary(
      draft,
      enterBefore.targetAreaId,
      boundaryForInteriorShapePreset(
        't'
      )
    );

  const validation =
    draftApi.validateWorldBuilderDraft(
      draft
    );

  assert.equal(
    validation.valid,
    true
  );

  const document =
    validation.document;
  const enter =
    document.portals.find(
      (portal) =>
        portal.id ===
        enterBefore.id
    );
  const interior =
    document.areas.find(
      (area) =>
        area.id ===
        enter.targetAreaId
    );
  const arrival =
    resolveWorldAreaSpawnPoint(
      interior,
      enter.targetSpawnId
    );

  assert.ok(arrival);
  assert.equal(
    circleFitsWorldAreaBoundary(
      interior,
      arrival.x,
      arrival.y,
      18
    ),
    true,
    'Portal arrival must fit the T floor with player clearance'
  );

  const exit =
    document.portals.find(
      (portal) =>
        portal.sourceAreaId ===
          interior.id &&
        portal.targetAreaId ===
          'outside'
    );

  assert.ok(exit);
  const exitTrigger =
    resolvePortalTriggerPoint(
      document.areas,
      exit
    );

  assert.ok(exitTrigger);
  assert.equal(
    circleFitsWorldAreaBoundary(
      interior,
      exitTrigger.x,
      exitTrigger.y,
      exitTrigger.radius
    ),
    true,
    'exit trigger must remain fully inside the T floor'
  );

  const player =
    applyPortalTransition(
      document,
      {
        currentAreaId: 'outside',
        x: 600,
        y: 450
      },
      enter
    );

  assert.ok(player);
  player.radius = 18;
  player.locomotion = {
    modes: ['ground']
  };

  assert.equal(
    isBlocked(
      interior,
      player,
      player.x,
      player.y
    ),
    false,
    'player must never arrive in blocked black border space'
  );

  const beforeY = player.y;

  stepMovement(
    interior,
    player,
    { x: 0, y: -1 },
    0.1,
    { maxSpeed: 100 }
  );

  assert.ok(
    player.y < beforeY,
    'player must be able to move after entering the T interior'
  );
});

test('regression: linking directly to an existing T interior chooses boundary-safe connection points', async () => {
  const {
    boundaryForInteriorShapePreset
  } = await import(
    '../src/builder/world-area-shape-presets.js'
  );
  const {
    resolveWorldAreaSpawnPoint
  } = await import(
    '../src/world/world-area-model.js'
  );
  const {
    circleFitsWorldAreaBoundary
  } = await import(
    '../src/world/world-area-geometry.js'
  );

  let draft =
    draftApi.createWorldBuilderDraft({
      id: 'existing-t-target',
      initialAreaId: 'outside',
      initialSpawnId: 'start',
      areas: [
        {
          id: 'outside',
          kind: 'exterior',
          width: 1200,
          height: 900,
          surface: {
            baseTerrainFamilyId: 'plain',
            baseMaterialId: 'grass.forest',
            baseTraversalRuleId:
              'terrain.ground'
          },
          objects: [
            {
              id: 'house-new',
              objectDefinitionId:
                'objectdef.building.house.fantasy_wood_stone.01',
              transform: {
                x: 600,
                y: 450,
                rotationDeg: 0,
                scaleX: 1,
                scaleY: 1
              },
              overrides: {
                traversalSurfaceFeatureIds: []
              }
            }
          ],
          spawns: [
            { id: 'start', x: 120, y: 120 }
          ]
        },
        {
          id: 'inside-t',
          kind: 'interior',
          width: 720,
          height: 560,
          boundary:
            boundaryForInteriorShapePreset(
              't'
            ),
          surface: {
            baseTerrainFamilyId: 'plain',
            baseMaterialId: 'floor.wood.house',
            baseTraversalRuleId:
              'terrain.ground'
          },
          objects: [],
          actors: [],
          obstacles: [],
          spawns: []
        }
      ],
      portals: []
    });

  draft =
    draftApi.createBuildingInteriorLink(
      draft,
      {
        sourceAreaId: 'outside',
        buildingId: 'house-new',
        targetAreaId: 'inside-t'
      }
    );

  const validation =
    draftApi.validateWorldBuilderDraft(
      draft
    );
  assert.equal(validation.valid, true);

  const enter =
    validation.document.portals.find(
      (portal) =>
        portal.sourceAreaId ===
          'outside'
    );
  const interior =
    validation.document.areas.find(
      (area) =>
        area.id === 'inside-t'
    );
  const arrival =
    resolveWorldAreaSpawnPoint(
      interior,
      enter.targetSpawnId
    );

  assert.equal(
    circleFitsWorldAreaBoundary(
      interior,
      arrival.x,
      arrival.y,
      18
    ),
    true
  );
});
