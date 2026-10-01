# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Bridge Visual Assets v1 — import et raccord des premiers modèles de pont.

## Branche
`work/exploration-bridge-visual-assets-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-bridge-visual-assets-v1-2026-10-01`

## SHA de base GREEN
`f5e9a200fc0ca2bb62d72b0cac0a4d6ff9d28df7`

## Dernier checkpoint GREEN
`checkpoint/exploration-world-objects-bridge-v1-green-2026-10-01`

## État gelé
- WorldObject bridge v1 ;
- transform X/Y/rotation/scaleX/scaleY ;
- corridor de traversée ;
- edge assist ;
- rivière bloquante hors pont ;
- collision indépendante des pixels ;
- renderer procédural de secours ;
- mouvement/caméra/surfaces/materials.

Aucune de ces autorités ne doit être modifiée dans ce lot.

## Objectif
Importer proprement quatre modèles de pont générés et les rendre disponibles via identifiants sémantiques :
1. bois rustique avec buttes/berges naturelles ;
2. pierre médiévale avec raccords de terrain ;
3. pont suspendu bois/cordes avec raccords naturels ;
4. pierre ancienne/moussue avec raccords naturels.

## Format runtime
- WebP local ;
- transparence conservée ;
- taille raisonnable smartphone ;
- aucune mégatexture ;
- source artistique distincte du footprint gameplay.

## Destination
`assets/exploration/objects/bridges/`

## Asset IDs
- `object.bridge.wood.rustic_bank.01`
- `object.bridge.stone.medieval_bank.01`
- `object.bridge.wood.rope_bank.01`
- `object.bridge.stone.moss_bank.01`

## Périmètre
- import des 4 assets ;
- conversion WebP optimisée ;
- manifeste + SHA-256 + dimensions + provenance ;
- Object Asset Adapter local ;
- chargement explicite des images ;
- renderer WorldObject utilise l'assetId s'il est prêt ;
- fallback procédural conservé ;
- pont démo raccordé à un premier asset réel ;
- tests/CI/preview mobile.

## Hors périmètre
- collision ;
- corridor ;
- mouvement ;
- WorldArea ;
- Portal ;
- bâtiments ;
- Builder UI ;
- génération procédurale ;
- autre dépôt.

## Règles
- un sprite ne définit jamais la collision ;
- changer d'assetId ne modifie pas transform/footprint/traversal ;
- aucun hotlink ;
- aucun chemin physique dans WorldDocument ;
- renderer ne connaît pas les chemins physiques ;
- Asset Adapter est l'unique propriétaire des chemins locaux.

## Critère de sortie
Les quatre ponts existent dans GitHub, sont traçables et résolus par assetId, le pont démo utilise un modèle réel avec transparence, et tous les tests/CI restent GREEN avant validation smartphone.


## État technique — 2026-10-01

Import restauré proprement en fast-forward :
- commit `9ac7e2a34a2adc5ff4f09ee5884d24cf63ed0a0c` ;
- aucun réécriture d'historique ;
- les quatre WebP sont présents au HEAD descendant.

Assets runtime :
- `bridge_wood_rustic_bank_01.webp` — 40 978 octets ;
- `bridge_stone_medieval_bank_01.webp` — 32 032 octets ;
- `bridge_wood_rope_bank_01.webp` — 39 262 octets ;
- `bridge_stone_moss_bank_01.webp` — 33 858 octets.

Profil :
- WebP RGBA ;
- 256×512 ;
- transparence conservée ;
- qualité 82 ;
- butte/berge visuelle intégrée au sprite ;
- aucun impact sur footprint/collision.

Raccord :
- `src/assets/image-asset-loader.js` : loader image partagé ;
- Material Texture Loader délègue au loader partagé ;
- `src/assets/world-object-asset-adapter.js` : propriétaire unique des chemins physiques des ponts ;
- `src/render/world-object-renderer.js` : résolution visuelle sémantique uniquement ;
- fallback procédural conservé si image non prête ;
- `demo-world.js` utilise `object.bridge.wood.rustic_bank.01`.

Les métadonnées visuelles propres à chaque asset gèrent :
- offset d'orientation source ;
- débordement visuel en longueur ;
- débordement visuel en largeur.

Ces valeurs sont purement visuelles et ne modifient jamais le WorldObject logique.

## Tests
Protégé :
- exactement quatre assets exposés ;
- chaque chemin Adapter existe ;
- manifeste et Adapter synchronisés ;
- cycle load/get/dispose du loader partagé ;
- changer d'assetId ne change pas la géométrie du pont ;
- renderer ne contient aucun chemin physique ni extension WebP ;
- WorldDocument ne contient que l'assetId sémantique ;
- tests historiques Bridge v1 toujours GREEN.

CI technique finale avant documentation :
run `36914921406` — SUCCESS.

## Validation restante
Preview smartphone requise :
- vrai pont bois visible à la place du fallback ;
- transparence correcte ;
- buttes/berges visuelles s'insèrent naturellement ;
- orientation correcte ;
- passage toujours fluide ;
- collision strictement identique au Bridge v1 GREEN.

Aucun checkpoint GREEN Bridge Visual Assets v1 avant validation utilisateur.
