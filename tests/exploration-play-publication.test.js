import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');

test('Jouer has its own real menu rather than opening a Builder Tester',()=>{
 const page=read('play.html');
 const editor=read('world-assembler.html');
 const main=read('src/sculpt-lab-main.js');
 assert.match(page,/id="play-new"/);
 assert.match(page,/id="play-continue"/);
 assert.match(page,/src\/play\/exploration-play-entry\.js/);
 assert.match(editor,/id="world-play-open"[^>]+href="\.\/play\.html"/);
 assert.match(main,/function installSculptPlayMode\(/);
 assert.match(main,/const sculptPlayRequested=.*\.get\('play'\)==='1'/);
 assert.match(main,/sculptPlayActive\?sculptWorldDraft:commitCurrentSculptWorldArea\(\)/);
 assert.match(main,/if\(sculptPlayActive\)return null;[\s\S]{0,120}if\(!sculptEncounterController/);
 assert.match(read('sculpt-lab.html'),/body\.sculpt-play-mode \.editor-switch/);
});

test('Pages artifact must stage play menu, game module and first-party route',()=>{
 const flow=read('.github/workflows/publish-v81-main.yml');
 assert.match(flow,/cp encounter-source\/play\.html "\$preview\/"/);
 assert.match(flow,/test -s "\$preview\/src\/play\/exploration-play-session\.js"/);
 assert.match(flow,/name: Stage public Jouer entry alongside canonical world/);
 assert.match(flow,/site\/play\.html/);
 assert.match(flow,/name: Verify Jouer entry after Pages deployment/);
});

test('native Play menu and real Sculpt runtime retain GenSRPG scoped navigation across reload and return',()=>{
 const entry=read('src/play/exploration-play-entry.js');
 const sculpt=read('src/sculpt-lab-main.js');
 assert.match(entry,/searchParams\.get\('adventureSession'\)/);
 assert.match(entry,/\$\('play-new'\)\.disabled=Boolean\(playOptions\)/);
 assert.match(entry,/\$\('play-new'\)\.hidden=Boolean\(playOptions\)/);
 assert.match(entry,/createNewExplorationPlay\(window\.localStorage,world,playOptions\)/);
 assert.match(entry,/readExplorationPlay\(window\.localStorage,world,playOptions\)/);
 assert.match(sculpt,/searchParams\.get\('adventureSession'\)/);
 assert.match(sculpt,/readExplorationPlay\(window\.localStorage,world,playOptions\)/);
 assert.match(sculpt,/createExplorationPlayProgressWriter\(window\.localStorage,world,playOptions\)/);
 assert.match(sculpt,/play\.html\?adventureSession=/);
});

test('native Jouer menu respects actual hidden CSS precedence for GenSRPG-owned New Game',()=>{
 const html=read('play.html');
 assert.match(html,/\[hidden\]\s*\{\s*display\s*:\s*none\s*!important\s*;?\s*\}/,
  'The Play menu button display:flex must never override the semantic hidden attribute');
 const entry=read('src/play/exploration-play-entry.js');
 assert.match(entry,/\$\('play-new'\)\.hidden=Boolean\(playOptions\)/);
});

test('only GenSRPG-scoped Jouer requests unique Encounter Controller correlation, never Tester',()=>{
 const runtime=read('src/sculpt-lab-main.js');
 assert.match(runtime,/createCorrelationIds:sculptPlayRequested&&adventureSessionId!==null/);
 assert.match(runtime,/encounterId:'encounter-'\+window\.crypto\.randomUUID\(\)/);
 assert.match(runtime,/returnToken:'return-'\+window\.crypto\.randomUUID\(\)/);
 assert.match(runtime,/if\(sculptPlayActive\)return null/,'published-only gate remains closed pending official Combat Bestiary');
});

test('real native GenSRPG Jouer reads the versioned published Bestiary grant but retains reward safety gate',()=>{
 const main=read('src/sculpt-lab-main.js');
 assert.match(main,/readScopedAdventurePublishedEncountersV1\(\{/);
 assert.match(main,/storage:window\.sessionStorage/);
 assert.match(main,/sessionId:playOptions\.sessionId,worldId:world\.id/);
 assert.match(main,/authorSha:sculptEncounterSourceBundle\.authorSha/);
 assert.match(main,/engineSha:sculptEncounterSourceBundle\.engineSha/);
 assert.match(main,/allowedCreatureIds:ids\?\?\[\]/);
 assert.match(main,/if\(sculptPlayActive\)return null/,'combat/reward handoff remains blocked in this isolated lot');
 assert.doesNotMatch(main,/createNewEncounterEngine|catalogueLegacy|monstersSeptember/i);
});
