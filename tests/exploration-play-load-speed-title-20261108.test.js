import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const main=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');

test('Adventure speed selects the real native movement slider and minimum 90; Editor remains independent',()=>{
 assert.match(main,/sculptPlayRequested\s*\)\{/);
 assert.match(main,/get\('moveSpeed'\)/);
 assert.match(main,/parsed>=90&&parsed<=360/);
 assert.match(main,/\(parsed-90\)%10===0\?parsed:90/);
 assert.match(main,/\$\('navigation-speed'\)\.value=String\(speed\)/);
 assert.match(main,/stepMovement\(world,navActor,intent,dt/);
 assert.match(main,/navSpeed\(\)\*intent\.speedMultiplier/);
 assert.match(main,/sculptPlayRequested\?90:220/);
 assert.match(html,/id="navigation-speed"[^>]*type="range" min="90" max="360" step="10" value="220"/);
});
test('only true Portal traversal shows loading BEFORE expensive map mount; hide AFTER first render',()=>{
 assert.match(html,/id="play-area-loading"/);
 assert.match(html,/Chargement de la zone/);
 assert.match(main,/async function traverseSculptWorldPortal\(\)/);
 assert.match(main,/const overlay=sculptPlayActive\?\$\('play-area-loading'\):null/);
 const entering=main.indexOf('overlay.hidden=false');
 const yieldFrame=main.indexOf('await new Promise(resolve=>requestAnimationFrame',entering);
 // The mount now consumes the scene already validated before the portal.
 // Require its two-argument form rather than accidentally matching a second
 // projection. The loading veil must still cover the full native mount.
 const mount=main.indexOf('mountWorldSculptArea(transition.currentAreaId,destinationScene)',yieldFrame);
 const rendering=main.indexOf('requestAnimationFrame(()=>requestAnimationFrame(resolve))',mount);
 const hide=main.indexOf('overlay.hidden=true',rendering);
 assert.ok(entering>=0&&entering<yieldFrame&&yieldFrame<mount&&mount<rendering&&rendering<hide);
 assert.match(main,/applyPortalTransition\(document/);
 assert.match(main,/persistPlayNavigationCheckpoint\(\)/);
 assert.match(main,/sculptPortalLoading=false/);
});
test('native title exit checkpoints first, notifies only same-origin Capture parent',()=>{
 assert.match(main,/const returnToTitle=\(\)=>\{/);
 assert.match(main,/if\(!persistPlayNavigationCheckpoint\(\)\)return false/);
 assert.match(main,/schema:'gensrpg\.exploration\.play\.return-title\.v1'/);
 assert.match(main,/event\.origin!==window\.location\.origin/);
 assert.match(main,/gensrpg\.capture\.v2\.save-and-title\.v1/);
 assert.match(main,/gensrpg\.capture\.v2\.party-refresh\.v1/);
 assert.match(main,/readScopedAdventurePlayingPartyV1\(scopedEncounter\.context\)/);
 assert.doesNotMatch(main,/window\.parent\.document\.querySelector/);
});
test('embedded Adventure cannot steal fullscreen from Capture parent HUD and Tester retains native fullscreen',()=>{
 assert.match(main,/if\(sculptPlayRequested&&window\.frameElement\)\{\s*setImmersive\(true\);\s*return;/);
 assert.match(main,/if\(entering&&typeof document\.documentElement\.requestFullscreen==='function'\)/);
 assert.match(main,/\$\('fullscreen-toggle'\)\.hidden=true/);
 assert.match(main,/document\.addEventListener\('fullscreenchange'/);
});
