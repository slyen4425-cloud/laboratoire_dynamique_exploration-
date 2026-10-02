# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
Building Visual Asset v1 — premier bâtiment extérieur pour World Builder Dynamique.

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

## Objectif du lot
Créer et préparer le premier asset de bâtiment extérieur :
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
- définition du premier besoin visuel bâtiment ;
- génération artistique du premier asset ;
- validation visuelle par l'utilisateur ;
- préparation du futur assetId sémantique.

## Hors périmètre
- collision bâtiment ;
- Portal runtime ;
- WorldArea runtime ;
- Builder UI ;
- sauvegarde ;
- placement runtime ;
- autre dépôt.

## AssetId prévu
`object.building.house.fantasy_wood_stone.01`

## Critère de sortie
Un visuel de bâtiment validé, cohérent avec l'environnement Exploration, prêt à être importé dans un lot d'asset/runtime séparé.
