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


## Retour utilisateur — ergonomie directe requise — 2026-10-02

Le premier jet UI est techniquement fonctionnel mais jugé trop complexe et peu intuitif.

Décisions utilisateur à intégrer avant toute validation GREEN :
- les bâtiments et autres WorldObjects doivent pouvoir être **sélectionnés et déplacés directement sur la map** au doigt/souris ;
- les champs X/Y restent disponibles uniquement pour le réglage précis ;
- la taille de la WorldArea doit pouvoir être ajustée **directement depuis la map** avec une poignée de redimensionnement, sans créer une seconde géométrie d'Area ;
- navigation preview : **pan direct**, molette, boutons +/- et **pinch zoom centré sur la zone visée** ;
- ajout d'un vrai onglet **Terrain** ;
- les routes doivent pouvoir être tracées directement sur la map ;
- les rivières doivent pouvoir être tracées directement sur la map avec le matériau `water.forest_stream` ;
- les tracés utilisent directement `WorldArea.surface.routes/rivers` du WorldDocument, jamais un format Builder parallèle.

### Extension de périmètre v1 validée

Le lot World Builder UI v1 inclut désormais :
- manipulation directe des WorldObjects ;
- sélection par tap/clic sur la preview ;
- pan/zoom tactile et souris ;
- resize direct de la WorldArea rectangulaire ;
- outils de dessin Route et Rivière ;
- réglage largeur et matériau des tracés ;
- suppression d'un tracé sélectionné ;
- tests des transformations écran/monde et des mutations du draft.

La sémantique WorldArea reste inchangée : une WorldArea est un espace explorable indépendant, pas une zone polygonale dessinée à l'intérieur d'une autre Area.
Le resize direct agit donc sur `width/height` de l'Area courante.

## Hors périmètre
- mutation directe du runtime actif ;
- sauvegarde IndexedDB/Core Storage ;
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


## Révision ergonomie directe v1 — 2026-10-02

Retour utilisateur traité avant validation GREEN.

Implémenté :
- sélection directe des WorldObjects sur la preview ;
- déplacement bâtiment/pont au doigt ou à la souris ;
- déplacement direct des Spawns ;
- pan de la carte sur zone vide ;
- zoom molette centré sur la zone pointée ;
- zoom +/- ;
- pinch zoom tactile centré sur les doigts avec pan simultané ;
- plage de zoom élargie à 0.05 → 4 ;
- outil `Taille Area` : redimensionnement direct de la WorldArea courante depuis la map ;
- contour et poignée visuelle de l'Area ;
- nouvel onglet `Terrain` ;
- outil `Tracer route` ;
- outil `Tracer rivière` ;
- largeur et matériau configurables ;
- rivière raccordée à `water.forest_stream` ;
- sélection/suppression des tracés ;
- routes/rivières écrites directement dans `WorldArea.surface.routes/rivers` ;
- aucun format Builder parallèle.

Le WorldArea Model reste l'autorité : l'outil Taille Area modifie uniquement `width/height`.
Le Surface Model reste l'autorité : les outils Route/Rivière modifient uniquement les données surface canoniques.

Sentinelles ajoutées :
- dessin Terrain -> vrai WorldDocument ;
- export/import conserve une rivière dessinée ;
- zoom centré conserve le point monde sous le curseur ;
- pan en unités monde ;
- hit-test WorldObject orienté ;
- présence des outils directs dans l'UI.

CI :
run `37005753534` — **SUCCESS**.

Gate restante :
nouvelle preview smartphone/tablette puis validation utilisateur de l'ergonomie directe.


## Preview ergonomie directe — 2026-10-02

HEAD work :
`45f101cf68a7225d4b3a69f91585d8f1198aa0b1`

CI exacte :
run `37005835290` — **SUCCESS**.

Infrastructure preview uniquement :
- PR #24 ;
- main SHA `78832ce7c0dabde72335a5088f0eed4409dbe54a` ;
- Pages run `37005933426` — **SUCCESS** ;
- artifact `11225364874`.

Artefact Pages réellement contrôlé :
- outils `Déplacer / Taille Area / Tracer route / Tracer rivière` présents ;
- zoom +/- présent ;
- matériau rivière présent ;
- gestion `pointerdown` présente ;
- zoom molette présent ;
- `addSurfacePath` et resize Area présents ;
- module viewport pur présent.

Gate restante :
validation smartphone/tablette utilisateur.


## Consolidation autorité unique — 2026-10-02

À la demande explicite : **pas de rustine / pas de multi-autorité**.

Le raccord ergonomie directe est confirmé sur une seule chaîne :

```text
geste map / champ précis / import
          ↓
World Builder Draft mutations
          ↓
draft WorldDocument
          ↓ normalizeWorldDocument
WorldDocument v1
          ↓
preview renderers
```

États UI autorisés :
- sélection ;
- outil ;
- viewport ;
- session tactile temporaire.

Ils sont strictement éphémères et ne décrivent jamais une seconde position, une seconde géométrie ou une seconde relation Portal.

Sentinelles ajoutées :
- aucune mutation directe de `draft.areas` ou `draft.portals` dans l'UI ;
- aucune structure `BuilderMap` / `PreviewWorld` parallèle ;
- preview obligatoirement issue de `validateWorldBuilderDraft(draft).document` ;
- drag WorldObject -> `updateWorldObjectTransform` ;
- drag Spawn -> `updateSpawn` ;
- resize Area -> `updateAreaProperties` ;
- dessin Terrain -> `addSurfacePath/appendSurfacePathPoint`.

Aucun changement de contrat gameplay/runtime n'est ajouté par cette consolidation.

CI consolidation autorité unique :
- SHA : `989a42a7f6416a549376ea7348f638e533e2f874` ;
- run `37007397302` — **SUCCESS**.


## Retour utilisateur — gizmos et pinceau terrain requis — 2026-10-02

Constat utilisateur sur la preview directe :
- aucun contrôle visuel évident pour redimensionner un WorldObject ;
- aucune poignée de rotation ;
- le resize d'Area n'est pas assez visible/intuitif ;
- Terrain ne fournit pas encore un vrai pinceau de paysage à taille réglable.

Décision :
- compléter le lot World Builder UI v1 avant toute validation GREEN ;
- la sélection d'un WorldObject affiche des poignées de scale + une poignée de rotation ;
- ces poignées modifient uniquement `WorldObject.transform` via les helpers Draft existants ;
- le resize WorldArea utilise une poignée explicite visible et modifie uniquement `WorldArea.width/height` ;
- ajouter un outil `Peindre terrain` avec diamètre réglable ;
- le pinceau écrit dans une collection canonique `WorldArea.surface.zones[]` du WorldDocument ;
- aucune géométrie Builder parallèle, aucun state gameplay concurrent ;
- les routes/rivières existantes restent inchangées.

Tests requis avant correctif :
- présence des modes de geste scale/rotation ;
- gestes scale/rotation -> `updateWorldObjectTransform` ;
- zone terrain -> WorldSurface canonique ;
- export/import conserve les zones ;
- Surface Renderer consomme les zones ;
- UI expose taille de pinceau et outil peinture ;
- resize Area démarre depuis la poignée, pas depuis n'importe quel point de la map.


## Correction ergonomie — gizmos + pinceau terrain — 2026-10-02

Régression utilisateur reproduite par sentinelles :
- commit `675d304124a9e06226557d7fe6116fdcba07eb2b` ;
- CI run `37009253141` — **FAILURE attendue**.

Corrections implémentées :
- sélection WorldObject -> contour + 4 poignées de scale ;
- poignée dédiée de rotation ;
- scale/rotation écrits uniquement via `updateWorldObjectTransform` ;
- limites de scale réutilisent `WORLD_OBJECT_LIMITS` ;
- outil `Taille Area` recentre la vue et exige la poignée de resize explicite ;
- outil `Peindre terrain` ;
- cercle de pinceau visible sur la map ;
- diamètre réglable 24 → 600 ;
- matériau paysage sélectionnable ;
- nouvelles surfaces procédurales explicites : terre, sable, neige ;
- peinture enregistrée directement dans `WorldArea.surface.zones[]` ;
- Surface Renderer consomme directement ces zones canoniques avant routes/rivières ;
- aucun `BuilderMap`, aucune géométrie UI parallèle.

Sentinelles :
- gizmo scale ;
- gizmo rotation ;
- Area resize via poignée ;
- outil terrain + taille de pinceau présents dans l'UI ;
- `WorldSurface.zones` préservé ;
- export/import conserve les zones peintes ;
- Surface Renderer consomme `surface.zones`.

CI après correctif :
- run `37010065971` — **SUCCESS**.

Une nouvelle preview smartphone/tablette est requise avant validation GREEN.
