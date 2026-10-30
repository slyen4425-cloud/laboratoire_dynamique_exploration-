export function createImageAssetLoader({
  resolveAsset,
  imageFactory = () => new Image(),
  cacheRevision = null
}) {
  if (typeof resolveAsset !== 'function') {
    throw new Error('Image Asset Loader requires resolveAsset');
  }

  const slots = new Map();
  let disposed = false;

  function loadOne(assetId) {
    if (slots.has(assetId)) {
      return slots.get(assetId).promise;
    }

    const asset = resolveAsset(assetId);

    if (!asset) {
      const slot = {
        assetId,
        asset: null,
        image: null,
        state: 'missing',
        promise: null
      };

      slot.promise = Promise.resolve(slot);
      slots.set(assetId, slot);
      return slot.promise;
    }

    const image = imageFactory();
    const slot = {
      assetId,
      asset,
      image,
      state: 'loading',
      promise: null
    };

    slot.promise = new Promise((resolve) => {
      image.onload = () => {
        if (!disposed) slot.state = 'ready';
        resolve(slot);
      };

      image.onerror = () => {
        if (!disposed) slot.state = 'error';
        resolve(slot);
      };
    });

    const revisionablePath =
      typeof asset.path === 'string' &&
      !asset.path.startsWith('data:') &&
      !asset.path.startsWith('blob:');
    const separator = asset.path.includes('?') ? '&' : '?';

    image.src =
      cacheRevision && revisionablePath
        ? `${asset.path}${separator}rev=${encodeURIComponent(cacheRevision)}`
        : asset.path;
    slots.set(assetId, slot);
    return slot.promise;
  }

  function load(assetIds) {
    if (disposed) {
      return Promise.resolve(status());
    }

    const ids = Array.isArray(assetIds)
      ? [...new Set(assetIds.filter((id) => typeof id === 'string' && id.trim()))]
      : [];

    return Promise.all(ids.map(loadOne)).then(() => status());
  }

  function get(assetId) {
    const slot = slots.get(assetId);
    return slot?.state === 'ready' ? slot.image : null;
  }

  function state(assetId) {
    return slots.get(assetId)?.state ?? 'unloaded';
  }

  function status() {
    const values = [...slots.values()];

    return Object.freeze({
      total: values.length,
      ready: values.filter((slot) => slot.state === 'ready').length,
      loading: values.filter((slot) => slot.state === 'loading').length,
      missing: values.filter((slot) => slot.state === 'missing').length,
      errors: values.filter((slot) => slot.state === 'error').length,
      disposed
    });
  }

  function dispose() {
    disposed = true;

    for (const slot of slots.values()) {
      if (!slot.image) continue;
      slot.image.onload = null;
      slot.image.onerror = null;
    }

    slots.clear();
  }

  return Object.freeze({
    load,
    get,
    state,
    status,
    dispose
  });
}
