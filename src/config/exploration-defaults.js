export const EXPLORATION_CONFIG_SCHEMA_VERSION = 1;

export const explorationDefaults = Object.freeze({
  schemaVersion: EXPLORATION_CONFIG_SCHEMA_VERSION,
  player: Object.freeze({
    radius: 18,
    boundaryFootprint: Object.freeze({
      left: 18,
      right: 18,
      top: 76,
      bottom: 8
    })
  }),
  movement: Object.freeze({
    maxSpeed: 230
  }),
  input: Object.freeze({
    deadzone: 0.05
  }),
  simulation: Object.freeze({
    maxDeltaSeconds: 0.033
  })
});
