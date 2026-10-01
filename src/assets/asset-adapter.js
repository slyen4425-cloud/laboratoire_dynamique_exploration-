const FOREST_TERRAIN_ASSETS = Object.freeze([
  Object.freeze({
    id: 'terrain.forest.01',
    path: './assets/exploration/biomes/forest/floor_01.png'
  }),
  Object.freeze({
    id: 'terrain.forest.02',
    path: './assets/exploration/biomes/forest/floor_02.png'
  }),
  Object.freeze({
    id: 'terrain.forest.03',
    path: './assets/exploration/biomes/forest/floor_03.png'
  }),
  Object.freeze({
    id: 'terrain.forest.04',
    path: './assets/exploration/biomes/forest/floor_04.png'
  }),
  Object.freeze({
    id: 'terrain.forest.05',
    path: './assets/exploration/biomes/forest/floor_05.png'
  }),
  Object.freeze({
    id: 'terrain.forest.06',
    path: './assets/exploration/biomes/forest/floor_06.png'
  })
]);

export function listTerrainAssets({ biome } = {}) {
  if (biome !== 'forest') return [];
  return [...FOREST_TERRAIN_ASSETS];
}

export function resolveTerrainAsset({ biome, variant } = {}) {
  if (biome !== 'forest') return null;
  if (!Number.isInteger(variant) || variant < 1 || variant > FOREST_TERRAIN_ASSETS.length) {
    return null;
  }

  return FOREST_TERRAIN_ASSETS[variant - 1];
}
