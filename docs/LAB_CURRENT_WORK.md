# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 7 — micro-lot 1 :
**Encounter Controller + CaptureEncounterSnapshot v1**.

## Branche
`work/exploration-phase7-encounter-controller-snapshot-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase7-encounter-controller-snapshot-v1-2026-10-03`

## Base GREEN
`e39e00f906ab4ba9ee2b87d4f9efeeeaecbcd0fa`

## Dernier checkpoint GREEN
`checkpoint/exploration-terrain-family-encounters-v1-green-2026-10-03`

## Objectif
Faire le premier raccord runtime propre :
```text
mouvement Exploration
  -> Encounter Controller
  -> terrainFamilyId
  -> Terrain Family Encounter Resolver
  -> Encounter Intent
  -> CaptureEncounterSnapshot v1
```

## Autorités
- position/mouvement : Exploration Core ;
- famille locale : Terrain Family Resolver ;
- règles de rencontre : Terrain Family Encounter Config ;
- créatures / éléments / spawnChance : CaptureDatabaseV1 ;
- décision de départ rencontre : Encounter Controller ;
- transformation contrat Combat : Encounter Bridge ;
- Combat : aucun calcul dans Exploration.

## Snapshot v1
Doit contenir uniquement :
- schema/version ;
- encounterId ;
- source ;
- playerPartyRef opaque ;
- opponent creatureId canonique ;
- rulesetId opaque ;
- contexte minimal (areaId, terrainFamilyId, elementId) ;
- returnToken opaque.

Interdit :
- MapActorVisual ;
- stats copiées ;
- capacités copiées ;
- WorldDocument ;
- position mutable comme autorité Combat ;
- accès aux internes du labo Combat.

## Déclenchement
Le contrôleur est appelé par la boucle de mouvement existante.
Aucun timer global.
Le contrôle se fait après une distance parcourue configurable ; l’immobilité ne lance aucun jet.

## Périmètre
- Encounter Intent v1 ;
- Encounter Controller distance-gated ;
- CaptureEncounterSnapshot v1 ;
- Encounter Bridge snapshot ;
- tests purs ;
- preview locale de handoff contractuel.

## Hors périmètre
- vrai moteur Combat Capture ;
- CaptureCombatResult v1 ;
- apply-once du résultat ;
- modification du dépôt Combat.


## Preview smartphone — Encounter Controller + Snapshot v1 — 2026-10-03

État technique :
- Encounter Controller distance-gated ;
- aucun timer global ;
- aucune rencontre à l'arrêt ;
- changement d'Area ne compte pas comme distance ;
- Route à 0 % reste sûre ;
- un seul encounter actif à la fois ;
- Encounter Intent -> CaptureEncounterSnapshot v1 ;
- snapshot sans stats, visuels, WorldDocument ni position mutable.

CI :
- contrôleur + snapshot : `37133959063` — **SUCCESS** ;
- bridge pur : `37134015905` — **SUCCESS** ;
- raccord runtime : `37134217465` — **SUCCESS**.

Preview :
- PR infra : #49 ;
- main preview : `6338502cd6faef21746097243fe3b89c46930aea` ;
- Pages : `37134317177` — **SUCCESS** ;
- artifact : `11278251268`.

Mode de test :
`index.html?encounterTest=1`

Dans ce mode :
- même Encounter Controller ;
- distance de contrôle réduite à 80 ;
- RNG injecté déterministe pour provoquer rapidement une rencontre ;
- aucun bypass du Terrain Family Resolver / Encounter Resolver ;
- Exploration se fige quand le snapshot est prêt ;
- panneau affiche créature / élément / famille ;
- « Continuer l’exploration » libère le même encounterId.

Gate smartphone :
1. ouvrir le mode test ;
2. se déplacer quelques instants en forêt ;
3. vérifier qu'un panneau « Rencontre détectée » apparaît ;
4. vérifier qu'aucune rencontre n'arrive à l'arrêt ;
5. appuyer « Continuer l'exploration » ;
6. vérifier reprise exacte au même point ;
7. tester la route : la config normale reste celle du WorldDocument.

Le lot reste **NON GREEN** jusqu'à validation utilisateur de cette preview.
