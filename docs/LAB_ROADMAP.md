# LAB_ROADMAP — GenSrpG Exploration

## Phase 0 — Bootstrap
- gouvernance ;
- architecture ;
- prototype statique minimal ;
- mouvement fluide + caméra + collisions simples.

## Phase 1 — Exploration Core
- position X/Y continue ;
- vitesse, accélération légère et normalisation diagonale ;
- stick tactile ;
- clavier de debug ;
- collision AABB/cercle ;
- zones non traversables.

## Phase 2 — Monde et caméra
- caméra de suivi ;
- limites monde ;
- culling simple ;
- couches sol/décor/obstacles/interactions.

## Phase 3 — Génération procédurale v1
- seed ;
- biome forêt ;
- clairières ;
- chemins ;
- rivière ;
- pont ;
- points d'intérêt ;
- validation d'accessibilité.

## Phase 4 — Builder Exploration
- création manuelle ;
- édition d'une carte générée ;
- sauvegarde JSON ;
- rechargement identique.

## Phase 5 — Monde vivant
- créatures sauvages ;
- errance ;
- territoire ;
- poursuite/fuite ;
- spawns par biome et zone.

## Phase 6 — Interactions
- PNJ ;
- objets ;
- coffres ;
- portes ;
- bâtiments ;
- passages entre cartes.

## Phase 7 — Encounter Bridge
- détection rencontre ;
- sérialisation contexte exploration ;
- passage vers Combat Dynamique ;
- retour à la position exacte après combat.

## Phase 8 — Mobile/PWA hardening
- performances smartphone ;
- contrôles tactiles ;
- sauvegarde/reprise ;
- tests longue session.
