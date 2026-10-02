import {
  resolvePortalTriggerPoint
} from '../world/portal-model.js';

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

export function createPortalRenderer() {
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

        if (
          portal.visual.marker === 'exit' ||
          portal.visual.marker === 'entry' ||
          portal.visual.marker === 'portal'
        ) {
          drawExitMarker(
            ctx,
            point,
            portal.visual,
            camera
          );
        }
      }
    }
  });
}
