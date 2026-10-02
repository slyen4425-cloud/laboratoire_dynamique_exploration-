# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
Building WorldObject v1 — premier bâtiment extérieur paramétrable pour World Builder Dynamique.

## Branche
`work/exploration-building-visual-asset-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-building-visual-asset-v1-2026-10-02`

## SHA de base GREEN
`01302edfc0b0764f174e0c286d93a92b80192f9c`

## Dernier checkpoint GREEN
`checkpoint/exploration-bridge-visual-assets-v1-green-2026-10-02`

## Nom officiel de l'éditeur
Le mode d'édition Exploration porte désormais le nom :

**World Builder Dynamique**

Il reste un producteur de WorldDocument validé.
Il ne modifie jamais directement le runtime actif.

## Extension de périmètre validée — 2026-10-02
L'utilisateur demande explicitement de déposer le modèle validé sur GitHub et de construire le système Building dans ce même chantier.

Cette extension reste homogène :
**Building WorldObject v1 = asset + contrat de données + rendu + footprint/collision + paramètres d'édition.**

Aucun Portal/WorldArea runtime n'est inclus.

## Objectif du lot
Importer et raccorder le premier asset de bâtiment extérieur :
- petite maison fantasy bois/pierre ;
- vue du dessus légèrement inclinée ;
- fond transparent ;
- silhouette claire sur smartphone ;
- porte extérieure très lisible ;
- petit raccord de terrain au seuil ;
- asset visuel séparé du footprint/collision ;
- compatible avec un futur Door/Portal ;
- compatible avec position/rotation/scale dans World Builder Dynamique.

## Paramètres Builder futurs à prévoir pour Building WorldObject
- position X/Y ;
- rotation ;
- scale X/Y ;
- assetId ;
- footprint logique ;
- doorAnchor local ;
- portalId optionnel ;
- targetAreaId via Portal ;
- visible/enabled si besoin ;
- catégorie/template ;
- duplication/suppression.

Aucun de ces paramètres ne doit être caché dans le renderer.

## Règle bâtiment/intérieur
Le bâtiment extérieur reste un WorldObject.
L'intérieur reste une WorldArea séparée.
La porte extérieure devient un Door/Portal explicite dans le lot runtime correspondant.

## Périmètre
- documentation World Builder Dynamique ;
- import du premier asset bâtiment validé ;
- conversion WebP RGBA optimisée smartphone ;
- manifeste + SHA-256 + taille ;
- Asset Adapter ;
- Building WorldObject v1 ;
- transform X/Y/rotation/scaleX/scaleY ;
- footprint logique indépendant du sprite ;
- doorAnchors locaux ;
- portalRefs préparés mais inactifs ;
- transformation locale -> monde des doorAnchors ;
- collision bâtiment pilotée uniquement par Collision World ;
- renderer WorldObject building ;
- chargement asset explicite/awaitable ;
- bâtiment de démonstration ;
- tests/CI/preview mobile.

## Hors périmètre
- Portal runtime ;
- WorldArea runtime ;
- Builder UI ;
- sauvegarde ;
- placement runtime ;
- autre dépôt.

## AssetId prévu
`object.building.house.fantasy_wood_stone.01`

## Critère de sortie
Le bâtiment est visible en preview, paramétré par WorldObject, bloque via son footprint logique, expose un doorAnchor transformé correctement et reste entièrement éditable par données pour le World Builder Dynamique.

Aucune autorité visuelle/collision concurrente n'est tolérée.
