import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveExplorationCombatReturn
} from '../src/encounters/combat-return.js';

const worldDocument = {
  areas: [
    { id: 'forest-exterior' },
    { id: 'house-interior-01' }
  ]
};

test('combat return restores only Exploration-owned area/x/y', () => {
  const resolved =
    resolveExplorationCombatReturn({
      envelope: {
        returnState: {
          areaId: 'forest-exterior',
          x: 526.8,
          y: 898.6,
          returnUrl: '/return'
        },
        result: {
          encounterId: 'e',
          returnToken: 'r',
          outcome: 'victory',
          position: {
            x: 9999,
            y: 9999
          }
        }
      },
      worldDocument
    });

  assert.deepEqual(resolved, {
    currentAreaId: 'forest-exterior',
    x: 526.8,
    y: 898.6,
    outcome: 'victory'
  });
});

test('combat return rejects an area no longer present in Exploration world', () => {
  assert.throws(
    () =>
      resolveExplorationCombatReturn({
        envelope: {
          returnState: {
            areaId: 'missing',
            x: 1,
            y: 2,
            returnUrl: '/return'
          },
          result: {
            outcome: 'victory'
          }
        },
        worldDocument
      }),
    /areaId/
  );
});
