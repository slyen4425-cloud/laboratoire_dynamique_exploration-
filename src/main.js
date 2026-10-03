import { normalize } from './core/vector.js';
import { stepMovement } from './core/movement.js?rev=surface-traversal-replay-v1';
import { normalizeExplorationConfig } from './core/config.js';
import {
  createTraversalRuleRegistry,
  resolveSurfaceTraversal
} from './core/surface-traversal.js?rev=surface-traversal-replay-v1';
import {
  traversalRulePackV1
} from './core/traversal-rule-pack-v1.js?rev=surface-traversal-replay-v1';
import { createVirtualStick } from './input/virtual-stick.js';
import { createSurfaceRenderer } from './render/surface-renderer.js';
import { createWorldObjectRenderer } from './render/world-object-renderer.js?rev=worldarea-portal-v1-exit-marker';
import { createPortalRenderer } from './render/portal-renderer.js?rev=worldarea-portal-v1-exit-marker';
import { createMapActorRenderer } from './render/map-actor-renderer.js?rev=map-actor-source-facing-v1';
import { normalizeMapActorVisual } from './actors/map-actor-visual-model.js?rev=map-actor-source-facing-v1';
import {
  createPlacedMapActorView
} from './actors/placed-map-actor-view.js';
import {
  createCaptureActorPreviewProviderV1
} from './capture/capture-actor-preview-loader-v1.js?rev=actor-opponent-view-v1';
import { materialPackV1 } from './materials/material-pack-v1.js?rev=worldarea-portal-v1-interior-surface-fix';
import { createMaterialRegistry } from './materials/material-registry.js';
import { resolveMaterialAsset } from './assets/material-asset-adapter.js';
import {
  resolveWorldObjectAsset
} from './assets/world-object-asset-adapter.js?rev=worldarea-portal-v1';
import {
  createImageAssetLoader
} from './assets/image-asset-loader.js?rev=map-actor-dataurl-fix-v1';
import {
  createMapActorAssetResolver
} from './assets/map-actor-asset-adapter.js?rev=map-actor-visual-v1';
import {
  createMapActorVisualPreparer
} from './assets/map-actor-visual-preparer.js?rev=map-actor-visual-v1';
import {
  collectMaterialAssetIds,
  createMaterialTextureLoader
} from './render/material-texture-loader.js';
import {
  createInitialExplorationState,
  findWorldAreaById
} from './world/world-document-model.js?rev=terrain-family-encounters-v1';
import {
  applyPortalTransition,
  findTriggeredPortal
} from './world/portal-model.js?rev=builder-dynamic-return-v1';
import { demoWorldDocument } from './world/demo-world.js?rev=terrain-family-encounters-v1';
import {
  readWorldBuilderTestHandoff,
  readWorldBuilderTestSession
} from './builder/world-builder-test-handoff.js?rev=builder-dynamic-return-v1';
import {
  createCaptureCreatureCatalogProvider
} from './capture/capture-creature-catalog-provider.js?rev=terrain-family-encounters-v1';
import {
  CAPTURE_CREATURE_CATALOG_PREVIEW_V1
} from './capture/capture-creature-catalog-preview-v1.js?rev=terrain-family-encounters-v1';
import {
  resolveActiveCapturePartyRefV1
} from './capture/capture-party-ref-adapter-v1.js';
import {
  CAPTURE_SESSION_PREVIEW_V1
} from './capture/capture-session-preview-v1.js';
import {
  createEncounterController
} from './encounters/encounter-controller.js?rev=phase7-snapshot-v1';
import {
  snapshotFromEncounterIntent
} from './encounters/encounter-bridge.js?rev=phase7-snapshot-v1';
import {
  consumeCombatResult
} from './encounters/combat-handoff-store.js?rev=phase7-combat-handoff-v1';
import {
  launchCombatHandoffNavigation
} from './encounters/combat-handoff-navigation.js?rev=phase7-combat-handoff-v1';
import {
  resolveExplorationCombatReturn
} from './encounters/combat-return.js?rev=phase7-combat-handoff-v1';
import {
  demoLivingWorldConfig
} from './living/demo-living-world.js?rev=phase5-wild-wander-territory-v1';
import {
  resolveDemoLivingActorDefinition
} from './living/demo-living-actor-adapter.js?rev=phase5-wild-wander-territory-v1';
import {
  collectLivingMapActorAssetIds,
  createInitialWildlife,
  createWildMapActorView,
  createWildWanderController
} from './living/living-runtime.js?rev=phase5-wild-wander-territory-v1-boundary';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const coords = document.querySelector('#coords');
const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');
const locomotionButtons = [
  ...document.querySelectorAll('[data-locomotion]')
];
const encounterPreview =
  document.querySelector('#encounter-preview');
const encounterPreviewSummary =
  document.querySelector('#encounter-preview-summary');
const encounterPreviewCombat =
  document.querySelector('#encounter-preview-combat');
const encounterPreviewContinue =
  document.querySelector('#encounter-preview-continue');

const config = normalizeExplorationConfig();
const runtimeParams = new URL(document.URL).searchParams;
const builderTest = runtimeParams.get('builderTest') === '1';
const encounterTest =
  runtimeParams.get('encounterTest') === '1';
const combatReturn =
  runtimeParams.get('combatReturn') === '1';
const returnedCombatEnvelope =
  combatReturn
    ? consumeCombatResult(window.sessionStorage)
    : null;
const builderTestSession = builderTest
  ? readWorldBuilderTestSession(window.sessionStorage)
  : null;
const builderTestDocument =
  builderTestSession?.document ??
  (
    builderTest
      ? readWorldBuilderTestHandoff(window.sessionStorage)
      : null
  );

if (builderTest && !builderTestDocument) {
  throw new Error(
    'Session de test World Builder introuvable ou invalide'
  );
}

const activeWorldDocument =
  builderTestDocument ?? demoWorldDocument;

const builderShortcut = document.querySelector('#builder-shortcut');
if (builderShortcut && builderTest) {
  builderShortcut.href = './builder.html?resumeBuilderTest=1';
  builderShortcut.textContent = 'Retour World Builder';
}

const initialState = createInitialExplorationState(activeWorldDocument);

if (!initialState) {
  throw new Error('WorldDocument has no valid initial Area/Spawn');
}

const player = {
  currentAreaId: initialState.currentAreaId,
  x: initialState.x,
  y: initialState.y,
  radius: config.player.radius,
  locomotion: { modes: ['ground'] },
  viaPortalId: null,
  facingX: 1,
  moving: false,
  mapVisual:
    normalizeMapActorVisual({
      assetId: 'actor.demo.hero.traveler.01',
      role: 'hero'
    })
};

let lastCombatOutcome = null;

if (returnedCombatEnvelope) {
  const restored =
    resolveExplorationCombatReturn({
      envelope: returnedCombatEnvelope,
      worldDocument: activeWorldDocument
    });

  player.currentAreaId =
    restored.currentAreaId;
  player.x = restored.x;
  player.y = restored.y;
  lastCombatOutcome =
    restored.outcome;

  const cleanUrl = new URL(
    document.URL
  );
  cleanUrl.searchParams.delete(
    'combatReturn'
  );
  window.history.replaceState(
    null,
    '',
    cleanUrl.href
  );
}

const camera = { x: 0, y: 0 };
const keys = new Set();
const touchInput = createVirtualStick(joystick, stick);
const traversalRegistry = createTraversalRuleRegistry(
  traversalRulePackV1
);

const captureCreatureCatalog =
  createCaptureCreatureCatalogProvider(
    CAPTURE_CREATURE_CATALOG_PREVIEW_V1
  );

const activeCapturePartyRef =
  resolveActiveCapturePartyRefV1(
    CAPTURE_SESSION_PREVIEW_V1
  );

const captureActorDefinitionProvider =
  await createCaptureActorPreviewProviderV1();

const encounterController = createEncounterController({
  checkDistance: encounterTest ? 80 : 160
});

const encounterRandom =
  encounterTest
    ? () => 0
    : Math.random;

let pendingEncounterSnapshot = null;

if (encounterPreviewContinue) {
  encounterPreviewContinue.hidden =
    !encounterTest;
}

const livingWorldConfig = demoLivingWorldConfig;
let wildCreatures = createInitialWildlife(
  livingWorldConfig,
  {
    worldDocument: activeWorldDocument,
    resolveActorDefinition: resolveDemoLivingActorDefinition,
    seed: `${activeWorldDocument.id}:wildlife:v1`,
    activationCount: 3,
    traversalRegistry
  }
);

const wildWanderController = createWildWanderController(
  livingWorldConfig,
  {
    worldDocument: activeWorldDocument,
    resolveActorDefinition: resolveDemoLivingActorDefinition,
    seed: `${activeWorldDocument.id}:wander:v1`,
    traversalRegistry
  }
);

const materialRegistry = createMaterialRegistry(materialPackV1);
const textureLoader = createMaterialTextureLoader({
  resolveAsset: resolveMaterialAsset
});
textureLoader.load(collectMaterialAssetIds(materialRegistry.list()));
const surfaceRenderer = createSurfaceRenderer({
  materialRegistry,
  textureLoader
});

const worldObjectImageLoader = createImageAssetLoader({
  resolveAsset: resolveWorldObjectAsset,
  cacheRevision: 'worldarea-portal-v1-2026-10-02'
});

const requiredWorldObjectAssetIds = Object.freeze([
  ...new Set(
    activeWorldDocument.areas
      .flatMap((area) => area.objects)
      .map((object) => object.visual?.assetId)
      .filter(Boolean)
  )
]);

const worldObjectAssetStatus = await worldObjectImageLoader.load(
  requiredWorldObjectAssetIds
);

if (
  worldObjectAssetStatus.ready !== requiredWorldObjectAssetIds.length ||
  worldObjectAssetStatus.missing > 0 ||
  worldObjectAssetStatus.errors > 0
) {
  coords.textContent =
    'Erreur asset WorldObject — voir console';
  throw new Error(
    `WorldObject assets unavailable: ${JSON.stringify(worldObjectAssetStatus)}`
  );
}

const worldObjectRenderer = createWorldObjectRenderer({
  imageLoader: worldObjectImageLoader,
  resolveVisualAsset: resolveWorldObjectAsset
});

const captureMapActorAssets =
  captureActorDefinitionProvider
    .listAssets();

const resolveRuntimeMapActorAsset =
  createMapActorAssetResolver(
    captureMapActorAssets
  );

const mapActorImageLoader =
  createImageAssetLoader({
    resolveAsset:
      resolveRuntimeMapActorAsset,
    cacheRevision:
      'actor-placement-catalog-v1-2026-10-03'
  });

const placedActorAssetIds =
  activeWorldDocument.areas
    .flatMap(
      (area) =>
        area.actors ?? []
    )
    .map((placement) =>
      captureActorDefinitionProvider
        .resolveDefinition(
          placement.actorDefinitionId
        )
        ?.mapVisual?.assetId
    )
    .filter(Boolean);

const requiredMapActorAssetIds =
  Object.freeze([
    ...new Set([
      player.mapVisual.assetId,
      ...collectLivingMapActorAssetIds(
        livingWorldConfig,
        resolveDemoLivingActorDefinition
      ),
      ...placedActorAssetIds
    ])
  ]);

const mapActorAssetStatus = await mapActorImageLoader.load(
  requiredMapActorAssetIds
);

if (
  mapActorAssetStatus.ready !== requiredMapActorAssetIds.length ||
  mapActorAssetStatus.missing > 0 ||
  mapActorAssetStatus.errors > 0
) {
  coords.textContent =
    'Erreur asset Map Actor — voir console';
  throw new Error(
    `Map Actor assets unavailable: ${JSON.stringify(mapActorAssetStatus)}`
  );
}

const mapActorVisualPreparer = createMapActorVisualPreparer({
  imageLoader: mapActorImageLoader
});
const mapActorPreparationStatus = mapActorVisualPreparer.prepare(
  requiredMapActorAssetIds
);

if (
  mapActorPreparationStatus.ready !== requiredMapActorAssetIds.length ||
  mapActorPreparationStatus.errors > 0
) {
  coords.textContent =
    'Erreur préparation Map Actor — voir console';
  throw new Error(
    `Map Actor preparation failed: ${JSON.stringify(mapActorPreparationStatus)}`
  );
}

const mapActorRenderer = createMapActorRenderer({
  preparedVisuals: mapActorVisualPreparer
});
const portalRenderer = createPortalRenderer();
let last = performance.now();

function currentArea() {
  const area = findWorldAreaById(
    activeWorldDocument,
    player.currentAreaId
  );

  if (!area) {
    throw new Error(
      `Unknown current WorldArea: ${player.currentAreaId}`
    );
  }

  return area;
}

function showEncounterPreview(snapshot) {
  pendingEncounterSnapshot = snapshot;

  const creatureId =
    snapshot.opponents[0]?.creatureId ?? '';
  const creature =
    captureCreatureCatalog.resolveCreature(creatureId);

  encounterPreviewSummary.textContent =
    `${creature?.name ?? creatureId} · élément ${snapshot.context.elementId} · famille ${snapshot.context.terrainFamilyId}`;

  encounterPreview.hidden = false;
}

function launchPendingEncounterCombat() {
  return launchCombatHandoffNavigation({
    snapshot: pendingEncounterSnapshot,
    player,
    storage: window.sessionStorage,
    documentUrl: document.URL
  });
}

function clearEncounterPreview() {
  if (!pendingEncounterSnapshot) return false;

  const released = encounterController.release(
    pendingEncounterSnapshot.encounterId
  );

  if (!released) return false;

  pendingEncounterSnapshot = null;
  encounterPreview.hidden = true;
  encounterPreviewSummary.textContent = '';
  return true;
}

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function keyboardVector() {
  let x = 0;
  let y = 0;
  if (keys.has('arrowleft') || keys.has('q') || keys.has('a')) x -= 1;
  if (keys.has('arrowright') || keys.has('d')) x += 1;
  if (keys.has('arrowup') || keys.has('z') || keys.has('w')) y -= 1;
  if (keys.has('arrowdown') || keys.has('s')) y += 1;
  return normalize(x, y);
}

function currentInput() {
  if (Math.hypot(touchInput.x, touchInput.y) > config.input.deadzone) {
    return touchInput;
  }
  return keyboardVector();
}

function updateCamera() {
  const area = currentArea();

  camera.x = Math.max(
    0,
    Math.min(
      Math.max(0, area.width - innerWidth),
      player.x - innerWidth / 2
    )
  );
  camera.y = Math.max(
    0,
    Math.min(
      Math.max(0, area.height - innerHeight),
      player.y - innerHeight / 2
    )
  );
}

function applyTriggeredPortal() {
  const portal = findTriggeredPortal(
    activeWorldDocument,
    player.currentAreaId,
    player
  );

  if (!portal) return false;

  const next = applyPortalTransition(
    activeWorldDocument,
    player,
    portal
  );

  if (!next) return false;

  player.currentAreaId = next.currentAreaId;
  player.x = next.x;
  player.y = next.y;
  player.viaPortalId = next.viaPortalId;
  return true;
}

function update(dt) {
  const area = currentArea();
  const input = currentInput();

  if (pendingEncounterSnapshot) {
    player.moving = false;
    updateCamera();
    return;
  }

  player.moving =
    Math.hypot(input.x, input.y) > config.input.deadzone;

  if (Math.abs(input.x) > 0.05) {
    player.facingX = input.x < 0 ? -1 : 1;
  }

  stepMovement(
    area,
    player,
    input,
    dt,
    config.movement,
    traversalRegistry
  );

  applyTriggeredPortal();

  const encounterIntent = encounterController.step({
    area: currentArea(),
    player,
    encounterConfig: activeWorldDocument.encounterConfig,
    captureCatalog: captureCreatureCatalog,
    playerPartyRef: activeCapturePartyRef,
    rulesetId: 'capture.standard.1v1',
    random: encounterRandom
  });

  if (encounterIntent) {
    player.moving = false;
    showEncounterPreview(
      snapshotFromEncounterIntent(encounterIntent)
    );
    updateCamera();
    return;
  }

  wildCreatures = wildWanderController.step(
    wildCreatures,
    dt
  );

  updateCamera();

  const traversal = resolveSurfaceTraversal(
    currentArea(),
    player,
    player.x,
    player.y,
    traversalRegistry
  );

  const activeWildCount = wildCreatures.filter(
    (entity) => entity.areaId === player.currentAreaId
  ).length;

  coords.textContent =
    `${player.currentAreaId} · x: ${player.x.toFixed(1)} y: ${player.y.toFixed(1)} · ${traversal.ruleId} ×${traversal.speedMultiplier.toFixed(2)} · sauvages: ${activeWildCount}` +
    (
      lastCombatOutcome
        ? ` · combat: ${lastCombatOutcome}`
        : ''
    );
}

function drawGround() {
  const area = currentArea();

  surfaceRenderer.draw(ctx, {
    camera,
    viewport: {
      width: innerWidth,
      height: innerHeight
    },
    surface: area.surface
  });
}

function drawObstacle(obstacle) {
  const x = obstacle.x - camera.x;
  const y = obstacle.y - camera.y;

  if (
    x + obstacle.w < 0 ||
    y + obstacle.h < 0 ||
    x > innerWidth ||
    y > innerHeight
  ) {
    return;
  }

  if (obstacle.kind === 'river') return;

  if (obstacle.kind === 'rock') {
    ctx.fillStyle = '#666b62';
  } else if (obstacle.kind === 'furniture') {
    ctx.fillStyle = '#6f4d32';
  } else {
    ctx.fillStyle = '#244d2a';
  }

  ctx.fillRect(x, y, obstacle.w, obstacle.h);
}

function setLocomotionMode(mode) {
  if (mode === 'swim') {
    player.locomotion = { modes: ['ground', 'swim'] };
  } else if (mode === 'fly') {
    player.locomotion = { modes: ['fly'] };
  } else {
    player.locomotion = { modes: ['ground'] };
  }

  for (const button of locomotionButtons) {
    button.classList.toggle(
      'active',
      button.dataset.locomotion === mode
    );
  }
}

function currentWildMapActors() {
  return wildCreatures
    .filter(
      (entity) => entity.areaId === player.currentAreaId
    )
    .map((entity) =>
      createWildMapActorView(
        entity,
        resolveDemoLivingActorDefinition
      )
    )
    .filter(Boolean);
}

function currentPlacedMapActors() {
  return (
    currentArea()?.actors ?? []
  )
    .map((placement) =>
      createPlacedMapActorView(
        placement,
        captureActorDefinitionProvider
          .resolveDefinition
      )
    )
    .filter(Boolean);
}

function render(timeSeconds = 0) {
  const area = currentArea();
  const wildMapActors = currentWildMapActors();
  const placedMapActors =
    currentPlacedMapActors();

  ctx.clearRect(0, 0, innerWidth, innerHeight);
  drawGround();

  area.obstacles.forEach(drawObstacle);

  worldObjectRenderer.draw(ctx, {
    camera,
    viewport: {
      width: innerWidth,
      height: innerHeight
    },
    objects: area.objects
  });

  portalRenderer.draw(ctx, {
    camera,
    worldDocument: activeWorldDocument,
    currentAreaId: player.currentAreaId
  });

  mapActorRenderer.draw(ctx, {
    camera,
    actors: [
      ...placedMapActors,
      ...wildMapActors,
      player
    ],
    timeSeconds
  });
}

function frame(now) {
  const dt = Math.min(
    (now - last) / 1000,
    config.simulation.maxDeltaSeconds
  );
  last = now;
  update(dt);
  render(now / 1000);
  requestAnimationFrame(frame);
}

addEventListener('resize', resize);
addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

for (const button of locomotionButtons) {
  button.addEventListener('click', () => {
    setLocomotionMode(button.dataset.locomotion);
  });
}

encounterPreviewCombat.addEventListener(
  'click',
  launchPendingEncounterCombat
);

encounterPreviewContinue.addEventListener(
  'click',
  clearEncounterPreview
);

setLocomotionMode('ground');
resize();
updateCamera();
requestAnimationFrame(frame);
