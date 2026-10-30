// Visual suggestions are driven by material definitions and editable WorldDocument
// family palettes. Nothing here infers gameplay family from a texture.
export function surfaceMaterialsForFamily(materials, familyId, familyDefinitions = null) {
  if (typeof familyId !== 'string' || !familyId.trim()) return [];
  const family = (Array.isArray(familyDefinitions) ? familyDefinitions : [])
    .find((entry) => entry.id === familyId);
  const assigned = Array.isArray(family?.surfaceMaterialIds)
    ? new Set(family.surfaceMaterialIds) : null;
  return (Array.isArray(materials) ? materials : []).filter((material) =>
    material?.kind === 'surface' &&
    (assigned ? assigned.has(material.id) : material.terrainFamilyId === familyId)
  );
}

export function preferredSurfaceMaterial(
  materials, familyId, requestedId = null, familyDefinitions = null
) {
  const options = surfaceMaterialsForFamily(materials, familyId, familyDefinitions);
  return options.some((item) => item.id === requestedId)
    ? requestedId : options[0]?.id ?? null;
}
