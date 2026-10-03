import {
  createCaptureActorDefinitionProviderV1
} from './capture-actor-definition-provider-v1.js';

const LOUP_TRANSFER_URL =
  new URL(
    '../../combat-preview/data/capture/showcase/crea-loup.capture-creature-transfer-v1.json',
    import.meta.url
  );

const GLOBAL_VISUAL_CATALOG_URL =
  new URL(
    '../../capture-assets/data/assets/catalog/global-visual-assets.v1.json',
    import.meta.url
  );

const GLOBAL_VISUAL_ASSET_ROOT =
  new URL(
    '../../capture-assets/assets/library/',
    import.meta.url
  );

async function fetchJson(
  url,
  fetchImpl
) {
  const response =
    await fetchImpl(url);

  if (!response.ok) {
    throw new Error(
      `Unable to load Actor Catalog source ${url}: HTTP ${response.status}`
    );
  }

  return response.json();
}

export async function createCaptureActorPreviewProviderV1({
  fetchImpl = fetch
} = {}) {
  const [
    loupTransfer,
    visualAssetCatalog
  ] = await Promise.all([
    fetchJson(
      LOUP_TRANSFER_URL,
      fetchImpl
    ),
    fetchJson(
      GLOBAL_VISUAL_CATALOG_URL,
      fetchImpl
    )
  ]);

  return (
    createCaptureActorDefinitionProviderV1({
      creatureTransfers: [
        loupTransfer
      ],
      visualAssetCatalog,
      assetRoot:
        GLOBAL_VISUAL_ASSET_ROOT.href
    })
  );
}
