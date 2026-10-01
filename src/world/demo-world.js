import { normalizeWorldSurface } from './surface-model.js';

export const demoWorld = {
  width: 2400,
  height: 1600,
  surface: normalizeWorldSurface({
    baseMaterialId: 'ground.forest.base',
    routes: [
      {
        id: 'forest-main-road',
        width: 82,
        materialId: 'road.dirt',
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
        materialId: 'water.stream',
        points: [
          { x: 985, y: 805 },
          { x: 1085, y: 785 },
          { x: 1190, y: 820 },
          { x: 1300, y: 792 },
          { x: 1435, y: 805 }
        ]
      }
    ]
  }),
  obstacles: [
    { x: 480, y: 300, w: 240, h: 180, kind: 'rock' },
    { x: 980, y: 760, w: 460, h: 90, kind: 'river' },
    { x: 1650, y: 360, w: 220, h: 300, kind: 'trees' },
    { x: 350, y: 1120, w: 520, h: 120, kind: 'trees' }
  ]
};
