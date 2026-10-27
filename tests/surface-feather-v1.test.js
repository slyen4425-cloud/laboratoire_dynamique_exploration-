import test from 'node:test';
import assert from 'node:assert/strict';

import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { createSurfaceRenderer } from '../src/render/surface-renderer.js';

function surfaceMaterial(id, color) {
  return {
    id,
    kind: 'surface',
    label: id,
    assets: {
      base: null,
      variants: [],
      edge: null,
      decals: []
    },
    render: {
      baseColor: color,
      variationColors: [],
      detailSpacing: 0,
      decalSpacing: 0,
      decalDensity: 0,
      decalMinSize: 0,
      decalMaxSize: 0,
      decalOpacity: 0
    }
  };
}

function fakeCanvasContext() {
  const strokes = [];

  const ctx = {
    lineWidth: 1,
    globalAlpha: 1,
    strokeStyle: '#000',
    fillStyle: '#000',
    lineCap: 'butt',
    lineJoin: 'miter',
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    fillRect() {},
    stroke() {
      strokes.push({
        width: this.lineWidth,
        alpha: this.globalAlpha,
        style: this.strokeStyle
      });
    }
  };

  return { ctx, strokes };
}

test('Material Registry exposes an explicit normalized surface transition policy', () => {
  const registry = createMaterialRegistry({
    schemaVersion: 1,
    id: 'test-pack',
    surfaceTransition: {
      mode: 'feather',
      widthRatio: 0.2,
      minWidth: 8,
      maxWidth: 40,
      steps: 5,
      edgeOpacity: 0.1
    },
    materials: [
      surfaceMaterial('grass.test', '#4f6f3b'),
      surfaceMaterial('snow.test', '#e8f2f4')
    ]
  });

  assert.deepEqual(
    registry.surfaceTransition,
    {
      mode: 'feather',
      widthRatio: 0.2,
      minWidth: 8,
      maxWidth: 40,
      steps: 5,
      edgeOpacity: 0.1
    }
  );
  assert.equal(Object.isFrozen(registry.surfaceTransition), true);
});

test('pack without a surface transition policy preserves legacy opaque rendering', () => {
  const registry = createMaterialRegistry({
    schemaVersion: 1,
    id: 'legacy-pack',
    materials: [
      surfaceMaterial('grass.test', '#4f6f3b')
    ]
  });

  assert.deepEqual(
    registry.surfaceTransition,
    { mode: 'none' }
  );
});

test('Registry -> Surface Renderer feathers a painted zone without expanding canonical width', () => {
  const registry = createMaterialRegistry({
    schemaVersion: 1,
    id: 'feather-pack',
    surfaceTransition: {
      mode: 'feather',
      widthRatio: 0.2,
      minWidth: 8,
      maxWidth: 40,
      steps: 5,
      edgeOpacity: 0.1
    },
    materials: [
      surfaceMaterial('grass.test', '#4f6f3b'),
      surfaceMaterial('snow.test', '#e8f2f4')
    ]
  });

  const renderer = createSurfaceRenderer({
    materialRegistry: registry
  });
  const { ctx, strokes } = fakeCanvasContext();

  const zone = {
    id: 'zone-snow',
    materialId: 'snow.test',
    width: 100,
    points: [
      { x: 10, y: 20 },
      { x: 180, y: 90 }
    ]
  };
  const before = structuredClone(zone);

  renderer.draw(ctx, {
    camera: { x: 0, y: 0 },
    viewport: { width: 320, height: 200 },
    surface: {
      baseMaterialId: 'grass.test',
      zones: [zone],
      routes: [],
      rivers: []
    }
  });

  assert.equal(strokes.length, 5);
  assert.equal(strokes[0].width, 100);
  assert.equal(strokes[0].alpha, 0.1);
  assert.ok(strokes.at(-1).width < 100);
  assert.equal(strokes.at(-1).alpha, 1);

  for (let index = 1; index < strokes.length; index += 1) {
    assert.ok(
      strokes[index].width < strokes[index - 1].width,
      'feather passes must shrink inward'
    );
  }

  assert.deepEqual(zone, before);
});

test('legacy pack renders a painted zone in one opaque pass', () => {
  const registry = createMaterialRegistry({
    schemaVersion: 1,
    id: 'legacy-pack',
    materials: [
      surfaceMaterial('grass.test', '#4f6f3b'),
      surfaceMaterial('snow.test', '#e8f2f4')
    ]
  });

  const renderer = createSurfaceRenderer({
    materialRegistry: registry
  });
  const { ctx, strokes } = fakeCanvasContext();

  renderer.draw(ctx, {
    camera: { x: 0, y: 0 },
    viewport: { width: 320, height: 200 },
    surface: {
      baseMaterialId: 'grass.test',
      zones: [
        {
          id: 'zone-snow',
          materialId: 'snow.test',
          width: 100,
          points: [
            { x: 10, y: 20 },
            { x: 180, y: 90 }
          ]
        }
      ],
      routes: [],
      rivers: []
    }
  });

  assert.deepEqual(
    strokes.map(({ width, alpha }) => ({ width, alpha })),
    [{ width: 100, alpha: 1 }]
  );
});
