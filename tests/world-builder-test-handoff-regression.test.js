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
  assert.match(builderMain, /createWorldBuilderTestHandoff/);
  assert.match(builderMain, /sessionStorage/);
  assert.match(builderMain, /builderTest=1/);

  assert.match(runtimeMain, /builderTest/);
  assert.match(runtimeMain, /restoreWorldBuilderTestHandoff/);
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
  assert.match(builderMain, /restoreWorldBuilderTestHandoff/);
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
