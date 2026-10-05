import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const htmlUrl = new URL('../builder.html', import.meta.url);
const mainUrl = new URL(
  '../src/builder/world-builder-main.js',
  import.meta.url
);
const cssUrl = new URL(
  '../src/builder/world-builder.css',
  import.meta.url
);

test('Builder exposes one paint entry point and a compact draw-kind selector', async () => {
  const html = await readFile(htmlUrl, 'utf8');

  assert.match(html, /data-map-tool=["']paint["']/);
  assert.equal(/data-map-tool=["']route["']/.test(html), false);
  assert.equal(/data-map-tool=["']river["']/.test(html), false);
  assert.match(html, /id=["']terrain-draw-kind["']/);

  for (const kind of ['terrain', 'route', 'river']) {
    assert.match(
      html,
      new RegExp(
        "data-terrain-kind-panel=[\\\"']" +
          kind +
          "[\\\"']"
      )
    );
  }
});

test('Builder exposes floating mobile undo and quick brush controls', async () => {
  const [html, css] = await Promise.all([
    readFile(htmlUrl, 'utf8'),
    readFile(cssUrl, 'utf8')
  ]);

  for (const id of [
    'paint-floating-tools',
    'paint-undo',
    'paint-brush-minus',
    'paint-brush-plus',
    'paint-brush-value'
  ]) {
    assert.match(
      html,
      new RegExp(`id=["']${id}["']`)
    );
  }

  assert.match(css, /#paint-floating-tools/);
  assert.match(css, /position:\s*fixed/);
  assert.match(css, /env\(safe-area-inset-bottom\)/);
});

test('brush size inputs are prospective and never rewrite an existing path width', async () => {
  const main = await readFile(mainUrl, 'utf8');

  const start = main.indexOf(
    "for (const [kind, widthId, valueId, materialId, fallbackWidth]"
  );
  const end = main.indexOf(
    "$('spawn-select').addEventListener",
    start
  );

  assert.ok(start >= 0 && end > start);
  const widthControls = main.slice(start, end);

  assert.equal(
    /updateSurfacePath[\s\S]*\{\s*width\s*\}/.test(
      widthControls
    ),
    false
  );
});

test('paint undo stores only path references and delegates deletion to the draft helper', async () => {
  const main = await readFile(mainUrl, 'utf8');

  assert.match(main, /drawUndoStack/);
  assert.match(main, /areaId[\s\S]*kind[\s\S]*pathId/);
  assert.match(main, /deleteSurfacePath/);
  assert.equal(
    /drawUndoStack[^\n]*structuredClone/.test(main),
    false
  );
});
