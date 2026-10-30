import test from 'node:test';
import assert from 'node:assert/strict';

import {
  USER_MATERIAL_DB_NAME,
  USER_MATERIAL_STORE_NAME,
  createUserMaterialStore
} from '../src/storage/user-material-store.js';

test('user material store has one explicit versioned IndexedDB authority', async () => {
  assert.equal(
    USER_MATERIAL_DB_NAME,
    'gensrpg-exploration-user-materials-v1'
  );
  assert.equal(USER_MATERIAL_STORE_NAME, 'materials');

  const store = createUserMaterialStore({
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
