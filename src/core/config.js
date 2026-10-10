import {
  EXPLORATION_CONFIG_SCHEMA_VERSION,
  explorationDefaults
} from '../config/exploration-defaults.js';

function finiteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
}

function normalizeBoundaryFootprint(raw, fallback) {
  const source =
    raw && typeof raw === 'object' ? raw : {};
  const base =
    fallback && typeof fallback === 'object' ? fallback : {};

  return {
    left: finiteNumber(source.left, base.left ?? 0, { min: 0, max: 240 }),
    right: finiteNumber(source.right, base.right ?? 0, { min: 0, max: 240 }),
    top: finiteNumber(source.top, base.top ?? 0, { min: 0, max: 240 }),
    bottom: finiteNumber(source.bottom, base.bottom ?? 0, { min: 0, max: 240 })
  };
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
      ),
      boundaryFootprint:
        normalizeBoundaryFootprint(
          config.player?.boundaryFootprint,
          explorationDefaults.player.boundaryFootprint
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
    }
  };
}
