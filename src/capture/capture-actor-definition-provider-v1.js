import {
  normalizeMapActorVisual
} from '../actors/map-actor-visual-model.js?rev=map-actor-source-facing-v1';

const PREFIX = 'capture:creature:';

function text(value) {
  return typeof value === 'string' &&
    value.trim()
    ? value.trim()
    : null;
}

function safeArray(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function normalizeCatalogAssets(
  visualAssetCatalog
) {
  const byId = new Map();

  for (
    const asset of safeArray(
      visualAssetCatalog?.assets
    )
  ) {
    const id = text(asset?.id);
    const file = text(
      asset?.resource?.file
    );

    if (!id || !file) {
      continue;
    }

    byId.set(
      id,
      Object.freeze({
        id,
        file
      })
    );
  }

  return byId;
}

function joinPath(root, file) {
  const base =
    typeof root === 'string'
      ? root
      : '';

  if (!base) {
    return file;
  }

  return (
    base.replace(/\/+$/, '') +
    '/' +
    file.replace(/^\/+/, '')
  );
}

function definitionFromTransfer(
  transfer,
  assetsById,
  assetRoot
) {
  if (
    transfer?.schema !==
      'capture-creature-transfer-v1' ||
    !transfer.draft ||
    typeof transfer.draft !== 'object'
  ) {
    return null;
  }

  const creatureId =
    text(transfer.draft.id);
  const presentation =
    transfer.draft.presentation;

  if (
    !creatureId ||
    !presentation ||
    typeof presentation !== 'object'
  ) {
    return null;
  }

  const sourceAssetId =
    text(
      presentation.visual?.front
        ?.assetId
    ) ??
    text(
      presentation.visual?.back
        ?.assetId
    );

  if (!sourceAssetId) {
    return null;
  }

  const physicalAsset =
    assetsById.get(
      sourceAssetId
    );

  if (!physicalAsset) {
    throw new RangeError(
      `Capture visual asset not found in global catalog: ${sourceAssetId}`
    );
  }

  const id =
    PREFIX + creatureId;

  return Object.freeze({
    id,
    sourceKind: 'capture-creature',
    sourceId: creatureId,
    displayName:
      text(
        transfer.draft.displayName
      ) ?? creatureId,
    role: 'creature',
    mapVisual:
      normalizeMapActorVisual({
        assetId: sourceAssetId,
        role: 'creature'
      }),
    asset: Object.freeze({
      id: sourceAssetId,
      kind: 'map-actor-source',
      path: joinPath(
        assetRoot,
        physicalAsset.file
      ),
      label:
        text(
          transfer.draft.displayName
        ) ?? creatureId
    })
  });
}

export function createCaptureActorDefinitionProviderV1({
  creatureTransfers = [],
  visualAssetCatalog,
  assetRoot = ''
} = {}) {
  const assetsById =
    normalizeCatalogAssets(
      visualAssetCatalog
    );
  const definitions = new Map();
  const actorAssets = new Map();

  for (
    const transfer of safeArray(
      creatureTransfers
    )
  ) {
    const definition =
      definitionFromTransfer(
        transfer,
        assetsById,
        assetRoot
      );

    if (!definition) {
      continue;
    }

    if (
      definitions.has(
        definition.id
      )
    ) {
      throw new RangeError(
        `duplicate Actor Definition id: ${definition.id}`
      );
    }

    definitions.set(
      definition.id,
      definition
    );
    actorAssets.set(
      definition.asset.id,
      definition.asset
    );
  }

  const list =
    Object.freeze(
      [...definitions.values()]
        .sort((a, b) =>
          a.displayName.localeCompare(
            b.displayName,
            'fr'
          )
        )
    );

  const assets =
    Object.freeze(
      [...actorAssets.values()]
    );

  const resolveDefinition = (
    actorDefinitionId
  ) => {
    const id = text(
      actorDefinitionId
    );

    return id
      ? definitions.get(id) ??
          null
      : null;
  };

  const resolveAsset = (
    assetId
  ) => {
    const id = text(assetId);
    return id
      ? actorAssets.get(id) ??
          null
      : null;
  };

  return Object.freeze({
    listDefinitions() {
      return list;
    },
    resolveDefinition,
    listAssets() {
      return assets;
    },
    resolveAsset
  });
}
