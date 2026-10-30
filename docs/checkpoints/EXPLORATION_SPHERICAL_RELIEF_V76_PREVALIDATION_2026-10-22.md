# Exploration V76 — prévalidation technique des reliefs sphériques (22/10/2026)

## Départ et gouvernance
- Dernier GREEN créateur V75 R2 : `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Checkpoint pré-chantier : `checkpoint/exploration-start-spherical-relief-v76-2026-10-22` sur ce SHA exact.
- Branche de travail unique : `work/exploration-spherical-relief-v76-2026-10-22`.
- Le checkout Pages `main` reste une coquille d'infrastructure. Aucun code métier ni asset n'est fusionné dans main.
- Collisions, ponts V73, assets V74 et cascades V3 conservés, sans rollback : compare V75 → V76 ne touche **aucun** fichier `assets/`.

## Fonction et vraie géométrie
- `sculpt-height-model.js` possède les primitives `terrain.spheres[]`, chacune un centre monde `x/y`, rayon circulaire, hauteur, base, type `hill/basin`.
- Profil analytique continu : `±height × sqrt(1 - (r/R)²)` pour `r < R`, nul ailleurs. Une calotte de sphère 3D et sa cavité partagent ce calcul, sans interpoler ni rendre "ronds" les rectangles de grille historique.
- Le renderer Canvas triangule ce modèle en sous-cellules fines ; les cases du terrain original demeurent inchangées.
- Le Collision World lit le **même rayon canonique** ; le marcheur ne gravit ni ne tombe dans ces formes avant les pentes explicitement éditées V77. Vol conservé.
- Outils Terre V76 (poser colline, poser cavité, effacer), rayon via Taille, amplitude via Hauteur, un seul objet par geste, Undo/Redo. JSON scène/hauteurs export et import réversible. Anciens JSON `schemaVersion:1` sans `spheres` restent lisibles.

## Limites assumées pour V76
- Pose uniquement sur une empreinte plane et sèche ; pas de chevauchement des calottes. Édition des hauteurs sous une calotte bloquée pour éviter un terrain à deux autorités.
- Le contour d'une forme est exactement circulaire en X/Y du monde ; les angles de caméra peuvent le projeter visuellement en ellipse, ce qui est une perspective normale, pas une case.
- La hauteur d'une calotte n'octroie aucune possibilité de marche ; pentes V77 et escaliers V78 seront des autorisations de Collision World séparées.
- Pas de refonte de l'ancien pinceau d'arrondi purement visuel dans ce lot.

## Preuves techniques
- Node `tests/sculpt-spherical-relief-v76.test.js` : symétrie, sommet/cuvette, bord extérieur, sérialisation, Undo suppression, empreinte, `isBlocked/stepMovement`, vol, rendu Canvas.
- Chromium `scripts/smoke-sculpt-terrain-lab.mjs` : vraie pose sur canvas par souris, boutons actuels, scène `spheres`, Undo/Redo et import re-export, sentinelles ponts/eau/Combat historiques.
- Source avec tous tests et documentation de reprise SHA `d377a78cd249ccbde89bb7c2c80ee40977aed38f` : CI complète [SUCCESS #39854564158](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39854564158).
- Le présent document ajoute un nouveau SHA qui requiert encore sa propre CI SUCCESS avant création du checkpoint prévalidation et publication Pages.

## Critère d'acceptation Pixel
V76 **NON GREEN créateur**. Vérifier à l'écran que colline et creux sont circulaires sans cubes, taille et hauteur bien réglables, outils compréhensibles en paysage, marche/vol, Undo, sauvegarde, ponts, cascades et FPS. V77 et V78 restent gelés jusqu'à accord explicite.
