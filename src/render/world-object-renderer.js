import {
  bridgeVisualRect,
  worldObjectVisualRect
} from '../world/world-object-model.js?rev=collision-boundary-worldobject-obstacles-v1';
import {
  resolveWorldObjectPlacements
} from '../world/world-object-placement-model.js?rev=collision-boundary-worldobject-obstacles-v1-waterfalls-v3';
import {
  objectDefinitionCatalogV1
} from '../objects/object-definition-catalog.js?rev=collision-boundary-worldobject-obstacles-v1-waterfalls-v3';

import {drawWorldObjectSprite} from './world-object-frame-selector.js?rev=waterfalls-v3';
import {worldObjectShadowMaskV1} from './world-object-shadow-silhouette-v1.js';

function degreesToRadians(value) {
  return Number.isFinite(value) ? value * Math.PI / 180 : 0;
}

// Contact shadow for native WorldObjects, drawn with the SAME canvas owner.
// Actor shadows remain with MapActorRenderer, relief with SculptTerrain.
// Never cast a second shadow for walkable terrain, bridges or waterfalls.
export function worldObjectContactShadowV1({kind,width,height,footOffset=0,pitch=1}={}){
 if(['bridge','stairs','ramp','waterfall','water','ground','portal'].includes(kind)||
    !Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)
  return null;
 const projectedPitch=Number.isFinite(pitch)?Math.max(.25,Math.min(1,pitch)):1;
 const radiusX=Math.max(3,Math.min(width*.38,120));
 const radiusY=Math.max(2,Math.min(height*.052,13))*projectedPitch;
 return Object.freeze({x:0,y:footOffset+1,radiusX,radiusY,opacity:.17});
}
export function drawWorldObjectContactShadowV1(ctx,args){
 const shadow=worldObjectContactShadowV1(args);
 if(!shadow)return false;
 if(args?.image){
  const mask=worldObjectShadowMaskV1(args.image,args.asset,
   {groundContact:args.kind==='building'});
  const projection=worldObjectShadowProjectionV1(args);
  if(!mask||!projection||typeof ctx?.transform!=='function')return false;
  const {width,height}=args;
  const srcWidth=mask.right-mask.left,srcHeight=mask.bottom-mask.top;
  // The alpha silhouette's lowest opaque pixel meets the exact WorldObject
  // foot. Screen-space projection gives an elongated, directional cast.
  ctx.save();
  ctx.translate(0,projection.footY);
  ctx.transform(1,0,projection.shear,projection.flatten,0,0);
  ctx.globalAlpha=.25;
  ctx.drawImage(mask.canvas,mask.left,mask.top,srcWidth,srcHeight,
   width*(mask.left/mask.w-.5),-height*(srcHeight/mask.h),
   width*(srcWidth/mask.w),height*(srcHeight/mask.h));
  ctx.restore();
  // Same native WorldObject draw pass: a grounded border along the real
  // front AND lateral walls, never a new shadow layer or stored decal.
  if(args.kind==='building'&&mask.contactCanvas){
   ctx.save();
   ctx.globalAlpha=.78;
   ctx.drawImage(mask.contactCanvas,0,0,mask.w,mask.contactHeight,
    -width/2,-height/2,width,height*(mask.contactHeight/mask.h));
   ctx.restore();
  }
  return true;
 }
 // Compatibility for pure geometry callers that have no source image.
 if(typeof ctx?.ellipse!=='function')return false;
 ctx.save();ctx.beginPath();
 ctx.ellipse(shadow.x,shadow.y,shadow.radiusX,shadow.radiusY,0,0,Math.PI*2);
 ctx.fillStyle='rgba(0,0,0,'+shadow.opacity+')';
 ctx.fill();ctx.restore();
 return true;
}

// Derived display-only alpha mask, cached per official image. Generating a
// dark silhouette once prevents a new per-frame filter or decal authority.
// In particular a tree projects its actual canopy and trunk, not an oval.
export function worldObjectShadowProjectionV1({width,height,footOffset=0,pitch=1}={}){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return null;
 return Object.freeze({
  footY:footOffset+1,
  shear:-.48,
  flatten:.38*(Number.isFinite(pitch)?Math.max(.45,Math.min(1,pitch)):1)
 });
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

function drawStaticImage(
  ctx,
  object,
  camera,
  viewport,
  image,
  asset,
  timeSeconds = 0
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
  drawWorldObjectContactShadowV1(ctx,{kind:object.kind,width:renderWidth,height:renderHeight,footOffset:renderHeight/2,image,asset});
  drawWorldObjectSprite(ctx, image, asset,
    {x: -renderWidth / 2, y: -renderHeight / 2,
      width: renderWidth, height: renderHeight}, timeSeconds);
  ctx.restore();
}

export function createWorldObjectRenderer({
  imageLoader = null,
  resolveVisualAsset = null,
  objectCatalog =
    objectDefinitionCatalogV1
} = {}) {
  return Object.freeze({
    draw(ctx, { camera, viewport, objects, timeSeconds = 0 }) {
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
          visual.asset,
          timeSeconds
        );
      }
    }
  });
}
