import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url);

async function sourceFiles(dirUrl = root) {
  const entries = await readdir(dirUrl, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const child = new URL(entry.name + (entry.isDirectory() ? '/' : ''), dirUrl);
    if (entry.isDirectory()) files.push(...await sourceFiles(child));
    else if (entry.name.endsWith('.js')) files.push(child);
  }
  return files;
}

async function readSources() {
  const files = await sourceFiles();
  return Promise.all(files.map(async (url) => ({
    path: relative(new URL('../', root).pathname, url.pathname),
    content: await readFile(url, 'utf8')
  })));
}

test('architecture sentinel: no forbidden global repair mechanisms in src', async () => {
  const sources = await readSources();
  const forbidden = [
    ['MutationObserver', /\bMutationObserver\s*\(/],
    ['setInterval', /\bsetInterval\s*\(/],
    ['stopImmediatePropagation', /\.stopImmediatePropagation\s*\(/],
    ['location.reload', /\blocation\.reload\s*\(/]
  ];

  const violations = [];
  for (const file of sources) {
    for (const [label, pattern] of forbidden) {
      if (pattern.test(file.content)) violations.push(`${file.path}: ${label}`);
    }
  }

  assert.deepEqual(violations, []);
});

test('architecture sentinel: core remains DOM independent', async () => {
  const coreUrl = new URL('../src/core/', import.meta.url);
  const entries = await readdir(coreUrl, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const content = await readFile(new URL(entry.name, coreUrl), 'utf8');
    if (/\bdocument\b|\bwindow\b|\bHTMLElement\b/.test(content)) {
      violations.push(entry.name);
    }
  }

  assert.deepEqual(violations, []);
});


test('architecture sentinel: renderer does not own semantic material ids', async () => {
  const renderer = await readFile(
    new URL('../src/render/surface-renderer.js', import.meta.url),
    'utf8'
  );

  const forbiddenIds = [
    'grass.forest',
    'road.dirt',
    'water.forest_stream'
  ];

  const violations = forbiddenIds.filter((id) => renderer.includes(id));
  assert.deepEqual(violations, []);
});

test('architecture sentinel: material system does not hotlink other repositories', async () => {
  const materialsUrl = new URL('../src/materials/', import.meta.url);
  const entries = await readdir(materialsUrl, { withFileTypes: true });
  const violations = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const content = await readFile(new URL(entry.name, materialsUrl), 'utf8');

    if (
      /raw\.githubusercontent\.com|github\.com\/slyen4425-cloud\/Zombicide-40k|assets\/dungeon\//i.test(content)
    ) {
      violations.push(entry.name);
    }
  }

  assert.deepEqual(violations, []);
});


test('architecture sentinel: runtime has no cross-repository asset dependency', async () => {
  const sources = await readSources();
  const violations = [];

  for (const file of sources) {
    if (
      /raw\.githubusercontent\.com|github\.com\/slyen4425-cloud\/Zombicide-40k|assets\/dungeon\//i.test(file.content)
    ) {
      violations.push(file.path);
    }
  }

  assert.deepEqual(violations, []);
});

test('architecture sentinel: renderer never owns physical Material Pack paths', async () => {
  const renderer = await readFile(
    new URL('../src/render/surface-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(renderer.includes('assets/exploration/materials/'), false);
  assert.equal(renderer.includes('.webp'), false);
});

test('architecture sentinel: Material Pack references semantic asset ids, not files', async () => {
  const pack = await readFile(
    new URL('../src/materials/material-pack-v1.js', import.meta.url),
    'utf8'
  );

  assert.equal(pack.includes('assets/exploration/materials/'), false);
  assert.equal(pack.includes('.webp'), false);
});


test('architecture sentinel: WorldObject renderer never owns collision rules', async () => {
  const renderer = await readFile(
    new URL('../src/render/world-object-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(/\bisBlocked\b|circleIntersects|overridesObstacleIds/.test(renderer), false);
});

test('architecture sentinel: collision never derives bridge rules from assets', async () => {
  const collision = await readFile(
    new URL('../src/core/collision.js', import.meta.url),
    'utf8'
  );

  assert.equal(/assetId|\.webp|assets\//.test(collision), false);
});


test('architecture sentinel: WorldObject renderer owns no physical asset paths', async () => {
  const renderer = await readFile(
    new URL('../src/render/world-object-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(renderer.includes('assets/exploration/objects/'), false);
  assert.equal(renderer.includes('.webp'), false);
});

test('architecture sentinel: WorldDocument owns semantic bridge ids only', async () => {
  const demoWorld = await readFile(
    new URL('../src/world/demo-world.js', import.meta.url),
    'utf8'
  );

  assert.equal(demoWorld.includes('assets/exploration/objects/'), false);
  assert.equal(demoWorld.includes('.webp'), false);
  assert.equal(
    demoWorld.includes('object.bridge.wood.rustic_bank.01'),
    true
  );
});


test('architecture sentinel: bridge renderer has no alternate visual fallback authority', async () => {
  const renderer = await readFile(
    new URL('../src/render/world-object-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(renderer.includes('drawBridgeFallback'), false);
  assert.equal(renderer.includes('fillRect('), false);
});

test('architecture sentinel: bootstrap waits for required WorldObject visuals', async () => {
  const main = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.equal(main.includes('await worldObjectImageLoader.load'), true);
  assert.equal(main.includes('WorldObject assets unavailable'), true);
});


test('architecture sentinel: Portal Model is the sole owner of Area links', async () => {
  const objectModel = await readFile(
    new URL('../src/world/world-object-model.js', import.meta.url),
    'utf8'
  );
  const portalModel = await readFile(
    new URL('../src/world/portal-model.js', import.meta.url),
    'utf8'
  );

  assert.equal(objectModel.includes('portalRefs'), false);
  assert.equal(
    /assets\/|\.webp|render\//.test(portalModel),
    false
  );
});

test('architecture sentinel: WorldArea transitions never navigate or reload the page', async () => {
  const main = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );
  const portalModel = await readFile(
    new URL('../src/world/portal-model.js', import.meta.url),
    'utf8'
  );

  assert.equal(/location\.|window\.location|reload\s*\(/.test(main), false);
  assert.equal(/location\.|window\.location|reload\s*\(/.test(portalModel), false);
});


test('architecture sentinel: Portal renderer is visual only and never owns transitions', async () => {
  const renderer = await readFile(
    new URL('../src/render/portal-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(renderer.includes('applyPortalTransition'), false);
  assert.equal(renderer.includes('targetSpawnId'), false);
  assert.equal(renderer.includes('currentAreaId ='), false);
  assert.equal(renderer.includes('location.reload'), false);
});

test('architecture sentinel: Portal marker position comes from Portal Model resolver', async () => {
  const renderer = await readFile(
    new URL('../src/render/portal-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(renderer.includes('resolvePortalTriggerPoint'), true);
});


test('architecture sentinel: surface traversal resolver never reads visual material ids', async () => {
  const traversal = await readFile(
    new URL('../src/core/surface-traversal.js', import.meta.url),
    'utf8'
  );

  assert.equal(traversal.includes('materialId'), false);
  assert.equal(traversal.includes('materialRegistry'), false);
});

test('architecture sentinel: renderer never owns traversal gameplay ids', async () => {
  const renderer = await readFile(
    new URL('../src/render/surface-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(renderer.includes('traversalRuleId'), false);
  assert.equal(renderer.includes('locomotion'), false);
});

test('architecture sentinel: movement engine owns no terrain-specific multipliers', async () => {
  const movement = await readFile(
    new URL('../src/core/movement.js', import.meta.url),
    'utf8'
  );

  assert.equal(movement.includes('terrain.road'), false);
  assert.equal(movement.includes('terrain.water'), false);
  assert.equal(movement.includes('1.25'), false);
  assert.equal(movement.includes('0.75'), false);
});

test('architecture sentinel: demo river collision has one surface authority', async () => {
  const demo = await readFile(
    new URL('../src/world/demo-world.js', import.meta.url),
    'utf8'
  );

  assert.equal(demo.includes('forest-stream-collision'), false);
  assert.equal(demo.includes('overridesObstacleIds'), false);
  assert.equal(demo.includes("overridesSurfaceFeatureIds"), true);
});
