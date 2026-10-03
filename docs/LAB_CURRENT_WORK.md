# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 5 — Monde vivant — micro-lot 3 :
**Wild Runtime Presence v1**.

## Branche
`work/exploration-phase5-wild-runtime-presence-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase5-wild-runtime-presence-v1-2026-10-03`

## SHA de base GREEN
`8336e27164bfd5b573219a2b6d65ae749f98dc57`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase5-spawn-planner-v1-green-2026-10-03`

## Objectif
Activer quelques créatures sauvages au bootstrap depuis le Spawn Planner et les rendre visibles dans Exploration, sans encore ajouter d'IA.

## Chaîne
```text
LivingWorldConfig demo
 -> Spawn Planner
 -> validation via Collision/Traversal existants
 -> WildCreatureEntity runtime
 -> Actor Definition adapter demo
 -> Map Actor Renderer GREEN
```

## Autorités
- position/présence runtime créature : Living runtime entity ;
- profil acteur/visuel/locomotion : Actor Definition adapter demo (temporaire, futur Capture) ;
- collision : Collision World ;
- traversal : Surface Traversal Resolver ;
- rendu : Map Actor Renderer ;
- spawn : Spawn Planner.

## Règles
- WildCreatureEntity ne contient ni stats ni MapActorVisual ;
- le rendu résout MapActorVisual depuis actorDefinitionId ;
- le spawn consulte les capacités de locomotion de la définition pour tester la passabilité ;
- aucun timer de respawn ;
- aucune errance/poursuite ;
- aucun second renderer.

## Périmètre
- adapter local de définitions de démonstration ;
- config Living World de démonstration ;
- activation initiale bornée ;
- validation Collision/Traversal ;
- rendu des entités dans leur Area ;
- compteur HUD minimal ;
- tests purs + preview mobile.

## Hors périmètre
- déplacement autonome ;
- territoire dynamique ;
- poursuite/fuite ;
- rencontre/combat ;
- capture ;
- persistence ;
- Builder UI ;
- autre dépôt.

## Gate
Sur smartphone :
- créatures visibles sur la map ;
- aucune créature dans zone bloquée/eau pour profil ground ;
- joueur/Builder/Portal/Traversal sans régression.
