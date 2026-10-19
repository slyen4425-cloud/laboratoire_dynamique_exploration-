# Checkpoint de prévalidation technique — Sculpture V36 / arête supérieure contrastée

- **Date :** 2026-10-19.
- **Source / branche :** `work/exploration-sculpt-upper-rim-contrast-v36-2026-10-19`.
- **SHA source immuable testé :** `682b3958412a66b1ef924daa7aaeaff941c6d7aa`.
- **Base V35 Pages / rollback :** `d22a538b65cbe2cbead38f239f413c8b59397bea`.
- **Checkpoint départ :** `checkpoint/exploration-start-sculpt-upper-rim-contrast-v36-2026-10-19`.
- **Checkpoint prévalidation :** `checkpoint/exploration-sculpt-upper-rim-contrast-v36-prevalidation-2026-10-19`.
- **Périmètre :** bord visuel au sommet des vraies marches sèches dans `sculpt-height-renderer.js`. Même terrain canonique, mêmes voisins et faces rocheuses. Aucun nouvel état, aucun asset ni changement physique.
- **Résultat :** bande foncée courte avec fondu vers la surface haute ; uniquement `exposedEdges south/east`, pas d'arête sur les cases de niveau identique, pas de mélange avec l'eau.
- **Tests :** GitHub [CI source #39291173873](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39291173873) SUCCESS ; [CI checkpoint #39291379845](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39291379845) SUCCESS ; tests Node, syntaxe, navigation/Builder/Combat, vrai Chromium Sculpture.
- **Mesure navigateur :** pour le plateau test sur fond vert, différence RVB cumulée entre dessus et lèvre **145** ; sol plat, faux bord **0** ; contre-épreuves V35/V36 exécutées dans le vrai canvas.
- **Prévisualisation Pages :** [run #39291544230](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39291544230) SUCCESS ; publication par [PR infra #170](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/170) ; workflow `main` épingle le SHA source testé, sans fusion du code labo sur `main`.
- **URL de test :** https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html
- **Régressions connues :** aucune détectée par la suite automatisée ; esthétique à confirmer sur smartphone, notamment l'intensité du trait selon les textures et le zoom.
- **Prochaine étape autorisée :** test créateur sur la prévisualisation, puis seulement si accepté checkpoint GREEN final. Ne pas confondre CI verte et validation esthétique.

**Statut : PRÉVALIDATION TECHNIQUE, pas GREEN créateur.**
