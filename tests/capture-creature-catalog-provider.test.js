import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCaptureCreatureCatalogProvider
} from '../src/capture/capture-creature-catalog-provider.js';

function captureDatabase() {
  return {
    schema: 'capture-database-v1',
    version: 1,
    creatures: [
      {
        draft: {
          id: 'crea_firewolf',
          displayName: 'Loup de feu',
          elements: ['fire'],
          presentation: {
            visual: {
              front: { assetId: 'capture:firewolf:front' },
              back: { assetId: 'capture:firewolf:back' },
              icon: { assetId: 'capture:firewolf:icon' }
            },
            displayScale: 1.25
          }
        }
      },
      {
        draft: {
          id: 'crea_aquafin',
          displayName: 'Aquafin',
          elements: ['water'],
          presentation: null
        }
      },
      {
        draft: {
          id: 'crea_dual',
          displayName: 'Dracendre',
          elements: ['fire', 'air'],
          presentation: null
        }
      }
    ]
  };
}

test('Capture catalog provider reads CaptureDatabaseV1 without owning creature data', () => {
  const provider = createCaptureCreatureCatalogProvider(
    captureDatabase()
  );

  assert.deepEqual(
    provider.listCreatures().map((entry) => entry.id),
    ['crea_aquafin', 'crea_dual', 'crea_firewolf']
  );

  assert.deepEqual(
    provider.listElements().map((entry) => entry.id),
    ['air', 'fire', 'water']
  );
});

test('element selector resolves every Capture creature declaring that element', () => {
  const provider = createCaptureCreatureCatalogProvider(
    captureDatabase()
  );

  assert.deepEqual(
    provider.findByElement('fire').map((entry) => entry.id),
    ['crea_dual', 'crea_firewolf']
  );

  assert.deepEqual(
    provider.findByElement('water').map((entry) => entry.id),
    ['crea_aquafin']
  );
});

test('provider preserves Capture presentation references for Map Actor adapter use', () => {
  const provider = createCaptureCreatureCatalogProvider(
    captureDatabase()
  );
  const creature = provider.resolveCreature('crea_firewolf');

  assert.equal(
    creature.presentation.visual.front.assetId,
    'capture:firewolf:front'
  );
  assert.equal(
    creature.presentation.visual.back.assetId,
    'capture:firewolf:back'
  );
  assert.equal(
    creature.presentation.visual.icon.assetId,
    'capture:firewolf:icon'
  );
});

test('provider accepts the preview projection shape but never mutates it', () => {
  const preview = Object.freeze({
    source: Object.freeze({
      schema: 'capture-creature-catalog-preview-v1'
    }),
    creatures: Object.freeze([
      Object.freeze({
        id: 'crea_braiseau',
        name: 'Braiseau',
        elements: Object.freeze(['fire'])
      })
    ])
  });

  const provider = createCaptureCreatureCatalogProvider(preview);

  assert.equal(provider.resolveCreature('crea_braiseau').name, 'Braiseau');
  assert.deepEqual(provider.findByElement('fire').map((entry) => entry.id), [
    'crea_braiseau'
  ]);
});
