# Plan V79 R3 — Éditeur d'intérieurs construit pour la 2,5D

Date : 2026-10-24. **Plan seulement ; aucun mur ni étage structurel n'est déclaré implémenté par ce document.**

## Retour du créateur
Le nouvel intérieur ne doit pas reprendre sans distinction les outils de construction de terrain extérieur. Il doit permettre des murs, des ouvertures/portes, plusieurs pièces, des étages reliés, et le choix entre création libre et modèles de pièces réutilisables. Les commandes doivent rester dans la palette flottante plein écran.

## Point de départ et dépendance
R1 = WorldArea/Portal maison intérieur 2,5D (prévalidation Pixel).
R2 = porte intérieure visible sur le Portal, cinq sols du Material Registry, modèles de pièces copiés sans Portal/Area, actions dans la palette flottante.
**Démarrage de R3 uniquement après validation produit de R2 et checkpoint GREEN correspondant**, puis START immuable / branche dédiée / tests selon LAB_CHARTE.

## Géométrie et propriétaires
- **WorldArea** conserve identité, dimensions, forme, spawns et portails d'étages. Ajouter des données structurées de bâtiment/étage à l'autorité de WorldDocument lors du lot prévu ; ne pas inventer un autre format de carte en dehors du runtime.
- **Murs** : segments géométriques continus en coordonnées monde, avec épaisseur et hauteur. Les coins et jointures sont dérivés des sommets des segments adjacents ; pas de textures qui déterminent la collision.
- **Ouvertures** : intervalles orientés, référencés par l'identifiant du segment de mur parent ; porte = ouverture + représentation + éventuel Portal/interaction canonique. Un mur avec porte n'est jamais doublé par une collision invisible.
- **Collision World** : seule autorité physique. Lit directement les segments, soustrait les ouvertures, vérifie rayon et locomotion de l'acteur. Aucun obstacle rectangulaire secondaire pour le même mur.
- **Renderer** : projection 2,5D par caméra existante (35–90°), murs éloignés et proches, masquage/assombrissement des murs qui couvriraient le héros ; aucune autorité gameplay.
- **Matériaux** : identifiants de surface natifs `floor.wood.house`, `floor.wood.dark`, `floor.tile.light`, `floor.tile.sandstone`, `floor.concrete.gray`. Palette murale native versionnée par Material Registry, sans hotlink ni seconde autorité.
- **Étages** : définition de niveau/WorldArea par étage et liaison par le contrat Portal existant ; si un escalier exige une montée continue réelle, réutiliser uniquement le couloir de franchissement canonique du moteur, puis documenter le changement d'Area au palier. Ne pas déduire le passage d'un sprite.

## Ergonomie mobile
Palette d'intérieur dédiée, dans le même panneau flottant : `Pièces / Murs / Ouvertures / Sol / Escaliers / Déco / Modèles / Tester / Retour extérieur`.
Outil de création simple : premier appui début de mur, second appui fin ; aperçu, accrochage aux extrémités, validation, annuler/rétablir et poignée pour ajuster.
Placer une porte en touchant le mur : ouverture persistante dans le segment et rendu de porte, sans nouveau Portal si c'est une simple porte intérieure. Porte d'entrée extérieure = Portal de bâtiment déjà existant.
Étages : ajouter/renommer/supprimer un étage (suppression refusée si des raccords seraient orphelins), sélectionner l'étage courant et positionner les montées/descendes en indiquant les points de sortie.
Modèles : **libre ou modèle au choix**, un modèle est un contenu neutre (murs, sols, pièces, décors, hauteurs) ; les IDs de maison, de WorldArea, de Spawns et les Portals sont résolus à l'application par le bâtiment cible. Ne jamais transformer le modèle en autorité partagée entre deux maisons ; personnalisation de la copie autorisée.

## Découpage proposé (1 lot = 1 branche)
1. R3A : segments de murs 2,5D et outils de pose/suppression, rendu et collision directement sur le modèle ; tests Node et Chromium.
2. R3B : portes/ouvertures, portes internes avec passages et raccord de porte extérieure, tests gameplay et traçabilité.
3. R3C : pièces de contours libres, sols par pièce, présets de formes, sauvegarde compatible.
4. R3D : étages multiples, escaliers, chemin entrée→étages→sortie sans doublon de mouvement.
5. R3E : enrichir modèles de pièces (murs, portes internes, sols, étages), export/import et panneaux plein écran ; validation Pixel.

## Sentinelles
Régression zéro sur pentes V77 R3, escaliers V78 R2, ponts/eau/sphères, caméra 35°/55°/90°, portes V79, import JSON hérité, placement mobile, objets, Capture/Combat ; pas de nouveau lot GREEN sans test smartphone.

## Limites connues R2
La porte de façade existe via son anchor, et le seuil de sortie intérieur est visible, mais sa géométrie murale n'est pas encore éditable. La bibliothèque actuelle sauvegarde le contenu SculptLab de pièce et ne contient pas de murs structurels ou d'étages. R2 est une prévalidation mobile, pas un remplacement du runtime WorldDocument.
