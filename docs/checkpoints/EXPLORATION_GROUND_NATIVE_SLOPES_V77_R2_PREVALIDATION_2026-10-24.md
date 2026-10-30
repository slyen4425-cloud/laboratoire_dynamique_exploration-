# Exploration V77 R2 — Pentes sculptées intégrées au terrain, 24/10/2026

## Retour utilisateur et rollback de la mauvaise conception
- L'utilisateur refuse V77 initiale : « Je voyais les pente dans la construction de terrain, qui reprend le système de texture herbe etc... Pas dans les objet ». L'interface « Objets → Pentes » et ses bandes colorées ont été jugées inadaptées. Ne jamais déclarer cette conception GREEN.
- Système **Escaliers V78 R2 validé explicitement** et gelé, source `134b608ef402392e78e02d72707ef8a6324b4bd2`. V77 R1 publiée (non validée) source `72868224d6794f9c20d1dea227d54eda7fd504d9`.
- START immuable : `checkpoint/exploration-start-ground-sculpted-slopes-v77-r2-2026-10-24`. Branche `work/exploration-ground-sculpted-slopes-v77-r2-2026-10-24`.

## Refonte des responsabilités
- **World Model SculptTerrain** : une collection native immuable `terrain.ramps` avec id, ancre au sol bas, longueur, largeur et angle en unités monde. Comme `terrain.spheres`, elle suit le même `serializeSculptTerrain`, `importSculptTerrain`, Undo/Redo, sol plat/réinitialisation et la même autorité terrain. Les anciennes cartes schemaVersion 1 restent lisibles, sans nouvelle version concurrente.
- **Interface** : dans `Terre` les commandes « 🌿 Créer une pente dans le terrain » et « Effacer une pente » ; glisser du pied bas au haut ; en mode « Placement précis » : viser + Appliquer le pied, viser + Appliquer le sommet. Taille du pinceau = largeur de la pente. Ne plus exposer la catégorie dans Objets ni les 3 pseudo-déclinaisons, puisque le matériau est celui de la carte.
- **Collision World** : `sculptTerrainRampProjections` lit la géométrie terrain et fournit les *mêmes* couloirs `sculptStairCorridor` que les escaliers GREEN à `sculptNavigationRoute` ; aucun objet n'est créé et pas de collision parallèle. Pas de traversée des autres parois, eau, sphères ou flancs.
- **Renderer terrain** : `drawSculptTerrain` intègre les pentes à son propre raster peint avec **exactement la même texture, le même baseColor, la même échelle de pattern que le sol**, sans palette fixe, hachures ou sprites d'objets. La caméra éditeur/Testeur projette le même raster de relief. Hors des pentes, les hauteurs carrées et sphères demeurent gelées.
- **Compatibilité V77 R1** : lors d'une importation complète, les anciens placements `WorldObject kind=ramp` valides sont convertis en `terrain.ramps`, les éventuels invalides préservés plutôt que jetés.

## Tests / frontières
- `tests/sculpt-natural-ramp-v77.test.js` remplacé pour verrouiller les demandes réelles : emplacement dans Terre, non-présence de la catégorie Objets, flux de pente native, niveaux physiques, montée/descente, enchaînement, refus de pose invalide, Undo immuable, import/export ancien JSON et ancienne scène, matériau transmis identique, caméra 35/55/90. Sentinelle de contrat escalier V78 actualisée pour conserver les escaliers et ajouter les terrains.ramps dans la *même* entrée Collision World.
- CI Node et Chromium Sculpt/Builder/Combat exigés au SHA final avant la PR infrastructure et déploiement Pages. **Statut PREVALIDATION Pixel / NON GREEN** jusqu'à contrôle visuel sur vraies cartes utilisateur.
- À faire au test Pixel : construire un vrai plateau bas + haut, Terre → Créer pente, glisser bas→haut et tester la montée. La pente doit visuellement prolonger les textures d'herbe de part et d'autre, ne pas être un objet ; tester aussi escaliers, ponts, sphères, eau et anciennes sauvegardes.
