# Checkpoint GREEN — Map Actor Visual System v1

Date : 2026-10-02

## Branche source
`work/exploration-map-actor-visual-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-map-actor-visual-v1-2026-10-02`

## Base GREEN
`4e6f6c77ff231c00e5868ca8cf572137b1835922`

## SHA technique validé avant document de fermeture
`6937b0bf35eec81998ad91276961d7fcd3149c79`

## Validation utilisateur
Smartphone : **validé**.

## Validé
- MapActorVisual v1 ;
- un seul assetId suffit en mode simple ;
- rôles hero / npc / creature ;
- préparation automatique locale ;
- crop alpha ;
- détection prudente du fond uniforme ;
- état explicite opaque-unresolved ;
- anchor bas-centre automatique ;
- taille monde automatique/configurable ;
- ombre automatique ;
- miroir gauche/droite ;
- idle et bounce visuels sans spritesheet ;
- cache du visuel préparé ;
- renderer Map Actor sans mutation gameplay ;
- aucune seconde autorité de position/collision ;
- ancien cercle joueur retiré comme représentation concurrente ;
- pont / Building / Portal restent compatibles.

## Règle produit figée
**Le joueur peut fournir un seul visuel ; GenSrpG prépare automatiquement la représentation map.**

Les vues supplémentaires, spritesheets et animations dessinées sont facultatives.

## CI
Run `37001704879` — SUCCESS.

## Suite autorisée
Ouvrir un nouveau lot depuis le checkpoint GREEN exact pour :
- World Builder Dynamique UI v1 ;
- ou import utilisateur Map Actor dans un lot séparé.
