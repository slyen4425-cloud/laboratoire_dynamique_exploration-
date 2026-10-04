# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **World Event Contract v1**
>
> Branche : `work/exploration-world-event-contract-v1-2026-10-04`
>
> Base GREEN : `2dfe78980ec957cb2178cdc4783716270753b1d3`
>
> Checkpoint de départ : `checkpoint/exploration-start-world-event-contract-v1-2026-10-04`
>
> Dernier GREEN : `checkpoint/exploration-trigger-geometry-v1-green-2026-10-04`
>
> Mission unique :
> - introduire un contrat `WorldEvent v1` dans le WorldDocument ;
> - lier chaque événement à une Area + une géométrie Trigger GREEN ;
> - distinguer `on-enter` et `on-interact` ;
> - référencer une définition/action future par identifiant stable sans l'implémenter ici ;
> - authoring Builder : ajouter/éditer/supprimer un Event local sans runtime actif.
>
> Contrat cible :
> `id + enabled + sourceAreaId + activation + trigger + eventDefinitionId + repeatPolicy`.
>
> Propriétaires :
> - géométrie : World Trigger Geometry GREEN ;
> - binding local événement/zone : WorldDocument ;
> - définition/action métier : futur Event Definition/Action Authority, référencée seulement ;
> - état consommé/persistance : futur ExplorationSave, hors périmètre ;
> - input interaction/runtime Event Controller : hors périmètre.
>
> Invariants :
> - aucune géométrie Event parallèle ;
> - aucun calcul de trigger recopié ;
> - aucun listener/bouton runtime ajouté ;
> - aucun état `consumed` persistant dans la définition de carte ;
> - aucun Event ne modifie directement Capture/Combat/XP/loot ;
> - aucun type d'action métier codé en dur dans le moteur.
>
> TDD :
> - RED avant modèle ;
> - normalisation on-enter/on-interact ;
> - réutilisation `WorldTriggerGeometry` ;
> - validation Area/object-anchor ;
> - WorldDocument export/import conserve les bindings ;
> - Builder manipule le même draft canonique.
>
> Hors périmètre :
> - exécution d'Event ;
> - bouton Interagir ;
> - coffre fonctionnel ;
> - action catalog ;
> - persistance consumed ;
> - nouveaux assets ;
> - Capture/Combat/XP/loot ;
> - `Zombicide-40k`.
>
> État : **START — TDD RED à constater**.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Trigger Geometry v1**
>
> Branche : `work/exploration-trigger-geometry-v1-2026-10-04`
>
> Base GREEN : `2487923d67c6629b4fcd8668783b2d805b0fcc62`
>
> Checkpoint de départ : `checkpoint/exploration-start-trigger-geometry-v1-2026-10-04`
>
> Dernier GREEN : `checkpoint/exploration-object-catalog-placement-v1-green-2026-10-04`
>
> Mission unique :
> - extraire de Portal une géométrie de trigger commune ;
> - supporter au minimum un point libre et une référence d'objet/anchor ;
> - faire consommer cette autorité commune par Portal ;
> - préserver les anciens documents Portal `building-door` via migration normalisée ;
> - préparer le raccord futur Event/Interaction sans l'implémenter ici.
>
> Propriétaires :
> - géométrie de déclenchement : World Trigger Geometry ;
> - Portal : transition d'Area uniquement ;
> - WorldObject : transform + anchors intrinsèques résolus depuis Object Catalog ;
> - Input/Interaction/Event : hors périmètre.
>
> Invariants :
> - aucune seconde détection de zone ;
> - Portal ne possède plus sa propre formule distance/résolution anchor ;
> - aucune lecture de pixels/alpha PNG ;
> - aucun listener/timer/observer ajouté ;
> - aucune mutation Capture/Combat/XP/loot ;
> - `Zombicide-40k` intact.
>
> TDD :
> - RED avant runtime ;
> - point trigger commun ;
> - object-anchor trigger commun ;
> - migration `building-door -> object-anchor` ;
> - Portal conserve transition vraie Area/Spawn ;
> - tests Portal historiques GREEN.
>
> Résultat technique :
> - nouvelle autorité `src/world/world-trigger-geometry.js` ;
> - géométrie canonique v1 : `point` et `object-anchor` ;
> - anciens triggers Portal `building-door` migrés à la normalisation vers `object-anchor` ;
> - résolution d'ancre depuis le WorldObject résolu/Object Catalog, jamais depuis les pixels ;
> - test de distance possédé uniquement par World Trigger Geometry ;
> - Portal conserve uniquement validation de références + transition Area/Spawn ;
> - Builder édite désormais `point` ou `object-anchor` ;
> - suppression d'un objet référencé par un Portal object-anchor reste protégée.
>
> TDD :
> - RED : `749f2c3be694c889a46190ef7c3222fb944a9a9f` ;
> - CI RED : `37196766622` — FAILURE attendue ;
> - HEAD fonctionnel : `2028bcd4dc9de0806750b3be232c236708d40d21` ;
> - CI finale : `37196884803` — **SUCCESS** ;
> - sentinelle : Portal ne contient plus `buildingDoorAnchorWorld` ni sa propre formule de distance.
>
> Prévalidation :
> - checkpoint : `checkpoint/exploration-trigger-geometry-v1-prevalidation-green-2026-10-04` ;
> - preview : `preview/exploration-trigger-geometry-v1-2026-10-04` @ `2028bcd4dc9de0806750b3be232c236708d40d21` ;
> - PR infra Pages #69 — MERGED ;
> - main infra : `a0179bc3436ae9b13e395c370a1261862ecd640c` ;
> - Pages run : `37196966027` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=trigger-geometry-v1`.
>
> Gate utilisateur avant GREEN final :
> 1. ouvrir Builder > Portals ;
> 2. vérifier qu'un trigger peut être `Point` ou `Ancre objet (porte)` ;
> 3. sélectionner la maison + `main-door` ;
> 4. déplacer/rotationner/scaler la maison et vérifier que le Portal suit toujours sa porte ;
> 5. lancer « Tester en jeu » ;
> 6. entrer dans la maison puis ressortir ;
> 7. vérifier qu'aucun comportement Portal n'a régressé.
>
> Hors périmètre confirmé :
> - Event Controller ;
> - onEnter/onInteract produit ;
> - bouton Interaction/Input ;
> - persistance d'événements ;
> - coffre fonctionnel ;
> - Capture/Combat/XP/loot ;
> - `Zombicide-40k`.
>
> Validation utilisateur — 2026-10-04 :
> - retour : « Ça a l'air de fonctionner » ;
> - aucun défaut Portal signalé ;
> - poursuite du plan autorisée.
>
> CI de clôture utilisateur :
> - run `37200896889` — **SUCCESS** ;
> - SHA validé : `d257f7c0f4479cc78eb4d3e5aef71a60998405f1`.
>
> Checkpoint final :
> `checkpoint/exploration-trigger-geometry-v1-green-2026-10-04`.
>
> État : **GREEN utilisateur + CI GREEN**.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Object Catalog + Generic Placement v1**
>
> Branche : `work/exploration-object-catalog-placement-v1-2026-10-04`
>
> Base GREEN : `4ce31dfe5acb35ca492835383ed9c6bd2236c0d5`
>
> Checkpoint de départ : `checkpoint/exploration-start-object-catalog-placement-v1-2026-10-04`
>
> Prévalidation technique : `checkpoint/exploration-object-catalog-placement-v1-prevalidation-green-2026-10-04`
>
> SHA technique validé : `f659e89bb3275c188b1c2506edbdba944c9cf513`
>
> Résultat :
> - `ObjectDefinition Catalog v1` possède désormais les données intrinsèques des WorldObjects ;
> - `WorldArea.objects[]` persiste uniquement `objectDefinitionId + transform + overrides locaux` ;
> - aucun `visual/baseSize/footprint/doorAnchors/kind` n'est copié dans le placement ;
> - ponts/maison existants sont résolus depuis le catalogue ;
> - collision, traversée, rendu et Portal consomment l'objet résolu ;
> - Builder : sélection d'une définition, placement, X/Y, rotation, scale, duplication/suppression ;
> - Builder ne permet plus d'éditer asset, taille logique, footprint, anchors ou paramètres intrinsèques ;
> - seul override local v1 : ids de surfaces franchies par un placement de pont ;
> - WorldArea passe en schéma v4.
>
> TDD :
> - RED dédié : `c0c4afd7c1e3725944c66ba1784dda659f4d76b9`, CI `37193976216` — FAILURE attendue ;
> - migration des sentinelles Portal/collision/traversée/Builder/assets ;
> - CI technique finale : `37194847351` — **SUCCESS** ;
> - 261/261 tests + `npm run check` GREEN.
>
> Preview :
> - `preview/exploration-object-catalog-placement-v1-2026-10-04` @ `f659e89bb3275c188b1c2506edbdba944c9cf513` ;
> - PR infra Pages #68 — MERGED ;
> - main infra : `2c15cb874f1e7138c2f1d25ee0cbdccd53b2fb44` ;
> - Pages run : `37194940662` — **SUCCESS** ;
> - lien gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=object-catalog-placement-v1`.
>
> Gate utilisateur requise avant GREEN final :
> 1. ouvrir Builder > Objets ;
> 2. choisir une définition (pont ou maison) ;
> 3. « Placer l'objet » ;
> 4. déplacer directement sur la carte puis modifier X/Y ;
> 5. tester rotation + scale ;
> 6. dupliquer puis supprimer ;
> 7. pour un pont, vérifier que « surfaces franchies » reste éditable ;
> 8. vérifier qu'aucun réglage intrinsèque (asset/taille/footprint/anchors) n'apparaît dans le Builder ;
> 9. lancer « Tester en jeu » et vérifier que les mêmes objets sont rendus/collisionnés.
>
> Hors périmètre confirmé :
> - Trigger/Event runtime ;
> - coffre interactif fonctionnel ;
> - nouvel asset binaire ;
> - éditeur complet de définitions ;
> - XP/loot/Capture Rules ;
> - Combat/Roster ;
> - `Zombicide-40k`.
>
> Suite après validation : **Trigger/Event v1** (zones/anchors logiques + onEnter/onInteract + persistance), puis enrichissement du catalogue/Material Packs par assets contrôlés.
>
> Validation utilisateur — 2026-10-04 :
> - aucun défaut fonctionnel de placement signalé ;
> - retour utilisateur : la fonction semblait déjà présente, différence comprise comme une consolidation d'autorité ;
> - placement pont/maison accepté pour poursuite du plan.
>
> CI clôture utilisateur :
> - run `37196666420` — **SUCCESS** ;
> - SHA validé avant checkpoint : `e483c604348baedcad59b724c934e0c35f22c72c`.
>
> Checkpoint final prévu :
> `checkpoint/exploration-object-catalog-placement-v1-green-2026-10-04`.
>
> État : **GREEN utilisateur + CI GREEN**.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Terrain Family Extensibility v1**
>
> Branche : `work/exploration-terrain-family-extensibility-v1-2026-10-04`
>
> Base GREEN : `e8fd5a6e1588ecf200fb03454e9f1be5ff47791e`
>
> Checkpoint de départ : `checkpoint/exploration-start-terrain-family-extensibility-v1-2026-10-04`
>
> Objectif atteint techniquement :
> - les 8 familles historiques sont des presets de données, pas une enum produit fermée ;
> - `WorldDocument.terrainFamilies[]` possède les définitions du monde ;
> - le Builder peut ajouter, renommer et supprimer une famille non utilisée ;
> - une famille utilisée par une Area/zone/route/rivière est protégée contre la suppression ;
> - route et rivière ont désormais une famille éditable ;
> - famille gameplay et texture visuelle sont découplées ;
> - les textures proposées dépendent du type de géométrie (surface/path/water), jamais du nom de famille ;
> - la config de rencontre suit automatiquement les familles du WorldDocument ;
> - les éléments restent fournis dynamiquement par le catalogue Capture ;
> - les anciens WorldDocuments sans `terrainFamilies` récupèrent les 8 presets.
>
> Autorités :
> - familles du monde : WorldDocument ;
> - usage local : World Surface Model ;
> - rencontres : Terrain Family Encounter Config ;
> - éléments/créatures : Capture en lecture seule ;
> - textures : Material Registry.
>
> CI :
> - premier HEAD complet : `37189367867` — FAILURE sur 2 sentinelles obsolètes ;
> - causes : révision Builder trop spécifique dans sentinelle Actor + test héritant des pourcentages démo ;
> - correction soustractive des sentinelles ;
> - HEAD technique : `72c51bdbbc5d3056f41ec00275bab43d3b936d00` ;
> - run `37189417237` — **SUCCESS** (`npm test` + `npm run check`).
>
> Gate utilisateur requise avant GREEN final :
> 1. ouvrir le World Builder > Terrain ;
> 2. ajouter une famille et la renommer ;
> 3. vérifier qu’elle apparaît pour le sol, terrain peint, route, rivière et rencontres ;
> 4. choisir la famille d’une route/rivière sans que sa texture soit forcée ;
> 5. utiliser la famille sur la carte puis vérifier que sa suppression est protégée ;
> 6. vérifier que les réglages de rencontre de cette famille restent éditables.
>
> Hors périmètre confirmé : XP / loot / capture, Combat, Roster, `Zombicide-40k`.
>
> État : **GREEN utilisateur**.
>
> Validation utilisateur — 2026-10-04 :
> - ajout / édition des familles de terrain jugés corrects ;
> - séparation famille / texture jugée cohérente ;
> - verdict : « ça a l'air bon ».
>
> Limite observée pendant le test :
> - impossible d'enchaîner plusieurs combats car le jeu ne reconnaît plus correctement l'équipe après le premier combat ;
> - ce défaut appartient au lot Player Party / Rappel -> Invocation déjà gelé ;
> - il n'est pas causé par Terrain Family Extensibility et n'est pas corrigé dans ce lot ;
> - aucun contournement, retry ou seconde autorité n'est ajouté.
>
> CI HEAD avant clôture : `37189669243` — **SUCCESS**.
>
> Publication preview :
> - preview : `preview/exploration-terrain-family-extensibility-v1-2026-10-04` ;
> - SHA preview : `5018ae4ba6936f13d4d88e671df9bb9c2202a25c` ;
> - checkpoint prévalidation : `checkpoint/exploration-terrain-family-extensibility-v1-prevalidation-green-2026-10-04` ;
> - CI fonctionnelle : `37189417237` — **SUCCESS** ;
> - CI docs prépublication : `37189487868` — **SUCCESS** ;
> - PR infra : #67 — **MERGED** ;
> - main infra : `c9bee8238a0c76ceb1a3c28dbb873795bb61a324` ;
> - Pages run : `37189621459` — **SUCCESS**.
>
> Lien gate :
> `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-family-extensibility-v1`
>
> Aucun code fonctionnel n'a été mergé dans main ; seule la référence Pages a changé.

---

> ÉTAT ACTIF — 2026-10-04
>
> Chantier : **Modular Authoring Architecture v1 — documentation**
>
> Branche : `work/exploration-modular-authoring-architecture-v1-2026-10-04`
>
> Base GREEN : `480d6858f53170ed5ff6f1b82db13eb074ca791a`
>
> Checkpoint de départ : `checkpoint/exploration-start-modular-authoring-architecture-v1-2026-10-04`
>
> Périmètre : architecture documentaire uniquement ; séparer éditeurs de définitions, Level/World Builder, règles générales Capture et futurs éditeurs globaux.
>
> Décisions utilisateur validées :
> - XP / loot / capture = paramètres généraux Capture, hors Builder ;
> - création d'objets de monde = éditeur séparé du placement Builder ;
> - architecture ouverte à de futurs World Editor / Campaign Editor / autres surfaces ;
> - composition par références versionnées, jamais copie d'autorité.
>
> Document : `docs/LAB_MODULAR_AUTHORING_ARCHITECTURE_V1.md`
>
> Aucun changement gameplay/runtime. Aucun changement de `Zombicide-40k`.

> Validation architecture :
> - organisation validée par l'utilisateur ;
> - Object Definition Editor séparé du World Builder ;
> - schéma ouvert aux futurs World Editor / Campaign Editor ;
> - composition par références versionnées ;
> - presets extensibles, pas d'enum produit fermée pour les domaines créateur.
>
> CI : `37184264109` — **SUCCESS** (`npm test` + `npm run check`).
>
> État : **ARCHITECTURE DOCUMENTAIRE GREEN**.
>
> Suite : traiter séparément la note d'extensibilité du Builder (familles de terrain), puis construire l'autorité Capture configurable XP/loot/capture sans la placer dans Exploration.

---

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
