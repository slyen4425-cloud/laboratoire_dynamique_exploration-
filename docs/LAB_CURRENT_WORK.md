# LAB_CURRENT_WORK — Point de reprise unique

> ÉTAT ACTIF — 2026-10-08
>
> Chantier : **Collision Boundary & WorldObject Obstacles v1**
>
> Branche : `work/exploration-collision-boundary-worldobject-obstacles-v1-2026-10-10`
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
