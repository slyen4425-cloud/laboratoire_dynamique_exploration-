import test from 'node:test';
import assert from 'node:assert/strict';
import { createSurfaceRenderer } from '../src/render/surface-renderer.js';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { reliefCanyonPilotDocument } from '../src/world/relief-canyon-pilot-world.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { isBlocked } from '../src/core/collision.js';
import { collectMaterialAssetIds } from '../src/render/material-texture-loader.js';

const registry = createMaterialRegistry(materialPackV1);
const area = reliefCanyonPilotDocument.areas[0];

function recorder() {
  const calls = { strokes: [], images: [], patterns: [] };
  const context = {
    save() {}, restore() {}, translate() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {},
    quadraticCurveTo() {},
    stroke() { calls.strokes.push({ width: this.lineWidth, style: this.strokeStyle, alpha: this.globalAlpha }); },
    drawImage(...args) { calls.images.push(args); },
    createPattern(image) { calls.patterns.push(image); return { kind: 'pattern', setTransform() {} }; }
  };
  return { calls, context };
}

function surfaceFor(river) {
  return { baseMaterialId: 'grass.forest', zones: [], routes: [], rivers: [river] };
}

test('canyon only opts into the single continuous WaterSurface renderer path', () => {
  const canyon = registry.require('water.canyon_turquoise', 'water');
  const forest = registry.require('water.forest_stream', 'water');
  assert.equal(canyon.render.ribbonMode, 'continuous-stroke');
  assert.equal(canyon.assets.bank, null, 'unused rectangular bank strip must not load');
  assert.notEqual(forest.render.ribbonMode, 'continuous-stroke');
  assert.ok(forest.assets.bank, 'previous water materials remain unchanged');
  assert.equal(area.surface.rivers[0].materialId, canyon.id);
  assert.equal(area.surface.rivers[0].traversalRuleId, 'terrain.water');
  assert.equal(demoWorldDocument.areas[0].surface.rivers[0].materialId, forest.id);
  const assets = collectMaterialAssetIds([canyon]);
  assert.equal(assets.includes('transition.water.canyon.turquoise.bank.01'), false);
});

test('canyon draws one curved sequence with ZERO rectangular ribbon images, even when textures are available', () => {
  const river = area.surface.rivers[0];
  const snapshot = JSON.stringify(river);
  const { calls, context } = recorder();
  const renderer = createSurfaceRenderer({
    materialRegistry: registry,
    textureLoader: { get(assetId) { return assetId ? { width: 256, height: 128, id: assetId } : null; } },
    canvasFactory: () => null
  });
  renderer.draw(context, {
    camera: { x: 0, y: 400 }, viewport: { width: 2400, height: 800 },
    surface: surfaceFor(river), includeBase: false
  });
  assert.equal(calls.images.length, 0, 'no rotated drawImage ribbon segment');
  assert.equal(calls.strokes.length, 4, 'continuous outer bank, inner bank, water and highlight');
  assert.equal(calls.strokes[0].width, river.width + registry.require(river.materialId).render.outerBankPadding);
  assert.equal(calls.strokes[2].width, river.width);
  assert.ok(calls.patterns.length > 0, 'canonical center texture remains referenced');
  assert.equal(JSON.stringify(river), snapshot, 'renderer never mutates authoritative geometry');
});

test('non-canyon water retains its segmented texture behavior, without regressing existing maps', () => {
  const river = { id: 'classic-water', materialId: 'water.forest_stream', width: 96,
    points: [{ x: 20, y: 180 }, { x: 350, y: 200 }, { x: 760, y: 220 }] };
  const { calls, context } = recorder();
  const renderer = createSurfaceRenderer({
    materialRegistry: registry,
    textureLoader: { get(assetId) { return assetId ? { width: 256, height: 128, id: assetId } : null; } },
    canvasFactory: () => null
  });
  renderer.draw(context, {
    camera: { x: 0, y: 0 }, viewport: { width: 900, height: 550 },
    surface: surfaceFor(river), includeBase: false
  });
  assert.ok(calls.images.length > 1, 'classic segmented banks still render with textures');
  assert.ok(calls.strokes.length >= 2);
});

test('canyon change is strictly cosmetic: canonical swimming and walking collision remain identical', () => {
  const walker = { radius: 12, locomotion: { modes: ['ground'] } };
  const swimmer = { radius: 12, locomotion: { modes: ['swim'] } };
  assert.equal(isBlocked(area, walker, 1000, 822), true);
  assert.equal(isBlocked(area, swimmer, 1000, 822), false);
});
