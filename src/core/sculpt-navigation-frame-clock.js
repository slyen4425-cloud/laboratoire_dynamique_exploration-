// Preview-only animation clock helper. Does not own x/y movement or collisions.
// Split real elapsed time into collision-safe substeps instead of discarding
// time when the renderer drops below 30 fps on a phone.
export const SCULPT_NAV_CLOCK=Object.freeze({maxFrameMs:250,maxStepMs:20});
export function sculptNavigationFrameSteps(elapsedMs,{
  maxFrameMs=SCULPT_NAV_CLOCK.maxFrameMs,
  maxStepMs=SCULPT_NAV_CLOCK.maxStepMs
}={}){
  if(!Number.isFinite(elapsedMs)||elapsedMs<=0)return Object.freeze([]);
  const frame=Math.min(Math.max(0,elapsedMs),maxFrameMs);
  const count=Math.max(1,Math.ceil(frame/maxStepMs));
  return Object.freeze(Array.from({length:count},()=>frame/count/1000));
}
