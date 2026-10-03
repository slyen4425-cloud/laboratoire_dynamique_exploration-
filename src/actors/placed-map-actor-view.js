export function createPlacedMapActorView(
  placement,
  resolveActorDefinition
) {
  if (
    !placement ||
    typeof placement !== 'object' ||
    typeof resolveActorDefinition !==
      'function'
  ) {
    return null;
  }

  const definition =
    resolveActorDefinition(
      placement.actorDefinitionId
    );

  if (!definition?.mapVisual) {
    return null;
  }

  return Object.freeze({
    id: placement.id,
    actorDefinitionId:
      placement.actorDefinitionId,
    x: placement.x,
    y: placement.y,
    facingX:
      placement.facingX === -1
        ? -1
        : 1,
    moving: false,
    mapVisual: definition.mapVisual
  });
}
