import {
  saveCombatHandoff
} from './combat-handoff-store.js?rev=phase7-combat-handoff-v1';

export function launchCombatHandoffNavigation({
  snapshot,
  player,
  storage,
  documentUrl,
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
    './combat-preview/examples/dom-demo/exploration-encounter.html',
    currentUrl
  );

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
    }
  );

  navigate(
    bridgeUrl.href
  );

  return true;
}
