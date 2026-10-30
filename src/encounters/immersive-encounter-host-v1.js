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
  onCompleted,
  screenRef = globalThis.screen
}) {
  if (!windowRef || !documentRef || !storage ||
      typeof onCompleted !== 'function') {
    throw new TypeError('immersive Encounter host requires window, document, storage and completion callback');
  }

  let active = null;
  let disposed = false;

  function close() {
    if (!active) return false;
    const old = active;
    active = null;
    old.overlay.remove();
    return true;
  }

  function onCombatComplete(event) {
    if (!active || disposed ||
        event.origin !== windowRef.location.origin ||
        event.source !== active.frame.contentWindow ||
        event.data?.type !== IMMERSIVE_COMBAT_COMPLETE_TYPE_V1 ||
        event.data.encounterId !== active.snapshot.encounterId ||
        event.data.returnToken !== active.snapshot.returnToken) return;

    // A postMessage is never authority for battle victory/defeat. Only the
    // existing contract-validated CombatResult written by Combat may finish.
    const envelope = readCombatHandoff(storage);
    if (!envelope?.result ||
        envelope.snapshot.encounterId !== active.snapshot.encounterId ||
        envelope.snapshot.returnToken !== active.snapshot.returnToken ||
        envelope.result.encounterId !== active.snapshot.encounterId ||
        envelope.result.returnToken !== active.snapshot.returnToken) return;

    try {
      if (onCompleted(envelope) === false) return;
    } catch (error) {
      console.error('Combat result could not be applied to Exploration:', error);
      return;
    }
    consumeCombatResult(storage);
    close();
  }

  windowRef.addEventListener('message', onCombatComplete);

  function enterFullscreenFromCombatClick() {
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
      overlay.append(frame);
      documentRef.body.append(overlay);
      active = { overlay, frame, snapshot };
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
