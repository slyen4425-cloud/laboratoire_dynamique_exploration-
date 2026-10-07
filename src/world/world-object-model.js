import {
  WORLD_OBJECT_PLACEMENT_LIMITS,
  normalizeWorldObjectPlacements,
  resolveWorldObjectPlacements
} from './world-object-placement-model.js?rev=building-interiors-passages-ux-r1';

export const WORLD_OBJECT_SCHEMA_VERSION = 3;

export const WORLD_OBJECT_LIMITS =
  WORLD_OBJECT_PLACEMENT_LIMITS;

// Compatibility helper for runtime/tests: normalize placements, then resolve
// definitions. Persisted WorldDocument data remains placement-only.
export function normalizeWorldObjects(
  rawPlacements = []
) {
  return resolveWorldObjectPlacements(
    normalizeWorldObjectPlacements(
      rawPlacements
    )
  );
}

export function worldObjectRotationRadians(object) {
  const degrees =
    object?.transform?.rotationDeg;

  return Number.isFinite(degrees)
    ? degrees * Math.PI / 180
    : 0;
}


export function worldObjectBaseDimensions(object) {
  if (!object || !object.baseSize) {
    return null;
  }

  if (object.kind === 'bridge') {
    const width = Number(object.baseSize.length);
    const height = Number(object.baseSize.width);

    if (
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(height) ||
      height <= 0
    ) {
      return null;
    }

    return Object.freeze({
      width,
      height
    });
  }

  const width = Number(object.baseSize.width);
  const height = Number(object.baseSize.height);

  if (
    !Number.isFinite(width) ||
    width <= 0 ||
    !Number.isFinite(height) ||
    height <= 0
  ) {
    return null;
  }

  return Object.freeze({
    width,
    height
  });
}

export function worldObjectVisualRect(object) {
  const base =
    worldObjectBaseDimensions(object);

  if (
    !base ||
    !object?.transform
  ) {
    return null;
  }

  const scaleX =
    Number(object.transform.scaleX);
  const scaleY =
    Number(object.transform.scaleY);

  if (
    !Number.isFinite(scaleX) ||
    scaleX <= 0 ||
    !Number.isFinite(scaleY) ||
    scaleY <= 0
  ) {
    return null;
  }

  return Object.freeze({
    x: object.transform.x,
    y: object.transform.y,
    rotation:
      worldObjectRotationRadians(object),
    width:
      base.width * scaleX,
    height:
      base.height * scaleY
  });
}

function localPointToWorld(
  object,
  localX,
  localY
) {
  const rotation =
    worldObjectRotationRadians(object);
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);

  return Object.freeze({
    x:
      object.transform.x +
      localX * cos -
      localY * sin,
    y:
      object.transform.y +
      localX * sin +
      localY * cos
  });
}

export function bridgeVisualRect(bridge) {
  if (
    !bridge ||
    bridge.kind !== 'bridge'
  ) {
    return null;
  }

  const rect =
    worldObjectVisualRect(bridge);

  return rect
    ? Object.freeze({
        x: rect.x,
        y: rect.y,
        rotation: rect.rotation,
        length: rect.width,
        width: rect.height
      })
    : null;
}

export function bridgeTraversalRect(bridge) {
  if (
    !bridge ||
    bridge.kind !== 'bridge' ||
    bridge.traversal?.enabled !== true
  ) {
    return null;
  }

  const visual =
    bridgeVisualRect(bridge);

  return Object.freeze({
    x: visual.x,
    y: visual.y,
    rotation: visual.rotation,
    length:
      visual.length *
      bridge.traversal.lengthRatio,
    width:
      visual.width *
      bridge.traversal.widthRatio
  });
}

export function buildingVisualRect(building) {
  if (
    !building ||
    building.kind !== 'building'
  ) {
    return null;
  }

  return worldObjectVisualRect(building);
}

export function buildingFootprintRect(
  building
) {
  if (
    !building ||
    building.kind !== 'building' ||
    building.footprint?.enabled !== true
  ) {
    return null;
  }

  const width =
    building.baseSize.width *
    building.transform.scaleX;
  const height =
    building.baseSize.height *
    building.transform.scaleY;
  const center =
    localPointToWorld(
      building,
      width *
        building.footprint.offsetX,
      height *
        building.footprint.offsetY
    );

  return Object.freeze({
    x: center.x,
    y: center.y,
    rotation:
      worldObjectRotationRadians(building),
    length:
      width *
      building.footprint.widthRatio,
    width:
      height *
      building.footprint.heightRatio
  });
}

export function buildingDoorAnchorWorld(
  building,
  anchorId
) {
  if (
    !building ||
    building.kind !== 'building'
  ) {
    return null;
  }

  const anchor =
    building.doorAnchors.find(
      (item) => item.id === anchorId
    );

  if (!anchor) return null;

  const width =
    building.baseSize.width *
    building.transform.scaleX;
  const height =
    building.baseSize.height *
    building.transform.scaleY;

  const point =
    localPointToWorld(
      building,
      width * anchor.x,
      height * anchor.y
    );

  return Object.freeze({
    id: anchor.id,
    x: point.x,
    y: point.y
  });
}

export function buildingDoorArrivalWorld(
  building,
  anchorId,
  offset = 0
) {
  if (
    !building ||
    building.kind !== 'building'
  ) {
    return null;
  }

  const anchor =
    building.doorAnchors.find(
      (item) => item.id === anchorId
    );

  if (!anchor) return null;

  const width =
    building.baseSize.width *
    building.transform.scaleX;
  const height =
    building.baseSize.height *
    building.transform.scaleY;
  const localX = width * anchor.x;
  const localY = height * anchor.y;
  const distance = Math.max(
    0,
    Number.isFinite(offset)
      ? offset
      : 0
  );
  const magnitude =
    Math.hypot(localX, localY);

  const outwardX =
    magnitude > 1e-9
      ? localX / magnitude
      : 0;
  const outwardY =
    magnitude > 1e-9
      ? localY / magnitude
      : 1;

  const point =
    localPointToWorld(
      building,
      localX +
        outwardX * distance,
      localY +
        outwardY * distance
    );

  return Object.freeze({
    id: anchor.id,
    x: point.x,
    y: point.y
  });
}
