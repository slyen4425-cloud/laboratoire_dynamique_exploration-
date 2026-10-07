import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(path) {
  return readFile(
    new URL(`../${path}`, import.meta.url),
    'utf8'
  );
}

test('preview frame scheduler coalesces repeated mobile render requests into one frame', async () => {
  const {
    createPreviewFrameScheduler
  } = await import(
    '../src/builder/world-builder-preview-scheduler.js'
  );

  const queued = [];
  const rendered = [];
  const scheduler =
    createPreviewFrameScheduler({
      requestFrame(callback) {
        queued.push(callback);
        return queued.length;
      },
      render(time) {
        rendered.push(time);
      }
    });

  assert.equal(scheduler.request(), true);
  assert.equal(scheduler.request(), false);
  assert.equal(scheduler.request(), false);
  assert.equal(queued.length, 1);
  assert.deepEqual(rendered, []);

  queued.shift()(16.7);

  assert.deepEqual(rendered, [16.7]);
  assert.equal(scheduler.request(), true);
  assert.equal(queued.length, 1);
});

test('Builder caches normalized validation while the immutable draft identity is unchanged', async () => {
  const main = await source(
    'src/builder/world-builder-main.js'
  );

  assert.match(
    main,
    /let cachedValidationDraft\s*=\s*null/
  );
  assert.match(
    main,
    /let cachedValidationResult\s*=\s*null/
  );
  assert.match(
    main,
    /cachedValidationDraft\s*===\s*draft/
  );
  assert.match(
    main,
    /cachedValidationResult\s*=\s*validateWorldBuilderDraft\(draft\)/
  );
});

test('high-frequency pointer movement requests one preview frame instead of rendering immediately', async () => {
  const main = await source(
    'src/builder/world-builder-main.js'
  );

  const start = main.indexOf(
    "canvas.addEventListener('pointermove'"
  );
  const end = main.indexOf(
    "function endPointer",
    start
  );

  assert.ok(start >= 0 && end > start);
  const pointerMove = main.slice(start, end);

  assert.match(
    pointerMove,
    /schedulePreviewRender\(\)/
  );
  assert.equal(
    /renderPreview\(\)/.test(pointerMove),
    false,
    'pointermove must not synchronously redraw the full mobile canvas'
  );
});

test('focused coarse-pointer interaction lowers only transient canvas backing resolution', async () => {
  const main = await source(
    'src/builder/world-builder-main.js'
  );

  assert.match(
    main,
    /function\s+previewPixelRatio\s*\(/
  );
  assert.match(
    main,
    /mapFocusActive[\s\S]*pointerSession[\s\S]*activePointers/
  );
  assert.match(
    main,
    /Math\.min\(\s*nativeRatio,\s*interacting\s*\?\s*1\s*:\s*1\.5\s*\)/
  );
  assert.match(
    main,
    /const dpr\s*=\s*previewPixelRatio\(\)/
  );
});
