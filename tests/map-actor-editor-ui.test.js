import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  createMapActorAssetResolver
} from '../src/assets/map-actor-asset-adapter.js';
import {
  normalizeMapActorVisual
} from '../src/actors/map-actor-visual-model.js';

test('MapActorVisual can be renormalized without losing anchor overrides', () => {
  const first = normalizeMapActorVisual({
    assetId: 'actor.demo.hero.traveler.01',
    role: 'creature',
    anchorX: 0.42,
    anchorY: 0.91
  });
  const second = normalizeMapActorVisual(first);

  assert.equal(second.role, 'creature');
  assert.equal(second.anchorOverride.x, 0.42);
  assert.equal(second.anchorOverride.y, 0.91);
});

test('Map Actor Asset Adapter can extend registered assets for editor preview without a second resolver module', () => {
  const resolve = createMapActorAssetResolver([
    {
      id: 'actor.user.preview.01',
      kind: 'map-actor-source',
      path: 'blob:test-preview'
    }
  ]);

  assert.equal(
    resolve('actor.demo.hero.traveler.01')?.kind,
    'map-actor-source'
  );
  assert.equal(
    resolve('actor.user.preview.01')?.path,
    'blob:test-preview'
  );
});

test('World Builder exposes Map Actor Editor controls and uses the GREEN renderer pipeline', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  for (const id of [
    'actor-role',
    'actor-asset',
    'actor-image-import',
    'actor-target-height',
    'actor-source-facing',
    'actor-anchor-auto',
    'actor-shadow-enabled',
    'actor-mirror',
    'actor-export'
  ]) {
    assert.match(html, new RegExp(`id=["']${id}["']`));
  }

  assert.match(html, /data-tab=["']actors["']/);
  assert.match(main, /createMapActorRenderer/);
  assert.match(main, /createMapActorVisualPreparer/);
  assert.match(main, /normalizeMapActorVisual/);
  assert.match(main, /actor-preview/);
  assert.doesNotMatch(main, /actorPreview\.radius\s*=/);
});
