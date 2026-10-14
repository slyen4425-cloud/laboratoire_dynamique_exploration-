import {
  saveCombatHandoff
} from './combat-handoff-store.js?rev=phase7-combat-handoff-v1';

export const DEFAULT_COMBAT_PREVIEW_PAGE =
  './combat-preview/examples/dom-demo/exploration-encounter.html';

// Le chemin est fourni par la future intégration, jamais par le contenu
// d'une rencontre ou par un service distant.
export function normalizeLocalCombatPreviewPage(value) {
  if (
    typeof value !== 'string' ||
    !/^\\.\\/combat-preview\\/[a-zA-Z0-9/_-]+\\.html$/.test(value) ||
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
