import {
  resolveTerrainFamilyAtPoint
} from './terrain-family-resolver.js?rev=terrain-family-encounters-v1';
import {
  resolveTerrainFamilyEncounter
} from './terrain-family-encounter-resolver.js?rev=terrain-family-encounters-v1';

function positiveDistance(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number
    : fallback;
}

function validPosition(player) {
  return Boolean(
    player &&
    typeof player.currentAreaId === 'string' &&
    player.currentAreaId.trim() &&
    Number.isFinite(player.x) &&
    Number.isFinite(player.y)
  );
}

export function createEncounterController({
  checkDistance = 160
} = {}) {
  const threshold = positiveDistance(
    checkDistance,
    160
  );

  let lastPosition = null;
  let travelledSinceCheck = 0;
  let sequence = 0;
  let activeEncounterId = null;
  let resetAnchorOnNextStep = false;

  function step({
    area,
    player,
    encounterConfig,
    captureCatalog,
    playerPartyRef,
    rulesetId,
    random = Math.random
  } = {}) {
    if (!validPosition(player) || !area?.surface) {
      return null;
    }

    if (activeEncounterId) {
      return null;
    }

    const current = {
      areaId: player.currentAreaId,
      x: player.x,
      y: player.y
    };

    if (
      resetAnchorOnNextStep ||
      !lastPosition ||
      lastPosition.areaId !== current.areaId
    ) {
      lastPosition = current;
      travelledSinceCheck = 0;
      resetAnchorOnNextStep = false;
      return null;
    }

    const moved = Math.hypot(
      current.x - lastPosition.x,
      current.y - lastPosition.y
    );

    lastPosition = current;

    if (!Number.isFinite(moved) || moved <= 0) {
      return null;
    }

    travelledSinceCheck += moved;

    if (travelledSinceCheck < threshold) {
      return null;
    }

    travelledSinceCheck %= threshold;

    const family = resolveTerrainFamilyAtPoint(
      area.surface,
      current.x,
      current.y
    );

    const resolved = resolveTerrainFamilyEncounter({
      terrainFamilyId: family.terrainFamilyId,
      config: encounterConfig,
      captureCatalog,
      random
    });

    if (!resolved.triggered) {
      return null;
    }

    sequence += 1;

    const encounterId = `encounter-${sequence}`;
    const returnToken = `return-${sequence}`;

    activeEncounterId = encounterId;

    return Object.freeze({
      version: 1,
      source: 'terrain-random',
      encounterId,
      returnToken,
      playerPartyRef,
      rulesetId,
      areaId: current.areaId,
      terrainFamilyId: resolved.terrainFamilyId,
      elementId: resolved.elementId,
      opponentCreatureId: resolved.creatureId
    });
  }

  function release(encounterId) {
    if (
      typeof encounterId !== 'string' ||
      encounterId !== activeEncounterId
    ) {
      return false;
    }

    activeEncounterId = null;
    travelledSinceCheck = 0;
    resetAnchorOnNextStep = true;
    return true;
  }

  return Object.freeze({
    step,
    release,
    get activeEncounterId() {
      return activeEncounterId;
    },
    get checkDistance() {
      return threshold;
    }
  });
}
