# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 5 — **Terrain Family Encounters v1**.

## Branche
`work/exploration-terrain-family-encounters-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-terrain-family-encounters-v1-2026-10-03`

## Base GREEN
`97eaec1e9de5750d89918629a42a6387f9e4eb82`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase5-wild-wander-territory-v1-green-2026-10-03`

## Décision produit
Le système Encounter Layers peint séparément est abandonné.

Les rencontres ordinaires reposent sur la **famille sémantique du terrain déjà peint**.

Familles canoniques :
- Plaine ;
- Forêt ;
- Mer ;
- Montagne ;
- Volcan ;
- Neige ;
- Route ;
- Sable.

Chaque surface conserve deux informations indépendantes :
- `terrainFamilyId` = sémantique gameplay rencontre ;
- `materialId` = variante visuelle.

Changer de texture dans une famille ne change jamais la famille.

## Autorité rencontres
```text
World Surface geometry + terrainFamilyId
        ↓
Terrain Family Encounter Config
        ↓
chance globale de rencontre de la famille
        ↓
distribution des éléments Capture
        ↓
CaptureDatabaseV1 creature.draft.elements
        ↓
CaptureDatabaseV1 creature.draft.capture.spawnChance
        ↓
créature sélectionnée
```

Exemple :
- Forêt : 30 % de chance de rencontre ;
- si rencontre : Nature 60 %, Terre 25 %, Feu 15 % ;
- dans le pool Feu, chaque créature Feu conserve son `spawnChance` propre ;
- une créature légendaire à `0.5` reste donc extrêmement rare.

## Autorités
- géométrie surface : World Surface Model ;
- famille terrain : `terrainFamilyId` sur la surface canonique ;
- rendu : Material Registry + `materialId` ;
- configuration rencontre par famille : Terrain Family Encounter Config ;
- catalogue créatures / éléments / rareté : CaptureDatabaseV1 ;
- sélection future : Terrain Family Encounter Resolver ;
- déclenchement combat futur : Encounter Controller.

## Interdictions
- aucun EncounterLayer géométrique parallèle ;
- aucune chance dérivée de `materialId` ;
- aucune famille déduite d'une texture au runtime ;
- aucune copie éditable des créatures Capture dans Exploration ;
- aucun tag libre saisi par l'utilisateur ;
- aucun second catalogue de créatures.

## Périmètre du lot
- registre des 8 familles ;
- `terrainFamilyId` dans Surface Model ;
- Builder : famille puis texture compatible ;
- config simple des rencontres par famille ;
- listes d'éléments venant de Capture ;
- provider Capture lecture seule incluant `spawnChance` ;
- resolver pur de sélection pondérée ;
- preview mobile.

## Hors périmètre
- Encounter Bridge ;
- lancement réel du combat ;
- cooldown / anti-spam ;
- éditeur de créature ;
- modification du dépôt Combat.
