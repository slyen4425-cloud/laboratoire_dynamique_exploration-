import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createBlankWorldBuilderDraft} from '../src/builder/world-builder-draft.js';
import {worldAreaSizeFromTiles} from '../src/builder/world-area-size-command.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';
import {createNewExplorationPlay,readExplorationPlay} from '../src/play/exploration-play-session.js';

const storage=()=>{
 const entries=new Map();
 return {getItem:key=>entries.get(key)??null,
  setItem:(key,value)=>entries.set(key,value),
  removeItem:key=>entries.delete(key)};
};

test('World Builder Nouvelle carte vierge uses the ONE official 2.5D authoring size adapter',async()=>{
 const source=await readFile(new URL('../src/builder/world-builder-main.js',import.meta.url),'utf8');
 assert.match(source,/import\\s*\\{\\s*worldAreaSizeFromTiles\\s*\\}\\s*from\\s*['"]\\.\\/world-area-size-command\\.js['"]/);
 const start=source.indexOf("$('new-blank-world').addEventListener('click'");
 assert.ok(start>=0,'real UI New blank world handler required');
 const handler=source.slice(start,start+950);
 assert.match(handler,/draft\\s*=\\s*createBlankWorldBuilderDraft\\(\\{\\s*\\.\\.\\.worldAreaSizeFromTiles\\(\\{\\s*width:\\s*36,\\s*height:\\s*24\\s*\\}\\)\\s*\\}\\)/,
  'New blank world must use the official WorldArea size conversion, not legacy unsupported 2400x1600');
});

test('The New World Builder dimensions open in REAL native 2.5D Jouer and preserve navigation on restart',()=>{
 const size=worldAreaSizeFromTiles({width:36,height:24});
 const world=createBlankWorldBuilderDraft({id:'world-blank-playable',...size});
 assert.deepEqual([world.areas[0].width,world.areas[0].height],[36*28,24*21]);
 const before=JSON.stringify(world);
 const scene=sculptWorldAreaScene(world.areas[0]);
 assert.deepEqual([scene.terrain.width,scene.terrain.height],[36,24]);
 const data=storage(),scope={sessionId:'adventure-blank-playable'};
 const started=createNewExplorationPlay(data,world,scope);
 assert.equal(started.worldId,world.id);
 assert.equal(started.sessionId,scope.sessionId);
 assert.deepEqual(readExplorationPlay(data,world,scope),started);
 assert.equal(JSON.stringify(world),before,'official WorldDocument is never rewritten by Jouer');
});

test('Legacy 2400x1600 WorldDocument is retained and rejected, never silently rescaled or saved',()=>{
 const legacy=createBlankWorldBuilderDraft();
 const serialized=JSON.stringify(legacy);
 assert.deepEqual([legacy.areas[0].width,legacy.areas[0].height],[2400,1600]);
 const data=storage(),scope={sessionId:'adventure-oversized-existing'};
 assert.throws(()=>createNewExplorationPlay(data,legacy,scope),
  /Zone hors des dimensions prises en charge par le terrain 2,5D/);
 assert.equal(data.getItem('gensrpg.exploration.play.navigation.v1:'+scope.sessionId),null);
 assert.equal(JSON.stringify(legacy),serialized,'No implicit migration of an existing map');
});
