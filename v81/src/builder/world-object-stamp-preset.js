// A placement brush preset is ephemeral UI state, never an independent WorldObject.
// Only copy reusable authoring properties: never IDs, positions, or spatial links.
function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

export function copyWorldObjectAsStamp(source) {
  if (!source || typeof source.objectDefinitionId !== 'string' ||
      !source.objectDefinitionId.trim()) return null;

  const variant = source.overrides?.visualVariantId;
  return Object.freeze({
    objectDefinitionId: source.objectDefinitionId,
    rotationDeg: finite(source.transform?.rotationDeg, 0),
    scaleX: finite(source.transform?.scaleX, 1),
    scaleY: finite(source.transform?.scaleY, 1),
    visualVariantId: typeof variant === 'string' && variant.trim()
      ? variant.trim() : null
  });
}

export function worldObjectStampInput({
  definitionId, preset = null, point, area
} = {}) {
  if (typeof definitionId !== 'string' || !definitionId.trim() ||
      !point || !area) return null;

  const copied = preset?.objectDefinitionId === definitionId ? preset : null;
  return {
    objectDefinitionId: definitionId,
    transform: {
      x: Math.max(0, Math.min(finite(area.width, 0), finite(point.x, 0))),
      y: Math.max(0, Math.min(finite(area.height, 0), finite(point.y, 0))),
      rotationDeg: copied?.rotationDeg ?? 0,
      scaleX: copied?.scaleX ?? 1,
      scaleY: copied?.scaleY ?? 1
    },
    overrides: {
      ...(copied?.visualVariantId
        ? { visualVariantId: copied.visualVariantId }
        : {}),
      // River/portal references belong to each placement, not the copied brush.
      traversalSurfaceFeatureIds: []
    }
  };
}
