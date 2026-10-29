# Release — quatre musiques Exploration (2026-10-29)

- Source Explorer gelée : `d6d969be0594d7a20c4131144dbccc0086431584`.
- START : `checkpoint/exploration-music-four-release-start-2026-10-29`.
- GREEN source : `checkpoint/exploration-music-four-green-2026-10-29`, run `40941356850` terminé SUCCESS, incluant 4 MP3 checksums et vrai Chromium.
- Audio : `Exploration_1..4` originaux dans `GenSrpG_audio_prive` (restés privés), copies MP3 autorisées transcodées 96 kbps vers `assets/runtime/audio/exploration-v1`.
- Intégration : geste `Tester` initie musique sans bouton audio; changement de titre aléatoire; pause combat, reprise après signal de résultat validé; nettoyage sortie et `pagehide`.
- Publication : modifie uniquement le seul publisher Pages existant. Vérifie existence + SHA256 des quatre MP3 source, staging et HTTPS réel; la V80 historique reste strictement inchangée.
- Combat : prélèvements du vrai moteur Combat `main` et Showcase `gh-pages` sans copie des mécaniques.
- GREEN release : attendre CI PR + déploiement `main` et vérification HTTPS. Écoute perceptuelle sur Android à valider par le créateur.
