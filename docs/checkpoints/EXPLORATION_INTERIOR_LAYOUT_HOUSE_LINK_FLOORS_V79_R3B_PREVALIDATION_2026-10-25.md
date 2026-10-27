# V79 R3B — Prévalidation liaison maison, plan intérieur et étages

Date : 2026-10-25. **NON GREEN final** jusqu'au retour Pixel du créateur.

## Contrats propriétaires
- Porte extérieure du bâtiment : WorldObject.doorAnchor et source Portal existant. Le Building ne reçoit aucun lien redondant vers les pièces.
- Sélection de pièce : un modèle neutre de contenu copié indépendamment dans la WorldArea liée à la maison via son Portal (sélection UI éphémère).
- Forme : `WorldArea.boundary` rectangle/polygon, prédéfinition UI Rectangle/L/T/Croix non sérialisée ; Collision World lit la même boundary que le rendu.
- Dimensions : `WorldArea.width/height` et taille `SculptTerrain` cohérentes ; sauvegarde JSON et bibliothèque de pièces compatibles avec les anciens 18×14.
- Étages : WorldArea distincte par étage ; montée/descente via `Portal` explicite point et `Spawn` spécifique de la cible ; 4 niveaux au maximum dont RDC. Repère visuel ↑/↓ provisoire et sans autorité de collision.
- Éditeur : choix d'un modèle de pièce lors de la sélection du bâtiment, puis libre personnalisation ; panneau taille/forme et choix/ajout d'étage sur la carte active. Le modèle importé ne partage ni buildingId ni Portal.
- Sauvegarde : `interiors[]` inclut `floorIndex` (0 pour anciennes scènes) et les WorldArea des niveaux, avec import de bas en haut et rejet des liens/étages orphelins.

## Gouvernance
- Base immuable acceptée pour murs/caméra R3A2 : `fde0d536fdada43e499c54153992f571676af0e3` ; checkpoint start : `checkpoint/exploration-start-interior-layout-house-link-floors-v79-r3b-2026-10-25`.
- Branche isolée : `work/exploration-interior-layout-house-link-floors-v79-r3b-2026-10-25`.
- GEL : caméra 35–90° validée, pentes V77, escaliers extérieurs V78, moteur Combat, Explorer main, contrats collision/mouvement externes.
- Contrôles : tests Node forme/limite collision/dimensions, duplication privée, transition entre étages, sauvegarde JSON ; vrais Chromium maison + forme L + redimensionnement + étage + retour + export/import.
- Prépublication Pages seulement depuis SHA dont CI intégrale est verte, PR infrastructure uniquement ; aucune fusion code métier sur main.

## Limites restantes
Les repères de passage entre étages sont provisoires (pas encore de sprite ni animation d'escalier intérieur) ; les murs et fenêtres percées de cloisons sont un futur lot R3C séparé. Le système est encore une prévisualisation du SculptLab, et non le runtime WorldDocument final. La nouvelle ergonomie doit être validée par le créateur sur smartphone pour recevoir le checkpoint GREEN.
