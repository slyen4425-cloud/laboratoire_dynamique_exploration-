import test from 'node:test';
import assert from 'node:assert/strict';

import {
  snapshotFromEncounterIntent
} from '../src/encounters/encounter-bridge.js';

test('Encounter Bridge maps public Encounter Intent to CaptureEncounterSnapshot v1', () => {
  const snapshot = snapshotFromEncounterIntent({
    version: 1,
    source: 'terrain-random',
    encounterId: 'encounter-1',
    returnToken: 'return-1',
    playerPartyRef: 'capture-party-player-v1',
    rulesetId: 'capture.standard.1v1',
    areaId: 'forest-exterior',
    terrainFamilyId: 'forest',
    elementId: 'fire',
    opponentCreatureId: 'crea_braiseau',
    internalPosition: { x: 123, y: 456 },
    mapVisual: { forbidden: true }
  });

  assert.equal(snapshot.encounterId, 'encounter-1');
  assert.equal(snapshot.player.partyRef, 'capture-party-player-v1');
  assert.equal(snapshot.opponents[0].creatureId, 'crea_braiseau');
  assert.equal(snapshot.context.terrainFamilyId, 'forest');
  assert.equal(snapshot.returnToken, 'return-1');
  assert.equal('internalPosition' in snapshot, false);
  assert.equal('mapVisual' in snapshot, false);
});


test('Encounter Bridge keeps explicit combat sources independent from terrain-random policy', () => {
  const snapshot = snapshotFromEncounterIntent({
    version: 1,
    source: 'scripted-explicit',
    encounterId: 'scripted-1',
    returnToken: 'scripted-return-1',
    playerPartyRef: 'capture-party-player-v1',
    rulesetId: 'capture.standard.1v1',
    areaId: 'house-interior-01',
    terrainFamilyId: 'plain',
    elementId: 'fire',
    opponentCreatureId: 'crea_braiseau'
  });

  assert.equal(snapshot.source, 'scripted-explicit');
  assert.equal(snapshot.context.areaId, 'house-interior-01');
});
