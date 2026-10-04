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

  assert.equal(/\bisBlocked\b|circleIntersects|overridesObstacleIds|overridesSurfaceFeatureIds/.test(renderer), false);
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

test('architecture sentinel: Object Catalog is the single owner of intrinsic WorldObject data', async () => {
  const catalog = await readFile(
    new URL(
      '../src/objects/object-definition-catalog.js',
      import.meta.url
    ),
    'utf8'
  );
  const placement = await readFile(
    new URL(
      '../src/world/world-object-placement-model.js',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(catalog, /visual:/);
  assert.match(catalog, /baseSize:/);
  assert.match(catalog, /doorAnchors:/);

  assert.equal(
    /visual\s*:|baseSize\s*:|doorAnchors\s*:|footprint\s*:/.test(
      placement.split(
        'export function resolveWorldObjectPlacement'
      )[0]
    ),
    false
  );
});

test('architecture sentinel: Builder placement UI cannot edit intrinsic Object Definition fields', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  for (const forbiddenId of [
    'object-asset',
    'building-width',
    'building-height',
    'building-footprint-width',
    'building-door-x',
    'bridge-length',
    'bridge-width',
    'bridge-passage-length',
    'bridge-edge-assist'
  ]) {
    assert.equal(
      html.includes(`id="${forbiddenId}"`),
      false,
      forbiddenId
    );
  }

  assert.equal(
    html.includes('id="object-definition"'),
    true
  );
  assert.equal(
    html.includes('id="object-add"'),
    true
  );
});

test('architecture sentinel: WorldDocument owns Object Definition references, never intrinsic object visuals', async () => {
  const demoWorld = await readFile(
    new URL('../src/world/demo-world.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    demoWorld.includes('assets/exploration/objects/'),
    false
  );
  assert.equal(
    demoWorld.includes('.webp'),
    false
  );
  assert.equal(
    demoWorld.includes(
      'objectdef.bridge.wood.rustic_bank.01'
    ),
    true
  );
  assert.equal(
    demoWorld.includes(
      'object.bridge.wood.rustic_bank.01'
    ),
    false
  );
  const objectBlock =
    demoWorld.match(
      /objects:\s*\[([\s\S]*?)\],\s*actors:/
    )?.[1] ?? '';

  assert.equal(
    /\bvisual\s*:/.test(
      objectBlock
    ),
    false
  );
  assert.equal(
    /\bbaseSize\s*:/.test(
      objectBlock
    ),
    false
  );
  assert.equal(
    /\bfootprint\s*:|\bdoorAnchors\s*:|\bkind\s*:/.test(
      objectBlock
    ),
    false
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


test('architecture sentinel: Map Actor Renderer never owns gameplay or collision', async () => {
  const renderer = await readFile(
    new URL('../src/render/map-actor-renderer.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    /stepMovement|isBlocked|collision|stats|health|currentAreaId\s*=/.test(renderer),
    false
  );
});

test('architecture sentinel: Map Actor visual model owns no position authority', async () => {
  const model = await readFile(
    new URL('../src/actors/map-actor-visual-model.js', import.meta.url),
    'utf8'
  );

  assert.equal(/\bx:\s*finiteNumber\(source\.x|\by:\s*finiteNumber\(source\.y/.test(model), false);
});

test('architecture sentinel: bootstrap waits for Map Actor source and preparation', async () => {
  const main = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.equal(main.includes('await mapActorImageLoader.load'), true);
  assert.equal(main.includes('mapActorVisualPreparer.prepare'), true);
  assert.equal(main.includes('Map Actor preparation failed'), true);
});

test('architecture sentinel: configured player has no concurrent circle fallback', async () => {
  const main = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.equal(main.includes("fillStyle = '#f1d36a'"), false);
  assert.equal(main.includes('mapActorRenderer.draw'), true);
});


test('architecture sentinel: World Builder draft owns no renderer, DOM, movement or collision authority', async () => {
  const draft = await readFile(
    new URL('../src/builder/world-builder-draft.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    /document\.(querySelector|getElementById|createElement)|\bwindow\b|\bHTMLElement\b|getContext|stepMovement|isBlocked|collision\.js|render\//.test(draft),
    false
  );
  assert.equal(draft.includes('normalizeWorldDocument'), true);
});

test('architecture sentinel: World Builder UI never imports gameplay movement or collision', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    /core\/movement|core\/collision|stepMovement|isBlocked/.test(main),
    false
  );
  assert.equal(main.includes('world-builder-draft.js'), true);
});

test('architecture sentinel: World Builder exports the canonical WorldDocument and no BuilderMap format', async () => {
  const draft = await readFile(
    new URL('../src/builder/world-builder-draft.js', import.meta.url),
    'utf8'
  );

  assert.equal(draft.includes('BuilderMap'), false);
  assert.equal(draft.includes('normalizeWorldDocument'), true);
  assert.equal(draft.includes('serializeWorldBuilderDraft'), true);
});

test('architecture sentinel: Builder preview reuses Exploration renderers', async () => {
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(main.includes('createSurfaceRenderer'), true);
  assert.equal(main.includes('createWorldObjectRenderer'), true);
  assert.equal(main.includes('createPortalRenderer'), true);
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

test('architecture sentinel: demo bridge placement references canonical river without duplicate collision geometry', async () => {
  const demo = await readFile(
    new URL('../src/world/demo-world.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    demo.includes('forest-stream-collision'),
    false
  );
  assert.equal(
    demo.includes('overridesObstacleIds'),
    false
  );
  assert.equal(
    demo.includes(
      'traversalSurfaceFeatureIds'
    ),
    true
  );
});

test('architecture sentinel: Builder edits only placement-local Bridge surface references', async () => {
  const builder = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  assert.equal(
    builder.includes(
      'overridesObstacleIds'
    ),
    false
  );
  assert.equal(
    builder.includes(
      'traversalSurfaceFeatureIds'
    ),
    true
  );
  assert.equal(
    builder.includes(
      'updateWorldObjectVisual'
    ),
    false
  );
  assert.equal(
    builder.includes(
      'patchWorldObject'
    ),
    false
  );
});
