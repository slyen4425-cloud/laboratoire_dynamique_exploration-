# START — Maisons des présets visitables et passages compatibles

Date : 2026-10-28.
Base GREEN : `84eb2274b21eb1757bc241ce6b93a5136d6e47d7` (CI Node, Chromium mobile, Pages isolées).
START checkpoint : `checkpoint/exploration-start-preset-house-interiors-traverse-2026-10-28`.
Branche : `work/exploration-preset-house-interiors-traverse-2026-10-28`.
Cause : présets fabriquent de vrais objets Building mais pas leurs WorldAreas/Portals, malgré `createBuildingInteriorLink` existant. Cet outil crée par défaut une pièce 720×560 non représentable en grille 2,5D. Le mode Tester affiche un Portal dont la cible historique 2400×1600 est incompatible, puis tente la traversée.
Propriétaires : WorldDocument (areas, Portals et spawns), ObjectDefinition (door anchors), SculptTerrain (relief), Collision World (murs) ; aucune seconde autorité.
Solution : créer des intérieurs 18×14 cases depuis chaque bâtiment de préset, avec retour ancré dans la porte, plan/sol éditables, murs existants rendus en 2,5D ; refuser préventivement la traversée vers les zones non représentables avec explication dans l'UI.
Contraintes : V80 immuable, anciennes zones et liens intacts, fonctions d'édition existantes réutilisées, 1 lot 1 branche, TDD RED/GREEN, publication Pages séparée seulement après CI et Chromium GREEN.
Validation : tests unitaires de vrais Portals ancrés + contenu intérieur + garde de compatibilité, tests de régression moteur et smoke Chromium paysage ; test manuel Pixel encore requis.
