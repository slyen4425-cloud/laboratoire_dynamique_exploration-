# START et RED — Pages Explorer : échantillonnage de FPS après retour de Tester (2026-11-03)

## État vérifié
- Source `main@92c8d985b9cd9fef7220fab88e0ff3ffcff5828f`. CI sur ce SHA [41628354305](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41628354305) **GREEN**.
- La publication officielle sur ce SHA [41628354384](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41628354384) est **failure**, job `verify-and-assemble`, étape `Real Chromium test of the assembled preview`; `deploy` a été **skipped**. Ne pas appeler cela un ralentissement ou une livraison.
- Erreur du test : `Official main real map and painted Canvas FPS not observable`, `renderFps:0`, `tickFps:0`, `actorMotion:'idle'`, HUD `Mesure de fluidité en cours…`, mais `canvasSize:[760,894]`, scène `[36,24]` et cache terrain positif.
- Le smoke mesure la cadence **en démarrant un deuxième Tester sur le même document** après un vrai cycle mouvement/joystick/retour. Ce second lancement peut exposer une rencontre en attente (branche `sculptPendingEncounter`), ce qui suspend volontairement la simulation et ses compteurs. Il s'agit d'un scénario de test ambigu, pas d'une preuve de rendu 0 FPS dans une session normale. La cause d'une éventuelle rencontre doit être traitée par ses tests dédiés, non par un faux GREEN ici.

## Intervention isolée
- Checkpoint START `checkpoint/exploration-pages-fps-session-start-2026-11-03`.
- Branche `work/exploration-pages-fps-session-2026-11-03`.
- Déplacer l'échantillonnage visuel de 950 ms **dans le Tester déjà actif**, après les tests historiques clavier, gel CPU V21, joystick et leurs assertions. Conserver la vérification de marche réelle avant mesure. Aucun second démarrage.
- Exiger toujours la vraie carte, le Canvas visible non vide, le cache terrain, `Rendu > 0 FPS`, `Calcul > 0 FPS`, vitesse de déplacement positive pendant la mesure et le retour sûr à Éditer.
- Aucun changement du jeu, des collisions, de l'exploration, de Combat, des données de cartes ou de l'éditeur. Aucun masquage des tests d'origine. Checkpoints GREEN uniquement avec CI et déploiement Pages complets.
- Ne pas modifier GenSRPG ou les branches de cartes/éoliennes.
