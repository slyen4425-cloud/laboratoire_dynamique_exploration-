import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOfficialPeerHeroV1} from '../src/play/exploration-peer-official-hero-reference-v1.js';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8'));
test('C7 remote hero references resolve exclusively against the canonical catalog',()=>{
  assert.equal(catalog.heroes.length,12);
  for(const hero of catalog.heroes){
    assert.equal(resolveOfficialPeerHeroV1({catalog,presetId:hero.id})?.id,hero.id);
  }
  for(const presetId of [
    'https://evil.example/hero.png',
    'hero.user.custom',
    'hero.official.99_unknown',
    '../assets/exploration/actors/official/hero.png',
    'hero.official.01_test?url=https://evil.example',
    null,{},'',
  ]){
    assert.equal(resolveOfficialPeerHeroV1({catalog,presetId}),null);
  }
});
test('C7 never trusts forged assets even when the preset ID matches',()=>{
  const forged=structuredClone(catalog);
  forged.heroes[0].thumbnail='https://evil.example/hero.png';
  assert.throws(()=>resolveOfficialPeerHeroV1({catalog:forged,presetId:catalog.heroes[0].id}),TypeError);
});
