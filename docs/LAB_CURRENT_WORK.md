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
- Asset Adapter local sémantique ;
- Texture Store de rendu ;
- aucune géométrie modifiée ;
- aucune collision dérivée des textures ;
- preview mobile.

## Assets réellement importés
Destination :
`assets/exploration/materials/forest/`

### surfaces
- `surfaces/grass_forest_base_01.webp`
- `surfaces/grass_forest_base_02.webp`

### path
- `paths/road_dirt_base_01.webp`

### water
- `water/water_forest_stream_base_01.webp`

### transitions
- `transitions/road_dirt_to_grass_forest_edge_01.webp`
- `transitions/water_forest_stream_to_grass_forest_bank_01.webp`

### decals
- `decals/leaves_forest_floor_decal_01.webp`
- `decals/roots_forest_floor_decal_01.webp`

## Format test mobile
Dérivés WebP de validation :
- bases / decals : 96x96 ;
- transitions : 144x48.

Ces fichiers sont des **assets de test du pipeline**, pas la résolution artistique finale.
Le manifeste conserve les IDs de génération source et les SHA-256 des dérivés.

Fichiers de traçabilité :
- `manifest-v1.json`
- `SHA256SUMS.txt`

## Import binaire
Une première tentative par ZIP one-shot a échoué au décompactage (run `36893201714`) à cause du ZIP de transit tronqué.

Cette voie a été abandonnée, non relancée et nettoyée :
- ZIP temporaire supprimé ;
- workflow temporaire supprimé.

Import définitif :
- 8 blobs GitHub binaires créés directement ;
- commit d'import `6e4c1dd38b8a30850dc3c7f604dc97732c4d4d40` ;
- aucune dépendance d'import permanente.

## Raccord sémantique

### grass.forest
- base : `texture.grass.forest.base.01`
- variante : `texture.grass.forest.base.02`
- decals :
  - `decal.forest.leaves.01`
  - `decal.forest.roots.01`

### road.dirt
- center : `texture.road.dirt.base.01`
- edge enregistré : `transition.road.dirt.grass_forest.edge.01`

### water.forest_stream
- center : `texture.water.forest_stream.base.01`
- bank enregistré : `transition.water.forest_stream.grass_forest.bank.01`

## Rendu actif
Le renderer utilise maintenant :
- texture répétée pour le sol forêt ;
- texture au centre de la route ;
- texture au centre de la rivière ;
- decals forêt déterministes.

Les assets `edge` et `bank` sont enregistrés/résolus, mais ne sont pas encore déformés sur les courbes.
Cette étape est volontairement différée à un lot de transitions dédié afin d'éviter une fausse solution par étirement.

Les couleurs procédurales restent des fallbacks visuels explicites pendant le chargement ou si un asset n'est pas prêt.

## Garanties
- asset id -> chemin local uniquement ;
- aucun hotlink ;
- aucun chemin Dungeon ;
- id inconnu -> null, jamais fallback inter-module ;
- texture indépendante de la géométrie ;
- collision indépendante des pixels ;
- renderer lecture seule vis-à-vis du World Model ;
- checksums des 8 fichiers vérifiés automatiquement ;
- architecture Material Pack parent conservée.

## Hors périmètre
- nouveaux visuels supplémentaires ;
- rendu final des transitions edge/bank ;
- Builder UI ;
- World Generator ;
- modification de forme/largeur des routes/rivières ;
- collisions ;
- gameplay ;
- autre dépôt.

## Critère
Les 8 assets doivent être présents localement, référencés par identifiants sémantiques, utilisés sans modifier la géométrie, tests/CI GREEN et preview mobile fonctionnelle.

## Checkpoint
Aucun checkpoint GREEN fonctionnel avant :
1. CI finale GREEN ;
2. preview Pages GREEN ;
3. validation utilisateur smartphone ;
4. validation/fermeture cohérente du parent Material Pack v1.


## État de validation technique — 2026-10-01
- HEAD technique testé : `205dd0e13568f9250d9e62ce46cf0d391ea7315c` ;
- CI : run `36894709021` — SUCCESS ;
- preview Pages : run `36894823423` — SUCCESS ;
- checkpoint infrastructure preview :
  `checkpoint/exploration-preview-material-assets-forest-test-v1-green-2026-10-01`.

## Test manuel requis
Sur smartphone, vérifier :
- texture forêt réellement visible ;
- route texturée au centre de la géométrie validée ;
- rivière texturée au centre de la géométrie validée ;
- decals feuilles/racines visibles mais non envahissants ;
- déplacement/caméra toujours fluides ;
- aucune modification apparente des formes/largeurs de route/rivière ;
- absence d'écran blanc ou de freeze.

Le rendu des transitions edge/bank n'est pas un critère de ce test : leurs assets sont importés et résolus, mais leur mapping courbe est volontairement différé.

Aucun checkpoint GREEN fonctionnel avant validation utilisateur.
