import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('one responsive PNJ dialog reuses the exact existing form, no second authority',()=>{
 for(const id of ['npc-authoring-dialog','npc-authoring-open','npc-authoring-close',
   'actor-npc-settings','npc-team-list','npc-trainer-engagement']){
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1,id);
 }
 assert.match(html,/<dialog id="npc-authoring-dialog"[^>]*>/);
 assert.match(html,/<details id="actor-npc-settings" open>/);
 assert.match(html,/#npc-authoring-dialog::backdrop/);
 assert.match(html,/@media\(max-height:480px\)/);
 assert.doesNotMatch(html,/id="npc-authoring-dialog"[^>]*open/);
});

test('native actor placement, touch selection and toolbar open same modal',()=>{
 const placement=js.match(/function applyActorAtCell\(cell\)\{([\s\S]*?)\n\}\n\$\('actor-definition'\)/)?.[1];
 assert.ok(placement,'existing Sculpt actor placement');
 assert.equal((placement.match(/openNpcAuthoringDialog\(\)/g)??[]).length,3);
 assert.match(js,/if\(!dialog.open\)dialog.showModal\(\)/);
 assert.match(js,/\$\('npc-authoring-open'\)\?\.addEventListener\('click',openNpcAuthoringDialog\)/);
 assert.match(js,/\$\('npc-authoring-close'\)\?\.addEventListener\('click',closeNpcAuthoringDialog\)/);
 assert.match(js,/if\(!selected\)\{closeNpcAuthoringDialog\(\)/);
 assert.match(js,/if\(!objectEditing\)\{\s*closeNpcAuthoringDialog\(\)/);
 assert.doesNotMatch(js,/cloneNode\(/);
});
