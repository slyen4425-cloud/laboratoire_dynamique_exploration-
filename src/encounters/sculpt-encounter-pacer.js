export const SCULPT_ENCOUNTER_STEP_DISTANCE=240;
export function createSculptEncounterPacer(distance=SCULPT_ENCOUNTER_STEP_DISTANCE){
 if(!Number.isFinite(distance)||distance<=0)throw new RangeError('distance must be positive');
 let accumulated=0;
 return Object.freeze({
  advance(moved){
   if(!Number.isFinite(moved)||moved<=0)return false;
   accumulated+=moved;
   if(accumulated<distance)return false;
   accumulated%=distance;
   return true;
  },
  reset(){accumulated=0;}
 });
}
