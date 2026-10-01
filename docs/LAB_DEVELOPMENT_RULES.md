# GenSrpG Exploration — Règles de développement strictes

## Règle 0 — ne jamais casser un système validé pour en ajouter un autre

Un nouvel élément utilise l'autorité existante ou un contrat public. Il ne recrée pas silencieusement un système concurrent.

## 1. 1 lot = 1 branche = 1 périmètre

Aucun lot fonctionnel ne mélange :
- moteur ;
- UI ;
- assets ;
- migration ;
- autre domaine ;
sauf si le contrat du lot l'exige explicitement.

## 2. Pas de développement direct sur main

Toujours :
checkpoint start -> work branch -> tests -> checkpoint GREEN.

## 3. Déclarer avant de coder

Chaque lot documente :
- module/domaine ;
- propriétaire ;
- systèmes réutilisés ;
- fonctions gelées ;
- tests ;
- risques ;
- hors périmètre.

## 4. Une autorité unique

Pas de second moteur de :
- position ;
- collision ;
- caméra ;
- génération ;
- rencontre ;
- sauvegarde ;
- assets.

## 5. Core pur

Les fonctions métier restent indépendantes du DOM quand cela est possible.

Input et renderer sont des adapters.

## 6. Pas de mécanisme global de réparation

Interdits :
- observer global ;
- heartbeat ;
- retry permanent ;
- wrapper en chaîne ;
- scan DOM général ;
- timer pour maintenir l'autorité.

## 7. Cycle de vie explicite

Tout composant temporaire doit pouvoir se démonter proprement.

## 8. Contrats versionnés

Tout échange inter-système durable possède un schéma/version :
- WorldDocument ;
- ExplorationSave ;
- CaptureEncounterSnapshot ;
- CaptureCombatResult.

## 9. Règles gameplay configurables

Pas de nombre magique autoritaire dans le moteur lorsqu'il s'agit d'une décision de jeu.

Les paramètres vivent dans une configuration normalisée.

## 10. Tests du chemin réel

Tester :
input -> mouvement -> collision -> état,
pas seulement une fonction isolée.

Pour la génération :
seed + config -> world model.

Pour la reprise :
save -> reload -> état équivalent.

## 11. Tests de frontière

Tester aussi ce que le module n'a PAS le droit de faire :
- ne pas piloter le Shell ;
- ne pas modifier Dungeon/Survie/PvP ;
- ne pas recalculer les stats Core ;
- ne pas posséder le moteur Combat Capture ;
- Builder ne modifie pas le runtime directement.

## 12. Mobile-first

Toute UI/interaction doit être validée sur smartphone avant GREEN.

## 13. Régressions

Pas de rustine.
Reproduire -> diagnostiquer -> corriger la cause -> garder le test.

## 14. Diff minimal

Si un correctif ciblé touche trop de domaines, arrêter et auditer.

## 15. Règle de gel

Tout checkpoint GREEN protège ses invariants.

Un lot ultérieur qui les touche doit le déclarer et relancer les sentinelles.

## 16. Publication

CI rouge = publication interdite.

Une preview ne remplace pas le test mobile quand le comportement tactile/visuel est concerné.

## 17. Critère de fin

Un lot n'est fini que si :
- autorité claire ;
- tests verts ;
- documentation à jour ;
- CI verte ;
- validation utilisateur si nécessaire ;
- checkpoint GREEN créé.
