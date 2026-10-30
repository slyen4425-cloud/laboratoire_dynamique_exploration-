# Exploration 2,5D — correction audio Android, 29 octobre 2026

- Départ : `d6d969be0594d7a20c4131144dbccc0086431584`.
- Checkpoint de départ : `checkpoint/exploration-audio-playback-gesture-start-2026-10-29`.
- Branche : `work/exploration-audio-playback-gesture-2026-10-29`.
- Défaut utilisateur vérifié : le déploiement MP3 était GREEN et les copies audio présentes, mais « Tester » ne produisait pas de musique sur Android.
- Diagnostic : `Audio.play()` était déclaré « playing » avant réalisation et un rejet `NotAllowedError` bloquait sans reprise au prochain geste. Un `window.confirm()` optionnel pouvait intervenir avant l'appel `play()`; la requête de chargement explicite et l'URL JavaScript non versionnée ajoutaient des risques au démarrage et au cache.
- Correction racine : démarrer sur le clic Tester avant tout dialogue natif ; état `starting` distinct de `playing` tant que `play()` n'a pas réussi ; retry uniquement sur geste utilisateur réel ; pas de bouton de déblocage ou de timer ; pas de lecture dans l'éditeur ou pendant Combat.
- Portée : moteur audio Exploration et son déclenchement uniquement, sans toucher à Combat, aux masters privés ni à V80 figée.
- Critères : npm test, npm run check, CI Exploration complète, test Chromium d'un vrai clic sur Tester avec progression de `audio.currentTime`, publication via le seul pipeline Pages et contrôle HTTPS.
- Validation tactile Pixel de l'utilisateur reste nécessaire.
