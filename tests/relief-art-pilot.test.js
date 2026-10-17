import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import { demoWorldDocument } from '../src/world/demo-world.js';
import { reliefCanyonPilotDocument, reliefCanyonPilotSummary } from '../src/world/relief-canyon-pilot-world.js';
import { objectDefinitionCatalogV1 } from '../src/objects/object-definition-catalog.js';
import { createMaterialRegistry } from '../src/materials/material-registry.js';
import { materialPackV1 } from '../src/materials/material-pack-v1.js';
import { resolveWorldObjectAsset } from '../src/assets/world-object-asset-adapter.js';
import {
  createWorldBuilderDraft,
  serializeWorldBuilderDraft,
  importWorldBuilderDocument,
  validateWorldBuilderDraft
} from '../src/builder/world-builder-draft.js';

const ids = [
  'objectdef.relief.cliff.grassy_edge.01',
  'objectdef.relief.cliff.corner.01',
  'objectdef.relief.waterfall.blue.01'
];

test('relief canyon is an opt-in canonical WorldDocument and keeps classic demo intact', () => {
  assert.equal(demoWorldDocument.id, 'forest-demo-world');
  assert.equal(demoWorldDocument.initialAreaId, 'forest-exterior');
  assert.equal(reliefCanyonPilotDocument.id, 'relief-canyon-pilot-v1');
  assert.equal(reliefCanyonPilotSummary.cameraMode, 'existing-2d');
  assert.equal(reliefCanyonPilotSummary.levelHeightGameplay, false);
  const area = reliefCanyonPilotDocument.areas[0];
  assert.equal(area.kind, 'exterior');
  assert.equal(area.encounters.randomEnabled, false);
  assert.equal(area.surface.rivers.length, 1);
  assert.equal(area.surface.routes.length, 2);
  const materials = createMaterialRegistry(materialPackV1);
  for (const feature of [area.surface, ...area.surface.zones,
    ...area.surface.routes, ...area.surface.rivers]) {
    assert.ok(materials.resolve(feature.materialId ?? feature.baseMaterialId),
      'All visual material IDs must resolve before rendering');
  }
  assert.ok(area.objects.length > 10);
  for (const object of area.objects) assert.ok(objectDefinitionCatalogV1.get(object.objectDefinitionId));
  const draft = createWorldBuilderDraft(reliefCanyonPilotDocument);
  assert.equal(validateWorldBuilderDraft(draft).valid, true);
  const roundtrip = importWorldBuilderDocument(serializeWorldBuilderDraft(draft));
  assert.deepEqual(roundtrip.areas[0].objects, draft.areas[0].objects);
  assert.equal(roundtrip.areas[0].surface.rivers[0].id, 'canyon-river');
});

test('new relief props use canonical object registry and local SVG assets', () => {
  for (const definitionId of ids) {
    const definition = objectDefinitionCatalogV1.require(definitionId);
    const asset = resolveWorldObjectAsset(definition.visual.assetId);
    assert.ok(asset, definitionId);
    assert.match(asset.path, /^\.\/assets\/exploration\/objects\/relief\//);
    const svg = fs.readFileSync(asset.path.slice(2), 'utf8');
    assert.match(svg, /^<svg[^>]*viewBox=/);
    assert.match(svg, /<\/svg>\s*$/);
  }
  assert.equal(objectDefinitionCatalogV1.require(ids[0]).collision.role, 'obstacle');
  assert.equal(objectDefinitionCatalogV1.require(ids[1]).collision.role, 'obstacle');
  assert.equal(objectDefinitionCatalogV1.require(ids[2]).kind, 'decor');
  assert.equal(objectDefinitionCatalogV1.require(ids[2]).collision, undefined);
});

test('pilot is reachable directly in Builder without overwriting regular mode', () => {
  const script = fs.readFileSync('src/builder/world-builder-main.js', 'utf8');
  const html = fs.readFileSync('builder.html', 'utf8');
  assert.match(script, /builderParams.get\('demo'\) === 'relief-canyon-v1'/);
  assert.match(script, /resumedTestDocument \?\? defaultBuilderDocument/);
  assert.match(html, /relief-pilot-notice/);
  assert.match(html, /builder.html\?rev=relief-canyon-pilot-v1-classic/);
  assert.match(html, /&relief=relief-canyon-pilot-v1/);
});
