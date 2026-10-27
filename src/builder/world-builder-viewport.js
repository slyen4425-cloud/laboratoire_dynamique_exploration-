export const BUILDER_ZOOM_LIMITS = Object.freeze({
  min: 0.05,
  max: 4
});

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function clampBuilderZoom(value) {
  return Math.max(
    BUILDER_ZOOM_LIMITS.min,
    Math.min(BUILDER_ZOOM_LIMITS.max, finite(value, 1))
  );
}

export function computeBuilderView({
  area,
  center,
  zoom,
  canvasWidth,
  canvasHeight,
  panMarginPx = 0
}) {
  const safeZoom = clampBuilderZoom(zoom);
  const width = Math.max(1, finite(canvasWidth, 1));
  const height = Math.max(1, finite(canvasHeight, 1));
  const areaWidth = Math.max(1, finite(area?.width, width));
  const areaHeight = Math.max(1, finite(area?.height, height));
  const viewport = Object.freeze({
    width: width / safeZoom,
    height: height / safeZoom
  });
  const panMarginWorld =
    Math.max(0, finite(panMarginPx, 0)) /
    safeZoom;

  const desiredX =
    finite(center?.x, areaWidth / 2) - viewport.width / 2;
  const desiredY =
    finite(center?.y, areaHeight / 2) - viewport.height / 2;

  const camera = Object.freeze({
    x: Math.max(
      -panMarginWorld,
      Math.min(
        Math.max(0, areaWidth - viewport.width) +
          panMarginWorld,
        desiredX
      )
    ),
    y: Math.max(
      -panMarginWorld,
      Math.min(
        Math.max(0, areaHeight - viewport.height) +
          panMarginWorld,
        desiredY
      )
    )
  });

  return Object.freeze({
    zoom: safeZoom,
    viewport,
    camera,
    center: Object.freeze({
      x: camera.x + viewport.width / 2,
      y: camera.y + viewport.height / 2
    })
  });
}

export function canvasPointToWorld({
  canvasX,
  canvasY,
  camera,
  zoom
}) {
  const safeZoom = clampBuilderZoom(zoom);

  return Object.freeze({
    x: finite(camera?.x, 0) + finite(canvasX, 0) / safeZoom,
    y: finite(camera?.y, 0) + finite(canvasY, 0) / safeZoom
  });
}

export function panBuilderCenter({
  center,
  deltaCanvasX,
  deltaCanvasY,
  zoom
}) {
  const safeZoom = clampBuilderZoom(zoom);

  return Object.freeze({
    x: finite(center?.x, 0) - finite(deltaCanvasX, 0) / safeZoom,
    y: finite(center?.y, 0) - finite(deltaCanvasY, 0) / safeZoom
  });
}

export function zoomBuilderAtCanvasPoint({
  area,
  center,
  oldZoom,
  newZoom,
  canvasWidth,
  canvasHeight,
  canvasX,
  canvasY,
  panMarginPx = 0
}) {
  const oldView = computeBuilderView({
    area,
    center,
    zoom: oldZoom,
    canvasWidth,
    canvasHeight,
    panMarginPx
  });

  const worldPoint = canvasPointToWorld({
    canvasX,
    canvasY,
    camera: oldView.camera,
    zoom: oldView.zoom
  });

  const safeNewZoom = clampBuilderZoom(newZoom);
  const viewportWidth = Math.max(1, canvasWidth) / safeNewZoom;
  const viewportHeight = Math.max(1, canvasHeight) / safeNewZoom;

  const desiredCamera = {
    x: worldPoint.x - canvasX / safeNewZoom,
    y: worldPoint.y - canvasY / safeNewZoom
  };

  const desiredCenter = {
    x: desiredCamera.x + viewportWidth / 2,
    y: desiredCamera.y + viewportHeight / 2
  };

  return computeBuilderView({
    area,
    center: desiredCenter,
    zoom: safeNewZoom,
    canvasWidth,
    canvasHeight,
    panMarginPx
  });
}

export function pointInRotatedRect(
  point,
  {
    x,
    y,
    rotation = 0,
    width,
    height
  }
) {
  if (
    !point ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return false;
  }

  const dx = point.x - x;
  const dy = point.y - y;
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dy * sin;
  const localY = dx * sin + dy * cos;

  return (
    Math.abs(localX) <= width / 2 &&
    Math.abs(localY) <= height / 2
  );
}
