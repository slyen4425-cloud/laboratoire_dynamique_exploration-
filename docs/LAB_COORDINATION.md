# GenSrpG Exploration — Coordination

## Coordinateur unique
Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-03
Phase 5 — Monde vivant.

Micro-lot :
**Spawn Planner / Activation déterministe v1**.

Branche :
`work/exploration-phase5-spawn-planner-v1-2026-10-03`

Checkpoint de départ :
`checkpoint/exploration-start-phase5-spawn-planner-v1-2026-10-03`

Base GREEN :
`d0a17f8ebc479733e5690bc358fb55c60ffd1785`

Dernier checkpoint GREEN :
`checkpoint/exploration-phase5-wild-creature-spawn-v1-green-2026-10-03`

## Invariants
- planner pur et déterministe ;
- aucune décision de collision/traversal dans le planner ;
- actorDefinitionId opaque ;
- aucun timer global ;
- aucune mutation runtime ;
- materialId purement visuel ;
- autre dépôt interdit ;
- CI rouge bloque le lot.

## Suite
Activation runtime minimale seulement après GREEN.
