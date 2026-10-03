function finite(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, number));
}

export function createEncounterPaintPreset({
  defaultElementId = 'fire'
} = {}) {
  return Object.freeze({
    encounterChancePercent: 20,
    width: 260,
    checkDistance: 160,
    priority: 0,
    selectorKind: 'element',
    selectorId:
      typeof defaultElementId === 'string' &&
      defaultElementId.trim()
        ? defaultElementId.trim()
        : 'fire',
    weight: 100
  });
}

export function updateEncounterPaintPreset(
  current,
  patch = {}
) {
  const base = current ?? createEncounterPaintPreset();
  const selectorKind =
    patch.selectorKind === 'creature'
      ? 'creature'
      : patch.selectorKind === 'element'
        ? 'element'
        : base.selectorKind;

  const selectorId =
    typeof patch.selectorId === 'string' &&
    patch.selectorId.trim()
      ? patch.selectorId.trim()
      : base.selectorId;

  return Object.freeze({
    encounterChancePercent: finite(
      patch.encounterChancePercent,
      base.encounterChancePercent,
      0,
      100
    ),
    width: finite(
      patch.width,
      base.width,
      24,
      1200
    ),
    checkDistance: finite(
      patch.checkDistance,
      base.checkDistance,
      20,
      800
    ),
    priority: finite(
      patch.priority,
      base.priority,
      0,
      100
    ),
    selectorKind,
    selectorId,
    weight: finite(
      patch.weight,
      base.weight,
      1,
      100
    )
  });
}

export function encounterEditorAvailability(hasLayer) {
  return Object.freeze({
    selectorEnabled: true,
    chanceEnabled: true,
    brushEnabled: true,
    deleteLayerEnabled: Boolean(hasLayer),
    addTableEntryEnabled: Boolean(hasLayer)
  });
}
