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


## Preview gizmos + pinceau terrain — 2026-10-02

HEAD technique avant publication :
`f944982a5d126078b4740e7c1d3b78b95e79814c`

CI exacte :
run `37010194996` — **SUCCESS**.

Infrastructure preview uniquement :
- PR #25 ;
- main SHA `9c59b76edb7a33a84ef9046e8eb2e02272078384` ;
- Pages run `37010306799` — **SUCCESS** ;
- artifact `11227611289`.

Artefact Pages réellement téléchargé et contrôlé :
- bouton `Peindre terrain` présent ;
- `terrain-brush-size` présent, plage 24 → 600 ;
- script Builder versionné `world-builder-dynamique-ui-v1-gizmos-brush` ;
- modes `rotate-object` et `scale-object` présents ;
- `hitAreaResizeHandle` présent ;
- Surface Renderer publié consomme `surface.zones`.

Gate restante :
validation smartphone/tablette utilisateur des poignées, de la rotation, du resize Area et du pinceau terrain.


## Retour utilisateur — largeur pinceau Route / Rivière — 2026-10-02

Validation partielle de la preview gizmos + pinceau terrain :
- amélioration jugée nette ;
- demande supplémentaire avant GREEN : Route et Rivière doivent disposer du même réglage intuitif de largeur qu'un pinceau.

Décision :
- remplacer les champs de largeur Route/Rivière par des sliders avec valeur visible ;
- afficher sur la map un cercle de prévisualisation correspondant exactement à la largeur active pour Terrain, Route et Rivière ;
- conserver les champs comme données canoniques `surface.routes[].width` et `surface.rivers[].width` ;
- ne créer aucun format Builder parallèle ;
- autoriser une largeur Rivière beaucoup plus grande afin de peindre de grandes étendues d'eau (lac/mer) avec le même système de surface v1 ;
- la largeur reste une donnée du WorldDocument, jamais un état caché de l'UI.

Limites UI v1 retenues :
- Route : 8 → 600 ;
- Rivière : 8 → 2400 ;
- Terrain : 24 → 600.

Ces limites sont des bornes d'édition du Builder, pas une nouvelle autorité gameplay.

Tests requis :
- Route/Rivière exposent des sliders avec output ;
- la valeur active est reflétée en direct ;
- le preview du pinceau existe pour les trois outils ;
- une Rivière large survit export/import sans modification ;
- aucune régression du modèle Surface/WorldDocument.


## Correction — pinceaux Route / Rivière — 2026-10-02

Régression ergonomique reproduite par sentinelle :
- commit test `11b99313342f674b11490f5b9817978376d91965` ;
- CI run `37019467681` — **FAILURE attendue**.

Correction :
- Route : largeur transformée en slider/pinceau 8 → 600 ;
- Rivière : largeur transformée en slider/pinceau 8 → 2400 ;
- valeur numérique visible en direct pour les deux ;
- le cercle de prévisualisation sur la map affiche maintenant le diamètre réel pour Terrain, Route et Rivière ;
- modifier la largeur d'un tracé sélectionné met à jour directement la donnée canonique `WorldArea.surface.*[].width` ;
- aucune donnée parallèle Builder ;
- Rivière large conservée à l'identique par export/import (test à 1800).

CI après correction :
- HEAD code : `1d33a76b284024079303d141c55d09c0fc402693` ;
- run `37019674818` — **SUCCESS**.

## Preview pinceaux Surface — 2026-10-02

Infrastructure main uniquement :
- PR #26 ;
- main SHA `fb9f759981e8633ebd80261c1a8f4b5ef4ee3493` ;
- Pages run `37019818293` — **SUCCESS** ;
- artifact `11232268381`.

Artefact Pages réellement contrôlé :
- slider Route présent ;
- slider Rivière présent ;
- Rivière max 2400 ;
- outputs Route/Rivière présents ;
- script Builder versionné `world-builder-dynamique-ui-v1-surface-brushes` ;
- logique de prévisualisation Route/Rivière publiée.

Gate restante :
validation smartphone/tablette utilisateur de la largeur des pinceaux Route/Rivière et d'une grande étendue d'eau.


## Régression — Test en jeu perdait le WorldDocument édité — 2026-10-02

Retour utilisateur :
- l'ergonomie mobile oblige encore à trop scroller pour changer d'outil ;
- surtout, « Tester en jeu » ouvrait le runtime statique de démonstration ;
- au retour Builder, le draft était recréé depuis la démo ;
- bâtiments, tracés et modifications semblaient donc réinitialisés.

Cause confirmée :
- le bouton de test était un simple lien direct vers `index.html` ;
- aucun WorldDocument canonique n'était transmis au runtime ;
- aucun snapshot de session n'était disponible pour reprendre le même document au retour ;
- le runtime restait autoritaire sur `demoWorldDocument` uniquement.

Ce comportement ne venait pas des helpers Draft ni des renderers : le raccord Builder -> runtime de test était absent.

### Reproduction permanente

Sentinelles ajoutées dans :
`tests/world-builder-test-handoff-regression.test.js`

Commit de reproduction :
`4c678600b42ed6e5afffa6da7aa4d021337a1faf`

CI :
run `37024557319` — **FAILURE attendue**.

La reproduction protège notamment :
- bâtiment déplacé/scalé ;
- zone terrain peinte ;
- passage test runtime ;
- retour au Builder sans perte.

### Correction — handoff canonique unique

Nouveau contrat :
`src/builder/world-builder-test-handoff.js`

Chaîne unique :

```text
World Builder Draft
      ↓ validateWorldBuilderDraft
WorldDocument v1 canonique
      ↓ snapshot sessionStorage explicite
Runtime Exploration en mode ?builderTest=1
      ↓
Retour ?resumeBuilderTest=1
      ↓
World Builder Draft recréé depuis le même WorldDocument
```

Règles :
- le runtime de test ne lit jamais le draft mutable ;
- le Builder ne modifie jamais le runtime actif ;
- le snapshot est un handoff de session, pas un second format de carte ;
- aucune structure BuilderMap/PreviewWorld concurrente ;
- si `builderTest=1` est demandé sans snapshot valide, erreur explicite, jamais fallback silencieux vers la démo ;
- les transitions WorldArea restent sans navigation/reload et sont inchangées.

Le lien « Tester en jeu » sauvegarde le WorldDocument validé avant la navigation native.
Le runtime choisit explicitement ce document en mode test.
Le lien runtime devient « Retour World Builder » et reprend la même session.

### Ergonomie mobile primaire

Révision également appliquée dans le même lot UI :
- onglets principaux placés avant la preview sur mobile ;
- outils carte placés au-dessus du canvas ;
- barre d'outils horizontale sans wrapping, scrollable latéralement ;
- barre outils sticky dans la preview ;
- commandes zoom compactes horizontalement.

Objectif : accéder aux outils principaux sans devoir parcourir toute la page.

### État CI

Correctif final avant documentation :
- HEAD : `3c3d9eb2530d4a90469ff7e08bb41427dfb69987`
- CI run `37025260004` — **SUCCESS**.

Gate restante :
nouvelle preview smartphone/tablette et validation utilisateur du chemin complet :
**modifier -> Tester en jeu -> voir les modifications -> Retour World Builder -> modifications toujours présentes**.

Le lot reste non GREEN.


## Preview correctif handoff Builder -> jeu -> Builder — 2026-10-02

HEAD work final du correctif :
`6b19f2e6003cbb4f8109dac9bf3004892c6ce73c`

CI exacte :
run `37025818443` — **SUCCESS**.

Infrastructure preview uniquement :
- PR #28 ;
- main SHA `707f8f710d2ccb2f687fdd9ebbe7fabb32782452` ;
- Pages run `37025969019` — **SUCCESS**.

La preview déployée contient :
- action `Tester en jeu` gardée par validation ;
- snapshot session du WorldDocument canonique ;
- runtime `?builderTest=1` utilisant ce WorldDocument ;
- lien `Retour World Builder` vers `?resumeBuilderTest=1` ;
- restauration du même document au retour ;
- outils principaux repositionnés pour limiter le scrolling mobile.

Gate restante :
validation smartphone utilisateur du scénario complet de non-perte.


## Retour utilisateur — sortie dynamique + simplification zoom — 2026-10-02

Validation partielle :
- le handoff Builder -> test runtime conserve maintenant correctement les modifications ;
- maison déplacée et scale modifié restent bien présents en test.

Régression confirmée :
- la sortie de l'intérieur cible encore le spawn statique `house-return-exterior` ;
- après déplacement/scale de la maison, le retour extérieur reste donc à l'ancienne position.

Cause architecturale :
- l'entrée est déjà liée au `building-door` réel ;
- l'arrivée de retour repose encore sur X/Y persistants indépendants du Building ;
- ces coordonnées deviennent une seconde vérité dès que le Building est transformable.

Décision :
- ne jamais synchroniser/réparer le spawn à chaque déplacement du Building ;
- faire évoluer le Spawn canonique pour autoriser un spawn **ancré à un building-door** ;
- un spawn ancré stocke uniquement la référence Building/doorAnchor + un offset de sortie ;
- sa position monde est résolue à la demande depuis le Building WorldObject ;
- le Portal continue de cibler un seul `targetSpawnId` : aucune seconde autorité Portal.

UI Builder :
- supprimer les boutons zoom +/- et le slider de zoom de la barre preview ;
- mobile : pinch directement sur la map ;
- ordinateur : molette/trackpad centré sous le pointeur ;
- conserver uniquement `Vue Area` et `Centrer sélection` comme actions de cadrage ;
- un spawn ancré affiche sa position résolue mais ses X/Y ne sont pas éditables/draggables indépendamment.

Tests requis avant correction :
- déplacer/scaler la maison puis entrer/sortir doit revenir devant la nouvelle porte ;
- le retour ne dépend plus de l'ancien X/Y ;
- export/import/handoff conservent l'ancrage ;
- l'UI ne contient plus zoom +/−/slider ;
- wheel + pinch restent présents.


## Correction — retour Building dynamique + zoom simplifié — 2026-10-02

Régressions reproduites avant correction :
- retour maison après déplacement/scale : run `37029640138` — **FAILURE attendue** ;
- contrôles zoom redondants : run `37029646867` — **FAILURE attendue**.

Cause du retour incorrect :
- `portal-house-exit` ciblait bien `house-return-exterior` ;
- mais ce Spawn conservait des X/Y fixes correspondant à l'ancienne position de la maison ;
- le Building transformable et le Spawn fixe devenaient donc deux vérités incompatibles.

Correction architecturale :
- WorldArea Spawn passe en contrat v2, rétrocompatible avec les Spawns X/Y ;
- `house-return-exterior` est maintenant un Spawn ancré à :
  - Building `forest-house-01` ;
  - anchor `main-door` ;
  - offset extérieur 56 ;
- un Spawn ancré ne stocke aucun X/Y concurrent ;
- la position est résolue depuis le transform courant du Building ;
- Portal conserve uniquement `targetSpawnId` ;
- déplacement / rotation / scale du Building déplacent automatiquement le retour ;
- le Builder interdit l'édition X/Y indépendante d'un Spawn ancré.

UI zoom :
- boutons + / − supprimés ;
- slider zoom supprimé ;
- mobile : pinch directement sur la map ;
- ordinateur : molette/trackpad centré sous le pointeur ;
- `Vue Area` et `Centrer sélection` restent disponibles.

Sentinelles :
- maison déplacée/scalée -> sortie devant la nouvelle porte ;
- Spawn ancré sans X/Y concurrent ;
- Builder ne peut pas déplacer indépendamment ce Spawn ;
- wheel + pinch toujours présents ;
- absence des anciens contrôles zoom.

CI après correction :
- SHA : `6d0ab16d9d7ff881bbf1b28aac1fec1f1e846b67` ;
- run `37030391738` — **SUCCESS**.

Gate restante :
nouvelle preview smartphone/tablette puis validation utilisateur.


## Preview — retour Building dynamique + zoom gestes — 2026-10-02

HEAD work avant publication :
`faa15bffc3bafeb6b130829783cc70f5104bedd7`

CI exacte :
run `37030587200` — **SUCCESS**.

Infrastructure preview uniquement :
- PR #29 ;
- main SHA `04aabbd72f817df54b1b0385c286672403b98107` ;
- Pages run `37030758364` — **SUCCESS** ;
- artifact `11237427113`.

Artefact Pages réellement téléchargé et contrôlé :
- `house-return-exterior` est bien un Spawn ancré à `forest-house-01/main-door` avec offset 56 ;
- `WORLD_AREA_SCHEMA_VERSION = 2` publié ;
- Portal résout bien `targetSpawnId` via `resolveWorldAreaSpawnPoint` ;
- aucun bouton `preview-zoom-in` / `preview-zoom-out` ;
- aucun slider `preview-zoom` ;
- aide publiée : pinch mobile + molette/trackpad ordinateur ;
- cache revisions runtime/Builder actualisées.

Gate restante :
validation smartphone utilisateur :
1. déplacer/scaler la maison ;
2. Tester en jeu ;
3. entrer puis ressortir ;
4. vérifier le retour devant la nouvelle porte ;
5. vérifier le zoom Builder au pinch sans contrôles cassés.


## Régression — pinch zoom tactile cassé après simplification — 2026-10-02

Retour smartphone :
- sortie de maison dynamique : OK ;
- pinch zoom Builder : ne répond plus ou très mal.

Cause confirmée :
- la simplification zoom a retiré les contrôles + / − / slider et leur synchroniseur ;
- `updatePinch()` appelait encore `syncZoomInput()` ;
- cette fonction n'existe plus ;
- au premier mouvement pinch, une `ReferenceError` interrompait le geste.

Reproduction permanente :
- test `regression: pinch zoom has no stale dependency on removed zoom controls` ;
- commit `472e903770b7318122f7c1a6b7880bf0232f44da` ;
- CI run `37032164888` — **FAILURE attendue**.

Correction :
- suppression de l'appel fantôme `syncZoomInput()` ;
- aucun contrôle zoom réintroduit ;
- aucune seconde autorité viewport ;
- le pinch continue d'écrire uniquement `zoom + center` éphémères du viewport Builder ;
- molette/trackpad inchangés.

CI après correction :
- SHA `6bfd43d6b3c2efff6b0efab6d076377528e79604` ;
- run `37032220029` — **SUCCESS**.

Gate restante :
nouvelle preview smartphone et validation du pinch.


## Preview — correctif pinch zoom tactile — 2026-10-02

HEAD work documenté :
`2e024310c9691fa3122970ad5e4566753ed2699b`

CI :
run `37032298060` — **SUCCESS**.

Infrastructure preview uniquement :
- PR #30 ;
- main SHA `c13727cb3fc1f3a7dec2fd81a7d32e8f4414ab72` ;
- Pages run `37032435736` ;
- job deploy : **SUCCESS**.

Correction publiée :
- aucun appel `syncZoomInput()` résiduel ;
- pinch tactile conserve uniquement l'autorité viewport `zoom + center` ;
- aucun bouton/slider zoom réintroduit ;
- wheel/trackpad inchangé.

Gate restante :
validation smartphone utilisateur du pinch zoom fluide.


## Régression — rivière dessinée traversable — 2026-10-02

Retour smartphone :
- zoom Builder : de nouveau fonctionnel ;
- une rivière dessinée dans le World Builder pouvait être traversée en test runtime.

Cause confirmée :
- la géométrie canonique existe dans `WorldArea.surface.rivers[]` ;
- le Collision World ne lisait que `world.obstacles[]` ;
- la démo historique compensait avec un rectangle `forest-stream-collision`, donc deux géométries distinctes décrivaient la même rivière ;
- toute nouvelle rivière créée par le Builder n'avait naturellement aucun obstacle dupliqué.

Cette duplication est supprimée au lieu d'être reproduite dans le Builder.

### Reproduction permanente

Tests :
`tests/surface-river-collision-regression.test.js`

Commit de reproduction :
`9b9f37b817a0659996e6fcd2c09d9d0164c213af`

CI :
run `37041256689` — **FAILURE attendue**.

Protège :
- rivière canonique bloquante sans obstacle dupliqué ;
- grande largeur d'eau bloquante ;
- traversée uniquement par Bridge explicitement raccordé au même id de rivière.

### Correction d'autorité

Chaîne unique :

```text
WorldArea.surface.rivers[]
        ↓ géométrie canonique
Collision World
        ↓
blocage entité
```

Le Collision World calcule directement l'intersection cercle / ruban polyline à partir de :
- `river.points` ;
- `river.width`.

Le renderer et le Builder ne possèdent aucune collision.

Bridge :
- conserve son corridor GREEN ;
- référence directement l'id canonique de la rivière dans son mécanisme d'override existant ;
- aucune géométrie de rivière n'est recopiée.

Démo nettoyée :
- suppression de l'ancien rectangle `forest-stream-collision` ;
- Bridge raccordé directement à `forest-stream`.

CI après correction :
- code collision : run `37041397622` — **SUCCESS** ;
- démo sans géométrie dupliquée : run `37041423133` — **SUCCESS**.

Gate restante :
nouvelle preview Pages puis validation smartphone qu'une rivière dessinée bloque bien hors pont.
