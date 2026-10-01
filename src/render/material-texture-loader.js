function collectStrings(value, target) {
  if (typeof value === 'string') {
    if (value.trim()) target.add(value.trim());
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, target);
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const entry of Object.values(value)) {
    collectStrings(entry, target);
  }
}

export function collectMaterialAssetIds(materials) {
  const ids = new Set();

  for (const material of Array.isArray(materials) ? materials : []) {
    collectStrings(material?.assets, ids);
  }

  return Object.freeze([...ids]);
}

export function createMaterialTextureLoader({
  resolveAsset,
  imageFactory = () => new Image()
}) {
  if (typeof resolveAsset !== 'function') {
    throw new Error('Material Texture Loader requires resolveAsset');
  }

  const slots = new Map();
  let disposed = false;

  function load(assetIds) {
    if (disposed) return;

    for (const assetId of assetIds) {
      if (slots.has(assetId)) continue;

      const asset = resolveAsset(assetId);
      if (!asset) {
        slots.set(assetId, Object.freeze({
          assetId,
          asset: null,
          image: null,
          state: 'missing'
        }));
        continue;
      }

      const image = imageFactory();
      const slot = {
        assetId,
        asset,
        image,
        state: 'loading'
      };

      image.onload = () => {
        if (!disposed) slot.state = 'ready';
      };

      image.onerror = () => {
        if (!disposed) slot.state = 'error';
      };

      image.src = asset.path;
      slots.set(assetId, slot);
    }
  }

  function get(assetId) {
    const slot = slots.get(assetId);
    return slot?.state === 'ready' ? slot.image : null;
  }

  function status() {
    const values = [...slots.values()];
    return {
      total: values.length,
      ready: values.filter((slot) => slot.state === 'ready').length,
      loading: values.filter((slot) => slot.state === 'loading').length,
      missing: values.filter((slot) => slot.state === 'missing').length,
      errors: values.filter((slot) => slot.state === 'error').length,
      disposed
    };
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
    status,
    dispose
  });
}
