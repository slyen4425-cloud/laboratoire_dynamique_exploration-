import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

const mode=html.indexOf('id="mode-waypoints"');
const palette=html.indexOf('<section id="waypoints-palette"');
const objectPalette=html.indexOf('<section id="object-palette"');
const objectControls=html.indexOf('<div id="object-controls">');

test('the unique passage inspector is physically MOVED out of Objets into its own tab',()=>{
 assert.ok(mode>0&&palette>0&&objectPalette>palette&&objectControls>objectPalette);
 assert.match(html,/<button[^>]*id="mode-waypoints"[^>]*aria-controls="waypoints-palette"[^>]*aria-pressed="false"/);
 for(const id of ['waypoints-palette','object-waypoints-panel',
   'object-waypoints-unavailable','object-waypoint-place','object-waypoint-select',
   'object-waypoint-target','object-waypoint-create-button','object-waypoint-marker-mode',
   'object-waypoint-marker-save','object-waypoint-arrival-place']){
   assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,id);
   const position=html.indexOf('id="'+id+'"');
   assert.ok(position>palette&&position<objectPalette,id+' must be outside Objets');
 }
 assert.match(html,/<section id="object-palette"[^>]*>[\s\S]*?<strong>🌳 Objets et acteurs de carte<\/strong>/);
 assert.ok(!html.slice(objectPalette,objectControls+40).includes('object-waypoints-panel'));
});

test('Passages switches to a separate palette and never accidentally places an object',()=>{
 assert.match(script,/function setObjectEditing\(active,\{waypoints=false\}=\{\}\)/);
 assert.match(script,/waypointsEditing=objectEditing&&waypoints===true;/);
 assert.match(script,/\$\('object-palette'\)\.hidden=!objectEditing\|\|waypointsEditing;/);
 assert.match(script,/const waypointPalette=\$\('waypoints-palette'\);/);
 assert.match(script,/if\(waypointPalette\)waypointPalette\.hidden=!waypointsEditing;/);
 assert.match(script,/\$\('mode-objects'\)\.addEventListener\('click',\(\)=>setObjectEditing\(!objectEditing\|\|waypointsEditing\)\)/);
 assert.match(script,/\$\('mode-waypoints'\)\?\.addEventListener\('click',\(\)=>\{/);
 assert.match(script,/\$\('mode-waypoints'\)\?\.setAttribute\('aria-pressed'/);
 assert.match(script,/setObjectEditing\(!waypointsEditing,\{waypoints:true\}\)/);
 assert.match(script,/if\(waypointsEditing&&!sculptWorldPortalPlacement\)\{[\s\S]*?Placer le repère sur la carte/);
 assert.match(script,/function applyObjectAtCell\(cell\)\{\s*if\(!objectEditing\|\|waypointsEditing\)return;/);
 assert.match(script,/if\(waypointsEditing&&sculptWorldDraft&&!sculptWorldPortalPlacement\)/);
});

test('standalone editor guides author to World Builder without manufacturing world data',()=>{
 assert.match(html,/id="object-waypoints-unavailable"[^>]*hidden/);
 assert.match(html,/ouvre ta carte depuis le <a href="\.\/world-assembler\.html">/);
 assert.match(script,/const available=!!sculptWorldDraft&&sculptWorldAreaMounted&&!navigationTesting;/);
 assert.match(script,/if\(!available\)return;/);
 assert.match(html,/<option value="hidden">Invisible en jeu<\/option>/);
 assert.match(html,/<option value="shadow">Ombre noire de passage<\/option>/);
 assert.match(html,/<option value="texture">Texture du catalogue<\/option>/);
 assert.match(script,/findPortalEnteredDuringMove\(sculptWorldDraft,sculptWorldAreaId/);
});
