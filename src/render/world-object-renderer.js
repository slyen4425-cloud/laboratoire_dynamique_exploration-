import {
  bridgeVisualRect
} from '../world/world-object-model.js';

function drawBridgeFallback(ctx, bridge, camera, viewport) {
  const rect = bridgeVisualRect(bridge);
  if (!rect) return;

  const screenX = rect.x - camera.x;
  const screenY = rect.y - camera.y;
  const cullRadius = Math.hypot(rect.length, rect.width) / 2;

  if (
    screenX + cullRadius < 0 ||
    screenY + cullRadius < 0 ||
    screenX - cullRadius > viewport.width ||
    screenY - cullRadius > viewport.height
  ) {
    return;
  }

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(rect.rotation);

  ctx.fillStyle = 'rgba(0,0,0,0.20)';
  ctx.fillRect(
    -rect.length / 2 + 5,
    -rect.width / 2 + 6,
    rect.length,
    rect.width
  );

  ctx.fillStyle = '#765334';
  ctx.fillRect(
    -rect.length / 2,
    -rect.width / 2,
    rect.length,
    rect.width
  );

  const plankCount = Math.max(4, Math.floor(rect.length / 18));
  const plankWidth = rect.length / plankCount;

  ctx.strokeStyle = 'rgba(53,35,22,0.72)';
  ctx.lineWidth = 1.5;

  for (let index = 1; index < plankCount; index += 1) {
    const x = -rect.length / 2 + index * plankWidth;
    ctx.beginPath();
    ctx.moveTo(x, -rect.width / 2);
    ctx.lineTo(x, rect.width / 2);
    ctx.stroke();
  }

  const railInset = Math.max(5, rect.width * 0.1);

  ctx.strokeStyle = '#4b3422';
  ctx.lineWidth = Math.max(3, rect.width * 0.06);

  for (const side of [-1, 1]) {
    const y = side * (rect.width / 2 - railInset);
    ctx.beginPath();
    ctx.moveTo(-rect.length / 2, y);
    ctx.lineTo(rect.length / 2, y);
    ctx.stroke();
  }

  ctx.restore();
}

export function createWorldObjectRenderer() {
  return Object.freeze({
    draw(ctx, { camera, viewport, objects }) {
      for (const object of Array.isArray(objects) ? objects : []) {
        if (object.kind === 'bridge') {
          drawBridgeFallback(ctx, object, camera, viewport);
        }
      }
    }
  });
}
