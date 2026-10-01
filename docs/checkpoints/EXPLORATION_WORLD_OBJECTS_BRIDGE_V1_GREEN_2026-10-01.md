# Checkpoint GREEN — World Objects / Bridge v1

Date : 2026-10-01

## Branche source
`work/exploration-world-objects-bridge-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-world-objects-bridge-v1-2026-10-01`

## SHA validé avant document de fermeture
`3875bfe22c11a853f93a570a5d792c6df28c4b57`

## Validation utilisateur
Test smartphone final : validé.

Retour :
- pont fonctionnel ;
- traversée fluide ;
- accrochage précédent corrigé.

## Validé
- WorldObject bridge v1 ;
- transform X/Y/rotation/scaleX/scaleY ;
- taille logique indépendante des pixels ;
- corridor traversable ;
- passage uniquement des obstacles explicitement référencés ;
- edge assist pour entrée diagonale ;
- tolérance numérique de frontière ;
- rivière bloquante hors pont ;
- renderer sans autorité collision ;
- collision sans dépendance asset/sprite.

## Régressions protégées
- passage légèrement décentré ;
- entrée diagonale ;
- limites flottantes après rotation.

## CI
Run `36908279274` — SUCCESS.

## Suite autorisée
Ouvrir un lot séparé depuis le checkpoint GREEN exact pour :
1. assets visuels de pont ;
2. puis Building / WorldArea / Portal selon la charte et la roadmap.
