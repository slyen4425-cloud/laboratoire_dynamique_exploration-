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
      x: 320,
      y: 520,
      radius: 60,
      biomeId: 'biome.forest',
      tags: ['demo', 'forest', 'ground']
    },
    {
      id: 'demo-swim-water-zone',
      areaId: 'forest-exterior',
      x: 1320,
      y: 795,
      radius: 18,
      biomeId: 'biome.forest',
      tags: ['demo', 'water', 'swim']
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
      id: 'demo-swim-rule',
      zoneId: 'demo-swim-water-zone',
      actorDefinitionId: 'capture.creature.demo.swim',
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
