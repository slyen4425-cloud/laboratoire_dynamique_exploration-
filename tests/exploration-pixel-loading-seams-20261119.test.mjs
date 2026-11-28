import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('official CSS arena image decoded before native Combat READY postMessage',()=>{
 const code=read('integration/combat-bridge/exploration-encounter.js');
 const mounted=code.indexOf('mountedCombat=await mountCoop2v2Test(');
 const decoded=code.indexOf('await waitForNativeCombatArenaArtV1(nativeArenaPresentation)');
 const ready=code.indexOf("type:'gensrpg.capture.combat-ready.v1'",decoded);
 assert.ok(decoded>0&&mounted>decoded&&ready>mounted,'arena must decode before battle Session mounts');
 assert.match(code,/asset\.onerror=\(\)=>reject\(new Error\('Arène officielle indisponible/);
 assert.match(code,/const background=resolveAsset\(preset\.background\.assetId\)/);
 assert.match(code,/new URL\(uri,import\.meta\.url\)\.origin!==window\.location\.origin/);
 assert.match(code,/presentationAssets:nativePresentationAssets/);
 assert.match(code,/await new Promise\(resolve=>requestAnimationFrame\(\(\)=>requestAnimationFrame\(resolve\)\)\)/);
});

test('one native Portal cover emits only scoped HUD-visibility events',()=>{
 const code=read('src/sculpt-lab-main.js');
 assert.match(code,/schema:'gensrpg.exploration.play.loading.v1'/);
 assert.match(code,/sessionId:playOptions.sessionId,visible/);
 assert.match(code,/overlay.hidden=false;\s*reportScopedPlayZoneLoadingV1\(true\)/);
 assert.match(code,/overlay.hidden=true;\s*reportScopedPlayZoneLoadingV1\(false\)/);
 assert.doesNotMatch(code.slice(code.indexOf('function reportScopedPlayZoneLoadingV1'),code.indexOf('async function traverseSculptWorldPortal')),/CombatResult|localStorage|setInterval/);
});

test('mobile fractional-DPR seams share exact native pixel ownership without opaque underpaint',()=>{
 const code=read('src/render/sculpt-height-renderer.js');
 const from=code.indexOf('function sculptPaintByCell');
 const until=code.indexOf('export function sculptHillTopProfile',from);
 const painter=code.slice(from,until);
 assert.ok(from>0&&until>from);
 const exactClip=painter.indexOf('sculptPaintCellClipV1(ctx,x,y,w,h)');
 assert.ok(exactClip>0);
 assert.doesNotMatch(painter,/const seam=|ctx\.globalAlpha=1[;\n]|ctx\.rect\(/);
 assert.match(painter.slice(exactClip),/ctx\.globalAlpha=\.20;ctx\.stroke\(\)/);
 assert.match(painter.slice(exactClip),/ctx\.globalAlpha=\.95;ctx\.stroke\(\)/);
 assert.match(painter.slice(exactClip),/ctx\.globalAlpha=\.20;ctx\.fill\(\)/);
 assert.match(painter.slice(exactClip),/ctx\.globalAlpha=\.95;ctx\.fill\(\)/);
 const clip=code.slice(code.indexOf('export function sculptPaintCellClipV1'),from);
 assert.match(clip,/sculptPaintCellBoundsV1\(ctx,x,y,w,h\)/);
 const terrain=code.slice(code.indexOf('export function drawSculptTerrain'));
 assert.match(terrain,/const topBounds=sculptPaintCellBoundsV1\(ctx,x,y,w,h\)/);
 assert.match(terrain,/ctx\.fillStyle=pattern\?\?baseColor;\s*ctx\.fillRect\(topBounds\.x,topBounds\.y,topBounds\.width,topBounds\.height\)/);
 const browser=read('scripts/smoke-sculpt-terrain-lab.mjs');
 assert.match(browser,/paintedGrid\.length!==12\|\|paintedGrid\.some\(v=>v\.bad!==0\|\|v\.count<1000\)/);
});

test('CI browser gates observe canonical actual image state, never synthetic time or Resource Timing',()=>{
 const sculpt=read('src/sculpt-lab-main.js');
 const snow=read('scripts/smoke-sculpt-terrain-lab.mjs');
 const encounter=read('scripts/smoke-modern-combat-preview.mjs');
 assert.match(sculpt,/visualAssetReady:Boolean\(art\?\.complete&&\(art\?\.naturalWidth\?\?art\?\.width\)>0\)/);
 assert.match(snow,/object\.visualAssetReady===true/);
 assert.match(encounter,/--remote-debugging-port=0/);
 assert.match(encounter,/document\.documentElement\.outerHTML/);
 assert.doesNotMatch(encounter,/--virtual-time-budget/);
});
