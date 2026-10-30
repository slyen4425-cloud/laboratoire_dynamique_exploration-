import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createCaptureEncounterSnapshot,
  CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA,
  CAPTURE_ENCOUNTER_SNAPSHOT_VERSION
} from '../src/encounters/capture-encounter-contract.js';

test('CaptureEncounterSnapshot v1 exposes only the public combat contract', () => {
  const snapshot = createCaptureEncounterSnapshot({
    encounterId: 'encounter-7',
    source: 'terrain-random',
    playerPartyRef: 'capture-party-player-v1',
    opponentCreatureId: 'crea_braiseau',
    rulesetId: 'capture.standard.1v1',
    areaId: 'forest-exterior',
    terrainFamilyId: 'forest',
    elementId: 'fire',
    returnToken: 'return-7',
    stats: { hp: 999 },
    mapVisual: { assetId: 'forbidden' },
    worldDocument: { forbidden: true }
  });

  assert.deepEqual(snapshot, {
    schema: CAPTURE_ENCOUNTER_SNAPSHOT_SCHEMA,
    version: CAPTURE_ENCOUNTER_SNAPSHOT_VERSION,
    encounterId: 'encounter-7',
    source: 'terrain-random',
    player: {
      partyRef: 'capture-party-player-v1'
    },
    opponents: [
      {
        creatureId: 'crea_braiseau'
      }
    ],
    rules: {
      rulesetId: 'capture.standard.1v1'
    },
    context: {
      areaId: 'forest-exterior',
      terrainFamilyId: 'forest',
      elementId: 'fire'
    },
    returnToken: 'return-7'
  });

  assert.equal('stats' in snapshot, false);
  assert.equal('mapVisual' in snapshot, false);
  assert.equal('worldDocument' in snapshot, false);
});

test('CaptureEncounterSnapshot requires opaque refs and canonical ids', () => {
  assert.throws(
    () => createCaptureEncounterSnapshot({
      encounterId: '',
      playerPartyRef: 'party',
      opponentCreatureId: 'creature',
      rulesetId: 'rules',
      areaId: 'area',
      terrainFamilyId: 'forest',
      elementId: 'fire',
      returnToken: 'token'
    }),
    /encounterId/
  );

  assert.throws(
    () => createCaptureEncounterSnapshot({
      encounterId: 'encounter',
      playerPartyRef: '',
      opponentCreatureId: 'creature',
      rulesetId: 'rules',
      areaId: 'area',
      terrainFamilyId: 'forest',
      elementId: 'fire',
      returnToken: 'token'
    }),
    /playerPartyRef/
  );
});
