import {
  bridgeVisualRect
} from '../world/world-object-model.js';

function degreesToRadians(value) {
  return Number.isFinite(value) ? value * Math.PI / 180 : 0;
}

function cullRadius(length, width) {
  return Math.hypot(length, width) / 2;
}

function isOffscreen(screenX, screenY, radius, viewport) {
  return (
    screenX + radius < 0 ||
    screenY + radius < 0 ||
    screenX - radius > viewport.width ||
    screenY - radius > viewport.height
  );
}

function drawBridgeImage(
  ctx,
  bridge,
  camera,
  viewport,
  image,
  asset
) {
  const rect = bridgeVisualRect(bridge);
  if (!rect || !image || !asset?.render) return false;

  const lengthScale =
    Number.isFinite(asset.render.lengthScale) &&
    asset.render.lengthScale > 0
      ? asset.render.lengthScale
      : 1;
  const widthScale =
    Number.isFinite(asset.render.widthScale) &&
    asset.render.widthScale > 0
      ? asset.render.widthScale
      : 1;
  const renderLength = rect.length * lengthScale;
  const renderWidth = rect.width * widthScale;
  const screenX = rect.x - camera.x;
  const screenY = rect.y - camera.y;

  if (
    isOffscreen(
      screenX,
      screenY,
      cullRadius(renderLength, renderWidth),
      viewport
    )
  ) {
    return true;
  }

  ctx.save();
  ctx.translate(screenX, screenY);
  ctx.rotate(
    rect.rotation +
    degreesToRadians(asset.render.rotationOffsetDeg)
  );
  ctx.drawImage(
    image,
    -renderWidth / 2,
    -renderLength / 2,
    renderWidth,
    renderLength
  );
  ctx.restore();

  return true;
}

function drawBridgeFallback(ctx, bridge, camera, viewport) {
  const rect = bridgeVisualRect(bridge);
  if (!rect) return;

  const screenX = rect.x - camera.x;
  const screenY = rect.y - camera.y;
  const radius = cullRadius(rect.length, rect.width);

  if (isOffscreen(screenX, screenY, radius, viewport)) {
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

export function createWorldObjectRenderer({
  imageLoader = null,
  resolveVisualAsset = null
} = {}) {
  return Object.freeze({
    draw(ctx, { camera, viewport, objects }) {
      for (const object of Array.isArray(objects) ? objects : []) {
        if (object.kind !== 'bridge') continue;

        const assetId = object.visual?.assetId;
        const asset =
          typeof resolveVisualAsset === 'function'
            ? resolveVisualAsset(assetId)
            : null;
        const image = imageLoader?.get(assetId);

        const drawn = drawBridgeImage(
          ctx,
          object,
          camera,
          viewport,
          image,
          asset
        );

        if (!drawn) {
          drawBridgeFallback(ctx, object, camera, viewport);
        }
      }
    }
  });
}
