import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('map library shows selected template separately from the active loaded map',()=>{
 const html=readFileSync(new URL('../sculpt-lab.html',import.meta.url),'utf8');
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 assert.match(html,/id="sculpt-map-preset-loaded"/);
 assert.match(html,/Modèle de carte à charger/);
 assert.match(source,/pas encore chargé sur la carte/);
 assert.match(source,/Carte affichée : «/);
 assert.match(source,/passages, les rencontres et le héros de la partie restent indépendants/);
 assert.match(source,/function mountSculptArea\(snapshot\)/);
 assert.match(source,/mountSculptArea\(scene\)/);
});
test('loading a map preserves native owner without changing Encounter or WorldArea contracts',()=>{
 const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');
 const start=source.indexOf("  $('sculpt-map-preset-apply').addEventListener('click'");
 const end=source.indexOf("  $('sculpt-map-preset-export').addEventListener('click'",start);
 assert.ok(start>0&&end>start);
 const handler=source.slice(start,end);
 assert.match(handler,/importSculptPreviewScene\(preset\.scene\)/);
 assert.match(handler,/mountSculptArea\(scene\)/);
 assert.doesNotMatch(handler,/saveSculptWorldArea|writeScopedAdventureHero|createNewExplorationPlay/);
});
