# PREVALIDATION R2 — Mobile Landscape & Area Navigation UX v1 — 2026-10-07

## Pourquoi R2

La première preview technique possédait le nouveau Builder, mais le lien `Tester en jeu` ne cache-bustait pas le HTML runtime.
Sur mobile, cela pouvait fausser le test paysage avec une ancienne entrée HTML.

## TDD R2

- RED : `adc151e601efd2e20c49b06ec078fb0c57efff2a`
- CI RED : `37646009673` — 392/394 GREEN, 2 RED ciblés
- correction : `160236129348bce4e2d43af10b46a84827dd2840`
- sentinelle handoff réalignée : `e190e72c76be5803729427f747d0e00578d4209e`
- CI : `37646264782` — SUCCESS

## Contrat R2

- le Builder public charge CSS/JS avec la révision R2 ;
- `Tester en jeu` ouvre le runtime avec une révision R2 explicite ;
- le runtime HTML charge son CSS paysage avec la révision R2 ;
- aucun moteur gameplay n'est modifié ;
- aucun WorldDocument/Portal/WorldArea supplémentaire ;
- aucune modification de `Zombicide-40k`.

## Gate

Prévalidation seulement. Le créateur doit valider sur smartphone :
plein écran map, paysage, extérieur -> intérieur, intérieur -> extérieur, sortie du plein écran et retour test runtime.
