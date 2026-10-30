# V55 — Traversée des ponts en exploration sculptée — prévalidation

- Source V54 `f137316bee95509e0ae0842cb60a3321010411e1`, START `checkpoint/exploration-start-bridge-crossing-v55-2026-10-21`.
- Source V55 `8d82a83dbf421ba2d5e18ba2d30beb1864336fd3` ; [CI #39578894348](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39578894348) SUCCESS : Node + check + Chromium Builder/Exploration/Combat.
- Le testeur résout les WorldObjects Bridge et utilise `bridgeTraversalRect` ainsi que `circleFitsOrientedRect` pour autoriser la marche au-dessus de l'eau uniquement sous le vrai tablier. Aucune autorité visuelle ou copie de rivière ; les autres cellules humides restent bloquantes.
- Les sept ponts ont une metadata déclarative `viewAxesDeg` dans leur définition de traversée pour horizontal/vertical/diagonales. Rotations absolues normalisées, largeur et longueur suivent le placement/scale canonique. Les anciens ponts gardent l'ancienne sémantique.
- Le personnage est rendu à la hauteur des berges sèches le long du corridor, sans modifier le sol ou les collisions physiques. Avant/après pont et sauts hors passage gardent les protections V40.
- Tests `tests/sculpt-bridge-crossing-v55.test.js` : passage réel moteur `stepMovement`, eau sans pont refusée, couloir horizontal et vertical, diagonales, échelle, persistance, hauteur visuelle et saut élevé bloqué.
- **Prévalidation technique seulement ;** test visuel mobile et véritables traversées tactiles à valider par créateur, pas de GREEN utilisateur.
