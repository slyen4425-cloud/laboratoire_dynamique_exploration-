// C7: read-only visual reference to the ONE published Explorer hero catalog.
// This module does not create a HeroDefinition, fetch remote URLs or own state.
// The server must validate the member's claimed preset before broadcasting it.
import {normalizeOfficialHeroCatalogV1} from '../actors/official-hero-presets-v1.js';

const PRESET_ID=/^hero\.official\.\d\d_[a-z_]+$/;
export function resolveOfficialPeerHeroV1({catalog,presetId}={}){
  if(typeof presetId!=='string'||!PRESET_ID.test(presetId))return null;
  const official=normalizeOfficialHeroCatalogV1(catalog);
  return official.heroes.find(hero=>hero.id===presetId)??null;
}
