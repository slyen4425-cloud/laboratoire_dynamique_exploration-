// Pure, read-only selection of one frame from a WorldObject sprite atlas.
// Geometry, placement, collisions and visual asset ownership never change.
export function worldObjectAnimationFrame(asset, timeSeconds = 0) {
  const a = asset?.animation;
  if (!a || !Number.isInteger(a.frames) || a.frames < 1 ||
    !Number.isInteger(a.columns) || a.columns < 1 ||
    !Number.isInteger(a.frameWidth) || a.frameWidth < 1 ||
    !Number.isInteger(a.frameHeight) || a.frameHeight < 1 ||
    !Number.isFinite(a.fps) || a.fps <= 0) return null;
  const t = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
  const frame = Math.floor(t * a.fps) % a.frames;
  return Object.freeze({index: frame,
    x: (frame % a.columns) * a.frameWidth,
    y: Math.floor(frame / a.columns) * a.frameHeight,
    width: a.frameWidth, height: a.frameHeight
  });
}

export function drawWorldObjectSprite(ctx, image, asset, rect, timeSeconds = 0) {
  const frame = worldObjectAnimationFrame(asset, timeSeconds);
  if (frame) {
    ctx.drawImage(image, frame.x, frame.y, frame.width, frame.height,
      rect.x, rect.y, rect.width, rect.height);
    return frame.index;
  }
  ctx.drawImage(image, rect.x, rect.y, rect.width, rect.height);
  return null;
}
