export const MATERIAL_PACK_SCHEMA_VERSION = 1;

export const materialPackV1 = Object.freeze({
  schemaVersion: MATERIAL_PACK_SCHEMA_VERSION,
  id: 'forest-core-v1',
  materials: Object.freeze([
    Object.freeze({
      id: 'grass.forest',
      kind: 'surface',
      label: 'Herbe de forêt',
      assets: Object.freeze({
        base: 'texture.grass.forest.base.01',
        variants: Object.freeze([
          'texture.grass.forest.base.02'
        ]),
        edge: null,
        decals: Object.freeze([
          'decal.forest.leaves.01',
          'decal.forest.roots.01'
        ])
      }),
      render: Object.freeze({
        baseColor: '#536247',
        variationColors: Object.freeze([
          'rgba(111,92,57,0.10)',
          'rgba(70,90,48,0.12)',
          'rgba(91,78,50,0.09)'
        ]),
        detailSpacing: 260,
        decalSpacing: 320,
        decalMinSize: 54,
        decalMaxSize: 92,
        decalOpacity: 0.42
      })
    }),
    Object.freeze({
      id: 'road.dirt',
      kind: 'path',
      label: 'Chemin de terre',
      assets: Object.freeze({
        center: 'texture.road.dirt.base.01',
        edge: 'transition.road.dirt.grass_forest.edge.01',
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerEdgeColor: '#4c4436',
        innerEdgeColor: '#746044',
        centerColor: '#9a7a52',
        highlightColor: '#b99a6b',
        outerEdgePadding: 18,
        innerEdgePadding: 10,
        highlightRatio: 0.06,
        highlightOpacity: 0.18
      })
    }),
    Object.freeze({
      id: 'water.forest_stream',
      kind: 'water',
      label: 'Rivière de forêt',
      assets: Object.freeze({
        center: 'texture.water.forest_stream.base.01',
        bank: 'transition.water.forest_stream.grass_forest.bank.01',
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#3f4a37',
        innerBankColor: '#5c6748',
        waterColor: '#3f7b91',
        highlightColor: '#8fc0cb',
        outerBankPadding: 20,
        innerBankPadding: 10,
        highlightRatio: 0.08,
        highlightOpacity: 0.20
      })
    })
  ]),
  transitions: Object.freeze([
    Object.freeze({
      id: 'transition.road.dirt.grass_forest.edge.01',
      from: 'road.dirt',
      to: 'grass.forest',
      assetId: 'transition.road.dirt.grass_forest.edge.01'
    }),
    Object.freeze({
      id: 'transition.water.forest_stream.grass_forest.bank.01',
      from: 'water.forest_stream',
      to: 'grass.forest',
      assetId: 'transition.water.forest_stream.grass_forest.bank.01'
    })
  ]),
  decals: Object.freeze([
    'decal.forest.leaves.01',
    'decal.forest.roots.01'
  ])
});
