# Exploration runtime — Terrain Raster Cache — Prévalidation du 14 octobre 2026

## Rapport du problème
- Après ajout de plusieurs zones terrain, fluidité très améliorée dans le World Builder (Terrain Layer Compositor V1) mais **jeu Exploration extrêmement lent** sur le même monde, d'après le test du créateur.
- Diagnostic précis dans `src/main.js` : `frame() → render() → drawGround() → surfaceRenderer.draw()` reconstruit toutes les couches et les masques `smooth-mask` coûteux **à chaque image**, même si les tracés sont statiques. Le cache de l'éditeur n'était jusqu'ici pas consommé par le jeu.
- Base documentée `aeb4b042374453ef84f6c27086edb24f79010e89` ; checkpoint initial `checkpoint/exploration-start-runtime-terrain-cache-2026-10-14` ; branche de travail `work/exploration-runtime-terrain-cache-2026-10-14`.

## Solution
- Une seule autorité de rendu des surfaces : `src/render/surface-renderer.js`, qui reste propriétaire des textures, transitions et masques ; aucun raster ni référence temporaire sérialisés dans WorldDocument.
- Extraction du même composant de mise en cache que le Builder dans `src/render/terrain-raster-compositor.js`. Compatibilité `src/builder/builder-terrain-compositor.js` par réexport ; mêmes tests Builder conservés. Aucun second moteur ou duplicata de la logique terrain.
- `src/main.js` route `drawGround()` vers `createTerrainRasterCompositor().draw()`, mémorisant une vue tampon du terrain statique. Le cache reste valable pour les frames successives et les petits mouvements de caméra, avec bordure plus large bornée (130–240 pixels CSS en jeu) ; si le bord de cache est dépassé, la vue est rebâtie depuis le Surface Renderer.
- Invalidation claire : `areaKey`, taille de canvas/viewport, niveau de zoom/DPR, changements éventuels d'identité de surface, sortie de la marge, `resize`, `pagehide`. Canvas temporaire de cache plafonné à 1 px raster par px CSS ; copie transparente vers la sortie DPR réelle.
- Clipping WorldArea appliqué aux images tampon et préservé au rendu principal. Les objets, obstacles, Portals, acteurs, créatures et animations restent dessinés normalement par leurs renderers d'origine après le terrain. Le `WorldDocument`, les collisions, déplacements, rencontres, sons et sauvegardes ne changent pas.
- Le graphe du module ESM runtime a une nouvelle révision de cache `?rev=runtime-terrain-cache-v1` et l'entrée index est cache-bustée `&runtime=terrain-cache-v1` pour éviter les anciennes versions navigateurs.

## Tests
- TDD test `tests/runtime-terrain-cache.test.js` commit initial `54aff8734260e7986f914881ef3e0a6d04518de0` (RED attendu).
- Tests déterministes : 120 frames sur 20 zones statiques → 1 seule recomposition des 20 couches ; pans dans la marge → zéro rebake, sortie de marge → recomposition ; Area/terrain changés → invalidation ; rendu des acteurs et WorldObjects séparé ; API du Builder réexportée identique.
- Code + tests et cache revisions au SHA `b62aa916e3247fb254af62c3d2c3ac0dae3bf8ee` : GitHub Actions CI `38611409304` **SUCCESS** ; **461/461 tests**, `npm run check` SUCCESS.
- Pas de FPS mesuré sur une machine réelle par ces tests. Ne pas déclarer GREEN FINAL avant test utilisateur.

## Tests manuels ciblés (gate utilisateur)
- Créer 15–20 tracés, superposer des zones, routes et rivières ; dans Builder, vérifier la fluidité déjà jugée meilleure.
- Lancer **Tester en jeu**, marcher sur la carte et traverser le bord de plusieurs zones, sans gel permanent. Observer également les premières secondes et les mouvements de caméra assez longs pour rebâtir la marge.
- Tester sur PC et téléphone paysage, contrôler transitions, position des textures, apparence des rivières/routes, présence objets/monstres, collisions et rencontres.
- Revenir au Builder, exporter/réimporter le même monde, retester.
- Si hitches ponctuels à la limite de la marge persistent, profiler le coût de la recomposition sur le document exporté avant d'envisager tuilage.
- Caméra de jeu configurable maintenue suspendue dans sa branche distincte ; aucun merge de gameplay vers `main` sans étape de publication d'une preview séparée.
- Statut : **GREEN TECHNIQUE / PRÉVALIDATION**, en attente de Pages et validation manuelle PC/téléphone.
