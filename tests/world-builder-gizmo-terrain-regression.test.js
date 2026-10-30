import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { normalizeWorldSurface } from '../src/world/surface-model.js';
import {
  normalizeWorldObjectPlacement,
  resolveWorldObjectPlacement
} from '../src/world/world-object-placement-model.js';
import {
  worldObjectBaseDimensions,
  worldObjectVisualRect
} from '../src/world/world-object-model.js';

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

  assert.equal(html.includes('data-map-tool="paint"'), true);
  assert.equal(html.includes('id="terrain-brush-size"'), true);
  assert.equal(html.includes('id="terrain-paint-material"'), true);
  assert.equal(html.includes('id="paint-brush-minus"'), true);
  assert.equal(html.includes('id="paint-brush-plus"'), true);
});


test('regression: generic showcase WorldObjects expose one canonical visual rect for Builder hit-test and gizmos', () => {
  for (const objectDefinitionId of [
    'objectdef.tree.forest.oak.01',
    'objectdef.rock.forest.boulder.01',
    'objectdef.door.fantasy.wood.01',
    'objectdef.stairs.stone.simple.01'
  ]) {
    const placement = normalizeWorldObjectPlacement({
      id: 'generic-hit-target',
      objectDefinitionId,
      transform: {
        x: 320,
        y: 240,
        rotationDeg: 30,
        scaleX: 1.25,
        scaleY: 0.8
      }
    });
    const object = resolveWorldObjectPlacement(placement);
    const rect = worldObjectVisualRect(object);
    const base = worldObjectBaseDimensions(object);

    assert.ok(rect, objectDefinitionId);
    assert.ok(base, objectDefinitionId);
    assert.equal(rect.x, 320);
    assert.equal(rect.y, 240);
    assert.equal(rect.width, base.width * 1.25);
    assert.equal(rect.height, base.height * 0.8);
  }
});

test('regression: Builder hit-test consumes the canonical WorldObject visual rect instead of kind-specific branches', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    main,
    /function worldObjectRectForHit\(object\)[\s\S]*worldObjectVisualRect\(object\)/
  );
  assert.match(
    main,
    /function objectBaseDimensions\(object\)[\s\S]*worldObjectBaseDimensions\(object\)/
  );
});
