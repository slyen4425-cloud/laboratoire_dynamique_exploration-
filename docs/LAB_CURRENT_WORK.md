# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Material Assets Forest Test v1 — import graphique contrôlé pour Material Pack v1.

## Branche
`work/exploration-material-assets-forest-test-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-material-assets-forest-test-v1-2026-10-01`

## SHA de base
`f02e5bd1f27fcce569c040e3ac41d62efb35afd9`

## Dépendance
Ce sous-lot part du candidat Material Pack v1, qui n'est pas encore checkpoint GREEN fonctionnel.
Il ne peut donc pas devenir GREEN indépendamment avant validation du parent.

## Pourquoi ce sous-lot séparé
Le lot Material Pack v1 avait explicitement exclu les nouveaux binaires graphiques.
Conformément à la charte, l'import d'assets est isolé dans un chantier distinct au lieu d'élargir silencieusement le périmètre.

## État gelé
- géométrie World Surface Model v1 ;
- routes/rivières X/Y + largeur ;
- collisions ;
- mouvement ;
- caméra ;
- Material Registry v1 ;
- trois materialId pilotes.

## Périmètre
- importer exactement 8 assets générés pour test ;
- noms techniques stables ;
- ownership Exploration local ;
- manifeste avec provenance et rôle ;
- raccorder les assetId dans Material Pack v1 ;
- créer/raccorder l'Asset Adapter local nécessaire ;
- aucune géométrie modifiée ;
- aucune collision dérivée des textures ;
- preview mobile.

## Assets prévus
- `surfaces/grass_forest_base_01.png`
- `surfaces/grass_forest_base_02.png`
- `paths/road_dirt_base_01.png`
- `water/water_forest_stream_base_01.png`
- `transitions/road_dirt_to_grass_forest_edge_01.png`
- `transitions/water_forest_stream_to_grass_forest_bank_01.png`
- `decals/leaves_forest_floor_decal_01.png`
- `decals/roots_forest_floor_decal_01.png`

## Destination
`assets/exploration/materials/forest/`

## Hors périmètre
- génération de nouveaux visuels supplémentaires ;
- Builder UI ;
- World Generator ;
- modification de forme/largeur des routes/rivières ;
- collisions ;
- gameplay ;
- autre dépôt.

## Critère
Les 8 assets sont présents localement dans le dépôt, référencés par identifiants sémantiques, sans hotlink ni autorité gameplay, tests/CI GREEN et preview mobile fonctionnelle.
