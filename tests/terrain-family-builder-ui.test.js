import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('World Builder exposes editable terrain families independently from textures', async () => {
  const html =
    await readFile(
      new URL(
        '../builder.html',
        import.meta.url
      ),
      'utf8'
    );

  for (const id of [
    'terrain-family-definition-select',
    'terrain-family-add',
    'terrain-family-delete',
    'terrain-family-label',
    'area-family',
    'area-material',
    'terrain-family',
    'terrain-paint-material',
    'terrain-route-family',
    'terrain-route-material',
    'terrain-river-family',
    'terrain-river-material',
    'family-encounter-family',
    'family-encounter-chance',
    'family-encounter-elements',
    'family-encounter-total'
  ]) {
    assert.match(
      html,
      new RegExp(
        `id=["']${id}["']`
      )
    );
  }

  assert.equal(
    /Famille fixe/.test(html),
    false
  );
});

test('Builder no longer exposes a separate Encounter painting system', async () => {
  const html =
    await readFile(
      new URL(
        '../builder.html',
        import.meta.url
      ),
      'utf8'
    );

  assert.equal(
    /data-tab=["']encounters["']/.test(
      html
    ),
    false
  );
  assert.equal(
    /data-map-tool=["']encounter["']/.test(
      html
    ),
    false
  );
  assert.equal(
    /encounter-entry-tags/.test(html),
    false
  );
  assert.equal(
    /encounter-entry-actor/.test(html),
    false
  );
});

test('family encounter UI remains percentage-based and contains no typed creature ids', async () => {
  const html =
    await readFile(
      new URL(
        '../builder.html',
        import.meta.url
      ),
      'utf8'
    );

  assert.match(
    html,
    /Rencontres par famille/
  );
  assert.match(
    html,
    /Chance de rencontre/
  );
  assert.match(
    html,
    /Total éléments/
  );
  assert.equal(
    /actorDefinitionId/.test(html),
    false
  );
});
