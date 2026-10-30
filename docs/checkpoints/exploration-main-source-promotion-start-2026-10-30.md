# Exploration — START promotion main (30 octobre 2026)

- Main de départ `1aee007a1f7493512c4ed6416581d4f5953d5fdf`.
- START : `checkpoint/exploration-main-source-promotion-start-2026-10-30`.
- Source GREEN validée par utilisateur : `3a0a6ec4bad257f28577d54cd3e23e557e05d9b4`; CI Chromium `40961441833` SUCCESS.
- Publication historique source + quatre musiques : `40961473438` SUCCESS (PR), puis `main` a échoué après évolution de la donnée auteur : `force_reserve_switch` non pris en charge par moteur Combat main.
- Changement : mettre le code du labo lui-même sur `main`, conserver un seul publisher, recompiler avec Combat main et le snapshot officiel de données auteur `4fd0821545eaa41ce1d3115e56f3574db6273426` validé sans modifier son contenu.
- V80 inchangée, aucun moteur Combat copié dans les sources Explorer.
