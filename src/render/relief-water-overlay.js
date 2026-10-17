// Optional, purely cosmetic water overlay for the canyon art pilot.
// Reads canonical river geometry and WorldObject placements; never mutates them
// and never changes the static terrain raster / collision authority.
import { sampleSmoothPath } from './path-ribbon.js';

export const RELIEF_WATER_PILOT_ID = 'relief-canyon-pilot-v1';
export const RELIEF_WATERFALL_DEFINITION_ID = 'objectdef.relief.waterfall.blue.01';
const MAX_MARKS_PER_RIVER = 32;
const samplesCache = new WeakMap();

export function shouldRenderReliefWater(documentId, area) {
  return documentId === RELIEF_WATER_PILOT_ID &&
    area?.id === 'canyon-exterior' && area?.kind === 'exterior';
}

function riverSamples(river) {
  const old = samplesCache.get(river);
  if (old) return old;
  const points = sampleSmoothPath(river.points, 34);
  const result = [];
  let length = 0;
  for (let i = 1; i < points.length; i += 1) {
    const prev = points[i - 1], next = points[i];
    const distance = Math.hypot(next.x - prev.x, next.y - prev.y);
    if (distance < 0.01) continue;
    length += distance;
    result.push({
      x: next.x, y: next.y,
      angle: Math.atan2(next.y - prev.y, next.x - prev.x),
      length
    });
  }
  const data = { result, length };
  samplesCache.set(river, data);
  return data;
}

export function reliefWaterMarks(river, timeSeconds = 0) {
  const { result, length } = riverSamples(river ?? {});
  if (result.length === 0 || !Number.isFinite(length) || length <= 0) return [];
  // Fixed spacing bounds work per visible frame; motion is along the canonical
  // path and the same time value produces the same visual arrangement.
  const count = Math.min(MAX_MARKS_PER_RIVER, Math.floor(length / 95));
  const seconds = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const marks = [];
  for (let index = 0; index < count; index += 1) {
    const location = ((index * length / count + seconds * 19) % length + length) % length;
    let low = 0, high = result.length - 1;
    while (low < high) {
      const mid = (low + high) >>> 1;
      if (result[mid].length < location) low = mid + 1;
      else high = mid;
    }
    const next = result[low];
    const prev = low > 0 ? result[low - 1] : { ...next, length: 0 };
    const d = next.length - prev.length;
    const t = d > 0 ? Math.min(1, Math.max(0, (location - prev.length) / d)) : 1;
    const angle = next.angle;
    const offset = ((index % 3) - 1) * Math.min(0.24 * river.width, 34);
    marks.push({
      x: prev.x + (next.x - prev.x) * t - Math.sin(angle) * offset,
      y: prev.y + (next.y - prev.y) * t + Math.cos(angle) * offset,
      angle,
      opacity: 0.35 + ((index * 7) % 5) * 0.09
    });
  }
  return marks;
}

export function drawReliefRiverGlints(ctx, { area, camera, viewport, timeSeconds = 0 } = {}) {
  if (!area?.surface?.rivers) return 0;
  let drawn = 0;
  for (const river of area.surface.rivers) {
    if (river.materialId !== 'water.clear_blue') continue;
    for (const mark of reliefWaterMarks(river, timeSeconds)) {
      const x = mark.x - camera.x, y = mark.y - camera.y;
      if (x < -30 || y < -30 || x > viewport.width + 30 || y > viewport.height + 30) continue;
      const width = Math.min(19, river.width * 0.14);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(mark.angle);
      ctx.strokeStyle = '#ddfcff';
      ctx.lineWidth = 2.3;
      ctx.lineCap = 'round';
      ctx.globalAlpha = mark.opacity;
      ctx.beginPath();
      ctx.moveTo(-width, -5);
      ctx.quadraticCurveTo(-width / 3, -9, width * 0.3, -4);
      ctx.quadraticCurveTo(width * 0.7, -1, width, -5);
      ctx.stroke();
      ctx.globalAlpha = mark.opacity * 0.65;
      ctx.beginPath();
      ctx.moveTo(-width * 0.55, 5);
      ctx.quadraticCurveTo(0, 1, width * 0.65, 5);
      ctx.stroke();
      ctx.restore();
      drawn += 1;
    }
  }
  return drawn;
}

export function drawReliefWaterfallGlints(ctx, { area, camera, viewport, timeSeconds = 0 } = {}) {
  if (!area?.objects) return 0;
  const t = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  let drawn = 0;
  for (const obj of area.objects) {
    if (obj.objectDefinitionId !== RELIEF_WATERFALL_DEFINITION_ID) continue;
    const transform = obj.transform;
    if (!transform) continue;
    const w = 280 * transform.scaleX, h = 440 * transform.scaleY;
    const x = transform.x - camera.x, y = transform.y - camera.y;
    if (x < -w || x > viewport.width + w || y < -h || y > viewport.height + h) continue;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((transform.rotationDeg ?? 0) * Math.PI / 180);
    // Crop sparkles to the waterfall's central curtain; the whole image stays
    // a single ordinary WorldObject drawn by the existing object renderer.
    ctx.beginPath();
    ctx.rect(-w * 0.205, -h * 0.38, w * 0.42, h * 0.65);
    ctx.clip();
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#f4ffff';
    for (let lane = 0; lane < 7; lane += 1) {
      const phase = (((t * 0.27 + lane * 0.23) % 1) + 1) % 1;
      const px = (lane / 6 - 0.5) * w * 0.33;
      const py = -h * 0.35 + phase * h * 0.61;
      ctx.globalAlpha = 0.13 + Math.sin(phase * Math.PI) * 0.28;
      ctx.lineWidth = Math.max(1.3, w * 0.009);
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + w * 0.023, py + h * 0.09, px, py + h * 0.15);
      ctx.stroke();
      drawn += 1;
    }
    ctx.restore();
    // Small expanding foam rings around the already-painted bottom pool.
    ctx.save();
    ctx.translate(x, y + h * 0.36);
    ctx.strokeStyle = '#ddfbff';
    ctx.lineWidth = 2.1;
    for (let ring = 0; ring < 2; ring += 1) {
      const pulse = (((t * 0.5 + ring * 0.5) % 1) + 1) % 1;
      ctx.globalAlpha = 0.43 * (1 - pulse);
      ctx.beginPath();
      ctx.ellipse(0, 0, w * (0.19 + pulse * 0.22),
        h * (0.035 + pulse * 0.045), 0, Math.PI * 0.06, Math.PI * 0.94);
      ctx.stroke();
    }
    ctx.restore();
  }
  return drawn;
}
