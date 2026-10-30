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
    const padding = Number.isFinite(args.overscanCssPx)
      ? Math.max(0, Math.min(320, Math.ceil(args.overscanCssPx)))
      : Math.min(180, Math.max(32, Math.floor(Math.min(canvasWidth, canvasHeight) * 0.2)));
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


// A retained tile atlas for Exploration. Unlike a single full-viewport raster,
// a camera crossing the guard band never triggers a synchronous redraw of the
// whole map. Only a bounded number of WorldSurface tiles are baked per frame.
// WorldSurface geometry, render order and the SurfaceRenderer remain unchanged.
export function createTerrainTileCache({
  canvasFactory = createCanvas,
  tileSize = 384,
  bleed = 128,
  maxTiles = 48,
  maxNewTilesPerFrame = 2
} = {}) {
  const tile = Math.max(128, Math.min(512, Math.round(tileSize)));
  const edge = Math.max(16, Math.min(192, Math.round(bleed)));
  const capacity = Math.max(8, Math.floor(maxTiles));
  const limit = Math.max(1, Math.floor(maxNewTilesPerFrame));
  const saved = new Map();
  let ownerRenderer = null;
  let ownerSurface = null;
  let ownerArea = null;

  function clear() {
    saved.clear();
    ownerRenderer = null;
    ownerSurface = null;
    ownerArea = null;
  }

  function tileKey(column, row) {
    return column + ',' + row;
  }

  function createTile(args, column, row) {
    const {renderer, surface, areaClip} = args;
    const dimension = tile + 2 * edge;
    const canvas = canvasFactory(dimension, dimension);
    const tileCtx = canvas?.getContext?.('2d');
    if (!tileCtx) return null;
    const camera = {
      x: column * tile - edge,
      y: row * tile - edge
    };
    const viewport = {width: dimension, height: dimension};
    tileCtx.setTransform(1, 0, 0, 1, 0, 0);
    tileCtx.clearRect(0, 0, dimension, dimension);
    tileCtx.save();
    try {
      areaClip?.(tileCtx, camera);
      renderer.draw(tileCtx, {camera, viewport, surface});
    } finally {
      tileCtx.restore();
    }
    return {canvas, column, row};
  }

  function touch(key) {
    const value = saved.get(key);
    if (!value) return null;
    saved.delete(key);
    saved.set(key, value);
    return value;
  }

  function draw(args) {
    const {ctx, renderer, surface, camera, viewport, areaKey, surfaceKey} = args;
    if (ownerRenderer !== renderer || ownerSurface !== surfaceKey ||
      ownerArea !== areaKey) {
      saved.clear();
      ownerRenderer = renderer;
      ownerSurface = surfaceKey;
      ownerArea = areaKey;
    }
    // Runtime currently renders in world-unit CSS pixels (zoom=1).
    // Tiles are world anchored, so camera motion only changes crop position.
    const zoom = Number.isFinite(args.zoom) && args.zoom > 0 ? args.zoom : 1;
    const widthWorld = viewport.width;
    const heightWorld = viewport.height;
    const left = Math.floor(camera.x / tile);
    const top = Math.floor(camera.y / tile);
    const right = Math.floor((camera.x + widthWorld - 0.001) / tile);
    const bottom = Math.floor((camera.y + heightWorld - 0.001) / tile);
    const needed = [];
    for (let row = top - 1; row <= bottom + 1; row++) {
      for (let col = left - 1; col <= right + 1; col++) {
        const visible = col >= left && col <= right && row >= top && row <= bottom;
        needed.push({
          col, row, visible,
          distance: Math.hypot(col - (left + right) / 2, row - (top + bottom) / 2)
        });
      }
    }
    needed.sort((a, b) =>
      Number(b.visible) - Number(a.visible) || a.distance - b.distance
    );
    const visibleCount = needed.filter(x => x.visible).length;
    // Do not run a cache-thrashing prefetch ring on very large monitors.
    const prefetchAllowance = Math.max(0, capacity - visibleCount);
    let remaining = prefetchAllowance;
    const permitted = needed.filter(item => {
      if (item.visible) return true;
      if (remaining <= 0) return false;
      remaining--;
      return true;
    });

    // Revive the tiles currently on screen before eviction decisions.
    for (const entry of permitted) {
      if (entry.visible) touch(tileKey(entry.col, entry.row));
    }
    let newTiles = 0;
    for (const entry of permitted) {
      if (newTiles >= limit) break;
      const key = tileKey(entry.col, entry.row);
      if (saved.has(key)) continue;
      const image = createTile(args, entry.col, entry.row);
      if (!image) continue;
      saved.set(key, image);
      newTiles++;
      while (saved.size > capacity) saved.delete(saved.keys().next().value);
    }

    // The main canvas already owns the WorldArea clipping and device DPR.
    // Missing tiles during the short initial warmup show a cheap base fill;
    // they are never filled by re-rendering the entire WorldSurface at once.
    for (let row = top; row <= bottom; row++) {
      for (let col = left; col <= right; col++) {
        const x = col * tile - camera.x;
        const y = row * tile - camera.y;
        const entry = touch(tileKey(col, row));
        if (entry) {
          ctx.drawImage(entry.canvas,
            edge, edge, tile, tile,
            x, y, tile, tile);
        } else if (typeof ctx.fillRect === 'function') {
          ctx.save?.();
          ctx.fillStyle = args.fallbackColor ?? '#45513f';
          ctx.fillRect(x, y, tile, tile);
          ctx.restore?.();
        }
      }
    }
  }

  return Object.freeze({
    draw, clear,
    stats() { return Object.freeze({cachedTiles: saved.size, tileSize: tile}); }
  });
}
