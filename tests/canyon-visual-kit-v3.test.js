import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import { resolveMaterialAsset } from '../src/assets/material-asset-adapter.js';
import { reliefCanyonPilotDocument } from '../src/world/relief-canyon-pilot-world.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { importWorldBuilderDocument, createWorldBuilderDraft,
  serializeWorldBuilderDraft } from '../src/builder/world-builder-draft.js';
import { isBlocked } from '../src/core/collision.js';

const area = reliefCanyonPilotDocument.areas[0];
const native = (p) => fs.readFileSync(p.replace(/^\.\//, ''), 'utf8');

test('canyon V3 uses two long cliff drawings with the SAME canonical collision shape', () => {
  const oldDef = objectDefinitionCatalogV1.require('objectdef.relief.cliff.grassy_edge.01');
  const altDef = objectDefinitionCatalogV1.require('objectdef.relief.cliff.broken_ledge.02');
  assert.deepEqual(altDef.baseSize, oldDef.baseSize);
  assert.deepEqual(altDef.collision, oldDef.collision);
  assert.notEqual(altDef.visual.assetId, oldDef.visual.assetId);
  assert.equal(area.objects.find(o => o.id === 'upper-cliff-right').objectDefinitionId, altDef.id);
  for (const id of [oldDef.visual.assetId, altDef.visual.assetId,
    'object.relief.cliff.corner.01', 'object.relief.waterfall.blue.01']) {
    const asset = resolveWorldObjectAsset(id);
    assert.ok(asset, id);
    assert.match(asset.path, /^\.\/assets\/exploration\/objects\/relief\/.+\.svg$/);
    assert.match(native(asset.path), /^<svg[^>]+viewBox=/);
    assert.match(native(asset.path), /<\/svg>\s*$/);
  }
  assert.notEqual(oldDef.collision.role, 'passable');
});

test('canyon V3 water art eliminates full tile nonperiodic gradient, keeping matching edge color', () => {
  const asset = resolveMaterialAsset('texture.water.canyon.turquoise.01');
  const svg = native(asset.path);
  assert.match(svg, /seamless all edges/);
  assert.match(svg, /<rect width="256" height="256" fill="#279fb2"\/>/);
  assert.doesNotMatch(svg, /id="lagoon"/);
  assert.match(svg, /<pattern id="currents" width="128" height="128"/);
  const bank = native(resolveMaterialAsset('transition.water.canyon.turquoise.bank.01').path);
  assert.match(bank, /stop-opacity="0"/);
  assert.match(bank, /<pattern id="foam" width="128" height="128"/);
  assert.equal(area.surface.rivers[0].materialId, 'water.canyon_turquoise');
  assert.equal(area.surface.rivers[0].traversalRuleId, 'terrain.water');
});

test('canyon V3 visual remaster is opt-in; immutable demo and movement/collision remain intact', () => {
  assert.equal(demoWorldDocument.id, 'forest-demo-world');
  assert.equal(demoWorldDocument.areas[0].surface.rivers[0].materialId, 'water.forest_stream');
  const origin = serializeWorldBuilderDraft(createWorldBuilderDraft(reliefCanyonPilotDocument));
  const copy = importWorldBuilderDocument(origin);
  assert.deepEqual(copy.areas[0].objects, area.objects);
  assert.deepEqual(copy.areas[0].surface.rivers, area.surface.rivers);
  const swimmer = {radius:12,locomotion:{modes:['swim']}};
  const walker = {radius:12,locomotion:{modes:['ground']}};
  assert.equal(isBlocked(area, walker, 1000, 822), true);
  assert.equal(isBlocked(area, swimmer, 1000, 822), false);
});

test('canyon V3 uses versioned external art, not encoded assets inside HTML or runtime', () => {
  const builder = native('builder.html');
  const runtime = native('index.html');
  const builderMain = native('src/builder/world-builder-main.js');
  const runtimeMain = native('src/main.js');
  assert.match(builder, /&kit=canyon-art-v3/);
  assert.match(runtime, /&kit=canyon-art-v3/);
  assert.match(builderMain, /cacheRevision: 'canyon-art-v3'/);
  assert.match(runtimeMain, /cacheRevision: 'canyon-art-v3'/);
  assert.match(builderMain, /building-interiors-passages-ux-r1-canyon-art-v3-relief-v7/);
  assert.match(runtimeMain, /world-object-library-v1-orientation-v1-canyon-art-v3-relief-v7/);
  for (const script of [builderMain, runtimeMain]) {
    assert.doesNotMatch(script, /data:image\/svg\+xml|<svg xmlns=/);
  }
});
