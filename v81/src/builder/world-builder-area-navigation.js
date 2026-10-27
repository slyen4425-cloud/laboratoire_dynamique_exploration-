export function resolveLinkedInteriorNavigation(
  document,
  { sourceAreaId, buildingId }
) {
  const sourceArea =
    document?.areas?.find(
      (area) => area.id === sourceAreaId
    ) ?? null;

  if (
    sourceArea?.kind !== 'exterior' ||
    !buildingId
  ) {
    return null;
  }

  const portal =
    document?.portals?.find(
      (item) =>
        item.sourceAreaId === sourceAreaId &&
        item.trigger?.kind === 'object-anchor' &&
        item.trigger.objectId === buildingId &&
        document.areas?.some(
          (area) =>
            area.id === item.targetAreaId &&
            area.kind === 'interior'
        )
    ) ?? null;

  return portal
    ? Object.freeze({
        portalId: portal.id,
        targetAreaId: portal.targetAreaId
      })
    : null;
}

export function resolveExteriorReturnNavigation(
  document,
  sourceAreaId
) {
  const sourceArea =
    document?.areas?.find(
      (area) => area.id === sourceAreaId
    ) ?? null;

  if (sourceArea?.kind !== 'interior') {
    return null;
  }

  const portal =
    document?.portals?.find(
      (item) =>
        item.sourceAreaId === sourceAreaId &&
        document.areas?.some(
          (area) =>
            area.id === item.targetAreaId &&
            area.kind === 'exterior'
        )
    ) ?? null;

  return portal
    ? Object.freeze({
        portalId: portal.id,
        targetAreaId: portal.targetAreaId
      })
    : null;
}
