# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
WorldArea / Portal v1.

## Branche
`work/exploration-worldarea-portal-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-worldarea-portal-v1-2026-10-02`

## SHA de base GREEN
`bb8cad37400ba6853e3aba76ffc633303c263bcb`

## Dernier checkpoint GREEN
`checkpoint/exploration-building-world-object-v1-green-2026-10-02`

## Plan validé
Ordre confirmé :
1. WorldArea / Portal v1 ;
2. Map Actor Visual System v1 ;
3. World Builder Dynamique UI v1.

Décision Map Actor déjà validée pour le prochain lot :
**un seul visuel fourni par le joueur doit suffire pour rendre héros, PNJ ou créature utilisable sur la map ; GenSrpG prépare automatiquement le visuel map.**

## Objectif du lot
Mettre en place l'unique contrat Area/Portal pour :
- entrer dans un bâtiment ;
- revenir à l'extérieur ;
- réutiliser ensuite le même mécanisme pour étage, cave, grotte, boutique, tour et changement de zone.

## Propriétaires
- WorldArea : World Area Model ;
- Portal : Portal Model ;
- currentAreaId + position X/Y : Exploration state/runtime ;
- collision : Collision World ;
- Building doorAnchor : Building WorldObject déjà GREEN ;
- rendu : Renderer uniquement.

## Systèmes réutilisés / gelés
- Building WorldObject v1 GREEN ;
- doorAnchors Building GREEN ;
- Bridge v1 GREEN ;
- mouvement continu X/Y GREEN ;
- Collision World GREEN ;
- Material/World Surface system GREEN ;
- WorldObject renderer + asset authority GREEN.

Aucune de ces autorités ne doit être recréée.

## Périmètre
- `WorldArea v1` versionné ;
- spawns nommés par Area ;
- `Portal v1` versionné ;
- source trigger explicite ;
- source possible depuis un `building-door` ou un point ;
- targetAreaId + targetSpawnId ;
- validation des références ;
- résolution pure du trigger Portal ;
- transition Area sans reload ;
- conservation de `currentAreaId` + X/Y ;
- démo maison extérieure -> intérieur -> retour extérieur ;
- tests du vrai chemin ;
- preview smartphone.

## Hors périmètre
- UI World Builder Dynamique ;
- Map Actor runtime ;
- génération IA de sprites ;
- sauvegarde persistante ;
- étages multiples réels ;
- combat Capture ;
- autre dépôt.

## Règles
- un seul mécanisme Portal pour portes/escaliers/grottes/sorties ;
- aucun `location.reload()` ;
- aucun second système d'intérieur seamless ;
- le Portal ne possède jamais le bâtiment ;
- le Building ne possède jamais le changement d'Area ;
- l'Area ne possède jamais la position globale du Shell ;
- target spawn explicite obligatoire ;
- aucune coordonnée dérivée d'un sprite.

## Tests requis
- normalisation WorldArea ;
- normalisation Spawn ;
- normalisation Portal ;
- références invalides rejetées ;
- building-door résolu depuis doorAnchor réel ;
- point trigger résolu ;
- transition change uniquement currentAreaId + X/Y ;
- retour exact via spawn explicite ;
- collision/mouvement historiques toujours GREEN ;
- architecture : aucune reload / aucune seconde autorité.

## Critère de sortie
Depuis la preview mobile, le joueur peut :
1. rejoindre la porte de la maison ;
2. entrer dans une WorldArea intérieure sans reload ;
3. se déplacer dans l'intérieur ;
4. ressortir ;
5. retrouver une position extérieure explicite sûre.

Le lot reste non GREEN jusqu'à validation smartphone.


## Décision d'autorité Portal — 2026-10-02

Pendant le raccord v1, une duplication potentielle a été retirée avant publication :
- Building conserve uniquement ses `doorAnchors` ;
- Portal Model possède seul `sourceAreaId + trigger + targetAreaId + targetSpawnId` ;
- l'ancien champ préparatoire `Building.portalRefs` n'est plus normalisé ;
- le World Builder Dynamique éditera le Portal lui-même lorsqu'une porte est reliée.

Motif :
éviter deux autorités décrivant la même relation porte -> Portal.


## État technique WorldArea / Portal v1 — 2026-10-02

Implémenté :
- `WorldArea v1` avec id/kind/dimensions/surface/objects/obstacles/spawns ;
- `WorldDocument v1` multi-Areas ;
- `Portal v1` avec source Area, trigger, target Area et target Spawn ;
- trigger `building-door` résolu depuis le `doorAnchor` Building GREEN ;
- trigger `point` générique pour sortie/escaliers/grottes futurs ;
- références Area/Spawn/door invalides rejetées à la normalisation ;
- runtime unique `currentAreaId + x/y` sur le joueur ;
- passage Area -> Area sans reload ;
- arrivée uniquement par Spawn explicite ;
- maison extérieure -> intérieur -> retour extérieur dans la démo ;
- chargement des assets WorldObject de toutes les Areas avant démarrage.

Autorité consolidée :
- Building ne contient plus de `portalRefs` ;
- Portal Model est l'unique propriétaire du lien entre Areas ;
- aucun sprite/renderer ne fournit de coordonnées Portal.

Tests :
- normalisation Areas/Spawns/Portals ;
- références invalides ;
- doorAnchor transformé ;
- point trigger ;
- transition vers Spawn ;
- vrai chemin mouvement -> porte -> Portal ;
- sentinelle aucune navigation/reload ;
- sentinelle Portal unique authority.

CI runtime avant publication :
run `36979274962` — **SUCCESS**.

## Preview WorldArea / Portal v1

Infrastructure main uniquement :
- main SHA : `a01044d5c5c226545c82eb8cd15a477a88b81291` ;
- Pages run : `36979384285` ;
- job deploy : **SUCCESS** ;
- artifact Pages : `11215195727`.

Artefact réellement inspecté :
- `index.html` charge `main.js?rev=worldarea-portal-v1` ;
- runtime contient `findTriggeredPortal` + `applyPortalTransition` ;
- Portal Model publié contient `building-door`, `targetAreaId`, `targetSpawnId` ;
- démo publiée contient `house-interior-01`, `portal-house-enter`, `portal-house-exit`.

Gate restante :
validation smartphone utilisateur.


## Régression preview — intérieur noir — 2026-10-02

Retour smartphone :
- le Portal maison s'active correctement ;
- `house-interior-01` devient l'Area active ;
- rendu intérieur noir.

Cause reproduite :
- `house-interior-01.surface.baseMaterialId = road.dirt` ;
- `road.dirt` est un matériau `path`, pas `surface` ;
- le Surface Renderer exige explicitement `surface` pour le matériau de base ;
- l'exception survenait après effacement du canvas, d'où l'écran noir.

Sentinelle permanente ajoutée :
`every demo WorldArea base material must resolve as a surface material`.

Reproduction :
- commit `7b4d324bdf19ffb10c30a8a3ec075f256daeafe0` ;
- CI `36989216161` — **FAILURE attendue**.

Correction :
- ajout du matériau explicite `floor.wood.house`, kind `surface` ;
- intérieur raccordé à `floor.wood.house` ;
- aucune tolérance ajoutée au renderer ;
- aucun fallback silencieux vers un matériau d'un autre kind ;
- cache mobile versionné pour `main.js`, `material-pack-v1.js` et `demo-world.js`.

CI après correction métier :
- run `36989364751` — **SUCCESS**.

Une nouvelle preview Pages est requise avant validation smartphone.
