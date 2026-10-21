# V54 Collines arrondies — prévalidation technique

- Base V53 source `defdac8099f3bdd6720633972707c0ffaf73273f` ; START `checkpoint/exploration-start-rounded-hills-v54-2026-10-21`.
- Branche `work/exploration-rounded-hills-v54-2026-10-21`; prévalidation runtime avant documentation : `61ff9bd90a14e4d192b9b51cf7e353b9acc3cec8`.
- Demande : arrondir le **sommet herbeux** et la silhouette de colline, pas simplement la paroi rocheuse.
- `sculptHillTopProfile` lit exclusivement la hauteur et le `roundness[]` déjà sérialisés : il arrondit un coin convexe si deux voisins secs sont plus bas et si profil >95. Le profil V50 par défaut 95 reste visuellement identique ; 150 donne une courbe explicite. Aucun pixel herbe/eau n'est modifié ailleurs, aucune nouvelle géométrie physique.
- Mode `cliff-round` reste compatible, mais libellé « Arrondir les collines (herbe + roche) » et contrôle de réglage visibles dans la barre rapide seulement en mode actif. Le créateur choisit l'outil, 150 %, puis peint au doigt sur le sommet.
- Test `tests/sculpt-rounded-hills-v54.test.js` : 0/95/150, coin de plateau, voisinage eau, conservation du heightfield, export/import ; sentinelles V41/V42/V49/V50/V51/V52/V53 et Chromium.
- CI [#39577423832](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39577423832) SUCCESS pour `61ff9bd90a14e4d192b9b51cf7e353b9acc3cec8` : Node, check, vrais parcours Chromium Builder / Exploration / Capture Combat.
- **NON GREEN esthétique, non publié Pages** : test smartphone sur vraie colline requise. Prochain lot V55 raccord ponts sur la base technique validée, sans toucher à la physique d'Area ou au WorldDocument.
