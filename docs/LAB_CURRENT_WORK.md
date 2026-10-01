# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Material Pack v1 — contrat de matériaux personnalisables.

## Branche
`work/exploration-material-pack-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-material-pack-v1-2026-10-01`

## SHA de base
`795c22552abab14d8d7d6ae1da076ae62395e997`

## Dernier checkpoint GREEN
`checkpoint/exploration-world-surface-model-v1-green-2026-10-01`

## État gelé
World Surface Model v1 :
- sol de base indépendant ;
- route = points X/Y + largeur + materialId ;
- rivière = points X/Y + largeur + materialId ;
- aucune grille autoritaire ;
- collisions séparées ;
- caméra/déplacement validés.

La géométrie ne doit pas être modifiée dans ce lot.

## Objectif
Créer le système qui transforme un `materialId` en apparence personnalisable, sans donner d'autorité gameplay aux textures.

## Matériaux pilotes
- `grass.forest`
- `road.dirt`
- `water.forest_stream`

## Périmètre
- Material Pack schemaVersion 1 ;
- Material Registry ;
- trois matériaux pilotes ;
- paramètres visuels versionnés ;
- support des références texture/variants/edge/decals/transitions dans le contrat ;
- renderer piloté par le registre au lieu de styles codés en dur ;
- tests d'indépendance géométrie/matériau.

## Personnalisation cible
Un matériau peut définir :
- texture/base asset ;
- variantes ;
- edge asset/mask ;
- decals ;
- densité ;
- échelle ;
- teinte/couleurs ;
- répétition ;
- paramètres visuels d'animation ;
- fallback procédural explicite.

Le Builder pourra changer `materialId` et les paramètres autorisés sans redessiner la géométrie.

## Propriétaires
- géométrie : World Surface Model ;
- materialId dans le monde : WorldDocument ;
- apparence : Material Registry ;
- fichiers : Asset Adapter ;
- pixels : Renderer ;
- collisions : Collision World.

## Fichiers autorisés
- `src/materials/` ;
- `src/render/surface-renderer.js` ;
- tests ;
- documentation.

## Hors périmètre
- nouveaux binaires graphiques ;
- import des anciennes dalles forêt ;
- Builder UI ;
- World Generator ;
- modification des routes/rivières ;
- collisions ;
- ponts/bâtiments ;
- autre dépôt.

## Tests requis
- les 3 ids se résolvent ;
- id inconnu = erreur/fallback explicite, jamais autre module ;
- matériau immutable/normalisé ;
- changer materialId ne modifie pas points/largeur ;
- renderer ne modifie pas World Surface Model ;
- tests historiques GREEN ;
- CI GREEN ;
- preview mobile avant checkpoint GREEN si rendu modifié.

## Étape suivante
Après contrat/code GREEN :
- preview des trois matériaux ;
- validation visuelle/ergonomique ;
- ensuite mini Builder Surface sur un lot séparé.
