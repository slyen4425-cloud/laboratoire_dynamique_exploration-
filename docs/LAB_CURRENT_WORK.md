# LAB_CURRENT_WORK — Atelier unifié, retour stable et bibliothèque de cartes natives

Branche : work/exploration-world-return-and-builtins-2026-10-28
Base GREEN : 0314dd0deda247569ddc1a576f0d0b63ede2098c
Checkpoint START : checkpoint/exploration-start-world-return-and-builtins-2026-10-28

Correctif cause racine : le header disparaît en immersive, rendant Monde inaccessible, tandis que le panneau de Portals est caché en Tester. Le handoff session est consommable une seule fois et perd le contexte après refresh. Rendre le retour réellement visible sur le terrain en immersive et lier la restauration à l'unique document monde sauvegardé.
Présets natifs : 8 cartes cohérentes réutilisables, à partir du catalogue d'objets réel (végétation, maison, rochers, etc.), relief, mares réelles et routes canoniques. Un seul format de Scène validé ; la copie dans une WorldArea passe par saveSculptWorldArea. Présets utilisateurs restent modifiables et exportables.
Tests TDD/Node/Chromium mobile et publication preview V80 protégée.