import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('runtime exposes one Encounter Snapshot preview panel', async () => {
  const html = await readFile(
    new URL('../index.html', import.meta.url),
    'utf8'
  );

  for (const id of [
    'encounter-preview',
    'encounter-preview-summary',
    'encounter-preview-continue'
  ]) {
    assert.match(
      html,
      new RegExp(`id=["']${id}["']`)
    );
  }
});

test('runtime routes encounter detection through controller and bridge without timer authority', async () => {
  const source = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /createEncounterController/);
  assert.match(source, /snapshotFromEncounterIntent/);
  assert.match(source, /encounterController\.step/);
  assert.match(source, /encounterController\.release/);
  assert.equal(/setInterval\s*\(/.test(source), false);
  assert.equal(/MutationObserver/.test(source), false);
});

test('encounter test mode injects deterministic RNG instead of bypassing resolver', async () => {
  const source = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /encounterTest/);
  assert.match(source, /encounterRandom/);
  assert.match(source, /random:\s*encounterRandom/);
  assert.equal(/opponentCreatureId\s*=/.test(source), false);
});


test('runtime publishes the canonical Capture player party reference and forbids the retired preview id', async () => {
  const source = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  assert.match(
    source,
    /playerPartyRef:\s*['"]capture-party-player-v1['"]/
  );
  assert.equal(
    source.includes('capture-party-preview'),
    false
  );
});
