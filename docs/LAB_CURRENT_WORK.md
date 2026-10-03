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

## Preview smartphone — Terrain Family Encounters v1 — 2026-10-03

État avant publication :
- HEAD gouvernance/technique : `8bea643508bfaf6b4a7d395bce9e87c07d6d034a` ;
- CI : `37129148827` — **SUCCESS**.

Publication :
- checkpoint infra départ : `checkpoint/exploration-start-preview-terrain-family-encounters-v1-2026-10-03` ;
- branche infra : `infra/pages-preview-terrain-family-encounters-v1-2026-10-03` ;
- PR : #48 ;
- main preview : `396b6fe7aac53ab8043dda947c4fec9198e71d97` ;
- Pages run : `37129219666` — **SUCCESS** ;
- artifact : `11275827917`.

Gate smartphone :
1. Builder > Area : choisir Famille du sol puis vérifier que Texture du sol ne propose que les textures de cette famille ;
2. Terrain : choisir Plaine / Forêt / Montagne / Volcan / Neige / Sable puis peindre ;
3. vérifier qu'une texture identique peut servir plusieurs familles sans changer leur famille gameplay ;
4. Route reste famille Route ;
5. Mer/eau reste famille Mer ;
6. Rencontres par famille : choisir une des 8 familles ;
7. régler chance globale de rencontre ;
8. répartir les éléments Capture avec total exact 100 % pour une famille active ;
9. tester Route à 0 % ;
10. export/réimport : vérifier conservation des familles et réglages.

Le lot reste **NON GREEN** jusqu'à validation utilisateur smartphone.


## Fermeture GREEN — Terrain Family Encounters v1 — 2026-10-03

Validation utilisateur positive sur smartphone de la nouvelle architecture famille -> pourcentages éléments -> rareté Capture.

Checkpoint :
`docs/checkpoints/EXPLORATION_TERRAIN_FAMILY_ENCOUNTERS_V1_GREEN_2026-10-03.md`

Suite :
**Phase 7 — Encounter Bridge**.
