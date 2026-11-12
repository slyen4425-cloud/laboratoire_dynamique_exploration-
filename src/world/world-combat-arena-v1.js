export function normalizeCombatArenaIdV1(value) {
  const id = typeof value === 'string' ? value.trim() : '';
  return id && id.length <= 128 ? id : null;
}

export function normalizeCombatArenaIdsV1(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map(normalizeCombatArenaIdV1).filter(Boolean))].slice(0, 4);
}

// Read the existing door/area links. If an interior has several distinct
// buildings or exterior hosts, it needs its own choice to disambiguate them.
function interiorHost(world, area) {
  const areas = new Map((world?.areas ?? []).map(entry => [entry.id, entry]));
  const exteriorAreas = new Set();
  const doorways = new Map();
  for (const portal of world?.portals ?? []) {
    if (!portal.enabled || portal.targetAreaId !== area.id) continue;
    const exteriorArea = areas.get(portal.sourceAreaId);
    if (exteriorArea?.kind !== 'exterior') continue;
    exteriorAreas.add(exteriorArea);
    if (portal.trigger.kind !== 'object-anchor') continue;
    const building = exteriorArea.objects.find(object => object.id === portal.trigger.objectId);
    if (building) doorways.set(building, exteriorArea);
  }
  if (doorways.size === 1) {
    const [building, exteriorArea] = doorways.entries().next().value;
    return {building, exteriorArea};
  }
  return {exteriorArea: exteriorAreas.size === 1 ? exteriorAreas.values().next().value : null};
}

// Exploration sets the precedence. Combat validates the ordered references
// against its official catalog, including references from older imports.
export function worldCombatArenaIdsV1(world, area, host) {
  const {building, exteriorArea} = host ?? (area?.kind === 'interior' ? interiorHost(world, area) : {});
  return normalizeCombatArenaIdsV1([
    area?.encounters?.combatArenaId,
    building?.overrides?.combatArenaId,
    exteriorArea?.encounters?.combatArenaId,
    world?.defaultCombatArenaId
  ]);
}
