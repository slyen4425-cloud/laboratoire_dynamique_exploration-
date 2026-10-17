// Optional, purely cosmetic water overlay for the canyon art pilot.
// Reads canonical river geometry and WorldObject placements; never mutates them
// and never changes the static terrain raster / collision authority.
import { sampleSmoothPath } from './path-ribbon.js';

export const RELIEF_WATER_PILOT_ID = 'relief-canyon-pilot-v1';
export const RELIEF_WATERFALL_DEFINITION_ID = 'objectdef.relief.waterfall.blue.01';
// Cosmetic only: cached path geometry and a bounded number of brush strokes.
// Static terrain and water base remain in the retained TerrainTileCache.
const MAX_MARKS_PER_RIVER = 22;
const MAX_FOAM_PER_RIVER = 18;
const samplesCache = new WeakMap();

export function shouldRenderReliefWater(documentId, area) {
  return documentId === RELIEF_WATER_PILOT_ID &&
    area?.id === 'canyon-exterior' && area?.kind === 'exterior';
}

// Stable index hash: no random-per-frame flicker and no texture-grid repetition.
function noise(index, salt) {
  let h = Math.imul(index + 17, 0x9e3779b1) ^ Math.imul(salt + 31, 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 16), 0x7feb352d);
  h = Math.imul(h ^ (h >>> 15), 0x846ca68b);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}

function riverSamples(river) {
  if (!river || typeof river !== 'object') return {result: [], length: 0};
  const old = samplesCache.get(river);
  if (old) return old;
  const points = sampleSmoothPath(river.points, 34);
  const result = [];
  let length = 0;
  if (points.length >= 2) {
    result.push({x:points[0].x, y:points[0].y, length:0});
    for (let i = 1; i < points.length; i += 1) {
      const prev = points[i-1], next = points[i];
      const distance = Math.hypot(next.x-prev.x, next.y-prev.y);
      if (distance < 0.01) continue;
      length += distance;
      result.push({x:next.x, y:next.y, length});
    }
  }
  const data = { result, length };
  samplesCache.set(river, data);
  return data;
}

function pointOnRiver(samples, distance) {
  const {result, length} = samples;
  if (result.length < 2 || length <= 0) return null;
  const target = ((distance % length) + length) % length;
  let low = 1, high = result.length-1;
  while (low < high) {
    const mid = (low+high) >>> 1;
    if (result[mid].length < target) low=mid+1;
    else high=mid;
  }
  const next = result[low], prev = result[low-1];
  const segment = next.length-prev.length;
  const fraction = segment > 0 ? Math.min(1,Math.max(0,(target-prev.length)/segment)) : 0;
  return {
    x:prev.x + (next.x-prev.x)*fraction,
    y:prev.y + (next.y-prev.y)*fraction,
    angle:Math.atan2(next.y-prev.y,next.x-prev.x)
  };
}

export function reliefWaterMarks(river, timeSeconds = 0) {
  const samples = riverSamples(river);
  if (samples.result.length < 2) return [];
  const count = Math.min(MAX_MARKS_PER_RIVER, Math.floor(samples.length / 132));
  if (count < 1) return [];
  const seconds = Number.isFinite(timeSeconds) ? timeSeconds : 0;
  const marks = [];
  const spacing = samples.length/count;
  for (let i=0; i<count; i+=1) {
    const randomPhase = noise(i, 1);
    // Staggered, not grid-spaced: each sparkle slowly travels downstream.
    const position = (i + 0.18 + 0.64*randomPhase)*spacing +
      seconds*(10 + 7*noise(i, 2));
    const onRiver = pointOnRiver(samples,position);
    if (!onRiver) continue;
    const offset = (noise(i, 3)*2-1)*river.width*0.315;
    const length = Math.min(78,18+60*noise(i,4));
    const breathing = 0.5 + 0.5*Math.sin(seconds*0.63+noise(i,5)*Math.PI*2);
    const opacity = 0.055+breathing*(0.085+0.12*noise(i,6));
    marks.push({
      x:onRiver.x-Math.sin(onRiver.angle)*offset,
      y:onRiver.y+Math.cos(onRiver.angle)*offset,
      angle:onRiver.angle,
      offset, length, opacity,
      bend:(noise(i,7)*2-1)*Math.min(4,river.width*0.018)
    });
  }
  return marks;
}

function inView(x,y,viewport,padding) {
  return x >= -padding && y >= -padding &&
    x <= viewport.width+padding && y <= viewport.height+padding;
}

// Long layered strokes resemble slow specular reflections rather than tiny
// identical white tilde characters. The cool underglow supplies depth.
export function drawReliefRiverGlints(ctx,{area,camera,viewport,timeSeconds=0}={}) {
  if (!area?.surface?.rivers || !camera || !viewport) return 0;
  let drawn=0;
  for (const river of area.surface.rivers) {
    if (river.materialId !== 'water.canyon_turquoise') continue;
    for (const mark of reliefWaterMarks(river,timeSeconds)) {
      const x=mark.x-camera.x, y=mark.y-camera.y;
      if (!inView(x,y,viewport,90)) continue;
      const half=mark.length/2;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(mark.angle);
      ctx.lineCap='round';
      ctx.lineJoin='round';
      ctx.beginPath();
      ctx.moveTo(-half, 0);
      ctx.quadraticCurveTo(-half*0.25,mark.bend*1.5,half,mark.bend);
      ctx.strokeStyle='#6ad5d6';
      ctx.globalAlpha=mark.opacity*0.48;
      ctx.lineWidth=6.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-half*0.76,-0.6);
      ctx.quadraticCurveTo(-half*0.1,mark.bend*0.8-0.9,half*0.77,mark.bend-0.3);
      ctx.strokeStyle='#d4fff0';
      ctx.globalAlpha=mark.opacity*0.8;
      ctx.lineWidth=1.65;
      ctx.stroke();
      ctx.restore();
      drawn++;
    }
  }
  return drawn;
}

// Only sparse translucent accents at the true canonical shore; no evenly
// repeated pairs of foam tilde marks or a second shoreline geometry.
export function drawReliefRiverBankFoam(ctx,{area,camera,viewport,timeSeconds=0}={}) {
  if (!area?.surface?.rivers || !camera || !viewport) return 0;
  const seconds=Number.isFinite(timeSeconds)?timeSeconds:0;
  let drawn=0;
  for (const river of area.surface.rivers) {
    if (river.materialId !== 'water.canyon_turquoise') continue;
    const samples=riverSamples(river);
    const count=Math.min(MAX_FOAM_PER_RIVER,Math.floor(samples.length/134));
    if (count < 1) continue;
    for(let i=0;i<count;i+=1) {
      const side=i%2===0?-1:1;
      const at=(i+0.19+0.62*noise(i,10))*samples.length/count;
      const p=pointOnRiver(samples,at);
      if(!p)continue;
      const offset=side*river.width*(0.465+0.012*noise(i,11));
      const shimmer=Math.sin(seconds*0.7+i*1.47);
      const x=p.x-Math.sin(p.angle)*offset-camera.x;
      const y=p.y+Math.cos(p.angle)*offset-camera.y;
      if(!inView(x,y,viewport,55))continue;
      const half=9+15*noise(i,12);
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate(p.angle);
      ctx.lineCap='round';
      ctx.strokeStyle='#d7fff0';
      ctx.globalAlpha=0.09+0.075*(0.5+0.5*shimmer);
      ctx.lineWidth=1.4+0.9*noise(i,13);
      ctx.beginPath();
      ctx.moveTo(-half,0);
      ctx.quadraticCurveTo(0,side*(1.5+noise(i,14)*2),half*0.75,0.6*shimmer);
      ctx.stroke();
      ctx.restore();
      drawn++;
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
