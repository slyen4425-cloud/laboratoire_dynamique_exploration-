import {
  normalizeLivingWorldConfig
} from './living-world-model.js';

// DEMO living-world data only.
// This stays isolated until Living World data is integrated into the canonical save/world contract.
export const demoLivingWorldConfig = normalizeLivingWorldConfig({
  spawnZones: [
    {
      id: 'demo-ground-zone',
      areaId: 'forest-exterior',
      x: 1500,
      y: 1000,
      radius: 120,
      biomeId: 'biome.forest',
      tags: ['demo', 'forest', 'ground']
    },
    {
      id: 'demo-fly-water-zone',
      areaId: 'forest-exterior',
      x: 1035,
      y: 795,
      radius: 8,
      biomeId: 'biome.forest',
      tags: ['demo', 'water', 'fly']
    }
  ],
  spawnRules: [
    {
      id: 'demo-ground-rule',
      zoneId: 'demo-ground-zone',
      actorDefinitionId: 'capture.creature.demo.ground',
      maxActive: 1,
      weight: 1
    },
    {
      id: 'demo-fly-rule',
      zoneId: 'demo-fly-water-zone',
      actorDefinitionId: 'capture.creature.demo.fly',
      maxActive: 1,
      weight: 1
    }
  ]
});
