function actorAnchor(visual, prepared) {
  return Object.freeze({
    x:
      Number.isFinite(visual.anchorOverride?.x)
        ? visual.anchorOverride.x
        : prepared.anchor.x,
    y:
      Number.isFinite(visual.anchorOverride?.y)
        ? visual.anchorOverride.y
        : prepared.anchor.y
  });
}

function motionOffset(visual, actor, timeSeconds) {
  const moving = actor.moving === true;
  const amplitude = moving
    ? visual.motion.walkAmplitude
    : visual.motion.idleAmplitude;
  const frequency = moving
    ? visual.motion.walkFrequency
    : visual.motion.idleFrequency;

  return Math.sin(timeSeconds * Math.PI * 2 * frequency) * amplitude;
}

export function createMapActorRenderer({
  preparedVisuals
} = {}) {
  if (!preparedVisuals || typeof preparedVisuals.get !== 'function') {
    throw new Error('Map Actor Renderer requires preparedVisuals');
  }

  return Object.freeze({
    draw(ctx, {
      camera,
      actors,
      timeSeconds = 0
    }) {
      for (const actor of Array.isArray(actors) ? actors : []) {
        const visual = actor.mapVisual;
        if (!visual?.assetId) continue;

        const prepared = preparedVisuals.get(visual.assetId);

        if (!prepared) {
          throw new Error(
            `Map Actor visual not prepared: ${visual.assetId}`
          );
        }

        const worldHeight = visual.targetHeight;
        const worldWidth =
          worldHeight * prepared.aspectRatio;
        const anchor = actorAnchor(visual, prepared);
        const bob = motionOffset(
          visual,
          actor,
          timeSeconds
        );
        const screenX = actor.x - camera.x;
        const screenY = actor.y - camera.y;

        if (visual.shadow.enabled) {
          ctx.save();
          ctx.globalAlpha = visual.shadow.opacity;
          ctx.fillStyle = '#000';
          ctx.beginPath();
          ctx.ellipse(
            screenX,
            screenY + 1,
            worldWidth * visual.shadow.widthRatio / 2,
            worldHeight * visual.shadow.heightRatio / 2,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();
        }

        const desiredFacingX =
          Number.isFinite(actor.facingX) && actor.facingX < 0
            ? -1
            : 1;
        const sourceFacingX =
          visual.sourceFacingX === -1 ? -1 : 1;
        const shouldMirror =
          visual.mirrorHorizontal &&
          desiredFacingX !== sourceFacingX;

        ctx.save();
        ctx.translate(screenX, screenY - bob);
        ctx.scale(shouldMirror ? -1 : 1, 1);
        ctx.drawImage(
          prepared.source,
          -worldWidth * anchor.x,
          -worldHeight * anchor.y,
          worldWidth,
          worldHeight
        );
        ctx.restore();
      }
    }
  });
}
