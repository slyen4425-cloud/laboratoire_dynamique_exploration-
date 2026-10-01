# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Transition + Decals v1 — raccord visuel organique du Material Pack.

## Branche
`work/exploration-transition-decals-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-transition-decals-v1-2026-10-01`

## SHA de base
`6da88bae513895510597bf9260293ac7b5c9775e`

## Dépendance
Ce lot part du candidat Material Pack v1, non encore checkpoint GREEN fonctionnel.
Il reste donc dépendant de la validation visuelle finale du parent.

## État gelé
- World Surface Model v1 ;
- géométrie routes/rivières ;
- largeur routes/rivières ;
- mouvement ;
- collisions ;
- caméra ;
- Material Registry ;
- Asset Adapter ;
- assets locaux du pack forêt.

Aucune de ces autorités ne doit être modifiée.

## Objectif
Appliquer proprement :
- transition `road.dirt -> grass.forest` ;
- berge `water.forest_stream -> grass.forest` ;
- decals feuilles/racines sur le sol forêt.

## Principe de rendu
Les assets de transition ne sont pas étirés en une image unique sur toute la route/rivière.

Le renderer :
1. échantillonne la courbe déjà validée ;
2. calcule tangente + longueur cumulée ;
3. déroule la texture de transition le long de la courbe par petits segments ;
4. dessine ensuite le centre texturé de la route/rivière ;
5. place les decals de façon déterministe dans le monde.

La géométrie reste en lecture seule.

## Decals
- placement déterministe ;
- seed visuel dérivé des coordonnées monde ;
- taille/rotation/opacité configurées dans le Material Pack ;
- jamais de collision ;
- jamais d'interaction ;
- dessin avant route/rivière pour que celles-ci restent prioritaires visuellement.

## Fichiers autorisés
- `src/render/surface-renderer.js` ;
- `src/render/path-ribbon.js` ;
- `src/materials/material-pack-v1.js` ;
- tests ;
- documentation.

## Hors périmètre
- nouveaux assets ;
- ponts ;
- bâtiments ;
- Builder ;
- World Generator ;
- collisions ;
- gameplay ;
- modification du World Surface Model ;
- autre dépôt.

## Tests requis
- sampling de courbe déterministe ;
- ruban conserve ordre/longueur sans écrire le monde ;
- layout decals déterministe ;
- Material Pack reste sémantique ;
- tests historiques GREEN ;
- CI GREEN ;
- preview mobile.

## Critère de sortie
Routes/rivières doivent recevoir leurs transitions sans cassure visuelle majeure, les decals doivent enrichir le sol sans l'envahir, et déplacement/camera/collisions doivent rester inchangés.

Aucun checkpoint GREEN fonctionnel avant validation smartphone.
