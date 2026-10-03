import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('World Builder page contains every DOM id required by its entrypoint', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  const requiredIds = new Set(
    [...main.matchAll(/\$\('([^']+)'\)/g)]
      .map((match) => match[1])
  );

  const htmlIds = new Set(
    [...html.matchAll(/\bid="([^"]+)"/g)]
      .map((match) => match[1])
  );

  const missing = [...requiredIds]
    .filter((id) => !htmlIds.has(id));

  assert.deepEqual(missing, []);
});

test('World Builder page is a separate editor surface, not runtime auto-install', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const index = await readFile(
    new URL('../index.html', import.meta.url),
    'utf8'
  );

  assert.match(
    html,
    /src\/builder\/world-builder-main\.js\?rev=world-builder-dynamique-ui-v1/
  );
  assert.equal(
    index.includes('world-builder-main.js'),
    false
  );
});

test('World Builder mobile CSS keeps controls touch-sized', async () => {
  const css = await readFile(
    new URL('../src/builder/world-builder.css', import.meta.url),
    'utf8'
  );

  assert.equal(css.includes('@media (max-width: 760px)'), true);
  assert.equal(css.includes('min-height: 44px'), true);
  assert.equal(css.includes('touch-action: none'), true);
});


test('World Builder exposes Encounter Layers as a dedicated gameplay layer editor', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  for (const id of [
    'map-tool-encounter',
    'encounter-start-paint',
    'encounter-layer-select',
    'encounter-layer-delete',
    'encounter-label',
    'encounter-width',
    'encounter-chance',
    'encounter-check-distance',
    'encounter-priority',
    'encounter-entry-select',
    'encounter-entry-add',
    'encounter-entry-delete',
    'encounter-entry-kind',
    'encounter-entry-value',
    'encounter-entry-weight',
    'encounter-entry-weight-value',
    'encounter-entry-share'
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }

  assert.match(html, /data-tab="encounters"/);
  assert.match(html, /data-panel="encounters"/);
  assert.match(html, /Peindre rencontres/);
});


test('Encounter editor uses lists instead of typed ids or tags', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  for (const id of [
    'encounter-entry-kind',
    'encounter-entry-value'
  ]) {
    assert.match(
      html,
      new RegExp("<select[^>]+id=[\\\"']" + id + "[\\\"']")
    );
  }

  assert.equal(
    /id=["']encounter-entry-actor["']/.test(html),
    false
  );
  assert.equal(
    /id=["']encounter-entry-tags["']/.test(html),
    false
  );
});


test('Encounter paint starts immediately from the map pointer path', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.match(main, /paintKind === 'encounter'/);
  assert.match(main, /beginEncounterLayer\(world\)/);
  assert.match(main, /createEncounterPaintPreset/);
  assert.match(main, /updateEncounterPaintPreset/);
});
