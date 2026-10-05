export const USER_WORLD_OBJECT_DB_NAME =
  'gensrpg-exploration-user-objects-v1';
export const USER_WORLD_OBJECT_STORE_NAME =
  'objects';
export const USER_WORLD_OBJECT_DB_VERSION = 1;

function unavailable() {
  return Promise.reject(
    new Error('IndexedDB unavailable')
  );
}

export function createUserWorldObjectStore({
  indexedDBFactory =
    typeof indexedDB !== 'undefined'
      ? indexedDB
      : null
} = {}) {
  if (!indexedDBFactory?.open) {
    return Object.freeze({
      available: false,
      list: unavailable,
      get: unavailable,
      put: unavailable,
      delete: unavailable
    });
  }

  let dbPromise = null;

  function open() {
    if (dbPromise) return dbPromise;

    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDBFactory.open(
        USER_WORLD_OBJECT_DB_NAME,
        USER_WORLD_OBJECT_DB_VERSION
      );

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(USER_WORLD_OBJECT_STORE_NAME)) {
          const objectStore = db.createObjectStore(
            USER_WORLD_OBJECT_STORE_NAME,
            { keyPath: 'id' }
          );
          objectStore.createIndex(
            'createdAt',
            'createdAt',
            { unique: false }
          );
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(
        request.error ?? new Error('IndexedDB open failed')
      );
      request.onblocked = () => reject(
        new Error('IndexedDB open blocked')
      );
    });

    return dbPromise;
  }

  async function requestWithStore(mode, makeRequest) {
    const db = await open();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(
        USER_WORLD_OBJECT_STORE_NAME,
        mode
      );
      const objectStore =
        transaction.objectStore(USER_WORLD_OBJECT_STORE_NAME);

      let request;
      try {
        request = makeRequest(objectStore);
      } catch (error) {
        reject(error);
        return;
      }

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(
        request.error ?? new Error('IndexedDB request failed')
      );
    });
  }

  return Object.freeze({
    available: true,
    async list() {
      const values = await requestWithStore(
        'readonly',
        (objectStore) => objectStore.getAll()
      );
      return Object.freeze(
        [...(values ?? [])].sort((a, b) =>
          String(a.createdAt ?? '').localeCompare(
            String(b.createdAt ?? '')
          )
        )
      );
    },
    get(id) {
      return requestWithStore(
        'readonly',
        (objectStore) => objectStore.get(id)
      );
    },
    put(record) {
      if (!record?.id) {
        return Promise.reject(
          new Error('User object id is required')
        );
      }
      return requestWithStore(
        'readwrite',
        (objectStore) => objectStore.put(record)
      );
    },
    delete(id) {
      return requestWithStore(
        'readwrite',
        (objectStore) => objectStore.delete(id)
      );
    }
  });
}
