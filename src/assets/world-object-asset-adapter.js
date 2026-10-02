const WORLD_OBJECT_ASSETS = Object.freeze({
  'object.bridge.wood.rustic_bank.01': Object.freeze({
    id: 'object.bridge.wood.rustic_bank.01',
    kind: 'bridge-visual',
    path: './assets/exploration/objects/bridges/bridge_wood_rustic_bank_01.webp',
    render: Object.freeze({
      rotationOffsetDeg: -90,
      lengthScale: 1.4,
      widthScale: 1.25
    })
  }),
  'object.bridge.stone.medieval_bank.01': Object.freeze({
    id: 'object.bridge.stone.medieval_bank.01',
    kind: 'bridge-visual',
    path: './assets/exploration/objects/bridges/bridge_stone_medieval_bank_01.webp',
    render: Object.freeze({
      rotationOffsetDeg: -90,
      lengthScale: 1.38,
      widthScale: 1.24
    })
  }),
  'object.bridge.wood.rope_bank.01': Object.freeze({
    id: 'object.bridge.wood.rope_bank.01',
    kind: 'bridge-visual',
    path: './assets/exploration/objects/bridges/bridge_wood_rope_bank_01.webp',
    render: Object.freeze({
      rotationOffsetDeg: -90,
      lengthScale: 1.42,
      widthScale: 1.22
    })
  }),
  'object.bridge.stone.moss_bank.01': Object.freeze({
    id: 'object.bridge.stone.moss_bank.01',
    kind: 'bridge-visual',
    path: './assets/exploration/objects/bridges/bridge_stone_moss_bank_01.webp',
    render: Object.freeze({
      rotationOffsetDeg: -90,
      lengthScale: 1.4,
      widthScale: 1.25
    })
  }),
  'object.building.house.fantasy_wood_stone.01': Object.freeze({
    id: 'object.building.house.fantasy_wood_stone.01',
    kind: 'building-visual',
    path: './assets/exploration/objects/buildings/building_house_fantasy_wood_stone_01.webp',
    render: Object.freeze({
      rotationOffsetDeg: 0,
      widthScale: 1.12,
      heightScale: 1.12
    })
  })
});

export function listWorldObjectAssets() {
  return Object.freeze(Object.values(WORLD_OBJECT_ASSETS));
}

export function resolveWorldObjectAsset(assetId) {
  const id = typeof assetId === 'string' ? assetId.trim() : '';
  return id ? WORLD_OBJECT_ASSETS[id] ?? null : null;
}
