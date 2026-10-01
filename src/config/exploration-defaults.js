export const EXPLORATION_CONFIG_SCHEMA_VERSION = 1;

export const explorationDefaults = Object.freeze({
  schemaVersion: EXPLORATION_CONFIG_SCHEMA_VERSION,
  player: Object.freeze({
    radius: 18
  }),
  movement: Object.freeze({
    maxSpeed: 230
  }),
  input: Object.freeze({
    deadzone: 0.05
  }),
  simulation: Object.freeze({
    maxDeltaSeconds: 0.033
  }),
  render: Object.freeze({
    terrainPatchSize: 176,
    terrainPatchSpacing: 118,
    terrainPatchOpacity: 0.62,
    groundDetailSpacing: 180
  })
});
