function freezeArray(values) {
  return Object.freeze(values.map((value) => deepFreeze(value)));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }

  if (Array.isArray(value)) {
    return freezeArray(value);
  }

  for (const key of Object.keys(value)) {
    value[key] = deepFreeze(value[key]);
  }

  return Object.freeze(value);
}

function normalizeMaterial(material) {
  if (!material || typeof material !== 'object') return null;

  const id = typeof material.id === 'string' ? material.id.trim() : '';
  const kind = typeof material.kind === 'string' ? material.kind.trim() : '';

  if (!id || !['surface', 'path', 'water'].includes(kind)) return null;

  return deepFreeze({
    id,
    kind,
    label:
      typeof material.label === 'string' && material.label.trim()
        ? material.label.trim()
        : id,
    assets:
      material.assets && typeof material.assets === 'object'
        ? structuredClone(material.assets)
        : {},
    render:
      material.render && typeof material.render === 'object'
        ? structuredClone(material.render)
        : {}
  });
}

function finite(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalizeSurfaceTransition(input) {
  if (
    !input ||
    typeof input !== 'object' ||
    input.mode !== 'feather'
  ) {
    return deepFreeze({ mode: 'none' });
  }

  const minWidth = Math.max(
    0,
    finite(input.minWidth, 6)
  );
  const maxWidth = Math.max(
    minWidth,
    finite(input.maxWidth, 64)
  );

  const normalized = {
    mode: 'feather',
    widthRatio: clamp(
      finite(input.widthRatio, 0.18),
      0.01,
      0.45
    ),
    minWidth,
    maxWidth,
    steps: clamp(
      Math.round(finite(input.steps, 7)),
      2,
      12
    ),
    edgeOpacity: clamp(
      finite(input.edgeOpacity, 0.08),
      0,
      0.95
    )
  };

  if (input.method === 'smooth-mask') {
    normalized.method = 'smooth-mask';
    normalized.blurRatio = clamp(
      finite(input.blurRatio, 0.58),
      0.2,
      1
    );
    normalized.fallbackMethod = 'passes';
  }

  return deepFreeze(normalized);
}

export function createMaterialRegistry(pack) {
  const source = pack && typeof pack === 'object' ? pack : {};
  const materials = Array.isArray(source.materials)
    ? source.materials.map(normalizeMaterial).filter(Boolean)
    : [];

  const byId = new Map();

  for (const material of materials) {
    if (byId.has(material.id)) {
      throw new Error(`Duplicate material id: ${material.id}`);
    }
    byId.set(material.id, material);
  }

  const surfaceTransition =
    normalizeSurfaceTransition(
      source.surfaceTransition
    );

  return Object.freeze({
    schemaVersion: Number.isInteger(source.schemaVersion)
      ? source.schemaVersion
      : 1,
    packId:
      typeof source.id === 'string' && source.id.trim()
        ? source.id.trim()
        : 'material-pack',
    surfaceTransition,
    list() {
      return Object.freeze([...byId.values()]);
    },
    resolve(materialId) {
      const id = typeof materialId === 'string' ? materialId.trim() : '';
      return id ? byId.get(id) ?? null : null;
    },
    require(materialId, expectedKind) {
      const material = this.resolve(materialId);

      if (!material) {
        throw new Error(`Unknown material id: ${materialId}`);
      }

      if (expectedKind && material.kind !== expectedKind) {
        throw new Error(
          `Material ${materialId} is ${material.kind}, expected ${expectedKind}`
        );
      }

      return material;
    }
  });
}
