import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createBlankWorldBuilderDraft,serializeWorldBuilderDraft,importWorldBuilderDocument} from '../src/builder/world-builder-draft.js';
import {sculptWorldAreaScene} from '../src/builder/sculpt-world-area-link.js';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('legacy WorldArea 2400 x 1600 is never silently resized or overwritten by a 2.5D prototype',()=>{
 const doc=createBlankWorldBuilderDraft({id:'mon-monde-ancien',width:2400,height:1600});
 assert.throws(()=>sculptWorldAreaScene(doc.areas[0]),/dimensions/);
 const restored=importWorldBuilderDocument(serializeWorldBuilderDraft(doc));
 assert.equal(restored.areas[0].width,2400);
 assert.equal(restored.areas[0].height,1600);
 assert.equal(restored.initialAreaId,doc.initialAreaId);
});

test('World Builder offers a compatible 2.5D Area, refuses false demo handoff when none exists',()=>{
 const main=read('src/builder/world-assembler-main.js');
 assert.match(main,/resolveSculptAreaForEditor\(draft,selectedId\)/);
 assert.match(main,/if\(!resolution\)\{/);
 assert.match(main,/area-name'\)\.focus\(\)/);
 assert.match(main,/window\.confirm\('La zone/);
 assert.doesNotMatch(main,/createBlankWorldBuilderDraft\(\{id:'nouveau-monde'.*\}\).*openAreaEditor/s);
});

test('legacy map handoff always allows return without committing the unrelated demo canvas',()=>{
 const main=read('src/sculpt-lab-main.js'),html=read('sculpt-lab.html');
 assert.match(main,/sculptWorldAreaMounted=false/);
 assert.match(main,/if\(sculptWorldAreaMounted\)commitCurrentSculptWorldArea\(\)/);
 assert.match(main,/saveWorldAssemblerDraft\(window\.localStorage,sculptWorldDraft\)/);
 assert.match(main,/world-area-unavailable'\)\.hidden=false/);
 assert.match(html,/id="world-area-unavailable"/);
 assert.match(html,/id="world-area-unavailable-return"/);
 assert.match(html,/id="world-area-unavailable-create"/);
 assert.doesNotMatch(main,/window\.alert\('Retour impossible sans enregistrer/);
});
