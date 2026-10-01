# GenSrpG Exploration — Architecture cible

## Position dans GenSrpG

Le laboratoire prépare un sous-système de Monster Capture.

Cible future :

```text
GenSrpG Shell
   -> Capture runtime
      -> Capture Exploration
         -> Encounter Bridge
            -> Capture Combat
```

Exploration ne possède ni le Shell, ni les services Core partagés, ni le moteur Combat Capture.

## Couches et propriétaires

### bootstrap
Installe explicitement le sous-système et ses adapters.
Pas d'auto-install caché.

### exploration-engine
Autorité sur :
- position ;
- vitesse ;
- mouvement ;
- état de déplacement.

Logique pure, sans DOM.

### collision-world
Autorité unique sur :
- obstacles ;
- volumes de collision ;
- résolution des déplacements bloqués.

### world-model
Source de vérité du monde runtime :
- dimensions ;
- biome ;
- zones ;
- objets ;
- entités ;
- spawns ;
- points d'intérêt ;
- passages.

### world-generator
Produit un `world-model` à partir de :
- seed ;
- configuration normalisée ;
- contraintes.

Le même couple seed/config doit produire le même résultat.

### camera
Transforme monde -> écran.
Ne modifie jamais la position logique.

### renderer
Affiche l'état fourni.
Ne recalcule pas le gameplay.

### input-adapter
Transforme clavier/tactile/manette en intent de mouvement.
Ne déplace jamais directement l'entité.

### encounter-controller
Décide qu'une rencontre doit commencer à partir du monde Exploration.

### encounter-bridge
Convertit l'état en `CaptureEncounterSnapshot v1`.
Reçoit `CaptureCombatResult v1`.
Aucun accès arbitraire aux internes du moteur Combat.

### builder/data
Produit des documents de monde/config validés.
Ne devient jamais une autorité runtime.

### storage-adapter
Dans le laboratoire : interface isolée.
À l'intégration : délègue au Core storage GenSrpG.

### asset-adapter
Dans le laboratoire : résolution locale contrôlée.
À l'intégration : délègue au resolver central GenSrpG.

## Coordonnées

Autorité runtime :
```text
x: number
y: number
```

La grille est autorisée uniquement pour :
- génération ;
- spatial partitioning ;
- pathfinding interne ;
- culling/indexation.

Elle n'est jamais la position joueur canonique.

## Cycle de vie

Chaque composant temporaire doit être montable/démontable :

```text
install()
dispose()
status() // si utile
```

Après `dispose()`, aucun listener/timer/callback ne doit continuer à modifier le monde ou l'UI.

## Configuration

Les valeurs gameplay sont fournies par données normalisées.

Les valeurs codées dans un prototype ne sont que des défauts techniques de bootstrap et doivent sortir du moteur avant de devenir une règle éditable.

## Intégration future

Aucun fichier de ce dépôt ne sera copié aveuglément dans GenSrpG.

L'intégration devra :
1. auditer les propriétaires existants ;
2. mapper les adapters sur Core/Shell/Capture ;
3. conserver les tests sentinelles ;
4. introduire le sous-système par contrat public ;
5. retirer tout simulateur local devenu doublon.
