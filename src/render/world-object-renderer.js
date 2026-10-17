import { planObjectShoreContacts, riverVisualMask } from './object-shore-contact.js?rev=relief-immersion-v8';
import {
  bridgeVisualRect,
  worldObjectVisualRect
} from '../world/world-object-model.js?rev=collision-boundary-worldobject-obstacles-v1';
import {
  resolveWorldObjectPlacements
} from '../world/world-object-placement-model.js?rev=collision-boundary-worldobject-obstacles-v1';
import {
  objectDefinitionCatalogV1
} from '../objects/object-definition-catalog.js?rev=collision-boundary-worldobject-obstacles-v1';

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

// Render ocean-color translucency OVER the already-painted cliff's submerged
// foot. Both mask and contact originate in the canonical river; no gameplay
// surface or second water geometry is introduced.
function drawShoreContacts(ctx,plan,camera,rect) {
  if(!plan.length)return;
  const seen=new Set();
  for(const item of plan){
    if(seen.has(item.river))continue;
    seen.add(item.river);
    const mask=riverVisualMask(item.river);
    if(!mask||typeof ctx.clip!=='function'||typeof ctx.createLinearGradient!=='function')continue;
    // Start tint well above the visible foot, but apply it ONLY where the
    // real river clips the sprite. At waterline the alpha is already strong;
    // otherwise a late-start gradient would be almost invisible on the rock.
    const top=rect.height*0.07,bottom=rect.height*0.50;
    ctx.save();
    ctx.translate(-camera.x,-camera.y);
    ctx.clip(mask);
    ctx.translate(rect.x,rect.y);
    ctx.rotate(rect.rotation);
    const wash=ctx.createLinearGradient(0,top,0,bottom);
    wash.addColorStop(0,'rgba(0,0,0,0)');
    wash.addColorStop(.35,item.waterColor);
    wash.addColorStop(1,item.waterColor);
    ctx.globalAlpha=item.immersionOpacity;
    ctx.fillStyle=wash;
    ctx.fillRect(-rect.width/2,top,rect.width,bottom-top);
    ctx.restore();
  }
  // Sparse, fine foam; no broad shadow stroke or repeated thick white tilde.
  for(const item of plan){
    ctx.save();ctx.translate(item.x-camera.x,item.y-camera.y);
    ctx.rotate(item.angle);
    ctx.beginPath();ctx.moveTo(-item.length*.40,0);
    ctx.quadraticCurveTo(-item.length*.12,-1.2,item.length*.14,.5);
    ctx.globalAlpha=Math.min(.52,item.opacity*.68);
    ctx.lineWidth=1.2;ctx.lineCap='round';
    ctx.strokeStyle=item.highlightColor;ctx.stroke();ctx.restore();
  }
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

function drawStaticImage(
  ctx,
  object,
  camera,
  viewport,
  image,
  asset
) {
  const rect =
    worldObjectVisualRect(object);

  if (
    !rect ||
    !image ||
    !asset?.render
  ) {
    return;
  }

  const widthScale =
    Number.isFinite(
      asset.render.widthScale
    ) &&
    asset.render.widthScale > 0
      ? asset.render.widthScale
      : 1;
  const heightScale =
    Number.isFinite(
      asset.render.heightScale
    ) &&
    asset.render.heightScale > 0
      ? asset.render.heightScale
      : 1;
  const renderWidth =
    rect.width * widthScale;
  const renderHeight =
    rect.height * heightScale;
  const screenX =
    rect.x - camera.x;
  const screenY =
    rect.y - camera.y;

  if (
    isOffscreen(
      screenX,
      screenY,
      cullRadius(
        renderWidth,
        renderHeight
      ),
      viewport
    )
  ) {
    return;
  }

  ctx.save();
  ctx.translate(
    screenX,
    screenY
  );
  ctx.rotate(
    rect.rotation +
    degreesToRadians(
      asset.render.rotationOffsetDeg
    )
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
  resolveVisualAsset = null,
  objectCatalog =
    objectDefinitionCatalogV1
} = {}) {
  return Object.freeze({
    draw(ctx, { camera, viewport, objects, surface = null, materialRegistry = null }) {
      for (
        const object of
          resolveWorldObjectPlacements(
            objects ?? [],
            objectCatalog
          )
      ) {
        const visual =
          requireVisualAsset(
            object,
            imageLoader,
            resolveVisualAsset
          );

        if (!visual) continue;

        if (
          object.kind === 'bridge'
        ) {
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

        drawStaticImage(
          ctx,
          object,
          camera,
          viewport,
          visual.image,
          visual.asset
        );
        if (materialRegistry && surface?.rivers?.length && object.visual?.shoreContact) {
          const rect = worldObjectVisualRect(object);
          if (rect && !isOffscreen(
            rect.x - camera.x,
            rect.y - camera.y,
            cullRadius(rect.width, rect.height),
            viewport
          )) {
            drawShoreContacts(
              ctx,
              planObjectShoreContacts({ object, surface, materialRegistry }),
              camera,
              rect
            );
          }
        }
      }
    }
  });
}
