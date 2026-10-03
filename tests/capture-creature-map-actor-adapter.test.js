import test from 'node:test';
import assert from 'node:assert/strict';

import {
  mapActorVisualFromCaptureCreature
} from '../src/capture/capture-creature-map-actor-adapter.js';

test('Capture creature presentation can seed one MapActorVisual without copying gameplay data', () => {
  const creature = {
    id: 'crea_firewolf',
    name: 'Loup de feu',
    elements: ['fire'],
    presentation: {
      displayScale: 1.2,
      visual: {
        front: { assetId: 'capture:firewolf:front' },
        back: { assetId: 'capture:firewolf:back' },
        icon: { assetId: 'capture:firewolf:icon' }
      }
    },
    stats: { hp: 999 }
  };

  const visual = mapActorVisualFromCaptureCreature(creature);

  assert.equal(visual.assetId, 'capture:firewolf:front');
  assert.equal(visual.role, 'creature');
  assert.equal('stats' in visual, false);
  assert.equal('elements' in visual, false);
});

test('Capture creature without presentation has no fake Map Actor asset', () => {
  assert.equal(
    mapActorVisualFromCaptureCreature({
      id: 'crea_without_visual',
      name: 'Sans visuel',
      elements: ['earth'],
      presentation: null
    }),
    null
  );
});
