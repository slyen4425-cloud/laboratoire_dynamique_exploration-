# LAB_CURRENT_WORK — Quatre musiques Exploration (2026-10-29)

- Lot : `work/exploration-music-4-2026-10-29`, un seul propriétaire audio Exploration.
- START : `checkpoint/exploration-music-4-start-2026-10-29`.
- Source initiale CI-GREEN : `9d43282ad3e8738404f69f0d2ee83f348634c8aa`.
- Sources maîtres : `GenSrpG_audio_prive/main/audio/musiques/exploration/Exploration_1..4.mp3`, conservés intacts dans le dépôt privé.
- Transport : workflow privé de préparation; copies d'écoute 96 kbps injectées en blobs dans les assets publics du laboratoire Exploration, avec vérification taille + SHA256.
- Fonction : la commande existante `🚶 Tester` amorce une session; quatre pistes en lecture aléatoire sans répétition immédiate; arrêt en quittant Tester; pause lors du vrai Combat, reprise après retour validé.
- Autorité : le soundtrack d'Exploration n'utilise ni un moteur Combat dupliqué ni le dépôt privé à l'exécution; le Battle appartient au module Combat.
- TDD / navigateur : tests unitaires de playlist, binaires MP3 exacts, test Chromium de `Tester` et réponse HTTP. Tests `npm test`, `npm run check`, et CI intégration Combat existante requis.
- Hors périmètre : GenSrpg central, V80 gelée, sons de compétences Combat, musique personnalisée par Area.
- Livraison : attendre GREEN sur le SHA de source et publication par l'unique Pages workflow, vérification HTTPS des quatre MP3 et comparaison V80.
- Limite Android : démarrage sur geste Tester; autoplay silencieux sans geste reste interdit au navigateur.
