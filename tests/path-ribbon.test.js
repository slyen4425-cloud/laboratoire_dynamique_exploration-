import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildRibbonSegments,
  ribbonTextureSlices,
  sampleSmoothPath
} from '../src/render/path-ribbon.js';
import {
  terrainDecalDescriptor
} from '../src/render/surface-renderer.js';

test('smooth path sampling is deterministic and keeps endpoints', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 100, y: 80 },
    { x: 220, y: 20 },
    { x: 340, y: 60 }
  ];

  const first = sampleSmoothPath(points, 16);
  const second = sampleSmoothPath(points, 16);

  assert.deepEqual(first, second);
  assert.deepEqual(first[0], points[0]);
  assert.deepEqual(first[first.length - 1], points[points.length - 1]);
  assert.ok(first.length > points.length);
});

test('ribbon segments preserve increasing cumulative distance', () => {
  const points = [
    { x: 0, y: 0 },
    { x: 120, y: 40 },
    { x: 240, y: 0 }
  ];
  const before = structuredClone(points);
  const segments = buildRibbonSegments(points, 14);

  assert.ok(segments.length > 3);

  for (let index = 1; index < segments.length; index += 1) {
    assert.ok(
      segments[index].distanceStart >
        segments[index - 1].distanceStart
    );
  }

  assert.deepEqual(points, before);
});

test('ribbon texture slices cover exactly one destination segment', () => {
  const slices = ribbonTextureSlices({
    distanceStart: 285,
    segmentLength: 30,
    sourceWidth: 192,
    sourceHeight: 64,
    ribbonWidth: 96
  });

  const total = slices.reduce((sum, slice) => sum + slice.destWidth, 0);

  assert.ok(slices.length >= 1);
  assert.ok(Math.abs(total - 30) < 0.000001);
  assert.ok(
    slices.every(
      (slice) =>
        slice.sourceX >= 0 &&
        slice.sourceWidth > 0 &&
        slice.destWidth > 0
    )
  );
});

test('forest decal layout is deterministic and bounded', () => {
  const first = terrainDecalDescriptor(8, 12, 2, 1);
  const second = terrainDecalDescriptor(8, 12, 2, 1);

  assert.deepEqual(first, second);
  assert.ok(first.assetIndex >= 0 && first.assetIndex < 2);
  assert.ok(first.jitterX >= -0.5 && first.jitterX <= 0.5);
  assert.ok(first.jitterY >= -0.5 && first.jitterY <= 0.5);
  assert.ok(first.sizeT >= 0 && first.sizeT <= 1);
  assert.ok(first.opacityT >= 0.72 && first.opacityT <= 1);
  assert.ok(first.rotation >= 0 && first.rotation <= Math.PI * 2);
});

test('forest decal layout can explicitly disable decals', () => {
  assert.equal(terrainDecalDescriptor(1, 1, 0, 1), null);
  assert.equal(terrainDecalDescriptor(1, 1, 2, 0), null);
});
