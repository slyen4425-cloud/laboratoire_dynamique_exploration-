# GenSrpG Exploration — Builder Terrain Layer Compositor — Prévalidation 2026-10-14

## Déclencheur et autorité
- Retour créateur : **éditeur inutilisable même sur PC performant** après quelques couches de terrain, sans rapport exclusif avec le smartphone.
- Diagnostic sur chemin réel : à chaque image de souris/pinceau, `renderPreview` recomposait toutes les zones, routes et rivières, y compris leurs masques floutés `smooth-mask` ; l'append du pinceau faisait aussi `JSON.parse(JSON.stringify(WorldDocument))` à chaque nouveau point.
- Lot autonome `work/exploration-builder-terrain-layer-compositor-2026-10-14` depuis `591cb2990e9961d0dea1ae053767dab9bb48802d` ; checkpoint START `checkpoint/exploration-start-builder-terrain-layer-compositor-2026-10-14`.
- WorldSurface/WorldDocument reste seul propriétaire des matériaux et des traces ; SurfaceRenderer existant continue à dessiner les couches. Aucun raster sérialisé ou modèle concurrent.

## Changements techniques
1. `src/builder/builder-terrain-compositor.js` conserve une image écran du terrain fini. Un surdimensionnement borné de la rasterisation laisse une marge de déplacement (maximum 180px CSS, selon écran), les petits pans sont satisfaits par copie recadrée, sans recalcul de masques.
2. Pendant `draw-path`, découpe canonique avant/tracé actif/après en conservant l'ordre Base → Zones → Routes → Rivières. Les couches finies avant et après sont chacune mises en cache. Seul le trait actif est redessiné à chaque frame.
3. L'appel de `SurfaceRenderer.draw` accepte l'option additive `includeBase:false` pour le tracé transparent et les couches postérieures ; le défaut `includeBase:true` maintient la sortie du renderer runtime.
4. Cache invalidé si modèle, zone, boundary, contenu du terrain, zoom, taille, render pipeline ou dépassement de la marge de caméra change ; cache réinitialisé explicitement au début d'un nouveau coup de pinceau, même si un ID WorldSurface est recyclé après undo.
5. Les buffers sont limités à une densité de 1 pixel de cache par pixel CSS (pas de raster 4K/retina inutile en édition) et libérés à `pagehide`.
6. `appendSurfacePathPoint` fait une copie immuable **sur la branche modifiée** (Area, Surface, collection, path, points), au lieu de sérialiser toutes les autres zones, objets et événements à chaque frame. Son résultat est toujours un WorldDocument canonique.
7. Nouveau `builder.html` entry query pour que le navigateur charge le graphe modifié sans conserver l'ancien script.

## Tests et garde-fous
- RED `6e0d1dc5ae95047b63ae2119c4f13202defa0fb5` + test immutabilité RED `ae37b5a206dd7229e3369fc406969e2719f6ebaf`.
- Sentinelles : couches avant/après avec zones/routes/rivières, trace seule en redraw, absence de redraw terrain en frames statiques, pan dans marge et au-delà, édition terrain, boundary, immutabilité, partage des segments non modifiés. Tests historiques d'architecture/cache/runtime conservés et adaptés pour distinguer entry Builder de celui du gameplay.
- HEAD fonctionnel initial `8b612d054e6efc29196b2a99c6303b808b61c5c3` ; CI `38603578445` **SUCCESS 457/457 tests et npm run check**.
- Pas de changement de collisions, traversée, rencontres, combat, progression ni caméra de jeu configurable (branche séparée toujours suspendue).
- Performance mesurée par comptage déterministe d'appels au renderer dans les sentinelles ; **FPS PC/Pixel réels non mesurés**.
- Statut **GREEN TECHNIQUE / PREVALIDATION**, pas GREEN FINAL avant publication Pages et retour utilisateur PC + téléphone.

## Gate utilisateur
- Carte vierge : 10 à 20 traits de surfaces différents et zones superposées ; déplacer la carte et zoomer, continuer à peindre sans freeze. Vérifier l'ordre visuel des routes et rivières.
- Tester plein écran paysage sur Pixel et fenêtre PC ; comparer au précédent aperçu, relever s'il reste des saccades après accumulation de couches.
- Export/reimport et mode test : terrains, textures, objets copiés, collisions non régressés.
- Si encore trop lent : profiler sur cartes exportées réelles, sans multiplier les couches de caches spéculatives.
