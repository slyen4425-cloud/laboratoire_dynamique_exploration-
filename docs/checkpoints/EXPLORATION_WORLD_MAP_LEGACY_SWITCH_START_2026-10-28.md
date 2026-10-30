# START — Retour non bloquant Monde ↔ Carte 2,5D sur ancienne zone
Date : 2026-10-28
Base GREEN : f2f424fb4c6390e276b04f375d27f7def8680749 (875/875 Node ; Chromium mobile ; Preview V80 isolée).
Checkpoint START : checkpoint/exploration-start-world-map-legacy-switch-2026-10-28
Branche : work/exploration-world-map-legacy-switch-2026-10-28
Périmètre : empêcher l'ouverture éditable d'une WorldArea hors grille 2,5D ; rendre les deux boutons de retour fonctionnels même pour les vieilles zones 2400×1600 déjà sauvegardées ; proposer création explicite d'une zone compatible sans changer les originaux ; tests Node / Chrome réel.
Autorité : WorldDocument reste unique ; la scène 2,5D n'est jamais écrite lorsque la WorldArea n'a pas pu être montée.
Règles : aucun arrondi/rescale/migration silencieux, pas de toast masquant une erreur de save réelle, V80 prod protégée.
L'utilisateur a reproduit : alerte Android « Retour impossible sans enregistrer ... vraie taille : 2400 × 1600 » ; l'ancien défaut de World Builder est incompatible avec la grille sculpt 8–80 × 8–64 cases.
