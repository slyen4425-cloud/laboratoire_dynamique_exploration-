# LAB_CURRENT_WORK — Navigation Monde → Carte 2,5D sur WorldArea historique

Date : 2026-10-28
Domaine : World Builder / adaptation de navigation (aucune mutation du gameplay).
Base GREEN : `e013cb861436cfa32f1f55b9f4968d207e7724bc` (885 tests Node et CI confirmée).
Branche : `work/exploration-world-map-legacy-compatible-navigation-2026-10-28`
Checkpoint START : `checkpoint/exploration-start-world-map-legacy-compatible-navigation-2026-10-28`
Checkpoint GREEN précédent : `checkpoint/exploration-playable-zone-routes-green-2026-10-28`.
CI GREEN actuel : `checkpoint/exploration-world-map-legacy-compatible-navigation-ci-green-2026-10-28` (source immuable `32e38b07227a7e85426fa64fc15fdb1a81416ad0`, Actions #40765978145, Core + Combat + Chromium GREEN). Publication preview isolée et retour manuel Pixel à obtenir.

## Constat utilisateur et RED
Un WorldDocument conservé depuis l'ancien Builder a une zone de départ `Area Principale` 2400×1600 unités monde (terrain Sculpt autorisé jusqu'à 80×64 cellules). Sur le panneau Monde, `Carte 2,5D` bloque l'utilisateur sur cette ancienne zone, même lorsqu'une zone compatible `Ile` ou `Forêt profonde` est déjà présente. L'erreur propose seulement de créer une nouvelle carte et focalise le formulaire ; elle ignore les cartes jouables.

## Périmètre
- **Owner** : adapter de navigation du World Builder ; la validité de carte est déterminée par le même `sculptWorldAreaScene`.
- Lorsque le panneau Carte est demandé depuis une zone incompatible, rechercher une WorldArea déjà éditable ; proposer explicitement son ouverture, sans aucune modification de `WorldDocument`.
- Conserver le nom de zone dans le dialogue et la sélection canonique transmise par `saveWorldAssemblerHandoff`. Si refus, rester sur le panneau Monde ; si aucune carte compatible, garder le guide de création sans créer de carte automatiquement.
- Le clic sur un éditeur 2D historique reste inchangé.
- Aucun terrain 2400×1600 reformaté, aucune édition hors limites, aucune création automatique, aucun Portal/Spawn/Encounter changé.

## Tests / gates
TDD RED puis GREEN : tests ciblés résolveur (zone compatible, historique avec deux alternatives, aucune alternative, contenu inchangé), test sentinelle UI du vrai handoff, `npm test`, `npm run check`, CI, contrôle preview Chromium tactile et résultat mobile réel avant clôture. CI rouge interdit publication.
Hors périmètre : augmenter les dimensions Sculpt (>80×64), remplacer le modèle WorldArea, toucher main / V80 ou le dépôt GenSrpg.

## Reprise préalable
Le chantier précédent `work/exploration-playable-zone-routes-2026-10-28` a créé `🔗 Relier zones jouables` et corrigé les Portals vers les anciens mondes. Sa publication isolée PR #284 est fusionnée ; PR gameplay #283 reste brouillon. Le présent lot ne change ni le comportement de raccordement ni les scènes.
