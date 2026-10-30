import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const projectRoot = new URL('../', import.meta.url);
const page = path => readFile(new URL(path, projectRoot), 'utf8');

test('immersive PWA scope covers Builder, Exploration and the packaged Combat Encounter', async () => {
  const manifest = JSON.parse(await page('manifest.webmanifest'));
  assert.equal(manifest.display, 'fullscreen');
  assert.equal(manifest.orientation, 'landscape');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.start_url, './builder.html');
  const origin = new URL('https://example.org/laboratoire_dynamique_exploration-/');
  const scope = new URL(manifest.scope, origin);
  for (const route of ['builder.html', 'index.html', 'combat-preview/examples/dom-demo/exploration-encounter.html']) {
    assert.ok(new URL(route, origin).href.startsWith(scope.href), route + ' must remain within installed app scope');
  }
  assert.ok(Array.isArray(manifest.icons));
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(item => item.sizes === size + 'x' + size && item.type === 'image/png');
    assert.ok(icon, 'install icon ' + size + ' missing');
    const bytes = await readFile(new URL(icon.src, origin).pathname.replace('/laboratoire_dynamique_exploration-/', '').startsWith('assets/') ?
      new URL(new URL(icon.src, origin).pathname.replace('/laboratoire_dynamique_exploration-/', ''), projectRoot) : new URL(icon.src, projectRoot));
    assert.equal(bytes.subarray(1, 4).toString('ascii'), 'PNG');
    assert.equal(bytes.readUInt32BE(16), size);
    assert.equal(bytes.readUInt32BE(20), size);
  }
});

test('both app entry points declare the same scoped manifest without changing navigation', async () => {
  for (const file of ['builder.html', 'index.html']) {
    const html = await page(file);
    assert.match(html, /<link rel="manifest" href="\.\/manifest\.webmanifest"/);
  }
  const nav = await page('src/encounters/combat-handoff-navigation.js');
  assert.match(nav, /\.\/combat-preview\/examples\/dom-demo\/exploration-encounter\.html/);
});