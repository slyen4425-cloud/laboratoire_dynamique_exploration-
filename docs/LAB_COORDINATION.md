# GenSrpG Exploration — Coordination

## État actif — 2026-10-03
Phase 5 — **Encounter Layers v1**.

Branche :
`work/exploration-phase5-encounter-layers-v1-2026-10-03`

Base GREEN :
`97eaec1e9de5750d89918629a42a6387f9e4eb82`

Checkpoint de départ :
`checkpoint/exploration-start-phase5-encounter-layers-v1-2026-10-03`

Dernier checkpoint GREEN :
`checkpoint/exploration-phase5-wild-wander-territory-v1-green-2026-10-03`

## Invariants
- Encounter Layers distincts de `surface.zones[]` ;
- materialId/texture sans autorité encounter ;
- Builder édite les données, ne déclenche rien ;
- aucune seconde géométrie de terrain ;
- aucun timer global ;
- pas d'autre dépôt.

## Suite
Après GREEN :
**Random Encounter Runtime v1** — contrôles par distance + résolution des layers/tables.
