import {
  readCombatHandoff,
  consumeCombatResult
} from './combat-handoff-store.js?rev=phase7-combat-handoff-v1';

export const IMMERSIVE_COMBAT_COMPLETE_TYPE_V1 =
  'gensrpg.capture.combat-complete.v1';

// Exploration owns the screen and the World state. Combat owns its own
// document, skills and result; the only shared interface is the versioned
// sessionStorage envelope plus a verified same-origin completion signal.
export function createImmersiveEncounterHostV1({
  windowRef = globalThis.window,
  documentRef = globalThis.document,
  storage,
  sessionId,
  onCompleted,
  onAcknowledged,
  onFailure,
  screenRef = globalThis.screen
}) {
  if (!windowRef || !documentRef || !storage ||
      typeof onCompleted !== 'function') {
    throw new TypeError('immersive Encounter host requires window, document, storage and completion callback');
  }

  let active = null;
  let disposed = false;

  // Presentation-only cross-frame contract: the Capture parent alone owns
  // Sac/Equipe HUD visibility; Exploration alone owns combat overlay lifetime.
  // Never send CombatResult, HP, movement or saved state through this event.
  function notifyCaptureCombatVisibility(visible, encounterId) {
    if (sessionId===undefined || !windowRef.frameElement ||
        typeof windowRef.parent?.postMessage!=='function') return;
    windowRef.parent.postMessage({
      schema:'gensrpg.exploration.combat.visibility.v1',
      sessionId, encounterId, visible
    }, windowRef.location.origin);
  }

  function close() {
    if (!active) return false;
    const old = active;
    active = null;
    old.overlay.remove();
    notifyCaptureCombatVisibility(false, old.snapshot.encounterId);
    return true;
  }

  function onCombatComplete(event) {
    if (!active || disposed ||
        event.origin !== windowRef.location.origin ||
        event.source !== active.frame.contentWindow ||
        event.data?.encounterId !== active.snapshot.encounterId ||
        event.data?.returnToken !== active.snapshot.returnToken) return;
    if(event.data.type==='gensrpg.capture.combat-ready.v1'){
      // Display only after the actual official Combat renderer finished mounting.
      active.frame.dataset.combatReady='true';
      active.frame.style.opacity='1';
      active.frame.style.pointerEvents='auto';
      active.loading?.remove();
      return;
    }
    if(event.data.type==='gensrpg.capture.combat-failed.v1'){
      if(active.loadingMessage)active.loadingMessage.textContent=
        'Combat indisponible : '+String(event.data.message??'ressources non chargées');
      onFailure?.(new Error(String(event.data.message??'Échec du chargement du Combat')));
      return;
    }
    if(event.data.type!==IMMERSIVE_COMBAT_COMPLETE_TYPE_V1)return;

    // A postMessage is never authority for battle victory/defeat. Only the
    // existing contract-validated CombatResult written by Combat may finish.
    let envelope;
    try{
      envelope=readCombatHandoff(storage,{sessionId});
    }catch(error){
      console.error('Combat journal could not be read:',error);
      onFailure?.(error);
      return;
    }
    if (!envelope?.result ||
        envelope.snapshot.encounterId !== active.snapshot.encounterId ||
        envelope.snapshot.returnToken !== active.snapshot.returnToken ||
        envelope.result.encounterId !== active.snapshot.encounterId ||
        envelope.result.returnToken !== active.snapshot.returnToken) return;

    const battle=active;
    if(battle.finishing)return;
    const fail=error=>{
      battle.finishing=false;
      if(active===battle){
        console.error('Combat result could not be applied to Exploration:',error);
        onFailure?.(error);
      }
    };
    const acknowledge=receipt=>{
      if(active!==battle||disposed)return;
      battle.finishing=false;
      if(receipt===false||!consumeCombatResult(storage,{sessionId,receipt}))return;
      close();
      onAcknowledged?.(envelope);
    };
    try{
      const receipt=onCompleted(envelope);
      if(sessionId!==undefined&&typeof receipt?.then==='function'){
        battle.finishing=true;
        void Promise.resolve(receipt).then(acknowledge).catch(fail);
      }else{
        acknowledge(receipt);
      }
    }catch(error){fail(error);}
  }

  windowRef.addEventListener('message', onCombatComplete);

  function enterFullscreenFromCombatClick() {
    // In an embedded AdventureSession the host Capture owns fullscreen.
    // Taking fullscreen on the nested Exploration document hides the parent's
    // Sac/Équipe after the Combat overlay closes: preserve that top layer.
    if(sessionId!==undefined&&windowRef.frameElement)return;
    // Called synchronously from the existing "Lancer le combat" tap.
    // A new page would lose the activation and the fullscreen document.
    const host = documentRef.documentElement;
    if (documentRef.fullscreenElement || typeof host.requestFullscreen !== 'function') {
      return;
    }
    try {
      const request = host.requestFullscreen({ navigationUI: 'hide' });
      Promise.resolve(request).then(async () => {
        if (documentRef.fullscreenElement) {
          try { await screenRef?.orientation?.lock?.('landscape'); }
          catch { /* Only the CSS viewport is guaranteed. */ }
        }
      }).catch(() => { /* Chrome may reject; the viewport overlay still works. */ });
    } catch {
      // Browser refuses Fullscreen API: no popup, second tap, or retry timer.
    }
  }

  return Object.freeze({
    open({ url, snapshot }) {
      if (disposed) throw new Error('immersive Encounter host disposed');
      if (active) return false;
      if (!snapshot?.encounterId || !snapshot?.returnToken) {
        throw new TypeError('Combat Encounter correlation is required');
      }
      const target = new URL(url, windowRef.location.href);
      if (target.origin !== windowRef.location.origin) {
        throw new RangeError('Encounter iframe origin must match Exploration');
      }
      if (!target.pathname.endsWith('/combat-preview/examples/dom-demo/exploration-encounter.html')) {
        throw new RangeError('Encounter iframe must use packaged Combat entry');
      }

      enterFullscreenFromCombatClick();
      const overlay = documentRef.createElement('section');
      overlay.className = 'combat-overlay';
      overlay.dataset.combatOverlay = 'active';
      const frame = documentRef.createElement('iframe');
      frame.className = 'combat-overlay__frame';
      frame.title = 'Combat Monster Capture';
      frame.setAttribute('allow', 'fullscreen; autoplay');
      frame.dataset.combatReady='false';
      frame.style.opacity='0';
      frame.style.pointerEvents='none';
      overlay.append(frame);
      const loading=documentRef.createElement('div');
      loading.className='combat-overlay__loading';
      loading.setAttribute('role','status');
      loading.setAttribute('aria-live','polite');
      const brand=documentRef.createElement('strong');
      brand.className='combat-overlay__brand';
      brand.textContent='GenSRPG';
      const message=documentRef.createElement('p');
      message.textContent='Préparation de l’arène et des créatures…';
      const spinner=documentRef.createElement('span');
      spinner.className='combat-overlay__spinner';
      spinner.setAttribute('aria-hidden','true');
      const cancel=documentRef.createElement('button');
      cancel.type='button';
      cancel.textContent='Annuler le chargement';
      cancel.onclick=()=>close(); // No fake result or snapshot consumption.
      loading.append(brand);loading.append(spinner);loading.append(message);loading.append(cancel);
      overlay.append(loading);
      documentRef.body.append(overlay);
      active = { overlay, frame, snapshot, loading, loadingMessage:message };
      notifyCaptureCombatVisibility(true, snapshot.encounterId);
      frame.src = target.href;
      return true;
    },
    close,
    get active() { return active !== null; },
    dispose() {
      if (disposed) return;
      close();
      windowRef.removeEventListener('message', onCombatComplete);
      disposed = true;
    }
  });
}
