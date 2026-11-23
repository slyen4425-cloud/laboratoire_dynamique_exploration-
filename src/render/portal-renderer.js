import {
  resolvePortalTriggerPoint
} from '../world/portal-model.js?rev=worldarea-portal-v1-exit-marker';

function drawExitMarker(ctx, point, visual, camera) {
  const x = point.x - camera.x;
  const y = point.y - camera.y;
  const radius = Math.max(18, point.radius);

  ctx.save();
  ctx.translate(x, y);

  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(244, 208, 111, 0.22)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(255, 234, 163, 0.95)';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-10, -5);
  ctx.lineTo(0, 7);
  ctx.lineTo(10, -5);
  ctx.strokeStyle = 'rgba(255, 244, 205, 1)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();

  if (visual.label) {
    ctx.font = '700 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillStyle = 'rgba(255, 248, 220, 0.98)';
    ctx.fillText(visual.label, 0, -radius - 8);
  }

  ctx.restore();
}

// The existing Material Loader remains the only owner of texture bytes.
// The Portal renderer only asks for its already-decoded official image.
function drawPortalArt(ctx,point,portal,camera,resolveTexture){
  const radius=Math.max(18,point.radius);
  const x=point.x-camera.x,y=point.y-camera.y;
  ctx.save();ctx.translate(x,y);
  const texture=portal.visual.marker==='texture'&&
    typeof resolveTexture==='function'
      ?resolveTexture(portal.visual.textureMaterialId):null;
  if(texture){
    ctx.drawImage(texture,-radius,-radius,radius*2,radius*2);
  }else{
    const gradient=ctx.createRadialGradient(0,0,1,0,0,radius);
    gradient.addColorStop(0,'rgba(0,0,0,.96)');
    gradient.addColorStop(.55,'rgba(3,3,9,.78)');
    gradient.addColorStop(1,'rgba(3,3,9,0)');
    ctx.fillStyle=gradient;
    ctx.beginPath();ctx.ellipse(0,0,radius,Math.max(7,radius*.65),0,0,Math.PI*2);
    ctx.fill();
  }
  ctx.restore();
}

export function createPortalRenderer({resolveTexture=null}={}) {
  return Object.freeze({
    draw(ctx, {
      camera,
      worldDocument,
      currentAreaId
    }) {
      if (!ctx || !worldDocument) return;

      for (const portal of worldDocument.portals) {
        if (
          portal.enabled !== true ||
          portal.sourceAreaId !== currentAreaId ||
          portal.visual?.visible !== true
        ) {
          continue;
        }

        const point = resolvePortalTriggerPoint(
          worldDocument.areas,
          portal
        );
        if (!point) continue;

        if(portal.visual.marker==='shadow'||portal.visual.marker==='texture'){
          drawPortalArt(ctx,point,portal,camera,resolveTexture);
        }else if (
          portal.visual.marker === 'exit' ||
          portal.visual.marker === 'entry' ||
          portal.visual.marker === 'portal'
        ) {
          drawExitMarker(ctx,point,portal.visual,camera);
        }
      }
    }
  });
}
