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
          'rgba(111,92,57,0.14)',
          'rgba(70,90,48,0.16)',
          'rgba(91,78,50,0.12)'
        ]),
        detailSpacing: 260,
        decalSpacing: 230,
        decalDensity: 0.42,
        decalMinSize: 48,
        decalMaxSize: 82,
        decalOpacity: 0.36
      })
    }),
    Object.freeze({
      id: 'road.dirt',
      kind: 'path',
      label: 'Chemin de terre',
      assets: Object.freeze({
        center: 'texture.road.dirt.center.01',
        edge: 'transition.road.dirt_to_grass_forest.edge.01',
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerEdgeColor: '#4c4436',
        innerEdgeColor: '#746044',
        centerColor: '#9a7a52',
        highlightColor: '#b99a6b',
        outerEdgePadding: 18,
        innerEdgePadding: 10,
        highlightRatio: 0.08,
        highlightOpacity: 0.28
      })
    }),
    Object.freeze({
      id: 'water.forest_stream',
      kind: 'water',
      label: 'Rivière de forêt',
      assets: Object.freeze({
        center: 'texture.water.forest_stream.center.01',
        bank: 'transition.water.forest_stream_to_grass_forest.bank.01',
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#3f4a37',
        innerBankColor: '#5c6748',
        waterColor: '#3f7b91',
        highlightColor: '#8fc0cb',
        outerBankPadding: 20,
        innerBankPadding: 10,
        highlightRatio: 0.1,
        highlightOpacity: 0.3
      })
    })
  ]),
  transitions: Object.freeze([]),
  decals: Object.freeze([])
});
