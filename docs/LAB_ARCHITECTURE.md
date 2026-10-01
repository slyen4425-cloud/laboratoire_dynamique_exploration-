# LAB_ARCHITECTURE — GenSrpG Exploration

## Couches

### exploration-core
Autorité sur la position, vitesse et mouvement.

### collision-world
Autorité sur les obstacles et la résolution de collision.

### world-model
Décrit le monde : dimensions, biome, objets, zones, spawns, points d'intérêt.

### world-generator
Produit un `world-model` à partir d'une seed et de paramètres.

### camera
Transforme coordonnées monde -> écran sans modifier l'état du monde.

### renderer
Affichage Canvas 2D initial. Remplaçable ultérieurement sans modifier le core.

### input
Clavier de debug + stick tactile.

### encounter-bridge
Futur contrat indépendant pour basculer vers le moteur de combat.

## Coordonnées
Toutes les entités mobiles utilisent des coordonnées flottantes monde :

```text
x: number
y: number
```

Aucune case n'est l'autorité de déplacement.

## Génération
Le générateur peut utiliser une grille interne pour raisonner sur les biomes et connexions, mais la sortie runtime est un monde continu.
