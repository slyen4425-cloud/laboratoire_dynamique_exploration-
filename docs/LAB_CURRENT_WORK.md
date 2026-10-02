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
