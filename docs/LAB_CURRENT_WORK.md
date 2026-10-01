# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Asset Pack Forêt v1 — premier raccord visuel Exploration.

## Branche
`work/exploration-asset-pack-forest-v1-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-asset-pack-forest-v1-2026-10-01`

## SHA de base
`afe258c0fbf33d17c5741267930a8915869fe85b`

## Dernier checkpoint GREEN
`checkpoint/exploration-asset-audit-green-2026-10-01`

## État gelé à préserver
- moteur déplacement X/Y ;
- config Phase 1A ;
- collisions ;
- caméra ;
- stick tactile ;
- architecture sentinels.

## Périmètre
- importer uniquement les 6 textures forêt retenues par l'audit ;
- les placer sous ownership Exploration ;
- conserver leur traçabilité source SHA/blob ;
- créer un Asset Adapter local par identifiants sémantiques ;
- utiliser ces textures uniquement pour le rendu du sol ;
- aucune collision dérivée de l'image ;
- aucune dépendance runtime au dépôt Zombicide-40k ;
- preview mobile ciblée.

## Propriétaires
- asset mapping : Exploration Asset Adapter ;
- rendu : Exploration Renderer ;
- monde/collision : inchangés.

## Fichiers runtime autorisés
- `src/assets/` ;
- `src/render/` ;
- `src/config/` pour paramètres de rendu ;
- `src/core/config.js` pour normalisation ;
- `src/main.js` uniquement pour consommation ;
- tests ;
- manifeste d'assets.

## Hors périmètre
- murs ;
- eau ;
- routes ;
- rivières ;
- ponts ;
- bâtiments ;
- modification du World Generator ;
- modification des collisions ;
- modification d'un autre dépôt.

## État technique
- 6 textures forêt importées localement et vérifiées par blob SHA ;
- Asset Adapter local actif ;
- terrain renderer avec culling actif ;
- aucune URL inter-dépôt dans le runtime ;
- aucune référence `assets/dungeon/` dans `src/` ;
- preview Pages active sur ce candidat.

## Retour utilisateur — 2026-10-01
Premier test visuel :
**les dalles forêt sont beaucoup trop grandes par rapport au pion mobile.**

Diagnostic :
- `terrainTileSize` était à 320 px ;
- le pion fait 36 px de diamètre (rayon 18) ;
- le rapport visuel était donc disproportionné.

Correction appliquée :
- taille des dalles réduite de 320 px à **96 px** ;
- paramètre déplacé dans `Exploration Config` sous `render.terrainTileSize` ;
- valeur personnalisable ;
- fallback validé ;
- aucune modification du pion ;
- aucune modification des collisions ;
- aucune modification de la vitesse ou de la caméra.

## Tests après correction
- defaults config : GREEN ;
- custom config : GREEN ;
- fallback invalide : GREEN ;
- déplacement/collision : GREEN ;
- Asset Adapter : GREEN ;
- sentinelles architecture : GREEN ;
- CI run `36877625085` : SUCCESS.

## Test manuel requis
Nouvelle validation smartphone :
- échelle des dalles plus cohérente avec le pion ;
- sol forêt visible ;
- déplacement toujours fluide ;
- collisions inchangées ;
- caméra fluide ;
- répétition des textures acceptable.

## Critère GREEN
Sol forêt visible avec une échelle cohérente sur smartphone, sans modifier la fluidité ni les collisions.

Le checkpoint GREEN fonctionnel du pack ne sera créé qu'après validation utilisateur.


## Retour utilisateur — raccord naturel
Après correction de l'échelle, le sol reste jugé trop artificiel :
- intersections carrées visibles ;
- raccords entre textures trop nets ;
- impression de grille/mosaïque.

## Correction en cours — Natural Ground Rendering
Le même lot forêt est conservé car il n'est pas encore GREEN.

Nouvelle stratégie :
- abandon du dessin bord-à-bord des images ;
- fond brun-vert continu, ancré aux coordonnées monde ;
- variations organiques par gradients déterministes ;
- les 6 textures deviennent des patchs décoratifs ;
- bords des patchs fondus par masque ;
- position, rotation et échelle des patchs déterministes ;
- superposition contrôlée ;
- culling conservé ;
- aucune information de collision tirée des pixels.

Paramètres configurables :
- `render.terrainPatchSize` ;
- `render.terrainPatchSpacing` ;
- `render.terrainPatchOpacity` ;
- `render.groundDetailSpacing`.

Aucun changement :
- mouvement ;
- collision ;
- caméra ;
- taille du pion ;
- vitesse.


## Décision d'architecture — 2026-10-01

Le rendu forêt v1/v2 est **NON VALIDÉ**.

Constat utilisateur :
- v1 : grille/coutures visibles ;
- v2 : coutures supprimées mais rendu encore peu esthétique ;
- la stratégie de patchs de texture rendrait les futures routes, rivières et transitions difficiles à composer proprement.

Décision :
- ne pas continuer à polir ce renderer ;
- ne pas créer de checkpoint GREEN pour ce lot ;
- conserver cette branche comme historique d'expérience ;
- repartir du dernier checkpoint GREEN avant le pack visuel :
  `checkpoint/exploration-asset-audit-green-2026-10-01`.

Cause :
le problème n'est plus un réglage de taille ou d'opacité, mais le modèle de composition du terrain.

Direction suivante :
créer un **World Surface Model v1** où :
- le sol de base est une couche continue ;
- les routes sont une couche structurée indépendante ;
- les rivières sont une couche structurée indépendante ;
- les transitions/bords sont générés par le renderer ;
- les obstacles/décors restent séparés ;
- les textures servent à habiller les surfaces, jamais à définir la géométrie du monde.
