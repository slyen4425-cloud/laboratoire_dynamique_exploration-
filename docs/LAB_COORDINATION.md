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
