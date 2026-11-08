// A combat handoff may contain HP saved under an older creator policy.
// Combat OWNS the already projected fighter.maxHp; Exploration merely
// bounds the transient entry HP to it. Never mutate GenSRPG's Core save.
export function projectAdventureInitialCombatHpV1({savedHp,maxHp}={}){
 if(typeof maxHp!=='number'||!Number.isFinite(maxHp)||maxHp<0)
  throw new RangeError('Native Combat maxHp must be nonnegative finite');
 if(savedHp===null)return maxHp;
 if(typeof savedHp!=='number'||!Number.isFinite(savedHp)||savedHp<0)
  throw new RangeError('Saved Adventure creature HP must be nonnegative finite or null');
 return Math.min(savedHp,maxHp);
}
