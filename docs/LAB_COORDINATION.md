# GenSrpG Exploration — Coordination

## Coordinateur unique
Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-03
Phase 5 — Monde vivant.

Micro-lot :
**Wild Creature Entity + Spawn Contract v1**.

Branche :
`work/exploration-phase5-wild-creature-spawn-v1-2026-10-03`

Checkpoint de départ :
`checkpoint/exploration-start-phase5-wild-creature-spawn-v1-2026-10-03`

Base GREEN :
`08b42ccbbffe76b6e81384d52824bb9c2ecc2777`

Dernier checkpoint GREEN :
`checkpoint/exploration-surface-traversal-rules-v1-replay-green-2026-10-03`

## Systèmes GREEN à protéger
- WorldArea / Portal / Building / Spawn ancré ;
- World Builder Dynamique ;
- Map Actor Visual + sourceFacingX ;
- handoff Builder/runtime ;
- rivière canonique ;
- Surface Traversal Rules ;
- gating de locomotion par gameplay acteur.

## Ownership Phase 5
- Actor Definition futur : identité produit, stats, MapActorVisual, capacités locomotion ;
- Living World Model : zones/règles de présence dans le monde ;
- Living runtime entity : état minimal d'une créature sauvage présente ;
- Exploration Engine : mouvement futur ;
- Surface Traversal : passabilité uniquement ;
- Renderer : lecture seule.

## Invariants
- aucun materialId ne décide spawn/IA ;
- aucune copie de stats/visuel/capacités dans les règles de spawn ;
- pas d'IA dans ce premier micro-lot ;
- pas de timer global ;
- pas de second moteur de mouvement ;
- autre dépôt interdit ;
- CI rouge bloque le lot.

## Suite
Micro-lot 2 seulement après GREEN :
spawn planner / activation déterministe.
