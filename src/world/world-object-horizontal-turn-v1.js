// Single visual interpretation of a placed 2D WorldObject's authored rotation.
// Historic placements remain planar until their author changes the angle.
// Ground objects (bridges/stairs/ramps) retain physical planar rotation.
const PLANAR_KINDS = new Set(['bridge', 'stairs', 'ramp', 'waterfall', 'water', 'ground', 'portal']);

export function worldObjectSupportsHorizontalTurnV1(kind) {
  return !PLANAR_KINDS.has(kind);
}

export function worldObjectHorizontalTurnEnabledV1(object) {
  return object?.transform?.rotationAxis === 'horizontal' &&
    worldObjectSupportsHorizontalTurnV1(object?.kind);
}

export function worldObjectHorizontalTurnScaleXV1(degrees = 0) {
  const angle = Number(degrees);
  return Number.isFinite(angle) ? Math.cos(angle * Math.PI / 180) : 1;
}
