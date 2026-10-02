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
