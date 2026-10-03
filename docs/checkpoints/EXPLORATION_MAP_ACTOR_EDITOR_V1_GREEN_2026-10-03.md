# Checkpoint GREEN — Map Actor Editor v1 / calibration technique

Date : 2026-10-03

## Branche source
`work/exploration-map-actor-editor-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-map-actor-editor-v1-2026-10-02`

## Base GREEN
`80e6468eda0261e0f7db12c81f98beb13df339ab`

## Périmètre validé
- MapActorVisual v1 réutilisé comme autorité visuelle unique ;
- import d'un visuel unique ;
- préparation automatique du visuel ;
- targetHeight / anchor / ombre / mouvement visuel ;
- sourceFacingX gauche/droite ;
- miroir automatique selon actor.facingX ;
- handoff Builder -> runtime -> Builder ;
- aucune position/collision/stat/IA parallèle ;
- séparation produit figée entre authoring Héros/Créatures et placement World Builder.

## Validation utilisateur smartphone
**GREEN** le 2026-10-03.

Confirmé :
- image importée chargée ;
- runtime conserve le visuel et ses réglages ;
- retour Builder conserve la session ;
- orientation gauche/droite correcte pendant le déplacement.

## CI / preview
- CI orientation/calibration : `37092728326` — SUCCESS ;
- CI documentation finale preview : `37092825426` — SUCCESS ;
- Pages preview : `37092783843` — SUCCESS ;
- main infra SHA : `610aa7b61dcf2a4ec0c3b5078516d53946b72110` ;
- artifact Pages : `11263361848`.

## Architecture produit figée
```text
Éditeur Héros/PNJ/Créatures
        ↓
Actor Definition + MapActorVisual
        ↓
Actor Catalog
        ↓
World Builder sélection + placement/référence
        ↓
WorldDocument
        ↓
runtime Exploration
```

Le panneau actuel du Builder reste un banc de calibration du laboratoire.

## Suite
Rejouer Surface Traversal Rules v1 depuis ce checkpoint GREEN exact.
L'ancienne branche Surface Traversal du 2026-10-02 est uniquement une source de changements techniques à reporter, jamais une base de branche ou une branche publiable.
