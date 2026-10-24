// V76 R12: shared PRESENTATION-ONLY altitude cues.
// The World Model and Collision World alone own terrain height and traversal.
// Default sculpt plane is level 2. Levels 3..7 brighten progressively;
// levels 1 and 0 darken, with symmetric visual hero perspective scaling.
// No actual negative-height cells exist in sculpt schema v1.
export function sculptAltitudeVisualState(level,{baseline=2}={}){
  const current=Number.isFinite(level)?level:baseline;
  const base=Number.isFinite(baseline)?baseline:2;
  const steps=Math.max(-7,Math.min(7,current-base));
  const tint=steps>=0?Math.min(.30,steps*.052):
    -Math.min(.30,Math.abs(steps)*.078);
  const heroScale=Math.max(.82,Math.min(1.19,1+steps*.027));
  return Object.freeze({steps,tint,heroScale});
}
