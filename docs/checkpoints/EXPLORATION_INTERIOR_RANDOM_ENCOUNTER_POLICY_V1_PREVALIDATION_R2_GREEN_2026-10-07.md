# Checkpoint prévalidation R2 GREEN — Interior Random Encounter Policy v1

Date : 2026-10-07

## Pourquoi une R2

La prévalidation r1 était techniquement GREEN mais son `index.html` réutilisait encore la clé publique de cache
`main.js?rev=building-interiors-passages-ux-r1`.

Ce n'était pas une erreur de logique Encounter, mais cela pouvait faire exécuter un ancien `main.js` sur un smartphone ayant déjà visité la preview précédente.
La r1 est donc supersédée **avant toute gate utilisateur**.

## Correctif cache

- test RED public entry : `e674a74eedb7c5824610f4ee25f1dba06a445697`
- CI RED : `37635066394` — FAILURE attendue
- `index.html` -> `main.js?rev=interior-random-encounter-policy-v1` : `8c5de3f15ad7aac047aa0e988c09524eab620fb1`
- séparation sentinelle révision publique / WorldObject interne : `84e16c16c68e468d84eaf4f0531b7d3ee7530925`
- CI GREEN : `37635333675` — SUCCESS

## Contrat gameplay inchangé

- WorldArea v5 possède `encounters.randomEnabled`.
- exterior -> true par défaut.
- interior -> false par défaut.
- override explicite autorisé.
- Encounter Controller coupe `terrain-random` avant RNG.
- Portal / Renderer / Combat Bridge / texture / terrainFamilyId restent hors policy.
- Combat explicite n'est pas désactivé globalement.

## Gate

Créer :
- `checkpoint/exploration-interior-random-encounter-policy-v1-prevalidation-r2-green-2026-10-07`
- `preview/exploration-interior-random-encounter-policy-v1-r2-2026-10-07`

Puis test smartphone avant GREEN FINAL.
