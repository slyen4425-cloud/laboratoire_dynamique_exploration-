import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { normalizeWorldSurface } from '../src/world/surface-model.js';

test('regression: selected WorldObject exposes direct scale and rotation gizmo gestures', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(main.includes("mode: 'scale-object'"), true);
  assert.equal(main.includes("mode: 'rotate-object'"), true);
  assert.match(
    main,
    /mode === 'scale-object'[\s\S]*updateWorldObjectTransform\(/
  );
  assert.match(
    main,
    /mode === 'rotate-object'[\s\S]*updateWorldObjectTransform\(/
  );
});

test('regression: Area resize starts from an explicit resize handle', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(main.includes('hitAreaResizeHandle'), true);
  assert.match(
    main,
    /mapTool === 'area-size'[\s\S]*hitAreaResizeHandle/
  );
});

test('regression: WorldSurface canonically preserves paint zones', () => {
  const surface = normalizeWorldSurface({
    baseMaterialId: 'grass.forest',
    zones: [
      {
        id: 'zone-1',
        materialId: 'grass.forest',
        width: 180,
        points: [
          { x: 100, y: 120 },
          { x: 180, y: 190 }
        ]
      }
    ]
  });

  assert.equal(surface.zones.length, 1);
  assert.equal(surface.zones[0].id, 'zone-1');
  assert.equal(surface.zones[0].width, 180);
  assert.equal(surface.zones[0].materialId, 'grass.forest');
});

test('regression: Builder exposes a variable-size terrain paint brush', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  assert.equal(html.includes('data-map-tool="terrain"'), true);
  assert.equal(html.includes('id="terrain-brush-size"'), true);
  assert.equal(html.includes('id="terrain-paint-material"'), true);
});
