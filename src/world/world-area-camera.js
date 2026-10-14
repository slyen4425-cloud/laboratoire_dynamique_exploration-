// Canonical WorldArea camera policy (visual framing only).
// This data never influences movement, collision, encounters or Builder viewport.
export const DEFAULT_AREA_CAMERA = Object.freeze({
  initialZoom: 1,
  minZoom: 0.6,
  maxZoom: 1.8,
  allowPlayerZoom: false
});

function finiteZoom(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function normalizeAreaCamera(raw = null) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const minZoom = clamp(
    finiteZoom(source.minZoom, DEFAULT_AREA_CAMERA.minZoom),
    0.3, 3
  );
  const maxZoom = clamp(
    finiteZoom(source.maxZoom, DEFAULT_AREA_CAMERA.maxZoom),
    minZoom, 3
  );
  return Object.freeze({
    initialZoom: clamp(
      finiteZoom(source.initialZoom, DEFAULT_AREA_CAMERA.initialZoom),
      minZoom, maxZoom
    ),
    minZoom,
    maxZoom,
    allowPlayerZoom: typeof source.allowPlayerZoom === 'boolean'
      ? source.allowPlayerZoom : DEFAULT_AREA_CAMERA.allowPlayerZoom
  });
}

export function clampAreaCameraZoom(settings, value) {
  const camera = normalizeAreaCamera(settings);
  return clamp(finiteZoom(value, camera.initialZoom), camera.minZoom, camera.maxZoom);
}

export function gameCameraViewport(screenWidth, screenHeight, zoom = 1) {
  const scale = Math.max(0.01, finiteZoom(zoom, 1));
  return {
    width: Math.max(1, screenWidth / scale),
    height: Math.max(1, screenHeight / scale)
  };
}

export function followGameCamera(area, player, viewport) {
  return {
    x: clamp(player.x - viewport.width / 2, 0,
      Math.max(0, area.width - viewport.width)),
    y: clamp(player.y - viewport.height / 2, 0,
      Math.max(0, area.height - viewport.height))
  };
}
