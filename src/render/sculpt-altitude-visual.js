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
  // V76 R13: a more legible perspective step (3.8% rather than 2.7%).
  // Presentation only: never feeds actor radius, collisions or navigation.
  const heroScale=Math.max(.75,Math.min(1.24,1+steps*.038));
  return Object.freeze({steps,tint,heroScale});
}
