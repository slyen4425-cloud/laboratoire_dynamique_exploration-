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
 assert.match(main,/if\(sculptPlayRequested&&\(!scopedEncounter\?\.armed\|\|scopedEncounter\.party\.active\.hp===0\)\)return null;[\s\S]{0,120}if\(!sculptEncounterController/);
 assert.match(read('sculpt-lab.html'),/body\.sculpt-play-mode \.editor-switch/);
});

test('Pages artifact must stage play menu, game module and first-party route',()=>{
 const flow=read('.github/workflows/publish-exploration-main.yml');
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
 assert.match(sculpt,/gensrpg\.exploration\.play\.return-title\.v1/);
 assert.match(sculpt,/persistPlayNavigationCheckpoint\(\)/);
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
 assert.match(runtime,/if\(sculptPlayRequested&&\(!scopedEncounter\?\.armed\|\|scopedEncounter\.party\.active\.hp===0\)\)return null/,'scoped play needs its Core host and a fighter able to fight');
});

test('real native GenSRPG Jouer only enables encounters after scope and Core handshake',()=>{
 const main=read('src/sculpt-lab-main.js');
 assert.match(main,/readScopedAdventurePublishedEncountersV1\(\{/);
 assert.match(main,/storage:window\.sessionStorage/);
 assert.match(main,/sessionId:playOptions\.sessionId,worldId:world\.id/);
 assert.match(main,/authorSha:sculptEncounterSourceBundle\.authorSha/);
 assert.match(main,/engineSha:sculptEncounterSourceBundle\.engineSha/);
 assert.match(main,/allowedCreatureIds:ids\?\?\[\]/);
 assert.match(main,/await installScopedSculptEncounters\(world,ids\)/);
 assert.match(main,/requestAdventureCombatHostV1\(window\.frameElement,sculptCombatSessionId,'ready'\)/);
 assert.match(main,/if\(pending\)await recoverScopedSculptEncounter\(pending\);\s+if\(scopedEncounter\)scopedEncounter\.armed=true;/);
 assert.doesNotMatch(main,/createNewEncounterEngine|catalogueLegacy|monstersSeptember/i);
});

test('frozen Tester previews never import the scoped Adventure readers during module startup',()=>{
 const bridge=read('integration/combat-bridge/exploration-encounter.js');
 const readers=['world-assembler-handoff.js','adventure-published-encounters-v1.js','adventure-playing-party-v1.js'];
 for(const reader of readers){
  const filename=reader.replaceAll('.','\\.');
  assert.doesNotMatch(bridge,new RegExp("from\\s*['\"][^'\"]*"+filename+"['\"]"));
  assert.match(bridge,new RegExp("import\\(['\"][^'\"]*"+filename+"['\"]\\)"));
 }
 assert.match(bridge,/encounterSessionId===undefined\?undefined:\s*await readAdventureCombatParty\(handoff,authorBundle\)/);
});
