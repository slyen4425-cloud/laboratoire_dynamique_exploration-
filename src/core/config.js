import {
  EXPLORATION_CONFIG_SCHEMA_VERSION,
  explorationDefaults
} from '../config/exploration-defaults.js';

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

export function normalizeExplorationConfig(raw = {}) {
  const config = raw && typeof raw === 'object' ? raw : {};

  return {
    schemaVersion: EXPLORATION_CONFIG_SCHEMA_VERSION,
    player: {
      radius: finiteNumber(
        config.player?.radius,
        explorationDefaults.player.radius,
        { min: 1 }
      )
    },
    movement: {
      maxSpeed: finiteNumber(
        config.movement?.maxSpeed,
        explorationDefaults.movement.maxSpeed,
        { min: 1 }
      )
    },
    input: {
      deadzone: finiteNumber(
        config.input?.deadzone,
        explorationDefaults.input.deadzone,
        { min: 0, max: 0.95 }
      )
    },
    simulation: {
      maxDeltaSeconds: finiteNumber(
        config.simulation?.maxDeltaSeconds,
        explorationDefaults.simulation.maxDeltaSeconds,
        { min: 0.001, max: 0.25 }
      )
    },
    render: {
      terrainPatchSize: finiteNumber(
        config.render?.terrainPatchSize,
        explorationDefaults.render.terrainPatchSize,
        { min: 72, max: 384 }
      ),
      terrainPatchSpacing: finiteNumber(
        config.render?.terrainPatchSpacing,
        explorationDefaults.render.terrainPatchSpacing,
        { min: 56, max: 320 }
      ),
      terrainPatchOpacity: finiteNumber(
        config.render?.terrainPatchOpacity,
        explorationDefaults.render.terrainPatchOpacity,
        { min: 0.1, max: 1 }
      ),
      groundDetailSpacing: finiteNumber(
        config.render?.groundDetailSpacing,
        explorationDefaults.render.groundDetailSpacing,
        { min: 96, max: 420 }
      )
    }
  };
}
