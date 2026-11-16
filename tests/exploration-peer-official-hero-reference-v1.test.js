import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveOfficialPeerHeroV1} from '../src/play/exploration-peer-official-hero-reference-v1.js';
import {readFileSync} from 'node:fs';

const catalog=JSON.parse(readFileSync(new URL('../assets/exploration/actors/official/catalog.json',import.meta.url),'utf8'));
test('C7 remote hero references resolve exclusively against the canonical catalog',()=>{
  const first=catalog.heroes[0];
  assert.equal(resolveOfficialPeerHeroV1({catalog,presetId:first.id})?.id,first.id);
  assert.equal(resolveOfficialPeerHeroV1({catalog,presetId:'https://evil.example/hero.png'}),null);
  assert.equal(resolveOfficialPeerHeroV1({catalog,presetId:'hero.user.custom'}),null);
  assert.equal(resolveOfficialPeerHeroV1({catalog,presetId:'hero.official.99_unknown'}),null);
});
