# Checkpoint GREEN — WorldArea / Portal v1

Date : 2026-10-02

## Branche source
`work/exploration-worldarea-portal-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-worldarea-portal-v1-2026-10-02`

## Base GREEN
`bb8cad37400ba6853e3aba76ffc633303c263bcb`

## SHA technique validé avant document de fermeture
`045da062690a6807836d82c24a7cff3197fe627d`

## Validation utilisateur
Smartphone : **validé**.

## Validé
- WorldArea v1 ;
- WorldDocument multi-Areas ;
- Portal v1 ;
- trigger building-door depuis doorAnchor Building GREEN ;
- trigger point générique ;
- targetAreaId + targetSpawnId ;
- currentAreaId + X/Y comme état runtime ;
- transition sans reload ;
- entrée maison ;
- intérieur ;
- sortie ;
- retour extérieur explicite ;
- Portal Model autorité unique ;
- Building sans portalRefs concurrents ;
- Portal visual marker piloté par données du Portal ;
- rendu Portal sans autorité gameplay ;
- régression intérieur noir protégée ;
- régression sortie invisible protégée.

## Backlog visuel
Habiller les sorties/intérieurs avec des assets dédiés (porte, escalier, sortie, mobilier) dans un lot visuel séparé.

## CI
Run `36991148105` — SUCCESS.

## Suite validée
1. Map Actor Visual System v1 ;
2. World Builder Dynamique UI v1.
