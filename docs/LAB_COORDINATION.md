# GenSrpG Exploration — Coordination

## Coordinateur unique
Un seul fil directeur coordonne le chantier.

Règle :
**1 lot = 1 branche = 1 périmètre homogène.**

## État actif — 2026-10-03
Chantier :
**Surface Traversal Rules v1 — replay**.

Branche :
`work/exploration-surface-traversal-rules-v1-replay-2026-10-03`

Checkpoint de départ :
`checkpoint/exploration-start-surface-traversal-rules-v1-replay-2026-10-03`

Base GREEN :
`ecdf28ba33fac409e7a2411ba2fd6592a34dc0b7`

Dernier checkpoint GREEN :
`checkpoint/exploration-map-actor-editor-v1-green-2026-10-03`

Ancienne branche technique :
`work/exploration-surface-traversal-rules-v1-2026-10-02`
HEAD `0293c3ab114f30313eba55b2a5b1255c4bca81d1`.

Règle :
**report sélectif uniquement**. Aucun merge de cette ancienne lignée.

## Systèmes GREEN à protéger
- WorldArea / Portal ;
- Building WorldObject ;
- Spawn ancré ;
- Map Actor Visual + sourceFacingX ;
- World Builder Dynamique ;
- handoff Builder/runtime ;
- rivière canonique consommée directement depuis `surface.rivers[]`.

## Invariants
- ne jamais développer directement sur main ;
- ne jamais toucher au dépôt principal ;
- ne jamais toucher au labo Combat ;
- pas de double autorité ;
- materialId purement visuel ;
- aucune seconde géométrie rivière ;
- pas de rustine globale ;
- mobile prioritaire ;
- chaque régression devient un test ;
- CI rouge bloque publication ;
- checkpoint GREEN avant lot suivant.

## Suite après ce lot
Une fois Surface Traversal GREEN :
**Phase 5 — Monde vivant**.
