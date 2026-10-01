# GenSrpG Exploration — Roadmap

Cette roadmap applique la charte GenSrpG : progression par petits lots, propriétaire unique, checkpoints de départ et GREEN, tests du vrai chemin, mobile-first et aucune double autorité.

## Règle commune à toutes les phases

Avant chaque lot :
1. dernier SHA GREEN ;
2. checkpoint `start` ;
3. branche `work` ;
4. périmètre dans `LAB_CURRENT_WORK.md`.

Après chaque lot :
1. tests ;
2. CI GREEN ;
3. test mobile si nécessaire ;
4. checkpoint GREEN ;
5. mise à jour du point de reprise.

## Phase 0 — Bootstrap — GREEN

Validé :
- gouvernance initiale ;
- prototype minimal ;
- mouvement X/Y continu ;
- caméra ;
- collisions ;
- stick tactile ;
- test smartphone.

Checkpoint :
`checkpoint/exploration-phase0-bootstrap-green-2026-10-01`

## Lot transversal — Alignement gouvernance GenSrpG

Objectif :
- appliquer la charte officielle ;
- propriétaires ;
- garde-fous ;
- contrat d'intégration ;
- sentinelles d'architecture.

Aucun changement gameplay/runtime.

## Phase 1 — Exploration Core

- configuration normalisée de mouvement ;
- vitesse/accélération/freinage configurables ;
- normalisation input ;
- collision consolidée ;
- cycle install/dispose des adapters ;
- tests du chemin input -> mouvement -> collision -> position.

Critère de sortie :
autorité unique et sentinelles Phase 0 toujours GREEN.

## Phase 2 — Monde et caméra

- world model versionné ;
- couches sol/décor/obstacles/interactions ;
- culling ;
- index spatial si nécessaire ;
- caméra indépendante de l'état monde.

Critère :
le renderer ne devient jamais propriétaire du gameplay.

## Phase 3 — Génération procédurale v1

- seed ;
- config de biome ;
- forêt ;
- clairières ;
- chemins ;
- rivière ;
- pont ;
- points d'intérêt ;
- validation d'accessibilité ;
- déterminisme testé.

## Phase 4 — Builder Exploration

- création manuelle ;
- édition d'une carte générée ;
- WorldDocument versionné ;
- validation ;
- sauvegarde JSON ;
- rechargement identique.

Critère :
Builder -> données -> runtime, jamais Builder -> mutation runtime.

## Phase 5 — Monde vivant

- créatures sauvages ;
- errance ;
- territoires ;
- poursuite/fuite ;
- spawns par biome/zone ;
- comportement piloté par config.

## Phase 6 — Interactions

- PNJ ;
- objets ;
- coffres ;
- portes ;
- bâtiments ;
- transitions entre cartes ;
- événements persistants.

## Phase 7 — Encounter Bridge

- Encounter Controller ;
- `CaptureEncounterSnapshot v1` ;
- raccord contractuel au combat Capture ;
- `CaptureCombatResult v1` ;
- retour à la position exacte ;
- application du résultat une seule fois.

Aucun accès direct aux internes du labo Combat.

## Phase 8 — Persistance / reprise

- ExplorationSave versionné ;
- seed/config ;
- position ;
- monde mutable ;
- entités persistantes ;
- événements consommés ;
- migrations idempotentes ;
- reprise après fermeture.

À l'intégration : adapter vers Core Storage GenSrpG.

## Phase 9 — Mobile/PWA hardening

- performances smartphone ;
- mémoire ;
- culling mesuré ;
- tactile ;
- longue session ;
- rotation/resize si supportés ;
- cache/preview sans logique gameplay.

## Phase 10 — Pré-intégration GenSrpG

Audit uniquement :
- mapping des fichiers ;
- mapping des propriétaires ;
- dépendances Core/Shell/Capture ;
- suppression des simulateurs locaux ;
- tests de frontière Capture/Dungeon/Survie/PvP ;
- plan de migration.

Aucune intégration au dépôt principal depuis ce laboratoire.

## Phase 11 — Intégration GenSrpG

Chantier séparé dans `Zombicide-40k`, soumis à sa charte et à ses checkpoints.

Le laboratoire devient une source de référence technique, pas une autorité parallèle.
