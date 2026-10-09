import {
  worldAreaBoundaryPoints
} from '../world/world-area-geometry.js?rev=interior-geometry-authoring-v1-r2';

export function clipWorldArea(
  ctx,
  area,
  camera = { x: 0, y: 0 }
) {
  if (!ctx || !area) {
    return false;
  }

  const points =
    worldAreaBoundaryPoints(area);

  if (points.length < 3) {
    return false;
  }

  const cameraX =
    Number.isFinite(camera?.x)
      ? camera.x
      : 0;
  const cameraY =
    Number.isFinite(camera?.y)
      ? camera.y
      : 0;

  ctx.beginPath();
  ctx.moveTo(
    points[0].x - cameraX,
    points[0].y - cameraY
  );

  for (
    let index = 1;
    index < points.length;
    index += 1
  ) {
    ctx.lineTo(
      points[index].x - cameraX,
      points[index].y - cameraY
    );
  }

  ctx.closePath();
  ctx.clip();

  return true;
}
