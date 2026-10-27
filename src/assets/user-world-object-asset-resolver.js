export function createUserWorldObjectAssetResolver(
  records,
  {
    urlApi =
      typeof URL !== 'undefined'
        ? URL
        : null
  } = {}
) {
  const byId = new Map();
  const urls = [];

  if (
    !urlApi?.createObjectURL ||
    !urlApi?.revokeObjectURL
  ) {
    return Object.freeze({
      resolve() {
        return null;
      },
      list() {
        return Object.freeze([]);
      },
      dispose() {}
    });
  }

  for (const record of Array.isArray(records) ? records : []) {
    if (!record?.assetId || !(record.blob instanceof Blob)) {
      continue;
    }

    const path = urlApi.createObjectURL(record.blob);
    urls.push(path);
    byId.set(
      record.assetId,
      Object.freeze({
        id: record.assetId,
        kind: 'user-world-object-visual',
        path,
        provenance: 'user-local',
        render: Object.freeze({
          rotationOffsetDeg: 0,
          widthScale: 1,
          heightScale: 1
        })
      })
    );
  }

  return Object.freeze({
    resolve(assetId) {
      const id =
        typeof assetId === 'string'
          ? assetId.trim()
          : '';
      return id ? byId.get(id) ?? null : null;
    },
    list() {
      return Object.freeze([...byId.values()]);
    },
    dispose() {
      for (const url of urls) {
        urlApi.revokeObjectURL(url);
      }
      urls.splice(0);
      byId.clear();
    }
  });
}
