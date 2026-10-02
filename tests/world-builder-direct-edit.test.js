import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { demoWorldDocument } from '../src/world/demo-world.js';
import {
  addSurfacePath,
  createWorldBuilderDraft,
  deleteSurfacePath,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  updateSurfacePath,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';
import {
  canvasPointToWorld,
  computeBuilderView,
  panBuilderCenter,
  pointInRotatedRect,
  zoomBuilderAtCanvasPoint
} from '../src/builder/world-builder-viewport.js';

test('direct Terrain drawing writes routes and rivers into the canonical WorldDocument surface', () => {
  const source = demoWorldDocument;
  const initial = createWorldBuilderDraft(source);
  const areaId = initial.initialAreaId;
  const beforeSourceRoutes =
    source.areas.find((area) => area.id === areaId).surface.routes.length;

  let draft = addSurfacePath(
    initial,
    areaId,
    'river',
    {
      width: 96,
      materialId: 'water.forest_stream',
      points: [
        { x: 100, y: 120 },
        { x: 240, y: 260 },
        { x: 390, y: 220 }
      ]
    }
  );

  const area = draft.areas.find((item) => item.id === areaId);
  const created = area.surface.rivers.at(-1);

  assert.equal(created.width, 96);
  assert.equal(created.materialId, 'water.forest_stream');
  assert.equal(created.points.length, 3);
  assert.equal(
    source.areas.find((item) => item.id === areaId).surface.routes.length,
    beforeSourceRoutes
  );

  const validation = validateWorldBuilderDraft(draft);
  assert.equal(validation.valid, true);
  assert.equal(
    validation.document.areas
      .find((item) => item.id === areaId)
      .surface.rivers
      .some((river) => river.id === created.id),
    true
  );
});

test('surface path editing and deletion stay inside World Builder draft helpers', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);
  const areaId = draft.initialAreaId;

  draft = addSurfacePath(
    draft,
    areaId,
    'route',
    {
      width: 70,
      materialId: 'road.dirt',
      points: [
        { x: 20, y: 20 },
        { x: 120, y: 100 }
      ]
    }
  );

  const area = draft.areas.find((item) => item.id === areaId);
  const created = area.surface.routes.at(-1);

  draft = updateSurfacePath(
    draft,
    areaId,
    'route',
    created.id,
    { width: 110 }
  );

  assert.equal(
    draft.areas
      .find((item) => item.id === areaId)
      .surface.routes
      .find((item) => item.id === created.id)
      .width,
    110
  );

  draft = deleteSurfacePath(
    draft,
    areaId,
    'route',
    created.id
  );

  assert.equal(
    draft.areas
      .find((item) => item.id === areaId)
      .surface.routes
      .some((item) => item.id === created.id),
    false
  );
});

test('Terrain drawing survives WorldDocument export/import round-trip', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);
  const areaId = draft.initialAreaId;

  draft = addSurfacePath(
    draft,
    areaId,
    'river',
    {
      width: 88,
      materialId: 'water.forest_stream',
      points: [
        { x: 90, y: 100 },
        { x: 180, y: 160 }
      ]
    }
  );

  const json = serializeWorldBuilderDraft(draft);
  const imported = importWorldBuilderDocument(json);

  assert.equal(
    imported.areas
      .find((item) => item.id === areaId)
      .surface.rivers
      .some((river) => river.width === 88),
    true
  );
});

test('zoom around a map point keeps the same world position under the cursor', () => {
  const area = { width: 2400, height: 1600 };
  const center = { x: 1000, y: 700 };
  const canvasWidth = 700;
  const canvasHeight = 500;
  const canvasX = 520;
  const canvasY = 210;

  const before = computeBuilderView({
    area,
    center,
    zoom: 0.5,
    canvasWidth,
    canvasHeight
  });
  const worldBefore = canvasPointToWorld({
    canvasX,
    canvasY,
    camera: before.camera,
    zoom: before.zoom
  });

  const after = zoomBuilderAtCanvasPoint({
    area,
    center,
    oldZoom: 0.5,
    newZoom: 1.1,
    canvasWidth,
    canvasHeight,
    canvasX,
    canvasY
  });
  const worldAfter = canvasPointToWorld({
    canvasX,
    canvasY,
    camera: after.camera,
    zoom: after.zoom
  });

  assert.ok(Math.abs(worldBefore.x - worldAfter.x) < 1e-9);
  assert.ok(Math.abs(worldBefore.y - worldAfter.y) < 1e-9);
});

test('pan gesture moves view center in world units', () => {
  assert.deepEqual(
    panBuilderCenter({
      center: { x: 500, y: 400 },
      deltaCanvasX: 100,
      deltaCanvasY: -50,
      zoom: 0.5
    }),
    {
      x: 300,
      y: 500
    }
  );
});

test('direct object hit test supports rotated WorldObjects', () => {
  assert.equal(
    pointInRotatedRect(
      { x: 100, y: 125 },
      {
        x: 100,
        y: 100,
        rotation: Math.PI / 2,
        width: 100,
        height: 40
      }
    ),
    true
  );

  assert.equal(
    pointInRotatedRect(
      { x: 160, y: 100 },
      {
        x: 100,
        y: 100,
        rotation: Math.PI / 2,
        width: 100,
        height: 40
      }
    ),
    false
  );
});

test('World Builder direct-edit UI exposes map tools and direct zoom gestures', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  for (const id of [
    'map-tool-select',
    'map-tool-area',
    'map-tool-route',
    'map-tool-river',
    'terrain-route-material',
    'terrain-river-material',
    'terrain-path-select'
  ]) {
    assert.equal(html.includes(`id="${id}"`), true, id);
  }

  assert.match(main, /canvas\.addEventListener\('pointerdown'/);
  assert.match(main, /canvas\.addEventListener\(\s*'wheel'/);
  assert.match(main, /updateWorldObjectTransform/);
  assert.match(main, /addSurfacePath/);
  assert.match(main, /mode: 'resize-area'/);
});


test('direct-edit UI keeps WorldDocument draft as the only persistent map authority', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    /\bdraft\.areas(?:\[[^\]]+\])?\s*=/.test(main),
    false,
    'UI must not assign draft.areas directly'
  );
  assert.equal(
    /\bdraft\.portals(?:\[[^\]]+\])?\s*=/.test(main),
    false,
    'UI must not assign draft.portals directly'
  );
  assert.equal(
    /\bBuilderMap\b|\bPreviewWorld\b/.test(main),
    false,
    'no parallel Builder/preview world format'
  );

  assert.match(
    main,
    /const result = currentValidation\(\);[\s\S]*const document = result\.document;/,
    'preview must render the normalized document derived from the draft'
  );
});

test('direct gestures mutate canonical draft through Builder mutation helpers only', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    main,
    /mode === 'drag-object'[\s\S]*draft = updateWorldObjectTransform\(/,
    'object drag must update canonical WorldObject transform'
  );
  assert.match(
    main,
    /mode === 'drag-spawn'[\s\S]*draft = updateSpawn\(/,
    'spawn drag must update canonical Spawn'
  );
  assert.match(
    main,
    /mode === 'resize-area'[\s\S]*draft = updateAreaProperties\(/,
    'area resize must update canonical WorldArea dimensions'
  );
  assert.match(
    main,
    /draft = addSurfacePath\([\s\S]*draft = appendSurfacePathPoint\(/,
    'terrain drawing must update canonical surface paths'
  );
});


test('terrain brush zones survive canonical WorldDocument export/import', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);
  const areaId = draft.initialAreaId;

  draft = addSurfacePath(
    draft,
    areaId,
    'terrain',
    {
      width: 220,
      materialId: 'ground.sand',
      points: [
        { x: 120, y: 180 },
        { x: 220, y: 250 },
        { x: 340, y: 300 }
      ]
    }
  );

  const validation = validateWorldBuilderDraft(draft);
  assert.equal(validation.valid, true);

  const zone = validation.document.areas
    .find((area) => area.id === areaId)
    .surface.zones.at(-1);

  assert.equal(zone.width, 220);
  assert.equal(zone.materialId, 'ground.sand');

  const imported = importWorldBuilderDocument(
    serializeWorldBuilderDraft(draft)
  );
  const importedZone = imported.areas
    .find((area) => area.id === areaId)
    .surface.zones.at(-1);

  assert.deepEqual(importedZone, zone);
});

test('Surface Renderer consumes canonical terrain zones before linear paths', async () => {
  const renderer = await readFile(
    new URL('../src/render/surface-renderer.js', import.meta.url),
    'utf8'
  );

  assert.match(renderer, /for \(const zone of surface\.zones/);
  assert.match(renderer, /materialRegistry\.require\([\s\S]*zone\.materialId,[\s\S]*'surface'/);
});


test('route and river widths use brush sliders with live values and large water range', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    html,
    /id="terrain-route-width"[^>]*type="range"[^>]*max="600"/
  );
  assert.equal(html.includes('id="terrain-route-width-value"'), true);

  assert.match(
    html,
    /id="terrain-river-width"[^>]*type="range"[^>]*max="2400"/
  );
  assert.equal(html.includes('id="terrain-river-width-value"'), true);

  assert.match(
    main,
    /mapTool === 'terrain' \|\|[\s\S]*mapTool === 'route' \|\|[\s\S]*mapTool === 'river'/
  );
  assert.match(main, /terrain-route-width-value/);
  assert.match(main, /terrain-river-width-value/);
});

test('very wide river remains canonical through export and import', () => {
  let draft = createWorldBuilderDraft(demoWorldDocument);
  const areaId = draft.initialAreaId;

  draft = addSurfacePath(
    draft,
    areaId,
    'river',
    {
      width: 1800,
      materialId: 'water.forest_stream',
      points: [
        { x: 200, y: 300 },
        { x: 800, y: 300 }
      ]
    }
  );

  const validation = validateWorldBuilderDraft(draft);
  assert.equal(validation.valid, true);

  const river = validation.document.areas
    .find((area) => area.id === areaId)
    .surface.rivers.at(-1);

  assert.equal(river.width, 1800);

  const imported = importWorldBuilderDocument(
    serializeWorldBuilderDraft(draft)
  );
  const importedRiver = imported.areas
    .find((area) => area.id === areaId)
    .surface.rivers.at(-1);

  assert.equal(importedRiver.width, 1800);
  assert.deepEqual(importedRiver, river);
});


test('regression: Builder zoom uses gestures/wheel without redundant plus-minus controls', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(html.includes('id="preview-zoom-in"'), false);
  assert.equal(html.includes('id="preview-zoom-out"'), false);
  assert.equal(html.includes('id="preview-zoom"'), false);

  assert.match(main, /canvas\.addEventListener\(\s*'wheel'/);
  assert.match(main, /beginPinch\(\)/);
  assert.match(main, /updatePinch\(\)/);
});


test('regression: pinch zoom has no stale dependency on removed zoom controls', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    main.includes('syncZoomInput()'),
    false,
    'pinch must not call the removed zoom-control synchronizer'
  );
  assert.match(main, /function beginPinch\(\)/);
  assert.match(main, /function updatePinch\(\)/);
});
