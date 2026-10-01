export function createMaterialTextureStore({ assetAdapter }) {
  if (!assetAdapter || typeof assetAdapter.resolve !== 'function') {
    throw new Error('Material Texture Store requires an asset adapter');
  }

  const slots = new Map();
  let disposed = false;

  function load(assetIds) {
    if (disposed || !Array.isArray(assetIds)) return;

    for (const assetId of assetIds) {
      if (slots.has(assetId)) continue;

      const asset = assetAdapter.resolve(assetId);
      if (!asset) continue;

      const image = new Image();
      const slot = { asset, image, state: 'loading' };
      slots.set(assetId, slot);

      image.onload = () => {
        if (!disposed) slot.state = 'ready';
      };

      image.onerror = () => {
        if (!disposed) slot.state = 'error';
      };

      image.src = asset.path;
    }
  }

  function getImage(assetId) {
    const slot = slots.get(assetId);
    return slot?.state === 'ready' ? slot.image : null;
  }

  function getPattern(ctx, assetId) {
    const image = getImage(assetId);
    return image ? ctx.createPattern(image, 'repeat') : null;
  }

  function status() {
    const values = [...slots.values()];
    return Object.freeze({
      total: values.length,
      ready: values.filter((slot) => slot.state === 'ready').length,
      errors: values.filter((slot) => slot.state === 'error').length,
      disposed
    });
  }

  function dispose() {
    disposed = true;
    for (const slot of slots.values()) {
      slot.image.onload = null;
      slot.image.onerror = null;
    }
    slots.clear();
  }

  return Object.freeze({
    load,
    getImage,
    getPattern,
    status,
    dispose
  });
}
