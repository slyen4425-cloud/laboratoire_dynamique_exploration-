import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ENTRY_REVISION = 'player-party-ref-v1';
const ACTOR_REVISION = 'actor-opponent-view-v1';

test('public Actor opponent-view fix cache-busts the complete module chain', async () => {
  const [
    index,
    builder,
    main,
    builderMain,
    loader
  ] = await Promise.all([
    readFile(
      new URL('../index.html', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../builder.html', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../src/main.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL('../src/builder/world-builder-main.js', import.meta.url),
      'utf8'
    ),
    readFile(
      new URL(
        '../src/capture/capture-actor-preview-loader-v1.js',
        import.meta.url
      ),
      'utf8'
    )
  ]);

  assert.match(
    index,
    new RegExp(
      `src/main\\.js\\?rev=${ENTRY_REVISION}`
    )
  );
  assert.match(
    builder,
    new RegExp(
      `src/builder/world-builder-main\\.js\\?rev=${ACTOR_REVISION}`
    )
  );
  assert.match(
    main,
    new RegExp(
      `capture-actor-preview-loader-v1\\.js\\?rev=${ACTOR_REVISION}`
    )
  );
  assert.match(
    builderMain,
    new RegExp(
      `capture-actor-preview-loader-v1\\.js\\?rev=${ACTOR_REVISION}`
    )
  );
  assert.match(
    loader,
    new RegExp(
      `capture-actor-definition-provider-v1\\.js\\?rev=${ACTOR_REVISION}`
    )
  );
});
