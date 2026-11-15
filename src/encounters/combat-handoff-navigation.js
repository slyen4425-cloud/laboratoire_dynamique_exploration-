import {
  saveCombatHandoff,readCombatHandoff
} from './combat-handoff-store.js?rev=phase7-combat-handoff-v1';

export const DEFAULT_COMBAT_PREVIEW_PAGE =
  './combat-preview/examples/dom-demo/exploration-encounter.html';

// Le chemin est fourni par la future intégration, jamais par le contenu
// d'une rencontre ou par un service distant.
export function normalizeLocalCombatPreviewPage(value) {
  if (
    typeof value !== 'string' ||
    !/^\.\/combat-preview\/[a-zA-Z0-9/_-]+\.html$/.test(value) ||
    value.includes('..')
  ) {
    throw new RangeError('combat preview page must be a local packaged HTML page');
  }
  return value;
}

export function launchCombatHandoffNavigation({
  snapshot,
  player,
  storage,
  documentUrl,
  sessionId,
  combatPage = DEFAULT_COMBAT_PREVIEW_PAGE,
  navigate = (url) =>
    globalThis.location.assign(url)
}) {
  if (!snapshot) return false;

  const currentUrl = new URL(
    documentUrl
  );
  const returnUrl = new URL(
    currentUrl.href
  );
  returnUrl.searchParams.set(
    'combatReturn',
    '1'
  );

  const bridgeUrl = new URL(
    normalizeLocalCombatPreviewPage(combatPage),
    currentUrl
  );

  if (sessionId !== undefined) {
    if (currentUrl.searchParams.get('adventureSession') !== sessionId) {
      throw new RangeError('Combat handoff requires the current Adventure session identity');
    }
    bridgeUrl.searchParams.set('adventureSession', sessionId);
  }

  saveCombatHandoff(
    storage,
    {
      snapshot,
      returnState: {
        areaId: player.currentAreaId,
        x: player.x,
        y: player.y,
        returnUrl: returnUrl.href
      }
    },
    { sessionId }
  );

  navigate(
    bridgeUrl.href
  );

  return true;
}

// Resume the EXACT unsettled encounter. Never overwrite the stored snapshot,
// its return coordinates or a CombatResult that has not been acknowledged.
// The official fixed packaged page remains the only permitted destination.
export function resumePendingCombatHandoffNavigation({
 snapshot,storage,documentUrl,sessionId,
 combatPage=DEFAULT_COMBAT_PREVIEW_PAGE,
 navigate=(url)=>globalThis.location.assign(url)
}={}){
 const pending=readCombatHandoff(storage,{sessionId});
 if(!pending||pending.result||
    JSON.stringify(pending.snapshot)!==JSON.stringify(snapshot))
   throw Error('Le combat précédent doit être récupéré avant de continuer');
 const current=new URL(documentUrl);
 const origin=new URL(pending.returnState.returnUrl);
 if(current.origin!==origin.origin||current.pathname!==origin.pathname)
   throw Error('La page de retour du combat précédent ne correspond pas');
 if(sessionId!==undefined&&current.searchParams.get('adventureSession')!==sessionId)
   throw Error('La session Aventure du combat précédent ne correspond pas');
 const target=new URL(normalizeLocalCombatPreviewPage(combatPage),current);
 if(sessionId!==undefined)target.searchParams.set('adventureSession',sessionId);
 navigate(target.href);
 return true;
}
