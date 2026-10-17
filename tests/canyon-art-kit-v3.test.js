import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { resolveMaterialAsset } from '../src/assets/material-asset-adapter.js';
import { reliefCanyonPilotDocument } from '../src/world/relief-canyon-pilot-world.js';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { isBlocked } from '../src/core/collision.js';
import { createWorldBuilderDraft, serializeWorldBuilderDraft, importWorldBuilderDocument } from '../src/builder/world-builder-draft.js';

const newObjects = [
  ['objectdef.relief.cliff.grassy_edge.01', /cliff_grassy_edge_02\.svg$/, '0 0 768 384'],
  ['objectdef.relief.cliff.corner.01', /cliff_corner_02\.svg$/, '0 0 420 405'],
  ['objectdef.relief.waterfall.blue.01', /waterfall_rockfall_02\.svg$/, '0 0 280 440']
];
const newTextures = [
  ['texture.water.canyon.turquoise.01', /water_canyon_turquoise_02\.svg$/, '0 0 512 512'],
  ['transition.water.canyon.turquoise.bank.01', /water_canyon_turquoise_bank_02\.svg$/, '0 0 512 192']
];

function readVerifiedAsset(asset, file, viewBox) {
  assert.ok(asset?.path?.startsWith('./assets/exploration/'), 'asset must be local external file');
  assert.match(asset.path, file);
  const svg = fs.readFileSync(asset.path.slice(2), 'utf8');
  assert.match(svg, /^<svg[^>]+viewBox=/);
  assert.ok(svg.includes(`viewBox="${viewBox}"`));
  assert.match(svg, /<\/svg>\s*$/);
  assert.doesNotMatch(svg, /<script|<foreignObject|(?:href|xlink:href)=['\"]https?:/i);
  assert.ok(svg.length > 1000);
  return svg;
}

test('canyon V3 art is five external assets resolved via one canonical catalog and adapter each', () => {
  for (const [definitionId, expectedPath, viewBox] of newObjects) {
    const def = objectDefinitionCatalogV1.require(definitionId);
    readVerifiedAsset(resolveWorldObjectAsset(def.visual.assetId), expectedPath, viewBox);
  }
  const material = createMaterialRegistry(materialPackV1).require('water.canyon_turquoise', 'water');
  readVerifiedAsset(resolveMaterialAsset(material.assets.center), newTextures[0][1], newTextures[0][2]);
  readVerifiedAsset(resolveMaterialAsset(material.assets.bank), newTextures[1][1], newTextures[1][2]);
  assert.equal(material.assets.center, newTextures[0][0]);
  assert.equal(material.assets.bank, newTextures[1][0]);
});

test('updated canyon river repeats without visible 256px gradient boundaries', () => {
  const material = createMaterialRegistry(materialPackV1).require('water.canyon_turquoise', 'water');
  const svg = fs.readFileSync(resolveMaterialAsset(material.assets.center).path.slice(2), 'utf8');
  assert.match(svg, /viewBox="0 0 512 512"/);
  assert.doesNotMatch(svg, /linearGradient/i);
  assert.match(svg, /<rect width="512" height="512" fill="#239cae"/);
  const bank = fs.readFileSync(resolveMaterialAsset(material.assets.bank).path.slice(2), 'utf8');
  assert.match(bank, /stop-opacity="0"/);
});

test('canyon V3 changes no geometry, terrain rules or collision ownership', () => {
  const canyon = reliefCanyonPilotDocument.areas[0];
  const classic = demoWorldDocument.areas[0];
  assert.equal(canyon.surface.rivers[0].traversalRuleId, 'terrain.water');
  assert.equal(classic.surface.rivers[0].materialId, 'water.forest_stream');
  assert.deepEqual(importWorldBuilderDocument(serializeWorldBuilderDraft(
    createWorldBuilderDraft(reliefCanyonPilotDocument)
  )).areas[0].objects, canyon.objects);
  assert.equal(isBlocked(canyon, {radius:12,locomotion:{modes:['ground']}}, 1000, 822), true);
  assert.equal(isBlocked(canyon, {radius:12,locomotion:{modes:['swim']}}, 1000, 822), false);
  assert.equal(objectDefinitionCatalogV1.require('objectdef.relief.cliff.grassy_edge.01').collision.role, 'obstacle');
});

test('canyon V3 cache revisions load external assets in game and Builder without JS image payload', () => {
  for (const entry of ['index.html', 'builder.html']) {
    const html = fs.readFileSync(entry, 'utf8');
    assert.match(html, /&kit=canyon-v3/);
    assert.doesNotMatch(html, /data:image\/svg\+xml/i);
  }
  for (const entry of ['src/main.js', 'src/builder/world-builder-main.js']) {
    const script = fs.readFileSync(entry, 'utf8');
    assert.match(script, /world-object-asset-adapter\.js\?rev=[^'"]+&kit=canyon-v3/);
    assert.match(script, /material-asset-adapter\.js\?rev=[^'"]+&kit=canyon-v3/);
  }
});
