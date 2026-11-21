import {
  createCaptureActorDefinitionProviderV1
} from './capture-actor-definition-provider-v1.js?rev=actor-opponent-view-v1';
import {loadCaptureAuthorEncounterBundleV1} from './capture-showcase-encounter-source-v1.js';

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


// Full official creature visual projection for the NPC image picker.
// Reuses the already-authoritative Capture Actor provider and the same
// physical global-assets release; no second list of creature image paths.
export async function createCaptureActorLibraryProviderV1({fetchImpl=fetch}={}){
 const [bundle,visualAssetCatalog]=await Promise.all([
  loadCaptureAuthorEncounterBundleV1({fetchImpl}),
  fetchJson(GLOBAL_VISUAL_CATALOG_URL,fetchImpl)
 ]);
 return createCaptureActorDefinitionProviderV1({
  creatureTransfers:bundle.creatureTransfers,
  visualAssetCatalog,
  assetRoot:GLOBAL_VISUAL_ASSET_ROOT.href
 });
}
