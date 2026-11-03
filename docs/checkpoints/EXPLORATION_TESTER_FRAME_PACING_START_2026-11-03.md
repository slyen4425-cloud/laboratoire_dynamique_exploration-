# Lot — Fluidité visuelle du mode Tester sur PC (3 novembre 2026)

## Bug utilisateur
En déplacement dans Labo Exploration 2,5D, défilement saccadé, bandes visuelles qui semblent sauter, surtout visible sur écran PC. Ne pas diagnostiquer un bug physique sans preuve.

## Cause technique à vérifier
`navigationTick(time)` appelle le mouvement via `requestAnimationFrame` à la fréquence du navigateur ; le même code ne demande un nouveau rendu de Canvas que si `time-navLastVisualPaint >= (navActor.moving ? 33 : 55)`. Cela réduit arbitrairement la carte à ~30 FPS en mouvement sur un écran à 60/120/144 Hz et engendre un `judder` indépendant de la simulation. Le compteur `navFps` mesure des ticks RAF, pas les images `draw()`.

## Gouvernance
- Base exacte : `work/exploration-author-presets-forest-plain-2026-11-03@c4d084ad1cb4f807e34c084d3d32f44ddc9ad270` (PR #337), à son tour fondée sur #335 et candidate #329.
- Checkpoint START : `checkpoint/exploration-test-navigation-frame-pacing-start-2026-11-03` au même SHA.
- Branche : `work/exploration-test-navigation-frame-pacing-2026-11-03`.
- TDD RED : `tests/sculpt-navigation-frame-pacing.test.js` créé d'abord au SHA `6c00c15b1371505c2ea464a7a2e0630ba0b6a397`; ne pas supposer le résultat avant CI.

## Correction ciblée
- Rendu Canvas lorsque le héros bouge ou que le suivi d'altitude change : à chaque `requestAnimationFrame`, sans cadence artificielle de 33 ms. Conserver `scheduleDraw()` et son dédoublement `framePending` existants.
- Conserver des rafraîchissements réduits au repos, ~55 ms, pour mobile.
- Mesurer et afficher **FPS réellement dessinés** distincts du taux de calcul, sans changer le WorldDocument, la vitesse, les collisions, la caméra, les contrôles, le moteur de combat ou les presets.
- Tests simulés à 60/120/144 Hz + tests existants Node + Chromium. Signaler toute limite réelle de performance, ne pas annoncer disparition du tearing matériel sans essai PC.
- Aucune publication ni merge vers main. Attendre les nouveaux assets moulin/éolienne et la validation utilisateur de l'ensemble avant raccord GenSRPG.

## GREEN
**Non déclaré** tant que les tests de la tête exacte ne sont pas confirmés et que l'essai PC réel n'a pas été validé.
