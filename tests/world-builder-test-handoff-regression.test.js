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
    .find((object) => object.kind === 'building');

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


test('regression: Builder test session preserves MapActorVisual and optional imported asset source', async () => {
  const {
    createWorldBuilderTestHandoff,
    restoreWorldBuilderTestSession
  } = await import('../src/builder/world-builder-test-handoff.js');

  const actorVisual = {
    assetId: 'actor.user.preview.01',
    role: 'creature',
    targetHeight: 133,
    mirrorHorizontal: false,
    anchorX: 0.44,
    anchorY: 0.92,
    shadow: {
      enabled: true,
      widthRatio: 0.72,
      heightRatio: 0.18,
      opacity: 0.31
    },
    motion: {
      idleAmplitude: 2.4,
      idleFrequency: 1.8,
      walkAmplitude: 5.6,
      walkFrequency: 6.2
    }
  };
  const actorAsset = {
    id: 'actor.user.preview.01',
    kind: 'map-actor-source',
    path: 'data:image/png;base64,VEVTVA==',
    label: 'creature-test.png'
  };

  const payload = createWorldBuilderTestHandoff(
    demoWorldDocument,
    { actorVisual, actorAsset }
  );
  const session = restoreWorldBuilderTestSession(payload);

  assert.ok(session);
  assert.equal(session.document.id, demoWorldDocument.id);
  assert.equal(session.actorVisual.assetId, actorAsset.id);
  assert.equal(session.actorVisual.role, 'creature');
  assert.equal(session.actorVisual.targetHeight, 133);
  assert.equal(session.actorVisual.anchorOverride.x, 0.44);
  assert.equal(session.actorVisual.anchorOverride.y, 0.92);
  assert.equal(session.actorAsset.path, actorAsset.path);
  assert.equal(session.actorAsset.id, actorAsset.id);
});

test('regression: runtime test uses actor visual from Builder handoff instead of hardcoded demo visual', async () => {
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );
  const runtimeMain = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(builderMain, /actorVisual/);
  assert.match(builderMain, /actorAsset/);
  assert.match(builderMain, /saveWorldBuilderTestHandoff\([\s\S]*actorVisual/);

  assert.match(runtimeMain, /readWorldBuilderTestSession/);
  assert.match(runtimeMain, /builderTestSession\?\.actorVisual/);
  assert.match(runtimeMain, /createMapActorAssetResolver/);
});

test('regression: returning from runtime restores actor visual test settings in Builder', async () => {
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(builderMain, /readWorldBuilderTestSession/);
  assert.match(builderMain, /resumedTestSession\?\.actorVisual/);
  assert.match(builderMain, /resumedTestSession\?\.actorAsset/);
});


test('regression: restored actor asset is initialized only after resumed test session', async () => {
  const builderMain = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  const sessionIndex = builderMain.indexOf(
    'const resumedTestSession ='
  );
  const restoreIndex = builderMain.indexOf(
    'importedActorAsset =\n  resumedTestSession?.actorAsset ?? null;'
  );

  assert.ok(sessionIndex >= 0);
  assert.ok(restoreIndex > sessionIndex);
});
