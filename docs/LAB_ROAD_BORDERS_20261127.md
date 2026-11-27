# Routes et bordures automatiques — lot isolé (NON GREEN)

START : 74874a12c569b086335de69fcb80564c34c4dd6a
Checkpoint : checkpoint/exploration-start-road-borders-20261127.
Branche : work/exploration-road-borders-20261127.
Demande auteur 27/11 : travailler uniquement sur cette branche, ne pas fusionner ni publier (public ou PWA) pendant les publications en cours. Ne pas ouvrir de preview publique ni déclencher manuellement des workflows. Préserver #561 et #564 ; réconcilier leurs changements ultérieurement sans écraser les sauvegardes ou la bibliothèque.

## Périmètre et autorité
- Le WorldSurface v3 reste l'unique autorité de la géométrie des routes. Extension visuelle optionnelle par route ; aucune bordure pour les anciennes routes. Pas de nouvelle clé de stockage.
- Les matériaux et la bibliothèque existante possèdent les références d'assets, pas la géométrie ni les collisions. Le nouveau catalogue de bordures est à raccorder à cette bibliothèque, sans copie de sources.
- ZIP source Genesis_Bordures_Routes_v1.zip, blob a46b5327fe6c59b38afde0c69d77e02f881c86a6 (empreinte vérifiée sur le fichier local). 6 bandes 512x128 et 8 sprites 128x128. PNG sources et WebP sans perte : seul le WebP est destiné à la livraison. Bande extérieure en haut, axe y=64 ; sprites pivot centre. Aucun asset de volume arbitrairement retourné sans recette 2.5D.
- Bordure désactivable, choix d'asset et réglage par côté, largeur, échelle, décalage, espacement et opacité. Désactiver sans perdre la route. Intersection : masquer les bords internes selon la géométrie réelle, et non selon l'alpha de la texture.
- Gomme locale : corriger removeSculptSurfaceAt (supprime actuellement un trait entier), balayage tactile, undo/redo transactionnel. Ne pas modifier silencieusement les routes déjà enregistrées.
- Courbes : prévoir des points de contrôle éditables dans le contrat canonique avec projection déterministe commune à rendu, rencontre et traversée ; pas de tracé visuel concurrent. Évaluer la limite actuelle 80 traits / 512 points avant extension.

## Ordre de travail
1. Contrat visuel facultatif et tests de préservation des anciens documents.
2. Import contrôlé des assets canoniques, sans mettre le ZIP ni les PNG sources dans le site.
3. Contours et rendu dans le renderer existant ; intersections, relief, masquage eau, bords de carte, ponts. Cache invalidé sur changement, sans nouvelle boucle RAF.
4. UI : sélectionner route / bordure / sans bordure, gomme locale et poignées (PC/tactile), sans doublon de l'outil textures. Raccord avec #564 à coordonner.
5. Tests Node, import/export des mondes, navigateur PC et Pixel paysage, tests sentinelles et budget Pages. Validation auteur puis autorisation distincte de fusion/publication. Aucun GREEN avant preuves.

## Candidat de développement — état NON GREEN
- Contrat WorldSurface, géométrie de courbe, gomme locale par section (pas une gomme pixel indépendante), dessin libre, sélection, poignées, styles gauche/droite, chargement WebP et rendu par cellule raccordés au Sculpt 2.5D. V80 reste sans nouveaux contrôles.
- npm run build:road-borders matérialise les 14 WebP depuis le ZIP source vérifié ; npm test le fait automatiquement. Le smoke Chromium construit aussi les ressources. Aucun PNG source/ZIP supplémentaire n'est livré ; l'archive originale demeure dans Git. L'intégration PWA ultérieure devra appeler ce build avant copie et exclure le ZIP.
- Les portions décoratives hors carte restent sur le contrat historique ; import utilisateur et presets à coordonner avec le propriétaire de la bibliothèque (#564). La limite 80 tracés est conservée en attendant un test de charge et le lot de sauvegarde #561. Les 32 nœuds/512 points sont bornés.
- Tests du modèle, de découpe, des courbes et des croisements ; smoke navigateur ajouté pour pixels, chargement et sauvegarde. CI exacte et validation mobile encore nécessaires. Pas de promotion main/public/PWA sans autorisation.

## Autorisation de promotion du 27/11
CI initiale a3d6ba5 : 1508 tests réussis, 3 jobs GREEN (46020593997). Auteur autorise explicitement la fusion Exploration main pour recette. Réconciliation avec main 5f684c4 (sauvegardes #561, bibliothèque #564), conservation du registre des matériaux personnels. Nouvelle CI nécessaire avant fusion. Pas de raccord PWA.
