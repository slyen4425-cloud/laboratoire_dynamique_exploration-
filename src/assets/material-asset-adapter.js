const ASSETS = Object.freeze([
  Object.freeze({
    id: 'texture.grass.forest.base.01',
    path: './assets/exploration/materials/forest/surfaces/grass_forest_base_01.webp'
  }),
  Object.freeze({
    id: 'texture.grass.forest.base.02',
    path: './assets/exploration/materials/forest/surfaces/grass_forest_base_02.webp'
  }),
  Object.freeze({
    id: 'texture.road.dirt.base.01',
    path: './assets/exploration/materials/forest/paths/road_dirt_base_01.webp'
  }),
  Object.freeze({
    id: 'texture.water.forest_stream.base.01',
    path: './assets/exploration/materials/forest/water/water_forest_stream_base_01.webp'
  }),
  Object.freeze({
    id: 'transition.road.dirt.grass_forest.edge.01',
    path: './assets/exploration/materials/forest/transitions/road_dirt_to_grass_forest_edge_01.webp'
  }),
  Object.freeze({
    id: 'transition.water.forest_stream.grass_forest.bank.01',
    path: './assets/exploration/materials/forest/transitions/water_forest_stream_to_grass_forest_bank_01.webp'
  }),
  Object.freeze({
    id: 'decal.forest.leaves.01',
    path: './assets/exploration/materials/forest/decals/leaves_forest_floor_decal_01.webp'
  }),
  Object.freeze({
    id: 'decal.forest.roots.01',
    path: './assets/exploration/materials/forest/decals/roots_forest_floor_decal_01.webp'
  })
]);

const byId = new Map(ASSETS.map((asset) => [asset.id, asset]));

export function listMaterialAssets() {
  return ASSETS;
}

export function resolveMaterialAsset(assetId) {
  const id = typeof assetId === 'string' ? assetId.trim() : '';
  return id ? byId.get(id) ?? null : null;
}
