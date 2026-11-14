// Derived presentation cache ONLY. The placedObjects array remains owned by
// the one WorldArea / Sculpt scene. Editor reads are always fresh; immutable
// playback placements can keep the same sorted projections between frames.
export function createSculptPlayObjectDrawCacheV1(resolve){
 if(typeof resolve!=='function')throw new TypeError('WorldObject resolver required');
 let lastSource=null,lastSorted=null;
 const sorted=placements=>resolve(placements).slice().sort(
  (a,b)=>a.transform.y-b.transform.y);
 return Object.freeze({
  get(placements,{playing=false}={}){
   if(!Array.isArray(placements))throw new TypeError('WorldObject placements required');
   if(!playing)return sorted(placements);
   if(lastSorted===null||lastSource!==placements){
    const next=sorted(placements);
    lastSource=placements;lastSorted=next;
   }
   return lastSorted;
  },
  invalidate(){lastSource=null;lastSorted=null;}
 });
}
