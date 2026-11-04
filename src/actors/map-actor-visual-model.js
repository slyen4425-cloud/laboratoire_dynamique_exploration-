export const MAP_ACTOR_VISUAL_SCHEMA_VERSION = 1;

export const MAP_ACTOR_ROLE_DEFAULTS = Object.freeze({
  hero: Object.freeze({ targetHeight: 78 }),
  npc: Object.freeze({ targetHeight: 72 }),
  creature: Object.freeze({ targetHeight: 84 })
});

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max
    ? value
    : fallback;
}

function normalizeRole(value) {
  return value === 'npc' || value === 'creature'
    ? value
    : 'hero';
}

// Frames are existing prepared MapActor image references, never file paths
// nor a second sprite renderer. The visual owner selects the presentation;
// the Exploration navigation/collision owner still determines movement.
function animationAssetIds(value,field,{required=false}={}){
 if(value===undefined){
  if(required)throw new TypeError(field+' frames are required');
  return Object.freeze([]);
 }
 if(!Array.isArray(value)||value.length>(32)|| (required&&value.length===0))
  throw new RangeError(field+' frames must contain 1-32 registered asset references');
 const ids=new Set();
 for(const id of value){
  if(typeof id!=='string'||!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,129}$/.test(id))
   throw new TypeError('Invalid Map Actor '+field+' asset ID');
  if(ids.has(id))throw new RangeError('Duplicate Map Actor '+field+' frame '+id);
  ids.add(id);
 }
 return Object.freeze([...ids]);
}

function normalizeActorAnimation(raw){
 if(raw===undefined)return Object.freeze({mode:'image'});
 if(!raw||typeof raw!=='object'||Array.isArray(raw))
  throw new TypeError('Map Actor animation must be a configuration object');
 const keys=Object.keys(raw);
 if(raw.mode==='image'){
  if(keys.some(k=>k!=='mode'))throw new TypeError('Image motion does not support sprite frames');
  return Object.freeze({mode:'image'});
 }
 if(raw.mode!=='frames')throw new RangeError('Unknown Map Actor animation mode');
 if(keys.some(k=>!['mode','framesPerSecond','idle','walk'].includes(k)))
  throw new TypeError('Unknown Map Actor animation configuration field');
 if(typeof raw.framesPerSecond!=='number'||!Number.isFinite(raw.framesPerSecond)||
    raw.framesPerSecond<1||raw.framesPerSecond>30)
  throw new RangeError('Map Actor animation framesPerSecond must be 1-30');
 return Object.freeze({
  mode:'frames',framesPerSecond:raw.framesPerSecond,
  idle:animationAssetIds(raw.idle,'idle'),
  walk:animationAssetIds(raw.walk,'walk',{required:true})
 });
}

export function normalizeMapActorVisual(raw = {}) {
  const source = raw && typeof raw === 'object' ? raw : {};
  const role = normalizeRole(source.role);
  const defaults = MAP_ACTOR_ROLE_DEFAULTS[role];

  return Object.freeze({
    schemaVersion: MAP_ACTOR_VISUAL_SCHEMA_VERSION,
    assetId:
      typeof source.assetId === 'string' && source.assetId.trim()
        ? source.assetId.trim()
        : null,
    role,
    animation:normalizeActorAnimation(source.animation),
    targetHeight: finiteNumber(
      source.targetHeight,
      defaults.targetHeight,
      { min: 24, max: 240 }
    ),
    mirrorHorizontal: source.mirrorHorizontal !== false,
    sourceFacingX: source.sourceFacingX === -1 ? -1 : 1,
    anchorOverride: Object.freeze({
      x: finiteNumber(
        source.anchorX ?? source.anchorOverride?.x,
        null,
        { min: 0, max: 1 }
      ),
      y: finiteNumber(
        source.anchorY ?? source.anchorOverride?.y,
        null,
        { min: 0, max: 1 }
      )
    }),
    shadow: Object.freeze({
      enabled: source.shadow?.enabled !== false,
      widthRatio: finiteNumber(
        source.shadow?.widthRatio,
        0.58,
        { min: 0.1, max: 1.5 }
      ),
      heightRatio: finiteNumber(
        source.shadow?.heightRatio,
        0.16,
        { min: 0.05, max: 0.6 }
      ),
      opacity: finiteNumber(
        source.shadow?.opacity,
        0.24,
        { min: 0, max: 0.8 }
      )
    }),
    motion: Object.freeze({
      idleAmplitude: finiteNumber(
        source.motion?.idleAmplitude,
        1.2,
        { min: 0, max: 8 }
      ),
      walkAmplitude: finiteNumber(
        source.motion?.walkAmplitude,
        3.2,
        { min: 0, max: 12 }
      ),
      idleFrequency: finiteNumber(
        source.motion?.idleFrequency,
        1.25,
        { min: 0.1, max: 8 }
      ),
      walkFrequency: finiteNumber(
        source.motion?.walkFrequency,
        5.4,
        { min: 0.5, max: 16 }
      )
    })
  });
}
