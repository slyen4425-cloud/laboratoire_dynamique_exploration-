import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  normalizeExplorationConfig
} from '../src/core/config.js';
import {
  isBlocked
} from '../src/core/collision.js';
import {
  stepMovement
} from '../src/core/movement.js';
import {
  objectDefinitionCatalogV1
} from '../src/objects/object-definition-catalog.js';
import {
  normalizeWorldObjectPlacement,
  resolveWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';
import {
  worldObjectObstacleRect
} from '../src/world/world-object-model.js';
import {
  createUserWorldObjectRecord,
  objectDefinitionFromUserRecord,
  USER_WORLD_OBJECT_SCHEMA_VERSION
} from '../src/objects/user-object-library.js';

async function source(path) {
  return readFile(
    new URL(`../${path}`, import.meta.url),
    'utf8'
  );
}

function groundWorld(overrides = {}) {
  return {
    width: 600,
    height: 500,
    boundary: {
      kind: 'rectangle'
    },
    surface: {
      baseTraversalRuleId:
        'terrain.ground',
      zones: [],
      routes: [],
      rivers: []
    },
    obstacles: [],
    objects: [],
    ...overrides
  };
}

test('player config owns an explicit asymmetric boundary footprint independent from renderer pixels', () => {
  const config =
    normalizeExplorationConfig({});

  assert.deepEqual(
    config.player.boundaryFootprint,
    {
      left: 18,
      right: 18,
      top: 76,
      bottom: 8
    }
  );

  const custom =
    normalizeExplorationConfig({
      player: {
        radius: 20,
        boundaryFootprint: {
          left: 21,
          right: 22,
          top: 80,
          bottom: 9
        }
      }
    });

  assert.deepEqual(
    custom.player.boundaryFootprint,
    {
      left: 21,
      right: 22,
      top: 80,
      bottom: 9
    }
  );
});

test('Collision World stops actor silhouette before the top WorldArea wall', () => {
  const world =
    groundWorld();
  const entity = {
    radius: 18,
    boundaryFootprint: {
      left: 18,
      right: 18,
      top: 76,
      bottom: 8
    },
    locomotion: {
      modes: ['ground']
    }
  };

  assert.equal(
    isBlocked(
      world,
      entity,
      300,
      77
    ),
    false
  );

  assert.equal(
    isBlocked(
      world,
      entity,
      300,
      75
    ),
    true,
    'head clearance must block before sprite would enter the black boundary'
  );
});

test('true movement path cannot push actor head through top boundary', () => {
  const world =
    groundWorld();
  const entity = {
    x: 300,
    y: 86,
    radius: 18,
    boundaryFootprint: {
      left: 18,
      right: 18,
      top: 76,
      bottom: 8
    },
    locomotion: {
      modes: ['ground']
    }
  };

  stepMovement(
    world,
    entity,
    { x: 0, y: -1 },
    0.1,
    { maxSpeed: 100 }
  );

  assert.equal(
    entity.y,
    86,
    'movement must reject a target that would clip the silhouette'
  );
});

test('actors without boundary footprint preserve historical circle boundary behavior', () => {
  const world =
    groundWorld();
  const entity = {
    radius: 18,
    locomotion: {
      modes: ['ground']
    }
  };

  assert.equal(
    isBlocked(
      world,
      entity,
      300,
      19
    ),
    false
  );
  assert.equal(
    isBlocked(
      world,
      entity,
      300,
      17
    ),
    true
  );
});

test('native rocks and trees declare obstacle collision while passable object kinds remain explicit', () => {
  for (const id of [
    'objectdef.tree.forest.oak.01',
    'objectdef.tree.forest.pine.01',
    'objectdef.rock.forest.boulder.01',
    'objectdef.rock.forest.spires.01',
    'objectdef.rock.forest.plateau.01'
  ]) {
    const definition =
      objectDefinitionCatalogV1.require(id);

    assert.equal(
      definition.collision?.role,
      'obstacle',
      id
    );
    assert.equal(
      definition.collision?.shape,
      'box',
      id
    );
  }

  for (const id of [
    'objectdef.door.fantasy.wood.01',
    'objectdef.stairs.stone.simple.01'
  ]) {
    const definition =
      objectDefinitionCatalogV1.require(id);

    assert.notEqual(
      definition.collision?.role,
      'obstacle',
      id
    );
  }
});

test('resolved obstacle footprint follows one WorldObject placement transform', () => {
  const placement =
    normalizeWorldObjectPlacement({
      id: 'rock-placed',
      objectDefinitionId:
        'objectdef.rock.forest.boulder.01',
      transform: {
        x: 300,
        y: 220,
        rotationDeg: 90,
        scaleX: 1.5,
        scaleY: 0.75
      }
    });

  const object =
    resolveWorldObjectPlacement(
      placement
    );
  const rect =
    worldObjectObstacleRect(
      object
    );

  assert.ok(rect);
  assert.equal(
    object.collision.role,
    'obstacle'
  );
  assert.equal(rect.x, 300);
  assert.equal(rect.y > 220, true);
  assert.equal(
    rect.rotation,
    Math.PI / 2
  );
  assert.equal(
    rect.length > 0,
    true
  );
  assert.equal(
    rect.width > 0,
    true
  );
});

test('Collision World blocks native rock and tree footprints', () => {
  const placements = [
    {
      id: 'rock-1',
      objectDefinitionId:
        'objectdef.rock.forest.boulder.01',
      transform: {
        x: 220,
        y: 220,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1
      }
    },
    {
      id: 'tree-1',
      objectDefinitionId:
        'objectdef.tree.forest.oak.01',
      transform: {
        x: 420,
        y: 260,
        rotationDeg: 20,
        scaleX: 1,
        scaleY: 1
      }
    }
  ];

  const world =
    groundWorld({
      objects: placements
    });
  const entity = {
    radius: 14,
    locomotion: {
      modes: ['ground']
    }
  };

  assert.equal(
    isBlocked(
      world,
      entity,
      220,
      230
    ),
    true,
    'rock must block'
  );
  assert.equal(
    isBlocked(
      world,
      entity,
      420,
      300
    ),
    true,
    'tree trunk footprint must block'
  );
});

test('generic obstacle support preserves Building footprint and Bridge traversal contracts', () => {
  const buildingWorld =
    groundWorld({
      objects: [
        {
          id: 'house',
          objectDefinitionId:
            'objectdef.building.house.fantasy_wood_stone.01',
          transform: {
            x: 300,
            y: 250,
            rotationDeg: 0,
            scaleX: 1,
            scaleY: 1
          }
        }
      ]
    });
  const entity = {
    radius: 14,
    locomotion: {
      modes: ['ground']
    }
  };

  assert.equal(
    isBlocked(
      buildingWorld,
      entity,
      300,
      250
    ),
    true
  );

  const bridge =
    resolveWorldObjectPlacement(
      normalizeWorldObjectPlacement({
        id: 'bridge',
        objectDefinitionId:
          'objectdef.bridge.wood.rustic_bank.01',
        transform: {
          x: 300,
          y: 250,
          rotationDeg: 0,
          scaleX: 1,
          scaleY: 1
        },
        overrides: {
          traversalSurfaceFeatureIds: []
        }
      })
    );

  assert.equal(
    worldObjectObstacleRect(
      bridge
    ),
    null,
    'Bridge must not silently become an obstacle'
  );
});

test('user object record persists explicit obstacle/passable classification and definition inherits it', () => {
  assert.equal(
    USER_WORLD_OBJECT_SCHEMA_VERSION,
    2
  );

  const obstacleRecord =
    createUserWorldObjectRecord({
      idToken: 'my-rock',
      kind: 'rock',
      label: 'Mon rocher',
      collisionRole: 'obstacle',
      categoryId: 'rocks',
      folderId: 'rocks/general',
      folderLabel: 'Rochers',
      mimeType: 'image/png',
      width: 512,
      height: 512,
      bytes: 1000,
      sourceName: 'rock.png',
      blob: new Blob(['x'], {
        type: 'image/png'
      }),
      createdAt:
        '2026-10-10T00:00:00Z'
    });

  assert.equal(
    obstacleRecord.collisionRole,
    'obstacle'
  );

  const obstacleDefinition =
    objectDefinitionFromUserRecord(
      obstacleRecord
    );

  assert.equal(
    obstacleDefinition.collision.role,
    'obstacle'
  );
  assert.equal(
    obstacleDefinition.collision.shape,
    'box'
  );

  const passableRecord =
    createUserWorldObjectRecord({
      idToken: 'flower',
      kind: 'decor',
      label: 'Fleur',
      collisionRole: 'passable',
      categoryId: 'decor',
      folderId: 'decor/general',
      folderLabel: 'Décors',
      mimeType: 'image/png',
      width: 128,
      height: 128,
      bytes: 1000,
      sourceName: 'flower.png',
      blob: new Blob(['x'], {
        type: 'image/png'
      }),
      createdAt:
        '2026-10-10T00:00:00Z'
    });

  assert.equal(
    objectDefinitionFromUserRecord(
      passableRecord
    ).collision.role,
    'passable'
  );
});

test('legacy user records migrate collision intent deterministically without reading pixels', () => {
  const legacyRock = {
    schemaVersion: 1,
    id: 'legacy',
    definitionId:
      'user.objectdef.rock.legacy',
    assetId:
      'user.object.asset.rock.legacy',
    kind: 'rock',
    label: 'Legacy rock',
    categoryId: 'rocks',
    folderId: 'rocks/general',
    folderLabel: 'Rochers',
    baseSize: {
      width: 180,
      height: 140
    }
  };

  const legacyDecor = {
    ...legacyRock,
    definitionId:
      'user.objectdef.decor.legacy',
    assetId:
      'user.object.asset.decor.legacy',
    kind: 'decor',
    categoryId: 'decor',
    folderId: 'decor/general'
  };

  assert.equal(
    objectDefinitionFromUserRecord(
      legacyRock
    ).collision.role,
    'obstacle'
  );
  assert.equal(
    objectDefinitionFromUserRecord(
      legacyDecor
    ).collision.role,
    'passable'
  );
});

test('Builder import exposes explicit Obstacle / Traversable choice and passes collisionRole into user record', async () => {
  const [html, main] =
    await Promise.all([
      source('builder.html'),
      source(
        'src/builder/world-builder-main.js'
      )
    ]);

  assert.match(
    html,
    /id=["']user-object-collision["']/
  );
  assert.match(
    html,
    /value=["']obstacle["'][^>]*>Obstacle/
  );
  assert.match(
    html,
    /value=["']passable["'][^>]*>Traversable/
  );

  assert.match(
    main,
    /collisionRole:\s*\$\('user-object-collision'\)\.value/
  );
});

test('Collision World never derives obstacle geometry from assets or renderer pixels', async () => {
  const [collision, model, catalog] =
    await Promise.all([
      source('src/core/collision.js'),
      source(
        'src/world/world-object-model.js'
      ),
      source(
        'src/objects/object-definition-catalog.js'
      )
    ]);

  assert.equal(
    /assetId|\.webp|\.png|getImageData|alphaBounds/.test(
      collision + model
    ),
    false
  );

  assert.match(
    catalog,
    /collision:\s*\{/
  );
});

test('living runtime keeps using the same Collision World obstacle authority', async () => {
  const living =
    await source(
      'src/living/living-runtime.js'
    );

  assert.match(
    living,
    /collisionCheck\s*=\s*isBlocked/
  );
  assert.equal(
    /assetId.*collision|mapVisual.*collision/.test(
      living
    ),
    false
  );
});
