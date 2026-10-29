# Publication isolée — démarrage des images et son sans bouton — 29 octobre 2026

- Base main : `49b930d4ef60d624b50075ab724ee9c3785ea70d`.
- START : `checkpoint/exploration-mobile-audio-texture-release-start-2026-10-29`.
- Branche : `work/exploration-mobile-audio-texture-release-2026-10-29`.
- Source testée : `9d43282ad3e8738404f69f0d2ee83f348634c8aa`; lot `work/exploration-mobile-audio-texture-2026-10-29`.
- Périmètre : unique publisher Pages, source validée, vérification HTTPS de l'absence du bouton audio et de la présence du pont musical officiel.
- Gestion sonore : les Battle SFX/playlist Combat continuent à utiliser `DomCombatAudio` et `SoundtrackSession` officiels. Tentative de musique automatique après chargement; si interdite sur Android, premier geste gameplay relance, sans bouton en plus.
- Images : le préchauffage à l'entrée Explorer reste asynchrone; le Combat attend seulement le `load` des modèles actifs (pas les grandes bandes animées) avant d'afficher le HUD.
- Ressources et moteur : `Combat main`, Showcase `gh-pages`, visuels `global-assets` restent leurs propriétaires distincts. V80 gelée et comparée octet pour octet.
- Les quatre masters `Exploration_1..4.mp3` restent privés et non distribués. Leur raccordement audible n'est PAS revendiqué dans ce lot; voir `docs/checkpoints/exploration-music-source-audit-2026-10-29.md` dans la source.
- GREEN publication : gates techniques source + vrai Chromium, pipeline Pages, vérification HTTPS, images, musique/SFX et preuve de conservation V80. Validation tactile Android par le créateur ensuite.
