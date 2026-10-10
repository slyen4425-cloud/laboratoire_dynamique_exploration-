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


test('Building Interiors keeps one WorldObject cache revision across Builder authoring graph', async () => {
  const worldObjectRevision =
    'collision-boundary-worldobject-obstacles-v1';
  const builderEntryRevision =
    'collision-boundary-worldobject-obstacles-v1';

  const [
    html,
    main,
    draft,
    placement,
    renderer,
    catalog,
    userLibrary
  ] = await Promise.all([
    readFile(
      new URL('../builder.html', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/builder/world-builder-main.js',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/builder/world-builder-draft.js',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/world/world-object-placement-model.js',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/render/world-object-renderer.js',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/objects/object-definition-catalog.js',
        import.meta.url
      ),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/objects/user-object-library.js',
        import.meta.url
      ),
      'utf8'
    )
  ]);

  assert.match(
    html,
    new RegExp(
      `world-builder-main\\.js\\?rev=${builderEntryRevision}`
    )
  );
  assert.match(
    html,
    new RegExp(
      `world-builder\\.css\\?rev=${builderEntryRevision}`
    )
  );

  for (const [label, source] of [
    ['main', main],
    ['draft', draft],
    ['placement', placement],
    ['renderer', renderer]
  ]) {
    assert.match(
      source,
      new RegExp(
        `object-definition-catalog\\.js\\?rev=${worldObjectRevision}`
      ),
      `${label}: Object Catalog must use the canonical cache revision`
    );
  }

  for (const [label, source] of [
    ['main', main],
    ['catalog', catalog],
    ['user-library', userLibrary]
  ]) {
    assert.match(
      source,
      new RegExp(
        `object-library-taxonomy\\.js\\?rev=${worldObjectRevision}`
      ),
      `${label}: Object Library taxonomy must use the canonical cache revision`
    );
  }

  assert.doesNotMatch(
    draft,
    /object-definition-catalog\.js\?rev=object-catalog-placement-v1/
  );
  assert.doesNotMatch(
    main,
    /world-object-library-v1-orientation-v1/
  );
});

test('Building models and visual variants remain exposed to the Builder after interior-link work', async () => {
  const [catalog, main] =
    await Promise.all([
      readFile(
        new URL(
          '../src/objects/object-definition-catalog.js',
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

  for (const definitionId of [
    'objectdef.building.house.blue_cottage.01',
    'objectdef.building.house.red_tile.01',
    'objectdef.building.inn.golden_thatch.01'
  ]) {
    assert.match(
      catalog,
      new RegExp(definitionId.replaceAll('.', '\\.'))
    );
  }

  for (const label of [
    'Avant',
    'Côté',
    'Arrière'
  ]) {
    assert.match(catalog, new RegExp(label));
  }

  assert.match(
    main,
    /object-visual-variant-fields/
  );
  assert.match(
    main,
    /variantDefinition\?\.variants/
  );
});

test('Passages UI keeps one canonical Portal model while exposing activation radius for door anchors', async () => {
  const html =
    await readFile(
      new URL('../builder.html', import.meta.url),
      'utf8'
    );

  assert.match(
    html,
    /data-tab=["']portals["']>Passages<\/button>/
  );
  assert.match(
    html,
    /<h2>Passages<\/h2>/
  );
  assert.match(
    html,
    /Départ/
  );
  assert.match(
    html,
    /Zone d.activation/
  );
  assert.match(
    html,
    /Destination/
  );

  const pointFields =
    html.match(
      /<div id=["']portal-point-fields["'][\s\S]*?<\/div>/
    )?.[0] ?? '';

  assert.doesNotMatch(
    pointFields,
    /portal-radius/,
    'radius must not disappear when trigger kind is object-anchor'
  );

  assert.match(
    html,
    /id=["']portal-trigger-zone-fields["'][\s\S]*?id=["']portal-radius["']/
  );
  assert.match(
    html,
    /Entrée et intérieur/
  );
});


test('building interior helper creates enabled visible entry and exit Portals', () => {
  const source = createUnlinkedHouseDraft({
    id: 'enabled-portal-house'
  });

  const linked = createBuildingInteriorLink(
    source.draft,
    {
      sourceAreaId: source.sourceAreaId,
      buildingId: source.buildingId,
      anchorId: 'main-door'
    }
  );

  const outgoing = outgoingFor(
    linked,
    source.sourceAreaId,
    source.buildingId
  );
  const interior = linked.areas.find(
    (area) => area.id === outgoing?.targetAreaId
  );
  const returnPortal = linked.portals.find(
    (portal) =>
      portal.sourceAreaId === interior?.id &&
      portal.targetAreaId === source.sourceAreaId
  );

  assert.ok(outgoing);
  assert.ok(returnPortal);
  assert.equal(outgoing.enabled, true);
  assert.equal(returnPortal.enabled, true);
  assert.equal(outgoing.visual?.visible, true);
  assert.equal(outgoing.visual?.marker, 'entry');
  assert.equal(returnPortal.visual?.visible, true);
  assert.equal(returnPortal.visual?.marker, 'exit');
});

test('Builder exposes an explicit building model/orientation/interior workflow and keeps raw Portal wiring advanced', async () => {
  const [html, main] = await Promise.all([
    readFile(new URL('../builder.html', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/builder/world-builder-main.js', import.meta.url),
      'utf8'
    )
  ]);

  assert.match(html, /Modèle \/ objet à placer/);
  assert.match(html, /Orientation du bâtiment/);
  assert.match(html, /Entrée et intérieur/);
  assert.match(html, /data-tab=["\']portals["\'][^>]*>Passages</);
  assert.match(html, /id=["']portal-advanced-settings["']/);
  assert.match(html, /Réglages avancés/);

  assert.match(
    main,
    /const variantDefinition\s*=/
  );
  assert.doesNotMatch(
    main,
    /variantFields\.hidden\s*=\s*!placement\s*\|\|/
  );
});


test('Builder keeps building authoring controls visible and synchronizes the library to the selected building', async () => {
  const [html, main] = await Promise.all([
    readFile(new URL('../builder.html', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/builder/world-builder-main.js', import.meta.url),
      'utf8'
    )
  ]);

  assert.match(
    html,
    /id=["']building-authoring-fields["']/,
    'building authoring must have one obvious panel'
  );
  assert.match(
    html,
    /Modèle \/ objet à placer/,
    'the placement selector must be understandable as the model selector'
  );
  assert.match(
    html,
    /id=["']object-visual-variant-fields["'][^>]*>/,
    'orientation controls must remain in the building panel'
  );
  assert.match(
    main,
    /syncObjectLibraryToSelectedPlacement/,
    'map/object selection must synchronize category + folder'
  );
  assert.match(
    main,
    /variantFields\.hidden\s*=\s*!isBuilding/,
    'orientation panel stays visible for every selected building'
  );
});

test('Builder renders the selected building entrance from canonical doorAnchor or Portal geometry', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(main, /buildingDoorAnchorWorld/);
  assert.match(main, /drawBuildingEntranceAuthoringOverlay/);
  assert.match(
    main,
    /currentBuildingInteriorLink\(\)/,
    'linked entrance overlay must reuse the canonical Portal when available'
  );
});

test('Portal tab presents a simple liaison summary and keeps raw Portal fields under advanced settings', async () => {
  const [html, main] = await Promise.all([
    readFile(new URL('../builder.html', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/builder/world-builder-main.js', import.meta.url),
      'utf8'
    )
  ]);

  assert.match(
    html,
    /id=["']portal-summary["']/,
    'Portal tab needs a human-readable summary'
  );
  assert.match(
    html,
    /<details[^>]+id=["']portal-advanced-settings["']/,
    'raw Portal fields must be available but not dominate the normal workflow'
  );
  assert.match(
    main,
    /portal-summary/,
    'Portal summary must be refreshed from canonical Portal data'
  );
});


test('Exploration runtime keeps the canonical WorldObject revision behind the current public entry revision', async () => {
  const publicEntryRevision =
    'collision-boundary-worldobject-obstacles-v1';
  const worldObjectRevision =
    'collision-boundary-worldobject-obstacles-v1';
  const [indexHtml, runtimeMain] =
    await Promise.all([
      readFile(
        new URL('../index.html', import.meta.url),
        'utf8'
      ),
      readFile(
        new URL('../src/main.js', import.meta.url),
        'utf8'
      )
    ]);

  assert.match(
    indexHtml,
    new RegExp(
      `main\\.js\\?rev=${publicEntryRevision}`
    )
  );

  for (const modulePath of [
    'render/world-object-renderer.js',
    'world/world-object-placement-model.js',
    'objects/object-definition-catalog.js',
    'objects/user-object-library.js',
    'assets/world-object-asset-adapter.js',
    'assets/user-world-object-asset-resolver.js',
    'storage/user-world-object-store.js'
  ]) {
    assert.match(
      runtimeMain,
      new RegExp(
        modulePath
          .replaceAll('/', '\\/')
          .replaceAll('.', '\\.') +
        `\\?rev=${worldObjectRevision}`
      ),
      `runtime must resolve ${modulePath} through the canonical revision`
    );
  }
});
