# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-13
>
> **Correctif de gate bloquant : Builder — familles de textures et performance mobile**
>
> Branche : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
>
> Base du lot : `edfadb539fb53aacbf57dd91e79fe9a4efe374c1` (collision R2 prévalidation + gouvernance docs)
>
> Dernier GREEN FINAL utilisateur : `checkpoint/exploration-interior-geometry-authoring-v1-green-2026-10-10` (`11d1c4fe39b6bc8b587a3357dbca9e157a58bdab`)
>
> Collision v1 R2 : **toujours en attente de validation smartphone**, jamais GREEN FINAL.
>
> Gate correctif Builder : **GREEN technique, 435/435 tests ; Pages preview publiée / smartphone à valider**, pas de GREEN FINAL.
>
> Prochaine action : test smartphone du nouveau Builder Sable / familles / fluidité, puis verdict utilisateur ; ne pas ouvrir de nouveau lot avant validation.

> ÉTAT ACTIF — 2026-10-14
>
> Chantier : **Correctif prévalidation Builder — familles de peinture/texture éditables R2**
>
> Branche : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
>
> Base GREEN protégée : Interior Geometry Authoring v1 ; Collision R2 en prévalidation distincte.
>
> Correctif performances R1 : fluidité mobile nettement améliorée, confirmé utilisateur le 2026-10-14. Corrections de palettes R2 : tests CI GREEN, preview/validation mobile nécessaires.
>
> Base GREEN exacte : `ab3ea4b761050977d181d424eb5bfb6439dd249e`
>
> Checkpoint précédent validé : `checkpoint/exploration-interior-geometry-authoring-v1-green-2026-10-10`
>
> Checkpoint de départ : `checkpoint/exploration-start-collision-boundary-worldobject-obstacles-v1-2026-10-10`

## Validation précédente

Le créateur valide le 2026-10-08 que la preview mobile R5 est **plus fluide** et demande de poursuivre le plan.

CI du commit de validation : `37741074814` — SUCCESS.
CI checkpoint GREEN UX : `37741136975` — SUCCESS.

## Besoin produit

L'édition d'une WorldArea intérieure doit permettre :
- régler sa **taille** ;
- régler sa **forme** ;
- conserver une édition simple sur smartphone ;
- poursuivre ensuite l'intégration des textures/assets, dans un lot séparé.

## Autorité canonique retenue

`WorldArea` reste l'unique propriétaire de la géométrie locale.

Contrat v1 :
- `width/height` restent l'étendue canonique et pilotent la taille ;
- nouvelle `boundary` canonique :
  - `{ kind: 'rectangle' }` ;
  - ou `{ kind: 'polygon', vertices: [{x,y}, ...] }` ;
- les vertices polygonales sont normalisées dans l'espace local 0..1 afin qu'un changement de width/height redimensionne la forme sans dupliquer les coordonnées ;
- absence de boundary dans une ancienne carte -> rectangle implicite ;
- aucun `shapePresetId` persistant : les presets Builder sont uniquement des commandes d'authoring vers la boundary.

## Formes Builder v1

Pour un intérieur :
- Rectangle ;
- L ;
- T ;
- Croix.

Une boundary polygonale importée qui ne correspond pas à un preset reste valide et sera affichée comme forme personnalisée ; le Builder ne la remplace pas silencieusement.

## Consommateurs obligatoires

La même boundary doit être consommée par :
- Collision World pour les limites de déplacement ;
- runtime renderer via un clip en lecture seule ;
- preview Builder via le même clip ;
- overlay Builder pour le contour ;
- taille Area existante pour redimensionner proportionnellement la boundary normalisée.

## Compatibilité / migration

- WorldArea schema v5 sans boundary -> WorldArea v6 rectangle ;
- round-trip import/export préserve la boundary canonique ;
- les anciennes WorldArea rectangulaires gardent exactement leur comportement ;
- pas de migration destructive.

## Périmètre fichiers attendu

- `src/world/world-area-model.js`
- nouveau helper pur de géométrie WorldArea si nécessaire
- `src/core/collision.js`
- helper render de clip WorldArea partagé runtime/Builder
- `src/main.js`
- `src/builder/world-builder-draft.js`
- `src/builder/world-builder-main.js`
- `builder.html`
- tests dédiés + sentinelles existantes
- docs architecture/ownership après GREEN technique

## Hors périmètre

- textures supplémentaires ;
- import de nouveaux assets ;
- génération procédurale d'intérieur ;
- éditeur libre de sommets polygonaux ;
- nouvelle collision d'objet ;
- Encounter/Combat ;
- Zombicide-40k.

## TDD obligatoire

RED avant implémentation :
1. schema v6 + migration v5 rectangle ;
2. polygon boundary normalisée/frozen ;
3. helpers point/cercle dans boundary ;
4. Collision World bloque le cutout d'une forme L ;
5. resize width/height conserve la forme normalisée ;
6. Builder intérieur expose Forme + taille sans seconde autorité ;
7. presets écrivent uniquement la boundary ;
8. runtime + Builder réutilisent le même clip read-only ;
9. les extérieurs/anciennes Areas restent rectangulaires.

## Gate

CI complète + preview + test smartphone obligatoire avant GREEN FINAL.


## TDD / implémentation — Interior Geometry Authoring v1

RED fonctionnel :
- commit : `4fbd40c9c44ba7896b0ea3ac01cc891622fc65e3`
- CI : `37741723179` — **FAILURE attendue**
- 409 tests : 400 GREEN, 9 RED ciblés sur schema v6, boundary, collision, Builder, presets et clip partagé.

Implémentation fonctionnelle :
- commit : `3d87e32892b7d145467cb9f32373473b3504e857`
- CI : `37742123865` — **SUCCESS**
- 409/409 tests GREEN.

Livré :
- WorldArea schema v6 ;
- ancienne Area sans boundary -> rectangle canonique ;
- boundary polygonale normalisée en coordonnées 0..1 ;
- helpers purs de géométrie WorldArea ;
- Collision World bloque hors boundary et respecte les cutouts concaves ;
- clip WorldArea partagé par runtime + preview Builder ;
- Builder intérieur : formes Rectangle / L / T / Croix ;
- forme importée non reconnue conservée comme Personnalisée ;
- width/height existants redimensionnent la forme proportionnellement ;
- aucune donnée `shapePresetId` persistée ;
- Taille Area directe continue d'écrire uniquement width/height.

TDD cache :
- RED : `867bd9102248adce1bd44758180b94750ba3ca18`
- CI : `37742252525` — **FAILURE attendue**, 409/410 GREEN, uniquement cache public ;
- code cache : `a8adfb4eb7652594c61aeab9f83aaaaabfa8b91c`
- sentinelles alignées : `5047f48ab9d283d24348130acb7513924f1cf349`
- CI : `37742615742` — **SUCCESS**, 410/410 tests.

Révision publique :
`interior-geometry-authoring-v1`

## Gate attendu

Sur smartphone :
1. ouvrir un intérieur ;
2. changer Rectangle -> L -> T -> Croix ;
3. vérifier que le sol et les objets/acteurs visibles sont bien clipsés à la forme ;
4. vérifier qu'on ne peut pas marcher dans les zones découpées ;
5. modifier Largeur/Hauteur puis Taille Area directe ;
6. vérifier que la forme se redimensionne sans se déformer arbitrairement ;
7. tester `← Extérieur` puis `Intérieur →` ;
8. vérifier que le Builder reste fluide comme en R5.

État : **GREEN TECHNIQUE — documentation + checkpoint/preview requis avant validation utilisateur.**


## Prévalidation publiée — Interior Geometry Authoring v1

- SHA gameplay/docs prévalidation : `085a2aa100274af1676b17b420359bc0b509ac4a`
- CI work : `37742782556` — **SUCCESS**
- checkpoint : `checkpoint/exploration-interior-geometry-authoring-v1-prevalidation-green-2026-10-08`
- CI checkpoint : `37742828444` — **SUCCESS**
- preview : `preview/exploration-interior-geometry-authoring-v1-2026-10-08`
- publication infrastructure uniquement : PR #105
- merge infra `main` : `faf4704d2489ff1f764804acf6ed2d9b77e4d642`
- Pages : `37742930654` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien de gate :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=interior-geometry-authoring-v1`

État : **GREEN TECHNIQUE / PREVALIDATION — attente validation smartphone de la forme/taille intérieure avant GREEN FINAL et avant le lot textures.**


## Gate smartphone prévalidation v1 — verdict NEGATIF

Retour utilisateur du 2026-10-09 :
- intérieur en forme T : à l'entrée, le personnage se retrouve bloqué entre le sol intérieur et la bordure noire, déplacement impossible ;
- rochers / objets : le personnage peut marcher dessus.

Verdict :
- **GREEN FINAL refusé** ;
- le défaut d'arrivée Portal est dans le périmètre Interior Geometry Authoring v1 ;
- la collision générique des WorldObjects est confirmée comme lacune distincte : le Collision World v1 ne bloque actuellement que les `building` dotés d'un footprint. Les `rock`, `tree`, `door`, `stairs` n'ont pas de footprint collision canonique dans leurs ObjectDefinitions.
- conformément à la charte, la collision générique d'objets n'est pas ajoutée en douce dans ce lot. Elle devient le prochain lot explicite après validation de la correction intérieure.

### Cause du blocage T

Le système historique de Building Interior plaçait la première entrée à :
- X = centre - 144 px ;
- Y = bas de l'Area - 104 px.

Pour une Area 720×560 en forme T, la tige basse commence vers X = 230.4.
La première entrée pouvait donc être placée vers X = 216 : **hors de la boundary jouable**.

Changer Rectangle -> T après création du Portal conservait également ces coordonnées rectangulaires devenues invalides.

### TDD regression

RED :
- commit : `d0c6b4857574d910251d3b34c705f973666ef823`
- CI : `38000127075` — **FAILURE attendue**
- tests du vrai chemin :
  - création Building -> intérieur ;
  - changement boundary -> T ;
  - Portal -> target Spawn ;
  - vérification clearance dans boundary ;
  - transition -> Collision World ;
  - mouvement immédiatement après l'entrée ;
  - liaison directe vers une Area T existante.

Correctif :
- helper pur `findWorldAreaBoundarySafePoint()` :
  `1ca80e92729c1f6105f6679757bd80a95dedfc49`
- raccord Draft / Portal / Spawn :
  `e3b414a3034892e6c29e31c67b53c35849e49734`
- correction du test pour respecter l'état Portal frozen :
  `c862ddaab959bd3fcae6d014a6eec6f15e14117e`
- CI : `38000304668` — **SUCCESS**.

Comportement corrigé :
- une liaison créée directement vers une forme T choisit un Spawn + trigger de sortie réellement praticables ;
- si la forme ou la taille d'une Area rend un Spawn/trigger Portal invalide, le Draft le replace vers le point praticable le plus proche ;
- la boundary WorldArea reste l'unique autorité ;
- aucun X/Y parallèle UI/Renderer n'est ajouté ;
- les autres points valides ne bougent pas.

### Cache/publication R2

Révision publique :
`interior-geometry-authoring-v1-r2`

- chaîne publique R2 : `3339b980592e91e2219a41f85c8ad67dd196cf29`
- sentinelles/imports imbriqués R2 : `77f255cb62cb0bee70676ec99a64eabc46229f3e`
- CI : `38000499216` — **SUCCESS**.

## Prochain lot confirmé — WorldObject Collision Footprints v1

À ouvrir uniquement après validation utilisateur de la R2 intérieure.

Objectif déjà audité :
- `building` : collision footprint existe déjà ;
- `rock` / `tree` : visuels/baseSize présents mais aucune collision canonique ;
- Collision World filtre actuellement explicitement `object.kind !== 'building'`.

Le prochain lot devra :
- déclarer la collision dans ObjectDefinition, pas dans le Renderer ;
- fournir des footprints adaptés par catégorie/définition ;
- faire consommer ces footprints par Collision World ;
- préserver Bridge traversal, Building footprint et objets volontairement franchissables ;
- tests vrais chemins héros + entités vivantes ;
- aucun calcul de collision depuis les pixels/assets.

État : **GREEN TECHNIQUE R2 / PREVALIDATION — publication + retest smartphone requis.**


## R2 publiée — gate smartphone correction entrée T

- SHA checkpoint/preview R2 : `62ee2defd343a4762bad1afb771a6894aaae521a`
- CI work documentée : `38000570123` — **SUCCESS**
- checkpoint : `checkpoint/exploration-interior-geometry-authoring-v1-prevalidation-r2-green-2026-10-10`
- CI checkpoint : `38000605260` — **SUCCESS**
- preview : `preview/exploration-interior-geometry-authoring-v1-r2-2026-10-10`
- publication infrastructure uniquement : PR #106
- merge infra `main` : `f295c12a34c0ce18a5914612976d362a7e670c0e`
- Pages : `38000677822` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien R2 :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=interior-geometry-authoring-v1-r2`

Gate demandé :
1. intérieur T ;
2. entrer depuis le Building ;
3. confirmer que le personnage apparaît sur la zone de sol et peut bouger immédiatement ;
4. sortir / rentrer ;
5. tester L et Croix ;
6. resize puis nouvelle entrée.

Le défaut rochers/objets franchissables reste volontairement **non corrigé dans ce lot** : il est déjà audité et réservé au prochain chantier `WorldObject Collision Footprints v1`.

État : **GREEN TECHNIQUE / PREVALIDATION R2 — attente validation utilisateur de l'entrée intérieure. GREEN FINAL interdit avant verdict.**


## Gate smartphone R2 — VALIDÉ utilisateur

Retour utilisateur du 2026-10-10 :
- correction entrée intérieur T : **validée** ;
- défaut résiduel observé : le haut du sprite du héros peut encore entrer dans le noir avant que son petit cercle de collision atteigne la boundary ;
- demande explicite : traiter en même temps les rochers/objets traversables.

Le lot **Interior Geometry Authoring v1** est fonctionnellement validé sur son objectif forme/taille/Portal.
Le problème visuel restant appartient au prochain lot Collision World : profil de clearance de silhouette contre les boundaries.

## Prochain lot — Collision Boundary & WorldObject Obstacles v1

Propriétaire unique : **Collision World**.

Périmètre :
- profil de collision de silhouette explicite pour acteur, indépendant des pixels/assets ;
- boundary WorldArea bloque la silhouette avant qu'une partie importante du corps ne soit clipsée dans le noir ;
- ObjectDefinition peut déclarer un comportement collision `obstacle` ou `passable` ;
- rochers et arbres livrés deviennent des obstacles canoniques avec footprint logique ;
- Collision World consomme le footprint générique, sans filtre codé en dur `kind === building` ;
- import d'objet utilisateur expose explicitement **Obstacle / Traversable** ;
- un import classé Obstacle reçoit une collision logique par défaut éditable ultérieurement ;
- Building footprint et Bridge traversal restent compatibles.

Interdits :
- déduire la collision depuis les pixels du sprite/image ;
- recopier l'objet dans `WorldArea.obstacles[]` ;
- collision dans Renderer ;
- modifier textures/assets dans ce lot.

Décision d'autorité :
- `WorldArea.obstacles[]` reste réservé aux obstacles géométriques autonomes ;
- un WorldObject classé obstacle conserve **sa propre collision dans son ObjectDefinition** ;
- le placement WorldObject reste la seule position/rotation/scale de cet obstacle.

Statut : Interior Geometry Authoring v1 -> **VALIDÉ utilisateur / checkpoint final à créer**, puis ouverture du lot Collision.


## Validation finale utilisateur — Interior Geometry Authoring v1 (base GREEN)

- Retour : « Ok je valide, tout est ok. »
- SHA final GREEN du lot antérieur : `11d1c4fe39b6bc8b587a3357dbca9e157a58bdab`.
- CI work `38033298058` SUCCESS ; checkpoint `38033337107` SUCCESS.
- Filiation historique à signaler : le checkpoint START de Collision avait été créé sur
  `ab3ea4b761050977d181d424eb5bfb6439dd249e` avant le commit
  documentaire de clôture GREEN `11d1c4f`. Les fichiers gameplay étaient
  déjà identiques. La prévalidation R2 réconcilie `11d1c4f` comme parent
  de merge sans supprimer les commits TDD existants ; le START historique
  reste néanmoins sur `ab3ea4b`.

# Lot actif — Collision Boundary & WorldObject Obstacles v1

Date : 2026-10-10

## Retour utilisateur déclencheur

- la R2 Interior Geometry est validée ;
- dans un intérieur, le haut du héros peut encore être clipsé par le noir car la boundary ne teste que le petit cercle de pieds ;
- rochers et autres objets décoratifs sont traversables ;
- demande produit : un modèle importé classé **Obstacle** doit automatiquement utiliser la collision moteur.

## Propriétaire

**Collision World**.

## Contrat acteur

Le renderer ne fournit aucune géométrie gameplay.

L'entité peut déclarer un profil gameplay :
`boundaryFootprint = { left, right, top, bottom }`.

Fallback :
- sans profil -> cercle historique `radius` ;
- avec profil -> la silhouette logique doit tenir dans la WorldArea boundary avant mouvement.

Le héros démo aura un profil explicite cohérent avec sa silhouette de jeu, sans lecture des pixels/alpha.

## Contrat WorldObject

L'ObjectDefinition peut déclarer :
`collision: { role: 'obstacle'|'passable', shape: 'box', widthRatio, heightRatio, offsetX, offsetY }`.

Règles :
- position/rotation/scale viennent uniquement du placement WorldObject ;
- Collision World transforme le footprint logique depuis la définition ;
- Renderer ne calcule jamais la collision ;
- aucun duplicata dans `WorldArea.obstacles[]` ;
- Building footprint historique reste supporté ;
- Bridge traversal reste prioritaire et traversable ;
- rock/tree natifs -> obstacle ;
- door/stairs/decor restent passables par défaut tant qu'une définition ne dit pas le contraire.

## Import utilisateur

Le panneau d'import expose :
- **Obstacle — bloque le passage**
- **Traversable**

Le record local versionné conserve cette intention.
Les anciens records sans ce champ sont migrés de façon compatible :
- rock/tree -> obstacle ;
- autres -> passable, sauf Building qui conserve son contrat historique.

## TDD RED obligatoire

1. silhouette acteur bloque avant le mur haut ;
2. mouvement vrai chemin ne peut pas pousser la tête dans la boundary ;
3. sans profil, cercle historique inchangé ;
4. rochers/arbres natifs déclarent obstacle ;
5. Collision World bloque leur footprint orienté/scalé ;
6. Building historique toujours bloquant ;
7. Bridge toujours franchissable selon traversal ;
8. import utilisateur Obstacle -> ObjectDefinition collision obstacle ;
9. import Traversable -> aucune collision bloquante ;
10. record v1 ancien -> migration déterministe ;
11. UI import expose Obstacle/Traversable ;
12. aucune dépendance asset/pixels dans Collision World ;
13. living creatures consomment le même Collision World.

## Hors périmètre

- rendu d'occlusion derrière les murs ;
- éditeur fin de footprint ;
- collision pixel-perfect ;
- nouvelles textures/assets ;
- combat ;
- Zombicide-40k.

## Gate

CI complète puis preview smartphone :
- mur haut intérieur ;
- rochers/arbres ;
- objet importé Obstacle ;
- objet importé Traversable ;
- Bridge/Building non régressés.


## TDD / implémentation — Collision Boundary & WorldObject Obstacles v1

### RED fonctionnel

- contrat TDD : `62698a345b1a39a78b276f877260698adab010ba`
- CI : `38023628937` — **FAILURE attendue**
- couverture :
  - silhouette acteur asymétrique contre boundary ;
  - déplacement vrai chemin au mur haut ;
  - fallback cercle historique ;
  - rock/tree natifs obstacle ;
  - footprint WorldObject orienté/scalé ;
  - Building historique / Bridge non régressés ;
  - import utilisateur Obstacle / Traversable ;
  - migration record utilisateur v1 ;
  - living runtime reste consommateur du même Collision World.

### Implémentation fonctionnelle

Acteur / boundary :
- `boxFitsWorldAreaBoundary()` : `422540987d26102d874ea57b81e430e4f97edfdb`
- profil joueur `boundaryFootprint` : `08fa32c4643fede65a7bd593690c53a40070ef54`
- normalisation config : `5578dad812688fcd00a40fd972717a5f4d8501e0`
- raccord runtime : `54ee99b9a74db3fbb3e7944e305e7cf6c248f324`

WorldObject obstacle :
- rock/tree natifs déclarés obstacle dans ObjectDefinition : `7237ba821fbf7a2000d006272d587203b108a0de`
- résolution placement -> collision définition : `cadb26fa0865ec0cea698ea5098a65b745424a06`
- footprint générique `worldObjectObstacleRect()` : `f3c2d4871d74326090da5e3ad242973467ee72e4`
- Collision World générique : `aff488ebbe947f3e106932018db1e6d96454142c`

Import utilisateur :
- record v2 + `collisionRole` + migration v1 : `4250cefae99e0bbb91094d18d851399388810e1e`
- UI Obstacle / Traversable : `022b3e8a1513d489818dd977a516196a965d0197`
- raccord Builder : `d0a12e192b8726cd349dc83f481784c06ff9c143`
- ajustement des nouvelles sentinelles géométriques : `a798a386c47ae18762b8e54ce5c3b7779ec314ca`
- CI fonctionnelle intermédiaire : `38023867529` — **SUCCESS, 425/425**.

### Cache public

- RED cache : `274622954da5f28b6360cd33e87b836496b32b1c`
- CI : `38023908679` — **FAILURE attendue**
- révision publique : `collision-boundary-worldobject-obstacles-v1`
- chaîne Builder/runtime/Core/WorldObject alignée ;
- sentinelles historiques réconciliées sans retirer leur couverture ;
- CI chaîne cache : `38024238259` — **SUCCESS, 426/426**.

### Vrai chemin import utilisateur

Un dernier audit avant publication a détecté que le Collision World utilisait encore par défaut le catalogue natif, alors que les imports sont résolus par le catalogue composé runtime.

TDD :
- RED : `f57cf1caac959cbe4c92081f608d3f6924b2c2e2`
- CI : `38024297618` — **FAILURE attendue**.

Correctif :
- injection explicite `collisionContext.objectCatalog` dans Collision World ;
- `stepMovement()` propage le contexte ;
- wildlife spawn + choix de cible + déplacement réel utilisent le même catalogue composé ;
- le catalogue runtime reste un resolver injecté, jamais une donnée persistée dans WorldDocument ;
- raccord final runtime : `4a8d51c0dc2b3a1d176d28085db5f38858d1b0ee`.

CI finale fonctionnelle :
- `38024391220` — **SUCCESS**
- **428/428 tests GREEN**
- `npm run check` GREEN.

## Comportement livré

- le héros est arrêté par la boundary avant que sa tête / haut de silhouette entre dans le noir ;
- sans profil de silhouette, une entité conserve le cercle historique ;
- rochers et arbres natifs bloquent le passage via leur ObjectDefinition ;
- footprint suit placement X/Y, rotation et scale ;
- Building conserve son footprint historique ;
- Bridge conserve son corridor de traversée et ne devient pas obstacle ;
- import utilisateur : choix explicite **Obstacle — bloque le passage** / **Traversable** ;
- anciens records utilisateur sans champ collision : rock/tree -> obstacle, autres -> passable ;
- aucun calcul de collision depuis PNG/WebP/alpha/pixels ;
- aucun WorldObject n'est recopié dans `WorldArea.obstacles[]`.

État : **GREEN TECHNIQUE — documentation/checkpoint/preview requis avant validation smartphone. GREEN FINAL interdit avant verdict utilisateur.**


## Prévalidation publiée — Collision Boundary & WorldObject Obstacles v1

- SHA checkpoint/preview : `5b1c456de5611890d77bf523de35f9ad60112d82`
- CI work documentée : `38024519933` — **SUCCESS**
- checkpoint : `checkpoint/exploration-collision-boundary-worldobject-obstacles-v1-prevalidation-green-2026-10-10`
- CI checkpoint : `38024549851` — **SUCCESS**
- preview : `preview/exploration-collision-boundary-worldobject-obstacles-v1-2026-10-10`
- publication infrastructure uniquement : PR #107
- merge infra `main` : `1776c54cb53be686660e5963812e6778b0a4b03a`
- Pages : `38024603684` — **SUCCESS**
- aucun gameplay du lot n'a été mergé dans `main`.

Lien de gate :
`https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=collision-boundary-worldobject-obstacles-v1`

Gate smartphone :
1. entrer dans un intérieur et marcher vers le mur du haut : la silhouette doit être arrêtée avant que le haut du corps entre dans le noir ;
2. extérieur : tenter de traverser rocher et arbre natifs ;
3. vérifier Building + Portal ;
4. traverser un Bridge ;
5. importer un modèle avec Collision = Obstacle, le placer et tester le blocage ;
6. importer/classer un modèle Traversable et vérifier le passage ;
7. vérifier formes T/L/Croix et navigation intérieur/extérieur.

État : **GREEN TECHNIQUE / PREVALIDATION — attente du verdict smartphone. GREEN FINAL interdit avant validation utilisateur.**


## R2 — Correction d'architecture avant validation smartphone

Audit complémentaire du 2026-10-10 : le Collision World conservait
un cas spécial `object.kind === 'building'` malgré le nouveau résolveur générique.

- RED architectural : `da67d2fdb799109417e641af18129b28f203a998`
  / CI `38052251914` FAILURE ciblée.
- Fix générique : `9e7a68fa1a93614f42e47ec67615edaa8e1f31ec`
  + suppression du cas spécial `30d0d331120d788bb9c909866d34005cf7928f8f`.
- CI : `38052319049` SUCCESS — 429 tests.
- RED chaîne de cache R2 : `bf5b86abd06b2a81681334f1e2ef9de21bc83d78`
  / CI `38052396832` FAILURE attendue.
- Chaîne publique R2 : `bc196e6e794ec7592d295c4e28f3a94029f2face`.
- Trois sentinelles de révision exacte réalignées :
  `1e9c56b3f978cd66fb9043a2d82260dd5176b2f6`.
- CI R2 : `38052495858` SUCCESS — 430 tests + npm run check.
- `WorldObject.collision` explicite prévaut ; à défaut, le `footprint`
  historique de l'ObjectDefinition reste consommé par le résolveur générique.
- Le Collision World n'a désormais plus de branche bâtiment.
- Aucun pixel, renderer ni `WorldArea.obstacles[]` secondaire.
- Bridge, Portal, Import, Living et silhouettes restent protégés par tests.
- Révision navigateur R2 : `collision-boundary-worldobject-obstacles-v1-r2`.

Statut : **GREEN TECHNIQUE R2 ; nouvelle publication et gate smartphone requis.
GREEN FINAL interdit avant confirmation utilisateur.**


## Publication R2 — gate smartphone

- SHA checkpoint/preview R2 : `1a69029adb43e043f0f9fee06039ce09e173da73`.
- CI work docs R2 : `38052582560` — **SUCCESS**.
- Checkpoint :
  `checkpoint/exploration-collision-boundary-worldobject-obstacles-v1-prevalidation-r2-green-2026-10-10`.
- CI checkpoint : `38052600633` — **SUCCESS**.
- Preview :
  `preview/exploration-collision-boundary-worldobject-obstacles-v1-r2-2026-10-10`.
- Publication infrastructure **seule** : PR #108 (merge squash main
  `96dc06430e06e14ef182184e9c7e4f69c4637b01`).
- Pages R2 : `38052658975` — **SUCCESS**.
- Aucun gameplay Collision/Builder du lot n'a été mergé sur `main`.
- Vérification filiation : `11d1c4f` est ancêtre du checkpoint R2 ;
  comparaison GREEN -> R2 : 58 commits ahead, 0 behind.
- Lien de gate :
  `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=collision-boundary-worldobject-obstacles-v1-r2`.

Verdict : **GREEN TECHNIQUE / PREVALIDATION R2**.
Attente de validation smartphone utilisateur ; **pas de GREEN FINAL** avant verdict.
Les textures restent hors du présent lot.

## Correctif de gate — Peinture familles / fluidité Builder, 2026-10-13

Retour utilisateur : choisir Sable laisse souvent Herbe et l'éditeur mobile ralentit très fortement même avec peu d'objets. Priorité à la résolution avant d'ajouter textures ou mécanique.

- Lot séparé : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`
- Checkpoint start : `checkpoint/exploration-start-builder-terrain-texture-perf-gatefix-2026-10-13` au SHA `edfadb539fb53aacbf57dd91e79fe9a4efe374c1`.
- RED : `bd7b662a0689199566c0aa0dc01d7e22861441ca`, run `38472482630` FAILURE attendue.
- Cause 1 : la famille sémantique et le matériau visuel sont indépendants (bon ownership), mais le Builder ne liait pas leurs sélecteurs ; le matériau Herbe restait actif.
- Fix : catalogue visuel `terrain-family-materials.js` avec matériaux natifs classés par 8 familles, 2 surfaces de démonstration Mer et Route, filtrage de la liste par famille, défaut de texture associé au changement de famille. `WorldDocument` conserve les ids séparés sans seconde autorité gameplay.
- Import texture sol : champ famille explicite, records existants sans famille restent compatibles (Plaine par défaut dans la bibliothèque ; aucune réécriture silencieuse de leurs fichiers).
- Cause 2 : même une faible quantité de traits entraînait la copie du document à chaque échantillon tactile et la création de deux masques de la dimension du viewport en unités monde. Les masques sont maintenant paresseux, bornés aux traits visibles et réutilisent les tampons ; les points tactiles sont coalescés par frame.
- Préservation R2 : mouvements/collisions WorldObject, Bridge et Building inchangés. Aucun changement dans Zombicide-40k ou labo Combat.
- GREEN technique code : `f1e7da11a65921b3b0ad1c5f47f623147c983ab0`, CI `38473354843` SUCCESS, **435/435 tests** et `npm run check` SUCCESS.
- Recalage des sentinelles : uniquement la révision navigateur des entrypoints ; versions des autorités Collision et WorldObject continuent de pointer vers R2.
- **Pas de validation mobile ni mesure réelle FPS à ce stade.** La performance effective du Pixel et la lecture des textures devront être contrôlées par l'utilisateur.
- Prochaine étape : checkpoint technique + preview Pages ; verdict mobile puis GREEN FINAL. Le gate Collision R2 reste ouvert et sera couvert par ses propres contrôles.

## Publication du correctif de gate Builder — 2026-10-13

- Prévalidation SHA : `76ee8373c6e4a312b8bab1bcc5326c244d437b75`.
- CI sur work : `38473569718` SUCCESS ; checkpoint CI `38473624249` SUCCESS.
- Checkpoint technique : `checkpoint/exploration-builder-terrain-texture-perf-gatefix-prevalidation-green-2026-10-13`.
- Branche preview : `preview/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`.
- Publication Pages par PR infra **#110** (seul `.github/workflows/pages-preview.yml` modifié).
- Merge infra-only `main` : `9ad28978d5b98236126fd27a5e5bd8919d583d84`.
- Pages run `38473845161` : **SUCCESS**.
- Lien officiel de test : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-family-perf-gatefix-v1`.
- Aucun code Builder / SurfaceRenderer / Material Registry du lot n'a été mergé dans `main`.
- **Toujours PREVALIDATION : verdict smartphone Sable / imports / performance requis.**
- **Collision R2 toujours non validé manuellement**, GREEN FINAL interdit pour ce lot également.


## Prévalidation R2 — classement des familles de peinture entièrement éditable (2026-10-14)

Retour créateur après test Pixel en paysage : **grosse amélioration de fluidité validée** ; trois défauts visuels/UX restaient bloquants : herbe cartoon retirée de Forêt, familles Route/Mer proposées sous Sol, Plaine manquante dans les choix visibles. L'ancienne table de correspondance native fixée dans le code était incompatible avec la gouvernance GenSrpG : tout doit rester éditable.

- Même branche de gatefix, sans nouveau moteur graphique et sans toucher aux collisions ni à Combat : `work/exploration-builder-terrain-texture-perf-gatefix-2026-10-13`.
- RED ciblé `4ce3685`, run `38479770652` FAILURE attendue.
- Matériaux natifs déclarent une **famille visuelle indicative** dans Material Pack (Forêt propose d'abord Herbe cartoon, puis Sol de forêt ; Plaine propose Terre ; Sable garde Sable).
- Le classement `surfaceMaterialIds[]` est **éditable dans la famille du WorldDocument** ; c'est une liste de présentation du Builder, jamais une règle gameplay ou un alias de collision. Les imports réutilisent l'autorité User Material Library et rejoignent explicitement cette liste si elle a été personnalisée.
- Les familles ont un rôle d'outil `paintKind` éditable, valeurs Sol/Route/Rivière ; le pinceau Sol ne propose plus Route ni Mer, mais propose Plaine. Compatibilité d'anciens documents et zones existantes conservée.
- La table fixe `NATIVE_SURFACE_FAMILIES` a été supprimée : plus de routage par identifiants de matériau dans la logique UI. Les presets restent **des données initiales configurables**, pas des règles moteur immuables.
- Le moteur des rencontres, WorldSurface, Collisions et le rendu haute qualité du jeu ne sont pas modifiés. La performance mobile déjà confirmée est préservée.
- Commits fonctionnels `659c345a`, `d2550a8e`, cache `91d786e5`, sentinelles `f4940ade`, CI `38480643515` SUCCESS, **438/438 tests** et `npm run check` SUCCESS au SHA `1623614534bddf2729f6222bdf0f5cb259ccfc95`.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BUILDER_TERRAIN_FAMILY_PALETTE_EDITABLE_R2_PREVALIDATION_2026-10-14.md`.
- Prochaine action : checkpoint prévalidation R2 + publication Pages **infra-only** ; test smartphone des palettes puis GREEN FINAL. Collision R2 reste à valider indépendamment.


## Publication R2 — familles et peinture éditables (2026-10-14)

- SHA checkpoint technique : `d03675a391dabda6bb13567fc11cd5305d9ed4c7`.
- CI checkpoint : `38480850396` SUCCESS, 438/438 tests et npm run check.
- Ref checkpoint : `checkpoint/exploration-builder-terrain-family-palette-editable-v2-prevalidation-green-2026-10-14`.
- Ref preview : `preview/exploration-builder-terrain-family-palette-editable-v2-2026-10-14`.
- PR infra-only : **#111**, merge `main` `8a46beac33230f3b616fcb4f0a206fe6745aed46` ; un seul fichier modifié : `.github/workflows/pages-preview.yml`.
- Pages `38480939249` **SUCCESS**.
- URL officielle de gate : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=terrain-family-palette-editable-v2`.
- Aucun code de gameplay ni Builder n'a été mergé sur `main` ; R2 **PREVALIDATION uniquement**.
- Validation utilisateur déjà recueillie : forte amélioration de fluidité R1. **Nouvelle validation du classement R2 et gate Collision R2 encore nécessaires**, GREEN FINAL interdit.


## Activation du test avec carte vierge / export — 2026-10-14

Retour créateur : la fluidité est nettement meilleure, souhait de démarrer les tests R2 sur une **carte vierge** et d'exporter son monde pour le reprendre.

- Branche dédiée : `work/exploration-builder-blank-world-export-2026-10-14`.
- Départ / prévalidation héritée : `f7a7e72ffcedfc48f1de862becf52eb13a838cf0`, checkpoint start `checkpoint/exploration-start-builder-blank-world-export-2026-10-14`.
- RED `1ab0b132` : exigences vierge jouable / export import / UX mobile.
- Code `5243527a` : fabrique World Builder Draft canonique (une Area + spawn, aucun objet/tracé/portail/événement/rencontre), commande Nouvelle carte avec confirmation, export WorldDocument visible en en-tête et dans JSON, contrôles d'état/UI remis à zéro ; données et familles toujours éditables.
- Navigation de test/reprise et chaînes de cache réalignées sans toucher aux autorités Collision et WorldDocument.
- CI `38515546118` **SUCCESS — 441/441 tests + npm run check**.
- Export = fichier `.world.json` réimportable ; images importées par l'utilisateur toujours locales, non empaquetées dans JSON.
- Checkpoint de lot : `docs/checkpoints/EXPLORATION_BUILDER_BLANK_WORLD_EXPORT_PREVALIDATION_2026-10-14.md`.
- État **GREEN TECHNIQUE / PREVALIDATION** : publication Pages + verdict smartphone requis avant GREEN FINAL. Le gate Collision R2 reste indépendant.


## Publication Builder « carte vierge / export » — 2026-10-14

- Checkpoint de prévalidation : `checkpoint/exploration-builder-blank-world-export-prevalidation-green-2026-10-14` au SHA `1edfdf017acd06a7a9d933f4381485f12e06afe2`.
- CI du work `38515703439` SUCCESS (441/441, npm run check) ; CI du checkpoint SUCCESS.
- Preview : `preview/exploration-builder-blank-world-export-v1-2026-10-14` au même SHA.
- PR infrastructure seule #112 mergée dans `main`, SHA `b89d8fae6e3d4fe08ad9dc792c7a951889a1084f`.
- Workflow Pages `38515826673` SUCCESS.
- URL de test : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-blank-world-export-v1`.
- Aucun Builder/moteur WorldDocument mergé dans `main`.
- Reste en **prévalidation** en attente du verdict smartphone pour carte vierge, export/import, R2 palettes et Collision R2 (ce dernier séparé). Aucun GREEN FINAL anticipé.

## Correction bloquante : pinceau carte vierge et accès aux textures — 2026-10-14

- Retour créateur : après création de carte vierge, pinceau inutilisable et réglages de textures peu clairs ; le chantier caméra distinct est suspendu pour traiter ce blocage.
- Branche `work/exploration-builder-paint-workflow-fix-2026-10-14` ; checkpoint start `checkpoint/exploration-start-builder-paint-workflow-fix-2026-10-14` à `4918a98f`.
- Cause exacte : `refreshTerrainControls` utilisait la constante `paintableTerrainFamilies` avant sa déclaration JavaScript (TDZ), interrompant les commandes de peinture.
- Fix : ordre d'initialisation corrigé ; accès direct Type/Famille/Texture/Pinceau ; réglages complexes repliables sans perdre l'éditabilité ; pinceau tactile sans passage obligatoire plein écran ; touche simple et tracés successifs autorisés.
- TDD RED `1588834ba`, fix `834b8f8c`, CI validée `38543603277` au SHA `81e1f737522f07dcd7006cea8259bd48bec8f321` avec npm test et npm run check SUCCESS.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BUILDER_PAINT_WORKFLOW_FIX_PREVALIDATION_2026-10-14.md`.
- Prévalidation technique uniquement : la publication Pages puis le verdict utilisateur sur Pixel paysage (Forêt/Herbe, Sable, Route, Mer, point et tracé, undo, export/import) sont obligatoires avant GREEN FINAL.
- Aucun changement de collision, de rendu gameplay, de Combat, ni fusion du Builder sur main.

## Publication du correctif pinceau — 2026-10-14

- CI work GREEN technique `38544153721` SUCCESS ; CI checkpoint `38544200368` SUCCESS.
- Checkpoint et branche de prévisualisation au SHA `50c73f10e934430d47792d6416a1c57e81ab26c4` :
  `checkpoint/exploration-builder-paint-workflow-fix-prevalidation-green-2026-10-14` et
  `preview/exploration-builder-paint-workflow-fix-v1-2026-10-14`.
- PR d'infrastructure seule #113 (un fichier `.github/workflows/pages-preview.yml`) mergée dans main `3f0e5f0ac38174c1bb6eb28b7050d50beeb23f2b`.
- Pages run `38544307188` **SUCCESS**.
- Test mobile : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-paint-workflow-fix-v1`.
- Le Builder modifié n'a pas été mergé dans main. Gate utilisateur carte vierge/peinture/sauvegarde et non-régression fluidité en attente ; GREEN FINAL interdit avant validation.

## Prévalidation — Objets par touches directes et fluidité plein écran (2026-10-14)

- Retour utilisateur : la peinture au sol marche plutôt bien mais poser/déplacer des objets sur téléphone est trop difficile ; poignées de taille/rotation activées accidentellement ; latences importantes en plein écran. Priorité donnée à l’ergonomie et à la performance.
- Branche de lot : `work/exploration-builder-object-stamp-mobile-perf-2026-10-14` ; checkpoint départ `checkpoint/exploration-start-builder-object-stamp-mobile-perf-2026-10-14` basé sur `1539ef847093377003b417d7e1fe9ccf7ba99f1b`.
- Nouveau bouton Placer objet, sélecteur d’objet disponible en plein écran, touche répétée = nouvel exemplaire placé à la position du doigt. Un zoom/pinch annule le tap. Déplacer = sélection + glisser. Poignées taille/rotation désactivées sauf case explicite. Champs numériques conservés.
- Corrections de coût mobile : DPR fixe <= 1 pour prévisualisation plein écran tactile ; mouvements WorldObject coalescés par animation frame, commit final au relâchement ; préserve `WorldDocument` et rendu jeu.
- RED `7ff3994e`, code et sentinelles SHA `ef26323ea23058ed76eb0d9bb2d83a1f06519afd` ; CI `38584062418` SUCCESS : 448 tests, npm run check SUCCESS.
- Checkpoint documentaire : `docs/checkpoints/EXPLORATION_BUILDER_OBJECT_STAMP_MOBILE_PERF_PREVALIDATION_2026-10-14.md`.
- Prochaine étape : checkpoint/preview et publication Pages infra-only ; validation manuelle smartphone incontournable avant GREEN FINAL. Les performances FPS réelles restent non mesurées.
- Chantier caméra de jeu configurable **conservé et suspendu** sur `work/exploration-configurable-game-camera-2026-10-14`, jamais intégré dans le lot objets ; reprise après résolution complète des difficultés de carte. Collision R2 toujours gate séparé.

## Publication — placement d’objets et fluidité tactile (2026-10-14)

- Prévalidation ref `preview/exploration-builder-object-stamp-mobile-perf-v1-2026-10-14` et checkpoint `checkpoint/exploration-builder-object-stamp-mobile-perf-prevalidation-green-2026-10-14`, SHA `e45a0f77d07d1046206121137ed1f9eb5f7b4d03`.
- CI checkpoint `38584415404` SUCCESS — **448/448** tests ; `npm run check` SUCCESS.
- PR infra-only **#114**, un fichier `.github/workflows/pages-preview.yml`, merge `main` `7bd909aaf11dca3a7675dd13ae27e1b0e97b9a18`.
- GitHub Pages `38584554184` **SUCCESS**.
- Lien de test manuel : `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/builder.html?rev=builder-object-stamp-mobile-perf-v1`.
- Aucun code Builder / runtime / gameplay mergé dans main. Le nouveau placement répété des objets, le déplacement tactile verrouillé et la stabilisation du DPR restent en **prévalidation** jusqu’au verdict réel smartphone ; aucun FPS mesuré ni GREEN FINAL.
- Caméra configurable : lot précédent **suspendu et conservé**, ref `work/exploration-configurable-game-camera-2026-10-14`. Reprendre uniquement après résolution du gate mobile.
