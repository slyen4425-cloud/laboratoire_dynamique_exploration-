# PREVALIDATION — Mobile Landscape & Area Navigation UX v1 — 2026-10-07

## Base

- Base technique : `66586150bcbebc731a0f72b5dc5b6607ae321c85`
- Checkpoint départ : `checkpoint/exploration-start-mobile-landscape-area-navigation-ux-v1-2026-10-07`
- Branche : `work/exploration-mobile-landscape-area-navigation-ux-v1-2026-10-07`

## TDD

- RED : `9c08c403a157dce30afa6ec42ce809de977cbc0e`
- CI RED : `37643376000` — 387/394 GREEN, 7 RED attendus
- Implémentation : `3b9bba858f94a80387335b029ee841d2b8a903ca`
- CI : `37644652710` — 394/394 GREEN + syntax check GREEN

## Contrat livré

- plein écran map mobile avec fallback CSS ;
- tentative progressive de verrouillage paysage ;
- guidance paysage runtime + Builder en portrait ;
- raccourci extérieur -> intérieur depuis le Portal canonique du Building sélectionné ;
- raccourci intérieur -> extérieur depuis le Portal retour canonique ;
- une seule mutation d'état UI centralisée pour `selectedAreaId` ;
- aucun nouveau champ WorldDocument/WorldArea/Building/Portal ;
- aucun changement de moteur Encounter ou Combat ;
- aucun changement dans `Zombicide-40k`.

## Gate

Prévalidation uniquement. GREEN FINAL interdit avant test smartphone du créateur.
