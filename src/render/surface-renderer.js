function smoothPath(ctx, points, camera) {
  if (!points || points.length < 2) return;

  const first = points[0];
  ctx.moveTo(first.x - camera.x, first.y - camera.y);

  if (points.length === 2) {
    const last = points[1];
    ctx.lineTo(last.x - camera.x, last.y - camera.y);
    return;
  }

  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = (current.x + next.x) / 2 - camera.x;
    const midY = (current.y + next.y) / 2 - camera.y;

    ctx.quadraticCurveTo(
      current.x - camera.x,
      current.y - camera.y,
      midX,
      midY
    );
  }

  const penultimate = points[points.length - 2];
  const last = points[points.length - 1];

  ctx.quadraticCurveTo(
    penultimate.x - camera.x,
    penultimate.y - camera.y,
    last.x - camera.x,
    last.y - camera.y
  );
}

function strokePath(ctx, item, camera, width, strokeStyle, alpha = 1) {
  ctx.save();
  ctx.beginPath();
  smoothPath(ctx, item.points, camera);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = strokeStyle;
  ctx.globalAlpha = alpha;
  ctx.stroke();
  ctx.restore();
}

function hash2D(x, y) {
  let hash = Math.imul(x, 0x45d9f3b) ^ Math.imul(y, 0x27d4eb2d);
  hash = Math.imul(hash ^ (hash >>> 16), 0x45d9f3b);
  return (hash ^ (hash >>> 16)) >>> 0;
}

function drawBase(ctx, camera, viewport) {
  ctx.fillStyle = '#536247';
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const spacing = 260;
  const minX = Math.floor(camera.x / spacing) - 1;
  const minY = Math.floor(camera.y / spacing) - 1;
  const maxX = Math.ceil((camera.x + viewport.width) / spacing) + 1;
  const maxY = Math.ceil((camera.y + viewport.height) / spacing) + 1;

  for (let cellY = minY; cellY <= maxY; cellY += 1) {
    for (let cellX = minX; cellX <= maxX; cellX += 1) {
      const hash = hash2D(cellX, cellY);
      const jitterX = ((hash & 255) / 255 - 0.5) * 150;
      const jitterY = (((hash >>> 8) & 255) / 255 - 0.5) * 150;
      const x = cellX * spacing + spacing / 2 + jitterX - camera.x;
      const y = cellY * spacing + spacing / 2 + jitterY - camera.y;
      const radius = 150 + ((hash >>> 16) & 63);

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
      const variant = (hash >>> 22) % 3;

      if (variant === 0) {
        gradient.addColorStop(0, 'rgba(111,92,57,0.14)');
      } else if (variant === 1) {
        gradient.addColorStop(0, 'rgba(70,90,48,0.16)');
      } else {
        gradient.addColorStop(0, 'rgba(91,78,50,0.12)');
      }
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
  }
}

function drawRoad(ctx, road, camera) {
  strokePath(ctx, road, camera, road.width + 18, '#4c4436');
  strokePath(ctx, road, camera, road.width + 10, '#746044');
  strokePath(ctx, road, camera, road.width, '#9a7a52');
  strokePath(ctx, road, camera, Math.max(2, road.width * 0.08), '#b99a6b', 0.28);
}

function drawRiver(ctx, river, camera) {
  strokePath(ctx, river, camera, river.width + 20, '#3f4a37');
  strokePath(ctx, river, camera, river.width + 10, '#5c6748');
  strokePath(ctx, river, camera, river.width, '#3f7b91');
  strokePath(
    ctx,
    river,
    camera,
    Math.max(3, river.width * 0.1),
    '#8fc0cb',
    0.3
  );
}

export function createSurfaceRenderer() {
  return Object.freeze({
    draw(ctx, { camera, viewport, surface }) {
      drawBase(ctx, camera, viewport);

      for (const road of surface.routes) {
        drawRoad(ctx, road, camera);
      }

      for (const river of surface.rivers) {
        drawRiver(ctx, river, camera);
      }
    }
  });
}
