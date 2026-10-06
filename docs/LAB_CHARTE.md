# GenSrpG Exploration — Charte permanente

Cette charte applique au laboratoire Exploration les règles de gouvernance du projet principal GenSrpG.

Source de référence relue le 2026-10-01 :
- `docs/GENSRPG_CHARTE.md`
- `docs/GENSRPG_DEVELOPMENT_RULES.md`
- `docs/GENSRPG_CHECKPOINT_POLICY.md`
- `docs/GENSRPG_COORDINATION.md`
- `docs/GENSRPG_TECHNICAL_GUARDRAILS.md`

Branche GenSrpG de référence lors de l'alignement :
`work/gensrpg-phase8-tactical-consolidation-preaudit-2026-10-01`.

SHA exact relu :
`9fd5a789180e26204833e9d6b330079352272ec6`.

Si la charte principale évolue, le laboratoire doit être réconcilié avant le prochain lot fonctionnel.

## 1. Position dans GenSrpG

Exploration n'est pas un nouveau module principal.

Le moteur développé ici est destiné à devenir un sous-système de **Monster Capture**. Il doit donc pouvoir s'intégrer sans prendre l'autorité sur :
- Shell/navigation ;
- Core stats ;
- Core storage ;
- resolver d'assets ;
- combat Capture ;
- Survie ;
- Dungeon ;
- Tactical ;
- PvP.

## 2. Un système validé ne doit pas être recréé

Avant d'ajouter une fonction, vérifier si GenSrpG ou le laboratoire possède déjà le service correspondant.

Pour l'intégration future :
- stats -> Core stats ;
- stockage -> Core storage ;
- assets -> resolver central ;
- navigation -> Shell ;
- combat Capture -> moteur Capture public ;
- exploration -> moteur Exploration propriétaire de son monde.

Le laboratoire peut simuler un service absent pour un prototype, mais ce simulateur doit être isolé derrière un adapter et ne jamais devenir une seconde autorité lors de l'intégration.

## 3. Une responsabilité critique = un propriétaire unique

Propriétaires du laboratoire :
- position exploration : Exploration Core ;
- mouvement : Exploration Core ;
- collisions : Collision World ;
- état du monde : World Model ;
- géométrie de surface : World Surface Model ;
- matériaux visuels : Material Registry ;
- résolution des fichiers visuels : Asset Adapter ;
- génération : World Generator ;
- caméra : Camera ;
- rendu : Exploration Renderer ;
- input tactile/clavier : Input Adapter ;
- déclenchement d'une rencontre : Exploration Encounter Controller ;
- données éditées : Builder/Data layer ;
- passage au combat : Encounter Bridge contractuel.

Si deux composants pensent posséder la même responsabilité, le développement s'arrête jusqu'à clarification.

## 4. Une source de vérité unique

La position monde est `x/y` flottante et appartient à l'état Exploration.

Une grille peut exister pour générer, indexer ou partitionner le monde, mais elle ne devient jamais une deuxième position autoritaire du joueur.

Même règle pour :
- collisions ;
- seed ;
- configuration ;
- entités ;
- zones ;
- spawns ;
- état de rencontre ;
- géométrie de surface ;
- identifiants de matériaux.

L'UI affiche ; elle ne possède pas le gameplay.

## 5. Pas de pollution globale

Interdits par défaut :
- `MutationObserver` sur `body/html` ;
- heartbeat global ;
- `setInterval` permanent pour réparer l'état ;
- retries longs pour reprendre une autorité ;
- monkey-patch global ;
- scan DOM d'un autre module ;
- listener capture général qui bloque la propagation ;
- `location.reload()` comme navigation ;
- auto-install caché d'un module complexe.

Tout comportement temporaire fournit un cycle explicite `install()/dispose()` ou équivalent.

## 6. Contrats explicites

Le raccord futur doit suivre un contrat comparable à :

```text
Capture Exploration -> startCaptureCombat(CaptureEncounterSnapshot v1)
Capture Combat      -> CaptureCombatResult v1
Capture Exploration -> applyCaptureCombatResult(result)
```

Exploration prépare le contexte de rencontre.
Combat ne relit pas arbitrairement l'état interne du monde.
Exploration applique ensuite le résultat.

## 7. Les éditeurs produisent des données

Flux obligatoire :

```text
Builder/éditeur -> données validées -> sauvegarde -> runtime Exploration
```

Interdit :

```text
Builder -> modification directe du runtime actif
```

Le Builder manuel et le World Generator doivent produire le **même type de WorldDocument**. Une carte générée doit pouvoir être ouverte et modifiée dans le Builder sans conversion parallèle.

## 8. Géométrie, matériaux, décor et gameplay sont séparés

Règle permanente :

```text
WorldDocument
  -> géométrie du monde
  -> materialId
  -> Material Registry
  -> Asset Adapter
  -> Renderer
```

La géométrie décrit **où** sont les choses.
Le matériau décrit **à quoi elles ressemblent**.
Les decals décrivent des détails purement visuels.
Les objets décrivent des éléments placés dans le monde.
Le gameplay/collision reste une autorité séparée.

### 8.1 Géométrie

Exemples :
- route = points X/Y + largeur ;
- rivière = points X/Y + largeur ;
- zone de sol = surface/limites ;
- pont = objet placé avec ancrage sur la géométrie.

Une texture ne doit jamais définir la forme canonique d'une route, d'une rivière ou d'une zone.

### 8.2 Material Registry

Le WorldDocument stocke des identifiants sémantiques, par exemple :
- `grass.forest`
- `road.dirt`
- `water.forest_stream`
- `ground.snow`
- `road.stone`

Le Material Registry transforme ces identifiants en description visuelle versionnée.

Changer `road.dirt` en `road.stone` ne modifie pas la trajectoire ni la largeur de la route.

### 8.3 Composition d'un matériau

Un matériau peut déclarer, selon son type :
- texture principale ;
- variantes ;
- texture de bord ;
- masque de transition ;
- decals ;
- densité de détails ;
- teinte/contraste ;
- paramètres d'animation visuelle ;
- paramètres de répétition/échelle ;
- fallback procédural explicite.

Aucun de ces paramètres ne devient une règle de collision.

### 8.4 Decals

Les decals sont des détails visuels sans autorité gameplay :
- feuilles ;
- racines ;
- fleurs ;
- boue ;
- petites pierres ;
- fissures ;
- traces.

Ils sont placés de façon déterministe à partir du monde/seed quand ils sont générés.

Un decal qui doit bloquer ou interagir devient un **objet** du World Model, pas un simple decal.

### 8.5 Objets

Exemples :
- arbre ;
- gros rocher ;
- pont ;
- maison ;
- clôture ;
- coffre.

Ils sont distincts des matériaux de surface et peuvent avoir :
- visuel ;
- collision ;
- interaction ;
- état persistant.

### 8.6 Transitions

Les transitions entre matériaux sont une responsabilité du renderer/material system, à partir de la géométrie et des materialId.

Exemples :
- herbe -> terre ;
- herbe -> sable ;
- route -> herbe ;
- eau -> berge ;
- neige -> roche.

Les transitions ne doivent jamais être codées en plaçant manuellement des carrés obligatoires dans le WorldDocument.

### 8.7 Règles de traversée de surface

Les effets gameplay du terrain sont séparés des matériaux visuels.

Le World Surface Model peut déclarer un identifiant sémantique `traversalRuleId` distinct de `materialId`.

Flux obligatoire :

```text
géométrie surface
  -> traversalRuleId
  -> Traversal Rule Registry
  -> modes de locomotion de l'acteur
  -> passabilité + multiplicateur de vitesse
```

Interdits :
- déduire la vitesse depuis `materialId` ;
- déduire la nage depuis une texture d'eau ;
- coder les multiplicateurs directement dans le renderer ;
- créer une logique différente pour héros, PNJ et monstres.

Héros, PNJ et monstres utilisent le même resolver. Seules leurs données de locomotion diffèrent.

Modes v1 :
- `ground` ;
- `swim` ;
- `fly`.

Un pont peut remplacer localement la règle de traversée d'une feature de surface explicitement référencée. Il ne désactive jamais globalement l'eau.

### 8.8 Collision des surfaces canoniques

Lorsqu'une surface canonique possède une sémantique gameplay bloquante, le Collision World lit directement sa géométrie canonique.

Pour les rivières v1 :
- `WorldArea.surface.rivers[].points + width` est l'unique géométrie de rivière ;
- le Collision World utilise cette géométrie pour le blocage ;
- il est interdit de créer un second rectangle/polygone de collision décrivant la même rivière ;
- le Builder ne génère donc aucun obstacle secondaire lorsqu'il dessine de l'eau ;
- un Bridge peut explicitement autoriser la traversée d'une rivière par son id canonique et uniquement dans son corridor GREEN.

Le renderer ne possède jamais cette règle et aucune texture ne définit la collision.

## 9. World Builder Dynamique

Le **World Builder Dynamique** doit permettre progressivement de modifier :
- taille de carte ;
- biome ;
- matériau de sol ;
- forme/largeur/matériau des routes ;
- forme/largeur/matériau des rivières ;
- ponts ;
- objets ;
- densité de decals/décor ;
- zones de spawn ;
- points d'intérêt ;
- interactions ;
- transitions de cartes ;
- paramètres de génération autorisés.

Le World Builder Dynamique manipule des données. Le renderer donne un aperçu, mais ne devient jamais l'autorité.

### 9.2 Autorité canonique du World Builder Dynamique

Dans le World Builder Dynamique, l'unique état persistant de carte est le **draft au format WorldDocument**.

Les états UI suivants sont autorisés uniquement comme état éphémère :
- sélection courante ;
- outil actif ;
- zoom/centre de viewport ;
- pointeurs tactiles ;
- offset temporaire d'un drag/pinch.

Ils ne sont jamais sérialisés et ne deviennent jamais une seconde géométrie ou une seconde position d'objet.

Règles obligatoires :
- un geste direct sur la map modifie le draft via les fonctions de mutation du Builder ;
- les champs numériques modifient le même draft via les mêmes contrats ;
- la preview rend uniquement le WorldDocument normalisé dérivé du draft ;
- aucune copie persistante des transforms, Spawns, Portals, routes, rivières ou dimensions d'Area n'est maintenue dans l'UI ;
- aucun format `BuilderMap`, `PreviewWorld` ou géométrie Builder parallèle n'est autorisé.

Ainsi, doigt/souris, champs précis, import/export et runtime convergent tous vers une seule source de vérité : le WorldDocument.

### 9.1 Paramétrage des WorldObjects

Tout WorldObject éditable doit exposer ses paramètres dans son contrat de données, jamais uniquement dans l'UI.

Paramètres génériques :
- position X/Y ;
- rotation ;
- scale X/Y ;
- assetId ;
- activation/visibilité si pertinente ;
- footprint/collision logique ;
- interaction ;
- liens vers autres contrats, par exemple Portal.

Le World Builder Dynamique ne possède pas ces valeurs : il les édite dans le WorldDocument.

### 9.2 Manipulation directe et pinceau terrain

Les poignées de déplacement, rotation, scale et taille d'Area sont uniquement des contrôles d'édition :
- elles ne conservent aucune géométrie parallèle ;
- elles écrivent via les helpers du Draft dans les données canoniques ;
- le preview renderer reste en lecture seule.

Le pinceau paysage écrit dans `WorldArea.surface.zones[]`.
Une zone peinte déclare matériel de surface, largeur et points X/Y.
Elle est visuelle uniquement : aucune collision ou règle gameplay ne peut être déduite du trait peint.

La taille du pinceau est une donnée d'édition utilisée pour produire la largeur canonique de la zone, jamais un état runtime concurrent.

## 10. Génération automatique et Builder partagent le même modèle

Flux cible :

```text
World Generator ─┐
                 ├─> WorldDocument -> Exploration runtime
Builder manuel ──┘
```

Le générateur peut créer une carte complète ou partielle.
Le joueur/créateur peut ensuite la modifier dans le Builder.

Aucun système parallèle `GeneratedMap` vs `BuilderMap` n'est autorisé.

## 11. Packs de matériaux extensibles

Les matériaux doivent être regroupables en packs versionnés.

Exemples futurs :
- Forest Pack ;
- Snow Pack ;
- Desert Pack ;
- Cave Pack ;
- City Pack ;
- Lava Pack.

Un pack peut fournir :
- matériaux de base ;
- matériaux linéaires ;
- transitions ;
- decals ;
- objets visuels compatibles.

Un pack ne prend jamais l'autorité sur la géométrie ou les collisions.

## 12. Assets : ownership et intégration

Dans le laboratoire, les fichiers peuvent être locaux derrière l'Asset Adapter.

Interdits :
- hotlink runtime vers un autre dépôt ;
- chemins `assets/dungeon/` utilisés comme contrat Exploration ;
- fallback silencieux vers les assets d'un autre module ;
- copie sans traçabilité de source.

### 12.1 Intégrité des assets binaires

Tout asset binaire importé dans le dépôt doit être vérifié sur les **octets réellement commités**, pas uniquement sur le fichier source local.

Pour chaque pack binaire versionné :
- taille runtime enregistrée dans le manifeste ;
- SHA-256 runtime enregistré dans le manifeste ;
- CI recalcule taille + SHA-256 sur le fichier présent dans le dépôt ;
- les formats structurés pertinents vérifient aussi leur intégrité minimale (par exemple RIFF/WEBP : taille déclarée = taille réelle) ;
- un binaire tronqué ou incohérent bloque la CI et toute publication ;
- la preview ne doit jamais masquer un asset invalide par une représentation concurrente.

### 12.1.1 Dépôt binaire bloqué : escalade utilisateur immédiate

Si un dépôt simple de fichier binaire (image, son, archive ou autre asset) échoue de façon répétée alors que le fichier local est prêt :

- ne pas passer des heures à contourner le transfert ;
- après **deux tentatives techniques infructueuses au maximum**, arrêter le contournement ;
- expliquer précisément que le blocage concerne uniquement le transfert binaire vers GitHub ;
- fournir au créateur le ou les fichiers prêts à déposer ;
- fournir le **lien GitHub exact** vers le dossier et la branche cible ;
- demander au créateur d'effectuer le dépôt manuel ;
- dès confirmation, reprendre automatiquement la vérification du dépôt, les SHA/bytes, les manifests, la CI, la preview et le checkpoint prévus ;
- ne jamais présenter le lot comme GREEN avant ces validations.

Cette escalade manuelle est préférée à toute chaîne de contournement fragile, lente ou non vérifiable. Elle ne modifie aucune autorité runtime : elle concerne uniquement le transport physique des octets vers le dépôt.

### 12.2 Autorité visuelle unique des WorldObjects

Lorsqu'un WorldObject déclare un `visual.assetId`, cet assetId est **l'unique autorité visuelle** de l'objet.

Interdits :
- dessiner un ancien sprite/prototype si l'asset déclaré est en chargement ;
- substituer silencieusement un autre pont ou objet ;
- conserver un rendu procédural concurrent pour le même WorldObject ;
- démarrer le runtime utilisateur avec un asset WorldObject requis encore indéterminé.

Le bootstrap charge explicitement les assets WorldObject requis avant le démarrage du runtime.
Un asset manquant ou en erreur produit un état d'erreur explicite ; il ne déclenche jamais une deuxième représentation du même objet.

Un WorldObject sans `assetId` peut être volontairement invisible, mais cette absence est une donnée explicite et non un fallback.

À l'intégration GenSrpG :
- les identifiants sémantiques restent stables ;
- l'Asset Adapter local est remplacé par le resolver central ;
- les fichiers peuvent devenir `capture` ou `common` selon l'audit d'ownership.

## 13. Pas de gameplay important codé en dur

Les valeurs de gameplay doivent venir d'une configuration normalisée :
- vitesse ;
- accélération/freinage ;
- taille/collision ;
- densité de spawn ;
- rayon de détection ;
- chances de rencontre ;
- paramètres de biome ;
- règles de génération ;
- rareté ;
- comportement IA configurable.

Les valeurs visuelles éditables d'un matériau doivent venir du Material Registry ou du pack, pas être dispersées dans le renderer.

## 14. Moteur pur, UI explicative

Le cœur de mouvement, collision, génération et règles doit rester testable sans DOM.

Le renderer et les contrôles tactiles sont des adapters/UI.

Aucun calcul métier important ne doit être dupliqué dans l'interface.

## 15. Base connue avant tout changement

Avant chaque chantier :
1. identifier le dernier SHA GREEN ;
2. créer `checkpoint/exploration-start-<chantier>-YYYY-MM-DD` sur ce SHA ;
3. créer la branche `work/exploration-<chantier>-YYYY-MM-DD` depuis exactement ce SHA ;
4. déclarer le périmètre dans `LAB_CURRENT_WORK.md` ;
5. ne jamais développer directement sur `main`.

## 16. Périmètre déclaré avant codage

Chaque lot déclare :
- domaine concerné ;
- propriétaire ;
- systèmes réutilisés ;
- fonctions gelées ;
- fichiers attendus ;
- tests ;
- risques ;
- frontière inter-module ;
- hors périmètre.

Si le travail déborde, on arrête et on ouvre un autre lot.

## 17. Tests du vrai chemin

Un test ne doit pas injecter la réponse attendue à l'endroit même où le raccord doit être vérifié.

Exemples :
- input -> mouvement -> collision -> position ;
- seed/config -> generator -> world model ;
- WorldDocument.materialId -> Material Registry -> rendu ;
- zone -> encounter -> snapshot ;
- sauvegarde -> rechargement -> position/monde identiques.

## 18. Tests sentinelles

Les fonctions déclarées GREEN deviennent protégées.

Sentinelles minimales à construire progressivement :
- mouvement 360° ;
- normalisation diagonale ;
- collisions ;
- limites monde ;
- caméra ;
- stick tactile ;
- seed déterministe ;
- save/reload ;
- absence de double autorité de position ;
- absence de globals interdits ;
- géométrie indépendante des matériaux ;
- materialId résolu sans fallback inter-module ;
- Builder/Generator vers même WorldDocument ;
- contrat rencontre ;
- non-interférence avec les autres modules lors de l'intégration.

## 19. Mobile d'abord

Le smartphone/PWA est la cible prioritaire :
- tactile ;
- DPR élevé ;
- mémoire limitée ;
- coût DOM raisonnable ;
- reprise ;
- cache ;
- longue session.

Pour les matériaux :
- formats compressés adaptés au web, notamment WebP lorsque pertinent ;
- tailles raisonnables ;
- culling ;
- chargement autour de la caméra ;
- pas de mégatexture de carte complète par défaut ;
- pas de duplication inutile des mêmes ressources.

Un test Node GREEN ne remplace pas une validation navigateur/mobile lorsque l'UI ou la performance est concernée.

## 20. Régression : pas de rustine

En cas de régression :
1. revenir au dernier checkpoint sûr ;
2. identifier le premier changement responsable ;
3. reproduire par un test ;
4. retirer/isoler l'autorité fautive ;
5. préférer un correctif soustractif ;
6. conserver le test comme garde permanent.

## 21. Refactor progressif uniquement

Pas de big-bang.

Ordre :
documenter -> protéger par tests -> identifier le propriétaire -> déplacer une responsabilité -> retirer l'ancienne autorité -> comparer -> checkpoint GREEN.

## 22. Diff minimal

Un lot homogène modifie le minimum de fichiers nécessaires.

Un lot qui commence à toucher plusieurs domaines doit être stoppé et recadré.

## 23. Compatibilité et migrations

Toute donnée persistante est versionnée.

Un changement de schéma fournit si nécessaire :
- migration ;
- idempotence ;
- test ancien -> nouveau ;
- test sauvegarde/reprise.

Les Material Packs et WorldDocuments portent une version explicite.

## 24. Publication / preview

Une CI rouge bloque la publication.

Pour un comportement utilisateur :
- preview séparée ;
- lien stable ;
- test ciblé ;
- validation utilisateur ;
- seulement ensuite checkpoint GREEN.

La production GenSrpG n'est jamais modifiée depuis ce dépôt.

## 25. Critère de fin d'un chantier

Un chantier n'est GREEN que si :
- autorité unique ;
- tests unitaires verts ;
- vrai raccord testé ;
- tests de frontière requis verts ;
- documentation à jour ;
- CI verte ;
- preview fonctionnelle si nécessaire ;
- test utilisateur ciblé validé si nécessaire.

## 26. World Objects transformables

Les objets placés dans le monde utilisent un contrat commun versionné.

Un WorldObject transformable expose au minimum :
- `id` ;
- `kind` ;
- position monde `x/y` ;
- rotation explicite ;
- `scaleX/scaleY` ;
- taille logique indépendante des pixels ;
- référence visuelle sémantique optionnelle ;
- données gameplay explicites si nécessaire.

Le Builder doit pouvoir modifier position, rotation et scale sans réécrire l'asset.

La collision ne se déduit jamais du sprite.

### 26.1 Pont

Un pont est un WorldObject, pas une texture de rivière.

Il possède :
- transform ;
- taille logique ;
- visuel ;
- corridor traversable ;
- liste explicite des features de surface qu'il peut franchir.

La rivière continue d'exister sous le pont.
Le pont n'annule jamais globalement un type d'obstacle.

Un pont peut être orienté et scalé.
Le corridor traversable suit le même transform normalisé, avec éventuellement un inset/ratio propre pour conserver des rambardes non traversables.

**Sémantique v1 du corridor** : il décrit la zone valide pour le **centre de l'entité**.
Le Collision World ne retranche pas une seconde fois le rayon de l'entité à ce corridor, afin d'éviter les accroches invisibles sur les bords du pont.
Hors corridor, la feature de surface sous-jacente conserve sa règle de traversée.

Pour éviter les accroches lors d'une entrée diagonale, un bridge peut déclarer un `edgeAssistRatio` normalisé.
Cette marge ne rend pas l'eau traversable : elle sert uniquement au Collision World à faire **glisser** le centre de l'entité jusqu'au bord du corridor lorsque le mouvement visé est très proche du pont.
Aucun état persistant ou aimantation n'est autorisé : le calcul reste pur, frame par frame.
Une petite tolérance numérique est autorisée aux frontières des formes transformées afin d'absorber les erreurs flottantes de rotation, jamais pour agrandir arbitrairement la géométrie.

### 26.2 Contrôles World Builder Dynamique des objets

Le World Builder Dynamique doit pouvoir exposer pour les objets compatibles :
- déplacement X/Y ;
- rotation ;
- scale uniforme si souhaité ;
- scale longueur/largeur séparé ;
- duplication ;
- changement d'assetId ;
- suppression.

Les plages min/max de scale doivent être normalisées/configurables, pas cachées dans l'UI.

## 27. WorldArea, bâtiments et Portals

Le modèle v1 validé pour les intérieurs est :

```text
WorldArea extérieure
       |
   Door / Portal
       |
       v
WorldArea intérieure
```

Un bâtiment extérieur est un WorldObject placé dans une Area.
Son intérieur est une autre WorldArea.

Un Building WorldObject doit pouvoir déclarer au minimum :
- transform X/Y/rotation/scale ;
- baseSize/footprint logique ;
- visual.assetId ;
- un ou plusieurs `doorAnchor` locaux.

Le Building ne stocke **aucun lien Portal autoritaire**.
Le `Portal Model` est l'unique propriétaire de la relation entre une source (par exemple un `building-door`) et une Area cible.

Le World Builder Dynamique doit permettre d'éditer ces propriétés sans déplacer ou redéfinir l'intérieur lui-même.
Lorsqu'une porte est reliée à un Portal, l'éditeur modifie le contrat Portal ; il ne duplique pas ce lien dans le Building.

Une porte/entrée utilise un Portal explicite contenant notamment :
- sourceAreaId ;
- source trigger/anchor ;
- targetAreaId ;
- targetSpawnId ;
- transition visuelle éventuelle.

Même mécanisme pour :
- maison ;
- boutique ;
- centre de soin ;
- grotte ;
- étage ;
- cave ;
- tour ;
- sortie vers une autre zone.

Le changement d'Area ne recharge jamais la page et ne crée pas un nouveau module.

### 27.1 Retour exact

L'état Exploration conserve au minimum :
- `currentAreaId` ;
- position X/Y dans l'Area courante.

Un Portal de retour replace le joueur sur un spawn/anchor explicite associé à la sortie.

Un Spawn possède une seule autorité de position :
- Spawn statique : `x/y` ;
- Spawn ancré : référence explicite vers un anchor, par exemple `building-door`, avec offset éventuel.

Pour un Spawn ancré à une porte de Building :
- aucun X/Y persistant concurrent n'est autorisé ;
- la position monde est résolue à partir du transform courant du Building + doorAnchor ;
- déplacer, tourner ou scaler le Building déplace donc automatiquement le Spawn ;
- le Builder ne synchronise jamais des coordonnées dérivées après coup.

Le Portal conserve une seule cible, `targetSpawnId`. Il ne duplique pas la logique de position du Spawn.

### 27.2 Structures sans intérieur séparé

Les structures ouvertes peuvent rester dans la même Area :
- pont ;
- ruines ouvertes ;
- campement ;
- kiosque ;
- éléments de décor traversables ou semi-ouverts.

On ne crée pas une Area séparée sans besoin réel.

### 27.3 Pas de système intérieur concurrent en v1

Le laboratoire n'ajoute pas en parallèle un second système général de toiture qui révèle un intérieur seamless dans la même Area.

Un tel mode pourrait être étudié plus tard comme capacité spécialisée, mais il ne doit pas concurrencer le contrat WorldArea/Portal tant qu'un besoin concret ne le justifie pas.

## 28.1 Création simple des acteurs de map

Pour les futurs héros, PNJ et créatures visibles en Exploration :
- un seul visuel fourni par le joueur doit suffire pour obtenir un acteur utilisable sur la map ;
- les traitements automatiques (détourage, recadrage, scale, anchor, ombre, miroir, mouvement visuel) produisent uniquement une représentation visuelle ;
- position, collision, vitesse, interaction, IA et statistiques restent dans leurs propriétaires gameplay ;
- vues arrière, directions multiples et spritesheets sont des améliorations facultatives, jamais une exigence de création ;
- aucun traitement visuel ne doit devenir une seconde autorité gameplay.

### 28.2 Séparation éditeur Héros/Créatures et World Builder

Décision produit figée :

Les réglages intrinsèques d'un acteur visible sur la map ne sont **pas** la responsabilité finale du World Builder.

Ils appartiennent à la définition de l'acteur et seront édités dans l'éditeur Héros / PNJ / Créatures concerné :
- visuel source ;
- orientation native du visuel (gauche/droite) ;
- scale/hauteur map ;
- anchor ;
- ombre ;
- miroir automatique ;
- paramètres d'animation visuelle ;
- futures vues multiples/spritesheets éventuelles.

Le World Builder :
- consomme une liste de définitions d'acteurs déjà configurées ;
- permet de sélectionner un héros, PNJ ou monstre ;
- place/référence cette définition dans le monde ;
- édite uniquement les données de placement appartenant au WorldDocument ;
- ne réécrit jamais le profil visuel intrinsèque de l'acteur.

L'interface de calibration Map Actor actuellement présente dans le laboratoire est un **outil de validation technique temporaire**. Elle ne définit pas l'architecture produit finale.

Chaîne cible :

```text
Éditeur Héros/Créatures
        ↓
définition acteur + MapActorVisual
        ↓
catalogue/référence acteur
        ↓
World Builder
        ↓
placement/référence dans WorldDocument
        ↓
runtime Exploration
```

Aucune copie des réglages visuels n'est stockée dans le placement Builder.

## 28. Règle finale

La charte prime sur la solution la plus rapide.

Choisir la solution qui réduit les autorités, les effets globaux et la dette, réutilise les contrats existants, reste testable et facilite l'intégration future à GenSrpG.
