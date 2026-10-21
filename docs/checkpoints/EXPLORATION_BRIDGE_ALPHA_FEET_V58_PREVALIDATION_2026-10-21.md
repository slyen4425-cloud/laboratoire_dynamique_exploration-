# V58 — prévalidation technique blancheurs de pont — 21/10/2026

- START: `checkpoint/exploration-start-bridge-alpha-feet-v58-2026-10-21`; branche `work/exploration-bridge-alpha-feet-v58-2026-10-21`; source immuable `7a5983a636917bb158a6deeb662723fd70914a9c` ; checkpoint `checkpoint/exploration-bridge-alpha-feet-v58-prevalidation-2026-10-21`.
- [CI #39604544134](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39604544134) SUCCESS : tests Node, lint/check, vrais Chromium Builder/Exploration/Combat. Nouveau test `tests/sculpt-bridge-alpha-feet-v58.test.js` prouve la suppression de taches blanches même reliées aux pierres, la préservation des reflets et l'absence de mutation des canaux RGB.
- Rendu : `src/assets/sculpt-bridge-alpha.js` recalcule uniquement le canal alpha des petits îlots neutres blancs à partir des pixels source, cantonnés à la partie basse et adjacents au transparent. Les 28 WebP et leur manifeste restent byte-identiques et sont toujours le fallback.
- La segmentation repose sur la **couleur** et non sur l'autorité WorldDocument/collision. Traitement unique au chargement, mise en cache.
- **Gate :** inspection réelle Pixel de chacun des ponts et vérification que les triangles sous les supports de la capture sont supprimés ; aucune revendication de GREEN esthétique. Publication différée au lot V59 final en cas de CI verte.
- Rollback : V56 source `eabb936639686a41fa31cf469d135c58e4cfbea4`.
