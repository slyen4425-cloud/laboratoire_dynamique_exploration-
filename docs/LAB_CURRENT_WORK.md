# LAB_CURRENT_WORK — V82 raccordement rencontres Exploration / Capture
Date : 2026-10-27
Branche : work/exploration-v82-encounter-reconnect-20261027
Checkpoint de départ : checkpoint/exploration-start-encounter-reconnect-20261027
Base : work/exploration-v80-door-html-cachefix-20261026 (V80 portes validée par l'utilisateur)
Dernier GREEN utilisateur : V80 portes, validation 2026-10-27 (publication via sculpt-lab-v80.html)

## Périmètre du lot
Raccorder le moteur de rencontres déjà présent dans l'ancien laboratoire à l'exploration sculptable, sans inventer de second resolver.
Conserver les familles de terrain canoniques, leur probabilité globale, leur répartition élémentaire et la rareté `capture.spawnChance` issue de CaptureDatabaseV1.
L'éditeur modifie des données sérialisables ; le runtime les consomme via un contrat explicite. Les réglages restent accessibles en plein écran mobile, en réutilisant le panneau canonique.

## Propriétaires et invariants
Exploration Core : déplacement ; World Model : terrainFamilyId ; Builder : configuration ; Encounter Controller : tirage ; CaptureDatabaseV1 : créatures et rareté ; Capture Combat : combat.
Aucune dépendance directe au moteur Combat Lab, aucune géométrie de rencontre parallèle, aucun système de pourcentages dupliqué, aucun ID à saisir.
V81 panneau mobile reste un lot indépendant en PR #253 ; ne pas fusionner ici ses changements avant validation.

## Étapes
1. Retrouver le code exact des rencontres de l'ancien laboratoire et les contrats/exports du catalogue Capture.
2. Écrire les tests RED de sauvegarde, terrain, pourcentages, rareté et passage au combat.
3. Raccorder l'adapter unique ; garder les choix et états déjà enregistrés.
4. Brancher le panneau de réglages mobile après validation V81.
5. Vérifier tests Node, CI, puis essai smartphone paysage, sauvegarde/rechargement, retour de combat.

## Risques
L'éditeur sculptable V80 n'expose pas encore clairement de module de rencontres ; ne pas supposer qu'il existe.
La branche V80 et la branche main ont des historiques divergents ; ne jamais fusionner en masse.

## Statut
Checkpoint de départ créé ; recherche des contrats en cours. NON GREEN. Aucune modification du gameplay ni publication.
