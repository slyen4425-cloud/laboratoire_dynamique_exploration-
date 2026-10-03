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


## État technique — Errance / Territoire v1 — 2026-10-03

Implémenté :
- Wander Planner déterministe ;
- destination toujours choisie dans `homeZoneId` ;
- essais locaux bornés ;
- passabilité injectée depuis Collision/Traversal ;
- contrôleur d'errance runtime sans timer global ;
- mouvement via `stepMovement` existant ;
- nouvelle destination à l'arrivée ou si une destination devient bloquée ;
- WildCreatureEntity reste minimal et immuable ;
- état éphémère de destination séparé de la position canonique ;
- définition aquatique demo `capture.creature.demo.swim` ;
- locomotion aquatique fournie par Actor Definition : `swim` ;
- zone/règle de spawn aquatique dans la rivière ;
- trois profils runtime : ground / swim / fly ;
- activation démo portée à 3 créatures ;
- rendu toujours via Map Actor Renderer GREEN.

TDD :
- contrat Errance/Territoire : commit `b8d5ca30a5ffbbfff5c2da9abc3358dccdd629d9` — **FAILURE attendue** ;
- Wander Planner : `f10dee8ae6cf51124551c68ff33493a63181e9f1` ;
- Actor Definition aquatique : `be518b0728f55f6b4389e04bea2572454aa6862d` ;
- zone/règle aquatique : `2c87866cf5a30feaa19997e72cdefe2f0e4cea8e` ;
- contrôleur runtime : `5ef1d2af812d38a4ac0d25cdfae173756689f05a` ;
- raccord boucle runtime : `bc6d105518c9b4ae4b88cf03fbb3f3b436c9cf7f` ;
- sentinelles aquatiques : `85dd5f7aa4e2a32b4e5903535e044685ad4061da`, `8b8746e92270da7a25490cc4f08a8502d4cbeb02` ;
- cache/versioning runtime : `20b34b31df96b7dfadbc87eb467b91ad3628edd6` ;
- CI technique finale : run `37102746795` — **SUCCESS**.

Invariants conservés :
- aucun second moteur de mouvement ;
- aucun `setInterval` ;
- aucune capacité de locomotion copiée dans WildCreatureEntity ;
- `materialId` ne décide jamais terrestre/aquatique/volant ;
- le territoire utilise la zone gameplay Living World, pas `surface.zones[]` ;
- pas de poursuite/fuite/Encounter dans ce lot.

Gate restante :
publication Pages puis validation smartphone des trois profils en errance.


## Régression protégée — frontière de territoire

Sentinelle :
- commit `95b6063523f6b585aba46f1ebf073d58cf3b28d5` ;
- run `37102897942` — **FAILURE attendue** ;
- reproduction : une créature très rapide pouvait dépasser une destination et sortir de son `homeZone` en un seul pas.

Correction :
- vitesse bornée pour ne jamais dépasser la destination ;
- contrôle explicite de la position finale contre le cercle `homeZone` ;
- en cas de sortie impossible : position précédente conservée, cible abandonnée puis recalculée ;
- aucun clamp silencieux vers une autre géométrie.

Commits :
- `979eeb85b38e42955fcc49377d15292224a35a2f` — prévention overshoot ;
- `61c7b7d83a899ac13e2e364b8f5e163c5ca3a45d` — garde territoire ;
- run `37102944988` — **SUCCESS**.

Cache mobile final :
- runtime : `1f79b4586e60e28d69b6cd176ad2b2ea8786caaa` ;
- wander planner : `41edfcaa3deb17e182ce91829d02cd4860a29d5e` ;
- entry : `248966e18132c7826dfd9e72352a4243590ed681` ;
- CI finale : `37102975365` — **SUCCESS**.

## Preview mobile — Errance / Territoire v1

Infrastructure uniquement :
- PR #42 ;
- main SHA : `c354c38f3e29b34af44d891022e848f586d8e80c` ;
- Pages run : `37103039046` — **SUCCESS** ;
- artifact : `11266883587`.

URL :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/`

Gate smartphone :
1. créature terrestre : errance dans sa zone au sol ;
2. créature aquatique : présence + errance dans la rivière ;
3. créature volante : errance au-dessus de l'eau ;
4. aucune ne doit sortir de son territoire ;
5. mouvements/orientations visuels cohérents ;
6. joueur, route, eau, pont, Portal, Builder sans régression.

Le lot reste non GREEN jusqu'à validation utilisateur.
