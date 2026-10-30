import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const htmlUrl = new URL('../builder.html', import.meta.url);
const mainUrl = new URL(
  '../src/builder/world-builder-main.js',
  import.meta.url
);

test('unified paint selector exposes Sol / Route / Rivière-Mer without duplicate map tools', async () => {
  const html = await readFile(htmlUrl, 'utf8');

  assert.match(
    html,
    /<option value=["']terrain["']>Sol \/ surface<\/option>/
  );
  assert.match(
    html,
    /<option value=["']route["']>Route<\/option>/
  );
  assert.match(
    html,
    /<option value=["']river["']>Rivière \/ mer<\/option>/
  );

  assert.equal(
    /data-map-tool=["']route["']/.test(html),
    false
  );
  assert.equal(
    /data-map-tool=["']river["']/.test(html),
    false
  );
  assert.match(html, /data-map-tool=["']paint["']/);
});

test('changing unified paint kind immediately activates that canonical paint tool', async () => {
  const main = await readFile(mainUrl, 'utf8');

  const start = main.indexOf(
    "$('terrain-draw-kind').addEventListener("
  );
  const end = main.indexOf(
    "$('paint-brush-minus').addEventListener",
    start
  );

  assert.ok(start >= 0 && end > start);
  const block = main.slice(start, end);

  assert.match(
    block,
    /const drawKind\s*=\s*\$\('terrain-draw-kind'\)\.value/
  );
  assert.match(
    block,
    /setMapTool\(drawKind\)/
  );
  assert.equal(
    block.includes('if (isPaintKind(mapTool))'),
    false,
    'kind selector must not require a separate Peindre click'
  );
});

test('all paint kinds share one pointer-draw pipeline and draft authority', async () => {
  const main = await readFile(mainUrl, 'utf8');

  assert.match(main, /const PAINT_KINDS = Object\.freeze\(\[[\s\S]*'terrain'[\s\S]*'route'[\s\S]*'river'/);
  assert.match(
    main,
    /if \(isPaintKind\(mapTool\)\) \{[\s\S]*mode: 'pending-draw'[\s\S]*kind: mapTool/
  );
  assert.match(
    main,
    /function beginSurfacePath\(kind, point\)[\s\S]*draft = addSurfacePath\([\s\S]*kind/
  );
  assert.equal(
    /BuilderMap|PreviewWorld/.test(main),
    false
  );
});
