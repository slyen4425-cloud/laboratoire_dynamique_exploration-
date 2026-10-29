// Exploration owns only the Encounter and return address. Every attack,
// resource, effect, AI decision and fighter state belongs to current Combat main.
import { mountCombatDemo } from '../../src/ui/demo-app.js';
import { mountCoop2v2Test } from '../../src/ui/combat-2v2-test-ui.js';\nimport { createCapturePreviewDisplayModeV1 } from '../../src/ui/capture-preview-display-mode-v1.js';
import { captureCreatureVisualBindingForIdV1 } from '../../src/catalogs/capture-creature-visual-bindings-v1.js';
import { globalVisualAssetUrl } from '../../src/assets/global-visual-library.js';
import { demoPresentationAssets } from './demo-assets.js';
import { buildExplorationNativeCombatSourceV1 } from './exploration-native-source-v1.js';
import { readCombatHandoff, saveCombatHandoff } from '../../../src/encounters/combat-handoff-store.js';
import { createCaptureCombatResult } from '../../../src/encounters/capture-combat-result-contract.js';

const $ = selector => document.querySelector(selector);
const host = $('[data-capture-preview-host]');
const status = $('[data-bridge-status]');
let mountedVisuals = null, mountedCombat = null, watchId = null, completed = false;\nconst fullButton = $('[data-encounter-fullscreen]');\nconst displayMode = createCapturePreviewDisplayModeV1({\n  documentRef: document, screenRef: globalThis.screen,\n  fullscreenHost: document.documentElement, previewShell: $('[data-capture-preview-shell]')\n});\nfunction syncFullscreenButton() {\n  let embedded = false;\n  try {embedded = window.parent !== window && window.parent.location.origin === window.location.origin;} catch {}\n  fullButton.hidden = embedded || Boolean(document.fullscreenElement);\n}\nfullButton.addEventListener('click', async () => {\n  fullButton.disabled = true;\n  try {await displayMode.enter({enabled:true});} catch(error) {message('Plein écran indisponible : ' + error.message,true);}\n  finally {fullButton.disabled = false; syncFullscreenButton();}\n});\ndocument.addEventListener('fullscreenchange',syncFullscreenButton);\nsyncFullscreenButton();
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
function explicitMissingVisual(id, name) {
  // Explicit diagnostic, not a hidden creature-identity or collision fallback.
  const safe = name.replace(/[<>&"']/g, '').slice(0, 35);
  const graphic = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">' +
    '<rect width="512" height="512" rx="48" fill="#213640"/>' +
    '<text x="256" y="230" fill="white" font-size="28" text-anchor="middle" font-family="sans-serif">' + safe + '</text>' +
    '<text x="256" y="277" fill="#ffcf7f" font-size="21" text-anchor="middle" font-family="sans-serif">Visuel non configuré</text></svg>';
  const url = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(graphic);
  return { id, name, profile: 'biped', genericFallback: true,
    assetBaseUrl: new URL('../../', import.meta.url).href,
    views: {player:url, opponent:url, icon:url},
    runtimePreview: {player:url, opponent:url, icon:url},
    displayScale:{player:1, opponent:1}, transformOrigin:{x:'50%',y:'88%'},
    offset:{x:0,y:0}, fxAnchors:{player:{head:{x:.5,y:.3}},opponent:{head:{x:.5,y:.3}}} };
}
async function creatureMeta(id, name) {
  const binding = captureCreatureVisualBindingForIdV1(id);
  if (!binding?.metaFile) return explicitMissingVisual(id, name);
  const url = globalVisualAssetUrl(binding.metaFile);
  const meta = await readJson(url);
  return { ...meta, id, name, assetBaseUrl: new URL('.', url).href, genericFallback: false };
}
function showOfficialCombatTemplate(source) {
  return fetch('./capture-editor-v2.html', {cache:'no-cache'}).then(async response => {
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
  const handoff = readCombatHandoff(sessionStorage);
  if (!handoff || handoff.result) throw new Error('EncounterSnapshot v1 absent ou déjà terminé');
  const [creatures,party,skillCatalog,baseRules,...profiles] = await Promise.all([
    readJson(resource('data/capture/monster-capture-creatures.v1.json')),
    readJson('./party.preview.v1.json'),
    readJson(resource('data/combat/skills/catalog.v1.json')),
    readJson(resource('data/combat/fighters/maraileron.combat.json')),
    ...['biped','flying','massive','quadruped','serpentine'].map(id =>
      readJson(resource('data/profiles/' + id + '.profile.json')))
  ]);
  const nativeCombatSource = buildExplorationNativeCombatSourceV1({
    snapshot:handoff.snapshot, creatureRecords:creatures.entries, party,
    nativeSkillCatalog:skillCatalog,baseFighterRules:baseRules
  });
  const root = await showOfficialCombatTemplate(nativeCombatSource);
  const metas = await Promise.all(nativeCombatSource.battleFormat.actors.map(actor =>
    creatureMeta(actor.creatureId, actor.displayName)));
  mountedVisuals = await mountCombatDemo({root,nativeVisualSource:{profiles,creatureMetas:metas}});
  mountedCombat = await mountCoop2v2Test({
    root, visuals:mountedVisuals, nativeCombatSource,
    presentationAssets:demoPresentationAssets
  });
  observeNativeBattleResult(mountedCombat, completeBattle);
  message('Combat réel · moteur officiel et créatures Capture');
}
function dispose() {
  if (watchId !== null) { cancelAnimationFrame(watchId); watchId = null; }
  mountedCombat?.dispose(); mountedCombat = null;
  mountedVisuals?.dispose(); mountedVisuals = null;
}
window.addEventListener('pagehide', dispose, {once:true});
launch().catch(error => { dispose(); message('Combat indisponible : ' + error.message, true); console.error(error); });
