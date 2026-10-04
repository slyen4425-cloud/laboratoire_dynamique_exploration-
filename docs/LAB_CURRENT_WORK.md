# NOTE PRODUIT — Extensibilité des rencontres / familles de terrain — 2026-10-04

Base GREEN :
`checkpoint/exploration-capture-rewards-progression-audit-v1-green-2026-10-04`

SHA de base :
`480d6858f53170ed5ff6f1b82db13eb074ca791a`

Checkpoint de départ :
`checkpoint/exploration-start-encounter-config-extensibility-note-v1-2026-10-04`

Branche :
`work/exploration-encounter-config-extensibility-note-v1-2026-10-04`

Statut : **NOTE PRODUIT / CONTRAINTE À AUDITER AVANT LE PROCHAIN LOT RENCONTRES**.

## Principe

Le système de rencontres par terrain doit rester entièrement **data-driven et extensible par le créateur**.

Les listes présentes dans l'éditeur ne doivent jamais devenir des enums fermées codées en dur si elles appartiennent au contenu du jeu.

## 1. Éléments Capture dynamiques dans la configuration des rencontres

Dans l'UI où le joueur règle, pour une famille de terrain, les chances d'apparition / répartitions par élément :

- la liste des éléments doit être alimentée depuis l'autorité canonique des éléments Capture ;
- si un nouvel élément est créé/ajouté au système Capture, il doit apparaître automatiquement dans cette liste sans modification du code de l'éditeur Exploration ;
- aucun tableau local figé du type Feu/Eau/Terre/etc. ne doit être l'autorité de l'UI ;
- les pourcentages/chances restent des données configurables du profil/monde ;
- une migration/version de données doit préserver les anciennes configurations lorsqu'un nouvel élément apparaît.

À auditer avant GREEN :
1. source réelle de la liste d'éléments dans le Builder/éditeur ;
2. absence de liste dupliquée dans Exploration ;
3. comportement quand un élément nouveau est ajouté ;
4. sauvegarde/export/import des répartitions ;
5. traitement explicite d'un élément inconnu d'une ancienne sauvegarde.

## 2. Familles de terrain créables par l'utilisateur

Les 8 familles actuelles sont des **familles par défaut**, pas une limite du moteur :

- Plaine (`plain`) ;
- Forêt (`forest`) ;
- Mer (`sea`) ;
- Montagne (`mountain`) ;
- Volcan (`volcano`) ;
- Neige (`snow`) ;
- Route (`road`) ;
- Sable (`sand`).

Le créateur doit pouvoir, s'il le souhaite :

- créer une nouvelle famille de terrain ;
- lui donner un identifiant stable et un nom affiché ;
- configurer sa chance globale de rencontre ;
- configurer sa répartition par éléments Capture disponibles ;
- l'associer aux surfaces/zones appropriées via `terrainFamilyId` ;
- la sauvegarder, l'exporter et la réimporter avec le monde/profil.

Exemples futurs possibles : marais, jungle, ruines, ville, ciel, profondeur marine, etc.

## Contraintes d'architecture

- `terrainFamilyId` reste une sémantique gameplay distincte de `materialId` ;
- une texture ne crée jamais implicitement une famille ;
- plusieurs matériaux peuvent partager la même famille ;
- Terrain Family Registry/config = propriétaire des familles ;
- Capture = propriétaire des éléments/créatures/raretés ;
- Exploration Encounter Controller consomme ces données mais ne les duplique pas ;
- aucune deuxième base locale d'éléments ou de créatures ;
- aucune branche `if (terrain === "...")` nécessaire pour qu'une famille utilisateur fonctionne.

Critère cible :
**ajouter un nouvel élément Capture ou une nouvelle famille de terrain ne doit nécessiter aucun changement du moteur Exploration.**

---

# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Capture Rewards / XP / Progression — audit de récupération v1**
>
> Branche : `work/exploration-capture-rewards-progression-audit-v1-2026-10-04`
>
> Base GREEN : `baec0fecede7b9117c3f58d801add3ea593d2796`
>
> Checkpoint de départ : `checkpoint/exploration-start-capture-rewards-progression-audit-v1-2026-10-04`
>
> Périmètre : audit uniquement des règles historiques Capture et des contrats actuels ; aucune mutation gameplay, aucun changement Combat Runtime/Roster Session, aucun changement Zombicide-40k.
>
> Lot Player Party / Rappel -> Invocation : **FROZEN — gate utilisateur échouée**, à reprendre après refonte côté labo Combat.
>
> Résultat audit : voir `docs/LAB_CAPTURE_REWARDS_PROGRESSION_AUDIT_V1.md`.
>
> Décision : XP/loot/capture appartiennent à Capture. Exploration ne doit ni calculer ni stocker une seconde progression.

---


Date : 2026-10-03

## Chantier actif
Actor Placement Catalog v1 — World Builder + sentinelle Loup volcanique.

## Branche
`work/exploration-actor-placement-catalog-v1-2026-10-03`

## Base GREEN
`806d9e9a78dbfdb4728b0344c8afcb6e3b8b9afc`

## Checkpoint de départ
`checkpoint/exploration-start-actor-placement-catalog-v1-2026-10-03`

## Objectif
Remplacer le banc de calibration Actor du World Builder par le flux produit validé :

```text
Actor Definition authority
 -> Actor Catalog
 -> World Builder : sélectionner + placer
 -> WorldArea.actors[] : actorDefinitionId + placement seulement
 -> résolution Actor Definition
 -> MapActorVisual dérivé
 -> Asset Adapter
 -> Map Actor Renderer
```

## Autorités
- placement monde : WorldDocument / WorldArea ;
- définition Héros/PNJ/Créature : module propriétaire de l'entité ;
- créatures Capture : CaptureDatabase/transfer provider lecture seule ;
- visuel intrinsèque : Actor Definition / présentation de l'entité ;
- asset physique : catalogue global / Asset Adapter ;
- préparation du visuel map : Map Actor Visual Preparer ;
- rendu : Map Actor Renderer, lecture seule.

## Périmètre
- ajouter un contrat minimal de placement acteur dans WorldArea ;
- Builder : catalogue + ajout + sélection + X/Y + direction + suppression ;
- supprimer du Builder les réglages intrinsèques Actor :
  - import image ;
  - asset manuel ;
  - rôle manuel ;
  - targetHeight ;
  - sourceFacing / miroir ;
  - anchor ;
  - ombre ;
  - animation ;
  - export MapActorVisual ;
- provider générique Capture -> Actor Definition ;
- preview loader lisant la vraie définition `crea-loup` depuis le dépôt Combat imbriqué ;
- résolution de son asset depuis le vrai catalogue global imbriqué ;
- placer `capture:creature:crea-loup` dans la map démo ;
- rendu Builder et runtime via le pipeline MapActorVisual GREEN existant ;
- tests anti-duplication de données visuelles.

## Hors périmètre
- édition des visuels Héros/Créatures ;
- création d'un second catalogue Capture ;
- vraie équipe joueur Capture ;
- IA/comportement du Loup placé ;
- collision/gameplay propre au placement ;
- modification de Zombicide-40k.

## Critères GREEN techniques
- WorldDocument conserve seulement actorDefinitionId + x/y/facingX ;
- aucun assetId/mapVisual dans le placement ;
- Builder ne propose plus aucun réglage visuel intrinsèque ;
- Loup placé résout son asset depuis la source Capture globale ;
- aucune URL physique du Loup codée dans le Builder ;
- Builder/runtime utilisent le même resolver de définition ;
- sentinelles historiques GREEN ;
- CI SUCCESS.

## Gate utilisateur
Sur la preview publique :
1. voir le Loup volcanique sur la map ;
2. ouvrir le Builder > Acteurs ;
3. vérifier que l'UI ne permet que choix/placement ;
4. déplacer le Loup via X/Y ou sur la map ;
5. lancer le test runtime ;
6. vérifier que le même visuel est conservé.

## Prévalidation technique — Actor Placement Catalog v1

Implémenté :
- `WorldArea.schemaVersion = 3` avec `actors[]` canonique ;
- placement strict : `id + actorDefinitionId + x/y + facingX` ;
- aucun `assetId` / `mapVisual` / réglage visuel sérialisé dans la map ;
- panneau Actor du Builder réduit à sélection / ajout / X-Y / direction / suppression ;
- suppression de l'import image, scale, anchor, ombre, animation, miroir, export MapActorVisual ;
- Builder et runtime résolvent tous deux le visuel depuis la définition d'acteur ;
- l'ancien handoff `builderTestSession.actorVisual/actorAsset` n'est plus consommé par le runtime ;
- sentinelle `capture:creature:crea-loup` placée dans `forest-exterior` ;
- provider Capture générique : presentation assetId -> catalogue visuel global -> MapActorVisual -> renderer ;
- aucune URL physique du Loup dans le WorldDocument ou le Builder.

TDD :
- frontière placement sans données visuelles ;
- provider Capture -> Actor Definition ;
- projection vers MapActor renderer ;
- mutations Builder add/update/delete ;
- présence Loup par référence seulement ;
- UI Actor placement-only ;
- handoff Builder/runtime sans autorité visuelle parallèle.

CI :
- premier run `37148172504` : FAILURE sur 2 sentinelles de contrat obsolètes ;
- causes corrigées :
  - wording UI du nouveau panneau ;
  - attente WorldArea v2 -> v3 ;
- run `37148318702` : SUCCESS ;
- après retrait définitif de l'ancien handoff actorVisual/actorAsset :
  run `37148360401` : SUCCESS.

État : **TECHNIQUE GREEN — publication preview et validation utilisateur restantes**.

## Publication preview — 2026-10-03

Preview fonctionnelle figée :
- branche : `preview/exploration-actor-placement-catalog-v1-2026-10-03` ;
- SHA : `ea6bf020618209cd6f77baab9cbc4fe195a9c8db` ;
- checkpoint : `checkpoint/exploration-actor-placement-catalog-v1-prevalidation-green-2026-10-03` ;
- Exploration CI finale : `37148500636` — **SUCCESS** ;
- push/checkpoint CI : `37148531984` — **SUCCESS**.

Publication Pages :
- PR infra : #57 ;
- main infra : `0e1ba866df511597decbb92bfd83a315037f091e` ;
- Pages run : `37148567676` — **SUCCESS** ;
- artifact : `11282993699` (~32,2 Mo).

Le workflow Pages embarque côte à côte :
- Exploration depuis la branche preview Actor Catalog ;
- Combat depuis la preview Loup configurée validée ;
- `global-assets` sous `capture-assets/`.

La sentinelle Loup ne possède aucun chemin physique dans le WorldDocument :
`capture:creature:crea-loup`
-> transfer Capture
-> assetId de présentation
-> catalogue global
-> asset physique
-> MapActorVisual dérivé
-> Map Actor Renderer.

Gate restante : **validation utilisateur visuelle/ergonomique** du Loup sur la map et du panneau Builder placement-only.

## Retour utilisateur — vue acteur placé — 2026-10-03

Validation utilisateur :
- le Loup volcanique est bien présent sur la map ;
- le chemin de résolution d'asset est validé ;
- le lien / placement est considéré correct.

Correction demandée :
- la map affichait la vue `player/back`, donc le Loup était vu de dos ;
- pour une créature placée dans le monde, utiliser la vue `opponent/front` en priorité.

Correction appliquée :
- le provider Actor Definition Capture choisit désormais `presentation.visual.front.assetId` ;
- fallback explicite vers `back` uniquement si `front` est absent ;
- aucune modification du WorldDocument, du placement, du renderer ou des assets ;
- aucun assetId du Loup copié dans la map.

TDD :
- fixture conserve bien deux vues distinctes : front=opponent, back=player ;
- les tests exigent maintenant que la définition et la vue placée utilisent l'asset opponent.

CI :
- run `37148839946` — **SUCCESS**.

Gate restante :
- revalidation visuelle rapide du Loup de face dans la preview publique.

## Incident preview — vue opponent toujours affichée de dos — 2026-10-03

Retour utilisateur après déploiement opponent/front :
- la map affichait encore visuellement la vue de dos.

Audit :
- binaire `global-assets` inspecté :
  - `loup_volcanique_opponent.webp` = vraie vue 3/4 face ;
  - `loup_volcanique_player.webp` = vraie vue 3/4 dos ;
- métadonnées globales cohérentes ;
- règle provider corrigée cohérente : `front` avant `back` ;
- Pages run précédent SUCCESS.

Cause racine :
- après la correction provider, les URLs publiques du graphe ES modules étaient restées identiques ;
- `index.html` chargeait toujours `main.js?rev=actor-placement-catalog-v1` ;
- `main.js` / Builder chargeaient le preview loader sans revision ;
- le preview loader chargeait le provider sans revision ;
- un navigateur pouvait donc continuer à réutiliser l'ancien module provider depuis son cache malgré le nouveau déploiement.

Correction :
- version publique unique `actor-opponent-view-v1` appliquée à :
  - `index.html -> main.js` ;
  - `builder.html -> world-builder-main.js` ;
  - runtime -> `capture-actor-preview-loader-v1.js` ;
  - Builder -> `capture-actor-preview-loader-v1.js` ;
  - loader -> `capture-actor-definition-provider-v1.js`.
- aucune stratégie de reload forcé ;
- aucun service worker ;
- aucun cache gameplay ;
- uniquement une révision d'URL d'asset/module, conforme au pipeline existant.

Sentinelle :
- nouveau test `actor-placement-public-cache.test.js` exige la révision sur toute la chaîne.

CI :
- HEAD fonctionnel `13a24f25fef384eb315ca68899f2fa88f1760b3c` ;
- run `37149293418` — **SUCCESS**.

Gate restante :
- republier Pages sur ce HEAD puis revalider visuellement le Loup opponent/front.

## Preview cache-bustée publiée — 2026-10-03

Publication finale de la correction opponent/front :
- preview SHA : `5603930d07274ea9f5c5ba52ffea72a7e81501f4` ;
- checkpoint : `checkpoint/exploration-actor-opponent-view-cachefix-v1-prevalidation-green-2026-10-03` ;
- CI : `37149329864` — **SUCCESS** ;
- PR infra : #59 ;
- main infra : `2e470c8e04a64c4fcd189547eec55aad2b335bb8` ;
- Pages run : `37149384770` — **SUCCESS**.

Le même lien public charge désormais des URLs versionnées `actor-opponent-view-v1` sur toute la chaîne runtime/Builder/loader/provider.

Gate restante : validation utilisateur visuelle du Loup volcanique en vue opponent/front.

## Validation utilisateur finale — Actor Placement Catalog v1

Retour utilisateur du 2026-10-03 :
- Loup volcanique présent sur la map ;
- placement / lien Builder -> runtime validé ;
- vue `opponent/front` correctement affichée après cache-bust du graphe ES modules ;
- verdict utilisateur : **good**.

Le lot est donc validé fonctionnellement, visuellement et ergonomiquement.

État final :
- placement monde : référence uniquement ;
- données visuelles : autorité Actor/Capture ;
- asset physique : global-assets ;
- Builder : sélection + placement uniquement ;
- runtime : même resolver que le Builder ;
- aucune seconde autorité visuelle ;
- aucune modification de `Zombicide-40k`.

CI du HEAD avant clôture :
- `37149427368` — **SUCCESS**.

État : **GREEN utilisateur**.



## Clôture audit Capture Rewards / Progression — 2026-10-04

Audit historique terminé sans mutation gameplay.

Constats structurants :
- l'ancien Capture calculait déjà l'XP depuis niveau ennemi + rapport niveau ennemi/niveau allié + bonus de type de combat ;
- le profil exposait déjà un multiplicateur XP et des paramètres de progression ;
- le labo Combat courant ne possède encore que le déblocage des slots de compétences par niveau ;
- loot et capture historiques comportent des constantes et, pour la capture, deux formules concurrentes ;
- la refonte doit donc centraliser XP / niveau / loot / capture dans une autorité Capture configurable ;
- Exploration reste hors calcul XP/loot.

CI audit :
- `37180318992` — SUCCESS ;
- `37180332902` — SUCCESS sur HEAD documentaire précédent.

État : **AUDIT TECHNIQUE GREEN**.
