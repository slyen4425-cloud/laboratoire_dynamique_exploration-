import {
  bridgeVisualRect,
  buildingVisualRect
} from '../world/world-object-model.js?rev=object-catalog-placement-v1';
import {
  resolveWorldObjectPlacements
} from '../world/world-object-placement-model.js?rev=object-catalog-placement-v1';

function degreesToRadians(value) {
  return Number.isFinite(value) ? value * Math.PI / 180 : 0;
}

function cullRadius(width, height) {
  return Math.hypot(width, height) / 2;
}

function isOffscreen(screenX, screenY, radius, viewport) {
  return (
    screenX + radius < 0 ||
    screenY + radius < 0 ||
    screenX - radius > viewport.width ||
    screenY - radius > viewport.height
  );
}

function requireVisualAsset(object, imageLoader, resolveVisualAsset) {
  const assetId = object.visual?.assetId;

  if (!assetId) return null;

  const asset =
    typeof resolveVisualAsset === 'function'
      ? resolveVisualAsset(assetId)
      : null;
  const image = imageLoader?.get(assetId);

  if (!asset || !image) {
    throw new Error(
      `WorldObject visual asset not ready: ${assetId}`
    );
  }

  return Object.freeze({ assetId, asset, image });
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
  if (!rect || !image || !asset?.render) return;

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
    return;
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
}

function drawBuildingImage(
  ctx,
  building,
  camera,
  viewport,
  image,
  asset
) {
  const rect = buildingVisualRect(building);
  if (!rect || !image || !asset?.render) return;

  const widthScale =
    Number.isFinite(asset.render.widthScale) &&
    asset.render.widthScale > 0
      ? asset.render.widthScale
      : 1;
  const heightScale =
    Number.isFinite(asset.render.heightScale) &&
    asset.render.heightScale > 0
      ? asset.render.heightScale
      : 1;
  const renderWidth = rect.width * widthScale;
  const renderHeight = rect.height * heightScale;
  const screenX = rect.x - camera.x;
  const screenY = rect.y - camera.y;

  if (
    isOffscreen(
      screenX,
      screenY,
      cullRadius(renderWidth, renderHeight),
      viewport
    )
  ) {
    return;
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
    -renderHeight / 2,
    renderWidth,
    renderHeight
  );
  ctx.restore();
}

export function createWorldObjectRenderer({
  imageLoader = null,
  resolveVisualAsset = null
} = {}) {
  return Object.freeze({
    draw(ctx, { camera, viewport, objects }) {
      for (const object of resolveWorldObjectPlacements(objects ?? [])) {
        if (
          object.kind !== 'bridge' &&
          object.kind !== 'building'
        ) {
          continue;
        }

        const visual = requireVisualAsset(
          object,
          imageLoader,
          resolveVisualAsset
        );

        if (!visual) continue;

        if (object.kind === 'bridge') {
          drawBridgeImage(
            ctx,
            object,
            camera,
            viewport,
            visual.image,
            visual.asset
          );
          continue;
        }

        drawBuildingImage(
          ctx,
          object,
          camera,
          viewport,
          visual.image,
          visual.asset
        );
      }
    }
  });
}
