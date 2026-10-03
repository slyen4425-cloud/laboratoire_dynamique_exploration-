import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeWorldActorPlacement
} from '../src/actors/world-actor-placement-model.js';
import {
  createPlacedMapActorView
} from '../src/actors/placed-map-actor-view.js';
import {
  createCaptureActorDefinitionProviderV1
} from '../src/capture/capture-actor-definition-provider-v1.js';
import {
  addActorPlacement,
  createWorldBuilderDraft,
  deleteActorPlacement,
  updateActorPlacement
} from '../src/builder/world-builder-draft.js';
import {
  demoWorldDocument
} from '../src/world/demo-world.js';

function loupTransfer() {
  return {
    schema: 'capture-creature-transfer-v1',
    version: 1,
    draft: {
      id: 'crea-loup',
      displayName: 'Loup volcanique',
      presentation: {
        id: 'creature:crea-loup',
        version: 2,
        subjectType: 'creature',
        subjectId: 'crea-loup',
        visual: {
          front: {
            assetId: 'pack:capture:creature-loup-volcanique-opponent-01'
          },
          back: {
            assetId: 'pack:capture:creature-loup-volcanique-opponent-01'
          },
          icon: {
            assetId: 'pack:capture:creature-loup-volcanique-icon-01'
          }
        }
      }
    }
  };
}

function visualCatalog() {
  return {
    version: 1,
    assets: [
      {
        id: 'pack:capture:creature-loup-volcanique-opponent-01',
        resource: {
          file: 'capture/creatures/loup_volcanique/runtime/loup_volcanique_opponent.webp'
        }
      },
      {
        id: 'pack:capture:creature-loup-volcanique-opponent-01',
        resource: {
          file: 'capture/creatures/loup_volcanique/runtime/loup_volcanique_opponent.webp'
        }
      }
    ]
  };
}

test('WorldActorPlacement keeps only reference + world placement', () => {
  const actor = normalizeWorldActorPlacement({
    id: 'loup-1',
    actorDefinitionId: 'capture:creature:crea-loup',
    x: 360,
    y: 220,
    facingX: -1,
    assetId: 'forbidden-copy',
    mapVisual: { assetId: 'forbidden-copy' },
    targetHeight: 200
  });

  assert.deepEqual(actor, {
    schemaVersion: 1,
    id: 'loup-1',
    actorDefinitionId: 'capture:creature:crea-loup',
    x: 360,
    y: 220,
    facingX: -1
  });
  assert.equal('assetId' in actor, false);
  assert.equal('mapVisual' in actor, false);
});

test('Capture Actor Definition resolves Loup visual from transfer asset id + global catalog', () => {
  const provider =
    createCaptureActorDefinitionProviderV1({
      creatureTransfers: [loupTransfer()],
      visualAssetCatalog: visualCatalog(),
      assetRoot:
        './capture-assets/assets/library/'
    });

  const definition =
    provider.resolveDefinition(
      'capture:creature:crea-loup'
    );

  assert.equal(definition.displayName, 'Loup volcanique');
  assert.equal(definition.role, 'creature');
  assert.equal(
    definition.mapVisual.assetId,
    'pack:capture:creature-loup-volcanique-opponent-01'
  );
  assert.equal(
    provider.resolveAsset(
      definition.mapVisual.assetId
    ).path,
    './capture-assets/assets/library/capture/creatures/loup_volcanique/runtime/loup_volcanique_opponent.webp'
  );
});

test('Placed map actor view gets visual only from resolved Actor Definition', () => {
  const provider =
    createCaptureActorDefinitionProviderV1({
      creatureTransfers: [loupTransfer()],
      visualAssetCatalog: visualCatalog(),
      assetRoot:
        './capture-assets/assets/library/'
    });
  const placement =
    normalizeWorldActorPlacement({
      id: 'loup-1',
      actorDefinitionId: 'capture:creature:crea-loup',
      x: 360,
      y: 220,
      facingX: 1
    });

  const view = createPlacedMapActorView(
    placement,
    provider.resolveDefinition
  );

  assert.equal(view.x, 360);
  assert.equal(view.y, 220);
  assert.equal(view.facingX, 1);
  assert.equal(view.moving, false);
  assert.equal(
    view.mapVisual.assetId,
    'pack:capture:creature-loup-volcanique-opponent-01'
  );
});

test('Builder mutates canonical WorldArea actors without embedding visuals', () => {
  let draft = createWorldBuilderDraft(
    demoWorldDocument
  );
  const areaId = 'forest-exterior';
  const before =
    draft.areas.find((area) => area.id === areaId)
      .actors.length;

  draft = addActorPlacement(
    draft,
    areaId,
    {
      actorDefinitionId:
        'capture:creature:crea-loup',
      x: 500,
      y: 400
    }
  );

  const area =
    draft.areas.find((item) => item.id === areaId);
  assert.equal(area.actors.length, before + 1);

  const placed = area.actors.at(-1);
  assert.equal(
    placed.actorDefinitionId,
    'capture:creature:crea-loup'
  );
  assert.equal('mapVisual' in placed, false);
  assert.equal('assetId' in placed, false);

  draft = updateActorPlacement(
    draft,
    areaId,
    placed.id,
    {
      x: 620,
      y: 440,
      facingX: -1
    }
  );
  const moved = draft.areas
    .find((item) => item.id === areaId)
    .actors.find((item) => item.id === placed.id);
  assert.equal(moved.x, 620);
  assert.equal(moved.y, 440);
  assert.equal(moved.facingX, -1);

  draft = deleteActorPlacement(
    draft,
    areaId,
    placed.id
  );
  assert.equal(
    draft.areas.find((item) => item.id === areaId)
      .actors.length,
    before
  );
});

test('Demo map contains Loup sentry by Actor Definition reference only', () => {
  const area = demoWorldDocument.areas.find(
    (item) => item.id === 'forest-exterior'
  );
  const loup = area.actors.find(
    (actor) =>
      actor.actorDefinitionId ===
      'capture:creature:crea-loup'
  );

  assert.ok(loup);
  assert.equal('assetId' in loup, false);
  assert.equal('mapVisual' in loup, false);
});
