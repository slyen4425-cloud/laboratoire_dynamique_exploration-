# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-02

## Chantier actif
Surface Traversal Rules v1 — règles de déplacement par surface pour héros, PNJ et monstres.

## Branche
`work/exploration-surface-traversal-rules-v1-2026-10-02`

## Checkpoint de départ
`checkpoint/exploration-start-surface-traversal-rules-v1-2026-10-02`

## SHA de base GREEN
`4e6f6c77ff231c00e5868ca8cf572137b1835922`

## Dernier checkpoint GREEN
`checkpoint/exploration-worldarea-portal-v1-green-2026-10-02`

## Plan validé mis à jour
1. Surface Traversal Rules v1 ;
2. Map Actor Visual System v1 ;
3. World Builder Dynamique UI v1.

Le nouveau lot est inséré avant Map Actor afin que héros, PNJ et monstres partagent déjà le même contrat de locomotion au moment où leurs visuels map seront ajoutés.

## Objectif
Permettre des règles configurables de déplacement selon la géométrie de surface, sans donner d'autorité gameplay aux matériaux visuels.

Cas v1 :
- sol normal : vitesse normale ;
- route : bonus de vitesse configurable ;
- eau : interdite aux acteurs uniquement terrestres ;
- eau : traversable avec profil nage ;
- eau : traversable avec profil vol ;
- pont : surface traversable au-dessus de l'eau via son corridor GREEN.

## Autorités
- géométrie routes/rivières : World Surface Model ;
- identifiant de règle de traversée : World Surface Model ;
- valeurs de règles : Traversal Rule Registry ;
- modes de locomotion de l'acteur : Actor/Exploration gameplay data ;
- décision passable + multiplicateur : Surface Traversal Resolver ;
- mouvement final : Exploration Core ;
- collision statique : Collision World ;
- visuel : Material Registry / Renderer uniquement.

## Règle absolue
`materialId` reste purement visuel.

Interdit :
`materialId -> vitesse/collision`

Obligatoire :
`surface geometry -> traversalRuleId -> Traversal Rule Registry -> locomotion actor -> movement/collision`

## Périmètre
- Surface Model schema v2 ;
- `baseTraversalRuleId` ;
- `traversalRuleId` sur routes/rivières ;
- registry de règles configurable ;
- modes `ground`, `swim`, `fly` ;
- resolver géométrique pur ;
- bonus route ;
- eau bloquante pour ground ;
- nage/vol sur eau ;
- pont qui remplace localement la règle eau ;
- migration Bridge v1 vers référence de feature surface ;
- compatibilité de lecture de l'ancien `overridesObstacleIds` si nécessaire, sans conserver deux autorités normalisées ;
- suppression du faux obstacle rectangulaire de rivière dans la démo ;
- tests du vrai chemin ;
- preview mobile.

## Hors périmètre
- Map Actor visual ;
- IA de déplacement PNJ/monstres ;
- pathfinding ;
- endurance/coût stamina ;
- animation nage/vol ;
- Builder UI ;
- réglage utilisateur UI des valeurs ;
- sauvegarde ;
- autre dépôt.

## Valeurs v1 de démonstration
Les valeurs viennent du Traversal Rule Pack, pas du moteur :
- terrain normal / ground : x1.00 ;
- route / ground : x1.25 ;
- eau / swim : x0.75 ;
- eau / fly : x1.00 ;
- pont / ground : x1.00.

Elles restent configurables et ne sont pas des constantes de gameplay dispersées.

## Critère de sortie
Sur smartphone :
- le héros terrestre accélère clairement sur la route ;
- le héros terrestre ne traverse pas l'eau hors pont ;
- le pont reste fluide ;
- un profil de test nage peut traverser l'eau avec son multiplicateur ;
- un profil de test vol peut traverser l'eau ;
- aucun matériau visuel ne possède la règle gameplay.

Le lot reste non GREEN jusqu'à validation utilisateur si le comportement est exposé en preview.


## État technique — Surface Traversal Rules v1

Implémenté :
- Surface schema v2 avec `baseTraversalRuleId` ;
- `traversalRuleId` sur routes et rivières ;
- Traversal Rule Registry injectable ;
- modes de locomotion partagés `ground / swim / fly` ;
- resolver géométrique pur ;
- route ground = x1.25 via data pack ;
- eau ground = bloquée ;
- eau swim = x0.75 ;
- eau fly = x1.00 ;
- pont = `terrain.bridge` et override local d'une feature surface explicitement référencée ;
- migration de lecture de l'ancien champ Bridge `overridesObstacleIds` vers `overridesSurfaceFeatureIds`, sans conserver l'ancien champ dans l'objet normalisé ;
- suppression du faux obstacle rectangulaire `forest-stream-collision` dans la démo ;
- Collision World consulte le resolver de traversée ;
- Movement Core applique le multiplicateur retourné par le resolver ;
- géométrie commune factorisée dans `core/geometry.js` ;
- contrôle mobile de démonstration Marche / Nage / Vol ;
- HUD affiche la règle active et le multiplicateur.

Tests :
- séparation `materialId` / `traversalRuleId` ;
- registry configurable ;
- profil locomotion partagé ;
- bonus route ;
- eau bloquée ground ;
- eau traversable swim/fly ;
- bridge override local ;
- vrai mouvement avec multiplicateur ;
- migration Bridge sans double champ ;
- sentinelles Material/Renderer/Movement/river authority.

CI technique avant preview :
- run `37051046607` — **SUCCESS**.

Gate restante :
publication preview + test smartphone.


## Garde de coordination — branche isolée, non publiable

Contrôle de la source de vérité GitHub effectué après implémentation technique :

- Map Actor Visual System v1 est déjà GREEN :
  `checkpoint/exploration-map-actor-visual-v1-green-2026-10-02`
  SHA `745b13bd550893b5ae21c351fa1f511acb2bdc16`.
- le chantier actif le plus avancé est :
  `work/exploration-world-builder-dynamique-ui-v1-2026-10-02`.
- sa preview courante contient déjà la collision rivière canonique issue de `surface.rivers[]` et attend encore validation smartphone.
- ce chantier Surface Traversal a été ouvert depuis le checkpoint WorldArea/Portal antérieur et **ne doit donc pas être publié, mergé ou devenir nouveau point de reprise** tant que la lignée World Builder n'a pas obtenu son prochain checkpoint GREEN.

Cette branche sert uniquement de validation technique isolée du contrat Surface Traversal.
Après validation du chantier World Builder courant :
1. créer son checkpoint GREEN exact ;
2. ouvrir un nouveau lot Surface Traversal depuis ce SHA ;
3. reporter les changements utiles sans écraser Map Actor ni World Builder ;
4. relancer toutes les sentinelles ;
5. publier seulement cette nouvelle lignée.

Aucun runtime de preview n'est redirigé vers cette branche.
