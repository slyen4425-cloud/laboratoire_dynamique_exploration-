# GenSrpG Exploration — Coordination

## État actif — 2026-10-03
Phase 7 — **Encounter Controller + CaptureEncounterSnapshot v1**.

Branche :
`work/exploration-phase7-encounter-controller-snapshot-v1-2026-10-03`

Base GREEN :
`e39e00f906ab4ba9ee2b87d4f9efeeeaecbcd0fa`

## Invariants
- Encounter Controller seul décide du déclenchement ;
- aucune boucle/timer propre aux rencontres ;
- Terrain Family Resolver seul résout la famille locale ;
- CaptureDatabaseV1 seul possède créatures/éléments/rareté ;
- Encounter Bridge ne connaît que les contrats publics ;
- aucun accès direct au labo Combat ;
- aucun second état de position.

## Suite
Après GREEN :
**CaptureCombatResult v1 + retour/apply-once**.


## Correction gate Combat — 2026-10-03

La page showcase Moussados vs Loup est explicitement **hors gate d'intégration**.

Gate unique :
```text
Exploration
 -> rencontre terrain
 -> CaptureEncounterSnapshot v1
 -> bouton Lancer le combat
 -> Combat preview energy-ruleset
 -> CaptureCombatResult v1
 -> retour Exploration apply-once
```

Preview Combat autorisée pour cette gate :
`preview/lab-exploration-encounter-energy-ruleset-v1-2026-10-03`

Interdit pour validation intégration :
`preview/lab-showcase-duel-moussados-loup-energy-v1-2026-10-03`

Le showcase peut rester un banc de démonstration Combat séparé mais ne décide jamais du statut GREEN du handoff Exploration.
