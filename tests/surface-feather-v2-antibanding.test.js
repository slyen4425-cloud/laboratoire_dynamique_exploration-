import test from 'node:test';
import assert from 'node:assert/strict';

import { createMaterialRegistry } from '../src/materials/material-registry.js';
import * as feather from '../src/render/surface-feather.js';
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

function fakeContext(log = []) {
  let filter = 'none';
  let composite = 'source-over';

  return {
    log,
    lineWidth: 1,
    globalAlpha: 1,
    strokeStyle: '#000',
    fillStyle: '#000',
    lineCap: 'butt',
    lineJoin: 'miter',
    get filter() {
      return filter;
    },
    set filter(value) {
      filter = value;
      log.push({ type: 'filter', value });
    },
    get globalCompositeOperation() {
      return composite;
    },
    set globalCompositeOperation(value) {
      composite = value;
      log.push({ type: 'composite', value });
    },
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    quadraticCurveTo() {},
    clearRect() {
      log.push({ type: 'clear' });
    },
    fillRect() {
      log.push({ type: 'fill' });
    },
    createPattern() {
      return null;
    },
    setTransform() {},
    getTransform() {
      return { a: 1, d: 1 };
    },
    stroke() {
      log.push({
        type: 'stroke',
        width: this.lineWidth,
        alpha: this.globalAlpha,
        filter,
        composite
      });
    },
    drawImage() {
      log.push({
        type: 'drawImage',
        composite
      });
    }
  };
}

function fakeCanvasFactory() {
  const canvases = [];
  let calls = 0;

  const factory = (width, height) => {
    calls += 1;
    const log = [];
    const ctx = fakeContext(log);
    const canvas = {
      width,
      height,
      log,
      getContext() {
        return ctx;
      }
    };
    canvases.push(canvas);
    return canvas;
  };

  return {
    factory,
    canvases,
    get calls() {
      return calls;
    }
  };
}

test('Material Registry preserves explicit smooth-mask feather policy', () => {
  const registry = createMaterialRegistry({
    schemaVersion: 1,
    id: 'smooth-pack',
    surfaceTransition: {
      mode: 'feather',
      method: 'smooth-mask',
      widthRatio: 0.18,
      minWidth: 6,
      maxWidth: 64,
      steps: 7,
      edgeOpacity: 0,
      blurRatio: 0.58
    },
    materials: [
      surfaceMaterial('grass.test', '#4f6f3b'),
      surfaceMaterial('snow.test', '#e8f2f4')
    ]
  });

  assert.equal(registry.surfaceTransition.method, 'smooth-mask');
  assert.equal(registry.surfaceTransition.blurRatio, 0.58);
});

test('smooth mask planning stays strictly inside canonical zone width', () => {
  assert.equal(
    typeof feather.surfaceFeatherMaskPlan,
    'function',
    'Surface Feather v2 requires a pure smooth-mask plan'
  );

  const plan = feather.surfaceFeatherMaskPlan(180, {
    mode: 'feather',
    method: 'smooth-mask',
    widthRatio: 0.18,
    minWidth: 6,
    maxWidth: 64,
    edgeOpacity: 0,
    blurRatio: 0.58
  });

  assert.equal(plan.outerWidth, 180);
  assert.ok(plan.innerWidth < plan.outerWidth);
  assert.ok(plan.innerWidth > 0);
  assert.ok(plan.featherWidth > 0);
  assert.ok(plan.blurRadius > 0);
  assert.ok(plan.blurRadius <= plan.featherWidth);
});

test('Registry -> Surface Renderer uses a continuous reusable mask instead of visible main-canvas bands', () => {
  const registry = createMaterialRegistry({
    schemaVersion: 1,
    id: 'smooth-pack',
    surfaceTransition: {
      mode: 'feather',
      method: 'smooth-mask',
      widthRatio: 0.18,
      minWidth: 6,
      maxWidth: 64,
      steps: 7,
      edgeOpacity: 0,
      blurRatio: 0.58
    },
    materials: [
      surfaceMaterial('grass.test', '#4f6f3b'),
      surfaceMaterial('snow.test', '#e8f2f4')
    ]
  });

  const scratch = fakeCanvasFactory();
  const renderer = createSurfaceRenderer({
    materialRegistry: registry,
    canvasFactory: scratch.factory
  });
  const mainLog = [];
  const ctx = fakeContext(mainLog);
  const zone = {
    id: 'zone-snow',
    materialId: 'snow.test',
    width: 180,
    points: [
      { x: 10, y: 20 },
      { x: 180, y: 90 }
    ]
  };
  const before = structuredClone(zone);

  const draw = () => renderer.draw(ctx, {
    camera: { x: 0, y: 0 },
    viewport: { width: 320, height: 200 },
    surface: {
      baseMaterialId: 'grass.test',
      zones: [zone],
      routes: [],
      rivers: []
    }
  });

  draw();

  assert.equal(scratch.calls, 2, 'renderer should create exactly two reusable buffers');
  assert.equal(
    mainLog.filter((entry) => entry.type === 'stroke').length,
    0,
    'smooth-mask zone must not be built from visible strokes on the main canvas'
  );
  assert.equal(
    mainLog.filter((entry) => entry.type === 'drawImage').length,
    1,
    'composited smooth zone should be copied once to the main canvas'
  );

  const scratchLog = scratch.canvases.flatMap((canvas) => canvas.log);
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'stroke' &&
        typeof entry.filter === 'string' &&
        entry.filter.startsWith('blur(')
    ),
    true,
    'mask must contain a blurred continuous stroke'
  );
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'stroke' &&
        entry.composite === 'destination-in' &&
        entry.width === 180
    ),
    true,
    'blur must be clipped back to canonical zone width'
  );
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'drawImage' &&
        entry.composite === 'destination-in'
    ),
    true,
    'zone texture must be composed through the alpha mask'
  );

  draw();
  assert.equal(
    scratch.calls,
    2,
    'scratch canvases must be reused across frames'
  );
  assert.deepEqual(zone, before);
});
