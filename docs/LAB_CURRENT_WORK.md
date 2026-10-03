# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 5 — Monde vivant — micro-lot 1 :
**Wild Creature Entity + Spawn Contract v1**.

## Branche
`work/exploration-phase5-wild-creature-spawn-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase5-wild-creature-spawn-v1-2026-10-03`

## SHA de base GREEN
`08b42ccbbffe76b6e81384d52824bb9c2ecc2777`

## Dernier checkpoint GREEN
`checkpoint/exploration-surface-traversal-rules-v1-replay-green-2026-10-03`

## Objectif
Poser les contrats canoniques du monde vivant avant toute IA :
- identité runtime d'une créature sauvage ;
- zones gameplay de spawn ;
- règles de spawn pilotées par données ;
- référence opaque vers une définition d'acteur.

## Chaîne cible
```text
World Living Config
  -> Spawn Zone gameplay
  -> Spawn Rule(actorDefinitionId)
  -> Wild Creature Entity runtime
  -> futurs systèmes errance / poursuite / fuite
```

## Autorités
- définition Héros/Créature/stats/visuel/capacités : Capture/Actor Definition futur ;
- règles et zones de spawn monde vivant : Living World Model ;
- position runtime d'une créature sauvage : Living World runtime entity ;
- déplacement futur : Exploration Engine ;
- traversée : Surface Traversal Resolver ;
- rendu : Map Actor Renderer en lecture seule.

## Règles absolues
Un Spawn Rule ne copie jamais :
- stats ;
- PV ;
- compétences ;
- MapActorVisual ;
- assetId ;
- locomotion autorisée.

Il stocke un `actorDefinitionId` opaque.

Les zones de spawn gameplay sont distinctes de `surface.zones[]`, qui restent purement visuelles.

## Périmètre v1
- `WildSpawnZone v1` cercle : id, areaId, x/y, radius, tags ;
- `WildSpawnRule v1` : id, zoneId, actorDefinitionId, maxActive, weight ;
- normalisation/dédoublonnage ;
- validation des références zone/rule ;
- `WildCreatureEntity v1` : id, actorDefinitionId, areaId, x/y, homeZoneId, facingX, moving ;
- aucune donnée de combat/stat dans l'entité ;
- tests purs Node.

## Hors périmètre
- errance ;
- territoire dynamique ;
- poursuite/fuite ;
- pathfinding ;
- rencontre/combat ;
- respawn timers ;
- persistence Core ;
- Builder UI ;
- éditeur Héros/Créatures ;
- autre dépôt.

## Tests requis
- ids uniques ;
- règle invalide si zone absente ;
- actorDefinitionId obligatoire ;
- aucune dépendance materialId ;
- aucune copie MapActorVisual/stats/locomotion dans Spawn Rule ;
- entité runtime minimale ;
- sentinelles Builder/Map Actor/Traversal restent GREEN.

## Suite prévue
Après GREEN de ce micro-lot :
**Phase 5 micro-lot 2 — spawn planner / activation déterministe**, puis seulement errance/territoires.
