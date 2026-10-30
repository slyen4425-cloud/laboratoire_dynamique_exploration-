import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMaterialAssetResolver
} from '../src/assets/material-asset-adapter.js';
import {
  createUserMaterialAssetResolver
} from '../src/assets/user-material-asset-resolver.js';

test('user blobs resolve through the same material asset resolver without overriding native ids', () => {
  const calls = [];
  const urlApi = {
    createObjectURL(blob) {
      calls.push(['create', blob]);
      return 'blob:user-texture-1';
    },
    revokeObjectURL(url) {
      calls.push(['revoke', url]);
    }
  };

  const blob = new Blob(['abc'], { type: 'image/png' });
  const user = createUserMaterialAssetResolver([
    {
      id: 'user.material.surface.one',
      assetId: 'user.texture.surface.one',
      kind: 'surface',
      blob
    }
  ], { urlApi });

  const resolve = createMaterialAssetResolver({
    resolveUserAsset: user.resolve
  });

  assert.match(
    resolve('texture.grass.forest.base.01').path,
    /grass_forest_base_01\.webp$/
  );
  assert.deepEqual(
    resolve('user.texture.surface.one'),
    {
      id: 'user.texture.surface.one',
      kind: 'texture',
      path: 'blob:user-texture-1',
      provenance: 'user-local'
    }
  );
  assert.equal(resolve('missing.asset'), null);

  user.dispose();
  assert.deepEqual(calls.at(-1), ['revoke', 'blob:user-texture-1']);
});
