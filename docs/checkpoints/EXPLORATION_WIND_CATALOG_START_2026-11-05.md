# START — Raccordement des animations moulins et éoliennes (2026-11-05)

- Origine validée : PR #349 `413584312d13e3c7a78e455973d2d83d4406e31f` (6 ZIP approuvés, 72 PNG RGBA, 6 WebP atlas).
- Base officielle `main@7155516b51db9892183cc043837037c4c87a0315` ; branche `work/exploration-wind-animations-catalog-main-2026-11-05`.
- RED d'abord : tests de sources immuables puis catalogue deux bâtiments, trois variantes chacun, 10 fps, 12 frames.
- GREEN seulement après passage Node, Chromium natif (lecture et sélection), préflight Pages et recette mobile.
- Propriété unique : `ObjectDefinitionCatalog` / `WorldObjectAssetAdapter`; `worldObjectAnimationFrame` déjà existant, jamais second animateur. Aucune nouvelle physique ni portail.
- Hors portée : Jouer, Combat, Dungeon, cartes, moteur, logique de récompense et anciens lots en prévalidation.
