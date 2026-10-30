# Exploration Asset Adapter — Contrat cible v1

## Rôle

L'Asset Adapter transforme un identifiant sémantique du World Model en ressource visuelle.

Il ne possède :
- ni collision ;
- ni génération ;
- ni gameplay ;
- ni position.

## API cible

Exemple :

```js
resolveExplorationAsset({
  kind: "terrain",
  biome: "forest",
  variant: 1
})
```

Résultat :

```js
{
  id: "terrain.forest.01",
  path: "assets/exploration/biomes/forest/floor_01.png"
}
```

## Invariants

- aucun chemin `assets/dungeon/` dans le runtime Exploration ;
- aucun hotlink inter-dépôt ;
- aucun fallback silencieux Dungeon -> Capture ;
- l'identifiant métier ne dépend pas du nom historique du fichier ;
- une ressource manquante retourne un résultat explicite, pas un autre biome arbitraire ;
- les collisions viennent du World Model, pas de l'alpha ou de la couleur de l'image.

## Manifeste

Chaque asset importé conserve :
- id Exploration ;
- chemin local ;
- dépôt source ;
- chemin source ;
- blob SHA source ;
- usage ;
- ownership cible futur : `capture`, `common-candidate` ou `lab-only`.

## Intégration GenSrpG

Lors du raccord final, l'Asset Adapter local sera remplacé par un adapter vers le Core Asset Resolver.

Le runtime Exploration continuera à demander des identifiants sémantiques ; il ne connaîtra pas les chemins physiques GenSrpG.
