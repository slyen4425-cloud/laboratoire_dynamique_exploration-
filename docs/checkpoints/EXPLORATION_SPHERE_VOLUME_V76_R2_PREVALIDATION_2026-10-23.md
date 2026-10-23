# Exploration V76 R2 — Prévalidation : volume visuel des collines / cavités (23 octobre 2026)

## Retour Pixel
Le créateur confirme l'existence de la forme et de sa collision V76 mais **ne voit pas la hauteur de la colline ni la profondeur du trou**. V76 rejetée visuellement, V77 et V78 gelées.

## Gouvernance
- V75 R2 GREEN créateur : `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Base code V76 prévalidation : `25b6004c48643d0e82a5b8b5b8be9ba68bd43725`.
- START : `checkpoint/exploration-start-sphere-volume-v76-r2-2026-10-23` (sur SHA V76).
- Branche unique : `work/exploration-sphere-volume-v76-r2-2026-10-23`.
- Périmètre : rendu `sculpt-sphere-mesh.js`, raccord peinture/couleurs, retour visuel du paramètre hauteur/profondeur dans l'éditeur et tests. Le modèle du volume, son JSON et la collision ne changent pas.

## Cause
Les quads analytiques avaient quasiment la même texture que le sol, avec une légère ombre ; l'affichage ressemblait à un cercle plat malgré la vraie élévation calculée. Le fond des cavités très profondes sortait de l'ouverture circulaire en projection brute.

## Correction
- Même surface analytique `sculptSphereDisplacementAt` et même rayon canonique.
- Collines : ombre de contact et flancs de roche différenciés selon la palette existante, gradient lumière/ombre lié à la pente, courbes de niveau aux hauteurs calculées.
- Cuvettes : ouverture et découpe circulaire, parois minérales, fond très assombri ; compression de perspective **visuelle uniquement**, monotone de 1 à 7 niveaux, pour ne pas masquer le fond derrière la lèvre avant. Aucune modification des valeurs de profondeur ou des collisions.
- Réglages : libellés `Hauteur de colline` / `Profondeur`, valeur signée en niveaux directement dans la barre d'édition, min=1 pour les formes sphériques.
- Assets et gameplay gelés : 20 cascades V3, 28 ponts, V75 R2 falaises, vol/nage/eau, moteurs World/Combat, export/import.

## Tests et exigences
- Node : coordonnées verticales amplitude 1,3,7 dans les deux sens, mêmes hauteurs et rayons, couleurs de flanc, surface découpée du trou, ombre de contact et affichage.
- Chromium vrai Canvas : pixels de relief non plats dans les deux variantes, contrastes et évolution monotone de l'amplitude pour 1,3,7 ; smoke complet Sculpt/Builder/Combat.
- CI exacte du dernier SHA documentaire puis checkpoint prévalidation et publication Pages par PR infra séparée uniquement. Pas de fusion de code métier dans `main`.
- **NON GREEN utilisateur** : vérifier sur Pixel la vraie perception des volumes et la cohérence des réglages. Le rendu pourra nécessiter des ajustements artistiques après essai ; V77/V78 interdits avant validation explicite.
