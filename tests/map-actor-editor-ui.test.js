import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('World Builder Actor panel is placement-only and has no intrinsic visual editor', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );
  const main = await readFile(
    new URL('../src/builder/world-builder-main.js', import.meta.url),
    'utf8'
  );

  for (const id of [
    'actor-definition',
    'actor-placement-select',
    'actor-add',
    'actor-x',
    'actor-y',
    'actor-facing',
    'actor-delete'
  ]) {
    assert.match(
      html,
      new RegExp(`id=["']${id}["']`)
    );
  }

  for (const removedId of [
    'actor-role',
    'actor-asset',
    'actor-image-import',
    'actor-target-height',
    'actor-source-facing',
    'actor-mirror',
    'actor-anchor-auto',
    'actor-anchor-x',
    'actor-anchor-y',
    'actor-shadow-enabled',
    'actor-shadow-width',
    'actor-shadow-height',
    'actor-shadow-opacity',
    'actor-idle-amplitude',
    'actor-idle-frequency',
    'actor-walk-amplitude',
    'actor-walk-frequency',
    'actor-moving',
    'actor-animate',
    'actor-export'
  ]) {
    assert.doesNotMatch(
      html,
      new RegExp(`id=["']${removedId}["']`)
    );
  }

  assert.match(html, /data-tab=["']actors["']/);
  assert.match(
    main,
    /createCaptureActorPreviewProviderV1/
  );
  assert.match(
    main,
    /createPlacedMapActorView/
  );
  assert.match(main, /addActorPlacement/);
  assert.match(main, /updateActorPlacement/);
  assert.match(main, /deleteActorPlacement/);
  assert.doesNotMatch(
    main,
    /actor\.user\.preview\.01/
  );
});

test('Actor placement UI states that visual settings belong to entity editors', async () => {
  const html = await readFile(
    new URL('../builder.html', import.meta.url),
    'utf8'
  );

  assert.match(
    html,
    /définition.*Héros.*PNJ.*Créature[\s\S]*visuel/is
  );
  assert.match(
    html,
    /sélectionner.*placer/is
  );
});
