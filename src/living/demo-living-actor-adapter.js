import {
  normalizeMapActorVisual
} from '../actors/map-actor-visual-model.js?rev=map-actor-source-facing-v1';

// DEMO adapter only.
// Future integration must resolve actorDefinitionId through Capture/Actor Definition.
const DEMO_LIVING_ACTOR_DEFINITIONS = new Map([
  [
    'capture.creature.demo.ground',
    Object.freeze({
      id: 'capture.creature.demo.ground',
      mapVisual: normalizeMapActorVisual({
        assetId: 'actor.demo.hero.traveler.01',
        role: 'creature',
        targetHeight: 54,
        sourceFacingX: 1,
        motion: {
          idleAmplitude: 1.5,
          idleFrequency: 1.1,
          walkAmplitude: 3,
          walkFrequency: 5
        }
      }),
      exploration: Object.freeze({
        radius: 12,
        locomotion: Object.freeze({
          modes: Object.freeze(['ground'])
        })
      })
    })
  ],
  [
    'capture.creature.demo.fly',
    Object.freeze({
      id: 'capture.creature.demo.fly',
      mapVisual: normalizeMapActorVisual({
        assetId: 'actor.demo.hero.traveler.01',
        role: 'creature',
        targetHeight: 46,
        sourceFacingX: 1,
        shadow: {
          enabled: true,
          widthRatio: 0.42,
          heightRatio: 0.1,
          opacity: 0.16
        },
        motion: {
          idleAmplitude: 3,
          idleFrequency: 0.8,
          walkAmplitude: 4,
          walkFrequency: 3
        }
      }),
      exploration: Object.freeze({
        radius: 10,
        locomotion: Object.freeze({
          modes: Object.freeze(['fly'])
        })
      })
    })
  ]
]);

export function resolveDemoLivingActorDefinition(actorDefinitionId) {
  const id =
    typeof actorDefinitionId === 'string'
      ? actorDefinitionId.trim()
      : '';

  return id
    ? DEMO_LIVING_ACTOR_DEFINITIONS.get(id) ?? null
    : null;
}
