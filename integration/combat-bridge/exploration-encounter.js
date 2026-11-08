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
import { privateAudioRuntimeAssetV1 } from '../../src/assets/private-audio-runtime-library-v1.js';
import { soundtrackRuntimeAssetV1 } from '../../src/assets/soundtrack-runtime-library-v1.js';
import {
  SOUNDTRACK_STARTER_CATALOG_V1,
  SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1
} from '../../src/assets/soundtrack-starter-catalog-v1.js';
import { createCombatSoundtrackPreviewBridgeV1 } from '../../src/adapters/audio/combat-soundtrack-preview-bridge-v1.js';
import { buildExplorationNativeCombatSourceV1,officialAdventureCombatRequestV1 } from './exploration-native-source-v1.js';
import { readCombatHandoff, saveCombatHandoff } from '../../../src/encounters/combat-handoff-store.js';
import { createCaptureCombatResult } from '../../../src/encounters/capture-combat-result-contract.js';
import {createCombatOutcomeHoldV1} from '../../../src/encounters/combat-outcome-hold-v1.js';
import {captureEncounterVisualFilesV1} from '../../../src/encounters/capture-combat-warmup-v1.js';

const $ = selector => document.querySelector(selector);
const host = $('[data-capture-preview-host]');
const status = $('[data-bridge-status]');
let mountedVisuals = null, mountedCombat = null, watchId = null, completed = false;
let soundtrack = null;
const fullButton = $('[data-encounter-fullscreen]');
const fleeButton = $('[data-encounter-flee]');
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
const encounterSessionId = new URL(document.URL).searchParams.get('adventureSession') ?? undefined;
const handoffScope = { sessionId: encounterSessionId };
const handoffStorage = encounterSessionId === undefined ? window.sessionStorage : window.localStorage;
const scopedReleaseLoadId=encounterSessionId===undefined?null:window.crypto.randomUUID();
const scopedRequest=url=>officialAdventureCombatRequestV1(
  new URL(url,document.baseURI),{
    sessionId:encounterSessionId??null,loadId:scopedReleaseLoadId
  });
async function readJson(url) {
  const request=scopedRequest(url);
  const response = await fetch(request.url,request.init);
  if (!response.ok) throw new Error('Fichier Combat introuvable : ' + url.pathname + ' (HTTP ' + response.status + ')');
  return response.json();
}
function message(text, error = false) {
  status.textContent = text;
  status.dataset.error = String(error);
  status.dataset.ready = String(!error && text.startsWith('Combat réel'));
}
// The exact resolver chain used by the official Capture editor. Encounter
// never owns its own audio library or copies music into world documents.
function resolveOfficialAudioAsset(assetId) {
  return privateAudioRuntimeAssetV1(assetId) ??
    soundtrackRuntimeAssetV1(assetId) ??
    demoPresentationAssets.audioAsset(assetId);
}
// The first real battle touch/keyboard action authorizes music on Android.
// No second "Activer le son" button: the official Combat SoundtrackSession
// owns music, while DomCombatAudio continues to own each SFX.
function startSoundtrackOnGesture() {
  if(soundtrack)return;
  try {
    const bridge=createCombatSoundtrackPreviewBridgeV1({
      project:SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1,
      catalog:SOUNDTRACK_STARTER_CATALOG_V1,
      resolveAudioAsset:resolveOfficialAudioAsset,
      onAudioError:error=>{
        console.warn('Musique Combat non disponible',error);
        // Autoplay may fail in a newly loaded iframe. Retry only on the
        // next actual gameplay gesture, never with a timer or fake click.
        if(error?.name==='NotAllowedError'){
          soundtrack?.dispose();
          soundtrack=null;
        }
      }
    });
    const result=bridge.transitionTo('capture:combat:normal');
    if(result.status!=='playing') {
      bridge.dispose();
      return;
    }
    soundtrack=bridge;
  }catch(error){console.warn('Lecture musique impossible',error);}
}
function startMusicWhenTouched(event){
  if(event.isTrusted===false)return;
  startSoundtrackOnGesture();
}
document.addEventListener('pointerdown',startMusicWhenTouched,{capture:true});
document.addEventListener('keydown',startMusicWhenTouched,{capture:true});

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
    audioAssetForId: resolveOfficialAudioAsset
  });
  return Object.freeze({
    asset:resolveAsset,
    presentationForArena: id=>demoPresentationAssets.presentationForArena(id),
    presentationForSkill(id,context={}) {
      return native.presentationForSkill(id,context) ??
        demoPresentationAssets.presentationForSkill(id,context);
    },
    statusPresentationFor: (id,context={})=>native.statusPresentationFor(id,context),
    audioAsset: id=>native.audioAsset(id)??resolveOfficialAudioAsset(id)
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
    const family = readCombatHandoff(handoffStorage, handoffScope)?.snapshot.context.terrainFamilyId;
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
// Combat already owns the authoritative KO; the result presentation is a
// time-only hold, not another battle engine or a fabricated reward screen.
const outcomeHold=createCombatOutcomeHoldV1({onRelease:completeBattle});
function showNativeCombatOutcome(outcome) {
  if(!outcomeHold.start(outcome))return;
  status.dataset.ending='true';
  message(outcome==='victory'?'Victoire ! · fin du combat':
    outcome==='defeat'?'Défaite · fin du combat':'Fuite · retour en exploration');
}
function recordCombatResult(handoff, outcome, hp, instanceId) {
  const result = createCaptureCombatResult({
    encounterId: handoff.snapshot.encounterId,
    returnToken: handoff.snapshot.returnToken,
    outcome,
    partyState: {
      activeCreatureId: mountedCombat.format.actor('local-1').creatureId,
      hp,
      ...(instanceId === undefined ? {} : {activeInstanceId:instanceId})
    }
  });
  return saveCombatHandoff(handoffStorage, {...handoff, result}, handoffScope).result;
}
function completeBattle(outcome) {
  if (completed) return;
  const handoff = readCombatHandoff(handoffStorage, handoffScope);
  if (!handoff) throw new Error('CombatResult : handoff absent');
  const result = handoff.result ?? recordCombatResult(
    handoff,outcome,mountedCombat.session.snapshot().fighters['local-1'].hp);
  if(result.outcome!==outcome)throw new Error('CombatResult : issue différente du résultat journalisé');
  completed = true;
  if (watchId !== null) cancelAnimationFrame(watchId);
  message(outcome==='victory'?'Victoire · retour en exploration':
    outcome==='defeat'?'Défaite · retour en exploration':'Fuite · retour en exploration');
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
async function readAdventureCombatParty(handoff,bundle){
  // Historical Tester previews package this bridge over older Exploration.
  // Load the scoped readers only when the launched battle belongs to Aventure.
  const [{readWorldAssemblerDraft},{readScopedAdventurePublishedEncountersV1},
    {readScopedAdventurePlayingPartyV1}]=await Promise.all([
    import('../../../src/builder/world-assembler-handoff.js'),
    import('../../../src/encounters/adventure-published-encounters-v1.js'),
    import('../../../src/encounters/adventure-playing-party-v1.js')
  ]);
  const world=readWorldAssemblerDraft(window.localStorage);
  if(!world)throw new Error('Le monde de la partie Aventure est absent');
  const context={
    storage:window.sessionStorage,sessionId:encounterSessionId,worldId:world.id,
    authorSha:bundle.authorSha,engineSha:bundle.engineSha
  };
  const allowedCreatureIds=readScopedAdventurePublishedEncountersV1(context);
  if(!allowedCreatureIds?.includes(handoff.snapshot.opponents[0].creatureId))
    throw new Error('Adversaire absent du Bestiaire autorisé pour cette partie');
  const party=readScopedAdventurePlayingPartyV1({...context,allowedCreatureIds});
  if(!party||party.partyRef!==handoff.snapshot.player.partyRef||party.active.hp===0)
    throw new Error('Combattant Aventure absent ou hors combat');
  return party;
}
async function launch() {
  const handoff=readCombatHandoff(handoffStorage, handoffScope);
  if(!handoff||handoff.result)throw new Error('EncounterSnapshot v1 absent ou déjà terminé');
  // Start downloading the official HUD immediately; independent source data
  // resolves concurrently. Only one build-produced bundle supplies every
  // approved creature/skill, never 70+ independent cold-start requests.
  const templateRequest=scopedRequest('./capture-editor-v2.html');
  const templateResponse=fetch(templateRequest.url,
    encounterSessionId===undefined?{cache:'force-cache'}:templateRequest.init);
  const [testerParty,nativeSkillCatalog,statRegistry,progressionRules,baseFighterRules,
    assetCatalog,...profilesAndBundle] = await Promise.all([
    encounterSessionId===undefined?readJson('./party.preview.v1.json'):null,
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
  const adventureParty=encounterSessionId===undefined?undefined:
    await readAdventureCombatParty(handoff,authorBundle);
  const party=adventureParty
    ?{id:adventureParty.partyRef,activeCreatureId:adventureParty.active.speciesId}
    :testerParty;
  const creatureTransfers=authorBundle.creatureTransfers;
  const skillTransfers=authorBundle.skillTransfers;
  const terrain=handoff.snapshot.context.terrainFamilyId;
  const arenaId=({forest:'forest',snow:'snow',volcano:'lava',mountain:'cave'})[terrain]??'forest';
  const nativeCombatSource=buildExplorationNativeCombatSourceV1({
    snapshot:handoff.snapshot,party,adventureParty,showcaseCreatureTransfers:creatureTransfers,
    showcaseSkillTransfers:skillTransfers,nativeSkillCatalog,statRegistry,
    progressionRules,baseFighterRules,arenaId,previewLevel:20
  });
  // Combat has already applied the creator's HP percentage. An old saved
  // current HP must never exceed that REAL battle maximum on the first frame.
  const initialAdventureHp=adventureParty
    ?(await import('../../../src/encounters/adventure-initial-hp-v1.js'))
      .projectAdventureInitialCombatHpV1({
        savedHp:adventureParty.active.hp,
        maxHp:nativeCombatSource.fighters.find(f=>f.id==='local-1')?.maxHp
      })
    :null;
  const nativeVisualSource=adaptCaptureExportToNativeVisualSourceV1({
    exported:nativeCombatSource.exported,assetCatalog,profiles,assetUrlForFile
  });
  // Real decoded image readiness, not an arbitrary delay or a fake sprite.
  // No battle HUD appears while its own creatures and equipped ability icons
  // are still downloading/decoding. Uses the exact authored catalog and IDs.
  const imageFiles=captureEncounterVisualFilesV1({
    bundle:authorBundle,assetCatalog,party,
    opponentId:handoff.snapshot.opponents[0].creatureId,
    firstPaintOnly:true
  });
  if(imageFiles.length){
    message('Chargement des textures du combat (0 / '+imageFiles.length+')…');
    let ready=0;
    await Promise.all(imageFiles.map(file=>new Promise((resolve,reject)=>{
      // onload is the native readiness signal for the rendered <img>.
      // Image.decode() may stall on some animated WebP/browser combinations;
      // the parent already schedules speculative decoding separately.
      const img=new Image();
      img.decoding='async';
      img.onload=()=>{
        ready++;
        message('Chargement des textures du combat ('+ready+' / '+imageFiles.length+')…');
        resolve();
      };
      img.onerror=()=>reject(new Error('Image officielle indisponible : '+file));
      img.src=assetUrlForFile(file);
    })));
  }
  const root=await showOfficialCombatTemplate(nativeCombatSource,templateResponse);
  mountedVisuals=await mountCombatDemo({root,nativeVisualSource});
  mountedCombat=await mountCoop2v2Test({
    root,visuals:mountedVisuals,nativeCombatSource,
    ...(adventureParty?{embeddedBattle:{initialHpByActor:Object.fromEntries(
      nativeCombatSource.fighters.map(fighter=>[fighter.id,
        fighter.id==='local-1'?initialAdventureHp:fighter.maxHp]))}}:{}),
    presentationAssets:presentationAssetsForSource(nativeCombatSource,assetCatalog)
  });
  if(adventureParty){
    fleeButton.hidden=false;
    fleeButton.addEventListener('click',()=>mountedCombat.flee(),{once:true});
    void mountedCombat.completion.then(({outcome,state})=>{
      if(!mountedCombat)return;
      const resolved=outcome==='flee'?'fled':outcome;
      // Persist the native result immediately. Closing during presentation
      // must leave a recoverable outcome, not a replayable completed battle.
      recordCombatResult(handoff,resolved,state.fighters['local-1'].hp,adventureParty.active.instanceId);
      fleeButton.hidden=true;
      showNativeCombatOutcome(resolved);
    }).catch(error=>message('Résultat de combat non enregistré : '+error.message,true));
  }else{
    observeNativeBattleResult(mountedCombat,showNativeCombatOutcome);
  }
  message('Combat réel · textures et capacités prêtes');
  // Chrome/PWA may allow play after the parent "Tester" gesture. Try once,
  // and fall back to the first battle gesture if autoplay is rejected.
  startSoundtrackOnGesture();
}
function dispose() {
  document.removeEventListener('pointerdown',startMusicWhenTouched,{capture:true});
  document.removeEventListener('keydown',startMusicWhenTouched,{capture:true});
  soundtrack?.dispose(); soundtrack=null;
  outcomeHold.dispose();
  if (watchId !== null) { cancelAnimationFrame(watchId); watchId = null; }
  mountedCombat?.dispose(); mountedCombat = null;
  mountedVisuals?.dispose(); mountedVisuals = null;
}
window.addEventListener('pagehide', dispose, {once:true});
launch().catch(error => { dispose(); message('Combat indisponible : ' + error.message, true); console.error(error); });
