# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
World Builder Dynamique UI v1.

## Branche
`work/exploration-world-builder-dynamique-ui-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-world-builder-dynamique-ui-v1-2026-10-02`

## SHA de base GREEN
`745b13bd550893b5ae21c351fa1f511acb2bdc16`

## Dernier checkpoint GREEN
`checkpoint/exploration-map-actor-visual-v1-green-2026-10-02`

## Objectif
Construire la première vraie interface du **World Builder Dynamique** directement dans le laboratoire, mais comme module séparé du runtime Exploration.

Flux obligatoire :
```text
World Builder Dynamique
        ↓
draft WorldDocument
        ↓ validation/normalisation
WorldDocument v1
        ↓
export/import/runtime
```

Le Builder ne modifie jamais la partie Exploration active.

## Propriétaires
- données carte : WorldDocument / WorldArea / WorldObject / Portal déjà GREEN ;
- draft d'édition : World Builder Draft Model ;
- UI : World Builder UI ;
- preview : renderers Exploration existants en lecture seule ;
- assets : adapters existants ;
- collision/gameplay : jamais possédés par le Builder.

## Périmètre v1
- page dédiée `builder.html` ;
- draft séparé du runtime ;
- chargement du WorldDocument de démo ;
- import JSON WorldDocument ;
- export JSON WorldDocument ;
- sélection WorldArea ;
- édition largeur/hauteur + matériau de base ;
- édition des Spawns ;
- sélection/ajout/duplication/suppression WorldObjects ;
- transform X/Y/rotation/scale ;
- choix assetId compatible ;
- paramètres Bridge déjà validés ;
- paramètres Building déjà validés, footprint et doorAnchors inclus ;
- sélection/ajout/suppression/édition des Portals ;
- target Area / target Spawn ;
- trigger point ou building-door ;
- paramètres visuels Portal ;
- preview canvas utilisant les mêmes renderers que le runtime ;
- UI mobile/tablette prioritaire ;
- lien runtime ↔ Builder ;
- tests du modèle de draft et sentinelles architecture.

## Hors périmètre
- mutation directe du runtime actif ;
- sauvegarde IndexedDB/Core Storage ;
- routes/rivières dessinées à la main ;
- génération procédurale UI ;
- import visuel utilisateur Map Actor ;
- édition gameplay PNJ/créatures ;
- IA ;
- autre dépôt.

## Règles absolues
- aucun format `BuilderMap` concurrent ;
- l'export est un vrai WorldDocument v1 ;
- le preview renderer ne possède aucune donnée ;
- modifier un sprite ne modifie ni collision ni Portal ;
- Portal reste l'unique autorité des liens entre Areas ;
- aucune valeur importante cachée uniquement dans l'UI ;
- pas de reload comme mécanisme d'application ;
- aucune branche runtime fusionnée dans main ; main reste infrastructure preview.

## Tests requis
- draft créé sans mutation de la source ;
- édition Area ;
- édition Spawn ;
- édition transform WorldObject ;
- duplication avec id unique ;
- suppression ;
- ajout Building/Bridge avec contrats valides ;
- édition Portal sans doublon d'autorité ;
- export -> normalize -> import conserve les données ;
- preview utilise les renderers existants ;
- Builder n'importe pas mouvement/collision comme autorité d'édition ;
- checkpoints Bridge/Building/Portal/MapActor restent GREEN.

## Critère de sortie
Sur smartphone/tablette :
- ouvrir le World Builder Dynamique ;
- sélectionner l'extérieur ou l'intérieur ;
- déplacer/redimensionner/faire pivoter la maison ou le pont par paramètres ;
- modifier un spawn ;
- modifier un Portal ;
- voir le résultat dans la preview ;
- exporter le JSON ;
- réimporter ce JSON sans perte.

Le lot reste non GREEN jusqu'à validation utilisateur.
