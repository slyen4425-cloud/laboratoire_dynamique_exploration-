export const MATERIAL_PACK_SCHEMA_VERSION = 1;

export const materialPackV1 = Object.freeze({
  schemaVersion: MATERIAL_PACK_SCHEMA_VERSION,
  id: 'forest-core-v1',
  surfaceTransition: Object.freeze({
    mode: 'feather',
    widthRatio: 0.18,
    minWidth: 6,
    maxWidth: 64,
    steps: 7,
    edgeOpacity: 0.08
  }),
  materials: Object.freeze([
    Object.freeze({
      id: 'grass.forest',
      kind: 'surface',
      label: 'Herbe cartoon',
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
      id: 'ground.dirt',
      kind: 'surface',
      label: 'Terre',
      assets: Object.freeze({
        base: null,
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#7f6546',
        variationColors: Object.freeze([
          'rgba(107,78,48,0.18)',
          'rgba(151,116,72,0.14)',
          'rgba(83,68,48,0.13)'
        ]),
        detailSpacing: 180,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    }),
    Object.freeze({
      id: 'ground.sand',
      kind: 'surface',
      label: 'Sable',
      assets: Object.freeze({
        base: 'texture.ground.sand.stylized.01',
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#c9ad73',
        variationColors: Object.freeze([
          'rgba(226,201,142,0.17)',
          'rgba(171,140,82,0.13)',
          'rgba(239,220,169,0.12)'
        ]),
        detailSpacing: 200,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    }),
    Object.freeze({
      id: 'ground.snow',
      kind: 'surface',
      label: 'Neige',
      assets: Object.freeze({
        base: 'texture.ground.snow.stylized.01',
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#dce6e8',
        variationColors: Object.freeze([
          'rgba(255,255,255,0.18)',
          'rgba(181,207,215,0.13)',
          'rgba(218,232,237,0.15)'
        ]),
        detailSpacing: 220,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    }),
    Object.freeze({
      id: 'ground.forest_floor',
      kind: 'surface',
      label: 'Sol de forêt',
      assets: Object.freeze({
        base: 'texture.ground.forest_floor.stylized.01',
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#40572e',
        variationColors: Object.freeze([
          'rgba(67,95,42,0.16)',
          'rgba(83,66,38,0.12)',
          'rgba(45,74,35,0.14)'
        ]),
        detailSpacing: 220,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    }),
    Object.freeze({
      id: 'ground.mountain_rock',
      kind: 'surface',
      label: 'Montagne rocheuse',
      assets: Object.freeze({
        base: 'texture.ground.mountain_rock.stylized.01',
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#887f70',
        variationColors: Object.freeze([
          'rgba(116,107,92,0.16)',
          'rgba(151,138,115,0.12)',
          'rgba(91,86,77,0.14)'
        ]),
        detailSpacing: 210,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    }),
    Object.freeze({
      id: 'ground.volcanic_ash_lava',
      kind: 'surface',
      label: 'Sol cendre & lave',
      assets: Object.freeze({
        base: 'texture.ground.volcanic_ash_lava.stylized.01',
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#4d4039',
        variationColors: Object.freeze([
          'rgba(80,66,59,0.16)',
          'rgba(111,72,54,0.12)',
          'rgba(49,45,43,0.15)'
        ]),
        detailSpacing: 200,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    }),
    Object.freeze({
      id: 'floor.wood.house',
      kind: 'surface',
      label: 'Plancher bois intérieur',
      assets: Object.freeze({
        base: null,
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#7d5d3d',
        variationColors: Object.freeze([
          'rgba(112,78,47,0.18)',
          'rgba(151,112,70,0.14)',
          'rgba(78,54,35,0.12)'
        ]),
        detailSpacing: 150,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
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
    }),
    Object.freeze({
      id: 'water.clear_blue',
      kind: 'water',
      label: 'Eau claire bleue',
      assets: Object.freeze({
        center: 'texture.water.clear_blue.stylized.01',
        bank: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#55705c',
        innerBankColor: '#78936f',
        waterColor: '#39aee5',
        highlightColor: '#d7f8ff',
        outerBankPadding: 20,
        innerBankPadding: 10,
        highlightRatio: 0.08,
        highlightOpacity: 0.18
      })
    }),
    Object.freeze({
      id: 'water.turquoise',
      kind: 'water',
      label: 'Eau turquoise',
      assets: Object.freeze({
        center: 'texture.water.turquoise.stylized.01',
        bank: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#4a766d',
        innerBankColor: '#72a78e',
        waterColor: '#21c5c0',
        highlightColor: '#ddfff5',
        outerBankPadding: 20,
        innerBankPadding: 10,
        highlightRatio: 0.08,
        highlightOpacity: 0.18
      })
    }),
    Object.freeze({
      id: 'water.swamp',
      kind: 'water',
      label: 'Eau sombre / marais',
      assets: Object.freeze({
        center: 'texture.water.swamp.stylized.01',
        bank: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#354936',
        innerBankColor: '#506542',
        waterColor: '#205c5c',
        highlightColor: '#91c5b0',
        outerBankPadding: 20,
        innerBankPadding: 10,
        highlightRatio: 0.08,
        highlightOpacity: 0.16
      })
    }),
    Object.freeze({
      id: 'water.lava',
      kind: 'water',
      label: 'Lave',
      assets: Object.freeze({
        center: 'texture.water.lava.stylized.01',
        bank: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#2f211d',
        innerBankColor: '#5f3023',
        waterColor: '#e84a14',
        highlightColor: '#ffd34e',
        outerBankPadding: 22,
        innerBankPadding: 10,
        highlightRatio: 0.06,
        highlightOpacity: 0.24
      })
    })
  ]),
  transitions: Object.freeze([]),
  decals: Object.freeze([])
});
