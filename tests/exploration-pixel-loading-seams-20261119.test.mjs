import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('official CSS arena image decoded before native Combat READY postMessage',()=>{
 const code=read('integration/combat-bridge/exploration-encounter.js');
 const mounted=code.indexOf('mountedCombat=await mountCoop2v2Test(');
 const decoded=code.indexOf('await waitForNativeCombatArenaArtV1(nativeVisualSource.arenaId)',mounted);
 const ready=code.indexOf("type:'gensrpg.capture.combat-ready.v1'",decoded);
 assert.ok(mounted>0&&decoded>mounted&&ready>decoded);
 assert.match(code,/asset\.onerror=\(\)=>reject\(new Error\('Arène officielle indisponible/);
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

test('mobile fractional-DPR seams get opaque underpaint in the same native painter',()=>{
 const code=read('src/render/sculpt-height-renderer.js');
 const from=code.indexOf('function sculptPaintByCell');
 const until=code.indexOf('export function sculptHillTopProfile',from);
 const painter=code.slice(from,until);
 assert.ok(from>0&&until>from);
 const underlay=painter.indexOf('ctx.rect(x-.75,y-.75,w+1.5,h+1.5)');
 const exactClip=painter.indexOf('sculptPaintCellClipV1(ctx,x,y,w,h)');
 assert.ok(underlay>0&&exactClip>underlay);
 assert.match(painter.slice(underlay,exactClip),/ctx.globalAlpha=1;ctx.strokeStyle=pattern/);
 assert.doesNotMatch(painter.slice(underlay,exactClip),/\.95|\.20/);
 assert.match(painter.slice(exactClip),/ctx.globalAlpha=\.20;ctx.stroke\(\)/);
});
