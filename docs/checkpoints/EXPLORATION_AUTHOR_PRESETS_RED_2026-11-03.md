# TDD RED — deux modèles d'auteur absents du catalogue — 03/11/2026

- Branche: `work/exploration-author-presets-forest-plain-2026-11-03`.
- SHA RED du test ajouté avant la source: `26369193d735e89496ea2d62be89d50e8041a7a3`.
- Test: `tests/sculpt-authored-presets-shared.test.js`.
- Le code source du SHA RED ne retourne que huit `builtinSculptMapPresets()` et ne peut réussir l'assertion `10`; le test vérifie aussi les comptes objets/routes et que le navigateur vierge affiche les deux noms.
- La CI GitHub est l'autorité pour le résultat effectivement observé; l'existence de ce test n'est pas une preuve d'exécution.
- Suite: incorporer les deux snapshots exacts sans autre WorldDocument; garder source V80 et publication en attente des assets.
