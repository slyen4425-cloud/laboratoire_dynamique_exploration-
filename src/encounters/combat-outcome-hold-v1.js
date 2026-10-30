// Presentation lifecycle only. The Combat Session decides win/loss, Capture
// CombatResult persists it, and Exploration owns the actual World return.
// Future XP/drop results UI can replace this one view without moving authority.
export const CAPTURE_COMBAT_OUTCOME_HOLD_MS_V1 = 3000;
export function createCombatOutcomeHoldV1({
  onRelease,delayMs=CAPTURE_COMBAT_OUTCOME_HOLD_MS_V1,
  schedule=(fn,ms)=>globalThis.setTimeout(fn,ms),
  cancel=id=>globalThis.clearTimeout(id)
}={}) {
  if(typeof onRelease!=='function'||typeof schedule!=='function'||typeof cancel!=='function')
    throw new TypeError('Outcome presentation requires callbacks');
  if(!Number.isFinite(delayMs)||delayMs<1000||delayMs>10000)
    throw new RangeError('Invalid combat outcome presentation duration');
  let pending=null, timer=null, disposed=false;
  return Object.freeze({
    start(outcome) {
      if(disposed||pending!==null)return false;
      if(!['victory','defeat','escape'].includes(outcome))
        throw new RangeError('Invalid authoritative Combat outcome');
      pending=outcome;
      timer=schedule(()=>{
        timer=null;
        if(disposed)return;
        const completed=pending;
        pending=null;
        onRelease(completed);
      },delayMs);
      return true;
    },
    get pending(){return pending;},
    dispose(){
      if(disposed)return;
      disposed=true;
      if(timer!==null){cancel(timer);timer=null;}
      pending=null;
    }
  });
}
