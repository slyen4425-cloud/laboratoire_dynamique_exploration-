const MATERIAL_ASSETS = Object.freeze({
  'texture.grass.forest.base.01': Object.freeze({
    id: 'texture.grass.forest.base.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/grass_forest_base_01.webp'
  }),
  'texture.grass.forest.base.02': Object.freeze({
    id: 'texture.grass.forest.base.02',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/grass_forest_base_02.webp'
  }),
  'texture.ground.forest_floor.stylized.01': Object.freeze({
    id: 'texture.ground.forest_floor.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/forest_floor_stylized_01.webp'
  }),
  'texture.ground.snow.stylized.01': Object.freeze({
    id: 'texture.ground.snow.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/snow_ground_stylized_01.webp'
  }),
  'texture.ground.sand.stylized.01': Object.freeze({
    id: 'texture.ground.sand.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/sand_ground_stylized_01.webp'
  }),
  'texture.ground.mountain_rock.stylized.01': Object.freeze({
    id: 'texture.ground.mountain_rock.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/mountain_rock_stylized_01.webp'
  }),
  'texture.road.dirt.center.01': Object.freeze({
    id: 'texture.road.dirt.center.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/paths/road_dirt_base_01.webp'
  }),
  'texture.water.forest_stream.center.01': Object.freeze({
    id: 'texture.water.forest_stream.center.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/water/water_forest_stream_base_01.webp'
  }),
  'texture.water.clear_blue.stylized.01': Object.freeze({
    id: 'texture.water.clear_blue.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/water/water_clear_blue_stylized_01.webp'
  }),
  'texture.water.turquoise.stylized.01': Object.freeze({
    id: 'texture.water.turquoise.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/water/water_turquoise_stylized_01.webp'
  }),
  'texture.water.swamp.stylized.01': Object.freeze({
    id: 'texture.water.swamp.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/water/water_swamp_stylized_01.webp'
  }),
  'texture.water.lava.stylized.01': Object.freeze({
    id: 'texture.water.lava.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/water/lava_flow_stylized_01.webp'
  }),
  'texture.ground.volcanic_ash_lava.stylized.01': Object.freeze({
    id: 'texture.ground.volcanic_ash_lava.stylized.01',
    kind: 'texture',
    path: './assets/exploration/materials/forest/surfaces/volcanic_ash_lava_stylized_01.webp'
  }),
  'transition.road.dirt_to_grass_forest.edge.01': Object.freeze({
    id: 'transition.road.dirt_to_grass_forest.edge.01',
    kind: 'transition',
    path: './assets/exploration/materials/forest/transitions/road_dirt_to_grass_forest_edge_01.webp'
  }),
  'transition.water.forest_stream_to_grass_forest.bank.01': Object.freeze({
    id: 'transition.water.forest_stream_to_grass_forest.bank.01',
    kind: 'transition',
    path: './assets/exploration/materials/forest/transitions/water_forest_stream_to_grass_forest_bank_01.webp'
  }),
  'decal.forest.leaves.01': Object.freeze({
    id: 'decal.forest.leaves.01',
    kind: 'decal',
    path: './assets/exploration/materials/forest/decals/leaves_forest_floor_decal_01.webp'
  }),
  'decal.forest.roots.01': Object.freeze({
    id: 'decal.forest.roots.01',
    kind: 'decal',
    path: './assets/exploration/materials/forest/decals/roots_forest_floor_decal_01.webp'
  })
});

export function listMaterialAssets() {
  return Object.freeze(Object.values(MATERIAL_ASSETS));
}

export function resolveMaterialAsset(assetId) {
  const id = typeof assetId === 'string' ? assetId.trim() : '';
  return id ? MATERIAL_ASSETS[id] ?? null : null;
}


export function createMaterialAssetResolver({
  resolveUserAsset = null
} = {}) {
  return function resolveComposedMaterialAsset(assetId) {
    const native = resolveMaterialAsset(assetId);
    if (native) return native;

    if (typeof resolveUserAsset === 'function') {
      return resolveUserAsset(assetId) ?? null;
    }

    return null;
  };
}
