# World Builder — retrait des accès à l'éditeur 2D (11/11/2026)

- START : `main@5db0f09c827206eccf1de740965975a3acfedbf6` ; checkpoint `checkpoint/lab-start-world-2p5d-only-2026-11-11`.
- Dans World Assembler, « Textures et chances de rencontre » ouvre l'unique éditeur 2,5D comme la carte principale.
- Les événements déjà présents dans le WorldDocument restent affichés **en lecture seule**. Les anciens boutons « Éditer » et « Modifier les événements » ne donnent plus accès à l'éditeur 2D obsolète ; édition future native 2,5D seulement.
- Aucune migration ni suppression de données mondes / zones / événements / objets, aucun deuxième catalogue ou éditeur.
- Vérifications attendues : tests World Assembler, CI, page principale HTTPS et smartphone.
