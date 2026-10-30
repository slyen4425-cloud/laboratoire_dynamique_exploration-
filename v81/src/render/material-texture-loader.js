import {
  createImageAssetLoader
} from '../assets/image-asset-loader.js';

function collectStrings(value, target) {
  if (typeof value === 'string') {
    if (value.trim()) target.add(value.trim());
    return;
  }

  if (Array.isArray(value)) {
    for (const entry of value) collectStrings(entry, target);
    return;
  }

  if (!value || typeof value !== 'object') return;

  for (const entry of Object.values(value)) {
    collectStrings(entry, target);
  }
}

export function collectMaterialAssetIds(materials) {
  const ids = new Set();

  for (const material of Array.isArray(materials) ? materials : []) {
    collectStrings(material?.assets, ids);
  }

  return Object.freeze([...ids]);
}

export function createMaterialTextureLoader(options) {
  return createImageAssetLoader(options);
}
