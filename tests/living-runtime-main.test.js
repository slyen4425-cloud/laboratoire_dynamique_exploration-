import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('runtime wires living world through planner, actor-definition adapter and existing Map Actor renderer', async () => {
  const main = await readFile(
    new URL('../src/main.js', import.meta.url),
    'utf8'
  );

  for (const symbol of [
    'demoLivingWorldConfig',
    'resolveDemoLivingActorDefinition',
    'createInitialWildlife',
    'collectLivingMapActorAssetIds',
    'createWildMapActorView',
    'createWildWanderController'
  ]) {
    assert.match(main, new RegExp(symbol));
  }

  assert.match(
    main,
    /requiredMapActorAssetIds[\s\S]*collectLivingMapActorAssetIds/
  );
  assert.match(
    main,
    /wildCreatures[\s\S]*createWildMapActorView/
  );
  assert.match(
    main,
    /mapActorRenderer\.draw[\s\S]*wildMapActors/
  );
  assert.doesNotMatch(main, /setInterval\s*\(/);
});

test('demo living actor adapter is explicitly isolated from Capture internals', async () => {
  const adapter = await readFile(
    new URL(
      '../src/living/demo-living-actor-adapter.js',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(adapter, /DEMO/);
  assert.match(adapter, /actorDefinitionId|definition/i);
  assert.doesNotMatch(adapter, /Zombicide-40k|GenSrpg_labo_combat_dynamique/);
});


test('aquatic demo actor stays an Actor Definition capability and is not copied into living entities', async () => {
  const adapter = await readFile(
    new URL(
      '../src/living/demo-living-actor-adapter.js',
      import.meta.url
    ),
    'utf8'
  );
  const demoWorld = await readFile(
    new URL(
      '../src/living/demo-living-world.js',
      import.meta.url
    ),
    'utf8'
  );

  assert.match(adapter, /capture\.creature\.demo\.swim/);
  assert.match(adapter, /modes:\s*Object\.freeze\(\['swim'\]\)/);
  assert.match(demoWorld, /demo-swim-water-zone/);
  assert.match(demoWorld, /demo-swim-rule/);
});
