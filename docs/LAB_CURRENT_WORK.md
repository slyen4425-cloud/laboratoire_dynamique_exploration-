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


## État technique World Builder Dynamique UI v1 — 2026-10-02

Implémenté :
- page dédiée `builder.html` ;
- UI mobile/tablette ;
- draft indépendant créé depuis le WorldDocument GREEN ;
- validation systématique par `normalizeWorldDocument` ;
- export JSON du WorldDocument canonique ;
- import JSON avec rejet explicite des références invalides ;
- sélection WorldArea ;
- édition dimensions et matériau de base ;
- édition/ajout/suppression protégée des Spawns ;
- édition transform WorldObject X/Y/rotation/scale ;
- changement d'assetId compatible ;
- ajout Building / Bridge ;
- duplication WorldObject ;
- suppression interdite si un Portal dépend du Building ;
- paramètres Building : baseSize / footprint / doorAnchor ;
- paramètres Bridge : baseSize / passage / edge assist / obstacle IDs ;
- édition Portal comme autorité unique ;
- trigger point ou building-door ;
- target Area / target Spawn ;
- marker/label Portal ;
- preview avec les renderers Exploration existants ;
- overlays Builder uniquement pour sélection/Spawns ;
- raccourci Exploration -> World Builder.

Sentinelles :
- draft sans DOM/renderer/mouvement/collision ;
- UI Builder sans import du moteur mouvement/collision ;
- aucun format `BuilderMap` parallèle ;
- tous les IDs DOM utilisés sont présents dans `builder.html` ;
- preview réutilise Surface / WorldObject / Portal Renderer ;
- syntaxe du point d'entrée Builder vérifiée par CI ;
- export/import round-trip testé.

CI après raccord UI :
run `37003537250` — **SUCCESS**.

Prochaine gate :
publication preview Pages puis validation smartphone/tablette.


## Preview World Builder Dynamique UI v1 — 2026-10-02

CI exacte du lot avant publication :
- HEAD technique : `ab1f30e18829ccee6dfa7181e4a3848b91e0dca1` ;
- run `37003642577` — **SUCCESS**.

Infrastructure main uniquement :
- PR preview : #23 ;
- main SHA : `f6e2df00734981152c1be3324d97d0e2d339af36` ;
- Pages run : `37003736721` — **SUCCESS** ;
- artifact Pages : `11225505055`.

Artefact Pages réellement téléchargé et inspecté :
- `builder.html` présent ;
- `src/builder/world-builder-main.js` présent ;
- `src/builder/world-builder-draft.js` présent ;
- `src/builder/world-builder.css` présent ;
- les modèles/renderers historiques sont présents ;
- `index.html` contient le raccourci vers le World Builder.

URLs de validation :
- runtime : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/`
- builder : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html`

Gate restante :
validation smartphone/tablette utilisateur de l'UI Builder, de la preview et du round-trip export/import.

Le lot reste non GREEN jusqu'à cette validation.
