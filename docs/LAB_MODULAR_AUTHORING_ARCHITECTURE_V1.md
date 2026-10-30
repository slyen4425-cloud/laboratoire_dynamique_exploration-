# GenSrpG — Architecture modulaire des éditeurs v1

Date : 2026-10-04

## Décision produit

GenSrpG ne doit pas être construit autour d'un éditeur unique qui finit par posséder tous les domaines.

Le système d'authoring reste ouvert :

```text
Éditeurs de définitions
        ↓
catalogues / documents versionnés
        ↓
Éditeurs de composition
        ↓
documents de jeu versionnés
        ↓
runtime
```

Un nouvel éditeur peut être ajouté plus tard sans devenir une seconde autorité sur les données déjà possédées par un autre domaine.

## Principe central

Chaque éditeur possède uniquement les données de son domaine.

Les autres éditeurs consomment des **références stables** vers ces données.

Interdit :

```text
World Builder
  -> copie complète d'une créature
  -> copie complète d'un objet
  -> copie des règles XP
  -> copie d'une campagne
```

Cible :

```text
World Builder
  -> actorDefinitionId
  -> objectDefinitionId
  -> terrainFamilyId
  -> portal / spawn / placement
```

Les définitions intrinsèques restent dans leurs catalogues propriétaires.

## Familles d'éditeurs

### 1. Éditeurs de définitions

Ils créent des ressources réutilisables.

Exemples :
- éditeur Héros / PNJ / Créatures ;
- éditeur de compétences ;
- éditeur d'objets de monde ;
- éditeur d'items / inventaire si ce domaine est introduit ;
- éditeur de matériaux ;
- éditeur de règles générales Capture ;
- futurs éditeurs de factions, quêtes, dialogues, événements, etc.

Ils produisent des documents/catalogues versionnés.

Ils ne placent pas directement leurs ressources dans un niveau actif.

### 2. Éditeurs de composition locale

Le World/Level Builder compose un niveau ou une Area.

Il possède notamment :
- géométrie ;
- Areas ;
- surfaces ;
- terrainFamilyId ;
- matériaux ;
- routes / rivières ;
- spawns ;
- portals ;
- placement d'acteurs ;
- placement d'objets ;
- configuration de rencontres liée à ce monde/niveau.

Il référence les définitions existantes sans les recopier.

### 3. Éditeurs de composition globale futurs

L'architecture réserve explicitement la possibilité d'ajouter plus tard, par exemple :

#### World Editor
Compose plusieurs cartes/Areas/niveaux en un monde plus large.

Exemples :
- continents / régions ;
- villes ;
- donjons ;
- routes entre niveaux ;
- accès / progression globale ;
- métadonnées de monde.

Le World Editor référence des Level/WorldDocuments ; il ne réécrit pas leur géométrie interne.

#### Campaign Editor
Compose une campagne à partir de ressources existantes.

Exemples :
- mondes / niveaux ;
- quêtes ;
- chapitres ;
- conditions de progression ;
- événements ;
- dialogues ;
- récompenses ;
- règles ou variantes propres à la campagne.

Le Campaign Editor ne devient pas propriétaire des créatures, objets, combats, XP ou cartes qu'il référence.

Ces éditeurs ne sont pas requis maintenant. Leur ajout futur ne doit pas imposer de refonte du Level Builder.

## Éditeur d'objets de monde séparé

La **création d'un objet de monde** est distincte de son placement.

Cible :

```text
Object Definition Editor
    ↓
ObjectDefinition + visuel + taille logique + capacités compatibles
    ↓
Object Catalog
    ↓
World Builder
    ↓
objectDefinitionId + transform + état/overrides explicitement autorisés
    ↓
WorldDocument
```

L'éditeur d'objets de monde pourra définir selon le type :
- identité / catégorie ;
- visuel ;
- taille logique ;
- footprint/collision de base ;
- anchors ;
- capacités d'interaction ;
- paramètres intrinsèques ;
- compatibilités éventuelles.

Le World Builder conserve uniquement ce qui relève du **placement/composition du niveau** :
- référence à la définition ;
- position ;
- rotation ;
- scale si autorisé ;
- état initial ou overrides explicitement prévus par le contrat.

Il ne devient pas l'éditeur complet de la définition.

### Objets de monde vs items/inventaire

Ces deux concepts doivent rester séparables.

- WorldObject : élément placé dans le monde (pont, bâtiment, coffre, décor interactif, etc.).
- Item : ressource possédable/utilisable par un acteur ou un joueur.

Un même concept visuel peut éventuellement relier les deux par contrat, mais aucune fusion implicite des autorités n'est autorisée.

## Règles générales de jeu

Les paramètres globaux d'un mode ne vivent pas dans le World Builder.

Pour Monster Capture, cela inclut notamment :
- XP ;
- courbe de niveaux ;
- points de statistiques ;
- règles de compétences ;
- loot ;
- monnaie ;
- règles de capture ;
- objets de capture ;
- politique de distribution des récompenses.

Ils appartiennent à une **Capture Rules Authority** configurable.

Le World Builder peut seulement configurer ce qui dépend réellement du monde/niveau :
- famille de terrain ;
- chance de rencontre locale/par famille ;
- répartition élémentaire ;
- placements ;
- événements monde explicitement prévus.

## Extensibilité des registres

Toute catégorie destinée à être extensible par le créateur doit être résolue par registre/catalogue de données, pas par une enum moteur fermée.

Exemples :
- terrain families ;
- éléments Capture ;
- Object Definitions ;
- Actor Definitions ;
- matériaux ;
- types/règles de campagne futurs.

Les presets fournis par GenSrpG sont des **données par défaut**, pas la liste maximale autorisée.

## Contrats versionnés

Chaque document persistant ou échange inter-éditeur doit porter :
- schema ;
- version ;
- identifiants stables ;
- références explicites ;
- validation ;
- migration si le schéma évolue.

Un éditeur ne doit pas dépendre de la structure DOM ou de l'état interne d'un autre éditeur.

## Composition par références

La règle cible est :

```text
Definition A ─┐
Definition B ─┼─> Catalog
Definition C ─┘
                   ↓ refs
              Level / WorldDocument
                   ↓ refs
               WorldDocument global futur
                   ↓ refs
              CampaignDocument futur
                   ↓
                 Runtime
```

Chaque étage ajoute de la **composition**, pas une copie des données intrinsèques des étages inférieurs.

## Frontières d'autorité

### Capture possède
- créatures et instances ;
- party / collection / réserve ;
- règles XP / level ;
- loot / monnaie Capture ;
- règles et objets de capture ;
- progression et récompenses.

### Combat possède
- résolution temporaire du combat ;
- faits de combat ;
- événement de fin.

### Exploration / Level Builder possède
- géométrie du niveau ;
- surfaces ;
- placements ;
- Areas / Portals ;
- paramètres de rencontre propres au monde.

### Éditeurs de définitions possèdent
- les définitions intrinsèques qu'ils créent.

### Futur World Editor possède
- la composition de plusieurs niveaux/mondes par référence.

### Futur Campaign Editor possède
- l'orchestration de campagne par référence.

## Règle d'évolution

Lorsqu'une nouvelle feature apparaît :

1. identifier son propriétaire métier ;
2. définir son document/contrat versionné ;
3. déterminer si elle crée une définition ou compose des références ;
4. ajouter un nouvel éditeur si nécessaire plutôt que gonfler artificiellement le World Builder ;
5. connecter les autres surfaces par identifiant/référence ;
6. protéger l'absence de double autorité par tests.

## Conséquence immédiate

- XP/loot/capture restent hors World Builder ;
- la création complète d'objets de monde sera un chantier séparé ;
- le Builder actuel reste un éditeur de composition/placement ;
- les familles de terrain actuelles deviennent à terme des presets extensibles ;
- l'architecture reste ouverte à World Editor / Campaign Editor et autres éditeurs futurs sans refonte du socle.
