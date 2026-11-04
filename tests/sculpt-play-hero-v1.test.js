import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/sculpt-lab-main.js',import.meta.url),'utf8');

test('real 2.5D Jouer resolves session/world-scoped Hero ID from official same-origin grant only',()=>{
 assert.match(source,/readScopedAdventureHeroSelectionV1/);
 assert.match(source,/playOptions\.sessionId/);
 assert.match(source,/world\.id/);
 assert.doesNotMatch(source,/localStorage\.getItem\(['"]hero/i);
});
test('native Explorer reads user HeroDefinition via its own IndexedDB and prepares ALL authored sprites before switching visual',()=>{
 assert.match(source,/createUserHeroStoreV1/);
 assert.match(source,/createUserHeroAssetResolverV1/);
 assert.match(source,/createMapActorVisualPreparer/);
 assert.match(source,/installAuthoredHeroMapActor/);
 assert.match(source,/preserveCanvas/);
});
test('Hero selection never replaces navigation, collision, or camera owner',()=>{
 assert.match(source,/stepMovement\(world,navActor,intent,dt/);
 assert.match(source,/navigationActorRenderer\.draw/);
 assert.match(source,/isBlocked\(navigationWorld\(\),point/);
 assert.match(source,/readWorldAssemblerDraft\(window\.localStorage\)/);
});
