# Labo Exploration — V79 R3C — Prévalidation du 25 octobre 2026

**Statut : PRÉVALIDATION TECHNIQUE — PAS GREEN final jusqu'au test Pixel du créateur.**

## Retour créateur pris en compte
- Porte R3B validée, conservée : taille, déplacement, véritable Portal.
- Formes peu compréhensibles : sélection Rectangle/L/T/Croix appliquée sans second bouton et contour des limites mis en évidence ; collision et contour lisent toujours WorldArea.boundary.
- Choix visuels : 4 variantes de porte, dont 3 fichiers WebP déjà dans les assets du dépôt, dans Portal.visual.assetId ; aucune duplication de point d'entrée.
- Murs : 5 motifs provisoires procéduraux Canvas (enduit, pierre, brique, bois, pierre de donjon), stockés dans WorldArea.wallMaterialId ; copies de modèles de pièce conservent le choix.
- Étages : sélection du Portal montée/descente, style escalier bois/pierre à partir des assets 2,5D existants, échelle bois provisoire Canvas ; placer au doigt/faire glisser le passage sur son Area source actualise le Portal.trigger et son targetSpawnId sur la WorldArea cible. Aucun autre moteur de mouvement.
- JSON : roundtrip des matériaux et des coordonnées des Portals/Spawns ; anciennes scènes compatibles.

## Autorités et gel
- **Source** : commit R3B publié `16b89aaab63674e150bc35869e3a4a7ccc7ed2ba`, checkpoint START `checkpoint/exploration-start-interior-shapes-materials-stair-placement-v79-r3c-2026-10-25`.
- **Branche** : `work/exploration-interior-shapes-materials-stair-placement-v79-r3c-2026-10-25`.
- **Code propriétaire** : WorldArea.boundary, WorldArea.walls, WorldArea.wallMaterialId, Portal.visual.assetId, Portal.trigger, WorldArea.spawns.
- **GEL** : caméra 35° validée ; murs tactiles R3A2 ; V77 pentes, V78 escaliers extérieurs ; éditeurs/Combat externes ; moteur principal GenS RPG.
- **Tests** : nouvelle batterie Node R3C + héritage ; smoke vrai Chromium sélection forme, matériau, porte, échelle tactile, export ; CI complète sur SHA `567698b716cf641b33bb80913caa847ddbfffcb8` → SUCCESS, run `40205793524`.
- **Publication** : Pages infrastructure-only épinglé au SHA CI exact, sans fusion fonctionnelle sur main.

## Limites assumées
- Matériaux des murs : prototypes procéduraux cohérents, pas encore un jeu définitif de textures WebP.
- Échelle : dessin Canvas provisoire ; pas de sprite ou d'animation de montée.
- Passages dans les cloisons et géométrie des portes intérieures autres que Portals non inclus.
- SculptLab preview, pas encore WorldDocument runtime.
- **GREEN produit uniquement après validation des outils R3C sur Pixel.**
