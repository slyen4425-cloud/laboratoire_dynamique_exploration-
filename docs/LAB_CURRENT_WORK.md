# LAB_CURRENT_WORK — V81 mobile + rencontres (chantier regroupé)
Date : 2026-10-27
Branche unique : work/exploration-v81-mobile-settings-20261027
Checkpoint de départ : checkpoint/exploration-start-mobile-settings-20261027
Base V80 validée : work/exploration-v80-door-html-cachefix-20261026
PR de travail : #253 ; pas de fusion ni publication avant tests.

## Périmètre regroupé, une même livraison
1. Panneau canonique de réglages accessible en plein écran smartphone paysage, sans duplication.
2. Raccordement du système historique de rencontres (terrainFamilyId, probabilité par famille, répartition élémentaire, rareté capture.spawnChance).
3. Édition mobile des rencontres dans ce même panneau, sérialisation et retour de combat.
4. Publication d'une URL de test dédiée après tests automatisés et vérification des fichiers servis.

## Propriétaires
Builder : réglages et sauvegarde ; World Model : famille de terrain ; Encounter Controller : tirage ; CaptureDatabaseV1 : créatures et rareté ; Capture Combat : résolution.
Aucune seconde base de créatures ni second moteur de rencontres. Pas d'ID manuel.

## Garde-fous / tests requis
Tests RED puis GREEN : pourcentages, familles, rareté, round-trip JSON, rencontres pendant navigation, retour combat ; paysage smartphone : panneau ouvrable/fermable, défilement, zones tactiles ; régression portes V80.
CI et URL publique réellement vérifiées avant annonce GREEN.
Ne pas fusionner les historiques divergents de main et V80.
La branche V82 séparée reste une préparation documentaire non intégrée, abandonnée au profit de ce lot unique.

## État
Panneau mobile codé en branche. Raccordement rencontres encore à implémenter.
NON GREEN, aucune URL de test annoncée.
