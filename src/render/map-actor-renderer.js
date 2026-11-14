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
// Convert actual world movement intent to one of the eight authored views.
// Visual selection only; the actor's world motion stays external.
export function mapActorCompassDirectionV1(actor={}){
 const x=Number(actor.directionX),y=Number(actor.directionY);
 if(!Number.isFinite(x)||!Number.isFinite(y)||Math.hypot(x,y)<.001)
   return 'S';
 const angle=Math.atan2(y,x);
 const index=Math.round(angle/(Math.PI/4));
 return ['E','SE','S','SW','W','NW','N','NE'][(index+8)%8];
}
function displayAssetId(visual,actor,timeSeconds){
 const animation=visual.animation;
 if(animation?.mode==='directions'){
   const frames=animation.directions[mapActorCompassDirectionV1(actor)];
   if(!frames?.length)throw new Error('Missing authored compass sprite');
   const time=Math.max(0,Number.isFinite(timeSeconds)?timeSeconds:0);
   return actor.moving===true
     ?frames[Math.floor(time*animation.framesPerSecond)%frames.length]
     :frames[0];
 }
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
        // One renderer owns authored oscillation in image, frames and compass modes.
         const bob = motionOffset(visual,actor,timeSeconds);
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
          visual.animation?.mode!=='directions' &&
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
