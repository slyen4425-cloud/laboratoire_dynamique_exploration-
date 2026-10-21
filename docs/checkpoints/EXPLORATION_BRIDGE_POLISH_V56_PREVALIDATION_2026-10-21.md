# V56 — Ponts agrandis + alpha ciblé — prévalidation

- Socle V55 source `8a33bfa40dc38a86edcf264fb8982ead1d9edbb7` / checkpoint `checkpoint/exploration-bridge-crossing-v55-prevalidation-2026-10-21`. START `checkpoint/exploration-start-bridge-polish-v56-2026-10-21` ; branche `work/exploration-bridge-polish-v56-2026-10-21`.
- Source technique V56 `4a241028341495324b18a1be31a6807a19e92b05` ; [CI source #39579812751](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39579812751) SUCCESS (Node + check + Chromium Builder/Exploration/Combat).
- Périmètre 1 : l'UI Objet > Ponts expose 25…300 % ; `updateSculptPreviewObject` accepte un scale jusqu'à 3 seulement pour `kind='bridge'`, conserve 1.2 pour bâtiments/arbres/rochers. Les placements/rotations/corridors utilisent le même WorldObject canonique ; export/import sans nouveau schéma.
- Périmètre 2 : `src/assets/sculpt-bridge-alpha.js` nettoie seulement en mémoire au chargement les composantes détachées pâles de petite taille et atténue les halos clairs translucides, sans retoucher le WebP ni le manifeste SHA. L'image WebP brute reste fallback sur tout problème Canvas. Le cache de rendu empêche toute allocation par frame.
- Tests `tests/sculpt-bridge-polish-v56.test.js` : faux losanges blancs isolés supprimés, reflet blanc rattaché conservé, halo atténué, normalisation jusqu'à 300 %, bâtiments limités 120 % ; le smoke Chromium effectue un vrai choix de pont à 250 %, le place sur l'eau puis exporte le même scale.
- Risque ouvert : ce traitement algorithmique ne garantit pas la disparition de toutes les imperfections de chaque sprite ; inspection visuelle ciblée des sept ponts requise par le créateur. Aucune prétention de remplacement des 28 binaires ; pas de GREEN artistique.
- Gel : V46 eau, V50 atlas HD, V51 visuels ponts, V52 limite sud, V53 falaise, V54 sommet, V55 corridor, Collision World et Capture Combat inchangés.
- Publication Pages seulement après CI finale sur le SHA documentaire, PR infrastructure pinning strict et validation navigateur.

## Publication de test groupée V54-V56 (sans GREEN esthétique)
- Source finale immuable `eabb936639686a41fa31cf469d135c58e4cfbea4`, CI finale [#39580148411](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39580148411) SUCCESS, checkpoint CI [#39580302774](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39580302774) SUCCESS.
- PR infra seule [#197](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/197), fusion sur main `2622449bbf6ad7cc5f11b17051a1f43ae10e11a6`, Pages [#39580693584](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39580693584) **SUCCESS**.
- URL test Pixel : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=56`.
- Validation visuelle/tactile et qualité du nettoyage alpha à confirmer par le créateur. Pas de GREEN final tant qu'il n'a pas testé.
- Retour arrière immédiat : ancienne source V53 `defdac8099f3bdd6720633972707c0ffaf73273f` (workflow Pages seulement).
