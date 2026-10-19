# GenSrpG Exploration — Sculpture V38, pilote de caméra trois-quarts

- **Date :** 19 octobre 2026.
- **Base :** liseré V37 accepté, `8cde0b308675c3463718c661e2b67d56567a6e8d`. Aucun nouvel asset, aucune génération d'images.
- **Branche :** `work/exploration-sculpt-perspective-v38-2026-10-19`.
- **Checkpoint départ :** `checkpoint/exploration-start-sculpt-perspective-v38-2026-10-19`.
- **Source testée** : `2b886832ea9cf46b5ca5d18b3e6471d670c3fd65`.
- **Checkpoint technique :** `checkpoint/exploration-sculpt-perspective-v38-prevalidation-2026-10-19`.
- **Objectif réalisé :** projection du Canvas plus inclinée avec `pitch=0.70` et `shear=-0.10`, vue classique `pitch=1`, `shear=0`. Une seule autorité `sculpt-camera-projection.js` pour le dessin et l'inverse du pointeur. Sélecteur dans les outils détaillés, valeur trois-quarts pilote par défaut, retour instantané à la vue classique.
- **Invariants :** données du terrain / zones / eau et objets non modifiées ; `SCULPT_TILE` inchangé (28 x 21, rise18) ; mouvement et collisions inchangés ; caméra navigation recalculée depuis la projection pure ; liseré V37 préservé.
- **Vrai test navigateur :** [CI GitHub #39315653522](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39315653522) **SUCCESS**. Deux modes de caméra donnent des pixels distincts ; retour à l'ancienne vue produit strictement le même checksum ; JSON du terrain inchangé ; un clic réel Chromium sélectionne et surélève la vraie case d'une carte importée de dimensions variables.
- **CI du checkpoint :** [GitHub #39315870319](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39315870319) **SUCCESS**.
- **Publication infra uniquement :** [PR #173](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/173) fusionnée ; Pages épingle la source testée depuis `main` sans y fusionner le moteur expérimental.
- **URL cible de prévisualisation :** https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=38
- **Limitation connue :** première caméra affine qui incline aussi les visuels de décor et d'acteur, à comparer avec la référence 2.5D. Les roches facettées et la projection plus complexe restent un lot séparé.
- **Statut :** PRÉVALIDATION TECHNIQUE ; publication Pages et avis créateur à valider. Pas de checkpoint GREEN final sans validation smartphone.
