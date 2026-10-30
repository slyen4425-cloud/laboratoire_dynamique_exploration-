import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REVISION = 'actor-opponent-view-v1';

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
    /src\/main\.js\?rev=[^"'\s]+/
  );
  assert.match(
    builder,
    /src\/builder\/world-builder-main\.js\?rev=[^"'\s]+/
  );
  assert.match(
    main,
    new RegExp(
      `capture-actor-preview-loader-v1\\.js\\?rev=${REVISION}`
    )
  );
  assert.match(
    builderMain,
    new RegExp(
      `capture-actor-preview-loader-v1\\.js\\?rev=${REVISION}`
    )
  );
  assert.match(
    loader,
    new RegExp(
      `capture-actor-definition-provider-v1\\.js\\?rev=${REVISION}`
    )
  );
});
