import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('Passages has one visible direct-entry action and reuses the single Objets waypoint inspector',()=>{
 for(const id of ['mode-waypoints','mode-objects','object-waypoints-panel',
   'object-waypoints-unavailable','object-waypoint-place','object-waypoint-marker-mode',
   'object-waypoint-marker-save','object-waypoint-arrival-place']){
   assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
 }
 assert.match(html,/<button[^>]*id="mode-waypoints"[^>]*aria-controls="object-waypoints-panel"/);
 assert.match(script,/\$\('mode-waypoints'\)\.addEventListener\('click',\(\)=>\{/);
 assert.match(script,/setObjectEditing\(true\);[\s\S]*?\$\('object-waypoints-panel'\)\.open=true;/);
 assert.match(script,/\$\('object-palette'\)\.scrollTop=0;/);
 assert.match(script,/sculptWorldPortalPlacement=sculptWorldPortalPlacement===mode\?null:mode;/);
});

test('standalone editor never invents a WorldDocument or silently hides passage authoring',()=>{
 assert.match(html,/id="object-waypoints-unavailable"[^>]*hidden/);
 assert.match(html,/ouvre ta carte depuis le <a href="\.\/world-assembler\.html">/);
 assert.match(script,/const available=!!sculptWorldDraft&&sculptWorldAreaMounted&&!navigationTesting;/);
 assert.match(script,/\$\('object-waypoints-unavailable'\)\.hidden=available\|\|navigationTesting;/);
 assert.match(script,/if\(objectEditing&&!navigationTesting\)\{[\s\S]*?syncObjectWaypoints\(\);/);
 assert.match(script,/Pour placer des passages entre cartes, ouvre cette carte depuis le World Builder/);
});

test('UI shortcut does not reactivate the legacy coordinate inspector or fork portal data',()=>{
 assert.match(script,/panel\.hidden=true;[\s\S]*?world-area-current-name/);
 assert.match(script,/setSculptWorldPortalAppearance\(sculptWorldDraft/);
 assert.match(script,/findPortalEnteredDuringMove\(sculptWorldDraft,sculptWorldAreaId/);
 assert.match(html,/<option value="hidden">Invisible en jeu<\/option>/);
 assert.match(html,/<option value="shadow">Ombre noire de passage<\/option>/);
 assert.match(html,/<option value="texture">Texture du catalogue<\/option>/);
 assert.match(script,/\$\('mode-waypoints'\)\.setAttribute\('aria-expanded'/);
});
