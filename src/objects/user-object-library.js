import {
  categoryIdFromFolderId,
  resolveObjectLibraryCategory
} from './object-library-taxonomy.js?rev=building-interiors-passages-ux-r1';

export const USER_WORLD_OBJECT_SCHEMA_VERSION = 1;
export const USER_WORLD_OBJECT_MAX_BYTES = 8 * 1024 * 1024;
export const USER_WORLD_OBJECT_MIN_DIMENSION = 16;
export const USER_WORLD_OBJECT_MAX_DIMENSION = 4096;

const ALLOWED_MIME_TYPES = Object.freeze([
  'image/png',
  'image/jpeg',
  'image/webp'
]);

const ALLOWED_KINDS = Object.freeze([
  'building',
  'tree',
  'rock',
  'door',
  'stairs',
  'decor'
]);

function safe(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeToken(value) {
  return safe(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function validateUserWorldObjectMetadata({
  mimeType,
  bytes,
  width,
  height
} = {}) {
  const errors = [];
  const type = safe(mimeType);
  const size = Number(bytes);
  const w = Number(width);
  const h = Number(height);

  if (!ALLOWED_MIME_TYPES.includes(type)) {
    errors.push('format-unsupported');
  }
  if (!Number.isFinite(size) || size <= 0) {
    errors.push('file-size-invalid');
  } else if (size > USER_WORLD_OBJECT_MAX_BYTES) {
    errors.push('file-too-large');
  }
  if (!Number.isFinite(w) || !Number.isFinite(h)) {
    errors.push('dimensions-invalid');
  } else {
    if (w < USER_WORLD_OBJECT_MIN_DIMENSION || h < USER_WORLD_OBJECT_MIN_DIMENSION) {
      errors.push('dimensions-too-small');
    }
    if (w > USER_WORLD_OBJECT_MAX_DIMENSION || h > USER_WORLD_OBJECT_MAX_DIMENSION) {
      errors.push('dimensions-too-large');
    }
  }

  return Object.freeze({
    valid: errors.length === 0,
    errors: Object.freeze(errors)
  });
}

function logicalBaseSize(width, height) {
  const w = Number(width);
  const h = Number(height);
  const max = Math.max(w, h);
  const target = 220;
  const ratio = max > 0 ? target / max : 1;

  return Object.freeze({
    width: Math.max(48, Math.round(w * ratio)),
    height: Math.max(48, Math.round(h * ratio))
  });
}

export function createUserWorldObjectRecord({
  idToken,
  kind,
  label,
  categoryId,
  folderId,
  folderLabel,
  mimeType,
  width,
  height,
  bytes,
  sourceName,
  blob,
  createdAt
} = {}) {
  const token = safeToken(idToken);
  const safeKind = ALLOWED_KINDS.includes(kind) ? kind : null;
  const safeLabel = safe(label);
  const safeCategoryId = safe(categoryId);
  const safeFolderId = safe(folderId);
  const safeFolderLabel = safe(folderLabel);
  const safeMimeType = safe(mimeType);

  if (!token) throw new Error('Invalid user object id token');
  if (!safeKind) throw new Error('Invalid user object kind');
  if (!safeLabel) throw new Error('User object label is required');
  if (!resolveObjectLibraryCategory(safeCategoryId)) {
    throw new Error('Invalid user object category');
  }
  if (
    !safeFolderId ||
    categoryIdFromFolderId(safeFolderId) !== safeCategoryId
  ) {
    throw new Error('Invalid user object folder');
  }

  const validation = validateUserWorldObjectMetadata({
    mimeType: safeMimeType,
    bytes,
    width,
    height
  });
  if (!validation.valid) {
    throw new Error(
      `Invalid user object asset: ${validation.errors.join(', ')}`
    );
  }
  if (!(blob instanceof Blob)) {
    throw new Error('User object Blob is required');
  }

  const baseSize = logicalBaseSize(width, height);

  return Object.freeze({
    schemaVersion: USER_WORLD_OBJECT_SCHEMA_VERSION,
    id: `user.object.record.${safeKind}.${token}`,
    definitionId: `user.objectdef.${safeKind}.${token}`,
    assetId: `user.object.asset.${safeKind}.${token}`,
    kind: safeKind,
    label: safeLabel,
    categoryId: safeCategoryId,
    folderId: safeFolderId,
    folderLabel: safeFolderLabel || safeFolderId.split('/').at(-1),
    mimeType: safeMimeType,
    width: Number(width),
    height: Number(height),
    bytes: Number(bytes),
    baseSize,
    sourceName: safe(sourceName) || 'object',
    provenance: 'user-local',
    createdAt: safe(createdAt) || new Date().toISOString(),
    blob
  });
}

export function objectDefinitionFromUserRecord(record) {
  if (!record || typeof record !== 'object') {
    throw new Error('Invalid user object record');
  }

  const definition = {
    schemaVersion: 1,
    id: record.definitionId,
    label: record.label,
    kind: record.kind,
    library: {
      categoryId: record.categoryId,
      folderId: record.folderId,
      folderLabel: record.folderLabel,
      provenance: 'user-local'
    },
    visual: {
      assetId: record.assetId
    },
    baseSize: {
      width: record.baseSize.width,
      height: record.baseSize.height
    }
  };

  if (record.kind === 'building') {
    definition.footprint = {
      enabled: false,
      widthRatio: 0.8,
      heightRatio: 0.7,
      offsetX: 0,
      offsetY: 0
    };
    definition.doorAnchors = [];
  }

  return Object.freeze(definition);
}

export function countObjectDefinitionReferences(
  worldDocument,
  definitionId
) {
  const id = safe(definitionId);
  if (!id) return 0;

  let count = 0;
  for (const area of Array.isArray(worldDocument?.areas) ? worldDocument.areas : []) {
    for (const object of Array.isArray(area?.objects) ? area.objects : []) {
      if (object?.objectDefinitionId === id) count += 1;
    }
  }
  return count;
}

export async function decodeUserWorldObjectFileDimensions(
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
    throw new Error('Object image file is invalid');
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
        new Error('Object image decode failed')
      );
      image.src = url;
    });
  } finally {
    urlApi.revokeObjectURL(url);
  }
}
