# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 5 — Monde vivant — micro-lot 4 :
**Errance / Territoire v1**.

## Branche
`work/exploration-phase5-wild-wander-territory-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase5-wild-wander-territory-v1-2026-10-03`

## SHA de base GREEN
`d1adf39e00e672bead1a3b257660fb6185c43eb7`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase5-wild-runtime-presence-v1-green-2026-10-03`

## Objectif
Faire vivre les créatures sauvages à l'intérieur de leur territoire sans introduire un second moteur de mouvement.

Profils à couvrir dès ce lot :
- terrestre : `ground` ;
- aquatique : `swim` ;
- volant : `fly`.

## Chaîne cible
```text
WildCreatureEntity
  -> homeZoneId
  -> Wander Planner déterministe
  -> destination dans le territoire
  -> locomotion depuis Actor Definition
  -> Exploration movement/collision/traversal existants
  -> position runtime de l'entité
```

## Autorités
- territoire/home zone : Living World Model ;
- choix de destination d'errance : Wander Planner ;
- capacités de locomotion : Actor Definition / Capture futur ;
- mouvement : Exploration movement core ;
- passabilité : Collision World + Surface Traversal ;
- rendu : Map Actor Renderer.

## Règles absolues
- aucune IA de déplacement ne modifie directement x/y sans passer par le mouvement canonique ;
- aucune déduction de locomotion depuis materialId/biome/tags ;
- une créature aquatique reçoit `swim` via Actor Definition ;
- une créature volante reçoit `fly` via Actor Definition ;
- une terrestre reçoit `ground` ;
- WildCreatureEntity ne copie toujours pas stats/MapActorVisual/locomotion ;
- aucun timer global ni heartbeat.

## Périmètre
- territoire circulaire v1 réutilisant la WildSpawnZone d'origine ;
- destination d'errance déterministe et bornée ;
- état d'errance runtime minimal ;
- mouvement vers destination via moteur existant ;
- nouvelle destination à l'arrivée ;
- trois profils demo ground/swim/fly ;
- créature aquatique visible dans une zone d'eau ;
- tests purs + preview mobile.

## Hors périmètre
- poursuite du joueur ;
- fuite ;
- pathfinding global ;
- combat/rencontre ;
- respawn timer ;
- persistance Core ;
- Builder UI ;
- éditeur Héros/Créatures final ;
- autre dépôt.

## Tests requis
- destination toujours dans homeZone ;
- même seed + même entity + même wanderIndex = même destination ;
- ground ne traverse pas eau ;
- swim peut errer dans eau ;
- fly peut errer au-dessus de l'eau ;
- déplacement utilise le movement core existant ;
- aucune copie de locomotion dans WildCreatureEntity ;
- aucune dépendance materialId pour autoriser ground/swim/fly ;
- sentinelles Phase 5 précédentes + Builder/MapActor/Traversal GREEN.

## Gate mobile
- terrestre se déplace dans sa zone ;
- aquatique visible et se déplace dans l'eau ;
- volant visible et se déplace sans être bloqué par l'eau ;
- aucune créature ne sort de son territoire ;
- joueur/Builder/Portal/Traversal sans régression.
