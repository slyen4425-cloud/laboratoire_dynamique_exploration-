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
