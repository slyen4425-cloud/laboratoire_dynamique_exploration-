# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Audit des assets visuels réutilisables pour Exploration.

## Branche
`work/exploration-asset-audit-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-asset-audit-2026-10-01`

## SHA de base
`b0fec182a1cf9f4e561e1c4e9ed21be7f3169886`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase1a-core-contract-green-2026-10-01`

## État gelé à préserver
- moteur X/Y Phase 0/1A ;
- config versionnée ;
- collisions ;
- caméra ;
- stick tactile ;
- CI architecture.

## Périmètre
Lecture seule de `slyen4425-cloud/Zombicide-40k` pour :
- inventorier les sols/murs/éléments de décor réutilisables ;
- relever leurs chemins et blobs/SHA ;
- distinguer :
  - asset Dungeon spécifique ;
  - asset visuellement générique ;
  - candidat futur `assets/common/` ;
  - asset à exclure ;
- auditer le resolver d'assets existant ;
- définir le contrat d'Asset Adapter Exploration ;
- documenter un premier pack visuel cible.

## Propriétaire
Asset Adapter / documentation Exploration.

## Interdictions
- aucun hotlink runtime vers `Zombicide-40k` ;
- aucun import direct d'un resolver privé Dungeon ;
- aucun fichier du dépôt principal modifié ;
- aucun asset binaire copié avant classification ;
- aucun changement du moteur Exploration dans ce lot.

## Tests
- diff du lot = documentation/manifest uniquement ;
- CI existante GREEN ;
- aucun fichier `src/` modifié.

## Risque inter-module
Lecture seule du dépôt principal. Aucun raccord runtime.

## Étape suivante si GREEN
Ouvrir un nouveau lot `asset-pack-forest-v1` pour importer/copier un petit pack validé sous ownership Exploration, puis fournir une preview mobile.
