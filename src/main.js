import { normalize } from './core/vector.js';
import { stepMovement } from './core/movement.js';
import { normalizeExplorationConfig } from './core/config.js';
import { createVirtualStick } from './input/virtual-stick.js';
import { createSurfaceRenderer } from './render/surface-renderer.js';
import { createWorldObjectRenderer } from './render/world-object-renderer.js?rev=worldarea-portal-v1';
import { materialPackV1 } from './materials/material-pack-v1.js';
import { createMaterialRegistry } from './materials/material-registry.js';
import { resolveMaterialAsset } from './assets/material-asset-adapter.js';
import {
  resolveWorldObjectAsset
} from './assets/world-object-asset-adapter.js?rev=worldarea-portal-v1';
import {
  createImageAssetLoader
} from './assets/image-asset-loader.js?rev=worldarea-portal-v1';
import {
  collectMaterialAssetIds,
  createMaterialTextureLoader
} from './render/material-texture-loader.js';
import {
  createInitialExplorationState,
  findWorldAreaById
} from './world/world-document-model.js';
import {
  applyPortalTransition,
  findTriggeredPortal
} from './world/portal-model.js';
import { demoWorldDocument } from './world/demo-world.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const coords = document.querySelector('#coords');
const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');

const config = normalizeExplorationConfig();
const initialState = createInitialExplorationState(demoWorldDocument);

if (!initialState) {
  throw new Error('WorldDocument has no valid initial Area/Spawn');
}

const player = {
  currentAreaId: initialState.currentAreaId,
  x: initialState.x,
  y: initialState.y,
  radius: config.player.radius,
  viaPortalId: null
};

const camera = { x: 0, y: 0 };
const keys = new Set();
const touchInput = createVirtualStick(joystick, stick);
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
    demoWorldDocument.areas
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
let last = performance.now();

function currentArea() {
  const area = findWorldAreaById(
    demoWorldDocument,
    player.currentAreaId
  );

  if (!area) {
    throw new Error(
      `Unknown current WorldArea: ${player.currentAreaId}`
    );
  }

  return area;
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
    demoWorldDocument,
    player.currentAreaId,
    player
  );

  if (!portal) return false;

  const next = applyPortalTransition(
    demoWorldDocument,
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

  stepMovement(
    area,
    player,
    currentInput(),
    dt,
    config.movement
  );

  applyTriggeredPortal();
  updateCamera();

  coords.textContent =
    `${player.currentAreaId} · x: ${player.x.toFixed(1)}  y: ${player.y.toFixed(1)}`;
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

function render() {
  const area = currentArea();

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

  ctx.beginPath();
  ctx.arc(
    player.x - camera.x,
    player.y - camera.y,
    player.radius,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = '#f1d36a';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2a2516';
  ctx.stroke();
}

function frame(now) {
  const dt = Math.min(
    (now - last) / 1000,
    config.simulation.maxDeltaSeconds
  );
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

addEventListener('resize', resize);
addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

resize();
updateCamera();
requestAnimationFrame(frame);
