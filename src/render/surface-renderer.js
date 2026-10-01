function smoothPath(ctx, points, camera) {
  if (!points || points.length < 2) return;

  const first = points[0];
  ctx.moveTo(first.x - camera.x, first.y - camera.y);

  if (points.length === 2) {
    const last = points[1];
    ctx.lineTo(last.x - camera.x, last.y - camera.y);
    return;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2 - camera.x;
    const midY = (current.y + next.y) / 2 - camera.y;

    ctx.quadraticCurveTo(
      current.x - camera.x,
      current.y - camera.y,
      midX,
      midY
    );
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];

  ctx.quadraticCurveTo(
    penultimate.x - camera.x,
    penultimate.y - camera.y,
    last.x - camera.x,
    last.y - camera.y
  );
}

function strokePath(ctx, item, camera, width, strokeStyle, alpha = 1) {
  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, item.points, camera);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = strokeStyle;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
}

function hash2D(x, y) {
  let hash = Math.imul(x, 0x45d9f3b) ^ Math.imul(y, 0x27d4eb2d);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function drawSurfaceMaterial(ctx, camera, viewport, material) {
  const render = material.render;
  ctx.fillStyle = render.baseColor;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const spacing = render.detailSpacing;
  const variationColors = render.variationColors;

  if (
    !Number.isFinite(spacing) ||
    spacing <= 0 ||
    !Array.isArray(variationColors) ||
    variationColors.length === 0
  ) {
    return;
  }

  const minX = Math.floor(camera.x / spacing) - 1;
  const minY = Math.floor(camera.y / spacing) - 1;
  const maxX = Math.ceil((camera.x + viewport.width) / spacing) + 1;
  const maxY = Math.ceil((camera.y + viewport.height) / spacing) + 1;

  for (let cellY = minY; cellY <= maxY; cellY += 1) {
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      const hash = hash2D(cellX, cellY);
      const jitterX = ((hash & 255) / 255 - 0.5) * spacing * 0.58;
      const jitterY = (((hash >>> 8) & 255) / 255 - 0.5) * spacing * 0.58;
      const x = cellX * spacing + spacing / 2 + jitterX - camera.x;
      const y = cellY * spacing + spacing / 2 + jitterY - camera.y;
      const radius = spacing * (0.56 + (((hash >>> 16) & 63) / 63) * 0.2);
      const variation = variationColors[(hash >>> 22) % variationColors.length];

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, variation);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
}

function drawPathMaterial(ctx, path, camera, material) {
  const render = material.render;

  strokePath(
    ctx,
    path,
    camera,
    path.width + render.outerEdgePadding,
    render.outerEdgeColor
  );
  strokePath(
    ctx,
    path,
    camera,
    path.width + render.innerEdgePadding,
    render.innerEdgeColor
  );
  strokePath(ctx, path, camera, path.width, render.centerColor);
  strokePath(
    ctx,
    path,
    camera,
    Math.max(2, path.width * render.highlightRatio),
    render.highlightColor,
    render.highlightOpacity
  );
}

function drawWaterMaterial(ctx, river, camera, material) {
  const render = material.render;

  strokePath(
    ctx,
    river,
    camera,
    river.width + render.outerBankPadding,
    render.outerBankColor
  );
  strokePath(
    ctx,
    river,
    camera,
    river.width + render.innerBankPadding,
    render.innerBankColor
  );
  strokePath(ctx, river, camera, river.width, render.waterColor);
  strokePath(
    ctx,
    river,
    camera,
    Math.max(3, river.width * render.highlightRatio),
    render.highlightColor,
    render.highlightOpacity
  );
}

export function createSurfaceRenderer({ materialRegistry }) {
  if (!materialRegistry) {
    throw new Error('Surface Renderer requires a Material Registry');
  }

  return Object.freeze({
    draw(ctx, { camera, viewport, surface }) {
      const baseMaterial = materialRegistry.require(
        surface.baseMaterialId,
        'surface'
      );

      drawSurfaceMaterial(ctx, camera, viewport, baseMaterial);

      for (const road of surface.routes) {
        const material = materialRegistry.require(road.materialId, 'path');
        drawPathMaterial(ctx, road, camera, material);
      }

      for (const river of surface.rivers) {
        const material = materialRegistry.require(river.materialId, 'water');
        drawWaterMaterial(ctx, river, camera, material);
      }
    }
  });
}
