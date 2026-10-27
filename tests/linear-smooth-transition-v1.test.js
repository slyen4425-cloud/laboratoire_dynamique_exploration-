import test from 'node:test';
import assert from 'node:assert/strict';

import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { createSurfaceRenderer } from '../src/render/surface-renderer.js';
import { linearFeatherMaskPlan } from '../src/render/surface-feather.js';

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
    translate() {},
    rotate() {},
    clearRect() {
      log.push({ type: 'clear' });
    },
    fillRect() {
      log.push({ type: 'fill' });
    },
    createPattern() {
      return null;
    },
    createRadialGradient() {
      return { addColorStop() {} };
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

function drawFixture({ routes = [], rivers = [] }) {
  const registry = createMaterialRegistry(materialPackV1);
  const scratch = fakeCanvasFactory();
  const renderer = createSurfaceRenderer({
    materialRegistry: registry,
    textureLoader: null,
    canvasFactory: scratch.factory
  });
  const mainLog = [];
  const ctx = fakeContext(mainLog);

  renderer.draw(ctx, {
    camera: { x: 0, y: 0 },
    viewport: { width: 480, height: 320 },
    surface: {
      baseMaterialId: 'grass.forest',
      zones: [],
      routes,
      rivers
    }
  });

  return { mainLog, scratch };
}

test('linear smooth plan keeps canonical core opaque and feathers only the existing visual padding', () => {
  const transition = {
    mode: 'feather',
    method: 'smooth-mask',
    widthRatio: 0.18,
    minWidth: 6,
    maxWidth: 64,
    edgeOpacity: 0,
    blurRatio: 0.58
  };

  const roadPlan = linearFeatherMaskPlan(
    82,
    100,
    transition
  );
  assert.equal(roadPlan.outerWidth, 100);
  assert.equal(roadPlan.innerWidth, 82);
  assert.equal(roadPlan.featherWidth, 9);
  assert.ok(roadPlan.blurRadius > 0);
  assert.ok(roadPlan.blurRadius <= 9);

  const riverPlan = linearFeatherMaskPlan(
    72,
    92,
    transition
  );
  assert.equal(riverPlan.outerWidth, 92);
  assert.equal(riverPlan.innerWidth, 72);
  assert.equal(riverPlan.featherWidth, 10);
  assert.ok(riverPlan.blurRadius > 0);
  assert.ok(riverPlan.blurRadius <= 10);
});

test('Route uses the shared smooth-mask and keeps existing visual envelope', () => {
  const road = {
    id: 'road-a',
    materialId: 'road.dirt',
    terrainFamilyId: 'road',
    width: 82,
    points: [
      { x: 20, y: 40 },
      { x: 300, y: 180 }
    ]
  };
  const before = structuredClone(road);
  const { mainLog, scratch } = drawFixture({
    routes: [road]
  });

  assert.equal(
    mainLog.filter((entry) => entry.type === 'stroke').length,
    0,
    'road strokes must be rendered in the reusable layer, not directly on main canvas'
  );
  assert.equal(
    mainLog.filter((entry) => entry.type === 'drawImage').length,
    1,
    'smooth road must be composited exactly once on main canvas'
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
    'road transition must reuse continuous blur mask'
  );
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'stroke' &&
        entry.filter.startsWith('blur(') &&
        entry.width === 82
    ),
    true,
    'road canonical width must remain the fully opaque core'
  );
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'stroke' &&
        entry.composite === 'destination-in' &&
        entry.width === 100
    ),
    true,
    'road mask must be clipped to width + outerEdgePadding (82 + 18)'
  );

  const contentStrokes = scratch.canvases
    .flatMap((canvas) => canvas.log)
    .filter(
      (entry) =>
        entry.type === 'stroke' &&
        entry.composite === 'source-over' &&
        entry.filter === 'none'
    )
    .map((entry) => entry.width);

  assert.equal(contentStrokes.includes(82), true);
  assert.equal(contentStrokes.includes(100), true);
  assert.deepEqual(road, before);
});

test('Rivière / mer uses the shared smooth-mask and keeps existing visual envelope', () => {
  const river = {
    id: 'river-a',
    materialId: 'water.clear_blue',
    terrainFamilyId: 'sea',
    width: 72,
    points: [
      { x: 30, y: 60 },
      { x: 360, y: 210 }
    ]
  };
  const before = structuredClone(river);
  const { mainLog, scratch } = drawFixture({
    rivers: [river]
  });

  assert.equal(
    mainLog.filter((entry) => entry.type === 'stroke').length,
    0,
    'river strokes must be rendered in the reusable layer, not directly on main canvas'
  );
  assert.equal(
    mainLog.filter((entry) => entry.type === 'drawImage').length,
    1,
    'smooth river must be composited exactly once on main canvas'
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
    'river transition must reuse continuous blur mask'
  );
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'stroke' &&
        entry.filter.startsWith('blur(') &&
        entry.width === 72
    ),
    true,
    'river canonical width must remain the fully opaque core'
  );
  assert.equal(
    scratchLog.some(
      (entry) =>
        entry.type === 'stroke' &&
        entry.composite === 'destination-in' &&
        entry.width === 92
    ),
    true,
    'river mask must be clipped to width + outerBankPadding (72 + 20)'
  );

  const contentStrokes = scratch.canvases
    .flatMap((canvas) => canvas.log)
    .filter(
      (entry) =>
        entry.type === 'stroke' &&
        entry.composite === 'source-over' &&
        entry.filter === 'none'
    )
    .map((entry) => entry.width);

  assert.equal(contentStrokes.includes(72), true);
  assert.equal(contentStrokes.includes(92), true);
  assert.deepEqual(river, before);
});

test('smooth linear features reuse the same two scratch canvases across frames', () => {
  const registry = createMaterialRegistry(materialPackV1);
  const scratch = fakeCanvasFactory();
  const renderer = createSurfaceRenderer({
    materialRegistry: registry,
    textureLoader: null,
    canvasFactory: scratch.factory
  });
  const ctx = fakeContext([]);

  const surface = {
    baseMaterialId: 'grass.forest',
    zones: [],
    routes: [
      {
        id: 'road-a',
        materialId: 'road.dirt',
        terrainFamilyId: 'road',
        width: 82,
        points: [
          { x: 20, y: 40 },
          { x: 300, y: 180 }
        ]
      }
    ],
    rivers: [
      {
        id: 'river-a',
        materialId: 'water.clear_blue',
        terrainFamilyId: 'sea',
        width: 72,
        points: [
          { x: 30, y: 60 },
          { x: 360, y: 210 }
        ]
      }
    ]
  };

  const draw = () => renderer.draw(ctx, {
    camera: { x: 0, y: 0 },
    viewport: { width: 480, height: 320 },
    surface
  });

  draw();
  draw();

  assert.equal(
    scratch.calls,
    2,
    'Route and river must share the existing reusable mask/layer buffers'
  );
});
