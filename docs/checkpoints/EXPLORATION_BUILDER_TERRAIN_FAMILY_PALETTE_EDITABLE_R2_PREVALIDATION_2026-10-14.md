# Prévalidation technique R2 — Palette famille de peinture éditable

Date : 2026-10-14

## Références

- Branche : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
- Base lot : `edfadb539fb53aacbf57dd91e79fe9a4efe374c1`.
- Correctif performance R1 publié : `76ee8373c6e4a312b8bab1bcc5326c244d437b75`, Pages `38473845161` SUCCESS.
- Dernier code R2 : `1623614534bddf2729f6222bdf0f5cb259ccfc95`.
- CI code R2 : `38480643515` SUCCESS, 438/438 tests + npm run check.
- RED : `4ce3685441fd7d5ee667512474c3efa7a153c4ba` / `38479770652` FAILURE attendue.

## Correction

- Forêt : Herbe cartoon et Sol de forêt disponibles, première texture cartoon.
- Plaine revient dans Sol, et Sable conserve sa texture sable.
- Route/Mer ne sont plus proposées dans les nouvelles sélections de peinture Sol ; chaque famille a un `paintKind` éditable dans l'éditeur de familles.
- Sélection multiple de textures par famille, persistée dans `WorldDocument.terrainFamilies[].surfaceMaterialIds` ; support des familles et textures personnelles.
- Suppression de la table native figée ; valeurs de défaut déclaratives dans MaterialPack et définitions de famille.
- Vieux WorldDocuments sans métadonnées restent compatibles et aucune surface de carte n'est modifiée silencieusement.
- Le runtime, les masques de Surface Renderer et les collisions conservent leur comportement.

## Gate smartphone obligatoire

1. Vérifier que la fluidité du Builder reste aussi bonne que dans la R1.
2. Sol : Plaine, Forêt, Sable visibles ; Route et Mer absentes des nouvelles familles Sol.
3. Forêt : choisir Herbe cartoon, puis Sol de forêt ; le rendu change correctement.
4. Familles de terrain : changer l'outil Sol/Route/Mer et cocher plusieurs textures ; enregistrer, exporter/importer WorldDocument et confirmer le classement.
5. Importer une texture dans une famille personnalisée et la retrouver dans cette famille, même si un classement explicite existe déjà.
6. Tester en jeu avec la même carte ; textures intactes, gameplay de terrain inchangé.
7. Gate collision R2 distinct (mur haut, arbre/rocher, bâtiment/pont, objets importés).

**État : GREEN TECHNIQUE / PREVALIDATION R2, validation smartphone et GREEN FINAL non obtenus.**
