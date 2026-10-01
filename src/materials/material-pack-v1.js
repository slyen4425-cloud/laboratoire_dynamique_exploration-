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
        base: null,
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#536247',
        variationColors: Object.freeze([
          'rgba(111,92,57,0.14)',
          'rgba(70,90,48,0.16)',
          'rgba(91,78,50,0.12)'
        ]),
        detailSpacing: 260
      })
    }),
    Object.freeze({
      id: 'road.dirt',
      kind: 'path',
      label: 'Chemin de terre',
      assets: Object.freeze({
        center: null,
        edge: null,
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
        center: null,
        bank: null,
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
