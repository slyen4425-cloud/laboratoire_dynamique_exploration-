import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const repoFile = (path) =>
  new URL(`../${path}`, import.meta.url);

async function source(path) {
  return readFile(repoFile(path), 'utf8');
}

const canonicalDocument = Object.freeze({
  areas: Object.freeze([
    Object.freeze({ id: 'outside', kind: 'exterior' }),
    Object.freeze({ id: 'house-interior', kind: 'interior' })
  ]),
  portals: Object.freeze([
    Object.freeze({
      id: 'enter-house',
      sourceAreaId: 'outside',
      targetAreaId: 'house-interior',
      targetSpawnId: 'inside-entry',
      trigger: Object.freeze({
        kind: 'object-anchor',
        objectId: 'house-1',
        anchorId: 'main-door',
        radius: 28
      })
    }),
    Object.freeze({
      id: 'leave-house',
      sourceAreaId: 'house-interior',
      targetAreaId: 'outside',
      targetSpawnId: 'outside-return',
      trigger: Object.freeze({
        kind: 'point',
        x: 64,
        y: 92,
        radius: 28
      })
    })
  ])
});

test('map area navigation derives exterior building -> interior from canonical Portal only', async () => {
  const {
    resolveLinkedInteriorNavigation
  } = await import(
    '../src/builder/world-builder-area-navigation.js'
  );

  assert.deepEqual(
    resolveLinkedInteriorNavigation(
      canonicalDocument,
      {
        sourceAreaId: 'outside',
        buildingId: 'house-1'
      }
    ),
    {
      portalId: 'enter-house',
      targetAreaId: 'house-interior'
    }
  );
});

test('map area navigation derives interior -> exterior from canonical return Portal', async () => {
  const {
    resolveExteriorReturnNavigation
  } = await import(
    '../src/builder/world-builder-area-navigation.js'
  );

  assert.deepEqual(
    resolveExteriorReturnNavigation(
      canonicalDocument,
      'house-interior'
    ),
    {
      portalId: 'leave-house',
      targetAreaId: 'outside'
    }
  );
});

test('navigation helper remains a read-only projection and creates no parallel area authority', async () => {
  const helper = await source(
    'src/builder/world-builder-area-navigation.js'
  );

  for (const forbidden of [
    'portalRef',
    'navigationAreaId',
    'interiorAreaId',
    'exteriorAreaId',
    'targetX',
    'targetY'
  ]) {
    assert.equal(
      helper.includes(forbidden),
      false,
      `parallel navigation field forbidden: ${forbidden}`
    );
  }

  assert.equal(
    /push\s*\(|splice\s*\(|\.portals\s*=|\.areas\s*=/.test(helper),
    false
  );
});

test('Builder exposes map focus controls and simple area shortcuts on the map', async () => {
  const html = await source('builder.html');

  for (const id of [
    'map-area-context',
    'map-area-label',
    'map-area-back',
    'map-area-enter',
    'preview-fullscreen',
    'preview-fullscreen-exit',
    'builder-landscape-hint'
  ]) {
    assert.match(
      html,
      new RegExp(`id=["']${id}["']`)
    );
  }

  assert.match(html, /←\s*Extérieur/);
  assert.match(html, /Intérieur\s*→/);
  assert.match(
    html,
    /id=["']test-exploration["'][^>]*href=["']\.\/index\.html\?builderTest=1&rev=collision-boundary-worldobject-obstacles-v1["']/
  );
  assert.match(
    html,
    /world-builder-main\.js\?rev=collision-boundary-worldobject-obstacles-v1/
  );
  assert.match(
    html,
    /world-builder\.css\?rev=collision-boundary-worldobject-obstacles-v1/
  );
});

test('Builder focus mode fills the viewport and provides portrait landscape guidance', async () => {
  const css = await source(
    'src/builder/world-builder.css'
  );

  assert.match(
    css,
    /\.preview-panel\.is-map-focus[\s\S]*position:\s*fixed/
  );
  assert.match(
    css,
    /\.preview-panel\.is-map-focus[\s\S]*100dvh/
  );
  assert.match(css, /safe-area-inset-/);
  assert.match(
    css,
    /@media\s*\([^)]*orientation:\s*portrait[^)]*\)/
  );
  assert.match(css, /#builder-landscape-hint/);
});

test('Builder uses progressive Fullscreen/orientation APIs and one centralized area switch', async () => {
  const main = await source(
    'src/builder/world-builder-main.js'
  );

  assert.match(
    main,
    /world-builder-viewport\.js\?rev=mobile-landscape-area-navigation-ux-v1-r5/
  );
  assert.match(main, /requestFullscreen/);
  assert.match(main, /screen\.orientation/);
  assert.match(
    main,
    /function\s+selectAreaForEditing\s*\(/
  );
  assert.match(
    main,
    /resolveLinkedInteriorNavigation/
  );
  assert.match(
    main,
    /resolveExteriorReturnNavigation/
  );

  const directAssignments =
    [...main.matchAll(/selectedAreaId\s*=(?!=)\s*/g)];

  assert.ok(
    directAssignments.length <= 2,
    'area changes should converge on the centralized UI helper'
  );
});

test('runtime presents landscape guidance without adding gameplay orientation authority', async () => {
  const [html, css, main] = await Promise.all([
    source('index.html'),
    source('src/style.css'),
    source('src/main.js')
  ]);

  assert.match(
    html,
    /id=["']runtime-landscape-hint["']/
  );
  assert.match(
    html,
    /style\.css\?rev=collision-boundary-worldobject-obstacles-v1/
  );
  assert.match(
    css,
    /@media\s*\([^)]*orientation:\s*portrait[^)]*\)/
  );
  assert.match(css, /#runtime-landscape-hint/);

  assert.equal(/orientation\.lock/.test(main), false);
  assert.equal(/requestFullscreen/.test(main), false);
});


test('landscape map focus keeps controls as overlays so the canvas owns the viewport', async () => {
  const css = await source(
    'src/builder/world-builder.css'
  );

  assert.match(
    css,
    /\.preview-panel\.is-map-focus\s+\.map-area-context\s*\{[\s\S]*?position:\s*absolute/
  );
  assert.match(
    css,
    /\.preview-panel\.is-map-focus\s+\.map-tools\s*\{[\s\S]*?position:\s*absolute/
  );
  assert.match(
    css,
    /\.preview-panel\.is-map-focus\s+\.preview-tools\s*\{[\s\S]*?display:\s*none/
  );
  assert.match(
    css,
    /\.preview-panel\.is-map-focus\s+#builder-preview\s*\{[\s\S]*?position:\s*absolute[\s\S]*?inset:\s*0/
  );
  assert.match(
    css,
    /\.preview-panel\.is-map-focus\s+\.map-area-location\s+span\s*\{[\s\S]*?display:\s*none/
  );
});
