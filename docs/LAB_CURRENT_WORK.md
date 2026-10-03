# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Surface Traversal Rules v1 — replay sur la lignée Builder + Map Actor GREEN.

## Branche
`work/exploration-surface-traversal-rules-v1-replay-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-surface-traversal-rules-v1-replay-2026-10-03`

## SHA de base GREEN
`ecdf28ba33fac409e7a2411ba2fd6592a34dc0b7`

## Dernier checkpoint GREEN
`checkpoint/exploration-map-actor-editor-v1-green-2026-10-03`

## Source technique à reporter, jamais à reprendre comme base
Ancienne branche isolée :
`work/exploration-surface-traversal-rules-v1-2026-10-02`

Ancien HEAD :
`0293c3ab114f30313eba55b2a5b1255c4bca81d1`

Cette branche ancienne sert uniquement de référence de diff.
Elle ne doit être ni publiée, ni mergée, ni utilisée comme point de reprise.

## Objectif
Introduire des règles de traversée de surface configurables pour héros, PNJ et créatures sans perdre les systèmes GREEN ajoutés depuis :
- Map Actor Visual + sourceFacingX ;
- World Builder Dynamique ;
- collision rivière canonique depuis `surface.rivers[]` ;
- Building/Portal/Spawn ancré ;
- handoff Builder -> runtime -> Builder.

Cas v1 :
- sol normal : x1.00 ;
- route : bonus configurable ;
- eau : bloquée pour ground ;
- eau : traversable pour swim ;
- eau : traversable pour fly ;
- pont : override local de la surface eau via le corridor GREEN.

## Autorités
- géométrie routes/rivières/zones : World Surface Model ;
- identifiant de règle : World Surface Model ;
- valeurs des règles : Traversal Rule Registry ;
- modes locomotion acteur : données gameplay acteur ;
- résolution passable + multiplicateur : Surface Traversal Resolver ;
- mouvement final : Exploration Core ;
- collisions statiques : Collision World ;
- visuel : Material Registry / Renderer uniquement.

## Règle absolue
Interdit :
`materialId -> vitesse/collision`

Obligatoire :
`surface geometry -> traversalRuleId -> Traversal Rule Registry -> locomotion actor -> resolver -> mouvement/collision`

## Périmètre
- Surface schema v2, en conservant `surface.zones[]` du Builder actuel ;
- `baseTraversalRuleId` ;
- `traversalRuleId` sur routes/rivières ;
- Traversal Rule Registry configurable ;
- locomotion `ground / swim / fly` ;
- resolver géométrique pur ;
- bonus route ;
- eau ground bloquée ;
- swim/fly sur eau ;
- pont override local d'une feature surface ;
- migration Bridge `overridesObstacleIds` -> `overridesSurfaceFeatureIds` sans double champ normalisé ;
- mouvement applique le multiplicateur ;
- collision consulte le resolver pour la traversée surface ;
- démo mobile Marche/Nage/Vol ;
- HUD règle/multiplicateur ;
- tests de régression complets Builder + Map Actor.

## Compatibilité Builder
Le Builder actuel reste GREEN.
Aucune UI de réglage des Traversal Rules n'est ajoutée dans ce lot.

Si la migration Bridge exige un raccord Builder, il doit uniquement écrire le nouveau champ canonique et conserver la même ergonomie de placement existante.

## Hors périmètre
- IA PNJ/monstres ;
- pathfinding ;
- monde vivant ;
- endurance/stamina ;
- animation nage/vol ;
- éditeur Héros/Créatures final ;
- persistance Core ;
- Encounter Bridge ;
- autre dépôt.

## Tests requis
- materialId indépendant de traversalRuleId ;
- registry configurable ;
- locomotion normalisée ;
- route ground bonus ;
- eau ground bloquée ;
- eau swim/fly ;
- bridge override local ;
- surface.zones Builder préservées ;
- rivière canonique reste l'unique géométrie eau ;
- migration Bridge sans double autorité ;
- vrai chemin mouvement -> traversal -> collision -> position ;
- Map Actor et Builder sentinelles historiques GREEN ;
- aucune nouvelle autorité renderer/material.

## Critère de sortie
Sur smartphone :
1. Marche : route accélère ;
2. Marche : eau bloque hors pont ;
3. pont reste traversable ;
4. Nage : eau traversable avec multiplicateur ;
5. Vol : eau traversable ;
6. Builder et Map Actor ne régressent pas.

Le lot reste non GREEN jusqu'à CI + preview + validation smartphone.


## État technique — Surface Traversal replay — 2026-10-03

Report sélectif réalisé depuis l'ancienne branche isolée, sans merge de l'ancienne lignée.

Implémenté sur la base GREEN actuelle :
- WorldSurface schema v2 ;
- `baseTraversalRuleId` ;
- `traversalRuleId` routes/rivières ;
- `surface.zones[]` du Builder conservé et purement visuel ;
- Traversal Rule Registry v1 injectable ;
- locomotion partagée `ground / swim / fly` ;
- resolver géométrique pur ;
- route ground x1.25 via data pack ;
- eau ground bloquée ;
- eau swim x0.75 ;
- eau fly x1.00 ;
- Bridge `terrain.bridge` avec override local d'une feature surface ;
- migration `overridesObstacleIds` -> `overridesSurfaceFeatureIds` sans double champ normalisé ;
- Builder raccordé au nouveau champ canonique ;
- Collision World consulte le resolver ;
- Movement Core applique le multiplicateur ;
- géométrie partagée dans `core/geometry.js` ;
- runtime de test Marche / Nage / Vol ;
- HUD règle active + multiplicateur ;
- chaîne de cache mobile versionnée.

Régressions protégées :
- rivière canonique reste l'unique géométrie eau ;
- pont traversable sans faux obstacle rivière ;
- rivière large dessinée Builder reste bloquante en ground ;
- zones peintes Builder conservées ;
- World Builder reste sans autorité gameplay ;
- Map Actor Visual/sourceFacingX reste intact ;
- Building/Portal/Spawn ancré restent intacts ;
- handoff Builder/runtime reste intact.

TDD :
- contrat replay : commit `cd7d50427cd966777ed85c6e0890984c77a10d9f` — FAILURE attendue ;
- convergence technique : run `37094377193` — SUCCESS ;
- cache/versioning final : run `37094556304` — **SUCCESS** ;
- HEAD technique avant documentation : `99354ec9d7f830d0f502112063dbd924ccf761f5`.

Gate restante :
publication Pages puis validation smartphone Marche/Nage/Vol.
