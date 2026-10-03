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


## État technique — Wild Runtime Presence v1 — 2026-10-03

Implémenté :
- activation initiale de créatures sauvages via Spawn Planner GREEN ;
- `WildCreatureEntity` reste minimal et sans stats/visuel/locomotion copiés ;
- résolution de `actorDefinitionId` via adapter DEMO isolé ;
- profil locomotion fourni par Actor Definition ;
- validation de spawn par Collision World + Surface Traversal existants ;
- créature ground refusée dans l'eau hors pont ;
- créature fly autorisée sur la même eau ;
- rendu via le Map Actor Renderer GREEN ;
- assets collectés depuis les définitions d'acteurs ;
- HUD affiche le nombre de sauvages présents dans l'Area ;
- aucune IA / errance / poursuite ;
- aucun timer.

TDD :
- sentinelle runtime : commit `5c49560d1fa1874bafe48b09a37f5ba837032e62` — FAILURE attendue ;
- runtime activation : `7e76533002dd6f9c294cb73180107036a986d4ac` ;
- correction sentinelle pont/eau : `56e8e6a3b494bb6750a84f5f5bd65cccc9f934fe` — CI SUCCESS ;
- sentinelle main : `1ab4ac02063860638ecbdb701ccfc81d4832643b` — FAILURE attendue ;
- adapter/config demo : `54b8af4597ca253a84cdd9d27efa40a0d7986c7e` ;
- raccord main : `72605fd056d06af50a5e2352df13930d265460f0` — CI SUCCESS ;
- cache/version preview final : `dcfd66d1f279643b7a6391034fb6ddf6d52e6a49` ;
- CI finale : run `37100927965` — **SUCCESS**.

Note visuelle :
les créatures de démonstration réutilisent temporairement l'asset Map Actor existant.
Ce n'est pas une définition graphique produit et cela ne change pas l'ownership final de l'éditeur Héros/Créatures.

Gate restante :
publication Pages + validation smartphone de la présence runtime.


## Preview mobile — Wild Runtime Presence v1 — 2026-10-03

Infrastructure uniquement :
- PR #40 ;
- main SHA : `167667b5f5fc34aedc4c74406145d4c3bb464143` ;
- Pages run : `37100996891` — **SUCCESS** ;
- artifact : `11265124140`.

Le workflow Pages checkout explicitement :
`work/exploration-phase5-wild-runtime-presence-v1-2026-10-03`.

URL runtime :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/`

Gate smartphone :
1. constater une créature sauvage statique près du départ ;
2. HUD `sauvages` cohérent ;
3. vérifier que joueur / déplacement / route / eau / pont fonctionnent toujours ;
4. vérifier que le World Builder reste accessible ;
5. aucune régression Map Actor / orientation.

Note :
l'asset visuel de démonstration est temporairement partagé avec l'acteur demo existant.
Ce micro-lot valide la présence runtime et l'ownership, pas l'art final.

Le lot reste non GREEN jusqu'à validation utilisateur.


## Validation utilisateur finale — Wild Runtime Presence v1 — 2026-10-03

Validation smartphone utilisateur : **GREEN**.

Confirmé :
- créature sauvage visible près du départ ;
- compteur `sauvages` cohérent ;
- déplacement joueur sans régression ;
- route / eau / pont sans régression ;
- World Builder accessible ;
- Map Actor / orientation sans régression.

Le micro-lot **Wild Runtime Presence v1** est donc fermé GREEN.

Demande produit suivante :
ajouter le profil **aquatique** au monde vivant, en plus des profils terrestre et volant.

Règle d'architecture :
- terrestre / aquatique / volant proviennent des capacités de locomotion de l'Actor Definition ;
- Living World ne recopie pas ces capacités dans WildCreatureEntity ;
- Surface Traversal reste l'unique autorité de passabilité ;
- l'errance future doit respecter le territoire et la locomotion réelle de chaque créature.

Suite :
**Phase 5 micro-lot 4 — Errance / Territoire v1**, avec profils ground / swim / fly.
