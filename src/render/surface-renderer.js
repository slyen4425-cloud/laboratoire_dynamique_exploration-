function smoothPath(ctx, points) {
  if (!points || points.length < 2) return;

  const first = points[0];
  ctx.moveTo(first.x, first.y);

  if (points.length === 2) {
    const last = points[1];
    ctx.lineTo(last.x, last.y);
    return;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2;
    const midY = (current.y + next.y) / 2;

    ctx.quadraticCurveTo(
      current.x,
      current.y,
      midX,
      midY
    );
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];

  ctx.quadraticCurveTo(
    penultimate.x,
    penultimate.y,
    last.x,
    last.y
  );
}

function strokePath(ctx, item, width, strokeStyle, alpha = 1) {
  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, item.points);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = strokeStyle;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
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

function drawSurfaceDecals(ctx, camera, viewport, material, textureStore) {
  const decalIds = material.assets.decals;
  const spacing = material.render.decalSpacing;

  if (
    !Array.isArray(decalIds) ||
    decalIds.length === 0 ||
    !Number.isFinite(spacing) ||
    spacing <= 0
  ) {
    return;
  }

  const minX = Math.floor(camera.x / spacing) - 1;
  const minY = Math.floor(camera.y / spacing) - 1;
  const maxX = Math.ceil((camera.x + viewport.width) / spacing) + 1;
  const maxY = Math.ceil((camera.y + viewport.height) / spacing) + 1;

  for (let cellY = minY; cellY <= maxY; cellY += 1) {
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      const selector = hash2D(cellX, cellY, 67);
      const decalId = decalIds[selector % decalIds.length];
      const image = textureStore.getImage(decalId);
      if (!image) continue;

      const jitterX =
        (unit(hash2D(cellX, cellY, 71)) - 0.5) * spacing * 0.66;
      const jitterY =
        (unit(hash2D(cellX, cellY, 73)) - 0.5) * spacing * 0.66;
      const minSize = material.render.decalMinSize;
      const maxSize = material.render.decalMaxSize;
      const size =
        minSize +
        unit(hash2D(cellX, cellY, 79)) * Math.max(0, maxSize - minSize);
      const rotation =
        unit(hash2D(cellX, cellY, 83)) * Math.PI * 2;
      const x = cellX * spacing + spacing / 2 + jitterX;
      const y = cellY * spacing + spacing / 2 + jitterY;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.globalAlpha = material.render.decalOpacity;
      ctx.drawImage(image, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

function drawSurfaceMaterial(
  ctx,
  camera,
  viewport,
  material,
  textureStore
) {
  const render = material.render;
  const pattern = material.assets.base
    ? textureStore.getPattern(ctx, material.assets.base)
    : null;

  ctx.fillStyle = pattern ?? render.baseColor;
  ctx.fillRect(camera.x, camera.y, viewport.width, viewport.height);

  const spacing = render.detailSpacing;
  const variationColors = render.variationColors;

  if (
    Number.isFinite(spacing) &&
    spacing > 0 &&
    Array.isArray(variationColors) &&
    variationColors.length > 0
  ) {
    const minX = Math.floor(camera.x / spacing) - 1;
    const minY = Math.floor(camera.y / spacing) - 1;
    const maxX = Math.ceil((camera.x + viewport.width) / spacing) + 1;
    const maxY = Math.ceil((camera.y + viewport.height) / spacing) + 1;

    for (let cellY = minY; cellY <= maxY; cellY += 1) {
      for (let cellX = minX; cellX <= maxX; cellX += 1) {
        const hash = hash2D(cellX, cellY);
        const jitterX = ((hash & 255) / 255 - 0.5) * spacing * 0.58;
        const jitterY =
          (((hash >>> 8) & 255) / 255 - 0.5) * spacing * 0.58;
        const x = cellX * spacing + spacing / 2 + jitterX;
        const y = cellY * spacing + spacing / 2 + jitterY;
        const radius =
          spacing * (0.56 + (((hash >>> 16) & 63) / 63) * 0.2);
        const variation =
          variationColors[(hash >>> 22) % variationColors.length];

        const gradient = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          radius
        );
        gradient.addColorStop(0, variation);
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          x - radius,
          y - radius,
          radius * 2,
          radius * 2
        );
      }
    }
  }

  drawSurfaceDecals(ctx, camera, viewport, material, textureStore);
}

function drawPathMaterial(ctx, path, material, textureStore) {
  const render = material.render;
  const centerPattern = material.assets.center
    ? textureStore.getPattern(ctx, material.assets.center)
    : null;

  strokePath(
    ctx,
    path,
    path.width + render.outerEdgePadding,
    render.outerEdgeColor
  );
  strokePath(
    ctx,
    path,
    path.width + render.innerEdgePadding,
    render.innerEdgeColor
  );
  strokePath(
    ctx,
    path,
    path.width,
    centerPattern ?? render.centerColor
  );
  strokePath(
    ctx,
    path,
    Math.max(2, path.width * render.highlightRatio),
    render.highlightColor,
    render.highlightOpacity
  );
}

function drawWaterMaterial(ctx, river, material, textureStore) {
  const render = material.render;
  const centerPattern = material.assets.center
    ? textureStore.getPattern(ctx, material.assets.center)
    : null;

  strokePath(
    ctx,
    river,
    river.width + render.outerBankPadding,
    render.outerBankColor
  );
  strokePath(
    ctx,
    river,
    river.width + render.innerBankPadding,
    render.innerBankColor
  );
  strokePath(
    ctx,
    river,
    river.width,
    centerPattern ?? render.waterColor
  );
  strokePath(
    ctx,
    river,
    Math.max(3, river.width * render.highlightRatio),
    render.highlightColor,
    render.highlightOpacity
  );
}

export function createSurfaceRenderer({
  materialRegistry,
  textureStore
}) {
  if (!materialRegistry) {
    throw new Error('Surface Renderer requires a Material Registry');
  }

  if (!textureStore) {
    throw new Error('Surface Renderer requires a Material Texture Store');
  }

  return Object.freeze({
    draw(ctx, { camera, viewport, surface }) {
      ctx.save();
      ctx.translate(-camera.x, -camera.y);

      const baseMaterial = materialRegistry.require(
        surface.baseMaterialId,
        'surface'
      );

      drawSurfaceMaterial(
        ctx,
        camera,
        viewport,
        baseMaterial,
        textureStore
      );

      for (const road of surface.routes) {
        const material = materialRegistry.require(road.materialId, 'path');
        drawPathMaterial(ctx, road, material, textureStore);
      }

      for (const river of surface.rivers) {
        const material = materialRegistry.require(river.materialId, 'water');
        drawWaterMaterial(ctx, river, material, textureStore);
      }

      ctx.restore();
    }
  });
}
