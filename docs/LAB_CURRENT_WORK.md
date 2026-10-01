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


## Retour utilisateur — 2026-10-01
Le pont fonctionne, mais le passage n'est pas toujours fluide :
- sensation d'accrochage ;
- parfois impression que le pont n'est pas parfaitement fixé ;
- problème surtout lorsque le pion n'est pas parfaitement centré.

## Régression reproduite
Un test dédié a été ajouté avec un passage légèrement décentré.

Avant correction :
- test `off-center bridge crossing` : FAIL ;
- CI run `36905731666` : FAILURE attendue.

Cause confirmée :
le corridor traversable était traité comme une zone dans laquelle **tout le cercle du pion** devait tenir.
Avec un pont visuel de 96 px et un pion de 36 px de diamètre, la largeur de centre réellement utilisable devenait trop étroite, provoquant des accroches invisibles.

## Correction
Le contrat est clarifié :
**le traversal corridor représente désormais la zone autorisée pour le centre de l'entité.**

Conséquences :
- plus de double réduction par le rayon du pion ;
- passage légèrement décentré accepté tant que le centre reste dans le corridor ;
- la rivière reste bloquante hors corridor ;
- aucun état caché/hystérésis ;
- aucun élargissement global de rivière ;
- aucune dépendance au sprite.

Tests après correction :
- run `36905799154` : SUCCESS ;
- run `36905806613` : SUCCESS ;
- regression off-center : GREEN.

Nouvelle validation smartphone requise avant checkpoint GREEN Bridge v1.


## Deuxième régression — entrée diagonale
Retour utilisateur après première correction : le pont raccrochait encore.

Reproduction ajoutée :
- arrivée diagonale au bord du pont avec stick ;
- l'axe vertical se bloquait contre la rivière ;
- l'axe horizontal continuait, faisant glisser le joueur le long de la rive.

CI de reproduction :
run `36906566310` — FAILURE attendue.

Cause :
1. le resolver historique X puis Y ne savait pas guider un mouvement diagonal vers un corridor traversable ;
2. sur une limite transformée, une valeur flottante pouvait dépasser la borne d'environ 1e-14 et faire basculer le test dedans/dehors.

## Correction v2
- résolution directe de la cible si libre ;
- si la cible est bloquée près d'un bridge compatible : résolution pure `resolveBridgeGuidedPosition` ;
- projection uniquement de l'axe latéral sur le bord du corridor ;
- progression longitudinale conservée ;
- `edgeAssistRatio` normalisé et configurable ;
- tolérance numérique `1e-6` uniquement pour les comparaisons de frontière ;
- fallback sur le slide X/Y historique pour tous les autres obstacles.

Pont démo :
- `edgeAssistRatio: 0.15`.

Le comportement n'utilise :
- ni timer ;
- ni état de pont actif ;
- ni snap permanent ;
- ni désactivation globale d'eau.

CI après correctif v2 :
run `36906853458` — SUCCESS.

Le test diagonal précédemment rouge est désormais GREEN.
Nouvelle validation smartphone requise.


## Validation utilisateur — 2026-10-01
Test smartphone final : **validé**.

Retour utilisateur :
- pont fonctionnel ;
- traversée fluide ;
- accrochage précédent corrigé.

Sont donc validés :
- WorldObject bridge v1 ;
- rotation ;
- scale X/Y ;
- corridor de traversée ;
- edge assist d'entrée diagonale ;
- tolérance numérique de frontière ;
- rivière bloquante hors pont ;
- absence de régression perceptible sur mouvement/caméra/rendu.

## Fermeture
World Objects / Bridge v1 : **GREEN / terminé**.

La suite doit être ouverte dans un lot séparé depuis le checkpoint GREEN exact :
- assets visuels de pont ;
- puis WorldArea / Building / Portal selon la roadmap validée.
