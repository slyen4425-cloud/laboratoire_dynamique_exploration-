# GREEN — Parcours 2,5D réparable et rencontres Capture conservées

Date : 2026-10-28
Source GREEN exact : `e013cb861436cfa32f1f55b9f4968d207e7724bc`
Branche de travail : `work/exploration-playable-zone-routes-2026-10-28`
Checkpoint GREEN immuable : `checkpoint/exploration-playable-zone-routes-green-2026-10-28`.
Checkpoint START : `checkpoint/exploration-start-playable-zone-routes-2026-10-28`.

## Preuves
- Actions core-tests + modern-combat-encounter toutes deux SUCCESS : `40755983392` et `40755974849`.
- Node : 885/885 tests GREEN, dont vrais Portals réciproques et protection 2400×1600.
- Chromium paysage 960×540 : vrai bouton « Relier zones jouables », dialogue natif accepté via CDP, départ compatible et passage retour ; ancien terrain historique préservé, test intérieur maison maintenu.
- Raccord Rencontres : unique `WorldDocument.encounterConfig` + `WorldArea.encounters`, catalogue Capture preview inchangé, sélection de famille de terrain correcte au changement d'Area.

## Contrats
WorldDocument conserve toutes les anciennes zones. Une commande utilisateur explicite réoriente les seuls Portals point vers une destination réellement incompatible ; les Portals de portes et zones intérieures compatibles restent intacts. Aucun redimensionnement, aucune table de correspondance parallèle. Les créations de présets depuis un hôte legacy n'ajoutent plus de retour bloqué sans consentement.

## Validation à venir
Le contrôle final nécessite le déploiement isolé Pages et le test tactile du Pixel de l'utilisateur. La PR gameplay #283 reste en draft. V80 prod inchangée.
