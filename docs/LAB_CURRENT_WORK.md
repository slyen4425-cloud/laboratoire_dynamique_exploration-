# LAB_CURRENT_WORK — Monde World Builder lié aux cartes Exploration 2,5D

Date : 2026-10-28
Branche : `work/exploration-world-2p5d-portals-2026-10-28`
Base technique verte : `2f2686d2ce78b498e92f894e861e750f6f4c1d64` (World Assembler graphe, 849/849 tests et browser Android paysage).
Checkpoint START créé AVANT code : `checkpoint/exploration-start-world-2p5d-portals-2026-10-28`, sur la base.
PR fonctionnelle #265 en DRAFT, base `work/exploration-world-assembler-2026-10-28`.
Le site V80 stable est épinglé à `933c852c41c4511cb0eed0717c246cc6b19aeddc` et ne doit pas être modifié.

## Demande utilisateur
- Un **donjon peut se trouver DANS une WorldArea** (exemple forêt → donjon), et l'entrée physique doit se placer dans l'éditeur 2,5D, ainsi que le point d'arrivée dans la destination.
- Relier réellement l'assembler à l'éditeur 2,5D et TESTER dans le jeu : pas seulement des liaisons visibles sur un graphe.
- À terme agrandir les zones au-delà du maximum graphique actuel 60×60. Ne pas redimensionner silencieusement les cartes ni promettre le streaming avant son développement.

## Autorité et contrats
- WorldDocument v3 est **l'unique sauvegarde** de monde. WorldArea possède `width/height`, `surface`, `objects`, `actors`, `spawns` et l'option `sculptTerrain` (seule nouvelle couche de hauteur), validée contre dimensions exactes de l'Area ; pas d'autre format de scène persistant.
- Le donjon est une WorldArea `kind='interior'`, `siteKind='dungeon'`. Son rattachement à la région hôte est le `Portal.sourceAreaId`, pas un lien de parent indépendant. Un Portal retour est généré par la même commande Builder.
- Le Hero continue à utiliser Collision World / Movement existants. Entrée = `Portal.trigger` point, arrivée = `WorldArea.spawns[]`. En mode jeu, transition par les `findTriggeredPortal` et `applyPortalTransition` officiels.
- Le panneau 2,5D édite les positions de ces mêmes objets, sur le sol réel et accessible ; le graphe n'invente aucune géométrie ou coordonnée concurrente.
- Les modèles traditionnels `sculpt-preview-scene` (autonomes et maisons locales) restent utilisables hors du mode World Builder ; ils ne sont jamais mélangés à WorldDocument automatiquement.
- Les anciennes régions WorldDocument 2D hors grille sculptable ou avec objets incompatibles sont **refusées explicitement**, sans écrasement des données.

## Implémentation
- World Builder : création « Donjon situé dans la zone sélectionnée », affichage du lieu hôte déduit du Portal, dimensions de nouvelles régions compatibles 2,5D, ouverture « Éditer en Exploration 2,5D » et conservation de l'ancien éditeur détaillé 2D.
- WorldArea normalisée : `label`, `siteKind` si intérieur et `sculptTerrain` optionnel validé ; données existantes intactes.
- Adapter pur `src/builder/sculpt-world-area-link.js` : ouverture d'une WorldArea comme scène sculptable active, enregistrement du relief et des placements dans la même WorldArea, mutation de Portal/Spawn via les commands Builder, rejet des placements hors carte.
- Labo 2,5D : panneau WorldArea, sélection des passages, clic sur le sol pour placer une entrée ou arrivée, marqueurs visibles, bouton de transition accessible uniquement à portée réelle, éditeur de terrain/surface conservé, retour « Enregistrer · World Builder ».
- Mode jeu : charge réellement l'autre relief/WorldArea, replace le héros au Spawn officiel et conserve les Portals et les données d'Area. Encounters/Combat consomment le WorldDocument et son EncounterConfig ; pas de deuxième table.
- Anciens HTML/prototype V80 et liens de production non modifiés.

## Preuves techniques
- RED initial tests WorldArea multi-zone avant adaptation `ba2d4d4`.
- `tests/sculpt-world-area-portals.test.js` : donjon dans Area, hauteur/surface JSON export/import, transitions Portal officielles, interdiction de perte de dimensions/positions et exemple 72×62 au-delà de 60×60 dans le modèle.
- CI `40608103277` sur `0c0ec74` : **854/854 tests Node** et navigateur Chromium complet GREEN : World Builder → édition 2,5D → entrer dans le donjon → revenir sur la région hôte → World Builder, 4 Areas/4 Portals et reliefs conservés. Gardes antérieurs Exploration/Combat/Scène V80 passés.
- Une régression sentinelle de test texte a été corrigée à la racine dans `a75fb8a` sans affaiblir les tests : conservation exacte du chemin Collision World pour les intérieurs et du contrat prototype optionnel.
- Les dernières corrections bloquent l'effacement silencieux d'objets incompatibles et renouvellent la révision du module 2,5D dans le navigateur. CI du HEAD de documentation et de ces correctifs à vérifier.

## Taille et chantier ultérieur
- Le modèle WorldDocument accepte des dimensions physiques jusqu'à 20000. Le laboratoire Sculpt actuellement accepte **8–80 cases en largeur et 8–64 en hauteur**, pas de changement artificiel de cap dans ce lot ; exemple testé de 72×62.
- Pour dépasser réellement 80×64 sans crash mobile : terrain partitionné/chunks, rendu/LOD et collisions indexées, import/export versionné. Doit constituer un lot distinct vérifié sur téléphone ; pas de réduction silencieuse en attendant.

## Gates de sortie
- CI HEAD finale Node, check syntax, Chromium en paysage, Capture/Exploration et V80. Checkpoint intermédiaire sur le SHA exact.
- Preview isolée sous `/preview/encounters-v80/` assemblée à partir d'un SHA figé, validée HTTPS + byte-comparison de V80.
- L'utilisateur teste créer donjon dans forêt, placer point d'entrée, tester traversée et retour, vérifier sauvegarde. **Seulement après sa validation : checkpoint GREEN final**, pas de fusion gameplay dans main ni GenSrpg avant intégration contractuelle.
