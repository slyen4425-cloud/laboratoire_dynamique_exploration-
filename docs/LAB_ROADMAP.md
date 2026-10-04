# GenSrpG Exploration — Roadmap

Cette roadmap applique la charte GenSrpG : progression par petits lots, propriétaire unique, checkpoints de départ et GREEN, tests du vrai chemin, mobile-first et aucune double autorité.

## Règle commune à toutes les phases

Avant chaque lot :
1. dernier SHA GREEN ;
2. checkpoint `start` ;
3. branche `work` ;
4. périmètre dans `LAB_CURRENT_WORK.md`.

Après chaque lot :
1. tests ;
2. CI GREEN ;
3. test mobile si nécessaire ;
4. checkpoint GREEN ;
5. mise à jour du point de reprise.

## Phase 0 — Bootstrap — GREEN

Validé :
- gouvernance initiale ;
- prototype minimal ;
- mouvement X/Y continu ;
- caméra ;
- collisions ;
- stick tactile ;
- test smartphone.

Checkpoint :
`checkpoint/exploration-phase0-bootstrap-green-2026-10-01`

## Lot transversal — Alignement gouvernance GenSrpG

Objectif :
- appliquer la charte officielle ;
- propriétaires ;
- garde-fous ;
- contrat d'intégration ;
- sentinelles d'architecture.

Aucun changement gameplay/runtime.

## Phase 1 — Exploration Core

- configuration normalisée de mouvement ;
- vitesse/accélération/freinage configurables ;
- normalisation input ;
- collision consolidée ;
- cycle install/dispose des adapters ;
- tests du chemin input -> mouvement -> collision -> position.

Critère de sortie :
autorité unique et sentinelles Phase 0 toujours GREEN.

## Phase 2 — Monde, surfaces, matériaux et caméra

- world model versionné ;
- World Surface Model : sol/routes/rivières indépendants ;
- Material Registry versionné ;
- Material Packs extensibles ;
- transitions et decals séparés de la géométrie ;
- couches sol/décor/obstacles/interactions ;
- culling ;
- index spatial si nécessaire ;
- caméra indépendante de l'état monde.

Critère :
- le renderer ne devient jamais propriétaire du gameplay ;
- changer un materialId ne modifie pas la géométrie ;
- Builder et Generator consomment/produisent le même WorldDocument.

## Phase 3 — Génération procédurale v1

- seed ;
- config de biome ;
- forêt ;
- clairières ;
- chemins ;
- rivière ;
- pont ;
- points d'intérêt ;
- validation d'accessibilité ;
- déterminisme testé.

## Phase 4 — World Builder Dynamique

- création manuelle ;
- édition d'une carte générée ;
- WorldDocument versionné ;
- sélection du biome/sol ;
- dessin et édition de routes ;
- dessin et édition de rivières ;
- largeur/materialId modifiables ;
- placement d'objets ;
- contrôle des decals/densités autorisés ;
- validation ;
- sauvegarde JSON ;
- rechargement identique.

Critère :
World Builder Dynamique -> données -> runtime, jamais World Builder Dynamique -> mutation runtime.
Le World Builder Dynamique et le World Generator utilisent le même format de carte.

## Phase 5 — Monde vivant

- créatures sauvages visibles pour cas spéciaux/scénarisés ;
- errance/territoire déjà validés comme capacité optionnelle ;
- rencontres sauvages ordinaires pilotées par **familles de terrain** ;
- configuration simple et éditable ;
- catalogue/rareté venant de Capture.

Règle produit :
les rencontres ordinaires n'utilisent pas de géométrie Encounter parallèle.

Contrat courant :
- 8 familles canoniques : Plaine, Forêt, Mer, Montagne, Volcan, Neige, Route, Sable ;
- chaque surface porte `terrainFamilyId` + `materialId` séparément ;
- `terrainFamilyId` pilote les rencontres ;
- `materialId` reste visuel ;
- chance globale configurable par famille ;
- répartition élémentaire configurable en pourcentages exacts ;
- créature finale résolue dans CaptureDatabaseV1 ;
- rareté finale = `capture.spawnChance` de la créature ;
- Route peut être configurée à 0 % pour être sûre.

Les créatures visibles restent réservées aux rencontres spéciales/scénarisées/rares/boss/quêtes.


### Terrain Family Extensibility v1 — implémenté techniquement

Les 8 familles historiques sont désormais des presets de données.

Le `WorldDocument` porte un registre `terrainFamilies[]` extensible. Le World Builder peut ajouter/renommer/supprimer une famille non utilisée et la réutiliser pour :
- sol d'Area ;
- terrain peint ;
- route ;
- rivière ;
- configuration de rencontres.

La famille reste une sémantique gameplay indépendante du matériau. Les textures compatibles sont choisies selon le type de géométrie (`surface / path / water`) et non selon le nom de famille.

La validation utilisateur mobile/ergonomique du Builder reste requise avant GREEN final.



## Chantier futur — Surface Feather Blend v1

Objectif produit :
- éviter les coupures visuelles nettes lorsque le créateur peint deux textures de terrain adjacentes, en particulier sur smartphone ;
- privilégier un raccord automatique plutôt que demander au joueur de placer manuellement des textures de transition.

Décision v1 :
- solution **feather / blend automatique** au bord des zones peintes ;
- la frontière canonique reste celle de `WorldArea.surface.zones[]` ;
- le blend est calculé par le Renderer / Material System à partir de la géométrie et des `materialId` ;
- aucune géométrie secondaire, aucun masque persistant concurrent et aucune règle gameplay ne sont ajoutés au WorldDocument ;
- `terrainFamilyId` et `traversalRuleId` restent totalement indépendants du rendu ;
- l'édition doit rester simple au doigt : le créateur peint normalement et le raccord est automatique.

Hors v1 :
- textures de transition dédiées couple par couple (herbe -> neige, sable -> roche, etc.) ;
- édition manuelle des frontières de transition.

Les textures de transition dédiées pourront être ajoutées ultérieurement comme amélioration visuelle du même système, sans remplacer l'autorité du feather/blend.

## Chantier futur — User Texture Import v1

Objectif produit :
- permettre au créateur d'importer facilement ses propres textures pour construire son monde ;
- les textures utilisateur doivent rejoindre la même chaîne d'autorité que les textures natives, jamais un système parallèle.

Architecture cible :

```text
Fichier image utilisateur
  -> validation / préparation
  -> stockage local versionné
  -> assetId utilisateur
  -> Material Definition
  -> Material Registry
  -> Asset Adapter
  -> Builder / Renderer
```

Règles :
- aucune géométrie ou règle gameplay déduite de l'image ;
- `terrainFamilyId` reste indépendant du matériau importé ;
- pas de second catalogue UI ;
- stockage local via l'adapter de storage prévu, IndexedDB dans le laboratoire si nécessaire ;
- métadonnées minimales : nom, catégorie, assetId, dimensions, format, provenance locale ;
- export/import de projet devra transporter les références et médias utilisateur de façon versionnée ;
- suppression d'une texture encore référencée doit être explicitement protégée ;
- mobile-first : validation format/taille et message d'erreur explicite.

## Chantier futur — Multi-Zone / World Assembly

Objectif produit :
- reprendre le principe Dungeon « éditeur de pièce -> éditeur de donjon » pour le Builder Dynamique ;
- séparer l'édition interne d'une zone de la composition d'un monde avec plusieurs zones.

Architecture cible :

```text
Area / Zone Editor
  -> AreaDefinition versionnée
  -> AreaInstance
  -> World / Region Assembly Editor
  -> raccords par Portal / Connector explicites
```

Le World/Region Assembly Editor :
- place et référence des zones réutilisables ;
- raccorde leurs entrées/sorties compatibles ;
- ne réécrit jamais la géométrie interne d'une zone ;
- réutilise Portal/WorldArea lorsqu'ils couvrent déjà le besoin ;
- n'introduit un contrat Connector supplémentaire que si son ownership est démontré avant codage.

Cette composition doit pouvoir servir aux extérieurs, bâtiments/intérieurs, grottes, étages et futures régions sans créer de formats concurrents.

## Phase 6 — World Objects, interactions et Areas

- WorldObject transformable ;
- ponts orientables/scalables ;
- objets ;
- PNJ ;
- coffres ;
- bâtiments extérieurs ;
- WorldArea intérieures ;
- Door/Portal ;
- escaliers via Portal ;
- grottes via Portal ;
- transitions entre Areas sans reload ;
- événements persistants.
- présentation des messages d'événement configurable par profil visuel (ex. standard / parchemin / lettre / papier), séparée de la logique de déclenchement et d'action.

Critère :
- World Builder Dynamique peut modifier transform des objets ;
- pont traversable sans supprimer la rivière ;
- bâtiments/intérieurs utilisent un seul contrat WorldArea/Portal.

## Chantier futur transversal — Dialogue System générique

Objectif :
- fournir un système de dialogue réutilisable par Exploration, Dungeon, Capture et les futurs World/Campaign Editors ;
- ne jamais enfermer la logique de dialogue dans un Builder particulier.

Architecture cible :
- `DialogueDefinition` versionnée et réutilisable ;
- `DialogueController` comme autorité d'exécution ;
- les Builders et WorldEvents ne stockent qu'une référence stable `dialogueId` ;
- les conséquences passent par des contrats/actions explicites vers leurs propriétaires respectifs, jamais par mutation directe.

Évolutions prévues :
- message simple ;
- plusieurs pages/répliques ;
- nom et portrait du locuteur ;
- présentation configurable (standard / parchemin / lettre / papier / autres profils) ;
- réponses multiples ;
- embranchements selon la réponse ;
- conditions configurables (objet possédé, quête, niveau, faction, état du monde, etc.) ;
- conséquences configurables : donner/retirer un objet, ouvrir/fermer une porte, déclencher un combat, activer une quête, modifier un état déclaré du monde ;
- dialogues répétables ou consommables ;
- persistance des choix via l'autorité de save, pas dans la définition du dialogue.

Règle d'autorité :
`Builder/Event -> dialogueId -> Dialogue Controller -> actions contractuelles`.

Le système doit être exploitable notamment par le Builder Dungeon pour PNJ, énigmes dialoguées, portes scénarisées, marchands, prisonniers, choix narratifs et embranchements.

## Phase 7 — Encounter Bridge

Prérequis : **Terrain Family Encounters v1 GREEN**.

- Encounter Controller ;
- `CaptureEncounterSnapshot v1` ;
- raccord contractuel au combat Capture ;
- `CaptureCombatResult v1` ;
- retour à la position exacte ;
- application du résultat une seule fois.

Aucun accès direct aux internes du labo Combat.

## Phase 8 — Persistance / reprise

- ExplorationSave versionné ;
- seed/config ;
- position ;
- monde mutable ;
- entités persistantes ;
- événements consommés ;
- migrations idempotentes ;
- reprise après fermeture.

À l'intégration : adapter vers Core Storage GenSrpG.

## Phase 9 — Mobile/PWA hardening

- performances smartphone ;
- mémoire ;
- culling mesuré ;
- tactile ;
- longue session ;
- rotation/resize si supportés ;
- cache/preview sans logique gameplay.

## Phase 10 — Pré-intégration GenSrpG

Audit uniquement :
- mapping des fichiers ;
- mapping des propriétaires ;
- dépendances Core/Shell/Capture ;
- suppression des simulateurs locaux ;
- tests de frontière Capture/Dungeon/Survie/PvP ;
- plan de migration.

Aucune intégration au dépôt principal depuis ce laboratoire.

## Phase 11 — Intégration GenSrpG

Chantier séparé dans `Zombicide-40k`, soumis à sa charte et à ses checkpoints.

Le laboratoire devient une source de référence technique, pas une autorité parallèle.


## Lot suivant validé — Map Actor Visual System v1

Après WorldArea / Portal v1, construire un système unique de représentation des héros, PNJ et créatures sur la map.

Règle produit :
**le joueur fournit un seul visuel ; GenSrpG prépare automatiquement la représentation map nécessaire.**

Le mode de base doit fonctionner avec une seule image :
- recadrage/détourage si nécessaire ;
- scale et anchor automatiques avec possibilité d'ajustement ;
- ombre ;
- miroir gauche/droite ;
- idle/mouvement visuel léger généré par le runtime.

Les vues supplémentaires ou vraies animations restent facultatives.
Le visuel ne possède jamais position, collision, statistiques ou interaction.

Ensuite seulement :
## World Builder Dynamique UI v1
Le Builder édite le même WorldDocument et les mêmes contrats WorldObject/WorldArea/Portal que le runtime.

Décision produit figée :
- les réglages intrinsèques MapActor sont réalisés dans l'éditeur Héros/PNJ/Créatures ;
- le Builder consomme un catalogue de définitions déjà configurées ;
- dans le Builder, l'utilisateur choisit l'acteur/monstre dans une liste puis le place sur la map ;
- le placement référence la définition d'acteur sans recopier ses réglages visuels.

Le panneau Map Actor complet actuellement utilisé dans le laboratoire reste un banc de calibration technique jusqu'à l'arrivée de l'éditeur Héros/Créatures et du catalogue.

## Lot de convergence requis avant Phase 5 — Surface Traversal Rules v1

L'implémentation technique initiale Surface Traversal a été réalisée sur une lignée antérieure puis volontairement isolée.

Le lot courant la rejoue depuis le checkpoint GREEN Builder + Map Actor afin de préserver :
- World Builder Dynamique ;
- Map Actor Visual ;
- rivière canonique ;
- Portal/Building/Spawn ancré.

Contrat :
`surface geometry -> traversalRuleId -> Traversal Rule Registry -> actor locomotion -> resolver -> mouvement/collision`.

Modes v1 :
- ground ;
- swim ;
- fly.

Après validation GREEN de ce replay, la suite normale reprend avec **Phase 5 — Monde vivant**.
