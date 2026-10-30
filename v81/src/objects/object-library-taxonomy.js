const CATEGORIES = Object.freeze([
  Object.freeze({ id: 'buildings', label: 'Maisons / bâtiments' }),
  Object.freeze({ id: 'vegetation', label: 'Végétation' }),
  Object.freeze({ id: 'rocks', label: 'Rochers' }),
  Object.freeze({ id: 'doors', label: 'Portes / entrées' }),
  Object.freeze({ id: 'stairs', label: 'Escaliers' }),
  Object.freeze({ id: 'bridges', label: 'Ponts' }),
  Object.freeze({ id: 'decor', label: 'Décors' })
]);

const FOLDERS = Object.freeze([
  Object.freeze({ id: 'buildings/houses/temperate', categoryId: 'buildings', label: 'Maisons · Tempéré', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/houses/snow', categoryId: 'buildings', label: 'Maisons · Neige', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/houses/sand', categoryId: 'buildings', label: 'Maisons · Sable', defaultKind: 'building' }),
  Object.freeze({ id: 'buildings/inns/temperate', categoryId: 'buildings', label: 'Auberges · Tempéré', defaultKind: 'building' }),
  Object.freeze({ id: 'vegetation/trees', categoryId: 'vegetation', label: 'Arbres', defaultKind: 'tree' }),
  Object.freeze({ id: 'vegetation/bushes', categoryId: 'vegetation', label: 'Buissons', defaultKind: 'decor' }),
  Object.freeze({ id: 'vegetation/flowers-grass', categoryId: 'vegetation', label: 'Fleurs / herbes', defaultKind: 'decor' }),
  Object.freeze({ id: 'rocks/general', categoryId: 'rocks', label: 'Rochers', defaultKind: 'rock' }),
  Object.freeze({ id: 'doors/general', categoryId: 'doors', label: 'Portes / entrées', defaultKind: 'door' }),
  Object.freeze({ id: 'stairs/general', categoryId: 'stairs', label: 'Escaliers', defaultKind: 'stairs' }),
  Object.freeze({ id: 'bridges/general', categoryId: 'bridges', label: 'Ponts', defaultKind: 'bridge' }),
  Object.freeze({ id: 'decor/general', categoryId: 'decor', label: 'Décors divers', defaultKind: 'decor' })
]);

function safe(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function listObjectLibraryCategories() {
  return CATEGORIES;
}

export function listObjectLibraryFolders(categoryId = null) {
  const id = safe(categoryId);
  return id
    ? Object.freeze(FOLDERS.filter((folder) => folder.categoryId === id))
    : FOLDERS;
}

export function resolveObjectLibraryCategory(categoryId) {
  const id = safe(categoryId);
  return id
    ? CATEGORIES.find((item) => item.id === id) ?? null
    : null;
}

export function resolveObjectLibraryFolder(folderId) {
  const id = safe(folderId);
  return id
    ? FOLDERS.find((item) => item.id === id) ?? null
    : null;
}

export function categoryIdFromFolderId(folderId) {
  const id = safe(folderId);
  if (!id) return null;
  const known = resolveObjectLibraryFolder(id);
  if (known) return known.categoryId;
  const first = id.split('/')[0];
  return resolveObjectLibraryCategory(first)?.id ?? null;
}

export function defaultObjectKindForFolder(folderId) {
  return resolveObjectLibraryFolder(folderId)?.defaultKind ?? 'decor';
}

export function createCustomObjectLibraryFolder({
  categoryId,
  parentFolderId,
  label,
  idToken
} = {}) {
  const category = resolveObjectLibraryCategory(categoryId);
  const parent = safe(parentFolderId);
  const safeLabel = safe(label);
  const token = safe(idToken)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!category || !safeLabel || !token) {
    throw new Error('Invalid custom object library folder');
  }

  const base =
    parent && categoryIdFromFolderId(parent) === category.id
      ? parent
      : category.id;

  return Object.freeze({
    id: `${base}/${token}`,
    categoryId: category.id,
    label: safeLabel,
    defaultKind: defaultObjectKindForFolder(parent)
  });
}
