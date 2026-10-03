# GenSrpG Exploration — Coordination

## État actif — 2026-10-03
Phase 5 — **Terrain Family Encounters v1**.

Branche :
`work/exploration-terrain-family-encounters-v1-2026-10-03`

Base GREEN :
`97eaec1e9de5750d89918629a42a6387f9e4eb82`

## Décision
Le chantier Encounter Layers séparé est abandonné.

Nouvelle chaîne unique :
`surface canonique -> terrainFamilyId -> config rencontre famille -> CaptureDatabaseV1`.

## Invariants
- 8 familles canoniques ;
- materialId reste visuel ;
- terrainFamilyId reste gameplay ;
- CaptureDatabaseV1 reste propriétaire de `elements` et `capture.spawnChance` ;
- aucune géométrie Encounter parallèle ;
- aucun autre dépôt modifié.
