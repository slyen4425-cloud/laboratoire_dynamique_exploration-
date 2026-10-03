# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 5 — Monde vivant — micro-lot 2 :
**Spawn Planner / Activation déterministe v1**.

## Branche
`work/exploration-phase5-spawn-planner-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase5-spawn-planner-v1-2026-10-03`

## SHA de base GREEN
`d0a17f8ebc479733e5690bc358fb55c60ffd1785`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase5-wild-creature-spawn-v1-green-2026-10-03`

## Objectif
Produire une intention de spawn déterministe depuis les contrats Living World sans prendre l'autorité sur collision, traversal ou capacités acteur.

## Chaîne cible
```text
LivingWorldConfig
  -> règles éligibles (maxActive / weight)
  -> Spawn Planner déterministe
  -> candidat x/y dans WildSpawnZone
  -> canSpawn injecté
  -> WildSpawnIntent
  -> futur système d'activation runtime
```

## Autorités
- sélection/pondération/point candidat : Spawn Planner ;
- passabilité réelle : callback injecté provenant des autorités gameplay/collision/traversal ;
- actorDefinitionId : référence opaque ;
- création/mutation des entités runtime : hors périmètre du planner.

## Périmètre
- seed déterministe ;
- activationIndex explicite ;
- activeCounts par règle ;
- maxActive respecté ;
- weight respecté ;
- point déterministe dans zone circulaire ;
- nombre d'essais local borné ;
- callback `canSpawn` obligatoire pour le vrai raccord ultérieur ;
- sortie `WildSpawnIntent v1` immuable ;
- aucun timer / aucune boucle permanente.

## Hors périmètre
- respawn temporel ;
- errance ;
- poursuite/fuite ;
- pathfinding ;
- création/mutation directe des entités ;
- rencontre/combat ;
- UI ;
- autre dépôt.

## Tests requis
- même seed + même activationIndex = même intent ;
- activationIndex différent peut produire un autre point ;
- maxActive bloque une règle pleine ;
- pondération déterministe ;
- point toujours dans la zone ;
- canSpawn peut rejeter puis accepter ;
- échec propre après essais bornés ;
- aucune dépendance materialId / visuel / stats ;
- sentinelles Phase 5 micro-lot 1 et Traversal restent GREEN.

## Suite prévue
Après GREEN :
**Phase 5 micro-lot 3 — activation runtime minimale / présence de créatures sur la map**, puis errance/territoires.


## État technique — Spawn Planner / Activation déterministe v1 — 2026-10-03

Implémenté :
- sélection pondérée déterministe ;
- respect de `maxActive` ;
- seed + `activationIndex` explicites ;
- point candidat uniforme dans zone circulaire ;
- `canSpawn(candidate)` injecté comme autorité externe ;
- aucun accès direct collision/traversal ;
- essais locaux bornés (1..64) ;
- sortie `WildSpawnIntent v1` immuable ;
- aucun timer ;
- aucune mutation d'entité.

TDD :
- contrat : commit `1d45d815f90c9dbf0161b94539168176f3221fe7` — FAILURE attendue ;
- implémentation : commit `4397ef0930834eb9625c24bad3da76036f6b952b` ;
- CI : run `37100519079` — **SUCCESS**.

Aucune gate mobile requise :
ce micro-lot reste pur et sans comportement utilisateur visible.

Suite :
**Phase 5 micro-lot 3 — activation runtime minimale / présence de créatures sauvages sur la map**.
