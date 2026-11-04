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

// Exactly one Map Actor Renderer controls both display modes. Frame assets
// have already been registered/prepared by the same existing asset service.
function displayAssetId(visual,actor,timeSeconds){
 const animation=visual.animation;
 if(animation?.mode!=='frames')return visual.assetId;
 const sequence=actor.moving===true?animation.walk:animation.idle;
 if(!sequence?.length)return visual.assetId;
 const time=Math.max(0,Number.isFinite(timeSeconds)?timeSeconds:0);
 return sequence[Math.floor(time*animation.framesPerSecond)%sequence.length];
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

        const currentAssetId=displayAssetId(visual,actor,timeSeconds);
        const prepared=preparedVisuals.get(currentAssetId);

        if (!prepared) {
          throw new Error(`Map Actor visual not prepared: ${currentAssetId}`);
        }

        // Scale only the picture and contact shadow; movement stays
        // in World coordinates controlled elsewhere.
        const visualScale=Number.isFinite(actor.visualScale)&&actor.visualScale>=.25&&actor.visualScale<=2
          ?actor.visualScale:1;
        const worldHeight = visual.targetHeight * visualScale;
        const worldWidth =
          worldHeight * prepared.aspectRatio;
        const anchor = actorAnchor(visual, prepared);
        // A single picture retains the historical idle/walk movement;
        // authored sprite frames already contain motion and must not bounce.
        const bob = visual.animation?.mode==='frames'
          ?0:motionOffset(visual,actor,timeSeconds);
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
