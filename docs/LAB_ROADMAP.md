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

### Extensibilité obligatoire des familles et éléments de rencontre

Les 8 familles canoniques actuelles sont des **presets par défaut**, pas une enum fermée.

Le système cible doit permettre au créateur de définir de nouvelles familles de terrain sans modifier le moteur :
- id stable ;
- nom ;
- chance globale de rencontre ;
- répartition par éléments ;
- association via `terrainFamilyId` ;
- sauvegarde/export/import.

La liste des éléments proposée pour la répartition des rencontres doit être fournie dynamiquement par l'autorité Capture. Si Capture ajoute un nouvel élément, l'éditeur Exploration doit l'exposer automatiquement.

Interdits :
- liste locale figée des éléments Capture dans Exploration ;
- liste fermée de familles imposée par le runtime ;
- règle spéciale par nom de famille ;
- duplication du catalogue Capture.

Sentinelles futures :
- ajout d'un élément Capture fictif -> visible automatiquement dans la config rencontre ;
- création d'une famille utilisateur -> utilisable sans modification moteur ;
- round-trip sauvegarde/export/import de la famille et de ses répartitions ;
- anciens mondes restent lisibles lorsqu'un nouvel élément est ajouté.

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

Critère :
- World Builder Dynamique peut modifier transform des objets ;
- pont traversable sans supprimer la rivière ;
- bâtiments/intérieurs utilisent un seul contrat WorldArea/Portal.

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
