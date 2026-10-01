import { normalize } from './core/vector.js';
import { stepMovement } from './core/movement.js';
import { normalizeExplorationConfig } from './core/config.js';
import { createVirtualStick } from './input/virtual-stick.js';
import { demoWorld as world } from './world/demo-world.js';

const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const coords = document.querySelector('#coords');
const joystick = document.querySelector('#joystick');
const stick = document.querySelector('#stick');

const config = normalizeExplorationConfig();
const player = { x: 220, y: 220, radius: config.player.radius };
const camera = { x: 0, y: 0 };
const keys = new Set();
const touchInput = createVirtualStick(joystick, stick);
let last = performance.now();

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
  camera.x = Math.max(
    0,
    Math.min(Math.max(0, world.width - innerWidth), player.x - innerWidth / 2)
  );
  camera.y = Math.max(
    0,
    Math.min(Math.max(0, world.height - innerHeight), player.y - innerHeight / 2)
  );
}

function update(dt) {
  stepMovement(world, player, currentInput(), dt, config.movement);
  updateCamera();
  coords.textContent = `x: ${player.x.toFixed(1)}  y: ${player.y.toFixed(1)}`;
}

function drawGround() {
  ctx.fillStyle = '#426f3a';
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  for (let x = 0; x < world.width; x += 160) {
    for (let y = 0; y < world.height; y += 160) {
      const screenX = x - camera.x;
      const screenY = y - camera.y;
      if (
        screenX < -160 ||
        screenY < -160 ||
        screenX > innerWidth ||
        screenY > innerHeight
      ) {
        continue;
      }

      ctx.fillStyle =
        (x / 160 + y / 160) % 2 === 0
          ? 'rgba(255,255,255,.015)'
          : 'rgba(0,0,0,.015)';
      ctx.fillRect(screenX, screenY, 160, 160);
    }
  }
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

  if (obstacle.kind === 'river') ctx.fillStyle = '#397aa3';
  else if (obstacle.kind === 'rock') ctx.fillStyle = '#666b62';
  else ctx.fillStyle = '#244d2a';

  ctx.fillRect(x, y, obstacle.w, obstacle.h);
}

function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  drawGround();

  ctx.fillStyle = '#b58a54';
  ctx.fillRect(-camera.x, 610 - camera.y, world.width, 92);

  world.obstacles.forEach(drawObstacle);

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
  const dt = Math.min((now - last) / 1000, config.simulation.maxDeltaSeconds);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

addEventListener('resize', resize);
addEventListener('keydown', (event) => keys.add(event.key.toLowerCase()));
addEventListener('keyup', (event) => keys.delete(event.key.toLowerCase()));

resize();
requestAnimationFrame(frame);
