# START — Accès normal au constructeur de mondes (03/11/2026)

## Retour utilisateur
Après validation perceptive de la fluidité PC sur le Labo Exploration, le lien direct `/sculpt-lab.html` donnait accès à Tester mais ne semblait plus donner accès au constructeur de mondes. Le lien du hub `index.html` libellé « World Builder » ciblait en outre `builder.html` (ancien éditeur 2D), au lieu de `world-assembler.html` (constructeur canonique des WorldAreas/Portals/Spawns).

## Cause
L'en-tête, qui possède le lien World Builder en mode édition normal, est volontairement masqué en mode immersif. Le bouton existant `#world-workspace-return-float` n'apparaît qu'en session `body.world-area-editing`, pas en ouverture directe standalone. Le lien du hub a une destination historique erronée.

## Scope et source
- `main@d5309570ea0f31afd31fd5ebcf41e104e74498fd` et Pages publiées par run [41635086102](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41635086102) ; cette version **contient déjà le correctif fluidité**.
- Checkpoint `checkpoint/exploration-world-assembler-entry-start-2026-11-03` ; travail `work/exploration-world-assembler-entry-2026-11-03`.
- Test RED premier au SHA `7d665afb1d830bf713e388b02452de7de2b3dd68`.
- Correction limitée au lien `index.html` vers `world-assembler.html` et à l'entrée flottante « 🌍 Monde » dans l'éditeur immersif **standalone hors Tester**. En session World Builder, seul le bouton déjà existant de retour au même WorldDocument reste propriétaire ; pas de deuxième écran/autorité.
- Aucune modification des cartes, créatures, spawns, sauvegardes, règles, rendu, vitesse ou combats.

## Validation
Node `npm test`, `npm run check` et vrais Chromium/Combat doivent réussir sur le SHA exact avant merge vers main et une unique publication via `.github/workflows/publish-v81-main.yml`, puis vérifier HTTPS et liens publics. Aucune déclaration GREEN sans ces preuves.

## Chantier suivant distinct
Concevoir ensuite « Jouer une partie » dans Labo Exploration sur une branche **séparée**, avec `Nouvelle partie` / `Continuer` depuis GenSRPG dans un second temps : Explorer propriétaire du monde, Combat propriétaire des créatures publiées/skills/batailles et Aventure propriétaire des règles XP/loot/capture/sauvegardes. Garder Tester indépendant. Ne pas raccorder GenSRPG tant que le jeu n'est pas validé.
