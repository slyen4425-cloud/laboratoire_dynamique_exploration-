# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
World Objects / Bridge v1 — premier objet transformable et traversée de rivière.

## Branche
`work/exploration-world-objects-bridge-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-world-objects-bridge-v1-2026-10-01`

## SHA de base GREEN
`98bcc2ac168e83877624fa4d7d9edc69886a50d0`

## Dernier checkpoint GREEN
`checkpoint/exploration-transition-decals-v1-green-2026-10-01`

## Validation utilisateur à intégrer à l'architecture
Le modèle suivant est validé :
- pont = WorldObject indépendant ;
- pont orientable ;
- pont scalable en longueur et largeur ;
- bâtiment extérieur = WorldObject ;
- intérieur = WorldArea séparée ;
- porte = Portal entre deux Areas ;
- même système Portal pour étages, grottes, boutiques, maisons et autres espaces liés ;
- pas de second système concurrent d'intérieur seamless sous toiture en v1.

## Objectif du lot
Créer le premier contrat WorldObject avec un objet `bridge` réellement utilisable :
- position X/Y ;
- rotation ;
- scale X/Y ;
- taille logique ;
- assetId optionnel ;
- footprint/traversal explicite ;
- rendu indépendant ;
- passage au-dessus d'un obstacle eau explicitement ciblé.

## Builder futur
Le contrat doit permettre au Builder de :
- déplacer le pont ;
- saisir/faire pivoter sa rotation ;
- modifier `scaleX` et `scaleY` ;
- changer l'asset sans changer sa transformation ;
- éditer les limites de scale autorisées par config/validation.

Le Builder ne modifie pas directement le runtime actif : il produit un WorldDocument normalisé.

## Collision
Le pont ne supprime pas la rivière.

Le Collision World reste propriétaire du blocage de la rivière.
Le bridge expose seulement un corridor traversable orienté qui peut neutraliser **les obstacles explicitement référencés** dans ce corridor.

Aucune analyse de pixel/sprite.

## Fichiers autorisés
- `docs/` ;
- `src/world/world-object-model.js` ;
- `src/core/collision.js` ;
- `src/render/world-object-renderer.js` ;
- `src/world/demo-world.js` ;
- `src/main.js` uniquement pour raccord explicite ;
- tests.

## Hors périmètre
- assets graphiques définitifs de pont ;
- UI Builder ;
- bâtiment runtime ;
- Portal runtime ;
- changement d'Area ;
- escaliers ;
- génération procédurale de pont ;
- autre dépôt.

## Tests requis
- normalisation transform ;
- rotation/scale conservés ;
- passage orienté calculé sans mutation ;
- pont autorise uniquement l'obstacle référencé ;
- hors corridor la rivière reste bloquante ;
- mouvement réel peut franchir la rivière via le pont ;
- renderer ne possède pas la collision ;
- tests historiques GREEN ;
- CI GREEN ;
- preview smartphone.

## Critère de sortie
Un pont de test visible, tourné/scalé depuis les données du WorldObject, permet de traverser la rivière uniquement sur son corridor, sans modifier la rivière ni les systèmes GREEN précédents.


## État technique — 2026-10-01

Implémenté :
- `WorldObject schemaVersion 1` ;
- type `bridge` ;
- transform `x/y/rotationDeg/scaleX/scaleY` ;
- taille logique `length/width` indépendante des pixels ;
- assetId visuel optionnel ;
- corridor traversable orienté ;
- ratios de corridor séparés du visuel ;
- liste `overridesObstacleIds` explicite ;
- rendu procédural bois de test ;
- culling du bridge ;
- rivière conservée comme obstacle ;
- Collision World autorise le passage uniquement à l'intérieur du corridor du pont.

Pont de démonstration :
- centre : x=1190, y=805 ;
- rotation : 90° ;
- longueur logique : 170 ;
- largeur logique : 96 ;
- scale X/Y : 1 / 1 ;
- obstacle franchi : `forest-stream-collision`.

## Garanties
- aucun pixel/sprite n'est lu pour décider la collision ;
- renderer ne possède aucune règle de passage ;
- le pont ne désactive pas globalement les rivières ;
- un autre obstacle non référencé reste bloquant ;
- rotation et scale sont normalisés dans le WorldObject ;
- l'UI Builder future pourra écrire ces valeurs dans le document puis normaliser.

## Tests
CI :
run `36904615141` — SUCCESS.

Tests ajoutés :
- rotation 450° -> 90° normalisée ;
- scale indépendant X/Y ;
- limites de scale centralisées ;
- dimensions visuelles/traversables dérivées des données logiques ;
- passage orienté ;
- override seulement de l'obstacle référencé ;
- mouvement réel à travers une rivière via un pont ;
- sentinelles renderer/collision.

## Test manuel requis
Preview smartphone :
- pont visible sur la rivière vers x=1190 / y=805 ;
- orientation verticale cohérente avec la traversée ;
- possibilité de traverser la rivière en restant dans la largeur du pont ;
- impossibilité de traverser la rivière à côté du pont ;
- déplacement/caméra fluides ;
- rendu forêt/route/rivière/transitions inchangé.

Aucun checkpoint GREEN Bridge v1 avant validation utilisateur.
