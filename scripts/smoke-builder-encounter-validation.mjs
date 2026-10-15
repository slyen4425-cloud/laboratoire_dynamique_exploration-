// Exercise actual Builder interactions in Chromium over CDP and real time.
// WorldDocument rules remain in the Builder; this is a browser-only gate.
import { createServer } from 'node:http';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

const root = process.cwd();
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml'
};
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + pathname);
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    const data = await readFile(path);
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }).end(data);
  } catch (error) { res.writeHead(404).end('missing'); }
});

function browserBinary() {
  for (const bin of [process.env.CHROME_PATH, 'google-chrome', 'chromium', 'chromium-browser']) {
    if (bin && spawnSync('which', [bin]).status === 0) return bin;
  }
  throw Error('Chromium unavailable');
}

const sleep = (ms) => new Promise((ok) => setTimeout(ok, ms));
await new Promise((done, fail) => {
  server.once('error', fail);
  server.listen(0, '127.0.0.1', done);
});
const profile = await mkdtemp(resolve(tmpdir(), 'builder-chrome-'));
let chrome;
let socket;
try {
  const url = 'http://127.0.0.1:' + server.address().port + '/builder.html';
  chrome = spawn(browserBinary(), [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, url
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const port = await new Promise((done, fail) => {
    let stderr = '';
    const timeout = setTimeout(() => fail(Error('Chromium DevTools port timeout: ' + stderr.slice(-1000))), 20000);
    chrome.stderr.on('data', chunk => {
      stderr += chunk.toString();
      const match = /DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//.exec(stderr);
      if (match) {
        clearTimeout(timeout);
        done(Number(match[1]));
      }
    });
    chrome.once('error', fail);
    chrome.once('exit', code => fail(Error('Chromium exited ' + code + ': ' + stderr.slice(-1000))));
  });
  let target;
  for (let i = 0; i < 30; i++) {
    const pages = await (await fetch('http://127.0.0.1:' + port + '/json')).json();
    target = pages.find((p) => p.type === 'page' && p.url.includes('/builder.html'));
    if (target) break;
    await sleep(200);
  }
  if (!target) throw Error('Builder tab not available in Chromium');
  socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((ok, fail) => {
    socket.addEventListener('open', ok, { once: true });
    socket.addEventListener('error', fail, { once: true });
  });
  let sequence = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const payload = JSON.parse(event.data);
    const waiter = pending.get(payload.id);
    if (!waiter) return;
    pending.delete(payload.id);
    waiter(payload);
  });
  const evaluate = (expression) => new Promise(resolveResponse => {
    const id = ++sequence;
    pending.set(id, resolveResponse);
    socket.send(JSON.stringify({
      id, method: 'Runtime.evaluate',
      params: { expression, returnByValue: true, awaitPromise: true }
    }));
  });
  let result;
  for (let tries = 0; tries < 120; tries++) {
    const response = await evaluate(`(() => {
      const nature = document.querySelector('#family-encounter-elements input[data-element-id="nature"]');
      if (!nature) return {ready:false, status:document.querySelector('#builder-status')?.textContent ?? 'missing'};
      const initial = nature.value;
      nature.value = '40';
      nature.dispatchEvent(new Event('input', {bubbles:true}));
      const click = new MouseEvent('click', {bubbles:true, cancelable:true});
      const navigationAllowed = document.querySelector('#test-exploration').dispatchEvent(click);
      const status = document.querySelector('#builder-status')?.textContent ?? '';
      const total = document.querySelector('#family-encounter-total')?.value ?? '';
      const selected = document.querySelector('#family-encounter-family')?.value ?? '';
      const active = document.querySelector('[data-panel="terrain"]')?.classList.contains('active');
      return {
        ready:true, initial, status, total, selected, active, navigationAllowed,
        path:location.pathname
      };
    })()`);
    if (response.error || response.result?.exceptionDetails) {
      throw Error('Browser evaluation failed: ' + JSON.stringify(response));
    }
    result = response.result?.result?.value;
    if (result?.ready) break;
    await sleep(250);
  }
  console.log(JSON.stringify(result));
  if (!result?.ready) throw Error('Builder did not initialize: ' + JSON.stringify(result));
  if (
    result.initial !== '50' || result.navigationAllowed ||
    !result.status.includes('Forêt') || !result.status.includes('90 %') ||
    !result.status.includes('100 %') || result.total !== '90 %' ||
    result.selected !== 'forest' || !result.active ||
    result.path !== '/builder.html'
  ) {
    throw Error('Builder validation/navigation assertion failed: ' + JSON.stringify(result));
  }
  console.log('GREEN real Chromium Builder invalid encounters -> correct family editor');
} finally {
  socket?.close();
  chrome?.kill('SIGKILL');
  server.close();
  await rm(profile, {recursive:true, force:true});
}
