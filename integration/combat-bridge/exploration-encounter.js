// Exploration owns only the Encounter and return address. Every attack,
// resource, effect, AI decision and fighter state belongs to current Combat main.
import { mountCombatDemo } from '../../src/ui/demo-app.js';
import { mountCoop2v2Test } from '../../src/ui/combat-2v2-test-ui.js';
import { createCapturePreviewDisplayModeV1 } from '../../src/ui/capture-preview-display-mode-v1.js';
import { adaptCaptureExportToNativeVisualSourceV1 } from '../../src/adapters/input/capture/capture-export-to-native-visual-source-v1.js';
import { createGlobalPresentationAssetResolverV1 } from '../../src/assets/global-presentation-asset-resolver-v1.js';
import { createCaptureSkillPresentationAssetsV2 } from '../../src/adapters/renderer/capture-skill-presentation-assets-v2.js';
import {normalizeCaptureAuthorEncounterBundleV1} from '../../../src/capture/capture-showcase-encounter-source-v1.js';
import { demoPresentationAssets } from './demo-assets.js';
import { buildExplorationNativeCombatSourceV1 } from './exploration-native-source-v1.js';
import { readCombatHandoff, saveCombatHandoff } from '../../../src/encounters/combat-handoff-store.js';
import { createCaptureCombatResult } from '../../../src/encounters/capture-combat-result-contract.js';

const $ = selector => document.querySelector(selector);
const host = $('[data-capture-preview-host]');
const status = $('[data-bridge-status]');
let mountedVisuals = null, mountedCombat = null, watchId = null, completed = false;
const fullButton = $('[data-encounter-fullscreen]');
const displayMode = createCapturePreviewDisplayModeV1({
  documentRef: document, screenRef: globalThis.screen,
  fullscreenHost: document.documentElement, previewShell: $('[data-capture-preview-shell]')
});
function syncFullscreenButton() {
  fullButton.hidden = window.self !== window.top || Boolean(document.fullscreenElement);
}
fullButton.addEventListener('click', async () => {
  fullButton.disabled = true;
  try {await displayMode.enter({enabled:true});} catch(error) {message('Plein écran indisponible : ' + error.message,true);}
  finally {fullButton.disabled = false; syncFullscreenButton();}
});
document.addEventListener('fullscreenchange',syncFullscreenButton);
syncFullscreenButton();
const rootPath = new URL('../../', import.meta.url);
const resource = path => new URL(path, rootPath);
async function readJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Fichier Combat introuvable : ' + url.pathname + ' (HTTP ' + response.status + ')');
  return response.json();
}
function message(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
  status.dataset.ready = String(!error && text.startsWith('Combat réel'));
}
// The same canonical transfer manifests and asset resolver as Combat Editor.
const assetCatalogUrl = new URL('../../../capture-assets/data/assets/catalog/global-visual-assets.v1.json',import.meta.url);
const assetBase = new URL('../../../capture-assets/assets/library/',import.meta.url);
const assetUrlForFile = file => new URL(file,assetBase).href;
function presentationAssetsForSource(source, assetCatalog) {
  const resolveAsset=createGlobalPresentationAssetResolverV1({
    assetCatalog,assetUrlForFile
  });
  const native=createCaptureSkillPresentationAssetsV2({
    skillPresentations:source.skillPresentations??{},
    assetForId:resolveAsset,
    audioAssetForId: id=>demoPresentationAssets.audioAsset(id)
  });
  return Object.freeze({
    asset:resolveAsset,
    presentationForArena: id=>demoPresentationAssets.presentationForArena(id),
    presentationForSkill(id,context={}) {
      return native.presentationForSkill(id,context) ??
        demoPresentationAssets.presentationForSkill(id,context);
    },
    statusPresentationFor: (id,context={})=>native.statusPresentationFor(id,context),
    audioAsset: id=>native.audioAsset(id)??demoPresentationAssets.audioAsset(id)
  });
}
function showOfficialCombatTemplate(source, templateResponse) {
  return Promise.resolve(templateResponse).then(async response => {
    if (!response.ok) throw new Error('Template du Labo Combat indisponible');
    const page = new DOMParser().parseFromString(await response.text(), 'text/html');
    const template = page.querySelector('[data-capture-preview-template]');
    if (!template) throw new Error('Contrat visuel du Labo Combat incompatible');
    host.replaceChildren(template.content.cloneNode(true));
    const root = host.querySelector('[data-combat-demo]');
    if (!root || !root.querySelector('[data-combat-arena]')) throw new Error('Arène Combat absente');
    for (const element of root.querySelectorAll('[data-preview-actor-ui]')) {
      const actor = source.battleFormat.actors.find(x => x.actorId === element.dataset.previewActorUi);
      element.hidden = !actor;
      if (actor) {
        for (const title of element.querySelectorAll('[data-demo-label], strong')) title.textContent = actor.displayName;
      }
    }
    const arena = root.querySelector('[data-combat-arena]');
    const family = readCombatHandoff(sessionStorage)?.snapshot.context.terrainFamilyId;
    const arenaId = ({forest:'forest',snow:'snow',volcano:'lava',mountain:'cave'})[family] ?? 'forest';
    const preset = demoPresentationAssets.presentationForArena(arenaId);
    if (preset?.background?.url) {
      arena.dataset.arenaBackground = 'image';
      arena.style.setProperty('--arena-background-image', 'url("' + preset.background.url + '")');
      arena.style.setProperty('--arena-background-position', preset.backgroundPosition ?? 'center');
      arena.style.setProperty('--arena-background-size', preset.backgroundSize ?? 'cover');
    }
    return root;
  });
}
// A scoped observer of the official Combat Session, NOT another HP/winner
// engine. Combat main currently exposes session.snapshot() but not onBattleEnd.
// Destroy this observer on unmount. Never infer victory from DOM/CSS.
function observeNativeBattleResult(combat, onResult) {
  function frame() {
    const state = combat.session.snapshot();
    const local = state.fighters['local-1'];
    const opponent = state.fighters['opponent-1'];
    if (local && opponent && (local.hp <= 0 || opponent.hp <= 0)) {
      onResult(local.hp <= 0 ? 'defeat' : 'victory');
      return;
    }
    watchId = requestAnimationFrame(frame);
  }
  watchId = requestAnimationFrame(frame);
}
function completeBattle(outcome) {
  if (completed) return;
  const handoff = readCombatHandoff(sessionStorage);
  if (!handoff || handoff.result) throw new Error('CombatResult déjà résolu ou handoff absent');
  const result = createCaptureCombatResult({
    encounterId: handoff.snapshot.encounterId,
    returnToken: handoff.snapshot.returnToken,
    outcome,
    partyState: { activeCreatureId: mountedCombat.format.actor('local-1').creatureId,
      hp: mountedCombat.session.snapshot().fighters['local-1'].hp }
  });
  saveCombatHandoff(sessionStorage, {...handoff, result});
  completed = true;
  if (watchId !== null) cancelAnimationFrame(watchId);
  message(outcome === 'victory' ? 'Victoire · retour en exploration' : 'Défaite · retour en exploration');
  // Message is only a signal; the parent validates the persisted result.
  let notified = false;
  try {
    if (window.parent !== window && window.parent.location.origin === window.location.origin) {
      window.parent.postMessage({
        type:'gensrpg.capture.combat-complete.v1',
        encounterId:result.encounterId,returnToken:result.returnToken
      }, window.location.origin);
      notified = true;
    }
  } catch { /* Cross-origin parent is never an authorized target. */ }
  if (!notified) {
    const destination = new URL(handoff.returnState.returnUrl);
    if (destination.origin !== window.location.origin) throw new Error('Origine de retour invalide');
    window.location.assign(destination.href);
  }
}
async function launch() {
  const handoff=readCombatHandoff(sessionStorage);
  if(!handoff||handoff.result)throw new Error('EncounterSnapshot v1 absent ou déjà terminé');
  // Start downloading the official HUD immediately; independent source data
  // resolves concurrently. Only one build-produced bundle supplies every
  // approved creature/skill, never 70+ independent cold-start requests.
  const templateResponse=fetch('./capture-editor-v2.html',{cache:'force-cache'});
  const [party,nativeSkillCatalog,statRegistry,progressionRules,baseFighterRules,
    assetCatalog,...profilesAndBundle] = await Promise.all([
    readJson('./party.preview.v1.json'),
    readJson(resource('data/combat/skills/catalog.v1.json')),
    readJson(resource('data/capture/monster-capture-stat-registry.v1.json')),
    readJson(resource('data/capture/monster-capture-progression-rules.v1.json')),
    readJson(resource('data/combat/fighters/maraileron.combat.json')),
    readJson(assetCatalogUrl),
    ...['biped','flying','massive','quadruped','serpentine'].map(id=>
      readJson(resource('data/profiles/'+id+'.profile.json'))),
    readJson(resource('data/capture/showcase/encounter-bundle.v1.json'))
  ]);
  const profiles=profilesAndBundle.slice(0,5);
  const authorBundle=normalizeCaptureAuthorEncounterBundleV1(profilesAndBundle[5]);
  const creatureTransfers=authorBundle.creatureTransfers;
  const skillTransfers=authorBundle.skillTransfers;
  const terrain=handoff.snapshot.context.terrainFamilyId;
  const arenaId=({forest:'forest',snow:'snow',volcano:'lava',mountain:'cave'})[terrain]??'forest';
  const nativeCombatSource=buildExplorationNativeCombatSourceV1({
    snapshot:handoff.snapshot,party,showcaseCreatureTransfers:creatureTransfers,
    showcaseSkillTransfers:skillTransfers,nativeSkillCatalog,statRegistry,
    progressionRules,baseFighterRules,arenaId,previewLevel:20
  });
  const nativeVisualSource=adaptCaptureExportToNativeVisualSourceV1({
    exported:nativeCombatSource.exported,assetCatalog,profiles,assetUrlForFile
  });
  const root=await showOfficialCombatTemplate(nativeCombatSource,templateResponse);
  mountedVisuals=await mountCombatDemo({root,nativeVisualSource});
  mountedCombat=await mountCoop2v2Test({
    root,visuals:mountedVisuals,nativeCombatSource,
    presentationAssets:presentationAssetsForSource(nativeCombatSource,assetCatalog)
  });
  observeNativeBattleResult(mountedCombat,completeBattle);
  message('Combat réel · créatures, capacités et animations Showcase officielles');
}
function dispose() {
  if (watchId !== null) { cancelAnimationFrame(watchId); watchId = null; }
  mountedCombat?.dispose(); mountedCombat = null;
  mountedVisuals?.dispose(); mountedVisuals = null;
}
window.addEventListener('pagehide', dispose, {once:true});
launch().catch(error => { dispose(); message('Combat indisponible : ' + error.message, true); console.error(error); });
