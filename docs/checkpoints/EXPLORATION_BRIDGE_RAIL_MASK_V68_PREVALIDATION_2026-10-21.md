# V68 — Pont / garde-corps au-dessus de l'acteur — prévalidation technique

- **Retour créateur :** capture Pixel à ~80° : le héros semble plongé jusqu'aux épaules derrière les planches malgré le bon ancrage V67.
- **Base** : `28e68818913ffd822d581618140d520759f30a90` (V67), START `checkpoint/exploration-start-bridge-rail-mask-v68-2026-10-21`, work `work/exploration-bridge-rail-mask-v68-2026-10-21`.
- **Cause :** l'ancien `sculptBridgeForegroundClip` V67 commence à `-.60h + .55h = -.05h` : la seconde passe repeint le tablier devant le pied du personnage (niveau local 0), donc cache ses jambes et son tronc.
- **Correction :** seules les parties au-dessous du plan de marche sont redessinées : `y=.12h` à `.55h` pour les assets ponts 2,5D. Pas de changement de WorldObject, collision/hauteur/joystick/caméra ou WebP. Legacy ponts inchangés.
- **Source exacte testée :** `9cce0e7dfdcff26c4385442babd4234175ba1c21`, [CI #39667868628](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39667868628) **SUCCESS** (unit tests, check, vrai Chromium Exploration/Builder/Combat), checkpoint `checkpoint/exploration-bridge-rail-mask-v68-prevalidation-2026-10-21` sur le SHA exact.
- **Tests :** les sept ponts avec 4 vues et 4 scales ; 35/55/80/90°, y=0 du tablier toujours devant le clip du rail ; 95/100 % du reste inchangé ; smoke Chromium de régression. 
- **Publication pour test, NON GREEN esthétique :** PR infra [#206](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/206), merge main `08eb2a4d29493d57fc2607ab52f633968975fef9`, Pages #39668206294. URL de test `sculpt-lab.html?v=68` une fois le déploiement réussi.
- **Gate encore ouverte :** réel Pixel sur pont bois horizontal à ~80° et ~35°, puis vertical/diagonale ; vérifier que le personnage marche sur les planches sans disparaître et que la bordure frontale conserve sa lisibilité. Si non, passer à un vrai asset à couches avant/arrière plutôt que déplacer encore le héros.
- **Rollback :** Pages ref V67 `28e68818913ffd822d581618140d520759f30a90`.
