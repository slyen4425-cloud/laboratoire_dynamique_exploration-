import {
  buildRibbonSegments,
  ribbonTextureSlices
} from './path-ribbon.js';
import {
  linearFeatherMaskPlan,
  surfaceFeatherMaskPlan,
  surfaceFeatherPasses
} from './surface-feather.js';

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

function defaultCanvasFactory(width, height) {
  const safeWidth = Math.max(1, Math.ceil(width));
  const safeHeight = Math.max(1, Math.ceil(height));

  if (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  ) {
    const canvas = document.createElement('canvas');
    canvas.width = safeWidth;
    canvas.height = safeHeight;
    return canvas;
  }

  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(
      safeWidth,
      safeHeight
    );
  }

  return null;
}

function prepareScratchBuffer(
  canvasFactory,
  current,
  viewport
) {
  if (typeof canvasFactory !== 'function') {
    return null;
  }

  const width = Math.max(
    1,
    Math.ceil(viewport.width)
  );
  const height = Math.max(
    1,
    Math.ceil(viewport.height)
  );
  const canvas =
    current ?? canvasFactory(width, height);

  if (!canvas) return null;

  if (canvas.width !== width) {
    canvas.width = width;
  }
  if (canvas.height !== height) {
    canvas.height = height;
  }

  const context =
    canvas.getContext?.('2d');

  if (!context) return null;

  return {
    canvas,
    context
  };
}

function strokeMaskPath(
  ctx,
  item,
  camera,
  width,
  alpha = 1
) {
  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, item.points, camera);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = '#ffffff';
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
}

function drawSmoothMaskedLayer(
  ctx,
  item,
  camera,
  viewport,
  transition,
  scratch,
  outerWidth,
  drawLayer
) {
  const plan = surfaceFeatherMaskPlan(
    outerWidth,
    transition
  );

  if (
    !plan ||
    !scratch?.mask?.context ||
    !scratch?.zone?.context ||
    typeof ctx.drawImage !== 'function' ||
    typeof drawLayer !== 'function'
  ) {
    return false;
  }

  const maskCtx = scratch.mask.context;
  const layerCtx = scratch.zone.context;

  if (!('filter' in maskCtx)) {
    return false;
  }

  maskCtx.globalCompositeOperation =
    'source-over';
  maskCtx.globalAlpha = 1;
  maskCtx.filter = 'none';
  maskCtx.clearRect(
    0,
    0,
    viewport.width,
    viewport.height
  );

  if (plan.edgeOpacity > 0) {
    strokeMaskPath(
      maskCtx,
      item,
      camera,
      plan.outerWidth,
      plan.edgeOpacity
    );
  }

  if (
    plan.blurRadius > 0 &&
    plan.innerWidth < plan.outerWidth
  ) {
    maskCtx.filter =
      `blur(${plan.blurRadius}px)`;
    strokeMaskPath(
      maskCtx,
      item,
      camera,
      plan.innerWidth,
      1
    );
    maskCtx.filter = 'none';
  }

  strokeMaskPath(
    maskCtx,
    item,
    camera,
    plan.innerWidth,
    1
  );

  // Blur is visual only. It is always clipped back to the
  // caller's existing visual envelope.
  maskCtx.globalCompositeOperation =
    'destination-in';
  strokeMaskPath(
    maskCtx,
    item,
    camera,
    plan.outerWidth,
    1
  );
  maskCtx.globalCompositeOperation =
    'source-over';
  maskCtx.filter = 'none';
  maskCtx.globalAlpha = 1;

  layerCtx.globalCompositeOperation =
    'source-over';
  layerCtx.globalAlpha = 1;
  if ('filter' in layerCtx) {
    layerCtx.filter = 'none';
  }
  layerCtx.clearRect(
    0,
    0,
    viewport.width,
    viewport.height
  );

  drawLayer(layerCtx);

  layerCtx.globalCompositeOperation =
    'destination-in';
  layerCtx.drawImage(
    scratch.mask.canvas,
    0,
    0,
    viewport.width,
    viewport.height
  );
  layerCtx.globalCompositeOperation =
    'source-over';

  ctx.drawImage(
    scratch.zone.canvas,
    0,
    0,
    viewport.width,
    viewport.height
  );

  return true;
}

function drawSurfaceZoneSmoothMask(
  ctx,
  zone,
  camera,
  viewport,
  material,
  textureLoader,
  transition,
  scratch
) {
  return drawSmoothMaskedLayer(
    ctx,
    zone,
    camera,
    viewport,
    transition,
    scratch,
    zone.width,
    (layerCtx) => {
      const image =
        textureLoader?.get(material.assets.base);
      const pattern =
        worldPattern(layerCtx, image, camera);

      layerCtx.fillStyle =
        pattern ?? material.render.baseColor;
      layerCtx.fillRect(
        0,
        0,
        viewport.width,
        viewport.height
      );
    }
  );
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

export function terrainDecalDescriptor(
  cellX,
  cellY,
  assetCount,
  density = 0.42
) {
  if (!Number.isInteger(assetCount) || assetCount <= 0) return null;

  const safeDensity =
    Number.isFinite(density)
      ? Math.max(0, Math.min(1, density))
      : 0.42;

  if (unit(hash2D(cellX, cellY, 61)) > safeDensity) return null;

  return Object.freeze({
    assetIndex: hash2D(cellX, cellY, 67) % assetCount,
    jitterX: unit(hash2D(cellX, cellY, 71)) - 0.5,
    jitterY: unit(hash2D(cellX, cellY, 73)) - 0.5,
    sizeT: unit(hash2D(cellX, cellY, 79)),
    rotation: unit(hash2D(cellX, cellY, 83)) * Math.PI * 2,
    opacityT: 0.72 + unit(hash2D(cellX, cellY, 89)) * 0.28
  });
}

function worldPattern(ctx, image, camera) {
  if (!image) return null;

  const pattern = ctx.createPattern(image, 'repeat');
  if (!pattern) return null;

  if (
    typeof pattern.setTransform === 'function' &&
    typeof DOMMatrix !== 'undefined'
  ) {
    pattern.setTransform(
      new DOMMatrix().translate(-camera.x, -camera.y)
    );
  }

  return pattern;
}

function drawTexturedRibbon(
  ctx,
  item,
  camera,
  image,
  ribbonWidth,
  opacity = 1
) {
  if (!image || !Number.isFinite(ribbonWidth) || ribbonWidth <= 0) {
    return false;
  }

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) return false;

  const segments = buildRibbonSegments(item.points, 16);

  for (const segment of segments) {
    const slices = ribbonTextureSlices({
      distanceStart: segment.distanceStart,
      segmentLength: segment.length,
      sourceWidth,
      sourceHeight,
      ribbonWidth
    });

    ctx.save();
    ctx.translate(segment.x - camera.x, segment.y - camera.y);
    ctx.rotate(segment.angle);
    ctx.globalAlpha = opacity;

    for (const slice of slices) {
      const overlap = 0.8;

      ctx.drawImage(
        image,
        slice.sourceX,
        0,
        slice.sourceWidth,
        sourceHeight,
        -segment.length / 2 + slice.destOffset - overlap / 2,
        -ribbonWidth / 2,
        slice.destWidth + overlap,
        ribbonWidth
      );
    }

    ctx.restore();
  }

  return segments.length > 0;
}

function drawSurfaceFallback(ctx, camera, viewport, material) {
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
      const variation =
        variationColors[(hash >>> 22) % variationColors.length];

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, variation);
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
}

function drawSurfaceMaterial(
  ctx,
  camera,
  viewport,
  material,
  textureLoader
) {
  const image = textureLoader?.get(material.assets.base);
  const pattern = worldPattern(ctx, image, camera);

  if (!pattern) {
    drawSurfaceFallback(ctx, camera, viewport, material);
    return;
  }

  ctx.save();
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
  ctx.restore();
}

function drawSurfaceDecals(
  ctx,
  camera,
  viewport,
  material,
  textureLoader
) {
  const ids = Array.isArray(material.assets.decals)
    ? material.assets.decals
    : [];

  const render = material.render;
  const spacing = render.decalSpacing;

  if (
    ids.length === 0 ||
    !Number.isFinite(spacing) ||
    spacing <= 0
  ) {
    return;
  }

  const minSize = Number.isFinite(render.decalMinSize)
    ? render.decalMinSize
    : 48;
  const maxSize = Number.isFinite(render.decalMaxSize)
    ? Math.max(minSize, render.decalMaxSize)
    : minSize;
  const opacity = Number.isFinite(render.decalOpacity)
    ? Math.max(0, Math.min(1, render.decalOpacity))
    : 0.36;

  const minX = Math.floor(camera.x / spacing) - 1;
  const minY = Math.floor(camera.y / spacing) - 1;
  const maxX = Math.ceil((camera.x + viewport.width) / spacing) + 1;
  const maxY = Math.ceil((camera.y + viewport.height) / spacing) + 1;

  for (let cellY = minY; cellY <= maxY; cellY += 1) {
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      const descriptor = terrainDecalDescriptor(
        cellX,
        cellY,
        ids.length,
        render.decalDensity
      );

      if (!descriptor) continue;

      const image = textureLoader?.get(ids[descriptor.assetIndex]);
      if (!image) continue;

      const x =
        cellX * spacing +
        spacing / 2 +
        descriptor.jitterX * spacing * 0.72 -
        camera.x;
      const y =
        cellY * spacing +
        spacing / 2 +
        descriptor.jitterY * spacing * 0.72 -
        camera.y;
      const size =
        minSize + (maxSize - minSize) * descriptor.sizeT;

      if (
        x + size < 0 ||
        y + size < 0 ||
        x - size > viewport.width ||
        y - size > viewport.height
      ) {
        continue;
      }

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(descriptor.rotation);
      ctx.globalAlpha = opacity * descriptor.opacityT;
      ctx.drawImage(image, -size / 2, -size / 2, size, size);
      ctx.restore();
    }
  }
}

function drawSurfaceZoneMaterial(
  ctx,
  zone,
  camera,
  viewport,
  material,
  textureLoader,
  transition,
  scratch
) {
  if (
    transition?.method === 'smooth-mask' &&
    drawSurfaceZoneSmoothMask(
      ctx,
      zone,
      camera,
      viewport,
      material,
      textureLoader,
      transition,
      scratch
    )
  ) {
    return;
  }

  const image = textureLoader?.get(material.assets.base);
  const pattern = worldPattern(ctx, image, camera);
  const strokeStyle =
    pattern ?? material.render.baseColor;

  for (
    const pass of surfaceFeatherPasses(
      zone.width,
      transition
    )
  ) {
    strokePath(
      ctx,
      zone,
      camera,
      pass.width,
      strokeStyle,
      pass.alpha
    );
  }
}

function drawPathMaterialRaw(ctx, path, camera, material, textureLoader) {
  const render = material.render;
  const edgeImage = textureLoader?.get(material.assets.edge);
  const centerImage = textureLoader?.get(material.assets.center);
  const centerPattern = worldPattern(ctx, centerImage, camera);

  const hasTexturedEdge = drawTexturedRibbon(
    ctx,
    path,
    camera,
    edgeImage,
    path.width + render.outerEdgePadding
  );

  if (!hasTexturedEdge) {
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
  }

  strokePath(
    ctx,
    path,
    camera,
    path.width,
    centerPattern ?? render.centerColor
  );
  strokePath(
    ctx,
    path,
    camera,
    Math.max(2, path.width * render.highlightRatio),
    render.highlightColor,
    render.highlightOpacity
  );
}

function drawWaterMaterialRaw(ctx, river, camera, material, textureLoader) {
  const render = material.render;
  const bankImage = textureLoader?.get(material.assets.bank);
  const centerImage = textureLoader?.get(material.assets.center);
  const centerPattern = worldPattern(ctx, centerImage, camera);

  const hasTexturedBank = drawTexturedRibbon(
    ctx,
    river,
    camera,
    bankImage,
    river.width + render.outerBankPadding
  );

  if (!hasTexturedBank) {
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
  }

  strokePath(
    ctx,
    river,
    camera,
    river.width,
    centerPattern ?? render.waterColor
  );
  strokePath(
    ctx,
    river,
    camera,
    Math.max(3, river.width * render.highlightRatio),
    render.highlightColor,
    render.highlightOpacity
  );
}

function drawPathMaterial(
  ctx,
  path,
  camera,
  viewport,
  material,
  textureLoader,
  transition,
  scratch
) {
  const outerWidth =
    path.width +
    material.render.outerEdgePadding;

  if (
    transition?.method === 'smooth-mask' &&
    drawSmoothMaskedLayer(
      ctx,
      path,
      camera,
      viewport,
      transition,
      scratch,
      outerWidth,
      (layerCtx) => {
        drawPathMaterialRaw(
          layerCtx,
          path,
          camera,
          material,
          textureLoader
        );
      }
    )
  ) {
    return;
  }

  drawPathMaterialRaw(
    ctx,
    path,
    camera,
    material,
    textureLoader
  );
}

function drawWaterMaterial(
  ctx,
  river,
  camera,
  viewport,
  material,
  textureLoader,
  transition,
  scratch
) {
  const outerWidth =
    river.width +
    material.render.outerBankPadding;

  if (
    transition?.method === 'smooth-mask' &&
    drawSmoothMaskedLayer(
      ctx,
      river,
      camera,
      viewport,
      transition,
      scratch,
      outerWidth,
      (layerCtx) => {
        drawWaterMaterialRaw(
          layerCtx,
          river,
          camera,
          material,
          textureLoader
        );
      }
    )
  ) {
    return;
  }

  drawWaterMaterialRaw(
    ctx,
    river,
    camera,
    material,
    textureLoader
  );
}

export function createSurfaceRenderer({
  materialRegistry,
  textureLoader = null,
  canvasFactory = defaultCanvasFactory
}) {
  if (!materialRegistry) {
    throw new Error('Surface Renderer requires a Material Registry');
  }

  let maskCanvas = null;
  let zoneCanvas = null;

  function scratchBuffers(viewport) {
    if (
      materialRegistry.surfaceTransition?.method !==
      'smooth-mask'
    ) {
      return null;
    }

    const mask = prepareScratchBuffer(
      canvasFactory,
      maskCanvas,
      viewport
    );
    if (!mask) return null;
    maskCanvas = mask.canvas;

    const zone = prepareScratchBuffer(
      canvasFactory,
      zoneCanvas,
      viewport
    );
    if (!zone) return null;
    zoneCanvas = zone.canvas;

    return {
      mask,
      zone
    };
  }

  return Object.freeze({
    draw(ctx, { camera, viewport, surface }) {
      const scratch = scratchBuffers(viewport);
      const baseMaterial = materialRegistry.require(
        surface.baseMaterialId,
        'surface'
      );

      drawSurfaceMaterial(
        ctx,
        camera,
        viewport,
        baseMaterial,
        textureLoader
      );

      drawSurfaceDecals(
        ctx,
        camera,
        viewport,
        baseMaterial,
        textureLoader
      );

      for (const zone of surface.zones ?? []) {
        const material = materialRegistry.require(
          zone.materialId,
          'surface'
        );
        drawSurfaceZoneMaterial(
          ctx,
          zone,
          camera,
          viewport,
          material,
          textureLoader,
          materialRegistry.surfaceTransition,
          scratch
        );
      }

      for (const road of surface.routes) {
        const material = materialRegistry.require(road.materialId, 'path');
        drawPathMaterial(
          ctx,
          road,
          camera,
          viewport,
          material,
          textureLoader,
          materialRegistry.surfaceTransition,
          scratch
        );
      }

      for (const river of surface.rivers) {
        const material = materialRegistry.require(river.materialId, 'water');
        drawWaterMaterial(
          ctx,
          river,
          camera,
          viewport,
          material,
          textureLoader,
          materialRegistry.surfaceTransition,
          scratch
        );
      }
    }
  });
}
