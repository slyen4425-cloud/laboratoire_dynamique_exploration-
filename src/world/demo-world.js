import { normalizeWorldDocument } from './world-document-model.js?rev=terrain-family-encounters-v1';

export const demoWorldDocument = normalizeWorldDocument({
  id: 'forest-demo-world',
  initialAreaId: 'forest-exterior',
  initialSpawnId: 'start',
  encounterConfig: {
    families: [
      {
        terrainFamilyId: 'plain',
        encounterChancePercent: 12,
        elementChances: [
          { elementId: 'nature', chancePercent: 30 },
          { elementId: 'earth', chancePercent: 25 },
          { elementId: 'air', chancePercent: 20 },
          { elementId: 'electric', chancePercent: 10 },
          { elementId: 'fire', chancePercent: 10 },
          { elementId: 'water', chancePercent: 5 }
        ]
      },
      {
        terrainFamilyId: 'forest',
        encounterChancePercent: 22,
        elementChances: [
          { elementId: 'nature', chancePercent: 50 },
          { elementId: 'earth', chancePercent: 20 },
          { elementId: 'water', chancePercent: 10 },
          { elementId: 'fire', chancePercent: 10 },
          { elementId: 'shadow', chancePercent: 10 }
        ]
      },
      {
        terrainFamilyId: 'sea',
        encounterChancePercent: 18,
        elementChances: [
          { elementId: 'water', chancePercent: 70 },
          { elementId: 'ice', chancePercent: 15 },
          { elementId: 'electric', chancePercent: 10 },
          { elementId: 'air', chancePercent: 5 }
        ]
      },
      {
        terrainFamilyId: 'mountain',
        encounterChancePercent: 16,
        elementChances: [
          { elementId: 'earth', chancePercent: 50 },
          { elementId: 'air', chancePercent: 25 },
          { elementId: 'steel', chancePercent: 15 },
          { elementId: 'electric', chancePercent: 10 }
        ]
      },
      {
        terrainFamilyId: 'volcano',
        encounterChancePercent: 24,
        elementChances: [
          { elementId: 'fire', chancePercent: 70 },
          { elementId: 'earth', chancePercent: 20 },
          { elementId: 'steel', chancePercent: 10 }
        ]
      },
      {
        terrainFamilyId: 'snow',
        encounterChancePercent: 18,
        elementChances: [
          { elementId: 'ice', chancePercent: 65 },
          { elementId: 'water', chancePercent: 15 },
          { elementId: 'air', chancePercent: 10 },
          { elementId: 'light', chancePercent: 10 }
        ]
      },
      {
        terrainFamilyId: 'road',
        encounterChancePercent: 4,
        elementChances: [
          { elementId: 'nature', chancePercent: 25 },
          { elementId: 'earth', chancePercent: 25 },
          { elementId: 'air', chancePercent: 20 },
          { elementId: 'fire', chancePercent: 10 },
          { elementId: 'water', chancePercent: 10 },
          { elementId: 'electric', chancePercent: 10 }
        ]
      },
      {
        terrainFamilyId: 'sand',
        encounterChancePercent: 14,
        elementChances: [
          { elementId: 'earth', chancePercent: 35 },
          { elementId: 'fire', chancePercent: 25 },
          { elementId: 'air', chancePercent: 20 },
          { elementId: 'poison', chancePercent: 10 },
          { elementId: 'light', chancePercent: 10 }
        ]
      }
    ]
  },
  areas: [
    {
      id: 'forest-exterior',
      kind: 'exterior',
      width: 2400,
      height: 1600,
      surface: {
        baseTerrainFamilyId: 'forest',
        baseMaterialId: 'grass.forest',
        baseTraversalRuleId: 'terrain.ground',
        routes: [
          {
            id: 'forest-main-road',
            width: 82,
            terrainFamilyId: 'road',
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
            terrainFamilyId: 'sea',
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
          objectDefinitionId:
            'objectdef.bridge.wood.rustic_bank.01',
          transform: {
            x: 1190,
            y: 805,
            rotationDeg: 90,
            scaleX: 1,
            scaleY: 1
          },
          overrides: {
            traversalSurfaceFeatureIds: [
              'forest-stream'
            ]
          }
        },
        {
          id: 'forest-house-01',
          objectDefinitionId:
            'objectdef.building.house.fantasy_wood_stone.01',
          transform: {
            x: 820,
            y: 930,
            rotationDeg: 0,
            scaleX: 1,
            scaleY: 1
          },
          overrides: {
            traversalSurfaceFeatureIds: []
          }
        }
      ],
      actors: [
        {
          id: 'capture-loup-volcanique-sentry',
          actorDefinitionId: 'capture:creature:crea-loup',
          x: 360,
          y: 240,
          facingX: 1
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
        baseTerrainFamilyId: 'plain',
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
