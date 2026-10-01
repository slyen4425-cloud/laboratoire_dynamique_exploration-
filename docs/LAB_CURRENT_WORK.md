# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Audit assets visuels Exploration — **GREEN / fermeture documentaire**.

## Branche
`work/exploration-asset-audit-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-asset-audit-2026-10-01`

## SHA de base
`b0fec182a1cf9f4e561e1c4e9ed21be7f3169886`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase1a-core-contract-green-2026-10-01`

## Périmètre réalisé
Lecture seule de `Zombicide-40k` :
- 42 candidats terrain/mur tracés avec blob SHA ;
- 36 variantes de sol :
  - forêt 6 ;
  - grotte 6 ;
  - glace 6 ;
  - lave 6 ;
  - pierre 6 ;
  - eau 6 ;
- 2 références mur ;
- 4 sols legacy ;
- audit du Core Asset Resolver GenSrpG ;
- contrat Asset Adapter Exploration défini ;
- premier pack recommandé : forêt v1.

## Constats
- le resolver GenSrpG actuel ne gère pas sols/murs ;
- aucun hotlink inter-dépôt ne sera utilisé ;
- les chemins `assets/dungeon/` ne deviendront pas un contrat Exploration ;
- les murs restent Dungeon-owned à revoir ;
- forêt/eau sont des candidats génériques, ownership futur à décider lors de l'intégration.

## Fichiers ajoutés
- `docs/assets/SOURCE_ASSET_CANDIDATES_V1.json`
- `docs/LAB_ASSET_AUDIT_2026-10-01.md`
- `docs/LAB_ASSET_ADAPTER_CONTRACT.md`

## Runtime
Aucun fichier `src/` modifié.

## Étape suivante
Créer le checkpoint GREEN de l'audit, puis ouvrir :
`asset-pack-forest-v1`

Objectif :
copier les 6 sols forêt sous ownership Exploration, créer l'Asset Adapter local et afficher le premier sol texturé sans toucher aux collisions.
