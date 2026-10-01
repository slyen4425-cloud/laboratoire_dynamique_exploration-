import { listTerrainAssets } from '../assets/asset-adapter.js';

function positiveModulo(value, modulo) {
  return ((value % modulo) + modulo) % modulo;
}

function hash2D(x, y, salt = 0) {
  let hash = Math.imul(x + salt * 101, 0x45d9f3b);
  hash ^= Math.imul(y - salt * 53, 0x27d4eb2d);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function unit(hash) {
  return hash / 0xffffffff;
}

export function terrainVariantIndex(cellX, cellY, variantCount) {
  if (!Number.isInteger(variantCount) || variantCount <= 0) return -1;
  return positiveModulo(hash2D(cellX, cellY, 3), variantCount);
}

export function terrainPatchDescriptor(cellX, cellY, variantCount, spacing) {
  if (!Number.isInteger(variantCount) || variantCount <= 0) return null;

  const jitterRange = spacing * 0.58;

  return {
    variantIndex: terrainVariantIndex(cellX, cellY, variantCount),
    jitterX: (unit(hash2D(cellX, cellY, 7)) - 0.5) * jitterRange,
    jitterY: (unit(hash2D(cellX, cellY, 11)) - 0.5) * jitterRange,
    scale: 0.86 + unit(hash2D(cellX, cellY, 17)) * 0.32,
    rotation: (hash2D(cellX, cellY, 23) % 4) * (Math.PI / 2)
  };
}

function createFeatheredSurface(image) {
  const size = 256;
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  canvas.width = size;
  canvas.height = size;

  context.drawImage(image, 0, 0, size, size);
  context.globalCompositeOperation = 'destination-in';

  const horizontal = context.createLinearGradient(0, 0, size, 0);
  horizontal.addColorStop(0, 'rgba(0,0,0,0)');
  horizontal.addColorStop(0.17, 'rgba(0,0,0,1)');
  horizontal.addColorStop(0.83, 'rgba(0,0,0,1)');
  horizontal.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = horizontal;
  context.fillRect(0, 0, size, size);

  const vertical = context.createLinearGradient(0, 0, 0, size);
  vertical.addColorStop(0, 'rgba(0,0,0,0)');
  vertical.addColorStop(0.17, 'rgba(0,0,0,1)');
  vertical.addColorStop(0.83, 'rgba(0,0,0,1)');
  vertical.addColorStop(1, 'rgba(0,0,0,0)');
  context.fillStyle = vertical;
  context.fillRect(0, 0, size, size);

  context.globalCompositeOperation = 'source-over';
  return canvas;
}

function drawOrganicGround(ctx, {
  camera,
  viewport,
  detailSpacing
}) {
  ctx.fillStyle = '#4a3a28';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const palette = [
    [61, 83, 48],
    [75, 87, 51],
    [91, 69, 42],
    [66, 58, 38],
    [81, 76, 46]
  ];

  const minCellX = Math.floor(camera.x / detailSpacing) - 1;
  const minCellY = Math.floor(camera.y / detailSpacing) - 1;
  const maxCellX = Math.ceil((camera.x + viewport.width) / detailSpacing) + 1;
  const maxCellY = Math.ceil((camera.y + viewport.height) / detailSpacing) + 1;

  for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
    for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
      const jitterX =
        (unit(hash2D(cellX, cellY, 31)) - 0.5) * detailSpacing * 0.82;
      const jitterY =
        (unit(hash2D(cellX, cellY, 37)) - 0.5) * detailSpacing * 0.82;
      const centerX =
        cellX * detailSpacing + detailSpacing / 2 + jitterX - camera.x;
      const centerY =
        cellY * detailSpacing + detailSpacing / 2 + jitterY - camera.y;
      const radius =
        detailSpacing * (0.62 + unit(hash2D(cellX, cellY, 41)) * 0.36);
      const paletteIndex =
        positiveModulo(hash2D(cellX, cellY, 43), palette.length);
      const [r, g, b] = palette[paletteIndex];

      const gradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        radius
      );

      gradient.addColorStop(0, `rgba(${r},${g},${b},0.34)`);
      gradient.addColorStop(0.55, `rgba(${r},${g},${b},0.16)`);
      gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
      );
    }
  }
}

export function createTerrainRenderer({
  biome = 'forest',
  patchSize = 176,
  patchSpacing = 118,
  patchOpacity = 0.62,
  groundDetailSpacing = 180
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
        surface: null,
        state: 'loading'
      };

      image.onload = () => {
        if (disposed) return;
        slot.surface = createFeatheredSurface(image);
        slot.state = 'ready';
      };

      image.onerror = () => {
        if (!disposed) slot.state = 'error';
      };

      image.src = asset.path;
      return slot;
    });
  }

  function draw(ctx, { camera, viewport, world }) {
    drawOrganicGround(ctx, {
      camera,
      viewport,
      detailSpacing: groundDetailSpacing
    });

    if (disposed || slots.length === 0) return;

    const margin = patchSize * 0.75;
    const minCellX = Math.floor((camera.x - margin) / patchSpacing) - 1;
    const minCellY = Math.floor((camera.y - margin) / patchSpacing) - 1;
    const maxCellX =
      Math.ceil((camera.x + viewport.width + margin) / patchSpacing) + 1;
    const maxCellY =
      Math.ceil((camera.y + viewport.height + margin) / patchSpacing) + 1;

    for (let cellY = minCellY; cellY <= maxCellY; cellY += 1) {
      for (let cellX = minCellX; cellX <= maxCellX; cellX += 1) {
        const descriptor = terrainPatchDescriptor(
          cellX,
          cellY,
          slots.length,
          patchSpacing
        );

        if (!descriptor) continue;

        const slot = slots[descriptor.variantIndex];
        if (!slot || slot.state !== 'ready' || !slot.surface) continue;

        const centerWorldX =
          cellX * patchSpacing +
          patchSpacing / 2 +
          descriptor.jitterX;
        const centerWorldY =
          cellY * patchSpacing +
          patchSpacing / 2 +
          descriptor.jitterY;

        if (
          centerWorldX < -margin ||
          centerWorldY < -margin ||
          centerWorldX > world.width + margin ||
          centerWorldY > world.height + margin
        ) {
          continue;
        }

        const size = patchSize * descriptor.scale;
        const screenX = centerWorldX - camera.x;
        const screenY = centerWorldY - camera.y;

        if (
          screenX + size < 0 ||
          screenY + size < 0 ||
          screenX - size > viewport.width ||
          screenY - size > viewport.height
        ) {
          continue;
        }

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.rotate(descriptor.rotation);
        ctx.globalAlpha = patchOpacity;
        ctx.drawImage(slot.surface, -size / 2, -size / 2, size, size);
        ctx.restore();
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
      slot.surface = null;
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
