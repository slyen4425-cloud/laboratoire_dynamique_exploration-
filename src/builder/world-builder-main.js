import { demoWorldDocument } from '../world/demo-world.js?rev=world-builder-dynamique-ui-v1';
import {
  addPortal,
  addSpawn,
  addSurfacePath,
  addWorldObject,
  appendSurfacePathPoint,
  createWorldBuilderDraft,
  deletePortal,
  deleteSpawn,
  deleteSurfacePath,
  deleteWorldObject,
  duplicateWorldObject,
  importWorldBuilderDocument,
  patchWorldObject,
  serializeWorldBuilderDraft,
  updateAreaProperties,
  updatePortal,
  updateSpawn,
  updateSurfacePath,
  updateWorldObjectTransform,
  updateWorldObjectVisual,
  validateWorldBuilderDraft
} from './world-builder-draft.js';
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
import {
  bridgeVisualRect,
  buildingVisualRect
} from '../world/world-object-model.js';
import {
  resolvePortalTriggerPoint
} from '../world/portal-model.js';
import {
  materialPackV1
} from '../materials/material-pack-v1.js';
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
} from '../assets/image-asset-loader.js';
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

let draft = createWorldBuilderDraft(demoWorldDocument);
let selectedAreaId = draft.initialAreaId ?? draft.areas[0]?.id ?? null;
let selectedSpawnId = null;
let selectedObjectId = null;
let selectedPortalId = draft.portals[0]?.id ?? null;
let selectedSurfaceKind = null;
let selectedSurfacePathId = null;
let zoom = 0.35;
let center = { x: 0, y: 0 };
let fitRequested = true;
let lastView = null;
let mapTool = 'select';
let pointerSession = null;
let pinchState = null;
let hoverWorldPoint = null;
const activePointers = new Map();

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

  if (!draft.portals?.some((portal) => portal.id === selectedPortalId)) {
    selectedPortalId = draft.portals?.[0]?.id ?? null;
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

function refreshAreaControls() {
  ensureSelections();
  setOptions($('area-select'), draft.areas, selectedAreaId);
  $('area-select').value = selectedAreaId ?? '';

  const area = currentAreaRaw();
  if (!area) return;

  $('area-width').value = area.width;
  $('area-height').value = area.height;

  setOptions(
    $('area-material'),
    surfaceMaterials,
    area.surface?.baseMaterialId,
    {
      label: (material) => material.label
    }
  );
  $('area-material').value = area.surface?.baseMaterialId ?? '';

  setOptions(
    $('spawn-select'),
    area.spawns ?? [],
    selectedSpawnId
  );
  if (selectedSpawnId) $('spawn-select').value = selectedSpawnId;

  const spawn = currentSpawnRaw();
  $('spawn-x').value = spawn?.x ?? '';
  $('spawn-y').value = spawn?.y ?? '';
  $('spawn-x').disabled = !spawn;
  $('spawn-y').disabled = !spawn;
  $('spawn-delete').disabled = !spawn;
}


function refreshTerrainControls() {
  const area = currentAreaRaw();

  setOptions(
    $('terrain-paint-material'),
    surfaceMaterials,
    $('terrain-paint-material').value,
    { label: (material) => material.label }
  );
  if (!$('terrain-paint-material').value && surfaceMaterials[0]) {
    $('terrain-paint-material').value = surfaceMaterials[0].id;
  }

  $('terrain-brush-size-value').value =
    String(numberValue($('terrain-brush-size'), 180));

  setOptions(
    $('terrain-route-material'),
    pathMaterials,
    $('terrain-route-material').value,
    { label: (material) => material.label }
  );
  if (!$('terrain-route-material').value && pathMaterials[0]) {
    $('terrain-route-material').value = pathMaterials[0].id;
  }

  setOptions(
    $('terrain-river-material'),
    waterMaterials,
    $('terrain-river-material').value,
    { label: (material) => material.label }
  );
  if (!$('terrain-river-material').value && waterMaterials[0]) {
    $('terrain-river-material').value = waterMaterials[0].id;
  }

  const select = $('terrain-path-select');
  const selectedKey =
    selectedSurfaceKind && selectedSurfacePathId
      ? `${selectedSurfaceKind}:${selectedSurfacePathId}`
      : '';

  select.replaceChildren();

  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = 'Aucun tracé sélectionné';
  select.append(empty);

  for (const item of surfacePathItems(area)) {
    const option = document.createElement('option');
    option.value = item.key;
    option.textContent =
      `${
        item.kind === 'river'
          ? 'Rivière'
          : item.kind === 'terrain'
            ? 'Terrain'
            : 'Route'
      } · ${item.id}`;
    select.append(option);
  }

  select.value = selectedKey;

  const selected = currentSurfacePathRaw();
  $('terrain-path-delete').disabled = !selected;

  if (selected && selectedSurfaceKind === 'terrain') {
    $('terrain-brush-size').value = selected.width;
    $('terrain-brush-size-value').value = String(selected.width);
    $('terrain-paint-material').value = selected.materialId;
  }

  if (selected && selectedSurfaceKind === 'route') {
    $('terrain-route-width').value = selected.width;
    $('terrain-route-material').value = selected.materialId;
  }

  if (selected && selectedSurfaceKind === 'river') {
    $('terrain-river-width').value = selected.width;
    $('terrain-river-material').value = selected.materialId;
  }
}

function compatibleAssets(object) {
  if (!object) return [];

  const kind =
    object.kind === 'bridge'
      ? 'bridge-visual'
      : object.kind === 'building'
        ? 'building-visual'
        : null;

  return listWorldObjectAssets().filter(
    (asset) => asset.kind === kind
  );
}

function refreshObjectControls() {
  const area = currentAreaRaw();
  const objects = area?.objects ?? [];

  setOptions(
    $('object-select'),
    objects,
    selectedObjectId,
    {
      label: (object) => `${object.kind} · ${object.id}`
    }
  );

  if (selectedObjectId) {
    $('object-select').value = selectedObjectId;
  }

  const object = currentObjectRaw();
  const disabled = !object;

  for (const id of [
    'object-duplicate',
    'object-delete',
    'object-asset',
    'object-x',
    'object-y',
    'object-rotation',
    'object-scale-x',
    'object-scale-y'
  ]) {
    $(id).disabled = disabled;
  }

  if (!object) {
    $('building-fields').hidden = true;
    $('bridge-fields').hidden = true;
    return;
  }

  const assets = compatibleAssets(object);
  setOptions(
    $('object-asset'),
    assets,
    object.visual?.assetId,
    { label: (asset) => asset.id }
  );
  $('object-asset').value = object.visual?.assetId ?? '';

  $('object-x').value = object.transform?.x ?? 0;
  $('object-y').value = object.transform?.y ?? 0;
  $('object-rotation').value = object.transform?.rotationDeg ?? 0;
  $('object-scale-x').value = object.transform?.scaleX ?? 1;
  $('object-scale-y').value = object.transform?.scaleY ?? 1;

  const building = object.kind === 'building';
  const bridge = object.kind === 'bridge';
  $('building-fields').hidden = !building;
  $('bridge-fields').hidden = !bridge;

  if (building) {
    $('building-width').value = object.baseSize?.width ?? 260;
    $('building-height').value = object.baseSize?.height ?? 260;
    $('building-footprint-width').value =
      object.footprint?.widthRatio ?? 0.78;
    $('building-footprint-height').value =
      object.footprint?.heightRatio ?? 0.62;
    $('building-footprint-x').value =
      object.footprint?.offsetX ?? 0;
    $('building-footprint-y').value =
      object.footprint?.offsetY ?? -0.08;

    const door =
      object.doorAnchors?.find((anchor) => anchor.id === 'main-door') ??
      object.doorAnchors?.[0] ??
      null;
    $('building-door-x').value = door?.x ?? 0;
    $('building-door-y').value = door?.y ?? 0.38;
  }

  if (bridge) {
    $('bridge-length').value = object.baseSize?.length ?? 160;
    $('bridge-width').value = object.baseSize?.width ?? 80;
    $('bridge-passage-length').value =
      object.traversal?.lengthRatio ?? 0.9;
    $('bridge-passage-width').value =
      object.traversal?.widthRatio ?? 0.8;
    $('bridge-edge-assist').value =
      object.traversal?.edgeAssistRatio ?? 0.15;
    $('bridge-obstacles').value =
      object.traversal?.overridesObstacleIds?.join(', ') ?? '';
  }
}

function sourceBuildings(portal) {
  const area = draft.areas.find(
    (item) => item.id === portal?.sourceAreaId
  );
  return area?.objects?.filter(
    (object) => object.kind === 'building'
  ) ?? [];
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
    portal.targetSpawnId
  );
  $('portal-target-spawn').value = portal.targetSpawnId;

  $('portal-visible').checked = portal.visual?.visible === true;
  $('portal-marker').value = portal.visual?.marker ?? 'portal';
  $('portal-label').value = portal.visual?.label ?? '';
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
  refreshTerrainControls();
  refreshObjectControls();
  refreshPortalControls();
  refreshJson();
  renderPreview();
}

function selectedWorldPoint(document, area) {
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
  if (spawn) return { x: spawn.x, y: spawn.y };

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
  $('preview-zoom').value = zoom;
  fitRequested = false;
}

function focusSelection() {
  const document = normalizedDocument();
  const area = currentAreaNormalized();
  if (!document || !area) return;

  center = selectedWorldPoint(document, area);
  zoom = clampBuilderZoom(Math.max(0.35, Math.min(1.4, zoom)));
  $('preview-zoom').value = zoom;
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

  const handleSize = 18 / zoom;
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
    const selected = spawn.id === selectedSpawnId;

    ctx.beginPath();
    ctx.arc(
      spawn.x - camera.x,
      spawn.y - camera.y,
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

  const object = area.objects.find(
    (item) => item.id === selectedObjectId
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

      ctx.save();
      ctx.translate(rect.x - camera.x, rect.y - camera.y);
      ctx.rotate(rect.rotation);
      ctx.strokeStyle = 'rgba(255,236,130,0.95)';
      ctx.lineWidth = 3 / zoom;
      ctx.setLineDash([10 / zoom, 6 / zoom]);
      ctx.strokeRect(
        -width / 2,
        -height / 2,
        width,
        height
      );
      ctx.restore();
    }
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

  ctx.restore();
}

function renderPreview() {
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

function applyBuildingInputs() {
  const object = currentObjectRaw();
  if (!object || object.kind !== 'building') return;

  draft = patchWorldObject(
    draft,
    selectedAreaId,
    selectedObjectId,
    (building) => {
      building.baseSize.width = numberValue(
        $('building-width'),
        building.baseSize.width
      );
      building.baseSize.height = numberValue(
        $('building-height'),
        building.baseSize.height
      );
      building.footprint.widthRatio = numberValue(
        $('building-footprint-width'),
        building.footprint.widthRatio
      );
      building.footprint.heightRatio = numberValue(
        $('building-footprint-height'),
        building.footprint.heightRatio
      );
      building.footprint.offsetX = numberValue(
        $('building-footprint-x'),
        building.footprint.offsetX
      );
      building.footprint.offsetY = numberValue(
        $('building-footprint-y'),
        building.footprint.offsetY
      );

      const door =
        building.doorAnchors.find(
          (anchor) => anchor.id === 'main-door'
        ) ?? building.doorAnchors[0];

      if (door) {
        door.x = numberValue($('building-door-x'), door.x);
        door.y = numberValue($('building-door-y'), door.y);
      }
    }
  );

  refreshJson();
  renderPreview();
}

function applyBridgeInputs() {
  const object = currentObjectRaw();
  if (!object || object.kind !== 'bridge') return;

  draft = patchWorldObject(
    draft,
    selectedAreaId,
    selectedObjectId,
    (bridge) => {
      bridge.baseSize.length = numberValue(
        $('bridge-length'),
        bridge.baseSize.length
      );
      bridge.baseSize.width = numberValue(
        $('bridge-width'),
        bridge.baseSize.width
      );
      bridge.traversal.lengthRatio = numberValue(
        $('bridge-passage-length'),
        bridge.traversal.lengthRatio
      );
      bridge.traversal.widthRatio = numberValue(
        $('bridge-passage-width'),
        bridge.traversal.widthRatio
      );
      bridge.traversal.edgeAssistRatio = numberValue(
        $('bridge-edge-assist'),
        bridge.traversal.edgeAssistRatio
      );
      bridge.traversal.overridesObstacleIds = $('bridge-obstacles')
        .value
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
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
      if (kind === 'building-door') {
        const area = draft.areas.find(
          (item) => item.id === nextPortal.sourceAreaId
        );
        const building = area?.objects?.find(
          (object) => object.kind === 'building'
        );
        const anchor = building?.doorAnchors?.[0];

        if (building && anchor) {
          nextPortal.trigger = {
            kind: 'building-door',
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
          kind: 'building-door',
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
  mapTool = ['select', 'area-size', 'terrain', 'route', 'river'].includes(tool)
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
  } else if (mapTool === 'area-size') {
    activateTab('area');
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

function hitWorldObject(area, point) {
  const objects = [...(area?.objects ?? [])].reverse();

  return objects.find((object) => {
    const rect = worldObjectRectForHit(object);
    return rect && pointInRotatedRect(point, rect);
  }) ?? null;
}

function hitSpawn(area, point) {
  const radius = 18 / Math.max(zoom, 0.05);
  const radiusSq = radius * radius;

  return (area?.spawns ?? []).find((spawn) => {
    const dx = point.x - spawn.x;
    const dy = point.y - spawn.y;
    return dx * dx + dy * dy <= radiusSq;
  }) ?? null;
}

function syncZoomInput() {
  $('preview-zoom').value = String(zoom);
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
  syncZoomInput();
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

  draft = addSurfacePath(
    draft,
    selectedAreaId,
    kind,
    {
      width,
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
  syncZoomInput();
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

for (const id of ['area-width', 'area-height', 'area-material']) {
  $(id).addEventListener('change', () => {
    draft = updateAreaProperties(
      draft,
      selectedAreaId,
      {
        width: numberValue($('area-width')),
        height: numberValue($('area-height')),
        baseMaterialId: $('area-material').value
      }
    );
    fitRequested = true;
    refreshControls();
  });
}


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

for (const [kind, widthId, materialId] of [
  ['terrain', 'terrain-brush-size', 'terrain-paint-material'],
  ['route', 'terrain-route-width', 'terrain-route-material'],
  ['river', 'terrain-river-width', 'terrain-river-material']
]) {
  $(widthId).addEventListener('change', () => {
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
      { width: numberValue($(widthId)) }
    );
    refreshJson();
    renderPreview();
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

$('object-select').addEventListener('change', () => {
  selectedObjectId = $('object-select').value;
  refreshObjectControls();
  renderPreview();
});

$('object-asset').addEventListener('change', () => {
  draft = updateWorldObjectVisual(
    draft,
    selectedAreaId,
    selectedObjectId,
    $('object-asset').value
  );
  refreshJson();
  renderPreview();
});

for (const id of [
  'object-x',
  'object-y',
  'object-rotation',
  'object-scale-x',
  'object-scale-y'
]) {
  $(id).addEventListener('change', applyTransformInputs);
}

for (const id of [
  'building-width',
  'building-height',
  'building-footprint-width',
  'building-footprint-height',
  'building-footprint-x',
  'building-footprint-y',
  'building-door-x',
  'building-door-y'
]) {
  $(id).addEventListener('change', applyBuildingInputs);
}

for (const id of [
  'bridge-length',
  'bridge-width',
  'bridge-passage-length',
  'bridge-passage-width',
  'bridge-edge-assist',
  'bridge-obstacles'
]) {
  $(id).addEventListener('change', applyBridgeInputs);
}

$('object-add-building').addEventListener('click', () => {
  const area = currentAreaRaw();
  if (!area) return;

  draft = addWorldObject(
    draft,
    selectedAreaId,
    {
      kind: 'building',
      transform: {
        x: area.width / 2,
        y: area.height / 2,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        width: 300,
        height: 300
      },
      visual: {
        assetId: 'object.building.house.fantasy_wood_stone.01'
      },
      footprint: {
        enabled: true,
        widthRatio: 0.78,
        heightRatio: 0.62,
        offsetX: 0,
        offsetY: -0.08
      },
      doorAnchors: [
        {
          id: 'main-door',
          x: 0,
          y: 0.38
        }
      ]
    }
  );

  selectedObjectId = currentAreaRaw()?.objects?.at(-1)?.id ?? null;
  focusSelection();
  refreshControls();
});

$('object-add-bridge').addEventListener('click', () => {
  const area = currentAreaRaw();
  if (!area) return;

  draft = addWorldObject(
    draft,
    selectedAreaId,
    {
      kind: 'bridge',
      transform: {
        x: area.width / 2,
        y: area.height / 2,
        rotationDeg: 0,
        scaleX: 1,
        scaleY: 1
      },
      baseSize: {
        length: 170,
        width: 96
      },
      visual: {
        assetId: 'object.bridge.wood.rustic_bank.01'
      },
      traversal: {
        enabled: true,
        lengthRatio: 0.92,
        widthRatio: 0.82,
        edgeAssistRatio: 0.15,
        overridesObstacleIds: []
      }
    }
  );

  selectedObjectId = currentAreaRaw()?.objects?.at(-1)?.id ?? null;
  focusSelection();
  refreshControls();
});

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
  const building = area?.objects?.find(
    (object) => object.id === $('portal-building').value
  );
  const anchor = building?.doorAnchors?.[0];

  draft = updatePortal(
    draft,
    portal.id,
    (nextPortal) => {
      if (nextPortal.trigger?.kind !== 'building-door') return;
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

$('preview-fit').addEventListener('click', () => {
  fitRequested = true;
  renderPreview();
});

$('preview-focus').addEventListener('click', focusSelection);

$('preview-zoom').addEventListener('input', () => {
  zoom = clampBuilderZoom(
    numberValue($('preview-zoom'), zoom)
  );
  fitRequested = false;
  renderPreview();
});


for (const button of document.querySelectorAll('[data-map-tool]')) {
  button.addEventListener('click', () => {
    setMapTool(button.dataset.mapTool);
  });
}

$('preview-zoom-in').addEventListener('click', () => {
  applyZoomAtCanvasPoint(
    zoom * 1.25,
    {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight / 2
    }
  );
});

$('preview-zoom-out').addEventListener('click', () => {
  applyZoomAtCanvasPoint(
    zoom / 1.25,
    {
      x: canvas.clientWidth / 2,
      y: canvas.clientHeight / 2
    }
  );
});

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

  if (mapTool === 'area-size') {
    pointerSession = {
      pointerId: event.pointerId,
      mode: 'resize-area'
    };
    return;
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
    pointerSession = {
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
  if (!activePointers.has(event.pointerId)) return;

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
  const world = eventWorldPoint(event);
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
