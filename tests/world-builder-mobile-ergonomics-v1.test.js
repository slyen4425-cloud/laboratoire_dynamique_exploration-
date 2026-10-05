import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('Builder mobile terrain entry is single and route/river modes live inside Terrain', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  assert.equal(html.includes('id="map-tool-terrain"'), true);
  assert.equal(html.includes('id="map-tool-route"'), false);
  assert.equal(html.includes('id="map-tool-river"'), false);

  assert.equal(html.includes('id="terrain-mode-terrain"'), true);
  assert.equal(html.includes('id="terrain-mode-route"'), true);
  assert.equal(html.includes('id="terrain-mode-river"'), true);
});

test('Builder exposes a mobile floating undo for the last surface draw', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const css = await readFile(
    new URL('../src/builder/world-builder.css', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(html.includes('id="builder-undo-draw"'), true);
  assert.match(css, /#builder-undo-draw[\s\S]*position:\s*fixed/);
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*#builder-undo-draw/);
  assert.match(main, /surfaceDrawHistory/);
  assert.match(main, /deleteSurfacePath\(/);
});

test('brush width inputs are prospective and never resize an existing selected path', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  const start = main.indexOf(
    "for (const [kind, widthId, valueId, materialId, fallbackWidth] of ["
  );
  const end = main.indexOf(
    "$('spawn-select').addEventListener",
    start
  );

  assert.ok(start >= 0 && end > start);
  const widthControlBlock = main.slice(start, end);

  assert.equal(
    widthControlBlock.includes('draft = updateSurfacePath'),
    false,
    'brush-size controls must not mutate an existing surface path'
  );
});

test('terrain size controls provide touch-friendly minus/plus adjustments', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  for (const id of [
    'terrain-brush-size-minus',
    'terrain-brush-size-plus',
    'terrain-route-width-minus',
    'terrain-route-width-plus',
    'terrain-river-width-minus',
    'terrain-river-width-plus'
  ]) {
    assert.equal(html.includes(`id="${id}"`), true, id);
  }

  assert.match(main, /data-brush-adjust/);
});
