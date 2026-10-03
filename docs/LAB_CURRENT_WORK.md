# LAB_CURRENT_WORK — Point de reprise unique

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

---

# Lot actif — Player Party Ref v1 — 2026-10-03

## Branche
`work/exploration-player-party-ref-v1-2026-10-03`

## Base GREEN
`baec0fecede7b9117c3f58d801add3ea593d2796`

## Checkpoint de départ
`checkpoint/exploration-start-player-party-ref-v1-2026-10-03`

## Objectif
Exploration transporte uniquement la référence de party Capture.

```text
Capture session/bootstrap adapter
  -> active partyRef
  -> Encounter Intent
  -> CaptureEncounterSnapshot.player.partyRef
  -> Combat/Capture
```

## Règles
- aucune créature joueur copiée dans Exploration ;
- aucune stat/loadout/asset joueur dans le snapshot ;
- le WorldDocument ne possède pas la party ;
- Exploration transporte une référence opaque ;
- Combat/Capture la résout.

## Périmètre
- retirer le literal `capture-party-preview` du bootstrap ;
- isoler le partyRef actif derrière un adapter Capture de laboratoire ;
- conserver `CaptureEncounterSnapshot v1` inchangé ;
- tests de frontière.

## Interdictions
- aucun roster Combat dans Exploration ;
- aucune édition de party ici ;
- aucune persistence GenSrpG finale ;
- aucune modification de Zombicide-40k.

## Prévalidation technique — Player Party Ref v1

Implémenté :
- le bootstrap Exploration ne contient plus `capture-party-preview` ;
- `activePartyRef` provient d'un adapter Capture de laboratoire ;
- valeur preview : `capture-party-player-v1` ;
- Encounter Intent transporte uniquement cette référence opaque ;
- `CaptureEncounterSnapshot v1` reste inchangé ;
- aucun `creatureId`, stat, loadout ou asset joueur n'est introduit dans Exploration ;
- cache-bust runtime `player-party-ref-v1` ;
- sentinelle Actor cache adaptée pour distinguer révision d'entrée et sous-graphe Actor.

HEAD : `db197f34a5b1ae5399b76ec6f8b4fbcdbd497801`
CI : `37152638356` — **SUCCESS**.

État : **TECHNIQUE GREEN — publication preview + validation utilisateur restantes**.

## Publication preview coordonnée — 2026-10-03

Preview fonctionnelle figée :
- branche Exploration : `preview/exploration-player-party-ref-v1-2026-10-03` ;
- SHA Exploration : `ed606a047d8238c524aba67cf736a275fd4ef2ec` ;
- checkpoint : `checkpoint/exploration-player-party-ref-v1-prevalidation-green-2026-10-03`.

Publication Pages :
- PR infra : #61 ;
- main infra : `81c6a2aee3e1d89bc1dc179ea58e29358332255d` ;
- Pages run : `37152774027` — **SUCCESS**.

Le workflow public utilise explicitement :
- `preview/exploration-player-party-ref-v1-2026-10-03` ;
- `preview/lab-exploration-player-party-v1-2026-10-03` ;
- `global-assets`.

Gate restant : validation utilisateur du vrai Player Party dans le combat Encounter.

---

# Micro-lot correctif — Combat Document Revision v1 — 2026-10-03

## Base
- checkpoint publié Player Party Ref : `f021460a7cf49143bceb9a0f48dbb37bbead4798`
- checkpoint départ : `checkpoint/exploration-start-combat-document-revision-v1-2026-10-03`
- branche : `work/exploration-combat-document-revision-v1-2026-10-03`

## Régression utilisateur
Après publication du correctif Recall Runtime :
- le comportement navigateur reste identique ;
- Rappel termine puis aucun changement de créature n'est visible.

## Cause de publication démontrée
Exploration navigue vers :
`./combat-preview/examples/dom-demo/exploration-encounter.html`
sans révision d'URL.

Même si le HTML publié référence les nouveaux modules corrigés, un navigateur peut réutiliser un document HTML antérieur sous la même URL et ne jamais découvrir les nouvelles URLs de modules.

## Correction cible
Versionner le **document Combat lui-même** au point de navigation :
`exploration-encounter.html?rev=player-party-recall-runtime-fix-v1`.

Versionner aussi le graphe Exploration qui possède cette navigation :
- index -> main.js ;
- main.js -> combat-handoff-navigation.js.

## Interdits
- aucun reload forcé ;
- aucun service worker ;
- aucun timer/cache gameplay ;
- aucune modification du Combat Runtime ;
- aucune modification du Roster Session ;
- aucune modification de Zombicide-40k.

## Gate
TDD -> CI -> preview Pages -> validation utilisateur.

## Résultat technique — Combat Document Revision v1

### Cause
Le correctif Combat Recall était bien publié, mais Exploration naviguait toujours vers le document :

`./combat-preview/examples/dom-demo/exploration-encounter.html`

sans query de révision.

Le navigateur pouvait donc réutiliser un ancien HTML en cache. Dans ce cas, il ne découvrait jamais les nouveaux modules / JSON corrigés, même si Pages avait correctement déployé le nouveau Combat.

### Correction
Navigation publique :

`exploration-encounter.html?rev=player-party-recall-runtime-fix-v1`

Le graphe propriétaire est également versionné :
- `index.html -> main.js?rev=combat-document-revision-v1` ;
- `main.js -> combat-handoff-navigation.js?rev=combat-document-revision-v1`.

Aucun reload forcé, service worker, timer ou cache gameplay ajouté.

### TDD
`combat-handoff-navigation.test.js` vérifie désormais :
- partyRef réelle ;
- URL Combat complète avec révision ;
- conservation du returnUrl ;
- versionnement du graphe Exploration.

La sentinelle Actor conserve sa propre révision indépendante.

### HEAD
`e649f8e115ae7beaa357c2078051347f9477e225`

CI :
`37154391923` — **SUCCESS**.

État : **TECHNIQUE GREEN — publication preview + validation utilisateur restantes**.

