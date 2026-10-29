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
    const timeout = setTimeout(() => fail(Error('Chromium DevTools port timeout: ' + stderr.slice(-1000))), 45000);
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
      const initial = nature.checked;
      const inputs = [...document.querySelectorAll('#family-encounter-elements input[data-element-id]')];
      for (const input of inputs) {
        input.checked = false;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
      const click = new MouseEvent('click', {bubbles:true, cancelable:true});
      const navigationAllowed = document.querySelector('#test-exploration').dispatchEvent(click);
      const status = document.querySelector('#builder-status')?.textContent ?? '';
      const allUnselected = [...document.querySelectorAll('#family-encounter-elements input[data-element-id]')].every(i => !i.checked);
      const selected = document.querySelector('#family-encounter-family')?.value ?? '';
      const active = document.querySelector('[data-panel="terrain"]')?.classList.contains('active');
      const advancedOpen = document.querySelector('.terrain-advanced')?.open;
      const editorVisible = Boolean(document.querySelector('.terrain-encounter-panel')?.getClientRects().length);
      return {
        ready:true, initial, status, allUnselected, selected, active, advancedOpen, editorVisible, navigationAllowed,
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
    result.initial !== true || result.navigationAllowed ||
    !result.status.includes('Forêt') || !result.status.includes('coche au moins un élément') ||
    !result.allUnselected ||
    result.selected !== 'forest' || !result.active ||
    !result.advancedOpen || !result.editorVisible ||
    result.path !== '/builder.html'
  ) {
    throw Error('Builder validation/navigation assertion failed: ' + JSON.stringify(result));
  }
  console.log('GREEN real Chromium Builder invalid encounters -> correct family editor');

  // Configure from the actual checkbox UI: one encounter probability,
  // checkbox for Earth only. No element percentages or select-all hacks.
  const setupResponse = await evaluate(`(() => {
    const chance = document.querySelector('#family-encounter-chance');
    chance.value = '100';
    chance.dispatchEvent(new Event('input', {bubbles:true}));
    const earth = document.querySelector('#family-encounter-elements input[data-element-id="earth"]');
    if (!earth) return {ready:false};
    earth.checked = true;
    earth.dispatchEvent(new Event('change', {bubbles:true}));
    const inputs = [...document.querySelectorAll('#family-encounter-elements input[data-element-id]')];
    return {
      ready:true, chance:chance.value,
      values:inputs.map(i=>({id:i.dataset.elementId, checked:i.checked})),
      status:document.querySelector('#builder-status')?.textContent
    };
  })()`);
  if (setupResponse.error || setupResponse.result?.exceptionDetails)
    throw Error('Browser element selection failed: ' + JSON.stringify(setupResponse));
  const setup=setupResponse.result?.result?.value;
  console.log('Checkbox element selection: '+JSON.stringify(setup));
  if (!setup?.ready || setup.chance!=='100' || setup.status!=='WorldDocument valide' ||
      !setup.values.some(x=>x.id==='earth' && x.checked) ||
      setup.values.some(x=>x.id!=='earth' && x.checked))
    throw Error('Earth checkbox authoring not valid: '+JSON.stringify(setup));

  // Exercise the existing WorldArea encounter flag through the real Builder UI.
  // A valid 100% chance / 100% Earth profile must remain explicitly OFF if
  // the author disables encounters; turning it ON writes that same canonical field.
  const policyResponse = await evaluate(`(() => {
    const toggle = document.querySelector('#area-random-encounters-enabled');
    const status = document.querySelector('#area-random-encounters-status');
    if (!toggle || !status) return {ready:false};
    const initial = toggle.checked;
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change', { bubbles:true }));
    const disabled = JSON.parse(document.querySelector('#json-preview').value);
    const disabledFlag = disabled.areas.find(a => a.id === disabled.initialAreaId)?.encounters?.randomEnabled;
    const disabledWarning = status.textContent;
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change', { bubbles:true }));
    const enabled = JSON.parse(document.querySelector('#json-preview').value);
    const enabledFlag = enabled.areas.find(a => a.id === enabled.initialAreaId)?.encounters?.randomEnabled;
    return {
      ready:true, initial, disabledFlag, enabledFlag, disabledWarning,
      valid:document.querySelector('#builder-status')?.textContent === 'WorldDocument valide'
    };
  })()`);
  if (policyResponse.error || policyResponse.result?.exceptionDetails)
    throw Error('Browser Area encounter toggle failed: ' + JSON.stringify(policyResponse));
  const policy = policyResponse.result?.result?.value;
  console.log('Area encounter policy: ' + JSON.stringify(policy));
  if (!policy?.ready || !policy.initial || policy.disabledFlag !== false ||
      policy.enabledFlag !== true || !policy.disabledWarning.includes('DÉSACTIVÉES') ||
      !policy.valid)
    throw Error('Browser Area encounters did not honor the canonical WorldArea flag: ' + JSON.stringify(policy));
  console.log('GREEN real Chromium: explicit Area OFF and ON, unchanged family odds');

  const navResponse = await evaluate("document.querySelector('#test-exploration').click(); 'click-sent'");
  if (navResponse.error || navResponse.result?.exceptionDetails)
    throw Error('Builder test-click failed: ' + JSON.stringify(navResponse));
  let launched = null;
  for (let tries=0; tries<140; tries++) {
    const response = await evaluate(`(() => ({
      path:location.pathname,
      query:location.search,
      coords:document.querySelector('#coords')?.textContent ?? '',
      hasGame: Boolean(document.querySelector('#game')),
      hasError:document.querySelector('#builder-status')?.textContent ?? ''
    }))()`);
    launched = response.result?.result?.value;
    if (launched?.path === '/index.html' && launched.coords.includes(' · x: ')) break;
    await sleep(250);
  }
  console.log('Builder game handoff: ' + JSON.stringify(launched));
  if (launched?.path !== '/index.html' || !launched.query.includes('builderTest=1') ||
      !launched.hasGame || !launched.coords.includes(' · x: '))
    throw Error('Builder valid map did not start real Exploration game: ' + JSON.stringify(launched));
  console.log('GREEN real Chromium Builder valid Forest Earth-only -> Exploration game running');

  // End-to-end regression for the reported bug: start a genuinely blank
  // WorldArea in the real Builder, configure Forest / Earth, play, WALK,
  // and observe the actual native Encounter Controller showing the encounter.
  // No handoff storage seed, fake random result, or runtime monkey patch.
  const cdp = (method, params = {}) => new Promise(resolveResponse => {
    const id = ++sequence;
    pending.set(id, resolveResponse);
    socket.send(JSON.stringify({id, method, params}));
  });
  await cdp('Page.enable');
  socket.addEventListener('message', event => {
    const payload = JSON.parse(event.data);
    if (payload.method === 'Page.javascriptDialogOpening') {
      cdp('Page.handleJavaScriptDialog', {accept:true});
    }
  });
  await cdp('Page.navigate', {url});
  let blankBuilderReady = false;
  for (let tries=0; tries<120; tries++) {
    const response = await evaluate(`(() => ({
      ready:Boolean(document.querySelector('#family-encounter-elements input[type="checkbox"][data-element-id="earth"]') &&
        document.querySelector('#family-encounter-elements input[data-element-id="nature"]')),
      path:location.pathname
    }))()`);
    if (response.result?.result?.value?.ready) {blankBuilderReady=true;break;}
    await sleep(250);
  }
  if (!blankBuilderReady) throw Error('Blank-world regression: Builder did not reload');

  const blankClick = await evaluate("document.querySelector('#new-blank-world').click(); 'new-blank-requested'");
  if (blankClick.error || blankClick.result?.exceptionDetails)
    throw Error('Blank world click failed: ' + JSON.stringify(blankClick));

  let blankSelected = false;
  for (let tries=0; tries<50; tries++) {
    const res=await evaluate("document.querySelector('#area-select')?.value");
    if (res.result?.result?.value==='area-principale'){blankSelected=true;break;}
    await sleep(100);
  }
  if (!blankSelected) throw Error('Blank-world regression: new blank WorldArea not created');
  const blankSetupResponse = await evaluate(`(() => {
    const areaFamily = document.querySelector('#area-family');
    areaFamily.value = 'forest';
    areaFamily.dispatchEvent(new Event('change',{bubbles:true}));
    const family = document.querySelector('#family-encounter-family');
    family.value = 'forest';
    family.dispatchEvent(new Event('change',{bubbles:true}));
    const chance = document.querySelector('#family-encounter-chance');
    chance.value = '100';
    chance.dispatchEvent(new Event('input',{bubbles:true}));
    const checkboxes=[...document.querySelectorAll('#family-encounter-elements input[data-element-id]')];
    for (const input of checkboxes) {
      if (input.checked) {
        input.checked=false;
        input.dispatchEvent(new Event('change',{bubbles:true}));
      }
    }
    const shadow=checkboxes.find(i=>i.dataset.elementId==='shadow');
    shadow.checked=true;
    shadow.dispatchEvent(new Event('change',{bubbles:true}));
    const data = JSON.parse(document.querySelector('#json-preview').value);
    const area = data.areas.find(a=>a.id===data.initialAreaId);
    const p = data.encounterConfig.families.find(f=>f.terrainFamilyId==='forest');
    return {
      active:document.querySelector('#area-random-encounters-enabled').checked,
      flag:area?.encounters?.randomEnabled,
      base:area?.surface?.baseTerrainFamilyId,
      chance:p?.encounterChancePercent,
      elements:p?.elementChances?.map(e=>e.elementId),
      status:document.querySelector('#builder-status').textContent
    };
  })()`);
  if (blankSetupResponse.error || blankSetupResponse.result?.exceptionDetails)
    throw Error('Blank-world authoring failed: ' + JSON.stringify(blankSetupResponse));
  const blankSetup=blankSetupResponse.result?.result?.value;
  console.log('Real blank map encounter setup: '+JSON.stringify(blankSetup));
  if (!blankSetup?.active || blankSetup.flag!==true || blankSetup.base!=='forest' ||
      blankSetup.chance!==100 || blankSetup.elements?.length!==1 ||
      blankSetup.elements[0]!=='shadow' ||
      blankSetup.status!=='WorldDocument valide')
    throw Error('Blank-world settings did not reach canonical WorldDocument: '+JSON.stringify(blankSetup));

  await evaluate("document.querySelector('#test-exploration').click(); 'blank-play'");
  let blankGame=false;
  for (let tries=0; tries<140; tries++){
    const res=await evaluate(`(() => ({
      path:location.pathname,
      coords:document.querySelector('#coords')?.textContent ?? ''
    }))()`);
    if (res.result?.result?.value?.path==='/index.html' &&
        res.result.result.value.coords.includes(' · x: ')){
      blankGame=true;break;
    }
    await sleep(250);
  }
  if (!blankGame) throw Error('Blank-world game did not start after handoff');
  const key={key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39,nativeVirtualKeyCode:39};
  await cdp('Input.dispatchKeyEvent',{type:'keyDown',...key});
  await sleep(2000);
  await cdp('Input.dispatchKeyEvent',{type:'keyUp',...key});
  const seen=await evaluate(`(() => ({
    path:location.pathname,
    encountered:document.querySelector('#encounter-preview')?.hidden===false,
    summary:document.querySelector('#encounter-preview-summary')?.textContent ?? '',
    coords:document.querySelector('#coords')?.textContent ?? ''
  }))()`);
  if (seen.error || seen.result?.exceptionDetails)
    throw Error('Blank-world Encounter DOM probe failed: ' + JSON.stringify(seen));
  const realEncounter=seen.result?.result?.value;
  console.log('Real blank-world walking Encounter: '+JSON.stringify(realEncounter));
  if (!realEncounter?.encountered || !realEncounter.summary.includes('shadow'))
    throw Error('Real blank Forest Shadow 100% map did not encounter after walking: '+JSON.stringify(realEncounter));
  console.log('GREEN real Chromium blank map -> movement -> native Shadow Encounter visible');

  // Seamless immersion gate: the real movement-triggered Encounter must
  // open Combat INSIDE the same Explorer page, not navigate a new document.
  // The existing owner completes the genuine versioned handoff and signals
  // its same-origin parent. The test does not forge a battle victory.
  for (let round = 1; round <= 2; round++) {
    const launch = await evaluate("document.querySelector('#encounter-preview-combat').click(); 'native-combat-launch'");
    if (launch.error || launch.result?.exceptionDetails)
      throw Error('Overlay launch failed: ' + JSON.stringify(launch));

    let active;
    for (let tries = 0; tries < 150; tries++) {
      const res = await evaluate(`(() => {
        const frame = document.querySelector('.combat-overlay__frame');
        const doc = frame?.contentDocument;
        return {
          parentPath: location.pathname,
          framePresent: !!frame,
          framePath: frame?.contentWindow?.location?.pathname ?? '',
          loaded: doc?.querySelector('[data-bridge-status]')?.textContent ?? '',
          buttons: doc?.querySelectorAll('[data-combat-skill]')?.length ?? 0,
          fullscreenButtonHidden: doc?.querySelector('[data-encounter-fullscreen]')?.hidden ?? false,
          overlayWidth: document.querySelector('.combat-overlay')?.getBoundingClientRect().width ?? 0,
          viewportWidth: innerWidth
        };
      })()`);
      if (res.error || res.result?.exceptionDetails)
        throw Error('Overlay DOM evaluation failed: ' + JSON.stringify(res));
      active = res.result?.result?.value;
      if (active?.loaded.includes('Combat réel') && active.buttons > 0) break;
      await sleep(250);
    }
    console.log('Immersive Encounter round ' + round + ': ' + JSON.stringify(active));
    if (active?.parentPath !== '/index.html' || !active?.framePresent ||
        !active.framePath.endsWith('/exploration-encounter.html') ||
        !active.loaded.includes('Combat réel') || active.buttons < 1 ||
        !active.fullscreenButtonHidden ||
        active.overlayWidth < active.viewportWidth - 2) {
      throw Error('Real Combat failed to open full-viewport in the same Explorer page: '+JSON.stringify(active));
    }

    // Drive actual native Combat buttons until the official Combat Session
    // resolves a KO. Do not inject a CombatResult or forge a postMessage.
    let fought;
    for (let attempt = 0; attempt < 80; attempt++) {
      const res = await evaluate(`(() => {
        const overlay=document.querySelector('.combat-overlay__frame');
        if(!overlay)return {finished:true, pressed:0, actions:[]};
        const doc=overlay.contentDocument;
        const all=[...(doc?.querySelectorAll('[data-combat-skill]')??[])];
        const usable=all.filter(button=>!button.disabled&&!button.hidden);
        if(usable[0])usable[0].click();
        return {
          finished:false,pressed:usable.length>0?1:0,
          actions:usable.slice(0,3).map(button=>button.dataset.combatSkill),
          skillStates:all.map(b=>({id:b.dataset.combatSkill,disabled:b.disabled,title:b.title})),
          energy:doc?.querySelector('[data-combat-energy-value="local-1"]')?.textContent??'',
          status:doc?.querySelector('[data-combat-live-status]')?.textContent??'',
          loading:doc?.querySelector('[data-bridge-status]')?.textContent??'',
          error:doc?.documentElement.dataset.encounterBootstrapError??''
        };
      })()`);
      if (res.error || res.result?.exceptionDetails)
        throw Error('Native Combat gameplay action failed: '+JSON.stringify(res));
      fought=res.result?.result?.value;
      if (fought?.finished) break;
      await sleep(450);
    }
    if (!fought?.finished)
      throw Error('Real Combat Session never resolved KO/return: '+JSON.stringify(fought));
    let restored;
    for (let tries=0; tries<80; tries++) {
      const res = await evaluate(`(()=>({
        parentPath:location.pathname,
        overlayAbsent:!document.querySelector('.combat-overlay'),
        previewHidden:document.querySelector('#encounter-preview')?.hidden,
        info:document.querySelector('#coords')?.textContent ?? '',
        stillStored:!!sessionStorage.getItem('gensrpg.capture.combat-handoff.v1')
      }))()`);
      restored=res.result?.result?.value;
      if (restored?.overlayAbsent && restored?.previewHidden && /combat: (victory|defeat)/.test(restored.info)) break;
      await sleep(100);
    }
    console.log('Immersive Encounter return ' + round + ': '+JSON.stringify(restored));
    if (restored?.parentPath !== '/index.html' || !restored.overlayAbsent ||
        !restored.previewHidden || restored.stillStored ||
        !/combat: (victory|defeat)/.test(restored.info))
      throw Error('Combat return did not restore original Explorer document: '+JSON.stringify(restored));

    if (round === 1) {
      // Release resets the Encounter's travel distance; walking again
      // must trigger an independent second Encounter in this same document.
      const nextKey={key:'ArrowLeft',code:'ArrowLeft',windowsVirtualKeyCode:37,nativeVirtualKeyCode:37};
      await cdp('Input.dispatchKeyEvent',{type:'keyDown',...nextKey});
      await sleep(2200);
      await cdp('Input.dispatchKeyEvent',{type:'keyUp',...nextKey});
      let second=false;
      for (let tries=0; tries<50; tries++) {
        const res=await evaluate("document.querySelector('#encounter-preview')?.hidden===false");
        if (res.result?.result?.value===true) {second=true;break;}
        await sleep(100);
      }
      if (!second) throw Error('Second real Encounter did not trigger after in-place return');
    }
  }
  console.log('GREEN real Chromium: two full-viewport Combat encounters without Explorer navigation');

} finally {
  socket?.close();
  if (chrome && chrome.exitCode === null && chrome.signalCode === null) {
    const exited = once(chrome, 'exit');
    chrome.kill('SIGKILL');
    await exited;
  }
  server.close();
  // Wait until Chromium has released its profile instead of racing rmdir.
  await rm(profile, {recursive:true, force:true, maxRetries:5, retryDelay:100});
}
