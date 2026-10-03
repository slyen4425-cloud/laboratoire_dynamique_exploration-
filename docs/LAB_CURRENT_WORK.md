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
