import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

async function source(relativePath) {
  return readFile(
    new URL(relativePath, import.meta.url),
    'utf8'
  );
}

test('interior random policy stays in WorldArea + Encounter Controller only', async () => {
  const [
    worldArea,
    controller,
    renderer,
    portal,
    bridge
  ] = await Promise.all([
    source('../src/world/world-area-model.js'),
    source('../src/encounters/encounter-controller.js'),
    source('../src/render/world-object-renderer.js'),
    source('../src/world/portal-model.js'),
    source('../src/encounters/encounter-bridge.js')
  ]);

  assert.match(worldArea, /randomEnabled/);
  assert.match(controller, /randomEnabled/);

  assert.equal(/kind\s*===\s*['"]interior['"]/.test(controller), false);

  for (const forbidden of [renderer, portal, bridge]) {
    assert.equal(/randomEnabled/.test(forbidden), false);
    assert.equal(/kind\s*===\s*['"]interior['"]/.test(forbidden), false);
  }
});

test('interior safety is not simulated with a fake terrain family or material', async () => {
  const [
    demoWorld,
    familyResolver,
    encounterResolver,
    materialPack
  ] = await Promise.all([
    source('../src/world/demo-world.js'),
    source('../src/encounters/terrain-family-resolver.js'),
    source('../src/encounters/terrain-family-encounter-resolver.js'),
    source('../src/materials/material-pack-v1.js')
  ]);

  const combined = [
    demoWorld,
    familyResolver,
    encounterResolver,
    materialPack
  ].join('\n');

  assert.equal(/indoor[-_. ]?safe/i.test(combined), false);
  assert.equal(/interior[-_. ]?safe/i.test(combined), false);
});

test('runtime keeps explicit world-event authority separate from terrain random encounters', async () => {
  const main = await source('../src/main.js');

  assert.match(main, /worldEventController\.step/);
  assert.match(main, /encounterController\.step/);
  assert.equal(/combat\s*=\s*false/i.test(main), false);
  assert.equal(/disableCombat/i.test(main), false);
});
