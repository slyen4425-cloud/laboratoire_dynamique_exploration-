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
import {normalizeWorldObjectShadowSettingsV1,WORLD_OBJECT_SHADOW_DEFAULT_V1,worldObjectShadowProfileForAssetV1} from '../world/world-object-shadow-settings-v1.js';

import {worldShadowLocalRotationV1} from '../world/world-lighting-v1.js';
function degreesToRadians(value) {
  return Number.isFinite(value) ? value * Math.PI / 180 : 0;
}

// Contact shadow for native WorldObjects, drawn with the SAME canvas owner.
// Actor shadows remain with MapActorRenderer, relief with SculptTerrain.
// Never cast a second shadow for walkable terrain, bridges or waterfalls.
export function worldObjectContactShadowV1({kind,width,height,footOffset=0,pitch=1,shadow=null}={}){
 if(['bridge','stairs','ramp','waterfall','water','ground','portal'].includes(kind)||
    !Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)
  return null;
 const projectedPitch=Number.isFinite(pitch)?Math.max(.25,Math.min(1,pitch)):1;
 const settings=normalizeWorldObjectShadowSettingsV1(shadow)??WORLD_OBJECT_SHADOW_DEFAULT_V1;
 return Object.freeze({
  x:width*settings.offsetXPct/100,
  y:footOffset+1+height*settings.offsetYPct/100,
  radiusX:Math.max(3,Math.min(width*.38,120))*settings.widthPct/100,
  radiusY:Math.max(2,Math.min(height*.052,13))*projectedPitch*settings.heightPct/100,
  opacity:.17*settings.opacityPct/25
 });
}
export function drawWorldObjectContactShadowV1(ctx,args){
 const contact=worldObjectContactShadowV1(args);
 if(!contact)return false;
 if(args?.image){
  const mask=worldObjectShadowMaskV1(args.image,args.asset,args.lighting?.shadowColor);
  const projection=worldObjectShadowProjectionV1(args);
  if(mask&&projection&&typeof ctx?.transform==='function'){
   const {width,height}=args;
   // ONE silhouette and ONE renderer for buildings, trees and all other
   // eligible image assets. Last visible pixel stays anchored at their foot.
   const srcWidth=mask.right-mask.left,srcHeight=mask.bottom-mask.top;
   ctx.save();
   ctx.translate(projection.x,projection.footY);
   // Rotate the single projected mask about its existing ground anchor.
   const theta=args.lighting&&projection.rotationDeg===undefined?
    worldShadowLocalRotationV1(args.lighting.directionDeg,args.objectAngle,args.flipX,projection.flatten,projection.shear):
    degreesToRadians(projection.rotationDeg??0);
   const cos=Math.cos(theta),sin=Math.sin(theta);
   ctx.transform(projection.scaleX*cos,projection.scaleX*sin,
    projection.shear*cos-projection.flatten*sin,
    projection.shear*sin+projection.flatten*cos,0,0);
   ctx.globalAlpha=projection.opacity;
   ctx.drawImage(mask.canvas,mask.left,mask.top,srcWidth,srcHeight,
    width*(mask.left/mask.w-.5),-height*(srcHeight/mask.h),
    width*(srcWidth/mask.w),height*(srcHeight/mask.h));
   ctx.restore();
   drawWorldObjectAmbientContactV1(ctx,args,contact);
   return true;
  }
 }
 // Subtle foot contact ONLY when the image cannot supply an alpha mask;
 // never stack a second oval/decal over a successful real silhouette.
 if(typeof ctx?.ellipse!=='function')return false;
 ctx.save();ctx.beginPath();
 ctx.ellipse(contact.x,contact.y,contact.radiusX,contact.radiusY,
  degreesToRadians(normalizeWorldObjectShadowSettingsV1(args?.shadow)?.rotationDeg??0),0,Math.PI*2);
 ctx.fillStyle='rgba(0,0,0,'+contact.opacity+')';
 ctx.fill();ctx.restore();
 return true;
}
// Derived display-only alpha mask, cached per official image. Generating a
// dark silhouette once prevents a new per-frame filter or decal authority.
// In particular a tree projects its actual canopy and trunk, not an oval.
function drawWorldObjectAmbientContactV1(ctx,args,contact){
 const alpha=(args.lighting?.ambientOcclusionPct??0)/100;
 if(!alpha||typeof ctx.createRadialGradient!=='function')return;
 const rx=Math.max(3,contact.radiusX*.72),ry=Math.max(2,contact.radiusY*.8);
 ctx.save();ctx.translate(contact.x,contact.y);ctx.scale(rx,ry);
 const g=ctx.createRadialGradient(0,0,0,0,0,1);
 g.addColorStop(0,'rgba(0,0,0,'+alpha+')');g.addColorStop(1,'rgba(0,0,0,0)');
 ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();
}
export function worldObjectShadowProjectionV1({width,height,footOffset=0,pitch=1,shadow=null,lighting=null}={}){
 if(!Number.isFinite(width)||width<=0||!Number.isFinite(height)||height<=0)return null;
 const settings=normalizeWorldObjectShadowSettingsV1(shadow)??WORLD_OBJECT_SHADOW_DEFAULT_V1;
 return Object.freeze({
  x:width*settings.offsetXPct/100,
  footY:footOffset+1+height*settings.offsetYPct/100,
  scaleX:settings.widthPct/100,
  opacity:(shadow?settings.opacityPct:(lighting?.shadowOpacityPct??settings.opacityPct))/100,
  shear:-.48,
  ...(settings.rotationDeg?{rotationDeg:settings.rotationDeg}:{}),
  flatten:(lighting?lighting.flattenPct/100:.38)*(Number.isFinite(pitch)?Math.max(.45,Math.min(1,pitch)):1)*
    settings.heightPct/100
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
  if(bridge.transform?.flipX === true) ctx.scale(-1, 1);
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
  timeSeconds = 0,
  objectShadowProfiles = [], lighting = null
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
  // One canvas transform mirrors both the silhouette shadow and the sprite.
  if(object.transform?.flipX === true) ctx.scale(-1, 1);
  drawWorldObjectContactShadowV1(ctx,{kind:object.kind,width:renderWidth,height:renderHeight,footOffset:renderHeight/2,image,asset,shadow:object.shadow??worldObjectShadowProfileForAssetV1(objectShadowProfiles,object.visual?.assetId),lighting,objectAngle:rect.rotation+degreesToRadians(asset.render.rotationOffsetDeg),flipX:object.transform?.flipX===true});
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
    draw(ctx, { camera, viewport, objects, timeSeconds = 0, objectShadowProfiles = [], lighting = null }) {
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
          timeSeconds,
          objectShadowProfiles, lighting
        );
      }
    }
  });
}
