const MAP_ACTOR_ASSETS = Object.freeze({
  'actor.demo.hero.traveler.01': Object.freeze({
    id: 'actor.demo.hero.traveler.01',
    kind: 'map-actor-source',
    path: './assets/exploration/actors/demo/map_actor_demo_hero.svg'
  })
});

export function listMapActorAssets() {
  return Object.freeze(Object.values(MAP_ACTOR_ASSETS));
}

export function resolveMapActorAsset(assetId) {
  const id = typeof assetId === 'string' ? assetId.trim() : '';
  return id ? MAP_ACTOR_ASSETS[id] ?? null : null;
}


export function createMapActorAssetResolver(extraAssets = []) {
  const extras = new Map();

  for (const asset of Array.isArray(extraAssets) ? extraAssets : []) {
    if (
      !asset ||
      typeof asset.id !== 'string' ||
      !asset.id.trim() ||
      typeof asset.path !== 'string' ||
      !asset.path.trim()
    ) {
      continue;
    }

    extras.set(
      asset.id.trim(),
      Object.freeze({
        id: asset.id.trim(),
        kind: 'map-actor-source',
        path: asset.path.trim(),
        label:
          typeof asset.label === 'string' && asset.label.trim()
            ? asset.label.trim()
            : asset.id.trim()
      })
    );
  }

  return function resolveExtendedMapActorAsset(assetId) {
    const id = typeof assetId === 'string' ? assetId.trim() : '';
    if (!id) return null;
    return extras.get(id) ?? resolveMapActorAsset(id);
  };
}
