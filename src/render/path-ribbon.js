function distance(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function midpoint(a, b) {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2
  };
}

function quadraticPoint(start, control, end, t) {
  const oneMinusT = 1 - t;
  return {
    x:
      oneMinusT * oneMinusT * start.x +
      2 * oneMinusT * t * control.x +
      t * t * end.x,
    y:
      oneMinusT * oneMinusT * start.y +
      2 * oneMinusT * t * control.y +
      t * t * end.y
  };
}

function sampleLine(start, end, maxSegmentLength, target, includeStart) {
  const length = distance(start, end);
  const steps = Math.max(1, Math.ceil(length / maxSegmentLength));
  const first = includeStart ? 0 : 1;

  for (let step = first; step <= steps; step += 1) {
    const t = step / steps;
    target.push({
      x: start.x + (end.x - start.x) * t,
      y: start.y + (end.y - start.y) * t
    });
  }
}

function sampleQuadratic(
  start,
  control,
  end,
  maxSegmentLength,
  target,
  includeStart
) {
  const estimatedLength = distance(start, control) + distance(control, end);
  const steps = Math.max(
    1,
    Math.ceil(estimatedLength / maxSegmentLength)
  );
  const first = includeStart ? 0 : 1;

  for (let step = first; step <= steps; step += 1) {
    target.push(
      quadraticPoint(start, control, end, step / steps)
    );
  }
}

export function sampleSmoothPath(points, maxSegmentLength = 18) {
  if (!Array.isArray(points) || points.length < 2) return [];

  const segmentLimit =
    Number.isFinite(maxSegmentLength) && maxSegmentLength > 1
      ? maxSegmentLength
      : 18;

  const samples = [];

  if (points.length === 2) {
    sampleLine(points[0], points[1], segmentLimit, samples, true);
    return samples;
  }

  let start = points[0];

  for (let index = 1; index < points.length - 1; index += 1) {
    const control = points[index];
    const end = midpoint(control, points[index + 1]);

    sampleQuadratic(
      start,
      control,
      end,
      segmentLimit,
      samples,
      samples.length === 0
    );

    start = end;
  }

  sampleQuadratic(
    start,
    points[points.length - 2],
    points[points.length - 1],
    segmentLimit,
    samples,
    samples.length === 0
  );

  return samples;
}

export function buildRibbonSegments(points, maxSegmentLength = 18) {
  const samples = sampleSmoothPath(points, maxSegmentLength);
  const segments = [];
  let distanceStart = 0;

  for (let index = 0; index < samples.length - 1; index += 1) {
    const start = samples[index];
    const end = samples[index + 1];
    const length = distance(start, end);

    if (length <= 0.0001) continue;

    segments.push(Object.freeze({
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
      angle: Math.atan2(end.y - start.y, end.x - start.x),
      length,
      distanceStart
    }));

    distanceStart += length;
  }

  return Object.freeze(segments);
}

export function ribbonTextureSlices({
  distanceStart,
  segmentLength,
  sourceWidth,
  sourceHeight,
  ribbonWidth
}) {
  if (
    ![distanceStart, segmentLength, sourceWidth, sourceHeight, ribbonWidth]
      .every(Number.isFinite) ||
    segmentLength <= 0 ||
    sourceWidth <= 0 ||
    sourceHeight <= 0 ||
    ribbonWidth <= 0
  ) {
    return [];
  }

  const sourcePixelsPerWorldUnit = sourceHeight / ribbonWidth;
  const sourcePeriodWorld = sourceWidth / sourcePixelsPerWorldUnit;
  let phaseWorld =
    ((distanceStart % sourcePeriodWorld) + sourcePeriodWorld) %
    sourcePeriodWorld;

  let usedWorld = 0;
  let remainingWorld = segmentLength;
  const slices = [];

  while (remainingWorld > 0.0001) {
    const sourceX = phaseWorld * sourcePixelsPerWorldUnit;
    const availableWorld =
      (sourceWidth - sourceX) / sourcePixelsPerWorldUnit;
    const worldLength = Math.min(remainingWorld, availableWorld);

    slices.push(Object.freeze({
      sourceX,
      sourceWidth: worldLength * sourcePixelsPerWorldUnit,
      destOffset: usedWorld,
      destWidth: worldLength
    }));

    usedWorld += worldLength;
    remainingWorld -= worldLength;
    phaseWorld = 0;
  }

  return Object.freeze(slices);
}
