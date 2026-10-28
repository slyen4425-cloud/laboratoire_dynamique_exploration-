# LAB_CURRENT_WORK — Repères d'entrées/arrivées et parcours testable du World Builder

Ouverture : 2026-10-28
Branche : `work/exploration-portal-visibility-test-2026-10-28`
Base CI GREEN : `4dba6c72ed33ff1d996b2a53100f8db795175fb9` (857 tests, Chromium 2,5D/tactile et traversée, publiée isolément).
Checkpoint avant code : `checkpoint/exploration-start-portal-visibility-test-2026-10-28`.

## Reproduction
L'éditeur 2,5D affiche les Portals sortants comme des cercles anonymes, mais ne dessine aucun point d'arrivée (Spawn des Portals entrants). « Tester » ne mentionne pas l'action manuelle nécessaire pour franchir le passage : le bouton « Entrer » n'apparaît qu'une fois le héros près du Portal. L'utilisateur ne peut ni reconnaître clairement entrée/sortie, ni personnaliser son libellé.

## Périmètre
- Affichage, depuis les autorités existantes `Portal.trigger`, `Portal.visual` et `WorldArea.spawns`, des repères SORTIE, ARRIVÉE (et DÉPART initial) sur le terrain 2,5D.
- Repère de sortie accompagné de la destination ; arrivée accompagnée de sa provenance. Éviter les repères dupliqués lorsqu'un Spawn reçoit plusieurs liens.
- Libellé de repère éditable via le `visual.label` canonique du Portal : pas de deuxième liste de coordonnées ni de mapping parallèle.
- En mode Tester, montrer les sorties réelles et expliquer qu'il faut rejoindre le cercle puis appuyer sur « Entrer » pour charger la WorldArea cible.
- Préserver le radius de gameplay à l'écran, sans dessiner une zone d'interaction trompeuse. L'édition et les transitions demeurent sur les contrôleurs et documents propriétaires.

## Validation
TDD RED puis GREEN : tests déterministes pour repères séparés, labels et déduplication, export/import WorldDocument inchangé, vrai `findTriggeredPortal` + `applyPortalTransition`. `npm test`, `npm run check` et CI Chromium smartphone paysage. Vérification publication isolée /preview/encounters-v80/, sans toucher à V80.
Validation utilisateur sur téléphone avant promotion gameplay ou fusion.

## Hors périmètre
Pas d'auto-téléportation au contact, de nouvelle géométrie, de nouveaux ports de stockage, de fusion dans GenSrpg ni de changement du moteur Combat.
