# Checkpoint GREEN — Terrain Family Encounters v1

Date : 2026-10-03

## Branche source
`work/exploration-terrain-family-encounters-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-terrain-family-encounters-v1-2026-10-03`

## Base GREEN
`97eaec1e9de5750d89918629a42a6387f9e4eb82`

## HEAD avant fermeture
`4aae8b0135ccab8485c4848232e1d19436b4bea8`

## CI
- technique/gouvernance : `37129148827` — SUCCESS
- preview gate docs : `37129273683` — SUCCESS

## Preview
- main preview : `396b6fe7aac53ab8043dda947c4fec9198e71d97`
- Pages : `37129219666` — SUCCESS
- artifact : `11275827917`

## Validation utilisateur
Validation positive sur smartphone de la nouvelle architecture :
**« beaucoup plus propre et carré »**.

Le système séparé Encounter Layers est abandonné.

## Autorité finale
```text
World Surface geometry
  + terrainFamilyId
        ↓
Terrain Family Encounter Config
        ↓
chance globale famille
        ↓
pourcentage élément Capture
        ↓
CaptureDatabaseV1.elements
        ↓
CaptureDatabaseV1.capture.spawnChance
        ↓
creatureId canonique
```

## Familles canoniques
- plain / Plaine
- forest / Forêt
- sea / Mer
- mountain / Montagne
- volcano / Volcan
- snow / Neige
- road / Route
- sand / Sable

## Invariants protégés
- `terrainFamilyId` = sémantique gameplay ;
- `materialId` = variante visuelle uniquement ;
- aucune géométrie Encounter parallèle ;
- aucune rareté copiée hors Capture ;
- `CaptureDatabaseV1` reste autorité des créatures, éléments et `spawnChance` ;
- Route sûre = famille road configurée à 0 % ;
- export/import WorldDocument conserve familles + config.

## Suite
Phase 7 — Encounter Bridge :
1. Encounter Controller ;
2. CaptureEncounterSnapshot v1 ;
3. test bridge contractuel ;
4. CaptureCombatResult v1 ;
5. retour/apply-once.
