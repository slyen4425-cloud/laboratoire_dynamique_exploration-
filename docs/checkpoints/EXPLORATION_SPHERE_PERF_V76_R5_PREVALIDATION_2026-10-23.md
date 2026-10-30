# Exploration V76 R5 — performance / volume arrière / textures existantes (23 octobre 2026)

## Retour créateur
Sur la prévalidation V76 R4, le créateur signale un lag majeur lorsque les reliefs sphériques sont présents, souhaite une **bande sombre au fond / à l'arrière du relief** pour lire son volume et constate que les flancs n'utilisent pas les textures déjà créées. **V76 R4 NON GREEN**. La validation V75 R2 reste le dernier GREEN créateur.

## Branche et isolation selon la charte
- Base exacte V76 R4 : `7236f81591b326f732acacf82d7dc6d97771a292`.
- Checkpoint START immuable : `checkpoint/exploration-start-sphere-perf-v76-r5-2026-10-23`.
- Branche unique : `work/exploration-sphere-perf-v76-r5-2026-10-23`.
- V75 falaises, World Model sphère/JSON, Collision World, nage/vol, caméra, ponts V74, 20 cascades V3, Builder/Combat sont **gelés**. Aucun moteur de gameplay mergé dans main. V77/V78 interdits avant GREEN Pixel.

## Corrections
1. **Cache pendant édition** : réutiliser le cache du fond `navigationBackground()` aussi quand l'éditeur n'est pas en train de modifier des hauteurs. Un simple mouvement de souris, visée ou survol ne redessine plus toute la carte et tous les cercles ; le cache est invalidé au changement de terrain, d'asset ou de matière et le pinceau reste une surimpression.
2. **Maillage par sphère** : calculs de projection mémorisés sur l'objet sphère immuable et le terrain courant, 36 segments × 10 bandes (contre 64 × 16), surfaces réunies en chemins composés peints en seulement quelques passes communes et non individuellement avec gradients par polygon.
3. **Vrais matériaux** : roche avec la couche `gray/ochre` extraite via l'adapter V49 `sculptCliffHDLayers` du `cliff-base-hd-v49.webp` (même source que les falaises historiques) ; herbe via `grass.forest` et terre via `ground.forest_floor`, chargées par le Material Registry/Asset Adapter déjà utilisés. Une unique projection répétable ancrée dans le monde est appliquée à **toute la surface de flanc**, sans UV remis à zéro par petite case, suivie d'une ombre continue. Pas de nouvel asset ni doublon d'autorité.
4. **Lecture de volume** : croissant sombre semi-transparent sur le demi-cercle arrière, construit directement avec les points de hauteur analytique du maillage. Pas de contour noir permanent ; le guide clair pointillé reste exclusif au mode éditeur.

## Tests
- Node : modèle d'altitude et d'empreinte collision historique inchangé, JSON compatible, limites de complexité du maillage, textures canoniques peintes UNE fois par forme, flanc arrière existant.
- Chromium Sculpt : pixels 1/3/7 niveaux, prise en charge du plein écran, guide temporaire avant/après, pose réelle/export ; tests R5 pour présence de **trois vrais assets** et 24 mouvements de souris sans reconstruction du raster terrain.
- Gate obligatoire avant publication : CI Node + check + Chromium Sculpt/Builder/Combat au **SHA final**, comparaison R4→R5 (aucun asset modifié), checkpoint prévalidation et PR infra pinning.
- **NON GREEN Pixel** jusqu'à test utilisateur sur la fluidité, les vrais flancs et l'effet de croissant arrière. La CI ne remplace pas un essai sur téléphone.
