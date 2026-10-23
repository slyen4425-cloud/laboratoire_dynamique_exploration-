# Exploration V76 R7 — Ombrage harmonisé avec les hauteurs standards (23/10/2026)

## Retour du créateur
V76 R6 : le sommet et l'ergonomie sont améliorés, mais l'ombrage reste insuffisant. Demande : **ombreges en profondeur sur roche et herbe, contours extérieurs assombris, même comportement visuel que les hauteurs sculptées standards**. Ne pas changer la forme, les collisions ou la fluidité.

**Statut V76 R7 : PRÉVALIDATION TECHNIQUE, NON GREEN Pixel**.

## Gouvernance / base
- Dernier GREEN utilisateur : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Base V76 R6 publique source `bfff4855395930bb134f7e48dec18ee15198479a`.
- START checkpoint immuable : `checkpoint/exploration-start-sphere-lighting-v76-r7-2026-10-23`.
- Branche unique : `work/exploration-sphere-lighting-v76-r7-2026-10-23`.
- Source propriétaire unique : World Model pour hauteurs ; Collision World pour accès ; Material Registry / Asset Adapter pour textures ; Render pour ombrages.
- Pas de rustine, pas de second moteur, pas d'édition sur main hors PR de pinning Pages. V77/V78 restent gelées.

## Implémentation
- `src/render/sculpt-sphere-mesh.js` uniquement : palettisation liée aux repères de `src/render/sculpt-height-renderer.js`, en conservant une fonction de lumière strictement **visuelle et dérivée**.
- Comme les parois standards : éclaircissement proche du sommet et de la source lumineuse ; dégradé vertical progressif qui assombrit le pied ; gradients latéraux (.12 ombre-lumière / .19 côté exposé opposé) ; ombre de contact qui croît avec la hauteur sans dépasser .37.
- Sur la surface herbeuse : léger ton d'altitude comme `sculptGroundReliefLighting` ; bande sombre douce uniquement sur les faces externes du sommet (maximum .52), sans cercle noir permanent.
- Sur les flancs, même logique roche/herbe/terre ; deux groupes avant/arrière partagent chacun les **mêmes gradients**, au lieu d'un shade par triangle. Couche arrière puis sommet puis couche avant et croissant sombre R6 conservés.
- Cache du maillage sphérique et du raster R5, disque de sommet et guide R6, matériaux HD V49/forest existants : préservés.
- Aucun changement de l'empreinte de collision, des règles de marche, de la caméra, des autres falaises ou de l'import/export de cartes.

## Contrôles
- Tests `tests/sculpt-spherical-relief-v76.test.js` : gradation de l'intensité avec niveau 1–7, teintes et seuils conformes aux hauteurs standards, ombrage de la lèvre et du pied, textures roche/herbe/terre inchangées, chemins composés et cache conservés, absence de cerclage permanent.
- CI complète : Node + check + Chromium Sculpt/Builder/Combat au SHA source final.
- Diff R6→R7 : renderer + tests/docs uniquement ; aucun asset, moteur de collision, ou géométrie modifiés.
- Publication seulement après CI GREEN, via PR infra qui épingle un SHA de source immutable. **V76 R7 GREEN exclusivement après validation visuelle par le créateur**.
