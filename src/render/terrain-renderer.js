import { listTerrainAssets } from '../assets/asset-adapter.js';

function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

export function terrainVariantIndex(tileX, tileY, variantCount) {
  if (!Number.isInteger(variantCount) || variantCount <= 0) return -1;
  const hash = tileX * 73856093 ^ tileY * 19349663;
  return positiveModulo(hash, variantCount);
}

export function createTerrainRenderer({
  biome = 'forest',
  tileSize = 320
} = {}) {
  const assets = listTerrainAssets({ biome });
  let slots = [];
  let disposed = false;

  function load() {
    if (disposed || slots.length > 0) return;

    slots = assets.map((asset) => {
      const image = new Image();
      const slot = {
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
      return slot;
    });
  }

  function draw(ctx, { camera, viewport, world }) {
    ctx.fillStyle = '#426f3a';
    ctx.fillRect(0, 0, viewport.width, viewport.height);

    if (disposed || slots.length === 0) return;

    const minTileX = Math.floor(camera.x / tileSize);
    const minTileY = Math.floor(camera.y / tileSize);
    const maxTileX = Math.ceil((camera.x + viewport.width) / tileSize);
    const maxTileY = Math.ceil((camera.y + viewport.height) / tileSize);

    for (let tileY = minTileY; tileY <= maxTileY; tileY += 1) {
      for (let tileX = minTileX; tileX <= maxTileX; tileX += 1) {
        const worldX = tileX * tileSize;
        const worldY = tileY * tileSize;

        if (
          worldX >= world.width ||
          worldY >= world.height ||
          worldX + tileSize <= 0 ||
          worldY + tileSize <= 0
        ) {
          continue;
        }

        const index = terrainVariantIndex(tileX, tileY, slots.length);
        const slot = slots[index];

        if (!slot || slot.state !== 'ready') continue;

        const screenX = worldX - camera.x;
        const screenY = worldY - camera.y;
        const drawWidth = Math.min(tileSize + 1, world.width - worldX);
        const drawHeight = Math.min(tileSize + 1, world.height - worldY);

        if (drawWidth <= 0 || drawHeight <= 0) continue;

        ctx.drawImage(
          slot.image,
          screenX,
          screenY,
          drawWidth,
          drawHeight
        );
      }
    }
  }

  function status() {
    return {
      biome,
      total: slots.length,
      ready: slots.filter((slot) => slot.state === 'ready').length,
      errors: slots.filter((slot) => slot.state === 'error').length,
      disposed
    };
  }

  function dispose() {
    disposed = true;
    for (const slot of slots) {
      slot.image.onload = null;
      slot.image.onerror = null;
    }
    slots = [];
  }

  return Object.freeze({
    load,
    draw,
    status,
    dispose
  });
}
