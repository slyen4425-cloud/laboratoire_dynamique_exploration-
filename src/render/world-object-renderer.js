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

        if (!assetId) continue;

        if (!asset || !image) {
          throw new Error(
            `WorldObject visual asset not ready: ${assetId}`
          );
        }

        drawBridgeImage(
          ctx,
          object,
          camera,
          viewport,
          image,
          asset
        );
      }
    }
  });
}
