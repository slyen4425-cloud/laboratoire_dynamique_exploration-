import { demoWorldDocument } from '../world/demo-world.js?rev=terrain-family-encounters-v1';
import {
  addActorPlacement,
  addPortal,
  addSpawn,
  addWorldEvent,
  addSurfacePath,
  addTerrainFamilyDefinition,
  addWorldObject,
  appendSurfacePathPoint,
  createWorldBuilderDraft,
  deleteActorPlacement,
  deletePortal,
  deleteSpawn,
  deleteWorldEvent,
  deleteSurfacePath,
  deleteTerrainFamilyDefinition,
  deleteWorldObject,
  duplicateWorldObject,
  importWorldBuilderDocument,
  serializeWorldBuilderDraft,
  updateActorPlacement,
  updateAreaProperties,
  updateTerrainFamilyDefinition,
  updateTerrainFamilyEncounterProfile,
  updateTerrainFamilyElementChance,
  updatePortal,
  updateSpawn,
  updateWorldEvent,
  updateSurfacePath,
  updateWorldObjectTransform,
  updateWorldObjectOverrides,
  validateWorldBuilderDraft
} from './world-builder-draft.js?rev=world-event-contract-v1';
import {
  readWorldBuilderTestHandoff,
  readWorldBuilderTestSession,
  saveWorldBuilderTestHandoff
} from './world-builder-test-handoff.js?rev=surface-traversal-replay-v1';
import {
  clampBuilderZoom,
  computeBuilderView,
  canvasPointToWorld,
  panBuilderCenter,
  pointInRotatedRect,
  zoomBuilderAtCanvasPoint
} from './world-builder-viewport.js';
import { createSurfaceRenderer } from '../render/surface-renderer.js';
import { createWorldObjectRenderer } from '../render/world-object-renderer.js';
import { createPortalRenderer } from '../render/portal-renderer.js';
import { createMapActorRenderer } from '../render/map-actor-renderer.js?rev=map-actor-source-facing-v1';
import {
  createPlacedMapActorView
} from '../actors/placed-map-actor-view.js';
import {
  createMapActorAssetResolver
} from '../assets/map-actor-asset-adapter.js';
import {
  createMapActorVisualPreparer
} from '../assets/map-actor-visual-preparer.js';
import {
  createCaptureActorPreviewProviderV1
} from '../capture/capture-actor-preview-loader-v1.js?rev=actor-opponent-view-v1';
import {
  WORLD_OBJECT_LIMITS,
  bridgeVisualRect,
  buildingVisualRect
} from '../world/world-object-model.js?rev=object-catalog-placement-v1';
import {
  resolveWorldObjectPlacement,
  resolveWorldObjectPlacements
} from '../world/world-object-placement-model.js?rev=object-catalog-placement-v1';
import {
  objectDefinitionCatalogV1
} from '../objects/object-definition-catalog.js?rev=object-catalog-placement-v1';
import {
  resolvePortalTriggerPoint
} from '../world/portal-model.js?rev=builder-dynamic-return-v1';
import {
  resolveWorldTriggerPoint
} from '../world/world-trigger-geometry.js?rev=world-event-contract-v1';
import {
  resolveWorldAreaSpawnPoint
} from '../world/world-area-model.js?rev=terrain-family-encounters-v1';
import {
  materialPackV1
} from '../materials/material-pack-v1.js';
import {
  createTerrainFamilyRegistry
} from '../world/terrain-family-registry.js?rev=terrain-family-extensibility-v1';
import {
  createCaptureCreatureCatalogProvider
} from '../capture/capture-creature-catalog-provider.js?rev=terrain-family-encounters-v1';
import {
  CAPTURE_CREATURE_CATALOG_PREVIEW_V1
} from '../capture/capture-creature-catalog-preview-v1.js?rev=terrain-family-encounters-v1';
import {
  createMaterialRegistry
} from '../materials/material-registry.js';
import {
  resolveMaterialAsset
} from '../assets/material-asset-adapter.js';
import {
  listWorldObjectAssets,
  resolveWorldObjectAsset
} from '../assets/world-object-asset-adapter.js';
import {
  createImageAssetLoader
} from '../assets/image-asset-loader.js?rev=map-actor-dataurl-fix-v1';
import {
  collectMaterialAssetIds,
  createMaterialTextureLoader
} from '../render/material-texture-loader.js';

const $ = (id) => document.getElementById(id);

const canvas = $('builder-preview');
const ctx = canvas.getContext('2d');
const statusEl = $('builder-status');
const validationEl = $('validation-summary');
const jsonPreview = $('json-preview');

const materialRegistry = createMaterialRegistry(materialPackV1);
const surfaceMaterials = materialRegistry
  .list()
  .filter((material) => material.kind === 'surface');
const pathMaterials = materialRegistry
  .list()
  .filter((material) => material.kind === 'path');
const waterMaterials = materialRegistry
  .list()
  .filter((material) => material.kind === 'water');

const captureCreatureCatalog =
  createCaptureCreatureCatalogProvider(
    CAPTURE_CREATURE_CATALOG_PREVIEW_V1
  );

const objectDefinitions =
  objectDefinitionCatalogV1.list();

const textureLoader = createMaterialTextureLoader({
  resolveAsset: resolveMaterialAsset
});
await textureLoader.load(
  collectMaterialAssetIds(materialRegistry.list())
);

const objectImageLoader = createImageAssetLoader({
  resolveAsset: resolveWorldObjectAsset,
  cacheRevision: 'world-builder-dynamique-ui-v1'
});
await objectImageLoader.load(
  listWorldObjectAssets().map((asset) => asset.id)
);

const surfaceRenderer = createSurfaceRenderer({
  materialRegistry,
  textureLoader
});
const objectRenderer = createWorldObjectRenderer({
  imageLoader: objectImageLoader,
  resolveVisualAsset: resolveWorldObjectAsset
});
const portalRenderer = createPortalRenderer();

const captureActorDefinitionProvider =
  await createCaptureActorPreviewProviderV1();
const actorDefinitions =
  captureActorDefinitionProvider.listDefinitions();

let mapActorImageLoader = null;
let mapActorVisualPreparer = null;
let mapActorRenderer = null;

async function rebuildMapActorPipeline() {
  mapActorVisualPreparer?.dispose?.();
  mapActorImageLoader?.dispose?.();

  const assets =
    captureActorDefinitionProvider.listAssets();
  const resolveActorAsset =
    createMapActorAssetResolver(assets);

  mapActorImageLoader =
    createImageAssetLoader({
      resolveAsset: resolveActorAsset
    });

  const assetIds =
    assets.map((asset) => asset.id);
  const loadStatus =
    await mapActorImageLoader.load(
      assetIds
    );

  if (
    loadStatus.ready !==
      assetIds.length ||
    loadStatus.missing > 0 ||
    loadStatus.errors > 0
  ) {
    throw new Error(
      `Actor Catalog assets unavailable: ${JSON.stringify(loadStatus)}`
    );
  }

  mapActorVisualPreparer =
    createMapActorVisualPreparer({
      imageLoader:
        mapActorImageLoader
    });

  const prepareStatus =
    mapActorVisualPreparer.prepare(
      assetIds
    );

  if (
    prepareStatus.ready !==
      assetIds.length ||
    prepareStatus.errors > 0
  ) {
    throw new Error(
      `Actor Catalog preparation failed: ${JSON.stringify(prepareStatus)}`
    );
  }

  mapActorRenderer =
    createMapActorRenderer({
      preparedVisuals:
        mapActorVisualPreparer
    });
}

const builderParams = new URLSearchParams(window.location.search);
const resumeBuilderTest =
  builderParams.get('resumeBuilderTest') === '1';
const resumedTestSession = resumeBuilderTest
  ? readWorldBuilderTestSession(window.sessionStorage)
  : null;
const resumedTestDocument =
  resumedTestSession?.document ??
  (
    resumeBuilderTest
      ? readWorldBuilderTestHandoff(window.sessionStorage)
      : null
  );

if (resumeBuilderTest && !resumedTestDocument) {
  throw new Error(
    'Session de test World Builder introuvable ou invalide'
  );
}

let draft = createWorldBuilderDraft(
  resumedTestDocument ?? demoWorldDocument
);
let selectedAreaId =
  draft.initialAreaId ??
  draft.areas[0]?.id ??
  null;
let selectedSpawnId = null;
let selectedObjectId = null;
let selectedPortalId =
  draft.portals[0]?.id ?? null;
let selectedEventId =
  draft.events?.[0]?.id ?? null;
let selectedSurfaceKind = null;
let selectedSurfacePathId = null;
let selectedTerrainFamilyDefinitionId =
  draft.terrainFamilies?.[0]?.id ?? null;
let selectedEncounterFamilyId =
  draft.terrainFamilies?.some(
    (family) => family.id === 'forest'
  )
    ? 'forest'
    : draft.terrainFamilies?.[0]?.id ?? null;
let zoom = 0.35;
let center = { x: 0, y: 0 };
let fitRequested = true;
let lastView = null;
let mapTool = 'select';
let pointerSession = null;
let pinchState = null;
let hoverWorldPoint = null;
const activePointers = new Map();

const initialActorArea =
  draft.areas.find(
    (area) =>
      area.id === selectedAreaId
  ) ??
  draft.areas[0] ??
  null;
let selectedActorPlacementId =
  initialActorArea?.actors?.[0]?.id ??
  null;

await rebuildMapActorPipeline();

canvas.dataset.tool = mapTool;

function currentValidation() {
  return validateWorldBuilderDraft(draft);
}

function normalizedDocument() {
  return currentValidation().document;
}

function currentAreaRaw() {
  return draft.areas.find((area) => area.id === selectedAreaId) ?? null;
}

function currentAreaNormalized() {
  return normalizedDocument()?.areas.find(
    (area) => area.id === selectedAreaId
  ) ?? null;
}

function currentObjectRaw() {
  return currentAreaRaw()?.objects?.find(
    (object) => object.id === selectedObjectId
  ) ?? null;
}

function resolvedObjects(
  area = currentAreaRaw()
) {
  return resolveWorldObjectPlacements(
    area?.objects ?? []
  );
}

function currentObjectResolved() {
  return resolveWorldObjectPlacement(
    currentObjectRaw()
  );
}

function currentSpawnRaw() {
  return currentAreaRaw()?.spawns?.find(
    (spawn) => spawn.id === selectedSpawnId
  ) ?? null;
}

function currentPortalRaw() {
  return draft.portals?.find(
    (portal) => portal.id === selectedPortalId
  ) ?? null;
}

function currentWorldEventRaw() {
  return draft.events?.find(
    (event) => event.id === selectedEventId
  ) ?? null;
}

function currentSurfacePathRaw() {
  const area = currentAreaRaw();
  if (!area || !selectedSurfaceKind || !selectedSurfacePathId) {
    return null;
  }

  const items =
    selectedSurfaceKind === 'river'
      ? area.surface?.rivers
      : selectedSurfaceKind === 'terrain'
        ? area.surface?.zones
        : area.surface?.routes;

  return items?.find(
    (item) => item.id === selectedSurfacePathId
  ) ?? null;
}

function surfacePathItems(area = currentAreaRaw()) {
  if (!area) return [];

  return [
    ...(area.surface?.zones ?? []).map((item) => ({
      ...item,
      kind: 'terrain',
      key: `terrain:${item.id}`
    })),
    ...(area.surface?.routes ?? []).map((item) => ({
      ...item,
      kind: 'route',
      key: `route:${item.id}`
    })),
    ...(area.surface?.rivers ?? []).map((item) => ({
      ...item,
      kind: 'river',
      key: `river:${item.id}`
    }))
  ];
}

function setStatus(message, invalid = false) {
  statusEl.textContent = message;
  validationEl.textContent = message;
  validationEl.classList.toggle('invalid', invalid);
}

function setOptions(select, items, value, {
  valueKey = 'id',
  label = (item) => item.id
} = {}) {
  const previous = value ?? select.value;
  select.replaceChildren();

  for (const item of items) {
    const option = document.createElement('option');
    option.value = item[valueKey];
    option.textContent = label(item);
    select.append(option);
  }

  if (items.some((item) => item[valueKey] === previous)) {
    select.value = previous;
  }
}

function ensureSelections() {
  const area = currentAreaRaw() ?? draft.areas[0] ?? null;
  selectedAreaId = area?.id ?? null;

  if (!area) {
    selectedSpawnId = null;
    selectedObjectId = null;
    return;
  }

  if (!area.spawns?.some((spawn) => spawn.id === selectedSpawnId)) {
    selectedSpawnId = area.spawns?.[0]?.id ?? null;
  }

  if (!area.objects?.some((object) => object.id === selectedObjectId)) {
    selectedObjectId = area.objects?.[0]?.id ?? null;
  }

  if (!area.actors?.some((actor) => actor.id === selectedActorPlacementId)) {
    selectedActorPlacementId = area.actors?.[0]?.id ?? null;
  }

  if (!draft.portals?.some((portal) => portal.id === selectedPortalId)) {
    selectedPortalId = draft.portals?.[0]?.id ?? null;
  }

  if (!draft.events?.some((event) => event.id === selectedEventId)) {
    selectedEventId = draft.events?.[0]?.id ?? null;
  }

  const families = terrainFamilies();

  if (
    !families.some(
      (family) =>
        family.id ===
        selectedTerrainFamilyDefinitionId
    )
  ) {
    selectedTerrainFamilyDefinitionId =
      families[0]?.id ?? null;
  }

  if (
    !families.some(
      (family) =>
        family.id ===
        selectedEncounterFamilyId
    )
  ) {
    selectedEncounterFamilyId =
      families.some(
        (family) => family.id === 'forest'
      )
        ? 'forest'
        : families[0]?.id ?? null;
  }

  if (
    selectedSurfacePathId &&
    !surfacePathItems(area).some(
      (item) =>
        item.id === selectedSurfacePathId &&
        item.kind === selectedSurfaceKind
    )
  ) {
    selectedSurfaceKind = null;
    selectedSurfacePathId = null;
  }
}

function numberValue(input, fallback = 0) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function terrainFamilyRegistryForDraft() {
  return createTerrainFamilyRegistry(
    draft.terrainFamilies
  );
}

function terrainFamilies() {
  return terrainFamilyRegistryForDraft().list();
}

function familyLabel(familyId) {
  return terrainFamilyRegistryForDraft()
    .get(familyId)?.label ?? familyId;
}

function terrainFamilyUsedInDraft(
  terrainFamilyId
) {
  return draft.areas.some((area) => {
    const surface = area.surface ?? {};

    return (
      surface.baseTerrainFamilyId ===
        terrainFamilyId ||
      [
        ...(surface.zones ?? []),
        ...(surface.routes ?? []),
        ...(surface.rivers ?? [])
      ].some(
        (item) =>
          item.terrainFamilyId ===
          terrainFamilyId
      )
    );
  });
}

function encounterProfile(familyId = selectedEncounterFamilyId) {
  return draft.encounterConfig?.families?.find(
    (profile) => profile.terrainFamilyId === familyId
  ) ?? null;
}

function encounterElementChance(profile, elementId) {
  return profile?.elementChances?.find(
    (entry) => entry.elementId === elementId
  )?.chancePercent ?? 0;
}

function encounterElementTotal(profile) {
  return (profile?.elementChances ?? []).reduce(
    (sum, entry) => sum + Number(entry.chancePercent || 0),
    0
  );
}

function refreshAreaControls() {
  ensureSelections();
  setOptions($('area-select'), draft.areas, selectedAreaId);
  $('area-select').value = selectedAreaId ?? '';

  const area = currentAreaRaw();
  if (!area) return;

  $('area-width').value = area.width;
  $('area-height').value = area.height;

  const families = terrainFamilies();
  const familyRegistry =
    terrainFamilyRegistryForDraft();
  const familyId =
    familyRegistry.get(
      area.surface?.baseTerrainFamilyId
    )
      ? area.surface.baseTerrainFamilyId
      : families[0]?.id ?? '';

  setOptions(
    $('area-family'),
    families,
    familyId,
    { label: (family) => family.label }
  );
  $('area-family').value = familyId;

  setOptions(
    $('area-material'),
    surfaceMaterials,
    area.surface?.baseMaterialId,
    { label: (material) => material.label }
  );
  if (
    surfaceMaterials.some(
      (material) =>
        material.id ===
        area.surface?.baseMaterialId
    )
  ) {
    $('area-material').value =
      area.surface.baseMaterialId;
  } else if (surfaceMaterials[0]) {
    $('area-material').value =
      surfaceMaterials[0].id;
  }

  setOptions(
    $('spawn-select'),
    area.spawns ?? [],
    selectedSpawnId
  );
  if (selectedSpawnId) $('spawn-select').value = selectedSpawnId;

  const spawn = currentSpawnRaw();
  const normalizedArea = currentAreaNormalized();
  const spawnPoint = spawn && normalizedArea
    ? resolveWorldAreaSpawnPoint(normalizedArea, spawn.id)
    : null;
  const anchored = Boolean(spawn?.anchor);

  $('spawn-x').value = spawnPoint?.x ?? '';
  $('spawn-y').value = spawnPoint?.y ?? '';
  $('spawn-x').disabled = !spawn || anchored;
  $('spawn-y').disabled = !spawn || anchored;
  $('spawn-delete').disabled = !spawn;
}
function refreshTerrainControls() {
  const area = currentAreaRaw();
  const selected = currentSurfacePathRaw();
  const families = terrainFamilies();
  const registry =
    terrainFamilyRegistryForDraft();
  const fallbackFamily =
    registry.get(
      area?.surface?.baseTerrainFamilyId
    )
      ? area.surface.baseTerrainFamilyId
      : families[0]?.id ?? '';

  const currentTerrainFamily =
    selected &&
    selectedSurfaceKind === 'terrain'
      ? selected.terrainFamilyId
      : (
          registry.get(
            $('terrain-family').value
          )
            ? $('terrain-family').value
            : fallbackFamily
        );

  setOptions(
    $('terrain-family'),
    families,
    currentTerrainFamily,
    { label: (family) => family.label }
  );
  $('terrain-family').value =
    currentTerrainFamily;

  const requestedTerrainMaterial =
    selected &&
    selectedSurfaceKind === 'terrain'
      ? selected.materialId
      : $('terrain-paint-material').value;

  setOptions(
    $('terrain-paint-material'),
    surfaceMaterials,
    requestedTerrainMaterial,
    { label: (material) => material.label }
  );
  if (
    surfaceMaterials.some(
      (material) =>
        material.id ===
        requestedTerrainMaterial
    )
  ) {
    $('terrain-paint-material').value =
      requestedTerrainMaterial;
  } else if (surfaceMaterials[0]) {
    $('terrain-paint-material').value =
      surfaceMaterials[0].id;
  }

  $('terrain-brush-size-value').value =
    String(
      numberValue(
        $('terrain-brush-size'),
        180
      )
    );
  $('terrain-route-width-value').value =
    String(
      numberValue(
        $('terrain-route-width'),
        82
      )
    );
  $('terrain-river-width-value').value =
    String(
      numberValue(
        $('terrain-river-width'),
        72
      )
    );

  const routeFamily =
    selected &&
    selectedSurfaceKind === 'route'
      ? selected.terrainFamilyId
      : (
          registry.get(
            $('terrain-route-family').value
          )
            ? $('terrain-route-family').value
            : (
                registry.get('road')
                  ? 'road'
                  : fallbackFamily
              )
        );

  setOptions(
    $('terrain-route-family'),
    families,
    routeFamily,
    { label: (family) => family.label }
  );
  $('terrain-route-family').value =
    routeFamily;

  const requestedRouteMaterial =
    selected &&
    selectedSurfaceKind === 'route'
      ? selected.materialId
      : $('terrain-route-material').value;

  setOptions(
    $('terrain-route-material'),
    pathMaterials,
    requestedRouteMaterial,
    { label: (material) => material.label }
  );
  if (
    pathMaterials.some(
      (material) =>
        material.id ===
        requestedRouteMaterial
    )
  ) {
    $('terrain-route-material').value =
      requestedRouteMaterial;
  } else if (pathMaterials[0]) {
    $('terrain-route-material').value =
      pathMaterials[0].id;
  }

  const riverFamily =
    selected &&
    selectedSurfaceKind === 'river'
      ? selected.terrainFamilyId
      : (
          registry.get(
            $('terrain-river-family').value
          )
            ? $('terrain-river-family').value
            : (
                registry.get('sea')
                  ? 'sea'
                  : fallbackFamily
              )
        );

  setOptions(
    $('terrain-river-family'),
    families,
    riverFamily,
    { label: (family) => family.label }
  );
  $('terrain-river-family').value =
    riverFamily;

  const requestedRiverMaterial =
    selected &&
    selectedSurfaceKind === 'river'
      ? selected.materialId
      : $('terrain-river-material').value;

  setOptions(
    $('terrain-river-material'),
    waterMaterials,
    requestedRiverMaterial,
    { label: (material) => material.label }
  );
  if (
    waterMaterials.some(
      (material) =>
        material.id ===
        requestedRiverMaterial
    )
  ) {
    $('terrain-river-material').value =
      requestedRiverMaterial;
  } else if (waterMaterials[0]) {
    $('terrain-river-material').value =
      waterMaterials[0].id;
  }

  const select = $('terrain-path-select');
  const selectedKey =
    selectedSurfaceKind &&
    selectedSurfacePathId
      ? `${selectedSurfaceKind}:${selectedSurfacePathId}`
      : '';

  select.replaceChildren();

  const empty =
    document.createElement('option');
  empty.value = '';
  empty.textContent =
    'Aucun tracé sélectionné';
  select.append(empty);

  for (
    const item of surfacePathItems(area)
  ) {
    const option =
      document.createElement('option');
    option.value = item.key;
    const kindLabel =
      item.kind === 'river'
        ? 'Rivière'
        : item.kind === 'route'
          ? 'Route'
          : 'Terrain';
    option.textContent =
      `${kindLabel} · ${familyLabel(item.terrainFamilyId)} · ${item.id}`;
    select.append(option);
  }

  select.value = selectedKey;
  $('terrain-path-delete').disabled =
    !selected;

  if (
    selected &&
    selectedSurfaceKind === 'terrain'
  ) {
    $('terrain-family').value =
      selected.terrainFamilyId;
    $('terrain-brush-size').value =
      selected.width;
    $('terrain-brush-size-value').value =
      String(selected.width);
  }

  if (
    selected &&
    selectedSurfaceKind === 'route'
  ) {
    $('terrain-route-family').value =
      selected.terrainFamilyId;
    $('terrain-route-width').value =
      selected.width;
    $('terrain-route-width-value').value =
      String(selected.width);
    $('terrain-route-material').value =
      selected.materialId;
  }

  if (
    selected &&
    selectedSurfaceKind === 'river'
  ) {
    $('terrain-river-family').value =
      selected.terrainFamilyId;
    $('terrain-river-width').value =
      selected.width;
    $('terrain-river-width-value').value =
      String(selected.width);
    $('terrain-river-material').value =
      selected.materialId;
  }
}

function refreshTerrainFamilyDefinitionControls() {
  const families = terrainFamilies();

  if (
    !families.some(
      (family) =>
        family.id ===
        selectedTerrainFamilyDefinitionId
    )
  ) {
    selectedTerrainFamilyDefinitionId =
      families[0]?.id ?? null;
  }

  setOptions(
    $('terrain-family-definition-select'),
    families,
    selectedTerrainFamilyDefinitionId,
    { label: (family) => family.label }
  );

  const family =
    families.find(
      (entry) =>
        entry.id ===
        selectedTerrainFamilyDefinitionId
    ) ?? null;

  $('terrain-family-id').value =
    family?.id ?? '';
  $('terrain-family-label').value =
    family?.label ?? '';
  $('terrain-family-label').disabled =
    !family;

  const used =
    family
      ? terrainFamilyUsedInDraft(
          family.id
        )
      : false;

  $('terrain-family-delete').disabled =
    !family ||
    families.length <= 1 ||
    used;

  $('terrain-family-delete-status').textContent =
    !family
      ? 'Aucune famille sélectionnée.'
      : used
        ? 'Famille utilisée dans le monde : suppression protégée.'
        : families.length <= 1
          ? 'Le monde doit conserver au moins une famille.'
          : 'Famille non utilisée : suppression autorisée.';
}

function refreshFamilyEncounterControls() {
  const families = terrainFamilies();
  const registry =
    terrainFamilyRegistryForDraft();

  if (
    !registry.get(
      selectedEncounterFamilyId
    )
  ) {
    selectedEncounterFamilyId =
      registry.get('forest')
        ? 'forest'
        : families[0]?.id ?? null;
  }

  setOptions(
    $('family-encounter-family'),
    families,
    selectedEncounterFamilyId,
    { label: (family) => family.label }
  );

  $('family-encounter-family').value =
    selectedEncounterFamilyId ?? '';

  const profile = encounterProfile();
  if (!profile) return;

  $('family-encounter-chance').value =
    profile.encounterChancePercent;
  $('family-encounter-chance-value').value =
    `${Math.round(profile.encounterChancePercent)} %`;

  $('family-encounter-catalog-summary').textContent =
    `Catalogue Capture · ${captureCreatureCatalog.listCreatures().length} créatures · ${captureCreatureCatalog.listElements().length} éléments · rareté propre conservée`;

  const container = $('family-encounter-elements');
  container.replaceChildren();

  for (const element of captureCreatureCatalog.listElements()) {
    const row = document.createElement('label');
    row.className = 'family-element-row';

    const name = document.createElement('span');
    const candidateCount =
      captureCreatureCatalog.findByElement(element.id).length;
    name.textContent =
      `${element.label} · ${candidateCount} créature(s)`;

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '100';
    input.step = '1';
    input.value = String(
      encounterElementChance(profile, element.id)
    );
    input.dataset.elementId = element.id;
    input.setAttribute(
      'aria-label',
      `Pourcentage ${element.label}`
    );

    input.addEventListener('input', () => {
      draft = updateTerrainFamilyElementChance(
        draft,
        selectedEncounterFamilyId,
        element.id,
        numberValue(input, 0)
      );
      const nextProfile = encounterProfile();
      const total = encounterElementTotal(nextProfile);
      $('family-encounter-total').value =
        `${Math.round(total * 100) / 100} %`;
      $('family-encounter-total').classList.toggle(
        'invalid',
        nextProfile?.encounterChancePercent > 0 &&
          Math.abs(total - 100) > 0.001
      );
      refreshJson();
    });

    row.append(name, input);
    container.append(row);
  }

  const total = encounterElementTotal(profile);
  $('family-encounter-total').value =
    `${Math.round(total * 100) / 100} %`;
  $('family-encounter-total').classList.toggle(
    'invalid',
    profile.encounterChancePercent > 0 &&
      Math.abs(total - 100) > 0.001
  );
}
function objectDefinitionLabel(
  definition
) {
  const kind =
    definition.kind === 'building'
      ? 'Bâtiment'
      : definition.kind === 'bridge'
        ? 'Pont'
        : 'Objet';

  return `${definition.label} · ${kind}`;
}

function objectPlacementLabel(
  placement
) {
  const definition =
    objectDefinitionCatalogV1.get(
      placement.objectDefinitionId
    );

  return definition
    ? `${definition.label} · ${placement.id}`
    : `${placement.objectDefinitionId} · ${placement.id}`;
}

function refreshObjectControls() {
  const area = currentAreaRaw();
  const placements =
    area?.objects ?? [];

  setOptions(
    $('object-definition'),
    objectDefinitions,
    $('object-definition').value ||
      objectDefinitions[0]?.id ||
      '',
    {
      label: objectDefinitionLabel
    }
  );

  setOptions(
    $('object-select'),
    placements,
    selectedObjectId,
    {
      label: objectPlacementLabel
    }
  );

  if (selectedObjectId) {
    $('object-select').value =
      selectedObjectId;
  }

  const placement =
    currentObjectRaw();
  const object =
    currentObjectResolved();
  const disabled =
    !placement || !object;

  for (const id of [
    'object-duplicate',
    'object-delete',
    'object-x',
    'object-y',
    'object-rotation',
    'object-scale-x',
    'object-scale-y'
  ]) {
    $(id).disabled = disabled;
  }

  $('bridge-fields').hidden =
    object?.kind !== 'bridge';

  if (!placement || !object) {
    $('object-x').value = '';
    $('object-y').value = '';
    $('object-rotation').value = '';
    $('object-scale-x').value = '';
    $('object-scale-y').value = '';
    $('bridge-obstacles').value = '';
    $('object-source-status').textContent =
      'Sélectionner une définition puis placer l’objet.';
    return;
  }

  $('object-x').value =
    placement.transform?.x ?? 0;
  $('object-y').value =
    placement.transform?.y ?? 0;
  $('object-rotation').value =
    placement.transform?.rotationDeg ?? 0;
  $('object-scale-x').value =
    placement.transform?.scaleX ?? 1;
  $('object-scale-y').value =
    placement.transform?.scaleY ?? 1;

  if (object.kind === 'bridge') {
    $('bridge-obstacles').value =
      placement.overrides
        ?.traversalSurfaceFeatureIds
        ?.join(', ') ?? '';
  }

  const definition =
    objectDefinitionCatalogV1.get(
      placement.objectDefinitionId
    );

  $('object-source-status').textContent =
    definition
      ? `Définition : ${definition.label} · visuel ${definition.visual?.assetId ?? 'aucun'}`
      : `Définition introuvable : ${placement.objectDefinitionId}`;
}

function currentActorPlacements() {
  return (
    currentAreaRaw()?.actors ??
    []
  );
}

function currentActorPlacement() {
  return (
    currentActorPlacements().find(
      (actor) =>
        actor.id ===
        selectedActorPlacementId
    ) ?? null
  );
}

function currentPlacedMapActors(
  area = currentAreaNormalized()
) {
  if (!area) {
    return [];
  }

  return area.actors
    .map((placement) =>
      createPlacedMapActorView(
        placement,
        captureActorDefinitionProvider
          .resolveDefinition
      )
    )
    .filter(Boolean);
}

function actorDefinitionLabel(
  definition
) {
  const roleLabel =
    definition.role === 'hero'
      ? 'Héros'
      : definition.role === 'npc'
        ? 'PNJ'
        : 'Créature';

  return (
    `${definition.displayName} · ${roleLabel}`
  );
}

function actorPlacementLabel(
  placement
) {
  const definition =
    captureActorDefinitionProvider
      .resolveDefinition(
        placement.actorDefinitionId
      );

  return definition
    ? `${definition.displayName} · ${placement.id}`
    : `${placement.actorDefinitionId} · ${placement.id}`;
}

function refreshActorControls() {
  const placements =
    currentActorPlacements();

  if (
    selectedActorPlacementId &&
    !placements.some(
      (actor) =>
        actor.id ===
        selectedActorPlacementId
    )
  ) {
    selectedActorPlacementId =
      placements[0]?.id ?? null;
  }

  if (
    !selectedActorPlacementId &&
    placements.length > 0
  ) {
    selectedActorPlacementId =
      placements[0].id;
  }

  setOptions(
    $('actor-definition'),
    actorDefinitions,
    $('actor-definition').value ||
      actorDefinitions[0]?.id ||
      '',
    {
      label:
        actorDefinitionLabel
    }
  );

  setOptions(
    $('actor-placement-select'),
    placements,
    selectedActorPlacementId,
    {
      label:
        actorPlacementLabel
    }
  );

  if (selectedActorPlacementId) {
    $('actor-placement-select').value =
      selectedActorPlacementId;
  }

  const placement =
    currentActorPlacement();
  const disabled =
    !placement;

  for (const id of [
    'actor-x',
    'actor-y',
    'actor-facing',
    'actor-delete'
  ]) {
    $(id).disabled = disabled;
  }

  if (!placement) {
    $('actor-x').value = '';
    $('actor-y').value = '';
    $('actor-facing').value = '1';
    $('actor-source-status').textContent =
      actorDefinitions.length > 0
        ? 'Sélectionner une définition puis placer sur la map.'
        : 'Aucune définition acteur disponible.';
    return;
  }

  $('actor-x').value =
    placement.x;
  $('actor-y').value =
    placement.y;
  $('actor-facing').value =
    placement.facingX === -1
      ? '-1'
      : '1';

  const definition =
    captureActorDefinitionProvider
      .resolveDefinition(
        placement.actorDefinitionId
      );

  $('actor-source-status').textContent =
    definition
      ? `Visuel résolu depuis la définition ${definition.displayName} · ${definition.mapVisual.assetId}`
      : `Définition introuvable : ${placement.actorDefinitionId}`;
}

function sourceBuildings(portal) {
  const area = draft.areas.find(
    (item) =>
      item.id === portal?.sourceAreaId
  );

  return resolveWorldObjectPlacements(
    area?.objects ?? []
  ).filter(
    (object) =>
      object.kind === 'building'
  );
}

function refreshPortalControls() {
  const portals = draft.portals ?? [];
  setOptions($('portal-select'), portals, selectedPortalId);
  if (selectedPortalId) $('portal-select').value = selectedPortalId;

  const portal = currentPortalRaw();
  const disabled = !portal;

  for (const id of [
    'portal-delete',
    'portal-source-area',
    'portal-trigger-kind',
    'portal-point-x',
    'portal-point-y',
    'portal-radius',
    'portal-building',
    'portal-anchor',
    'portal-target-area',
    'portal-target-spawn',
    'portal-visible',
    'portal-marker',
    'portal-label'
  ]) {
    $(id).disabled = disabled;
  }

  if (!portal) return;

  setOptions($('portal-source-area'), draft.areas, portal.sourceAreaId);
  $('portal-source-area').value = portal.sourceAreaId;
  $('portal-trigger-kind').value = portal.trigger?.kind ?? 'point';

  const isPoint = portal.trigger?.kind === 'point';
  $('portal-point-fields').hidden = !isPoint;
  $('portal-building-fields').hidden = isPoint;

  $('portal-point-x').value = isPoint ? portal.trigger.x : '';
  $('portal-point-y').value = isPoint ? portal.trigger.y : '';
  $('portal-radius').value = portal.trigger?.radius ?? 28;

  const buildings = sourceBuildings(portal);
  setOptions(
    $('portal-building'),
    buildings,
    portal.trigger?.objectId,
    { label: (building) => building.id }
  );

  const building = buildings.find(
    (item) => item.id === $('portal-building').value
  );
  setOptions(
    $('portal-anchor'),
    building?.doorAnchors ?? [],
    portal.trigger?.anchorId
  );

  setOptions($('portal-target-area'), draft.areas, portal.targetAreaId);
  $('portal-target-area').value = portal.targetAreaId;

  const targetArea = draft.areas.find(
    (area) => area.id === portal.targetAreaId
  );
  setOptions(
    $('portal-target-spawn'),
    targetArea?.spawns ?? [],
    portal.targetSpawnId,
    {
      label: (spawn) =>
        spawn.anchor
          ? `${spawn.id} · lié à la porte`
          : spawn.id
    }
  );
  $('portal-target-spawn').value = portal.targetSpawnId;

  $('portal-visible').checked = portal.visual?.visible === true;
  $('portal-marker').value = portal.visual?.marker ?? 'portal';
  $('portal-label').value = portal.visual?.label ?? '';
}


function eventSourceObjects(event) {
  const area = draft.areas.find(
    (item) =>
      item.id === event?.sourceAreaId
  );

  return resolveWorldObjectPlacements(
    area?.objects ?? []
  ).filter(
    (object) =>
      Array.isArray(object.doorAnchors) &&
      object.doorAnchors.length > 0
  );
}

function eventPortalOptions() {
  return (draft.portals ?? [])
    .map((portal) => {
      const area = draft.areas.find(
        (item) =>
          item.id === portal.sourceAreaId
      );
      const objectId =
        portal.trigger?.kind ===
          'object-anchor'
          ? portal.trigger.objectId
          : null;
      const object =
        objectId
          ? resolveWorldObjectPlacements(
              area?.objects ?? []
            ).find(
              (item) =>
                item.id === objectId
            )
          : null;

      return {
        id: portal.id,
        label:
          object
            ? `${object.id} → ${portal.targetAreaId}`
            : `${portal.id} → ${portal.targetAreaId}`
      };
    });
}

function refreshWorldEventControls() {
  const events = draft.events ?? [];

  setOptions(
    $('event-select'),
    events,
    selectedEventId,
    {
      label: (event) => {
        const label =
          event.activation ===
            'on-portal-enter'
            ? 'Entrée lieu'
            : event.activation ===
                'on-interact'
              ? 'Interaction'
              : 'Zone';

        return `${event.id} · ${label}`;
      }
    }
  );

  if (selectedEventId) {
    $('event-select').value =
      selectedEventId;
  }

  const event =
    currentWorldEventRaw();
  const disabled = !event;

  for (const id of [
    'event-delete',
    'event-enabled',
    'event-source-area',
    'event-activation',
    'event-trigger-kind',
    'event-point-x',
    'event-point-y',
    'event-radius',
    'event-object',
    'event-anchor',
    'event-portal',
    'event-action-kind',
    'event-message',
    'event-repeat-policy'
  ]) {
    $(id).disabled = disabled;
  }

  if (!event) {
    $('event-point-fields').hidden = false;
    $('event-object-fields').hidden = true;
    $('event-portal-fields').hidden = true;
    $('event-trigger-kind-field').hidden = false;
    $('event-position-details').hidden = false;
    $('event-drag-hint').hidden = false;
    $('event-action-kind').value = 'message';
    $('event-message').value = '';
    return;
  }

  setOptions(
    $('event-source-area'),
    draft.areas,
    event.sourceAreaId
  );
  $('event-source-area').value =
    event.sourceAreaId;
  $('event-enabled').checked =
    event.enabled !== false;
  $('event-activation').value =
    event.activation ?? 'on-enter';
  $('event-repeat-policy').value =
    event.repeatPolicy ?? 'once';
  $('event-action-kind').value =
    event.action?.kind ?? 'message';
  $('event-message').value =
    event.action?.text ?? '';

  const isPortalEntry =
    event.activation ===
      'on-portal-enter';

  $('event-portal-fields').hidden =
    !isPortalEntry;
  $('event-trigger-kind-field').hidden =
    isPortalEntry;
  $('event-position-details').hidden =
    isPortalEntry;
  $('event-drag-hint').hidden =
    isPortalEntry;

  const portalOptions =
    eventPortalOptions();

  setOptions(
    $('event-portal'),
    portalOptions,
    event.portalId,
    {
      label: (portal) =>
        portal.label
    }
  );

  if (event.portalId) {
    $('event-portal').value =
      event.portalId;
  }

  if (isPortalEntry) {
    $('event-point-fields').hidden = true;
    $('event-object-fields').hidden = true;
    return;
  }

  const triggerKind =
    event.trigger?.kind === 'object-anchor'
      ? 'object-anchor'
      : 'point';

  $('event-trigger-kind').value =
    triggerKind;

  const isPoint =
    triggerKind === 'point';

  $('event-point-fields').hidden =
    !isPoint;
  $('event-object-fields').hidden =
    isPoint;
  $('event-drag-hint').hidden =
    !isPoint;

  $('event-point-x').value =
    isPoint
      ? event.trigger?.x ?? ''
      : '';
  $('event-point-y').value =
    isPoint
      ? event.trigger?.y ?? ''
      : '';
  $('event-radius').value =
    event.trigger?.radius ?? 28;

  const objects =
    eventSourceObjects(event);

  setOptions(
    $('event-object'),
    objects,
    event.trigger?.objectId,
    {
      label: (object) => object.id
    }
  );

  const object = objects.find(
    (item) =>
      item.id ===
      $('event-object').value
  );

  setOptions(
    $('event-anchor'),
    object?.doorAnchors ?? [],
    event.trigger?.anchorId
  );
}

function switchWorldEventActivation(
  activation
) {
  const event =
    currentWorldEventRaw();

  if (!event) return;

  draft = updateWorldEvent(
    draft,
    event.id,
    (nextEvent) => {
      nextEvent.activation =
        activation;

      if (
        activation ===
          'on-portal-enter'
      ) {
        const portal =
          draft.portals?.find(
            (item) =>
              item.id ===
                nextEvent.portalId
          ) ??
          draft.portals?.[0];

        delete nextEvent.trigger;

        if (portal) {
          nextEvent.portalId =
            portal.id;
          nextEvent.sourceAreaId =
            portal.targetAreaId;
        }
        return;
      }

      delete nextEvent.portalId;

      const area =
        draft.areas.find(
          (item) =>
            item.id ===
              nextEvent.sourceAreaId
        ) ??
        currentAreaRaw();

      if (!nextEvent.trigger) {
        nextEvent.sourceAreaId =
          area?.id ??
          nextEvent.sourceAreaId;
        nextEvent.trigger = {
          kind: 'point',
          x: area?.width / 2 ?? 0,
          y: area?.height / 2 ?? 0,
          radius: 48
        };
      }
    }
  );

  refreshWorldEventControls();
  refreshJson();
  renderPreview();
}

function switchWorldEventTrigger(kind) {
  const event =
    currentWorldEventRaw();

  if (
    !event ||
    event.activation ===
      'on-portal-enter'
  ) {
    return;
  }

  draft = updateWorldEvent(
    draft,
    event.id,
    (nextEvent) => {
      const area = draft.areas.find(
        (item) =>
          item.id === nextEvent.sourceAreaId
      );

      if (kind === 'object-anchor') {
        const object =
          eventSourceObjects(
            nextEvent
          )[0];
        const anchor =
          object?.doorAnchors?.[0];

        if (!object || !anchor) {
          return;
        }

        nextEvent.trigger = {
          kind: 'object-anchor',
          objectId: object.id,
          anchorId: anchor.id,
          radius:
            nextEvent.trigger?.radius ??
            32
        };
        return;
      }

      nextEvent.trigger = {
        kind: 'point',
        x: area?.width / 2 ?? 0,
        y: area?.height / 2 ?? 0,
        radius:
          nextEvent.trigger?.radius ??
          48
      };
    }
  );

  refreshWorldEventControls();
  refreshJson();
  renderPreview();
}

function applyWorldEventInputs() {
  const event =
    currentWorldEventRaw();

  if (!event) return;

  draft = updateWorldEvent(
    draft,
    event.id,
    (nextEvent) => {
      nextEvent.enabled =
        $('event-enabled').checked;
      nextEvent.activation =
        $('event-activation').value;
      nextEvent.repeatPolicy =
        $('event-repeat-policy').value;
      nextEvent.action = {
        kind:
          $('event-action-kind').value,
        text:
          $('event-message')
            .value
            .trim()
      };

      if (
        nextEvent.activation ===
          'on-portal-enter'
      ) {
        const portal =
          draft.portals?.find(
            (item) =>
              item.id ===
                $('event-portal').value
          );

        delete nextEvent.trigger;

        if (portal) {
          nextEvent.portalId =
            portal.id;
          nextEvent.sourceAreaId =
            portal.targetAreaId;
        }

        return;
      }

      delete nextEvent.portalId;
      nextEvent.sourceAreaId =
        $('event-source-area').value;

      const radius =
        numberValue(
          $('event-radius'),
          48
        );

      if (
        $('event-trigger-kind').value ===
        'object-anchor'
      ) {
        nextEvent.trigger = {
          kind: 'object-anchor',
          objectId:
            $('event-object').value,
          anchorId:
            $('event-anchor').value,
          radius
        };
      } else {
        nextEvent.trigger = {
          kind: 'point',
          x: numberValue(
            $('event-point-x'),
            0
          ),
          y: numberValue(
            $('event-point-y'),
            0
          ),
          radius
        };
      }
    }
  );

  refreshWorldEventControls();
  refreshJson();
  renderPreview();
}

function refreshJson() {
  const result = currentValidation();

  if (result.valid) {
    const json = serializeWorldBuilderDraft(draft);
    jsonPreview.value = json;
    setStatus('WorldDocument valide');
  } else {
    jsonPreview.value = JSON.stringify(draft, null, 2);
    setStatus(
      `Document invalide : ${result.errors.join(' · ')}`,
      true
    );
  }
}

function refreshControls() {
  ensureSelections();
  refreshAreaControls();
  refreshTerrainFamilyDefinitionControls();
  refreshTerrainControls();
  refreshFamilyEncounterControls();
  refreshObjectControls();
  refreshActorControls();
  refreshPortalControls();
  refreshWorldEventControls();
  refreshJson();
  renderPreview();
}

function selectedWorldPoint(document, area) {
  if (mapTool === 'actor-placement') {
    const actor = area?.actors?.find(
      (item) =>
        item.id ===
        selectedActorPlacementId
    );

    if (actor) {
      return {
        x: actor.x,
        y: actor.y
      };
    }
  }

  const object = area?.objects?.find(
    (item) => item.id === selectedObjectId
  );
  if (object?.transform) {
    return {
      x: object.transform.x,
      y: object.transform.y
    };
  }

  const spawn = area?.spawns?.find(
    (item) => item.id === selectedSpawnId
  );
  if (spawn) {
    const point = resolveWorldAreaSpawnPoint(area, spawn.id);
    if (point) return { x: point.x, y: point.y };
  }

  const portal = document?.portals?.find(
    (item) =>
      item.id === selectedPortalId &&
      item.sourceAreaId === area?.id
  );
  if (portal) {
    const point = resolvePortalTriggerPoint(document.areas, portal);
    if (point) return point;
  }

  return {
    x: area?.width / 2 || 0,
    y: area?.height / 2 || 0
  };
}

function fitArea() {
  const area = currentAreaNormalized();
  if (!area) return;

  const width = Math.max(canvas.clientWidth, 1);
  const height = Math.max(canvas.clientHeight, 1);
  zoom = clampBuilderZoom(Math.min(
    (width - 24) / area.width,
    (height - 24) / area.height
  ));
  center = {
    x: area.width / 2,
    y: area.height / 2
  };
  fitRequested = false;
}

function focusSelection() {
  const document = normalizedDocument();
  const area = currentAreaNormalized();
  if (!document || !area) return;

  center = selectedWorldPoint(document, area);
  zoom = clampBuilderZoom(Math.max(0.35, Math.min(1.4, zoom)));
  fitRequested = false;
  renderPreview();
}

function drawObstacle(obstacle, camera) {
  if (obstacle.kind === 'river') return;

  if (obstacle.kind === 'rock') {
    ctx.fillStyle = '#666b62';
  } else if (obstacle.kind === 'furniture') {
    ctx.fillStyle = '#6f4d32';
  } else {
    ctx.fillStyle = '#244d2a';
  }

  ctx.fillRect(
    obstacle.x - camera.x,
    obstacle.y - camera.y,
    obstacle.w,
    obstacle.h
  );
}

function drawBuilderOverlays(area, document, camera) {
  ctx.save();

  ctx.strokeStyle =
    mapTool === 'area-size'
      ? 'rgba(133,225,255,0.98)'
      : 'rgba(160,205,175,0.58)';
  ctx.lineWidth = (mapTool === 'area-size' ? 4 : 2) / zoom;
  ctx.setLineDash(mapTool === 'area-size' ? [] : [8 / zoom, 6 / zoom]);
  ctx.strokeRect(
    -camera.x,
    -camera.y,
    area.width,
    area.height
  );
  ctx.setLineDash([]);

  const handleSize = (mapTool === 'area-size' ? 28 : 18) / zoom;
  ctx.fillStyle =
    mapTool === 'area-size'
      ? 'rgba(133,225,255,0.98)'
      : 'rgba(133,225,255,0.7)';
  ctx.fillRect(
    area.width - camera.x - handleSize / 2,
    area.height - camera.y - handleSize / 2,
    handleSize,
    handleSize
  );

  const selectedPath = currentSurfacePathRaw();
  if (selectedPath?.points?.length >= 2) {
    ctx.beginPath();
    selectedPath.points.forEach((point, index) => {
      const x = point.x - camera.x;
      const y = point.y - camera.y;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = 'rgba(255,236,130,0.98)';
    ctx.lineWidth = 4 / zoom;
    ctx.setLineDash([10 / zoom, 6 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  for (const spawn of area.spawns) {
    const point = resolveWorldAreaSpawnPoint(area, spawn.id);
    if (!point) continue;

    const selected = spawn.id === selectedSpawnId;

    ctx.beginPath();
    ctx.arc(
      point.x - camera.x,
      point.y - camera.y,
      selected ? 11 : 7,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = selected
      ? 'rgba(255,245,180,0.95)'
      : 'rgba(190,230,255,0.8)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(20,30,24,0.9)';
    ctx.stroke();
  }

  const object =
    resolveWorldObjectPlacements(
      area.objects ?? []
    ).find(
      (item) =>
        item.id === selectedObjectId
    );

  if (object) {
    const rect =
      object.kind === 'bridge'
        ? bridgeVisualRect(object)
        : buildingVisualRect(object);

    if (rect) {
      const width =
        object.kind === 'bridge' ? rect.length : rect.width;
      const height =
        object.kind === 'bridge' ? rect.width : rect.height;
      const handleSize = 18 / zoom;
      const handleHalf = handleSize / 2;
      const rotateOffset = 42 / zoom;
      const rotateRadius = 10 / zoom;

      ctx.save();
      ctx.translate(rect.x - camera.x, rect.y - camera.y);
      ctx.rotate(rect.rotation);

      ctx.strokeStyle = 'rgba(255,236,130,0.98)';
      ctx.lineWidth = 3 / zoom;
      ctx.setLineDash([10 / zoom, 6 / zoom]);
      ctx.strokeRect(
        -width / 2,
        -height / 2,
        width,
        height
      );
      ctx.setLineDash([]);

      ctx.fillStyle = 'rgba(255,236,130,0.98)';
      for (const [x, y] of [
        [-width / 2, -height / 2],
        [width / 2, -height / 2],
        [width / 2, height / 2],
        [-width / 2, height / 2]
      ]) {
        ctx.fillRect(
          x - handleHalf,
          y - handleHalf,
          handleSize,
          handleSize
        );
      }

      ctx.beginPath();
      ctx.moveTo(0, -height / 2);
      ctx.lineTo(0, -height / 2 - rotateOffset);
      ctx.strokeStyle = 'rgba(255,189,98,0.98)';
      ctx.lineWidth = 3 / zoom;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(
        0,
        -height / 2 - rotateOffset,
        rotateRadius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle = 'rgba(255,189,98,0.98)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(58,38,18,0.95)';
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      ctx.restore();
    }
  }

  if (
    (
      mapTool === 'terrain' ||
      mapTool === 'route' ||
      mapTool === 'river'
    ) &&
    hoverWorldPoint
  ) {
    const brushSize =
      mapTool === 'river'
        ? numberValue($('terrain-river-width'), 72)
        : mapTool === 'route'
          ? numberValue($('terrain-route-width'), 82)
          : numberValue($('terrain-brush-size'), 180);

    ctx.beginPath();
    ctx.arc(
      hoverWorldPoint.x - camera.x,
      hoverWorldPoint.y - camera.y,
      brushSize / 2,
      0,
      Math.PI * 2
    );
    ctx.fillStyle = 'rgba(133,225,255,0.12)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(133,225,255,0.96)';
    ctx.lineWidth = 3 / zoom;
    ctx.setLineDash([8 / zoom, 6 / zoom]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  const portal = document.portals.find(
    (item) =>
      item.id === selectedPortalId &&
      item.sourceAreaId === area.id
  );
  if (portal) {
    const point = resolvePortalTriggerPoint(document.areas, portal);
    if (point) {
      ctx.beginPath();
      ctx.arc(
        point.x - camera.x,
        point.y - camera.y,
        point.radius + 5,
        0,
        Math.PI * 2
      );
      ctx.lineWidth = 3 / zoom;
      ctx.strokeStyle = 'rgba(255,146,232,0.95)';
      ctx.stroke();
    }
  }

  const worldEvent =
    document.events?.find(
      (item) =>
        item.id === selectedEventId &&
        item.sourceAreaId === area.id
    );

  if (worldEvent) {
    const point =
      resolveWorldTriggerPoint(
        area,
        worldEvent.trigger
      );

    if (point) {
      ctx.beginPath();
      ctx.arc(
        point.x - camera.x,
        point.y - camera.y,
        point.radius,
        0,
        Math.PI * 2
      );
      ctx.fillStyle =
        'rgba(255,214,105,0.10)';
      ctx.fill();
      ctx.lineWidth = 3 / zoom;
      ctx.strokeStyle =
        'rgba(255,214,105,0.98)';
      ctx.setLineDash([
        8 / zoom,
        6 / zoom
      ]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  ctx.restore();
}

function renderPreview(timeSeconds = performance.now() / 1000) {
  const result = currentValidation();
  if (!result.document) return;

  const document = result.document;
  const area = document.areas.find(
    (item) => item.id === selectedAreaId
  );
  if (!area) return;

  const cssWidth = Math.max(canvas.clientWidth, 1);
  const cssHeight = Math.max(canvas.clientHeight, 1);
  const dpr = Math.min(devicePixelRatio || 1, 2);

  if (
    canvas.width !== Math.floor(cssWidth * dpr) ||
    canvas.height !== Math.floor(cssHeight * dpr)
  ) {
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
  }

  if (fitRequested) fitArea();

  lastView = computeBuilderView({
    area,
    center,
    zoom,
    canvasWidth: cssWidth,
    canvasHeight: cssHeight
  });
  zoom = lastView.zoom;
  center = { ...lastView.center };
  const viewport = lastView.viewport;
  const camera = lastView.camera;

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.setTransform(dpr * zoom, 0, 0, dpr * zoom, 0, 0);

  try {
    surfaceRenderer.draw(ctx, {
      camera,
      viewport,
      surface: area.surface
    });

    area.obstacles.forEach((obstacle) =>
      drawObstacle(obstacle, camera)
    );

    objectRenderer.draw(ctx, {
      camera,
      viewport,
      objects: area.objects
    });

    portalRenderer.draw(ctx, {
      camera,
      worldDocument: document,
      currentAreaId: area.id
    });

    if (mapActorRenderer) {
      mapActorRenderer.draw(ctx, {
        camera,
        actors:
          currentPlacedMapActors(area),
        timeSeconds
      });
    }

    drawBuilderOverlays(area, document, camera);
  } catch (error) {
    setStatus(
      `Preview impossible : ${error.message}`,
      true
    );
  }

  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function applyTransformInputs() {
  if (!selectedObjectId) return;

  draft = updateWorldObjectTransform(
    draft,
    selectedAreaId,
    selectedObjectId,
    {
      x: numberValue($('object-x')),
      y: numberValue($('object-y')),
      rotationDeg: numberValue($('object-rotation')),
      scaleX: numberValue($('object-scale-x'), 1),
      scaleY: numberValue($('object-scale-y'), 1)
    }
  );
  refreshJson();
  renderPreview();
}

function applyBridgeInputs() {
  const object =
    currentObjectResolved();

  if (
    !object ||
    object.kind !== 'bridge'
  ) {
    return;
  }

  draft =
    updateWorldObjectOverrides(
      draft,
      selectedAreaId,
      selectedObjectId,
      {
        traversalSurfaceFeatureIds:
          $('bridge-obstacles')
            .value
            .split(',')
            .map(
              (value) =>
                value.trim()
            )
            .filter(Boolean)
      }
    );

  refreshJson();
  renderPreview();
}

function switchPortalTrigger(kind) {
  const portal = currentPortalRaw();
  if (!portal) return;

  draft = updatePortal(
    draft,
    portal.id,
    (nextPortal) => {
      if (kind === 'object-anchor') {
        const area = draft.areas.find(
          (item) => item.id === nextPortal.sourceAreaId
        );
        const building =
          resolveWorldObjectPlacements(
            area?.objects ?? []
          ).find(
            (object) =>
              object.kind === 'building'
          );
        const anchor =
          building?.doorAnchors?.[0];

        if (building && anchor) {
          nextPortal.trigger = {
            kind: 'object-anchor',
            objectId: building.id,
            anchorId: anchor.id,
            radius: nextPortal.trigger?.radius ?? 32
          };
        }
      } else {
        const area = draft.areas.find(
          (item) => item.id === nextPortal.sourceAreaId
        );
        nextPortal.trigger = {
          kind: 'point',
          x: area?.width / 2 ?? 0,
          y: area?.height / 2 ?? 0,
          radius: nextPortal.trigger?.radius ?? 28
        };
      }
    }
  );

  refreshPortalControls();
  refreshJson();
  renderPreview();
}

function applyPortalInputs() {
  const portal = currentPortalRaw();
  if (!portal) return;

  draft = updatePortal(
    draft,
    portal.id,
    (nextPortal) => {
      nextPortal.sourceAreaId = $('portal-source-area').value;
      nextPortal.targetAreaId = $('portal-target-area').value;
      nextPortal.targetSpawnId = $('portal-target-spawn').value;

      const kind = $('portal-trigger-kind').value;
      const radius = numberValue($('portal-radius'), 28);

      if (kind === 'point') {
        nextPortal.trigger = {
          kind: 'point',
          x: numberValue($('portal-point-x'), 0),
          y: numberValue($('portal-point-y'), 0),
          radius
        };
      } else {
        nextPortal.trigger = {
          kind: 'object-anchor',
          objectId: $('portal-building').value,
          anchorId: $('portal-anchor').value,
          radius
        };
      }

      nextPortal.visual ??= {};
      nextPortal.visual.visible = $('portal-visible').checked;
      nextPortal.visual.marker = $('portal-marker').value;
      nextPortal.visual.label =
        $('portal-label').value.trim() || null;
    }
  );

  refreshJson();
  renderPreview();
}


function activateTab(tabName) {
  for (const other of document.querySelectorAll('[data-tab]')) {
    other.classList.toggle(
      'active',
      other.dataset.tab === tabName
    );
  }

  for (const panel of document.querySelectorAll('[data-panel]')) {
    panel.classList.toggle(
      'active',
      panel.dataset.panel === tabName
    );
  }
}

function setMapTool(tool) {
  mapTool = [
    'select',
    'actor-placement',
    'area-size',
    'terrain',
    'route',
    'river'
  ].includes(tool)
    ? tool
    : 'select';
  canvas.dataset.tool = mapTool;

  for (const button of document.querySelectorAll('[data-map-tool]')) {
    button.classList.toggle(
      'active',
      button.dataset.mapTool === mapTool
    );
  }

  if (
    mapTool === 'terrain' ||
    mapTool === 'route' ||
    mapTool === 'river'
  ) {
    activateTab('terrain');
  } else if (mapTool === 'actor-placement') {
    activateTab('actors');
  } else if (mapTool === 'area-size') {
    activateTab('area');
    fitRequested = true;
  }

  renderPreview();
}

function canvasCoordinates(event) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function viewForInput() {
  const area = currentAreaNormalized();
  if (!area) return null;

  return computeBuilderView({
    area,
    center,
    zoom,
    canvasWidth: Math.max(canvas.clientWidth, 1),
    canvasHeight: Math.max(canvas.clientHeight, 1)
  });
}

function eventWorldPoint(event) {
  const view = viewForInput();
  if (!view) return null;
  const point = canvasCoordinates(event);

  return canvasPointToWorld({
    canvasX: point.x,
    canvasY: point.y,
    camera: view.camera,
    zoom: view.zoom
  });
}

function worldObjectRectForHit(object) {
  const rect =
    object.kind === 'bridge'
      ? bridgeVisualRect(object)
      : object.kind === 'building'
        ? buildingVisualRect(object)
        : null;

  if (!rect) return null;

  return {
    x: rect.x,
    y: rect.y,
    rotation: rect.rotation,
    width: object.kind === 'bridge' ? rect.length : rect.width,
    height: object.kind === 'bridge' ? rect.width : rect.height
  };
}

function pointToObjectLocal(point, rect) {
  const dx = point.x - rect.x;
  const dy = point.y - rect.y;
  const cos = Math.cos(-rect.rotation);
  const sin = Math.sin(-rect.rotation);

  return {
    x: dx * cos - dy * sin,
    y: dx * sin + dy * cos
  };
}

function hitSelectedObjectGizmo(area, point) {
  const object =
    resolveWorldObjectPlacements(
      area?.objects ?? []
    ).find(
      (item) =>
        item.id === selectedObjectId
    );
  if (!object) return null;

  const rect = worldObjectRectForHit(object);
  if (!rect) return null;

  const local = pointToObjectLocal(point, rect);
  const hitRadius = 26 / Math.max(zoom, 0.05);
  const halfWidth = rect.width / 2;
  const halfHeight = rect.height / 2;
  const rotateOffset = 42 / Math.max(zoom, 0.05);

  const rotationHandle = {
    x: 0,
    y: -halfHeight - rotateOffset
  };

  if (
    Math.hypot(
      local.x - rotationHandle.x,
      local.y - rotationHandle.y
    ) <= hitRadius
  ) {
    return {
      kind: 'rotate',
      object,
      rect
    };
  }

  const corners = [
    { x: -halfWidth, y: -halfHeight },
    { x: halfWidth, y: -halfHeight },
    { x: halfWidth, y: halfHeight },
    { x: -halfWidth, y: halfHeight }
  ];

  if (
    corners.some(
      (corner) =>
        Math.hypot(
          local.x - corner.x,
          local.y - corner.y
        ) <= hitRadius
    )
  ) {
    return {
      kind: 'scale',
      object,
      rect
    };
  }

  return null;
}

function hitAreaResizeHandle(area, point) {
  if (!area || !point) return false;

  const hitRadius = 30 / Math.max(zoom, 0.05);
  return (
    Math.hypot(
      point.x - area.width,
      point.y - area.height
    ) <= hitRadius
  );
}

function objectBaseDimensions(object) {
  if (object?.kind === 'bridge') {
    return {
      width: object.baseSize?.length ?? 160,
      height: object.baseSize?.width ?? 80
    };
  }

  if (object?.kind === 'building') {
    return {
      width: object.baseSize?.width ?? 260,
      height: object.baseSize?.height ?? 260
    };
  }

  return null;
}

function hitWorldObject(area, point) {
  const objects = [
    ...resolveWorldObjectPlacements(
      area?.objects ?? []
    )
  ].reverse();

  return objects.find((object) => {
    const rect = worldObjectRectForHit(object);
    return rect && pointInRotatedRect(point, rect);
  }) ?? null;
}

function hitSpawn(area, point) {
  const radius = 18 / Math.max(zoom, 0.05);
  const radiusSq = radius * radius;

  for (const spawn of area?.spawns ?? []) {
    const resolved = resolveWorldAreaSpawnPoint(area, spawn.id);
    if (!resolved) continue;

    const dx = point.x - resolved.x;
    const dy = point.y - resolved.y;

    if (dx * dx + dy * dy <= radiusSq) {
      return Object.freeze({
        ...spawn,
        x: resolved.x,
        y: resolved.y
      });
    }
  }

  return null;
}

function applyZoomAtCanvasPoint(nextZoom, canvasPoint) {
  const area = currentAreaNormalized();
  if (!area) return;

  const view = zoomBuilderAtCanvasPoint({
    area,
    center,
    oldZoom: zoom,
    newZoom: nextZoom,
    canvasWidth: Math.max(canvas.clientWidth, 1),
    canvasHeight: Math.max(canvas.clientHeight, 1),
    canvasX: canvasPoint.x,
    canvasY: canvasPoint.y
  });

  zoom = view.zoom;
  center = { ...view.center };
  fitRequested = false;
  renderPreview();
}

function beginSurfacePath(kind, point) {
  const area = currentAreaRaw();
  if (!area) return null;

  const before = surfacePathItems(area)
    .filter((item) => item.kind === kind)
    .map((item) => item.id);

  const width =
    kind === 'river'
      ? numberValue($('terrain-river-width'), 72)
      : kind === 'terrain'
        ? numberValue($('terrain-brush-size'), 180)
        : numberValue($('terrain-route-width'), 82);
  const materialId =
    kind === 'river'
      ? $('terrain-river-material').value
      : kind === 'terrain'
        ? $('terrain-paint-material').value
        : $('terrain-route-material').value;
  const terrainFamilyId =
    kind === 'river'
      ? $('terrain-river-family').value
      : kind === 'route'
        ? $('terrain-route-family').value
        : $('terrain-family').value;

  draft = addSurfacePath(
    draft,
    selectedAreaId,
    kind,
    {
      width,
      terrainFamilyId,
      materialId,
      points: [point, point]
    }
  );

  const created = surfacePathItems(currentAreaRaw())
    .find((item) => item.kind === kind && !before.includes(item.id));

  if (!created) return null;

  selectedSurfaceKind = kind;
  selectedSurfacePathId = created.id;
  return created.id;
}

function appendDrawPoint(kind, pathId, point, force = false) {
  const path = surfacePathItems(currentAreaRaw())
    .find((item) => item.kind === kind && item.id === pathId);
  const last = path?.points?.at(-1);
  if (!last) return;

  const distance = Math.hypot(point.x - last.x, point.y - last.y);
  const threshold = Math.max(5, 14 / Math.max(zoom, 0.05));

  if (!force && distance < threshold) return;

  draft = appendSurfacePathPoint(
    draft,
    selectedAreaId,
    kind,
    pathId,
    point
  );
}

function beginPinch() {
  if (activePointers.size !== 2) return;

  const points = [...activePointers.values()];
  const mid = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
  const distance = Math.hypot(
    points[1].x - points[0].x,
    points[1].y - points[0].y
  );
  const view = viewForInput();
  if (!view || distance <= 0) return;

  pinchState = {
    startDistance: distance,
    startZoom: zoom,
    worldMid: canvasPointToWorld({
      canvasX: mid.x,
      canvasY: mid.y,
      camera: view.camera,
      zoom: view.zoom
    })
  };

  pointerSession = null;
}

function updatePinch() {
  if (!pinchState || activePointers.size !== 2) return;

  const area = currentAreaNormalized();
  if (!area) return;

  const points = [...activePointers.values()];
  const mid = {
    x: (points[0].x + points[1].x) / 2,
    y: (points[0].y + points[1].y) / 2
  };
  const distance = Math.hypot(
    points[1].x - points[0].x,
    points[1].y - points[0].y
  );

  const nextZoom = clampBuilderZoom(
    pinchState.startZoom *
    (distance / Math.max(1, pinchState.startDistance))
  );
  const viewportWidth = Math.max(canvas.clientWidth, 1) / nextZoom;
  const viewportHeight = Math.max(canvas.clientHeight, 1) / nextZoom;

  const desiredCenter = {
    x:
      pinchState.worldMid.x -
      mid.x / nextZoom +
      viewportWidth / 2,
    y:
      pinchState.worldMid.y -
      mid.y / nextZoom +
      viewportHeight / 2
  };

  const view = computeBuilderView({
    area,
    center: desiredCenter,
    zoom: nextZoom,
    canvasWidth: Math.max(canvas.clientWidth, 1),
    canvasHeight: Math.max(canvas.clientHeight, 1)
  });

  zoom = view.zoom;
  center = { ...view.center };
  fitRequested = false;
  renderPreview();
}

function finishPointerEditing() {
  canvas.dataset.dragging = 'false';
  refreshAreaControls();
  refreshTerrainControls();
  refreshObjectControls();
  refreshJson();
  renderPreview();
}

for (const button of document.querySelectorAll('[data-tab]')) {
  button.addEventListener('click', () => {
    activateTab(button.dataset.tab);
  });
}

$('area-select').addEventListener('change', () => {
  selectedAreaId = $('area-select').value;
  selectedSpawnId = null;
  selectedObjectId = null;
  selectedSurfaceKind = null;
  selectedSurfacePathId = null;
  fitRequested = true;
  setMapTool('select');
  refreshControls();
});

for (const id of ['area-width', 'area-height']) {
  $(id).addEventListener('change', () => {
    draft = updateAreaProperties(
      draft,
      selectedAreaId,
      {
        width: numberValue($('area-width')),
        height: numberValue($('area-height'))
      }
    );
    fitRequested = true;
    refreshControls();
  });
}

$('area-family').addEventListener('change', () => {
  draft = updateAreaProperties(
    draft,
    selectedAreaId,
    {
      baseTerrainFamilyId:
        $('area-family').value
    }
  );
  refreshControls();
});

$('area-material').addEventListener('change', () => {
  draft = updateAreaProperties(
    draft,
    selectedAreaId,
    {
      baseMaterialId: $('area-material').value
    }
  );
  refreshJson();
  renderPreview();
});


$('terrain-family').addEventListener('change', () => {
  if (
    selectedSurfaceKind === 'terrain' &&
    selectedSurfacePathId
  ) {
    draft = updateSurfacePath(
      draft,
      selectedAreaId,
      'terrain',
      selectedSurfacePathId,
      {
        terrainFamilyId:
          $('terrain-family').value
      }
    );
    refreshJson();
    renderPreview();
  }
});

$('terrain-family-definition-select').addEventListener(
  'change',
  () => {
    selectedTerrainFamilyDefinitionId =
      $('terrain-family-definition-select').value;
    refreshTerrainFamilyDefinitionControls();
  }
);

$('terrain-family-add').addEventListener(
  'click',
  () => {
    const before = new Set(
      terrainFamilies().map(
        (family) => family.id
      )
    );

    draft = addTerrainFamilyDefinition(
      draft
    );

    const created =
      terrainFamilies().find(
        (family) =>
          !before.has(family.id)
      );

    selectedTerrainFamilyDefinitionId =
      created?.id ??
      selectedTerrainFamilyDefinitionId;
    selectedEncounterFamilyId =
      created?.id ??
      selectedEncounterFamilyId;

    refreshControls();
  }
);

$('terrain-family-label').addEventListener(
  'change',
  () => {
    if (
      !selectedTerrainFamilyDefinitionId
    ) {
      return;
    }

    draft = updateTerrainFamilyDefinition(
      draft,
      selectedTerrainFamilyDefinitionId,
      {
        label:
          $('terrain-family-label').value
      }
    );

    refreshControls();
  }
);

$('terrain-family-delete').addEventListener(
  'click',
  () => {
    if (
      !selectedTerrainFamilyDefinitionId
    ) {
      return;
    }

    const before =
      terrainFamilies().length;
    draft =
      deleteTerrainFamilyDefinition(
        draft,
        selectedTerrainFamilyDefinitionId
      );

    if (
      terrainFamilies().length === before
    ) {
      setStatus(
        'Famille protégée : encore utilisée dans le monde',
        true
      );
      refreshTerrainFamilyDefinitionControls();
      return;
    }

    selectedTerrainFamilyDefinitionId =
      terrainFamilies()[0]?.id ?? null;
    refreshControls();
  }
);

for (const [kind, selectId] of [
  ['route', 'terrain-route-family'],
  ['river', 'terrain-river-family']
]) {
  $(selectId).addEventListener(
    'change',
    () => {
      if (
        selectedSurfaceKind !== kind ||
        !selectedSurfacePathId
      ) {
        return;
      }

      draft = updateSurfacePath(
        draft,
        selectedAreaId,
        kind,
        selectedSurfacePathId,
        {
          terrainFamilyId:
            $(selectId).value
        }
      );
      refreshJson();
      renderPreview();
    }
  );
}

$('family-encounter-family').addEventListener(
  'change',
  () => {
    selectedEncounterFamilyId =
      $('family-encounter-family').value;
    refreshFamilyEncounterControls();
  }
);

$('family-encounter-chance').addEventListener(
  'input',
  () => {
    draft = updateTerrainFamilyEncounterProfile(
      draft,
      selectedEncounterFamilyId,
      {
        encounterChancePercent: numberValue(
          $('family-encounter-chance'),
          0
        )
      }
    );

    $('family-encounter-chance-value').value =
      `${Math.round(
        numberValue($('family-encounter-chance'), 0)
      )} %`;

    const profile = encounterProfile();
    const total = encounterElementTotal(profile);
    $('family-encounter-total').classList.toggle(
      'invalid',
      profile?.encounterChancePercent > 0 &&
        Math.abs(total - 100) > 0.001
    );
    refreshJson();
  }
);

$('terrain-path-select').addEventListener('change', () => {
  const value = $('terrain-path-select').value;

  if (!value) {
    selectedSurfaceKind = null;
    selectedSurfacePathId = null;
  } else {
    const separator = value.indexOf(':');
    selectedSurfaceKind = value.slice(0, separator);
    selectedSurfacePathId = value.slice(separator + 1);
  }

  refreshTerrainControls();
  renderPreview();
});

$('terrain-path-delete').addEventListener('click', () => {
  if (!selectedSurfaceKind || !selectedSurfacePathId) return;

  draft = deleteSurfacePath(
    draft,
    selectedAreaId,
    selectedSurfaceKind,
    selectedSurfacePathId
  );

  selectedSurfaceKind = null;
  selectedSurfacePathId = null;
  refreshControls();
});

for (const [kind, widthId, valueId, materialId, fallbackWidth] of [
  ['terrain', 'terrain-brush-size', 'terrain-brush-size-value', 'terrain-paint-material', 180],
  ['route', 'terrain-route-width', 'terrain-route-width-value', 'terrain-route-material', 82],
  ['river', 'terrain-river-width', 'terrain-river-width-value', 'terrain-river-material', 72]
]) {
  $(widthId).addEventListener('input', () => {
    const width = numberValue($(widthId), fallbackWidth);
    $(valueId).value = String(width);

    if (
      selectedSurfaceKind === kind &&
      selectedSurfacePathId
    ) {
      draft = updateSurfacePath(
        draft,
        selectedAreaId,
        kind,
        selectedSurfacePathId,
        { width }
      );
      refreshJson();
    }

    if (mapTool === kind || selectedSurfaceKind === kind) {
      renderPreview();
    }
  });

  $(materialId).addEventListener('change', () => {
    if (
      selectedSurfaceKind !== kind ||
      !selectedSurfacePathId
    ) {
      return;
    }

    draft = updateSurfacePath(
      draft,
      selectedAreaId,
      kind,
      selectedSurfacePathId,
      { materialId: $(materialId).value }
    );
    refreshJson();
    renderPreview();
  });
}

$('spawn-select').addEventListener('change', () => {
  selectedSpawnId = $('spawn-select').value;
  refreshAreaControls();
  renderPreview();
});

for (const id of ['spawn-x', 'spawn-y']) {
  $(id).addEventListener('change', () => {
    if (!selectedSpawnId) return;
    draft = updateSpawn(
      draft,
      selectedAreaId,
      selectedSpawnId,
      {
        x: numberValue($('spawn-x')),
        y: numberValue($('spawn-y'))
      }
    );
    refreshJson();
    renderPreview();
  });
}

$('spawn-add').addEventListener('click', () => {
  const before = currentAreaRaw()?.spawns?.map((spawn) => spawn.id) ?? [];
  draft = addSpawn(draft, selectedAreaId);
  const area = currentAreaRaw();
  selectedSpawnId = area?.spawns?.find(
    (spawn) => !before.includes(spawn.id)
  )?.id ?? selectedSpawnId;
  refreshControls();
});

$('spawn-delete').addEventListener('click', () => {
  if (!selectedSpawnId) return;
  const before = currentAreaRaw()?.spawns?.length ?? 0;
  draft = deleteSpawn(draft, selectedAreaId, selectedSpawnId);
  const after = currentAreaRaw()?.spawns?.length ?? 0;

  if (before === after) {
    setStatus(
      'Spawn protégé : initial ou cible d’un Portal',
      true
    );
  }

  selectedSpawnId = null;
  refreshControls();
});

$('actor-placement-select').addEventListener(
  'change',
  () => {
    selectedActorPlacementId =
      $('actor-placement-select').value ||
      null;
    refreshActorControls();
    renderPreview();
  }
);

$('actor-add').addEventListener(
  'click',
  () => {
    const area =
      currentAreaRaw();
    const actorDefinitionId =
      $('actor-definition').value;

    if (
      !area ||
      !actorDefinitionId
    ) {
      return;
    }

    const before =
      new Set(
        area.actors?.map(
          (actor) => actor.id
        ) ?? []
      );

    draft = addActorPlacement(
      draft,
      selectedAreaId,
      {
        actorDefinitionId,
        x: area.width / 2,
        y: area.height / 2,
        facingX: 1
      }
    );

    selectedActorPlacementId =
      currentAreaRaw()
        ?.actors?.find(
          (actor) =>
            !before.has(actor.id)
        )?.id ??
      selectedActorPlacementId;

    setMapTool(
      'actor-placement'
    );
    refreshControls();
  }
);

$('actor-delete').addEventListener(
  'click',
  () => {
    if (
      !selectedActorPlacementId
    ) {
      return;
    }

    draft =
      deleteActorPlacement(
        draft,
        selectedAreaId,
        selectedActorPlacementId
      );
    selectedActorPlacementId =
      currentAreaRaw()
        ?.actors?.[0]?.id ??
      null;
    refreshControls();
  }
);

for (const id of [
  'actor-x',
  'actor-y',
  'actor-facing'
]) {
  $(id).addEventListener(
    'change',
    () => {
      if (
        !selectedActorPlacementId
      ) {
        return;
      }

      draft =
        updateActorPlacement(
          draft,
          selectedAreaId,
          selectedActorPlacementId,
          {
            x: numberValue(
              $('actor-x')
            ),
            y: numberValue(
              $('actor-y')
            ),
            facingX:
              Number(
                $('actor-facing')
                  .value
              ) < 0
                ? -1
                : 1
          }
        );

      refreshActorControls();
      refreshJson();
      renderPreview();
    }
  );
}

$('object-select').addEventListener(
  'change',
  () => {
    selectedObjectId =
      $('object-select').value;
    refreshObjectControls();
    renderPreview();
  }
);

for (const id of [
  'object-x',
  'object-y',
  'object-rotation',
  'object-scale-x',
  'object-scale-y'
]) {
  $(id).addEventListener(
    'change',
    applyTransformInputs
  );
}

$('bridge-obstacles').addEventListener(
  'change',
  applyBridgeInputs
);

$('object-add').addEventListener(
  'click',
  () => {
    const area = currentAreaRaw();
    const objectDefinitionId =
      $('object-definition').value;

    if (!area || !objectDefinitionId) {
      return;
    }

    const before = new Set(
      area.objects?.map(
        (object) => object.id
      ) ?? []
    );

    draft = addWorldObject(
      draft,
      selectedAreaId,
      {
        objectDefinitionId,
        transform: {
          x: area.width / 2,
          y: area.height / 2,
          rotationDeg: 0,
          scaleX: 1,
          scaleY: 1
        },
        overrides: {
          traversalSurfaceFeatureIds: []
        }
      }
    );

    selectedObjectId =
      currentAreaRaw()
        ?.objects
        ?.find(
          (object) =>
            !before.has(object.id)
        )
        ?.id ??
      selectedObjectId;

    focusSelection();
    refreshControls();
  }
);

$('object-duplicate').addEventListener('click', () => {
  const before = currentAreaRaw()?.objects?.map((object) => object.id) ?? [];
  draft = duplicateWorldObject(
    draft,
    selectedAreaId,
    selectedObjectId
  );
  selectedObjectId = currentAreaRaw()?.objects?.find(
    (object) => !before.includes(object.id)
  )?.id ?? selectedObjectId;
  refreshControls();
});

$('object-delete').addEventListener('click', () => {
  if (!selectedObjectId) return;
  const before = currentAreaRaw()?.objects?.length ?? 0;
  draft = deleteWorldObject(
    draft,
    selectedAreaId,
    selectedObjectId
  );
  const after = currentAreaRaw()?.objects?.length ?? 0;

  if (before === after) {
    setStatus(
      'Objet protégé : référencé par un Portal',
      true
    );
  }

  selectedObjectId = null;
  refreshControls();
});

$('portal-select').addEventListener('change', () => {
  selectedPortalId = $('portal-select').value;
  refreshPortalControls();
  renderPreview();
});

$('portal-add').addEventListener('click', () => {
  const sourceArea = currentAreaRaw();
  const targetArea =
    draft.areas.find((area) => area.id !== selectedAreaId) ??
    sourceArea;
  const targetSpawn = targetArea?.spawns?.[0];

  if (!sourceArea || !targetArea || !targetSpawn) {
    setStatus('Impossible de créer un Portal sans Spawn cible', true);
    return;
  }

  const before = draft.portals.map((portal) => portal.id);

  draft = addPortal(
    draft,
    {
      sourceAreaId: sourceArea.id,
      trigger: {
        kind: 'point',
        x: sourceArea.width / 2,
        y: sourceArea.height / 2,
        radius: 28
      },
      targetAreaId: targetArea.id,
      targetSpawnId: targetSpawn.id,
      visual: {
        visible: true,
        marker: 'portal',
        label: 'Portal'
      }
    }
  );

  selectedPortalId = draft.portals.find(
    (portal) => !before.includes(portal.id)
  )?.id ?? selectedPortalId;
  refreshControls();
});

$('portal-delete').addEventListener('click', () => {
  if (!selectedPortalId) return;
  draft = deletePortal(draft, selectedPortalId);
  selectedPortalId = draft.portals?.[0]?.id ?? null;
  refreshControls();
});

$('portal-trigger-kind').addEventListener('change', () => {
  switchPortalTrigger($('portal-trigger-kind').value);
});

$('portal-source-area').addEventListener('change', () => {
  const portal = currentPortalRaw();
  if (!portal) return;

  draft = updatePortal(
    draft,
    portal.id,
    (nextPortal) => {
      nextPortal.sourceAreaId = $('portal-source-area').value;
    }
  );

  switchPortalTrigger($('portal-trigger-kind').value);
});

$('portal-target-area').addEventListener('change', () => {
  const portal = currentPortalRaw();
  if (!portal) return;

  const targetAreaId = $('portal-target-area').value;
  const targetArea = draft.areas.find(
    (area) => area.id === targetAreaId
  );

  draft = updatePortal(
    draft,
    portal.id,
    (nextPortal) => {
      nextPortal.targetAreaId = targetAreaId;
      nextPortal.targetSpawnId = targetArea?.spawns?.[0]?.id ?? '';
    }
  );

  refreshPortalControls();
  refreshJson();
  renderPreview();
});

$('portal-building').addEventListener('change', () => {
  const portal = currentPortalRaw();
  if (!portal) return;

  const area = draft.areas.find(
    (item) => item.id === portal.sourceAreaId
  );
  const building =
    resolveWorldObjectPlacements(
      area?.objects ?? []
    ).find(
      (object) =>
        object.id ===
        $('portal-building').value
    );
  const anchor =
    building?.doorAnchors?.[0];

  draft = updatePortal(
    draft,
    portal.id,
    (nextPortal) => {
      if (nextPortal.trigger?.kind !== 'object-anchor') return;
      nextPortal.trigger.objectId = building?.id ?? '';
      nextPortal.trigger.anchorId = anchor?.id ?? '';
    }
  );

  refreshPortalControls();
  refreshJson();
  renderPreview();
});

for (const id of [
  'portal-point-x',
  'portal-point-y',
  'portal-radius',
  'portal-anchor',
  'portal-target-spawn',
  'portal-visible',
  'portal-marker',
  'portal-label'
]) {
  $(id).addEventListener('change', applyPortalInputs);
}


$('event-select').addEventListener('change', () => {
  selectedEventId =
    $('event-select').value || null;
  refreshWorldEventControls();
  renderPreview();
});

$('event-add').addEventListener('click', () => {
  const area =
    currentAreaRaw();

  if (!area) return;

  const before =
    new Set(
      (draft.events ?? [])
        .map((event) => event.id)
    );

  draft = addWorldEvent(
    draft,
    {
      sourceAreaId: area.id,
      enabled: true,
      activation: 'on-enter',
      trigger: {
        kind: 'point',
        x: area.width / 2,
        y: area.height / 2,
        radius: 48
      },
      action: {
        kind: 'message',
        text: 'Nouveau message'
      },
      repeatPolicy: 'once'
    }
  );

  selectedEventId =
    draft.events?.find(
      (event) =>
        !before.has(event.id)
    )?.id ??
    selectedEventId;

  refreshControls();
});

$('event-delete').addEventListener('click', () => {
  if (!selectedEventId) return;

  draft =
    deleteWorldEvent(
      draft,
      selectedEventId
    );

  selectedEventId =
    draft.events?.[0]?.id ??
    null;

  refreshControls();
});

$('event-trigger-kind').addEventListener(
  'change',
  () => {
    switchWorldEventTrigger(
      $('event-trigger-kind').value
    );
  }
);

$('event-source-area').addEventListener(
  'change',
  () => {
    const event =
      currentWorldEventRaw();

    if (!event) return;

    draft = updateWorldEvent(
      draft,
      event.id,
      (nextEvent) => {
        nextEvent.sourceAreaId =
          $('event-source-area').value;
      }
    );

    switchWorldEventTrigger(
      $('event-trigger-kind').value
    );
  }
);

$('event-object').addEventListener(
  'change',
  () => {
    const event =
      currentWorldEventRaw();

    if (!event) return;

    const object =
      eventSourceObjects(event)
        .find(
          (item) =>
            item.id ===
            $('event-object').value
        );
    const anchor =
      object?.doorAnchors?.[0];

    draft = updateWorldEvent(
      draft,
      event.id,
      (nextEvent) => {
        if (
          nextEvent.trigger?.kind !==
          'object-anchor'
        ) {
          return;
        }

        nextEvent.trigger.objectId =
          object?.id ?? '';
        nextEvent.trigger.anchorId =
          anchor?.id ?? '';
      }
    );

    refreshWorldEventControls();
    refreshJson();
    renderPreview();
  }
);

for (const id of [
  'event-enabled',
  'event-activation',
  'event-point-x',
  'event-point-y',
  'event-radius',
  'event-anchor',
  'event-message',
  'event-repeat-policy'
]) {
  $(id).addEventListener(
    'change',
    applyWorldEventInputs
  );
}

$('event-message').addEventListener(
  'input',
  applyWorldEventInputs
);

$('preview-fit').addEventListener('click', () => {
  fitRequested = true;
  renderPreview();
});

$('preview-focus').addEventListener('click', focusSelection);

for (const button of document.querySelectorAll('[data-map-tool]')) {
  button.addEventListener('click', () => {
    setMapTool(button.dataset.mapTool);
  });
}

canvas.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();
    const point = canvasCoordinates(event);
    const factor = Math.exp(-event.deltaY * 0.0015);
    applyZoomAtCanvasPoint(zoom * factor, point);
  },
  { passive: false }
);

canvas.addEventListener('pointerdown', (event) => {
  const point = canvasCoordinates(event);
  activePointers.set(event.pointerId, point);

  try {
    canvas.setPointerCapture(event.pointerId);
  } catch {
    // Pointer capture is optional; interaction remains local to the canvas.
  }

  if (activePointers.size === 2) {
    beginPinch();
    canvas.dataset.dragging = 'true';
    return;
  }

  if (activePointers.size > 1) return;

  const world = eventWorldPoint(event);
  const area = currentAreaNormalized();
  if (!world || !area) return;

  hoverWorldPoint = world;
  canvas.dataset.dragging = 'true';

  if (
    mapTool === 'terrain' ||
    mapTool === 'route' ||
    mapTool === 'river'
  ) {
    pointerSession = {
      pointerId: event.pointerId,
      mode: 'pending-draw',
      kind: mapTool,
      startCanvas: point,
      startWorld: world
    };
    return;
  }

  if (mapTool === 'actor-placement') {
    const x = Math.max(
      0,
      Math.min(
        area.width,
        world.x
      )
    );
    const y = Math.max(
      0,
      Math.min(
        area.height,
        world.y
      )
    );

    if (
      selectedActorPlacementId
    ) {
      draft =
        updateActorPlacement(
          draft,
          selectedAreaId,
          selectedActorPlacementId,
          { x, y }
        );
    } else {
      const actorDefinitionId =
        $('actor-definition').value;
      const before =
        new Set(
          currentActorPlacements()
            .map(
              (actor) =>
                actor.id
            )
        );

      draft =
        addActorPlacement(
          draft,
          selectedAreaId,
          {
            actorDefinitionId,
            x,
            y
          }
        );

      selectedActorPlacementId =
        currentActorPlacements()
          .find(
            (actor) =>
              !before.has(
                actor.id
              )
          )?.id ??
        null;
    }

    pointerSession = {
      pointerId: event.pointerId,
      mode:
        'drag-actor-placement'
    };
    refreshActorControls();
    refreshJson();
    renderPreview();
    return;
  }

  if (mapTool === 'area-size') {
    if (hitAreaResizeHandle(area, world)) {
      pointerSession = {
        pointerId: event.pointerId,
        mode: 'resize-area'
      };
    } else {
      pointerSession = {
        pointerId: event.pointerId,
        mode: 'pan',
        startCanvas: point,
        startCenter: { ...center },
        startZoom: zoom
      };
    }
    return;
  }

  const gizmo = hitSelectedObjectGizmo(area, world);
  if (gizmo?.kind === 'rotate') {
    pointerSession = {
      pointerId: event.pointerId,
      mode: 'rotate-object',
      centerX: gizmo.rect.x,
      centerY: gizmo.rect.y,
      angleOffset:
        Math.atan2(
          world.y - gizmo.rect.y,
          world.x - gizmo.rect.x
        ) - gizmo.rect.rotation
    };
    return;
  }

  if (gizmo?.kind === 'scale') {
    const base = objectBaseDimensions(gizmo.object);
    if (base) {
      pointerSession = {
        pointerId: event.pointerId,
        mode: 'scale-object',
        centerX: gizmo.rect.x,
        centerY: gizmo.rect.y,
        rotation: gizmo.rect.rotation,
        baseWidth: base.width,
        baseHeight: base.height
      };
      return;
    }
  }

  const object = hitWorldObject(area, world);
  if (object) {
    selectedObjectId = object.id;
    selectedSpawnId = null;
    activateTab('objects');
    pointerSession = {
      pointerId: event.pointerId,
      mode: 'drag-object',
      offsetX: world.x - object.transform.x,
      offsetY: world.y - object.transform.y
    };
    refreshObjectControls();
    renderPreview();
    return;
  }

  const spawn = hitSpawn(area, world);
  if (spawn) {
    selectedSpawnId = spawn.id;
    selectedObjectId = null;
    activateTab('area');

    pointerSession = spawn.anchor
      ? null
      : {
          pointerId: event.pointerId,
          mode: 'drag-spawn',
          offsetX: world.x - spawn.x,
          offsetY: world.y - spawn.y
        };

    refreshAreaControls();
    renderPreview();
    return;
  }

  pointerSession = {
    pointerId: event.pointerId,
    mode: 'pan',
    startCanvas: point,
    startCenter: { ...center },
    startZoom: zoom
  };
});

canvas.addEventListener('pointermove', (event) => {
  const hover = eventWorldPoint(event);
  if (hover) hoverWorldPoint = hover;

  if (!activePointers.has(event.pointerId)) {
    if (mapTool === 'terrain') renderPreview();
    return;
  }

  const canvasPoint = canvasCoordinates(event);
  activePointers.set(event.pointerId, canvasPoint);

  if (activePointers.size === 2) {
    if (!pinchState) beginPinch();
    updatePinch();
    return;
  }

  if (
    !pointerSession ||
    pointerSession.pointerId !== event.pointerId
  ) {
    return;
  }

  const area = currentAreaRaw();
  const world = hover ?? eventWorldPoint(event);
  if (!area || !world) return;

  if (pointerSession.mode === 'pending-draw') {
    const distance = Math.hypot(
      canvasPoint.x - pointerSession.startCanvas.x,
      canvasPoint.y - pointerSession.startCanvas.y
    );

    if (distance < 4) return;

    const pathId = beginSurfacePath(
      pointerSession.kind,
      pointerSession.startWorld
    );
    if (!pathId) return;

    appendDrawPoint(
      pointerSession.kind,
      pathId,
      world,
      true
    );

    pointerSession = {
      ...pointerSession,
      mode: 'draw-path',
      pathId
    };

    refreshTerrainControls();
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'draw-path') {
    appendDrawPoint(
      pointerSession.kind,
      pointerSession.pathId,
      world
    );
    renderPreview();
    return;
  }

  if (
    pointerSession.mode ===
      'drag-actor-placement' &&
    selectedActorPlacementId
  ) {
    draft =
      updateActorPlacement(
        draft,
        selectedAreaId,
        selectedActorPlacementId,
        {
          x: Math.max(
            0,
            Math.min(
              area.width,
              world.x
            )
          ),
          y: Math.max(
            0,
            Math.min(
              area.height,
              world.y
            )
          )
        }
      );
    refreshActorControls();
    refreshJson();
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'rotate-object') {
    const pointerAngle = Math.atan2(
      world.y - pointerSession.centerY,
      world.x - pointerSession.centerX
    );
    let degrees =
      (pointerAngle - pointerSession.angleOffset) *
      180 / Math.PI;
    degrees = ((degrees % 360) + 360) % 360;

    draft = updateWorldObjectTransform(
      draft,
      selectedAreaId,
      selectedObjectId,
      { rotationDeg: degrees }
    );

    $('object-rotation').value =
      Math.round(degrees * 10) / 10;
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'scale-object') {
    const dx = world.x - pointerSession.centerX;
    const dy = world.y - pointerSession.centerY;
    const cos = Math.cos(-pointerSession.rotation);
    const sin = Math.sin(-pointerSession.rotation);
    const localX = dx * cos - dy * sin;
    const localY = dx * sin + dy * cos;

    const scaleX = Math.max(
      WORLD_OBJECT_LIMITS.minScale,
      Math.min(
        WORLD_OBJECT_LIMITS.maxScale,
        Math.abs(localX) * 2 /
          Math.max(1, pointerSession.baseWidth)
      )
    );
    const scaleY = Math.max(
      WORLD_OBJECT_LIMITS.minScale,
      Math.min(
        WORLD_OBJECT_LIMITS.maxScale,
        Math.abs(localY) * 2 /
          Math.max(1, pointerSession.baseHeight)
      )
    );

    draft = updateWorldObjectTransform(
      draft,
      selectedAreaId,
      selectedObjectId,
      { scaleX, scaleY }
    );

    $('object-scale-x').value =
      Math.round(scaleX * 100) / 100;
    $('object-scale-y').value =
      Math.round(scaleY * 100) / 100;
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'drag-object') {
    const x = Math.max(
      0,
      Math.min(
        area.width,
        world.x - pointerSession.offsetX
      )
    );
    const y = Math.max(
      0,
      Math.min(
        area.height,
        world.y - pointerSession.offsetY
      )
    );

    draft = updateWorldObjectTransform(
      draft,
      selectedAreaId,
      selectedObjectId,
      { x, y }
    );

    $('object-x').value = Math.round(x * 10) / 10;
    $('object-y').value = Math.round(y * 10) / 10;
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'drag-spawn') {
    const x = Math.max(
      0,
      Math.min(
        area.width,
        world.x - pointerSession.offsetX
      )
    );
    const y = Math.max(
      0,
      Math.min(
        area.height,
        world.y - pointerSession.offsetY
      )
    );

    draft = updateSpawn(
      draft,
      selectedAreaId,
      selectedSpawnId,
      { x, y }
    );

    $('spawn-x').value = Math.round(x * 10) / 10;
    $('spawn-y').value = Math.round(y * 10) / 10;
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'resize-area') {
    const width = Math.max(128, world.x);
    const height = Math.max(128, world.y);

    draft = updateAreaProperties(
      draft,
      selectedAreaId,
      { width, height }
    );

    $('area-width').value = Math.round(width);
    $('area-height').value = Math.round(height);
    fitRequested = false;
    renderPreview();
    return;
  }

  if (pointerSession.mode === 'pan') {
    center = {
      ...panBuilderCenter({
        center: pointerSession.startCenter,
        deltaCanvasX:
          canvasPoint.x - pointerSession.startCanvas.x,
        deltaCanvasY:
          canvasPoint.y - pointerSession.startCanvas.y,
        zoom: pointerSession.startZoom
      })
    };
    fitRequested = false;
    renderPreview();
  }
});

canvas.addEventListener('pointerleave', () => {
  if (activePointers.size > 0) return;
  hoverWorldPoint = null;
  if (mapTool === 'terrain') renderPreview();
});

function endPointer(event) {
  const wasTracked = activePointers.has(event.pointerId);
  activePointers.delete(event.pointerId);

  if (!wasTracked) return;

  if (
    pointerSession &&
    pointerSession.pointerId === event.pointerId &&
    pointerSession.mode === 'draw-path'
  ) {
    const world = eventWorldPoint(event);
    if (world) {
      appendDrawPoint(
        pointerSession.kind,
        pointerSession.pathId,
        world,
        true
      );
    }
  }

  if (activePointers.size < 2) {
    pinchState = null;
  }

  if (
    pointerSession &&
    pointerSession.pointerId === event.pointerId
  ) {
    pointerSession = null;
    finishPointerEditing();
  } else if (activePointers.size === 0) {
    canvas.dataset.dragging = 'false';
  }

  try {
    canvas.releasePointerCapture(event.pointerId);
  } catch {
    // Ignore browsers that already released pointer capture.
  }
}

canvas.addEventListener('pointerup', endPointer);
canvas.addEventListener('pointercancel', endPointer);

$('test-exploration').addEventListener('click', (event) => {
  const result = currentValidation();

  if (!result.valid || !result.document) {
    event.preventDefault();
    setStatus(
      `Impossible de tester : ${result.errors.join(' · ')}`,
      true
    );
    return;
  }

  try {
    saveWorldBuilderTestHandoff(
      window.sessionStorage,
      result.document
    );
  } catch (error) {
    event.preventDefault();
    setStatus(
      `Impossible de préparer le test : ${error.message}`,
      true
    );
  }
});

$('export-json').addEventListener('click', () => {
  try {
    const json = serializeWorldBuilderDraft(draft);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${draft.id || 'world'}.world.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus('WorldDocument exporté');
  } catch (error) {
    setStatus(error.message, true);
  }
});

$('import-json').addEventListener('change', async () => {
  const file = $('import-json').files?.[0];
  if (!file) return;

  try {
    draft = importWorldBuilderDocument(await file.text());
    selectedAreaId = draft.initialAreaId ?? draft.areas[0]?.id ?? null;
    selectedSpawnId = null;
    selectedObjectId = null;
    selectedActorPlacementId =
      draft.areas.find(
        (area) =>
          area.id === selectedAreaId
      )?.actors?.[0]?.id ??
      null;
    selectedPortalId = draft.portals?.[0]?.id ?? null;
    selectedSurfaceKind = null;
    selectedSurfacePathId = null;
    fitRequested = true;
    refreshControls();
    setStatus('WorldDocument importé et validé');
  } catch (error) {
    setStatus(error.message, true);
  } finally {
    $('import-json').value = '';
  }
});

$('reset-demo').addEventListener('click', () => {
  draft = createWorldBuilderDraft(demoWorldDocument);
  selectedAreaId = draft.initialAreaId;
  selectedSpawnId = null;
  selectedObjectId = null;
  selectedActorPlacementId =
    draft.areas.find(
      (area) =>
        area.id === selectedAreaId
    )?.actors?.[0]?.id ??
    null;
  selectedPortalId = draft.portals?.[0]?.id ?? null;
  selectedSurfaceKind = null;
  selectedSurfacePathId = null;
  fitRequested = true;
  refreshControls();
});

addEventListener('resize', () => {
  renderPreview();
});

refreshControls();
if (resumeBuilderTest) {
  setStatus(
    'Session de test restaurée dans le World Builder'
  );
}
