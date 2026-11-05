# START — Réintégrer les 20 arbres enneigés dans Exploration main (2026-11-05)

- Origine approuvée : PR #364, SHA 77b358c2bcf815372b112a1982518535906641a3.
- Base officielle protégée : main@7155516b51db9892183cc043837037c4c87a0315; branche de reprise work/exploration-snow-trees-main-reconcile-2026-11-05.
- Périmètre : 20 WebP transparents 384×384, catalogue natif ObjectDefinition, Asset Adapter, manifeste et 20 collisions de tronc propriétaires; Végétation > Arbres.
- TDD RED : test source `tests/snow-tree-assets-v1.test.js` importé avant le code; GREEN seulement quand le même test et la CI du SHA complet passent.
- Aucune modification Combat, Jouer, monde, physique, composants de placement ni anciens arbres.
- Publication et fusion seulement après CI + vérification du SHA publié, sans forcer une PR historique divergente.
