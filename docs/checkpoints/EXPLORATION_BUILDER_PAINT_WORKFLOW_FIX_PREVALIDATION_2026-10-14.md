# GenSrpG Exploration — Builder pinceau, prévalidation technique (2026-10-14)

## Scope, gouvernance
- Problème utilisateur : après « Carte vierge », le pinceau ne fonctionne pas et les textures/familles sont difficiles à trouver.
- Dépôt : `slyen4425-cloud/laboratoire_dynamique_exploration-`.
- Branche : `work/exploration-builder-paint-workflow-fix-2026-10-14`.
- Base et checkpoint de départ : `4918a98f6f0b09f8ba59e751c5b0348e3426c976` / `checkpoint/exploration-start-builder-paint-workflow-fix-2026-10-14`.
- Le chantier caméra `work/exploration-configurable-game-camera-2026-10-14` est suspendu et reste distinct.
- Ownership : UI World Builder; sélection surface et WorldDocument inchangés, pas de nouveau moteur de peinture.
- Invariants : carte vierge/export, familles éditables, raf coalescé / fluidité mobile, Collision R2, runtime exploration, intégration Combat.

## Correctifs
- BUG : `refreshTerrainControls` lisait `paintableTerrainFamilies` avant sa déclaration : échec JavaScript au premier rafraîchissement.
- Famille → texture → pinceau visibles en haut de Terrain, bouton explicite d'activation avec état, aide contextuelle.
- Réglages de taxonomie/import/rencontres/tracés regroupés dans `details` avancés, sans supprimer l'éditabilité.
- Sur tactile, la première touche en mode peinture ne force pas le plein écran ; l'outil plein écran demeure disponible.
- Un appui court peint un point ; un geste produit un tracé ; la sélection de tracé précédent est libérée après geste.
- Aucune modification de la géométrie canonique, des règles de mouvement, de rencontre ou du rendu final en jeu.

## Tests et porte manuelle
- TDD RED : `1588834ba01dd807f52f12713fe133f694d70d67`.
- Code : `834b8f8ce9e5f4d57b45427071415e54b9517afc` puis sentinelles de révision et CI SUCCESS `38543603277` au SHA `81e1f737522f07dcd7006cea8259bd48bec8f321`.
- Gates manuels : sur smartphone, ouvrir une carte vierge, Terrain > Sol, sélectionner Forêt / Herbe cartoon, activer pinceau, toucher puis glisser ; puis Sable, Route, Rivière ; utiliser annuler ; exporter/réimporter ; vérifier absence de régression de fluidité.
- **Statut : GREEN TECHNIQUE / PRÉVALIDATION. Aucun GREEN FINAL sans validation mobile par l'utilisateur.**
