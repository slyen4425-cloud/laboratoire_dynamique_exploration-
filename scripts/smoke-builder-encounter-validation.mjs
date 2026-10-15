// Browser smoke exercises actual Builder authoring + blocked test click.
// No synthetic document state and no second validation authority.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';

const root = process.cwd();
const mime = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript',
  '.css': 'text/css', '.json': 'application/json',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml'
};
const injectedProbe = `<script>
  window.addEventListener('unhandledrejection', event => { document.documentElement.dataset.builderProbeJsError = String(event.reason?.message || event.reason); });
  window.addEventListener('error', event => {
    document.documentElement.dataset.builderProbeJsError = event.message;
  });
  window.addEventListener('DOMContentLoaded', () => {
    let retries = 0;
    const timer = setInterval(() => {
      if (++retries > 450) {
        clearInterval(timer);
        document.documentElement.dataset.builderValidationSmoke = 'timeout';
        return;
      }
      const nature = document.querySelector('#family-encounter-elements input[data-element-id="nature"]');
      if (!nature || nature.value !== '50') return;
      clearInterval(timer);
      try {
        nature.value = '40';
        nature.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('#test-exploration').click();
        const status = document.querySelector('#builder-status')?.textContent ?? '';
        const total = document.querySelector('#family-encounter-total')?.value ?? '';
        const selected = document.querySelector('#family-encounter-family')?.value;
        const active = document.querySelector('[data-panel="terrain"]')?.classList.contains('active');
        const good = status.includes('Forêt') && status.includes('90 %') &&
          status.includes('100 %') && total === '90 %' &&
          selected === 'forest' && active && location.pathname.endsWith('/builder.html');
        document.documentElement.dataset.builderValidationSmoke =
          good ? 'ok' : 'bad-status-'+status+'-total-'+total+'-active-'+active;
      } catch (error) {
        document.documentElement.dataset.builderValidationSmoke = 'error-'+error.message;
      }
    }, 100);
  });
  </script>`;
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const path = resolve(root, '.' + pathname);
    if (!path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    let data = await readFile(path);
    if (pathname === '/builder.html') {
      data = Buffer.from(data.toString('utf8').replace('</head>', injectedProbe + '</head>'));
    }
    res.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    }).end(data);
  } catch (error) { console.error('BROWSER-SERVER-404', req.url, error.message); res.writeHead(404).end('missing'); }
});
await new Promise((done, fail) => {
  server.once('error', fail);
  server.listen(0, '127.0.0.1', done);
});
function findChrome() {
  for (const bin of [process.env.CHROME_PATH, 'google-chrome', 'chromium', 'chromium-browser']) {
    if (bin && spawnSync('which', [bin]).status === 0) return bin;
  }
  throw Error('Chromium unavailable');
}
try {
  const url = 'http://127.0.0.1:' + server.address().port + '/builder.html';
  const child = spawn(findChrome(), [
    '--headless=new', '--no-sandbox', '--disable-gpu',
    '--disable-dev-shm-usage', '--no-first-run', '--disable-extensions',
    '--virtual-time-budget=45000', '--dump-dom', url
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  const stdout = [], stderr = [];
  child.stdout.on('data', c => stdout.push(c));
  child.stderr.on('data', c => stderr.push(c));
  const timeout = setTimeout(() => child.kill('SIGKILL'), 85000);
  let code;
  try { [code] = await once(child, 'close'); }
  finally { clearTimeout(timeout); }
  if (code !== 0) throw Error('Chromium exit=' + code + ' ' + Buffer.concat(stderr).toString().slice(-800));
  const dom = Buffer.concat(stdout).toString();
  const result = dom.match(/data-builder-validation-smoke="([^"]+)"/)?.[1] ?? 'missing';
  const jsError = dom.match(/data-builder-probe-js-error="([^"]+)"/)?.[1] ?? '';
  const status = dom.match(/id="builder-status"[^>]*>([^<]*)/)?.[1] ?? 'not found';
  const natureCount = [...dom.matchAll(/class="family-element-row"/g)].length;
  const jsFiles = [...dom.matchAll(/<script[^>]+src="([^"]+)"/g)].map(x=>x[1]);
  console.log(JSON.stringify({result, jsError, status, natureCount, jsFiles}));
  if (jsError || result !== 'ok') throw Error('Builder browser validation failed: ' + result + ' ' + jsError);
  console.log('GREEN real Chromium Builder invalid encounters -> correct family editor');
} finally {
  server.close();
}
