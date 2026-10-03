import test from 'node:test';
import assert from 'node:assert/strict';

import {
  builderPanelForMapTool,
  builderPaintKindForMapTool
} from '../src/builder/world-builder-map-tool.js';

test('Encounter map tool opens Encounter panel and owns its paint path', () => {
  assert.equal(
    builderPanelForMapTool('encounter'),
    'encounters'
  );
  assert.equal(
    builderPaintKindForMapTool('encounter'),
    'encounter'
  );
});

test('terrain tools stay routed to Terrain panel', () => {
  for (const tool of ['terrain', 'route', 'river']) {
    assert.equal(builderPanelForMapTool(tool), 'terrain');
    assert.equal(builderPaintKindForMapTool(tool), tool);
  }
});

test('non-paint tools never masquerade as Encounter paint', () => {
  for (const tool of ['select', 'actor-preview', 'area-size']) {
    assert.equal(builderPaintKindForMapTool(tool), null);
  }
});
