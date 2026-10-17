import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { reliefCanyonPilotDocument } from '../src/world/relief-canyon-pilot-world.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { isBlocked } from '../src/core/collision.js';
import { normalizeWorldDocument } from '../src/world/world-document-model.js';
import { drawReliefRiverGlints, drawReliefWaterfallGlints,
  reliefWaterMarks, shouldRenderReliefWater } from '../src/render/relief-water-overlay.js';

const area = reliefCanyonPilotDocument.areas[0];
function makeRecorder() {
  const counts = new Map();
  const ctx = new Proxy({}, {
    get(_target, prop) {
      if (prop === 'counts') return counts;
      if (['save','restore','translate','rotate','beginPath','moveTo','quadraticCurveTo',
        'stroke','rect','clip','ellipse'].includes(prop)) {
        return () => counts.set(prop, (counts.get(prop) ?? 0) + 1);
      }
      return undefined;
    },
    set() { return true; }
  });
  return ctx;
}

test('water art remains opt-in on the canyon document and separate from the classic 2D maps', () => {
  assert.equal(shouldRenderReliefWater(reliefCanyonPilotDocument.id, area), true);
  assert.equal(shouldRenderReliefWater(demoWorldDocument.id, area), false);
  assert.equal(shouldRenderReliefWater(reliefCanyonPilotDocument.id, demoWorldDocument.areas[0]), false);
  assert.equal(area.surface.rivers[0].materialId, 'water.clear_blue');
  assert.equal(area.surface.rivers[0].traversalRuleId, 'terrain.water');
  const clone = normalizeWorldDocument(JSON.parse(JSON.stringify(reliefCanyonPilotDocument)));
  assert.equal(clone.areas[0].surface.rivers[0].materialId, 'water.clear_blue');
  assert.equal(clone.areas[0].surface.rivers[0].traversalRuleId, 'terrain.water');
});

test('water animation computes bounded deterministic highlights without modifying river or collision', () => {
  const river = area.surface.rivers[0];
  const input = JSON.stringify(river);
  const first = reliefWaterMarks(river, 0);
  const same = reliefWaterMarks(river, 0);
  const animated = reliefWaterMarks(river, 0.9);
  assert.ok(first.length > 3 && first.length <= 32);
  assert.deepEqual(first, same);
  assert.notDeepEqual(first, animated);
  assert.equal(JSON.stringify(river), input);
  assert.equal(isBlocked(area, { radius: 12, locomotion: { modes: ['ground'] } }, 1000, 822), true);
  assert.equal(isBlocked(area, { radius: 12, locomotion: { modes: ['swim'] } }, 1000, 822), false);
});

test('waterlight overlay draws river shimmer and waterfall streaks in visual-only canvas layer', () => {
  const ctx = makeRecorder();
  const view = { area, camera: { x: 0, y: 0 },
    viewport: { width: area.width, height: area.height }, timeSeconds: 0.8 };
  const snapshot = JSON.stringify(area);
  assert.ok(drawReliefRiverGlints(ctx, view) > 2);
  assert.ok(drawReliefWaterfallGlints(ctx, view) >= 7);
  assert.ok(ctx.counts.get('stroke') > 10);
  assert.equal(JSON.stringify(area), snapshot);
  const offscreen = makeRecorder();
  assert.equal(drawReliefWaterfallGlints(offscreen,
    { ...view, camera: {x: -4000, y: -4000}, viewport: {width:100,height:100} }), 0);
  assert.equal(offscreen.counts.size, 0);
});

test('the pilot dynamic overlay is gated in both real entrypoints, with no forced repaint in Builder', async () => {
  const [runtime, builder, index, html] = await Promise.all([
    readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/builder/world-builder-main.js', import.meta.url), 'utf8'),
    readFile(new URL('../index.html', import.meta.url), 'utf8'),
    readFile(new URL('../builder.html', import.meta.url), 'utf8')
  ]);
  assert.match(runtime, /shouldRenderReliefWater\(activeWorldDocument\.id, area\)/);
  assert.match(builder, /shouldRenderReliefWater\(document\.id, area\)/);
  assert.match(builder, /drawReliefRiverGlints\(ctx, \{ area, camera, viewport, timeSeconds: 0 \}\)/);
  assert.match(builder, /drawReliefWaterfallGlints\(ctx, \{ area, camera, viewport, timeSeconds: 0 \}\)/);
  assert.match(index, /&water=relief-water-fx-v1/);
  assert.match(html, /&water=relief-water-fx-v1/);
});
