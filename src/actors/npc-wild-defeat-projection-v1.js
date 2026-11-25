// Read-only projection of Capture's authenticated AdventureSession victories.
// The author-owned WorldArea and reusable NPC definitions are never mutated.
// A defeated placed wild creature disappears only in the SAME saved game/area.
export function projectDefeatedPlacedWildV1(actors, victories=[], areaId=null){
 if(!Array.isArray(actors))throw new TypeError('Placed actors must be an array');
 if(!Array.isArray(victories))throw new TypeError('Adventure wild victories must be an array');
 if(typeof areaId!=='string'||!areaId||!victories.length)return actors;
 const defeated=new Set(victories.filter(v=>v?.areaId===areaId&&typeof v.actorId==='string')
  .map(v=>v.actorId));
 if(!defeated.size)return actors;
 return Object.freeze(actors.filter(actor=>
  actor?.npc?.kind!=='wild'||!defeated.has(actor.id)));
}
