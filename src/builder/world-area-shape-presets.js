import {
  normalizeWorldAreaBoundary
} from '../world/world-area-geometry.js?rev=interior-geometry-authoring-v1';

const PRESETS = Object.freeze([
  Object.freeze({
    id: 'rectangle',
    label: 'Rectangle',
    boundary:
      normalizeWorldAreaBoundary({
        kind: 'rectangle'
      })
  }),
  Object.freeze({
    id: 'l',
    label: 'L',
    boundary:
      normalizeWorldAreaBoundary({
        kind: 'polygon',
        vertices: [
          { x: 0, y: 0 },
          { x: 0.58, y: 0 },
          { x: 0.58, y: 0.42 },
          { x: 1, y: 0.42 },
          { x: 1, y: 1 },
          { x: 0, y: 1 }
        ]
      })
  }),
  Object.freeze({
    id: 't',
    label: 'T',
    boundary:
      normalizeWorldAreaBoundary({
        kind: 'polygon',
        vertices: [
          { x: 0, y: 0 },
          { x: 1, y: 0 },
          { x: 1, y: 0.36 },
          { x: 0.68, y: 0.36 },
          { x: 0.68, y: 1 },
          { x: 0.32, y: 1 },
          { x: 0.32, y: 0.36 },
          { x: 0, y: 0.36 }
        ]
      })
  }),
  Object.freeze({
    id: 'cross',
    label: 'Croix',
    boundary:
      normalizeWorldAreaBoundary({
        kind: 'polygon',
        vertices: [
          { x: 0.32, y: 0 },
          { x: 0.68, y: 0 },
          { x: 0.68, y: 0.32 },
          { x: 1, y: 0.32 },
          { x: 1, y: 0.68 },
          { x: 0.68, y: 0.68 },
          { x: 0.68, y: 1 },
          { x: 0.32, y: 1 },
          { x: 0.32, y: 0.68 },
          { x: 0, y: 0.68 },
          { x: 0, y: 0.32 },
          { x: 0.32, y: 0.32 }
        ]
      })
  })
]);

const META =
  Object.freeze(
    PRESETS.map(
      (preset) =>
        Object.freeze({
          id: preset.id,
          label: preset.label
        })
    )
  );

function boundariesEqual(
  left,
  right
) {
  const a =
    normalizeWorldAreaBoundary(left);
  const b =
    normalizeWorldAreaBoundary(right);

  if (a.kind !== b.kind) {
    return false;
  }

  if (a.kind === 'rectangle') {
    return true;
  }

  if (
    a.vertices.length !==
    b.vertices.length
  ) {
    return false;
  }

  return a.vertices.every(
    (vertex, index) =>
      Math.abs(
        vertex.x -
          b.vertices[index].x
      ) <= 1e-9 &&
      Math.abs(
        vertex.y -
          b.vertices[index].y
      ) <= 1e-9
  );
}

export function listInteriorShapePresets() {
  return META;
}

export function boundaryForInteriorShapePreset(
  id
) {
  return (
    PRESETS.find(
      (preset) =>
        preset.id === id
    )?.boundary ??
    null
  );
}

export function interiorShapePresetIdForBoundary(
  boundary
) {
  return (
    PRESETS.find(
      (preset) =>
        boundariesEqual(
          preset.boundary,
          boundary
        )
    )?.id ??
    null
  );
}
