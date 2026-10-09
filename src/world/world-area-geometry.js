import {
  pointToSegmentDistance
} from '../core/geometry.js?rev=interior-geometry-authoring-v1';

const EPSILON = 1e-6;
const MIN_POLYGON_AREA = 1e-4;

const RECTANGLE_BOUNDARY = Object.freeze({
  kind: 'rectangle'
});

function finiteUnit(value) {
  return (
    Number.isFinite(value) &&
    value >= 0 &&
    value <= 1
  );
}

function normalizedVertex(raw) {
  if (
    !raw ||
    !finiteUnit(raw.x) ||
    !finiteUnit(raw.y)
  ) {
    return null;
  }

  return Object.freeze({
    x: raw.x,
    y: raw.y
  });
}

function samePoint(a, b) {
  return Boolean(
    a &&
    b &&
    Math.abs(a.x - b.x) <= EPSILON &&
    Math.abs(a.y - b.y) <= EPSILON
  );
}

function signedArea(vertices) {
  let sum = 0;

  for (
    let index = 0;
    index < vertices.length;
    index += 1
  ) {
    const current = vertices[index];
    const next =
      vertices[
        (index + 1) % vertices.length
      ];

    sum +=
      current.x * next.y -
      next.x * current.y;
  }

  return sum / 2;
}

function orientation(a, b, c) {
  return (
    (b.x - a.x) * (c.y - a.y) -
    (b.y - a.y) * (c.x - a.x)
  );
}

function onSegment(a, b, point) {
  return (
    Math.abs(
      orientation(a, b, point)
    ) <= EPSILON &&
    point.x >=
      Math.min(a.x, b.x) - EPSILON &&
    point.x <=
      Math.max(a.x, b.x) + EPSILON &&
    point.y >=
      Math.min(a.y, b.y) - EPSILON &&
    point.y <=
      Math.max(a.y, b.y) + EPSILON
  );
}

function segmentsIntersect(a, b, c, d) {
  const abC = orientation(a, b, c);
  const abD = orientation(a, b, d);
  const cdA = orientation(c, d, a);
  const cdB = orientation(c, d, b);

  if (
    (
      abC > EPSILON &&
      abD < -EPSILON
    ) ||
    (
      abC < -EPSILON &&
      abD > EPSILON
    )
  ) {
    if (
      (
        cdA > EPSILON &&
        cdB < -EPSILON
      ) ||
      (
        cdA < -EPSILON &&
        cdB > EPSILON
      )
    ) {
      return true;
    }
  }

  return (
    onSegment(a, b, c) ||
    onSegment(a, b, d) ||
    onSegment(c, d, a) ||
    onSegment(c, d, b)
  );
}

function simplePolygon(vertices) {
  const count = vertices.length;

  for (
    let left = 0;
    left < count;
    left += 1
  ) {
    const leftNext =
      (left + 1) % count;

    for (
      let right = left + 1;
      right < count;
      right += 1
    ) {
      const rightNext =
        (right + 1) % count;

      if (
        left === right ||
        leftNext === right ||
        rightNext === left
      ) {
        continue;
      }

      if (
        left === 0 &&
        rightNext === 0
      ) {
        continue;
      }

      if (
        segmentsIntersect(
          vertices[left],
          vertices[leftNext],
          vertices[right],
          vertices[rightNext]
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

export function normalizeWorldAreaBoundary(
  raw
) {
  if (
    !raw ||
    raw.kind !== 'polygon' ||
    !Array.isArray(raw.vertices)
  ) {
    return RECTANGLE_BOUNDARY;
  }

  const vertices = [];

  for (const rawVertex of raw.vertices) {
    const vertex =
      normalizedVertex(rawVertex);

    if (!vertex) {
      return RECTANGLE_BOUNDARY;
    }

    if (
      vertices.length === 0 ||
      !samePoint(
        vertices[vertices.length - 1],
        vertex
      )
    ) {
      vertices.push(vertex);
    }
  }

  if (
    vertices.length > 2 &&
    samePoint(
      vertices[0],
      vertices[vertices.length - 1]
    )
  ) {
    vertices.pop();
  }

  if (
    vertices.length < 3 ||
    Math.abs(signedArea(vertices)) <
      MIN_POLYGON_AREA ||
    !simplePolygon(vertices)
  ) {
    return RECTANGLE_BOUNDARY;
  }

  return Object.freeze({
    kind: 'polygon',
    vertices:
      Object.freeze(vertices)
  });
}

function safeAreaSize(
  value,
  fallback = 1
) {
  return (
    Number.isFinite(value) &&
    value > 0
  )
    ? value
    : fallback;
}

export function worldAreaBoundaryPoints(
  area
) {
  const width =
    safeAreaSize(area?.width);
  const height =
    safeAreaSize(area?.height);
  const boundary =
    area?.boundary?.kind ===
      'polygon' &&
    Array.isArray(
      area.boundary.vertices
    )
      ? area.boundary
      : RECTANGLE_BOUNDARY;

  if (boundary.kind === 'rectangle') {
    return Object.freeze([
      Object.freeze({ x: 0, y: 0 }),
      Object.freeze({
        x: width,
        y: 0
      }),
      Object.freeze({
        x: width,
        y: height
      }),
      Object.freeze({
        x: 0,
        y: height
      })
    ]);
  }

  return Object.freeze(
    boundary.vertices.map(
      (vertex) =>
        Object.freeze({
          x: vertex.x * width,
          y: vertex.y * height
        })
    )
  );
}

function pointOnPolygonBoundary(
  points,
  point
) {
  for (
    let index = 0;
    index < points.length;
    index += 1
  ) {
    const start = points[index];
    const end =
      points[
        (index + 1) % points.length
      ];

    if (
      pointToSegmentDistance(
        point,
        start,
        end
      ) <= EPSILON
    ) {
      return true;
    }
  }

  return false;
}

export function pointInWorldAreaBoundary(
  area,
  x,
  y
) {
  if (
    !Number.isFinite(x) ||
    !Number.isFinite(y)
  ) {
    return false;
  }

  const width =
    safeAreaSize(area?.width);
  const height =
    safeAreaSize(area?.height);
  const boundary =
    area?.boundary;

  if (
    !boundary ||
    boundary.kind !== 'polygon'
  ) {
    return (
      x >= -EPSILON &&
      y >= -EPSILON &&
      x <= width + EPSILON &&
      y <= height + EPSILON
    );
  }

  const points =
    worldAreaBoundaryPoints(area);
  const point = { x, y };

  if (
    pointOnPolygonBoundary(
      points,
      point
    )
  ) {
    return true;
  }

  let inside = false;

  for (
    let index = 0,
      previous =
        points.length - 1;
    index < points.length;
    previous = index,
      index += 1
  ) {
    const current =
      points[index];
    const before =
      points[previous];

    const crosses =
      (
        current.y > y
      ) !== (
        before.y > y
      );

    if (!crosses) continue;

    const intersectionX =
      (
        (before.x - current.x) *
        (y - current.y)
      ) /
        (before.y - current.y) +
      current.x;

    if (x < intersectionX) {
      inside = !inside;
    }
  }

  return inside;
}

export function circleFitsWorldAreaBoundary(
  area,
  x,
  y,
  radius = 0
) {
  const safeRadius =
    Number.isFinite(radius)
      ? Math.max(0, radius)
      : 0;
  const width =
    safeAreaSize(area?.width);
  const height =
    safeAreaSize(area?.height);
  const boundary =
    area?.boundary;

  if (
    !boundary ||
    boundary.kind !== 'polygon'
  ) {
    return (
      x - safeRadius >=
        -EPSILON &&
      y - safeRadius >=
        -EPSILON &&
      x + safeRadius <=
        width + EPSILON &&
      y + safeRadius <=
        height + EPSILON
    );
  }

  if (
    !pointInWorldAreaBoundary(
      area,
      x,
      y
    )
  ) {
    return false;
  }

  const points =
    worldAreaBoundaryPoints(area);
  const point = { x, y };

  for (
    let index = 0;
    index < points.length;
    index += 1
  ) {
    const start =
      points[index];
    const end =
      points[
        (index + 1) %
          points.length
      ];

    if (
      pointToSegmentDistance(
        point,
        start,
        end
      ) <
      safeRadius - EPSILON
    ) {
      return false;
    }
  }

  return true;
}


export function findWorldAreaBoundarySafePoint(
  area,
  preferred,
  radius = 0
) {
  const width =
    safeAreaSize(area?.width);
  const height =
    safeAreaSize(area?.height);
  const safeRadius =
    Number.isFinite(radius)
      ? Math.max(0, radius)
      : 0;
  const preferredX =
    Number.isFinite(preferred?.x)
      ? preferred.x
      : width / 2;
  const preferredY =
    Number.isFinite(preferred?.y)
      ? preferred.y
      : height / 2;

  if (
    circleFitsWorldAreaBoundary(
      area,
      preferredX,
      preferredY,
      safeRadius
    )
  ) {
    return Object.freeze({
      x: preferredX,
      y: preferredY
    });
  }

  const candidates = [];
  const addCandidate = (x, y) => {
    if (
      !circleFitsWorldAreaBoundary(
        area,
        x,
        y,
        safeRadius
      )
    ) {
      return;
    }

    const dx = x - preferredX;
    const dy = y - preferredY;

    candidates.push({
      x,
      y,
      distanceSquared:
        dx * dx + dy * dy
    });
  };

  addCandidate(
    width / 2,
    height / 2
  );

  const points =
    worldAreaBoundaryPoints(area);

  if (points.length > 0) {
    const centroid =
      points.reduce(
        (sum, point) => ({
          x: sum.x + point.x,
          y: sum.y + point.y
        }),
        { x: 0, y: 0 }
      );

    addCandidate(
      centroid.x / points.length,
      centroid.y / points.length
    );
  }

  const divisions = 32;

  for (
    let yIndex = 0;
    yIndex <= divisions;
    yIndex += 1
  ) {
    const y =
      height * yIndex /
      divisions;

    for (
      let xIndex = 0;
      xIndex <= divisions;
      xIndex += 1
    ) {
      const x =
        width * xIndex /
        divisions;

      addCandidate(x, y);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort(
    (left, right) =>
      left.distanceSquared -
        right.distanceSquared ||
      left.y - right.y ||
      left.x - right.x
  );

  return Object.freeze({
    x: candidates[0].x,
    y: candidates[0].y
  });
}
