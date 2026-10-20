# Exploration — V43 Toolbar paysage et déplacement objets — prévalidation (20/10/2026)

## Demande et base
- Retour créateur sur capture : V42 est « juste parfait ». La barre d'outils est écrasée en coin supérieur gauche alors qu'il reste de l'espace ; en mode sélection d'objet, le glisser au doigt doit repositionner son placement.
- Source de départ compatible V42 et arbres publiés : `dc8cb651e88916332515aa2ff6e0846af362bba0`.
- Checkpoint START : `checkpoint/exploration-start-sculpt-toolbar-drag-v43-2026-10-20`.
- Branche du lot : `work/exploration-sculpt-toolbar-drag-v43-2026-10-20`.
- Code figé sur `29e85ef92f1d07f42edafa7f79429bb4377afb7d`.
- Checkpoint de prévalidation : `checkpoint/exploration-sculpt-toolbar-drag-v43-prevalidation-2026-10-20` sur le même SHA.

## Propriétaires et portée
- CSS unique de la barre `editor-switch`, immersive responsive jusqu'à 900 px, défilement horizontal lorsque la largeur du téléphone ne suffit pas.
- Object model existant `WorldObjectPlacement` / `updateSculptPreviewObject` étendu aux coordonnées x/y ; aucune deuxième autorité.
- `src/sculpt-lab-main.js` : édition Obj > Sélectionner / modifier, capture pointer id, monde obtenu via inverse exact de la caméra, origine et décalage stables, déplacement continu dans la carte en cellule sèche, commit undo/redo unique sur pointerup, retour à la position de départ sur pointercancel/lostpointercapture, aucune action lors d'un clic sans mouvement.
- Préserve rotation, variante, taille, identité, scène JSON ; collisions, acteurs, rencontres, combat, caméra, ciel, eau et relief inchangés.

## Preuves et gates
- npm test : 620/620 PASS et `npm run check` PASS.
- [Source CI #39415813739](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39415813739) SUCCESS avec Chromium, Builder et Combat.
- [Checkpoint CI #39416065165](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39416065165) SUCCESS.
- [Pages PR #184](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/184) fusion infrastructure uniquement, main `776292d81671edecd22ad6a11b1ab123de67865f` ; [Pages #39416225444](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39416225444) SUCCESS épinglant précisément la source figée.
- V43 Chromium : fenêtre 1100 px, barre 900 px (boutons >90 px), glissement réel objet (266, 136.5) vers (306.32,149.1) en préservant variante, rotation et JSON ; undo/redo complet ; geste tactile interrompu restaure l'objet sans ajouter d'undo. Anciennes sentinelles terrain, eau, caméra, V42 acteurs restent PASS.

## Gate restant
- **Attente validation visuelle et gestuelle smartphone du créateur** avant GREEN final.
- Preview : https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=43
- Prochain chantier distinct : raccord rencontres Capture #177 après accord visuel ; texture #181 et verrouillage créateur #180 sont différés.
