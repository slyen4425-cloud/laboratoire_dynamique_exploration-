import { normalizeWorldDocument } from './world-document-model.js?rev=builder-dynamic-return-v1';

export const demoWorldDocument = normalizeWorldDocument({
  id: 'forest-demo-world',
  initialAreaId: 'forest-exterior',
  initialSpawnId: 'start',
  areas: [
    {
      id: 'forest-exterior',
      kind: 'exterior',
      width: 2400,
      height: 1600,
      surface: {
        baseMaterialId: 'grass.forest',
        baseTraversalRuleId: 'terrain.ground',
        routes: [
          {
            id: 'forest-main-road',
            width: 82,
            materialId: 'road.dirt',
            traversalRuleId: 'terrain.road',
            points: [
              { x: -80, y: 650 },
              { x: 320, y: 620 },
              { x: 680, y: 675 },
              { x: 1040, y: 625 },
              { x: 1430, y: 670 },
              { x: 1810, y: 620 },
              { x: 2480, y: 655 }
            ]
          }
        ],
        rivers: [
          {
            id: 'forest-stream',
            width: 72,
            materialId: 'water.forest_stream',
            traversalRuleId: 'terrain.water',
            points: [
              { x: 985, y: 805 },
              { x: 1085, y: 785 },
              { x: 1190, y: 820 },
              { x: 1300, y: 792 },
              { x: 1435, y: 805 }
            ]
          }
        ]
      },
      objects: [
        {
          id: 'forest-bridge-01',
          kind: 'bridge',
          transform: {
            x: 1190,
            y: 805,
            rotationDeg: 90,
            scaleX: 1,
            scaleY: 1
          },
          baseSize: {
            length: 170,
            width: 96
          },
          visual: {
            assetId: 'object.bridge.wood.rustic_bank.01'
          },
          traversal: {
            enabled: true,
            lengthRatio: 0.92,
            widthRatio: 0.82,
            edgeAssistRatio: 0.15,
            traversalRuleId: 'terrain.bridge',
            overridesSurfaceFeatureIds: [
              'forest-stream'
            ]
          }
        },
        {
          id: 'forest-house-01',
          kind: 'building',
          transform: {
            x: 820,
            y: 930,
            rotationDeg: 0,
            scaleX: 1,
            scaleY: 1
          },
          baseSize: {
            width: 300,
            height: 300
          },
          visual: {
            assetId: 'object.building.house.fantasy_wood_stone.01'
          },
          footprint: {
            enabled: true,
            widthRatio: 0.78,
            heightRatio: 0.62,
            offsetX: 0,
            offsetY: -0.08
          },
          doorAnchors: [
            {
              id: 'main-door',
              x: 0,
              y: 0.38
            }
          ]
        }
      ],
      obstacles: [
        { id: 'rock-01', x: 480, y: 300, w: 240, h: 180, kind: 'rock' },
        { id: 'trees-01', x: 1650, y: 360, w: 220, h: 300, kind: 'trees' },
        { id: 'trees-02', x: 350, y: 1120, w: 520, h: 120, kind: 'trees' }
      ],
      spawns: [
        { id: 'start', x: 220, y: 220 },
        {
          id: 'house-return-exterior',
          anchor: {
            kind: 'building-door',
            objectId: 'forest-house-01',
            anchorId: 'main-door',
            offset: 56
          }
        }
      ]
    },
    {
      id: 'house-interior-01',
      kind: 'interior',
      width: 720,
      height: 560,
      surface: {
        baseMaterialId: 'floor.wood.house',
        baseTraversalRuleId: 'terrain.ground',
        routes: [],
        rivers: []
      },
      objects: [],
      obstacles: [
        {
          id: 'table-01',
          x: 290,
          y: 210,
          w: 140,
          h: 72,
          kind: 'furniture'
        }
      ],
      spawns: [
        { id: 'house-entry', x: 360, y: 390 }
      ]
    }
  ],
  portals: [
    {
      id: 'portal-house-enter',
      sourceAreaId: 'forest-exterior',
      trigger: {
        kind: 'building-door',
        objectId: 'forest-house-01',
        anchorId: 'main-door',
        radius: 34
      },
      targetAreaId: 'house-interior-01',
      targetSpawnId: 'house-entry'
    },
    {
      id: 'portal-house-exit',
      sourceAreaId: 'house-interior-01',
      trigger: {
        kind: 'point',
        x: 360,
        y: 510,
        radius: 30
      },
      targetAreaId: 'forest-exterior',
      targetSpawnId: 'house-return-exterior',
      visual: {
        visible: true,
        marker: 'exit',
        label: 'Sortie'
      }
    }
  ]
});

// Compatibility helper for older focused tests/tools that expect a flat world.
export const demoWorld =
  demoWorldDocument.areas.find((area) => area.id === 'forest-exterior') ?? null;
