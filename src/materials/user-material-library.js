export const USER_MATERIAL_SCHEMA_VERSION = 1;
export const USER_TEXTURE_MAX_BYTES = 8 * 1024 * 1024;
export const USER_TEXTURE_MIN_DIMENSION = 16;
export const USER_TEXTURE_MAX_DIMENSION = 4096;

const ALLOWED_MIME_TYPES = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/webp'
]);

function safeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeKind(kind) {
  return ['surface', 'path', 'water'].includes(kind)
    ? kind
    : null;
}

export function validateUserTextureMetadata({
  mimeType,
  bytes,
  width,
  height
} = {}) {
  const errors = [];
  const safeMimeType = safeString(mimeType);
  const safeBytes = Number(bytes);
  const safeWidth = Number(width);
  const safeHeight = Number(height);

  if (!ALLOWED_MIME_TYPES.includes(safeMimeType)) {
    errors.push('format-unsupported');
  }

  if (
    !Number.isFinite(safeBytes) ||
    safeBytes <= 0 ||
    safeBytes > USER_TEXTURE_MAX_BYTES
  ) {
    if (safeBytes > USER_TEXTURE_MAX_BYTES) {
      errors.push('file-too-large');
    } else {
      errors.push('file-size-invalid');
    }
  }

  if (
    !Number.isFinite(safeWidth) ||
    !Number.isFinite(safeHeight)
  ) {
    errors.push('dimensions-invalid');
  } else {
    if (
      safeWidth > USER_TEXTURE_MAX_DIMENSION ||
      safeHeight > USER_TEXTURE_MAX_DIMENSION
    ) {
      errors.push('dimensions-too-large');
    }

    if (
      safeWidth < USER_TEXTURE_MIN_DIMENSION ||
      safeHeight < USER_TEXTURE_MIN_DIMENSION
    ) {
      errors.push('dimensions-too-small');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export function createUserMaterialRecord({
  idToken,
  kind,
  label,
  mimeType,
  width,
  height,
  bytes,
  sourceName,
  blob,
  createdAt
} = {}) {
  const normalizedKind = normalizeKind(kind);
  const token = safeString(idToken);
  const safeLabel = safeString(label);
  const safeMimeType = safeString(mimeType);
  const safeSourceName = safeString(sourceName);

  if (!normalizedKind) {
    throw new Error('Invalid user material kind');
  }
  if (!token || !/^[a-z0-9-]+$/i.test(token)) {
    throw new Error('Invalid user material id token');
  }
  if (!safeLabel) {
    throw new Error('User material label is required');
  }

  const validation = validateUserTextureMetadata({
    mimeType: safeMimeType,
    bytes,
    width,
    height
  });

  if (!validation.valid) {
    throw new Error(
      `Invalid user texture: ${validation.errors.join(', ')}`
    );
  }

  if (!(blob instanceof Blob)) {
    throw new Error('User texture Blob is required');
  }

  return Object.freeze({
    schemaVersion: USER_MATERIAL_SCHEMA_VERSION,
    id: `user.material.${normalizedKind}.${token}`,
    assetId: `user.texture.${normalizedKind}.${token}`,
    kind: normalizedKind,
    label: safeLabel,
    mimeType: safeMimeType,
    width: Number(width),
    height: Number(height),
    bytes: Number(bytes),
    sourceName: safeSourceName || 'texture',
    provenance: 'user-local',
    createdAt:
      safeString(createdAt) ||
      new Date().toISOString(),
    blob
  });
}

export function materialDefinitionFromUserRecord(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid user material record');
  }

  const common = {
    id: record.id,
    kind: record.kind,
    label: record.label
  };

  if (record.kind === 'surface') {
    return Object.freeze({
      ...common,
      assets: Object.freeze({
        base: record.assetId,
        variants: Object.freeze([]),
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        baseColor: '#70766c',
        variationColors: Object.freeze([]),
        detailSpacing: 0,
        decalSpacing: 0,
        decalDensity: 0,
        decalMinSize: 0,
        decalMaxSize: 0,
        decalOpacity: 0
      })
    });
  }

  if (record.kind === 'path') {
    return Object.freeze({
      ...common,
      assets: Object.freeze({
        center: record.assetId,
        edge: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerEdgeColor: '#5a5044',
        innerEdgeColor: '#796b59',
        centerColor: '#8a7a66',
        highlightColor: '#c4b8a2',
        outerEdgePadding: 16,
        innerEdgePadding: 8,
        highlightRatio: 0.06,
        highlightOpacity: 0.16
      })
    });
  }

  if (record.kind === 'water') {
    return Object.freeze({
      ...common,
      assets: Object.freeze({
        center: record.assetId,
        bank: null,
        decals: Object.freeze([])
      }),
      render: Object.freeze({
        outerBankColor: '#4d5e50',
        innerBankColor: '#71806c',
        waterColor: '#3f7b91',
        highlightColor: '#c7eef4',
        outerBankPadding: 18,
        innerBankPadding: 8,
        highlightRatio: 0.08,
        highlightOpacity: 0.16
      })
    });
  }

  throw new Error('Unsupported user material kind');
}

export function composeMaterialPackWithUserMaterials(
  basePack,
  records
) {
  const source =
    basePack && typeof basePack === 'object'
      ? basePack
      : {};
  const userDefinitions = (
    Array.isArray(records) ? records : []
  ).map(materialDefinitionFromUserRecord);

  return Object.freeze({
    ...source,
    materials: Object.freeze([
      ...(Array.isArray(source.materials)
        ? source.materials
        : []),
      ...userDefinitions
    ])
  });
}

export function countMaterialReferences(
  worldDocument,
  materialId
) {
  const id = safeString(materialId);
  if (!id) return 0;

  let count = 0;

  for (
    const area of
      Array.isArray(worldDocument?.areas)
        ? worldDocument.areas
        : []
  ) {
    const surface = area?.surface ?? {};

    if (surface.baseMaterialId === id) {
      count += 1;
    }

    for (const item of [
      ...(surface.zones ?? []),
      ...(surface.routes ?? []),
      ...(surface.rivers ?? [])
    ]) {
      if (item?.materialId === id) {
        count += 1;
      }
    }
  }

  return count;
}

export async function decodeUserTextureFileDimensions(
  file,
  {
    createImageBitmapFn =
      typeof createImageBitmap === 'function'
        ? createImageBitmap
        : null,
    imageFactory =
      typeof Image === 'function'
        ? () => new Image()
        : null,
    urlApi =
      typeof URL !== 'undefined'
        ? URL
        : null
  } = {}
) {
  if (!(file instanceof Blob)) {
    throw new Error('Texture file is invalid');
  }

  if (typeof createImageBitmapFn === 'function') {
    const bitmap = await createImageBitmapFn(file);
    try {
      return Object.freeze({
        width: bitmap.width,
        height: bitmap.height
      });
    } finally {
      bitmap.close?.();
    }
  }

  if (
    typeof imageFactory !== 'function' ||
    !urlApi?.createObjectURL ||
    !urlApi?.revokeObjectURL
  ) {
    throw new Error('Image decoder unavailable');
  }

  const url = urlApi.createObjectURL(file);

  try {
    return await new Promise((resolve, reject) => {
      const image = imageFactory();
      image.onload = () => resolve(Object.freeze({
        width: image.naturalWidth || image.width,
        height: image.naturalHeight || image.height
      }));
      image.onerror = () => reject(
        new Error('Texture image decode failed')
      );
      image.src = url;
    });
  } finally {
    urlApi.revokeObjectURL(url);
  }
}
