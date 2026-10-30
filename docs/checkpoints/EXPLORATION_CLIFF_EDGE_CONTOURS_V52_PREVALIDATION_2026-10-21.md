# Exploration — V52 Bordure rocheuse extérieure + arrondi optionnel — prévalidation du 21/10/2026

## Retour créateur
V50 falaises HD (texture rocheuse et dégradé) esthétiquement validé ; capture montre une bande gris/vert uniforme au bord inférieur extérieur de la map. Besoin distinct : pouvoir arrondir ou adoucir les angles de falaise **seulement où l'utilisateur peint**, à la manière de l'eau V46, en gardant le relief/collision tels quels.

## Gouvernance et source
- Socle V51 : `f2d62a3b0d5dbcf95a879b79bdfdb36ae3e86c6c`, checkpoint `checkpoint/exploration-bridge-picker-v51-prevalidation-2026-10-21` ; V50 base `d43d58494bc1f918bcb213846501bc790774ed02`.
- START : `checkpoint/exploration-start-cliff-edge-contours-v52-2026-10-21` ; travail `work/exploration-cliff-edge-contours-v52-2026-10-21`.
- Source runtime testée : `a345a12e4ac222d65618bea9852f0c1e0a8a9476`, [CI #39541477941](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39541477941) SUCCESS, parcours Chromium incluant le rendu pixel du bord et geste pinceau/Undo.
- Le checkpoint de prévalidation est à créer sur le SHA documentaire final après CI. GREEN utilisateur non déclaré.

## Implémentation
- Nouveau `sculptOuterSouthCliffRuns(terrain)` dérive les parois uniquement des hauteurs de la dernière rangée **sèche** du heightfield ; fusionne les segments adjacents de même niveau/profil.
- Réemploi de la seule fonction `rockFace` sur le bord **sud frontal**, dans `drawSculptTerrain` : textures natives HD V50, palettes existantes et dégradé d'ombre ; aucun asset ou grille fantôme.
- Nouveau mode de pinceau `cliff-round` dans la palette Terre : écrit uniquement `terrain.roundness[]` via `applySculptStroke` et le footprint actuel. Le contrôle d'arrondi 0…150 % existant détermine la douceur au passage ; aucune modification rétroactive si l'on bouge seulement le curseur.
- `levels[]` et `waterLevels[]` restent **strictement identiques** (jusqu'à la référence JS pour les niveaux), avec undo/redo et sérialisation v1 existants.
- Les nouvelles falaises extérieures n'entrent jamais dans `sculptFaces`, `Collision World`, le mouvement ou la traversée.

## Sentinelles et tests
- `tests/sculpt-cliff-map-edge-v52.test.js` : masques bord sud/eau, segments / profils 0…150, source immuable, hauteur/eau inchangés, export/import/Undo, absence de deuxième géométrie.
- `scripts/smoke-sculpt-terrain-lab.mjs` : clic réel du pinceau (seul `roundness` change), Undo exact, comparaison de pixels sur la paroi extérieure vs herbe ; garde V47 conservée sur la surface plane, sans traiter la nouvelle paroi comme une régression.
- V50 falaises et Atlas HD, eau V46, V51 ponts/28 vues, 6 bâtiments, caméra, navigation, collision et Combat inchangés.
- [CI #39541477941](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39541477941) SUCCESS (core-tests et modern-combat-encounter).

## Gate et suivi
- Le contrôle utilisateur visuel/smartphone, en mode caméra 35°/90°, et l'essai du sélecteur de ponts restent nécessaires avant GREEN esthétique.
- Test manuel recommandé : carte plate avec bord sud, falaise plateau élevée, proximité eau, pinceau 0 puis 150 %, sauvegarde/réouverture, changement de palette et essai objets ponts.
- Publication Pages uniquement par PR infrastructure modifiant la référence immuable après CI sur SHA final ; aucun changement runtime sur `main`.
