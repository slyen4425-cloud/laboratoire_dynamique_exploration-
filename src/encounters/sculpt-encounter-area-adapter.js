import { normalizeWorldArea } from '../world/world-area-model.js';
import { SCULPT_EXTERIOR_AREA_ID } from '../world/sculpt-interior-area-link.js';

// Read-only projection of the ONE edited WorldSurface into the existing
// Encounter Controller's WorldArea input contract. Never stores a second
// world, movement position, encounter configuration or creature roster.
export function createSculptEncounterArea({
  areaId, existingArea = null, surface, width, height
} = {}) {
  if (typeof areaId !== 'string' || !areaId.trim() ||
      !surface || !Number.isFinite(width) || !Number.isFinite(height) ||
      width <= 0 || height <= 0) {
    throw new TypeError('A valid sculpt WorldArea and WorldSurface are required');
  }
  if (existingArea && existingArea.id !== areaId) {
    throw new RangeError('Encounter Area does not match the active WorldArea');
  }
  if (!existingArea && areaId !== SCULPT_EXTERIOR_AREA_ID) {
    throw new RangeError('An interior encounter requires its existing WorldArea');
  }
  const area = existingArea ?? normalizeWorldArea({
    id: SCULPT_EXTERIOR_AREA_ID,
    kind: 'exterior',
    width, height,
    surface
  });
  // Surface identity stays canonical: geometry/materials are neither copied
  // nor recalculated by the encounter adapter.
  return Object.freeze({
    ...area,
    surface,
    encounters: area.encounters
  });
}
