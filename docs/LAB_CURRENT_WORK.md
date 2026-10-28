# LAB_CURRENT_WORK — Présets avec véritables maisons visitables et Portals compatibles

Date : 2026-10-28.
Base GREEN : `84eb2274b21eb1757bc241ce6b93a5136d6e47d7`.
Branche : `work/exploration-preset-house-interiors-traverse-2026-10-28`.
Checkpoint START : `checkpoint/exploration-start-preset-house-interiors-traverse-2026-10-28`.

## Problème
Les cartes préconstruites instancient des maisons sans intérieur alors que le lien `createBuildingInteriorLink` existe. Il crée historiquement des pièces 720×560 non compatibles avec la grille Sculpt 2,5D. En mode Tester, les boutons d'un Portal vers une ancienne zone 2400×1600 s'activent puis échouent, même si l'aller vers le nouveau préset fonctionne.

## Correction
- Chaque Building instancié depuis un préset devient une véritable WorldArea de pièce 18×14, avec sol décoré, deux murs de séparation, Portal d'entrée à ancre porte et Portal de sortie vers le même extérieur.
- Le moteur de rendu 2,5D réutilise `drawSculptInteriorWalls` pour les intérieurs issus du WorldDocument ; les murs sont les véritables `WorldArea.walls` du Collision World.
- Le Helper existant conserve ses dimensions historiques par défaut ; seuls les nouveaux liens de présets reçoivent explicitement 18×14.
- Le bouton de traversée vérifie la capacité de la destination avant activation. Les anciens mondes sont conservés, sans réduction ni migration cachée. Retour via panneau Monde.

## Autorité / tests
Un seul WorldDocument (WorldArea/Portal/Spawn), ObjectDefinition pour l'ancre de porte, WorldSurface pour textures, Collision World pour les murs. TDD et test réel Node/Chromium requis. V80 production et version historique immuables. Validation utilisateur smartphone à demander après CI GREEN.
