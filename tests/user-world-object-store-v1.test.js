import test from 'node:test';
import assert from 'node:assert/strict';

import {
  USER_WORLD_OBJECT_DB_NAME,
  USER_WORLD_OBJECT_STORE_NAME,
  createUserWorldObjectStore
} from '../src/storage/user-world-object-store.js';

test('user WorldObject store has one explicit versioned IndexedDB authority', async () => {
  assert.equal(
    USER_WORLD_OBJECT_DB_NAME,
    'gensrpg-exploration-user-objects-v1'
  );
  assert.equal(
    USER_WORLD_OBJECT_STORE_NAME,
    'objects'
  );

  const store =
    createUserWorldObjectStore({
      indexedDBFactory: null
    });

  assert.equal(store.available, false);
  await assert.rejects(
    () => store.list(),
    /IndexedDB unavailable/
  );
  await assert.rejects(
    () => store.put({ id: 'x' }),
    /IndexedDB unavailable/
  );
});
