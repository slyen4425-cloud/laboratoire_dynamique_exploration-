// Presentation-only smoothing when the actor steps to the next 2.5D height.
// The native Collision World remains solely responsible for traversability.
export function sculptVisualHeightStep(current,target,elapsedMs,{settleMs=95}={}){
  if(!Number.isFinite(target))return Number.isFinite(current)?current:0;
  if(!Number.isFinite(current))return target;
  const dt=Math.max(0,Math.min(250,Number(elapsedMs)||0));
  const tau=Math.max(1,Number(settleMs)||95);
  if(dt===0)return current;
  const next=current+(target-current)*(1-Math.exp(-dt/tau));
  return Math.abs(target-next)<.004?target:next;
}
