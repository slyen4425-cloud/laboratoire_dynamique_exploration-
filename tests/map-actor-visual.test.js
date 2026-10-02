import test from 'node:test';
import assert from 'node:assert/strict';
import { access } from 'node:fs/promises';

import {
  normalizeMapActorVisual
} from '../src/actors/map-actor-visual-model.js';
import {
  alphaBounds,
  analyzeUniformBackground,
  prepareMapActorPixels
} from '../src/actors/map-actor-image-analysis.js';
import {
  resolveMapActorAsset
} from '../src/assets/map-actor-asset-adapter.js';
import {
  createMapActorRenderer
} from '../src/render/map-actor-renderer.js';

function rgba(width, height, fill) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const color = fill(x, y);
      const index = (y * width + x) * 4;
      data[index] = color[0];
      data[index + 1] = color[1];
      data[index + 2] = color[2];
      data[index + 3] = color[3];
    }
  }
  return data;
}

test('MapActorVisual simple mode needs only one assetId and automatic defaults', () => {
  const visual = normalizeMapActorVisual({
    assetId: 'actor.user.hero.01'
  });

  assert.equal(visual.schemaVersion, 1);
  assert.equal(visual.assetId, 'actor.user.hero.01');
  assert.equal(visual.role, 'hero');
  assert.equal(visual.targetHeight, 78);
  assert.equal(visual.mirrorHorizontal, true);
  assert.equal(visual.shadow.enabled, true);
  assert.equal(visual.anchorOverride.x, null);
  assert.equal(visual.anchorOverride.y, null);
});

test('role defaults give creatures a readable map size without user setup', () => {
  const creature = normalizeMapActorVisual({
    assetId: 'actor.user.creature.01',
    role: 'creature'
  });

  assert.equal(creature.targetHeight, 84);
});

test('alpha bounds crop transparent margins deterministically', () => {
  const data = rgba(5, 5, (x, y) =>
    x >= 1 && x <= 3 && y >= 2 && y <= 4
      ? [40, 90, 120, 255]
      : [0, 0, 0, 0]
  );

  assert.deepEqual(alphaBounds(data, 5, 5), {
    x: 1,
    y: 2,
    width: 3,
    height: 3
  });
});

test('uniform opaque background is removed automatically and subject is cropped', () => {
  const data = rgba(5, 5, (x, y) =>
    x === 2 && y >= 1 && y <= 3
      ? [20, 40, 80, 255]
      : [245, 245, 245, 255]
  );

  const background = analyzeUniformBackground(data, 5, 5);
  assert.equal(background.uniform, true);

  const result = prepareMapActorPixels({
    data,
    width: 5,
    height: 5
  });

  assert.equal(result.backgroundMode, 'uniform-removed');
  assert.deepEqual(result.bounds, {
    x: 2,
    y: 1,
    width: 1,
    height: 3
  });
  assert.deepEqual(result.anchor, {
    x: 0.5,
    y: 0.96
  });
});

test('complex opaque background is reported, not destructively guessed', () => {
  const data = rgba(4, 4, (x, y) => {
    if (x === 0 && y === 0) return [255, 0, 0, 255];
    if (x === 3 && y === 0) return [0, 255, 0, 255];
    if (x === 0 && y === 3) return [0, 0, 255, 255];
    if (x === 3 && y === 3) return [255, 255, 0, 255];
    return [100, 100, 100, 255];
  });

  const result = prepareMapActorPixels({
    data,
    width: 4,
    height: 4
  });

  assert.equal(result.backgroundMode, 'opaque-unresolved');
  assert.deepEqual(result.bounds, {
    x: 0,
    y: 0,
    width: 4,
    height: 4
  });
});

test('demo Map Actor source exists behind semantic asset adapter', async () => {
  const asset = resolveMapActorAsset(
    'actor.demo.hero.traveler.01'
  );

  assert.equal(asset?.kind, 'map-actor-source');
  assert.equal(
    asset?.path,
    './assets/exploration/actors/demo/map_actor_demo_hero.svg'
  );

  await access(
    new URL(
      '../assets/exploration/actors/demo/map_actor_demo_hero.svg',
      import.meta.url
    )
  );
});

test('Map Actor Renderer mirrors and animates visually without mutating gameplay state', () => {
  const calls = [];
  const ctx = {
    globalAlpha: 1,
    fillStyle: '',
    save() { calls.push(['save']); },
    restore() { calls.push(['restore']); },
    beginPath() { calls.push(['beginPath']); },
    ellipse(...args) { calls.push(['ellipse', ...args]); },
    fill() { calls.push(['fill']); },
    translate(...args) { calls.push(['translate', ...args]); },
    scale(...args) { calls.push(['scale', ...args]); },
    drawImage(...args) { calls.push(['drawImage', ...args]); }
  };

  const prepared = {
    get(assetId) {
      if (assetId !== 'actor.demo.hero.traveler.01') return null;
      return {
        source: { id: 'prepared-source' },
        width: 60,
        height: 100,
        aspectRatio: 0.6,
        anchor: { x: 0.5, y: 0.96 }
      };
    }
  };

  const renderer = createMapActorRenderer({
    preparedVisuals: prepared
  });
  const actor = {
    x: 120,
    y: 180,
    facingX: -1,
    moving: true,
    mapVisual: normalizeMapActorVisual({
      assetId: 'actor.demo.hero.traveler.01'
    })
  };
  const before = {
    x: actor.x,
    y: actor.y,
    facingX: actor.facingX,
    moving: actor.moving
  };

  renderer.draw(ctx, {
    camera: { x: 20, y: 30 },
    actors: [actor],
    timeSeconds: 0.125
  });

  assert.ok(
    calls.some((call) => call[0] === 'scale' && call[1] === -1)
  );
  assert.ok(calls.some((call) => call[0] === 'ellipse'));
  assert.ok(calls.some((call) => call[0] === 'drawImage'));
  assert.deepEqual(
    {
      x: actor.x,
      y: actor.y,
      facingX: actor.facingX,
      moving: actor.moving
    },
    before
  );
});
