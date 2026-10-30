# Checkpoint GREEN — Transition + Decals v1

Date : 2026-10-01

## Branche source
`work/exploration-transition-decals-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-transition-decals-v1-2026-10-01`

## SHA validé avant document de fermeture
`bf6abace4ceafc604d8360e503d809bbcdf29858`

## Validation
Utilisateur smartphone : validé.

Validé :
- Material Pack v1 ;
- textures pilotes forêt / route / rivière ;
- transitions route -> herbe ;
- berge rivière -> herbe ;
- decals feuilles / racines ;
- fluidité générale ;
- géométrie routes/rivières inchangée ;
- mouvement / collisions / caméra inchangés.

## CI
Run `36903962871` — SUCCESS.

## Architecture gelée
- géométrie de surface indépendante des matériaux ;
- transitions pilotées par renderer ;
- decals sans collision ;
- assets locaux résolus par identifiants sémantiques ;
- aucun hotlink inter-dépôt.

## Suite autorisée
Ouvrir un lot séparé `World Objects / Bridge v1`.

Le modèle futur bâtiments/portals est validé au niveau architecture, mais n'est pas implémenté dans ce checkpoint.
