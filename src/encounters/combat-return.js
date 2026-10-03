function finite(value, field) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new TypeError(
      `${field} must be finite`
    );
  }
  return number;
}

export function resolveExplorationCombatReturn({
  envelope,
  worldDocument
}) {
  const returnState =
    envelope?.returnState;
  const result =
    envelope?.result;

  const areaId =
    typeof returnState?.areaId === 'string'
      ? returnState.areaId.trim()
      : '';

  if (
    !areaId ||
    !worldDocument?.areas?.some(
      (area) => area.id === areaId
    )
  ) {
    throw new RangeError(
      'combat return areaId is invalid'
    );
  }

  return Object.freeze({
    currentAreaId: areaId,
    x: finite(returnState.x, 'returnState.x'),
    y: finite(returnState.y, 'returnState.y'),
    outcome:
      typeof result?.outcome === 'string'
        ? result.outcome
        : 'unknown'
  });
}
