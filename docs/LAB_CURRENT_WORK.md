# LAB_CURRENT_WORK — World Builder: boutons Entrer, carte vierge et bibliothèque de présets

Date : 2026-10-28. Branche : `work/exploration-world-map-presets-traverse-2026-10-28`. Base : `361eac2473cb5b7bf655ee10cd980f5f18d52ef3` (PR #269, 862 tests + Chromium publié via Pages). START : `checkpoint/exploration-start-world-map-presets-traverse-2026-10-28`.

## Bugs reproduits à la source
1. `#world-portal-traverse` porte seulement `.in-game-door-action`, mais seul `#navigation-area-door.in-game-door-action` reçoit `position:absolute` et les dimensions : le bouton est rendu dans le flux, souvent hors du terrain. En outre il est entièrement caché hors du rayon (aucune indication).
2. `new-map-toggle` est désactivé lorsque `sculptWorldDraft` existe. Cette protection prévient le redimensionnement de la WorldArea, mais bloque même le nettoyage de son contenu.
3. `sculpt-lab.html` est bien le même éditeur sculptable utilisé en mode libre et World Builder, via `readWorldAssemblerHandoff` et `saveSculptWorldArea`, mais aucune bibliothèque durable de scènes préréglées réutilisable dans le World Builder.

## Contrat
- Même `Portal.trigger` et `findTriggeredPortal` propriétaires : bouton visible en Tester si passage sortant, désactivé tant que hors portée, activé à proximité ; aucune auto-transition cachée, pas de géométrie dupliquée.
- Nouvelle carte vierge fonctionnelle en WorldArea avec dimensions *fixes*, aucune suppression des Portals/Spawns ni du WorldDocument, pas de reset mondial des rencontres. Confirmation avant effacement.
- Bibliothèque de présets de carte indépendante des sauvegardes de monde : snapshots terrain + surface + objets + acteurs, sans identité de zone, sans Portals/Spawn/EncounterConfig. Une seule commande `saveSculptWorldArea` pour appliquer une scène à une WorldArea.
- Stockage local explicite, export/import JSON présets pour migration et récupération ; aucun double propriétaire. Nom et sélection via menus, pas d'ID manuel.
- Ajouter dans World Builder la création d'une nouvelle zone/instance depuis un préset. Donjon : relié à la zone hôte sélectionnée selon `connectWorldAreas` canonique.
- Navigation de retour vers le World Builder = sauvegarde/handoff atomique, y compris lien d'en-tête.
- TDD RED, puis `npm test`, `npm run check`, Chromium réel tactile paysage, CI et publication isolée ; production V80 inchangée. Validation smartphone avant promotion gameplay.
