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


## État technique — 2026-10-01

Implémentation :
- sampling déterministe des courbes ;
- ruban texturé segmenté pour route -> herbe ;
- ruban texturé segmenté pour eau -> berge ;
- continuité de phase texture par longueur cumulée ;
- centre route/rivière redessiné par-dessus la transition ;
- decals feuilles/racines déterministes ;
- paramètres decals dans Material Pack ;
- fallback procédural conservé si un asset n'est pas prêt.

Aucune modification :
- points des routes ;
- largeur des routes ;
- points des rivières ;
- largeur des rivières ;
- collision ;
- mouvement ;
- caméra.

## Tests
CI finale technique :
run `36901333447` — SUCCESS.

Sentinelles ajoutées :
- sampling conserve les endpoints ;
- distance cumulée croissante ;
- découpe texture couvre exactement le segment ;
- layout decal déterministe/borné ;
- configuration decal protégée.

## Validation restante
Preview smartphone requise :
- bord route/herbe naturel ;
- berge rivière/herbe naturelle ;
- absence de cassures importantes dans les virages ;
- decals visibles mais discrets ;
- aucune baisse de fluidité perceptible.

Aucun checkpoint GREEN fonctionnel avant validation utilisateur.


## Validation utilisateur — 2026-10-01
Test smartphone validé.

L'utilisateur valide :
- Material Pack v1 ;
- textures pilotes forêt / route / rivière ;
- transitions route -> herbe ;
- berge rivière -> herbe ;
- decals forêt ;
- fluidité et cohérence générale du rendu.

Le parent Material Pack v1 est considéré validé à travers ce jalon descendant : aucun système concurrent n'est créé.

## Fermeture
Transition + Decals v1 : **GREEN / terminé**.

Le prochain chantier autorisé est un lot distinct :
**World Objects / Bridge v1**.

Le modèle architectural suivant est aussi validé pour les chantiers futurs :
- pont = WorldObject transformable ;
- bâtiment extérieur = WorldObject ;
- intérieur = WorldArea séparée ;
- porte = Portal entre deux Areas ;
- même mécanisme pour étages, grottes et autres espaces liés.
