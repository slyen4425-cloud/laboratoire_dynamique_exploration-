# GenSrpG — Terrain très chargé : élimination des hitches de rendu (prévalidation 2026-10-14)

## Problèmes reproduits par lecture du code
- Creator feedback: Builder mieux mais lent quand la carte se remplit ; en jeu freeze bref et régulier (~2 secondes) au déplacement ; transition des routes disparue à rendre configurable plus tard. Priorité : *ultra-fluidité PC + smartphone avant les améliorations de caméra*.
- Le cache runtime précédent préparait la **fenêtre entière + marge de 130–240px** de manière synchrone dès que la caméra sortait de la marge. Chaque rebake retraitait toutes les couches avec leur `smooth-mask`, créant un pic CPU/main-thread. C'est une cause plausible des hitches constatés, sans preuve d'un profilage sur l'appareil du créateur.
- Le SurfaceRenderer de l'éditeur reconstruisait les filtres de tous les tracés, même situés très loin hors de la vue, lors d'une invalidation de cache.

## Gouvernance
- Branche `work/exploration-terrain-render-hitch-culling-2026-10-14`, base `4908af931948cf265255c8a7d2b86ea6ab563edf`.
- Checkpoint START `checkpoint/exploration-start-terrain-render-hitch-culling-2026-10-14`.
- Autorité inchangée : `WorldSurface`, `SurfaceRenderer`, `WorldDocument`. Optimisation exclusivement dans l'adapter de rendu des terrains; pas de second modèle, pas d'algorithme de collision alternatif. Moteurs Combat, Capture, encounters, mouvement et production inchangés.

## Correctifs
1. `src/render/terrain-raster-compositor.js` : extension de l'unique mécanisme de cache par un mode `createTerrainTileCache` réservé au jeu. Tuiles monde de 384px, débord de 128px pour conserver les transitions en bords, caméra ne déclenchant plus de rebake de la fenêtre complète.
2. Préparation bornée à 2 nouvelles tuiles/RAF sur PC et 1 sur smartphone, avec prélecture des tuiles voisines pour avancer sans gel ; max 48 tuiles PC / 28 smartphone, éviction LRU.
3. Le premier affichage peut montrer de façon transitoire la couleur de base sur quelques tuiles en attendant leur calcul ; ce compromis est explicitement surveillé au gate manuel. La mémoire cache est libérée lors du resize/pagehide.
4. `src/render/surface-renderer.js` : calcul unique des bornes XY de chaque tracé via WeakMap, et culling spatial des zones, routes et rivières invisibles **avant** leurs coûteuses passes de masque; optimisation consommée aussi par l'éditeur. Élargissement conservateur pour protéger les lissages et bordures des éléments proches du bord.
5. `src/main.js` et `index.html` : raccord de la nouvelle variante runtime et cache-bust ciblé sans changer le chemin des rencontres ni casser l'éditeur.
6. Fluidité du rendu en mouvement indépendante de la fréquence de rencontres et de l'animation des personnages ; sauvegarde/export non touchés.

## Tests
- TDD sentinelle `tests/terrain-tile-hitch-culling.test.js` : nombre borné de renders par frame, caméra au-delà de l'ancien overscan, pas de rebake après petites translations, éviction/invalidations, culling du vrai SurfaceRenderer des zones/routes/rivières hors écran, frontières DOM et Builder.
- CI tests + architecture : `38615336474` GREEN au SHA `e6a82a526406e737f9339cc9de96f61cf41717ae` (**466/466 tests**, npm run check GREEN).
- Réglage des budgets smartphone et règle de roadmap ensuite ; revalider le HEAD de checkpoint avant publication.
- Aucun FPS chiffré réel ni garantie de fluidité absolue ; prévalidation uniquement tant que test PC et Pixel du créateur en déplacement continu n'est pas validé.

## Test utilisateur demandé
1. Charger une même carte de 15–20 couches ; 1 à 3 minutes de déplacement continu sur PC puis smartphone ; comparer micro-freezes réguliers d'avant.
2. Peindre des couches successives, déplacer/zoomer le Builder : vérifier la fluidité en remplissant la carte et l'absence de zones manquantes/sutures.
3. Vérifier que sols, routes, rivières, objets, collisions, rencontres, import/export ont été préservés.
4. Transition des routes : le défaut est *noté mais non corrigé dans ce lot de performance*. Prévoir un lot dédié au fondu configurable **après** la validation de fluidité, puis reprendre la caméra de jeu configurable.

Statut : **GREEN TECHNIQUE / PRÉVALIDATION**, pas GREEN FINAL sans tests utilisateurs.
