import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { resolveMaterialAsset } from '../src/assets/material-asset-adapter.js';
import { reliefCanyonPilotDocument } from '../src/world/relief-canyon-pilot-world.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { isBlocked } from '../src/core/collision.js';
import { shouldRenderReliefWater, drawReliefRiverBankFoam } from '../src/render/relief-water-overlay.js';
import { importWorldBuilderDocument, serializeWorldBuilderDraft,
  createWorldBuilderDraft } from '../src/builder/world-builder-draft.js';

const canyon = reliefCanyonPilotDocument.areas[0];
const river = canyon.surface.rivers[0];

test('canyon v2 uses a dedicated semantic water material without changing classic maps', () => {
  const materials = createMaterialRegistry(materialPackV1);
  const material = materials.require('water.canyon_turquoise', 'water');
  assert.equal(river.materialId, material.id);
  assert.equal(river.traversalRuleId, 'terrain.water');
  assert.equal(material.assets.center, 'texture.water.canyon.turquoise.01');
  assert.equal(material.assets.bank, null, 'V4 retires segmented bank sprite for canyon');
  assert.ok(material.render.outerBankPadding >= 30);
  for (const id of [material.assets.center, material.assets.bank]) {
    const asset = resolveMaterialAsset(id);
    assert.ok(asset, id);
    assert.match(asset.path, /assets\/exploration\/materials\/forest\/(water|transitions)\/.+\.svg$/);
    const svg = fs.readFileSync(asset.path.slice(2), 'utf8');
    assert.match(svg, /^<svg[^>]+viewBox=/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.ok(svg.length > 600, 'source must contain artwork, not an empty placeholder');
  }
  assert.equal(demoWorldDocument.areas[0].surface.rivers[0].materialId, 'water.forest_stream');
  assert.equal(shouldRenderReliefWater(demoWorldDocument.id, demoWorldDocument.areas[0]), false);
  assert.equal(shouldRenderReliefWater(reliefCanyonPilotDocument.id, canyon), true);
});

test('river collision and serialized authoring geometry remain canonical with richer art', () => {
  const serialized = serializeWorldBuilderDraft(createWorldBuilderDraft(reliefCanyonPilotDocument));
  const imported = importWorldBuilderDocument(serialized);
  assert.deepEqual(imported.areas[0].surface.rivers, canyon.surface.rivers);
  assert.deepEqual(imported.areas[0].objects, canyon.objects);
  const ground = { radius: 12, locomotion: { modes: ['ground'] } };
  const swim = { radius: 12, locomotion: { modes: ['swim'] } };
  assert.equal(isBlocked(canyon, ground, 1000, 822), true);
  assert.equal(isBlocked(canyon, swim, 1000, 822), false);
});

test('foam pass is bounded, viewport culled, animated and read-only', () => {
  const snapshot = JSON.stringify(canyon);
  let strokes = 0;
  const ctx = new Proxy({}, {
    get(_obj, key) {
      if (['save','restore','translate','rotate','beginPath','moveTo','quadraticCurveTo'].includes(key))
        return () => {};
      if (key === 'stroke') return () => strokes++;
      return undefined;
    },
    set() { return true; }
  });
  const view = {area:canyon, camera:{x:0,y:0},
    viewport:{width:canyon.width,height:canyon.height}, timeSeconds:0.25};
  const count = drawReliefRiverBankFoam(ctx, view);
  assert.ok(count > 6 && count <= 40);
  assert.equal(strokes, count);
  assert.equal(drawReliefRiverBankFoam(ctx, { ...view, camera:{x:-5000,y:-5000},
    viewport:{width:200,height:150} }), 0);
  assert.equal(JSON.stringify(canyon), snapshot);
});

test('waterfall artwork adds layered foam while retaining the unique canonical sprite', () => {
  const source = fs.readFileSync('assets/exploration/objects/relief/waterfall_blue_01.svg','utf8');
  assert.match(source, /id="deep"/);
  assert.match(source, /id="pool"/);
  assert.match(source, /<\/svg>\s*$/);
  const script = fs.readFileSync('src/main.js','utf8');
  const builder = fs.readFileSync('src/builder/world-builder-main.js','utf8');
  assert.match(script, /drawReliefRiverBankFoam\(ctx, /);
  assert.match(builder, /drawReliefRiverBankFoam\(ctx, /);
  assert.match(script, /&art=canyon-water-art-v2/);
  assert.match(builder, /&art=canyon-water-art-v2/);
});
