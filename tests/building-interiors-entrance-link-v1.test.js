import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addWorldObject,
  createBuildingInteriorLink,
  createWorldBuilderDraft,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  updateWorldObjectTransform,
  updateWorldObjectOverrides,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {
  resolvePortalTriggerPoint
} from '../src/world/portal-model.js';
import {
  resolveWorldAreaSpawnPoint
} from '../src/world/world-area-model.js';

function createUnlinkedHouseDraft({
  id = 'interior-test-house',
  x = 980,
  y = 620
} = {}) {
  let draft = createWorldBuilderDraft(
    demoWorldDocument
  );
  const sourceArea =
    draft.areas.find(
      (area) => area.kind === 'exterior'
    ) ?? draft.areas[0];

  draft = addWorldObject(
    draft,
    sourceArea.id,
    {
      id,
      objectDefinitionId:
        'objectdef.building.house.blue_cottage.01',
      transform: {
        x,
        y,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1
      }
    }
  );

  return {
    draft,
    sourceAreaId: sourceArea.id,
    buildingId: id
  };
}

function outgoingFor(
  draft,
  sourceAreaId,
  buildingId,
  anchorId = 'main-door'
) {
  return draft.portals.find(
    (portal) =>
      portal.sourceAreaId === sourceAreaId &&
      portal.trigger?.kind === 'object-anchor' &&
      portal.trigger.objectId === buildingId &&
      portal.trigger.anchorId === anchorId
  ) ?? null;
}

test('creating a building interior uses canonical WorldArea + Portal + Spawn authorities', () => {
  const source =
    createUnlinkedHouseDraft();

  const beforeAreas =
    source.draft.areas.length;
  const beforePortals =
    source.draft.portals.length;

  const next =
    createBuildingInteriorLink(
      source.draft,
      {
        sourceAreaId:
          source.sourceAreaId,
        buildingId:
          source.buildingId,
        anchorId: 'main-door'
      }
    );

  assert.equal(
    next.areas.length,
    beforeAreas + 1
  );
  assert.equal(
    next.portals.length,
    beforePortals + 2
  );

  const outgoing =
    outgoingFor(
      next,
      source.sourceAreaId,
      source.buildingId
    );

  assert.ok(outgoing);
  assert.equal(
    outgoing.trigger.kind,
    'object-anchor'
  );

  const interior =
    next.areas.find(
      (area) =>
        area.id ===
        outgoing.targetAreaId
    );

  assert.ok(interior);
  assert.equal(interior.kind, 'interior');

  const entrySpawn =
    interior.spawns.find(
      (spawn) =>
        spawn.id ===
        outgoing.targetSpawnId
    );

  assert.ok(entrySpawn);
  assert.equal(
    Boolean(entrySpawn.anchor),
    false
  );

  const returnPortal =
    next.portals.find(
      (portal) =>
        portal.sourceAreaId ===
          interior.id &&
        portal.targetAreaId ===
          source.sourceAreaId
    );

  assert.ok(returnPortal);
  assert.equal(
    returnPortal.trigger.kind,
    'point'
  );

  const outside =
    next.areas.find(
      (area) =>
        area.id ===
        source.sourceAreaId
    );
  const returnSpawn =
    outside.spawns.find(
      (spawn) =>
        spawn.id ===
        returnPortal.targetSpawnId
    );

  assert.ok(returnSpawn);
  assert.deepEqual(
    returnSpawn.anchor,
    {
      kind: 'building-door',
      objectId:
        source.buildingId,
      anchorId: 'main-door',
      offset:
        returnSpawn.anchor.offset
    }
  );
  assert.ok(
    returnSpawn.anchor.offset > 0
  );
  assert.equal(
    Object.hasOwn(returnSpawn, 'x'),
    false
  );
  assert.equal(
    Object.hasOwn(returnSpawn, 'y'),
    false
  );

  const distance =
    Math.hypot(
      returnPortal.trigger.x -
        entrySpawn.x,
      returnPortal.trigger.y -
        entrySpawn.y
    );

  assert.ok(
    distance >
      returnPortal.trigger.radius,
    'entry spawn must not sit inside the return trigger'
  );

  const validation =
    validateWorldBuilderDraft(next);

  assert.equal(
    validation.valid,
    true,
    validation.errors.join(', ')
  );
});

test('building transform moves entrance trigger and anchored exterior return spawn without synchronization state', () => {
  const source =
    createUnlinkedHouseDraft();

  let draft =
    createBuildingInteriorLink(
      source.draft,
      {
        sourceAreaId:
          source.sourceAreaId,
        buildingId:
          source.buildingId,
        anchorId: 'main-door'
      }
    );

  let document =
    validateWorldBuilderDraft(draft)
      .document;
  let outgoing =
    outgoingFor(
      document,
      source.sourceAreaId,
      source.buildingId
    );
  const interior =
    document.areas.find(
      (area) =>
        area.id ===
        outgoing.targetAreaId
    );
  const returnPortal =
    document.portals.find(
      (portal) =>
        portal.sourceAreaId ===
          interior.id &&
        portal.targetAreaId ===
          source.sourceAreaId
    );
  const outside =
    document.areas.find(
      (area) =>
        area.id ===
        source.sourceAreaId
    );

  const beforeTrigger =
    resolvePortalTriggerPoint(
      document.areas,
      outgoing
    );
  const beforeReturn =
    resolveWorldAreaSpawnPoint(
      outside,
      returnPortal.targetSpawnId
    );

  draft =
    updateWorldObjectTransform(
      draft,
      source.sourceAreaId,
      source.buildingId,
      {
        x: 1240,
        y: 770,
        rotationDeg: 90,
        scaleX: 1.3,
        scaleY: 0.8
      }
    );

  document =
    validateWorldBuilderDraft(draft)
      .document;
  outgoing =
    outgoingFor(
      document,
      source.sourceAreaId,
      source.buildingId
    );

  const afterOutside =
    document.areas.find(
      (area) =>
        area.id ===
        source.sourceAreaId
    );
  const afterTrigger =
    resolvePortalTriggerPoint(
      document.areas,
      outgoing
    );
  const afterReturn =
    resolveWorldAreaSpawnPoint(
      afterOutside,
      returnPortal.targetSpawnId
    );

  assert.notDeepEqual(
    afterTrigger,
    beforeTrigger
  );
  assert.notDeepEqual(
    afterReturn,
    beforeReturn
  );

  const rawReturnSpawn =
    draft.areas
      .find(
        (area) =>
          area.id ===
          source.sourceAreaId
      )
      .spawns
      .find(
        (spawn) =>
          spawn.id ===
          returnPortal.targetSpawnId
      );

  assert.equal(
    Object.hasOwn(rawReturnSpawn, 'x'),
    false
  );
  assert.equal(
    Object.hasOwn(rawReturnSpawn, 'y'),
    false
  );
});

test('creating the same building entrance twice is idempotent and linking an existing interior reuses the same contract', () => {
  const one =
    createUnlinkedHouseDraft({
      id: 'house-one'
    });

  const linked =
    createBuildingInteriorLink(
      one.draft,
      {
        sourceAreaId:
          one.sourceAreaId,
        buildingId:
          one.buildingId,
        anchorId: 'main-door'
      }
    );

  const areasAfterOne =
    linked.areas.length;
  const portalsAfterOne =
    linked.portals.length;

  const duplicate =
    createBuildingInteriorLink(
      linked,
      {
        sourceAreaId:
          one.sourceAreaId,
        buildingId:
          one.buildingId,
        anchorId: 'main-door'
      }
    );

  assert.equal(
    duplicate.areas.length,
    areasAfterOne
  );
  assert.equal(
    duplicate.portals.length,
    portalsAfterOne
  );

  const second =
    createUnlinkedHouseDraft({
      id: 'house-two',
      x: 1320,
      y: 820
    });

  const existingInterior =
    second.draft.areas.find(
      (area) =>
        area.kind === 'interior'
    );

  assert.ok(existingInterior);

  const toExisting =
    createBuildingInteriorLink(
      second.draft,
      {
        sourceAreaId:
          second.sourceAreaId,
        buildingId:
          second.buildingId,
        anchorId: 'main-door',
        targetAreaId:
          existingInterior.id
      }
    );

  const outgoing =
    outgoingFor(
      toExisting,
      second.sourceAreaId,
      second.buildingId
    );

  assert.equal(
    outgoing.targetAreaId,
    existingInterior.id
  );
  assert.equal(
    toExisting.areas.length,
    second.draft.areas.length
  );
  assert.equal(
    validateWorldBuilderDraft(
      toExisting
    ).valid,
    true
  );
});

test('building interior connections survive canonical export and import', () => {
  const source =
    createUnlinkedHouseDraft();

  const linked =
    createBuildingInteriorLink(
      source.draft,
      {
        sourceAreaId:
          source.sourceAreaId,
        buildingId:
          source.buildingId,
        anchorId: 'main-door'
      }
    );

  const json =
    serializeWorldBuilderDraft(
      linked
    );
  const restored =
    importWorldBuilderDocument(
      json
    );

  const outgoing =
    outgoingFor(
      restored,
      source.sourceAreaId,
      source.buildingId
    );

  assert.ok(outgoing);
  assert.ok(
    restored.areas.some(
      (area) =>
        area.id ===
          outgoing.targetAreaId &&
        area.kind === 'interior'
    )
  );
});

test('Builder Objects UI exposes one building interior linkage surface backed by the canonical draft helper', async () => {
  const [html, main] =
    await Promise.all([
      readFile(
        new URL(
          '../builder.html',
          import.meta.url
        ),
        'utf8'
      ),
      readFile(
        new URL(
          '../src/builder/world-builder-main.js',
          import.meta.url
        ),
        'utf8'
      )
    ]);

  for (const id of [
    'building-interior-fields',
    'building-interior-status',
    'building-interior-target-area',
    'building-interior-create',
    'building-interior-link',
    'building-interior-open'
  ]) {
    assert.match(
      html,
      new RegExp(
        `id=["']${id}["']`
      ),
      id
    );
  }

  assert.match(
    main,
    /createBuildingInteriorLink/
  );
  assert.match(
    main,
    /building-interior-status/
  );
});


test('explicit unknown interior target never falls back to creating another authority', () => {
  const source =
    createUnlinkedHouseDraft({
      id: 'house-explicit-target'
    });

  const beforeAreas =
    source.draft.areas.length;
  const beforePortals =
    source.draft.portals.length;

  const next =
    createBuildingInteriorLink(
      source.draft,
      {
        sourceAreaId:
          source.sourceAreaId,
        buildingId:
          source.buildingId,
        anchorId: 'main-door',
        targetAreaId:
          'missing-interior-area'
      }
    );

  assert.equal(
    next.areas.length,
    beforeAreas
  );
  assert.equal(
    next.portals.length,
    beforePortals
  );
  assert.equal(
    outgoingFor(
      next,
      source.sourceAreaId,
      source.buildingId
    ),
    null
  );
});


test('visual variants never move the canonical building entrance', () => {
  const source =
    createUnlinkedHouseDraft({
      id: 'multi-view-house'
    });

  let draft =
    createBuildingInteriorLink(
      source.draft,
      {
        sourceAreaId:
          source.sourceAreaId,
        buildingId:
          source.buildingId,
        anchorId: 'main-door'
      }
    );

  let document =
    validateWorldBuilderDraft(draft)
      .document;
  let outgoing =
    outgoingFor(
      document,
      source.sourceAreaId,
      source.buildingId
    );
  const before =
    resolvePortalTriggerPoint(
      document.areas,
      outgoing
    );

  draft =
    updateWorldObjectOverrides(
      draft,
      source.sourceAreaId,
      source.buildingId,
      {
        visualVariantId: 'back'
      }
    );

  document =
    validateWorldBuilderDraft(draft)
      .document;
  outgoing =
    outgoingFor(
      document,
      source.sourceAreaId,
      source.buildingId
    );
  const after =
    resolvePortalTriggerPoint(
      document.areas,
      outgoing
    );

  assert.deepEqual(
    after,
    before,
    'visualVariantId must not become a second gameplay orientation authority'
  );
});
