# Exploration V79 R3D — Prévalidation correction croix / caméra / rotation

Date : 2026-10-25 — statut **PREVALIDATION technique, NON GREEN produit** jusqu'au retour Pixel.

## Retour créateur et périmètre
- R3C : escaliers et choix de formes validés mais **forme croix difficile à parcourir latéralement** ; avatar parfois invisible après modification du **zoom ou de l'inclinaison** ; **rotation indépendante des escaliers/échelles** souhaitée.
- Base immuable : `033018028bbeadc0a5f5f1f16fc056d187f0a706` (R3C, CI verte) ; checkpoint START `checkpoint/exploration-start-cross-camera-stairs-rotation-v79-r3d-2026-10-25`, branche `work/exploration-cross-camera-stairs-rotation-v79-r3d-2026-10-25`.

## Corrections et autorités
- Croix/L/T : les limites restent exclusivement `WorldArea.boundary`, vérifiées par `Collision World`. Tests explicites de marche latérale complète par `stepMovement` de gauche à droite, avec coins découpés toujours bloqués. En mode Tester, spawn des zones polygonales priorisé dans la jonction centrale, plutôt que dans le bras du bas, pour éviter de croire le déplacement latéral bloqué.
- Caméra : la `sculptCameraInteriorView` validée (35–90°, sans shear) ne change **pas**. `sculptCameraFollowActor` pure affine centre l'avatar projeté à 50 % largeur / 54 % hauteur du canvas pour toutes les tailles d'intérieur ; elle ne contraint plus la caméra aux bords des petites cartes qui faisaient disparaître le personnage. Les caméras extérieures, la physique, les coordonnées de jeu et la scène sauvegardée sont inchangées. Zoom souris, zoom du jeu, slider de zoom et inclinaison recentrent l'acteur.
- Escaliers : l'orientation 0–359° se sauvegarde exclusivement dans `Portal.visual.rotationDeg` normalisé, sur le Portal choisi montée ou descente. Le rendu WebP/dessin pivote autour du vrai `Portal.trigger`, alors que le marqueur ↑/↓ reste lisible. La position du Portal, le Spawn cible et les collisions sont inchangés. Contrôle mobile curseur 0–359° et boutons +/-45°.
- Compatibilité : les anciens Portals sans rotation restent inchangés ; l'import/export `interiors[]` conserve la rotation.
- Cache : les nouvelles URLs de scripts/modules sont révisées pour les téléphones avec PWA/Cache anciens.

## Validation
- Tests Node `tests/sculpt-interior-cross-camera-rotation-v79-r3d.test.js` : géométrie de croix, déplacements réels, 5 angles × 5 zooms × 5 positions, rotation Portal et JSON.
- Tests Chromium `scripts/smoke-sculpt-terrain-lab.mjs` : rotation réelle via interface, neuf combinaisons de caméra et contrôle des coordonnées projetées du héros dans le canvas.
- Suite Node/Chromium et Pages sur commit épinglé, **à vérifier avant validation**.
- Aucun merge du code métier vers `main` : seul le workflow Pages peut épingler un commit CI validé ; retour Pixel nécessaire pour GREEN final.

## Gel et limites
- Murs R3A2, caméra visuelle d'intérieur validée, formes/capteurs Portals, pentes V77, escaliers extérieurs V78, Combat et application GenS RPG principale intacts.
- Ce lot reste limité au SculptLab, pas encore au runtime WorldDocument définitif.
