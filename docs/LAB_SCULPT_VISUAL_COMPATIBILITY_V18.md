# Labo sculpture — Audit de compatibilité visuelle V18

## Périmètre du lot

Source : checkpoint V17 `babb31eff6bafc8423f06af6a833e1b5a41ba0c8`.
Les textures déjà présentes sont exposées par le Material Registry et résolues par `src/assets/material-asset-adapter.js`.
Aucun nouvel asset binaire, aucune copie depuis Dungeon ou Combat et aucun nouveau registre.
Le `sculpt-height-model` conserve exactement le JSON `schemaVersion:1` et la propriété des hauteurs d'eau/terre.

## Prêts pour la preview sculptable

| Catégorie | Identifiants canoniques | Justification |
|---|---|---|
| Surface | `grass.forest`, `ground.forest_floor`, `ground.mountain_rock`, `ground.snow`, `ground.sand`, `ground.volcanic_ash_lava` | Déjà déclarés dans le pack et fichiers WebP locaux, modifient uniquement la texture au sommet |
| Eau | `water.clear_blue`, `water.turquoise`, `water.forest_stream`, `water.swamp` | Texture + teinte déjà déclarées, appliquées au même volume d'eau sculpté ; pas de nouvelle géométrie ni de nouvelle profondeur |
| Routes | `road.dirt` | Représentation de démonstration en ruban, pas encore une route sculptée canonique |
| Personnage de test | `actor.demo.hero.traveler.01` | Source SVG déjà dans `assets/exploration/actors/demo` et résolue par `map-actor-asset-adapter`, uniquement banc de test navigation |
| Parois rocheuses | palettes procédurales de `sculpt-height-renderer.js` | Respectent les vraies différences d'altitude, les contours par coup de pinceau et le nouveau comportement Eau/Terre |

## À réévaluer avant utilisation gameplay/production

- **Falaises SVG historiques** (`cliff_corner_01.svg`, `cliff_broken_ledge_02.svg`, `cliff_grassy_edge_01.svg`) : silhouettes d'objets fixes. Ne doivent pas remplacer ni masquer la topographie sculptée par une seconde géométrie; un traitement de façade basé sur `sculptFaces` sera nécessaire.
- **Cascade `waterfall_blue_01.svg`** : affichage uniquement après une règle topologique claire (écoulement d'un niveau supérieur vers un inférieur), sans hydrodynamique inventée.
- **Arbres / rochers WebP** : fichiers disponibles dans `assets/exploration/objects/{trees,rocks}` mais pose, occlusion, empreinte et collision doivent réutiliser les contrats WorldObject. Pas de collage direct dans la heightmap V18.
- **Lave** (`water.lava`) : texture disponible mais sémantiquement dangereuse tant que la nage de test se base sur la simple présence d'un volume d'eau ; ne pas la proposer comme « eau nageable ».
- **Canyon `water.canyon_turquoise`** : matériau volontairement dépourvu de texture centrale, conçu pour un autre rendu vectoriel continu. Demande un portage visuel dédié plutôt qu'un faux fallback.
- **Textures 128×128** : pack classé `mobile-test-128` dans le manifeste ; rendu exploitable en preview, validation artistique et éventuels remplacements HD à prévoir.

## Tests et invariants

- Les sélecteurs changent uniquement `materialId` dans l'UI de prévisualisation et la résolution d'image par registre.
- Les champs `levels`, `waterLevels`, `roundness` ne sont jamais écrits lors des changements visuels.
- L'eau V13/V16, les outils de sculpture, la navigation V17 et le bouton Retour Éditer sont inchangés.
- Images téléchargées via l'adapter existant, test navigateur vrai changement de pixels et JSON identique.
- Validation réelle smartphone et validation esthétique par le créateur restent distinctes de la CI.
