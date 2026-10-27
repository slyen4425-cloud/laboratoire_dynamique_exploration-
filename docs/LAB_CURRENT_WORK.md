# LAB_CURRENT_WORK — Raccordement rencontres terrain depuis V80

Date : 2026-10-27
Base : work/exploration-restart-from-v80-20261027
Branche : work/exploration-v80-encounters-terrain-owner-20261027
Checkpoint de base : checkpoint/exploration-start-v80-encounters-2026-10-27
Note de traçabilité : ce checkpoint a été créé après les premiers commits, mais pointe sur la base V80 non modifiée. Il ne doit pas être présenté comme antérieur au début du travail.

## Périmètre
Corriger le vrai chemin de rencontre existant. Le contrôleur unique est src/encounters/encounter-controller.js. La surface canonique détermine terrainFamilyId ; materialId reste exclusivement visuel. Les créatures et leur rareté sont fournies par le catalogue Capture existant.

## Propriétaires
World Surface : géométrie et famille ; Encounter Controller : cadence et verrou de rencontre ; Terrain Family Encounter Resolver : choix dans le catalogue Capture ; Encounter Bridge : contrat de passage au combat ; Renderer : lecture seule des matériaux.

## Invariants
Ne pas dupliquer moteur de rencontres, position, rareté ou géométrie. Ne pas modifier les collisions, l'édition sculpt, ni la publication de V80. Les anciennes fonctions de navigation et portes sont gelées.

## Vérifications
Sentinelles du nouveau lot : textures indépendantes du gameplay, route sûre, aucune famille inventée, Area cohérente avec la position, test du vrai runtime. Exécuter npm test et npm run check. CI et tests navigateur/mobile requis pour GREEN.

## État
NON GREEN : tests ajoutés, contrôleur existant corrigé, CI et validation du vrai parcours en cours. Aucune publication de ce lot.

## Suite
Analyser les résultats CI, corriger toute régression, vérifier l'accès au runtime V80, finaliser la frontière avec Encounter Bridge puis valider la preview avant checkpoint GREEN.
