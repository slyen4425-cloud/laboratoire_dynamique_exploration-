import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addSurfacePath,
  createWorldBuilderDraft,
  updateWorldObjectTransform,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

test('regression: Builder test handoff preserves edited canonical WorldDocument', async () => {
  const {
    createWorldBuilderTestHandoff,
    restoreWorldBuilderTestHandoff
  } = await import('../src/builder/world-builder-test-handoff.js');

  let draft = createWorldBuilderDraft(demoWorldDocument);
  const areaId = draft.initialAreaId;
  const building = draft.areas
    .find((area) => area.id === areaId)
    .objects
    .find(
      (object) =>
        object.objectDefinitionId ===
        'objectdef.building.house.fantasy_wood_stone.01'
    );

  draft = updateWorldObjectTransform(
    draft,
    areaId,
    building.id,
    { x: 1337, y: 944, rotationDeg: 37, scaleX: 1.4, scaleY: 0.8 }
  );

  draft = addSurfacePath(
    draft,
    areaId,
    'terrain',
    {
      width: 260,
      materialId: 'ground.sand',
      points: [
        { x: 300, y: 320 },
        { x: 520, y: 430 }
      ]
    }
  );

  const validation = validateWorldBuilderDraft(draft);
  assert.equal(validation.valid, true);

  const payload = createWorldBuilderTestHandoff(validation.document);
  const restored = restoreWorldBuilderTestHandoff(payload);

  const restoredArea = restored.areas.find((area) => area.id === areaId);
  const restoredBuilding = restoredArea.objects.find(
    (object) => object.id === building.id
  );

  assert.equal(restoredBuilding.transform.x, 1337);
  assert.equal(restoredBuilding.transform.y, 944);
  assert.equal(restoredBuilding.transform.rotationDeg, 37);
  assert.equal(restoredBuilding.transform.scaleX, 1.4);
  assert.equal(restoredBuilding.transform.scaleY, 0.8);
  assert.equal(
    restoredArea.surface.zones.some(
      (zone) => zone.width === 260 && zone.materialId === 'ground.sand'
    ),
    true
  );
});

test('regression: test-in-game action is not a blind link to static demo runtime', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );
  const runtimeMain = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.equal(html.includes('id="test-exploration"'), true);
  assert.match(builderMain, /saveWorldBuilderTestHandoff/);
  assert.match(builderMain, /sessionStorage/);
  assert.match(html, /href="\.\/index\.html\?builderTest=1"/);

  assert.match(runtimeMain, /builderTest/);
  assert.match(runtimeMain, /readWorldBuilderTestHandoff/);
  assert.match(runtimeMain, /sessionStorage/);
});

test('regression: returning from test runtime resumes the same Builder document', async () => {
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );
  const runtimeMain = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(builderMain, /resumeBuilderTest/);
  assert.match(builderMain, /readWorldBuilderTestHandoff/);
  assert.match(runtimeMain, /resumeBuilderTest=1/);
});

test('mobile Builder keeps primary map tools reachable without page scrolling', async () => {
  const css = await readFile(
    new URL('../src/builder/world-builder.css', import.meta.url),
    'utf8'
  );

  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.map-tools[\s\S]*position:\s*sticky/);
  assert.match(css, /\.map-tools[\s\S]*overflow-x:\s*auto/);
});


test('regression: Builder test handoff preserves canonical actor placements inside WorldDocument', async () => {
  const {
    createWorldBuilderTestHandoff,
    restoreWorldBuilderTestSession
  } = await import('../src/builder/world-builder-test-handoff.js');

  const payload =
    createWorldBuilderTestHandoff(
      demoWorldDocument
    );
  const session =
    restoreWorldBuilderTestSession(
      payload
    );

  assert.ok(session);
  const loup =
    session.document.areas
      .find(
        (area) =>
          area.id ===
          'forest-exterior'
      )
      .actors.find(
        (actor) =>
          actor.actorDefinitionId ===
          'capture:creature:crea-loup'
      );

  assert.ok(loup);
  assert.equal(
    'mapVisual' in loup,
    false
  );
  assert.equal(
    'assetId' in loup,
    false
  );
});

test('regression: Builder hands off only WorldDocument while runtime resolves placed actor visuals from Actor Catalog', async () => {
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );
  const runtimeMain = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    builderMain,
    /saveWorldBuilderTestHandoff\([\s\S]*result\.document\s*\)/
  );
  assert.doesNotMatch(
    builderMain,
    /actorVisual/
  );
  assert.doesNotMatch(
    builderMain,
    /actorAsset/
  );

  assert.match(
    runtimeMain,
    /createCaptureActorPreviewProviderV1/
  );
  assert.match(
    runtimeMain,
    /createPlacedMapActorView/
  );
  assert.match(
    runtimeMain,
    /currentPlacedMapActors/
  );
  assert.doesNotMatch(
    runtimeMain,
    /builderTestSession\?\.actorVisual/
  );
  assert.doesNotMatch(
    runtimeMain,
    /builderTestSession\?\.actorAsset/
  );
});

test('regression: returning from runtime restores actor placements from the WorldDocument session', async () => {
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    builderMain,
    /readWorldBuilderTestSession/
  );
  assert.match(
    builderMain,
    /resumedTestSession\?\.document/
  );
  assert.match(
    builderMain,
    /selectedActorPlacementId/
  );
  assert.doesNotMatch(
    builderMain,
    /importedActorAsset/
  );
});

