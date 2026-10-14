// Shared screen-space terrain raster compositor for Builder and Exploration runtime.
// Render-only memoization; WorldSurface and the Surface Renderer remain authoritative.
function lists(surface) {
  return {
    zones: Array.isArray(surface?.zones) ? surface.zones : [],
    routes: Array.isArray(surface?.routes) ? surface.routes : [],
    rivers: Array.isArray(surface?.rivers) ? surface.rivers : []
  };
}

function slice(source, zones, routes, rivers) {
  return {
    baseMaterialId: source.baseMaterialId,
    zones, routes, rivers
  };
}

export function partitionActiveSurface(surface, active) {
  if (!active || !surface) return null;
  const { zones, routes, rivers } = lists(surface);
  const map = { terrain: 'zones', route: 'routes', river: 'rivers' };
  const property = map[active.kind];
  const items = property && { zones, routes, rivers }[property];
  const index = items?.findIndex(item => item.id === active.id) ?? -1;
  if (index < 0) return null;
  const none = [];
  if (property === 'zones') return {
    before: slice(surface, zones.slice(0, index), none, none),
    active: slice(surface, [zones[index]], none, none),
    after: slice(surface, zones.slice(index + 1), routes, rivers)
  };
  if (property === 'routes') return {
    before: slice(surface, zones, routes.slice(0, index), none),
    active: slice(surface, none, [routes[index]], none),
    after: slice(surface, none, routes.slice(index + 1), rivers)
  };
  return {
    before: slice(surface, zones, routes, rivers.slice(0, index)),
    active: slice(surface, none, none, [rivers[index]]),
    after: slice(surface, none, none, rivers.slice(index + 1))
  };
}

function hasLayers(surface) {
  return surface.zones.length + surface.routes.length + surface.rivers.length > 0;
}

function createCanvas(width, height) {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

export function createTerrainRasterCompositor({ canvasFactory = createCanvas } = {}) {
  const cache = { full: null, before: null, after: null };
  let ownerRenderer = null;

  function clear() {
    cache.full = null;
    cache.before = null;
    cache.after = null;
  }

  function prepare(slot, key, args, layer, includeBase) {
    const { renderer, areaKey, camera, zoom, dpr, canvasWidth, canvasHeight, areaClip } = args;
    const density = Math.min(1, Math.max(0.25, dpr));
    const padding = Math.min(180, Math.max(32, Math.floor(Math.min(canvasWidth, canvasHeight) * 0.2)));
    const screenWidth = canvasWidth + padding * 2;
    const screenHeight = canvasHeight + padding * 2;
    const pixelWidth = Math.ceil(screenWidth * density);
    const pixelHeight = Math.ceil(screenHeight * density);
    const old = cache[slot];
    // Reuse the same raster when a pan remains within its transparent overscan.
    if (old && old.key === key && old.areaKey === areaKey &&
        old.zoom === zoom && old.dpr === density &&
        old.canvasWidth === canvasWidth && old.canvasHeight === canvasHeight &&
        old.pixelWidth === pixelWidth && old.pixelHeight === pixelHeight &&
        (camera.x - old.camera.x) * zoom >= -0.001 &&
        (camera.y - old.camera.y) * zoom >= -0.001 &&
        (camera.x - old.camera.x) * zoom + canvasWidth <= screenWidth + 0.001 &&
        (camera.y - old.camera.y) * zoom + canvasHeight <= screenHeight + 0.001) {
      return old;
    }

    const canvas = old?.canvas ?? canvasFactory(pixelWidth, pixelHeight);
    if (!canvas) return null;
    if (canvas.width !== pixelWidth) canvas.width = pixelWidth;
    if (canvas.height !== pixelHeight) canvas.height = pixelHeight;
    const layerCtx = canvas.getContext?.('2d');
    if (!layerCtx) return null;

    const rasterCamera = {
      x: camera.x - padding / zoom,
      y: camera.y - padding / zoom
    };
    const rasterViewport = {
      width: screenWidth / zoom,
      height: screenHeight / zoom
    };
    layerCtx.setTransform(1, 0, 0, 1, 0, 0);
    layerCtx.clearRect(0, 0, pixelWidth, pixelHeight);
    layerCtx.setTransform(zoom * density, 0, 0, zoom * density, 0, 0);
    layerCtx.save();
    try {
      areaClip?.(layerCtx, rasterCamera);
      renderer.draw(layerCtx, {
        camera: rasterCamera,
        viewport: rasterViewport,
        surface: layer,
        includeBase
      });
    } finally {
      layerCtx.restore();
      layerCtx.setTransform(1, 0, 0, 1, 0, 0);
    }
    const entry = {
      key,areaKey,canvas,camera:rasterCamera,zoom,dpr:density,
      canvasWidth,canvasHeight,pixelWidth,pixelHeight
    };
    cache[slot] = entry;
    return entry;
  }

  function blit(ctx,entry,{camera,zoom,dpr,canvasWidth,canvasHeight}) {
    if (!entry) return;
    const sourceX = Math.max(0, (camera.x - entry.camera.x) * zoom * entry.dpr);
    const sourceY = Math.max(0, (camera.y - entry.camera.y) * zoom * entry.dpr);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(entry.canvas,
      sourceX, sourceY, canvasWidth * entry.dpr, canvasHeight * entry.dpr,
      0, 0, Math.floor(canvasWidth * dpr), Math.floor(canvasHeight * dpr));
    ctx.restore();
  }

  function draw(args) {
    const { ctx, renderer, surface, camera, viewport, active, surfaceKey, areaKey } = args;
    if (ownerRenderer !== renderer) {
      clear();
      ownerRenderer = renderer;
    }
    const layers = partitionActiveSurface(surface, active);
    if (!layers) {
      const full = prepare('full', 'full:' + surfaceKey, args, surface, true);
      if (!full) {
        renderer.draw(ctx, {camera,viewport,surface});
        return;
      }
      blit(ctx,full,args);
      return;
    }
    const key = 'live:' + active.kind + ':' + active.id;
    const before = prepare('before',key,args,layers.before,true);
    // Static trailing roads/rivers are cached separately so the active stroke
    // stays underneath them in the same canonical paint order.
    const after = hasLayers(layers.after)
      ? prepare('after',key,args,layers.after,false)
      : null;
    if (!before) {
      renderer.draw(ctx,{camera,viewport,surface});
      return;
    }
    blit(ctx,before,args);
    renderer.draw(ctx,{
      camera,viewport,surface:layers.active,includeBase:false
    });
    if (after) blit(ctx,after,args);
  }

  return Object.freeze({ draw, clear });
}
