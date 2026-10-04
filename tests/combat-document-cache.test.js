import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REVISION =
  'player-party-recall-runtime-fix-v1';

test('public Exploration entry versions the Combat navigation module', async () => {
  const [index, main, navigation] =
    await Promise.all([
      readFile(
        new URL('../index.html', import.meta.url),
        'utf8'
      ),
      readFile(
        new URL('../src/main.js', import.meta.url),
        'utf8'
      ),
      readFile(
        new URL(
          '../src/encounters/combat-handoff-navigation.js',
          import.meta.url
        ),
        'utf8'
      )
    ]);

  assert.match(
    index,
    new RegExp(
      `src/main\\.js\\?rev=${REVISION}`
    )
  );
  assert.match(
    main,
    new RegExp(
      `combat-handoff-navigation\\.js\\?rev=${REVISION}`
    )
  );
  assert.match(
    navigation,
    new RegExp(
      `exploration-encounter\\.html[\\s\\S]*searchParams\\.set\\([\\s\\S]*['"]rev['"][\\s\\S]*${REVISION}`
    )
  );
});
