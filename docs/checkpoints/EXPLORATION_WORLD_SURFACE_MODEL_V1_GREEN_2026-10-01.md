# Checkpoint GREEN — World Surface Model v1

Date : 2026-10-01

## Branche source
`work/exploration-world-surface-model-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-world-surface-model-v1-2026-10-01`

## SHA validé
`5579e930c99e940d97723826691913b6f150603e`

## Périmètre validé
- sol de base indépendant ;
- routes structurées en points X/Y + largeur + materialId ;
- rivières structurées en points X/Y + largeur + materialId ;
- renderer séparé du World Model ;
- aucune texture n'impose la géométrie ;
- aucune grille comme autorité ;
- collisions existantes conservées.

## Tests automatiques
GitHub Actions run `36883335006` — SUCCESS.

## Validation utilisateur
2026-10-01 :
la structure est jugée logique pour **herbe / route / rivière**.

## Hors périmètre
- style artistique final ;
- textures finales ;
- ponts ;
- bâtiments ;
- génération procédurale ;
- Builder.

## Étape suivante autorisée
Nouveau lot visuel dédié :
- matériau herbe ;
- matériau route ;
- matériau rivière ;
- transitions/bords ;
sans modifier la géométrie validée du World Surface Model.
