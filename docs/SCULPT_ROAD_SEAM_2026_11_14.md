# Routes sculptées — continuité visuelle aux jonctions (14/11/2026)

- Origine : retour utilisateur (traînées entre textures, notamment sur les routes). Hypothèse technique vérifiable : le WorldSurface v3 dessine chaque couche translucide par case mais l'ancien clip de peinture couvrait `width+0.65` × `height+0.65`. Un même trait était alors tamponné deux fois sur la bordure de cellules contiguës.
- START : `main@d9d1840952b8ecb10f9baed162d167d62750c17c` ; `checkpoint/exploration-road-seam-start-20261114` ; branche `work/exploration-road-seam-continuity-20261114`.
- Correction isolée : la fonction pure de découpe `sculptPaintCellClipV1` conserve exactement les limites de la cellule. Les coups de pinceau, le motif et la géométrie de route restent dans l'unique `sculptPaintByCell` du Labo Exploration, sans deuxième peinture, sans toile de camouflage.
- Invariants : aucune mutation du WorldSurface, WorldDocument, terrain, relief, collision, rencontres, caméra, sauvegardes, inventaires ou modules Combat/Dungeon/Survie. Aucun changement dans les 12 héros.
- Tests : `tests/sculpt-road-cell-seams-20261114.test.js` (TDD RED puis GREEN), CI Node et Chromium, vérification smartphone/PC finale obligatoire. Ne pas annoncer les traits visuellement disparus sur tous les écrans avant contrôle réel.
