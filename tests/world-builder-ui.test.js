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
    /src\/builder\/world-builder-main\.js\?rev=[A-Za-z0-9._-]+/
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
