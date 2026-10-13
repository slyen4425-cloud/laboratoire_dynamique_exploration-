// Visual classification only. Terrain gameplay authority stays in WorldDocument.
const NATIVE_SURFACE_FAMILIES = Object.freeze({
  plain: Object.freeze(['grass.forest', 'ground.dirt']),
  forest: Object.freeze(['ground.forest_floor']),
  sea: Object.freeze(['ground.sea']),
  mountain: Object.freeze(['ground.mountain_rock']),
  volcano: Object.freeze(['ground.volcanic_ash_lava']),
  snow: Object.freeze(['ground.snow']),
  road: Object.freeze(['ground.road']),
  sand: Object.freeze(['ground.sand'])
});

export function surfaceMaterialsForFamily(materials, familyId) {
  if (typeof familyId !== 'string' || !familyId.trim()) return [];
  const nativeIds = NATIVE_SURFACE_FAMILIES[familyId] ?? [];
  return (Array.isArray(materials) ? materials : []).filter((material) => {
    if (material?.kind !== 'surface') return false;
    if (material.terrainFamilyId) {
      return material.terrainFamilyId === familyId;
    }
    // Deterministic compatibility for v1 imports made before family classification.
    if (material.id?.startsWith('user.material.surface.')) {
      return familyId === 'plain';
    }
    return nativeIds.includes(material.id);
  });
}

export function preferredSurfaceMaterial(materials, familyId, requestedId = null) {
  const options = surfaceMaterialsForFamily(materials, familyId);
  return options.some((item) => item.id === requestedId)
    ? requestedId : options[0]?.id ?? null;
}
