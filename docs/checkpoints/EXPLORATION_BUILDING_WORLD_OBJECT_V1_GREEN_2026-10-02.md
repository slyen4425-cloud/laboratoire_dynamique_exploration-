# Checkpoint GREEN — Building WorldObject v1

Date : 2026-10-02

## Branche source
`work/exploration-building-visual-asset-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-building-visual-asset-v1-2026-10-02`

## Base GREEN
`01302edfc0b0764f174e0c286d93a92b80192f9c`

## SHA technique validé avant document de fermeture
`50baa1e83a9fdff106130beb93a83c46e6b99c92`

## Validation utilisateur
Smartphone : **validé**.

## Validé
- premier Building WorldObject v1 ;
- asset maison fantasy bois/pierre ;
- WebP RGBA 384×384 vérifié ;
- assetId sémantique unique ;
- X/Y / rotation / scaleX / scaleY ;
- baseSize logique ;
- footprint orienté indépendant du sprite ;
- collision détenue par Collision World ;
- doorAnchors locaux ;
- transformation doorAnchor local -> monde ;
- portalRefs préparés mais inactifs ;
- renderer Building sans autorité collision ;
- aucune autorité visuelle concurrente ;
- paramètres prêts pour World Builder Dynamique ;
- artefact Pages vérifié.

## CI
Run `36950297203` — SUCCESS.

## Suite autorisée
Ouvrir un nouveau lot depuis le checkpoint GREEN exact pour :
- WorldArea / Portal v1 ;
- ou UI World Builder Dynamique dans un lot séparé.
