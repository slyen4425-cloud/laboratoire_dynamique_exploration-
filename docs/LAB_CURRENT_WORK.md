# LAB_CURRENT_WORK — Navigation Monde / Carte 2,5D sur anciennes zones

Date : 2026-10-28
Base GREEN : `f2f424fb4c6390e276b04f375d27f7def8680749` (875/875 Node + Chromium mobile).
Branche source : `work/exploration-world-map-legacy-switch-2026-10-28`.
START : `checkpoint/exploration-start-world-map-legacy-switch-2026-10-28`.

## Reproduction sur smartphone
L'ancienne zone `2400 × 1600` est conservée par le modèle WorldDocument mais n'est pas représentable dans SculptTerrain (grille en cases 28×21, max 80×64). Le clic Carte ouvrait alors le prototype Sculpt indépendant. Le clic Monde tentait `saveSculptWorldArea` sur cette scène et levait l'exception de dimensions, bloquant la navigation. Aucun ajustement silencieux de géométrie n'est autorisé.

## Contrat corrigé
- Avant d'ouvrir Carte 2,5D depuis Monde, `sculptWorldAreaScene` vérifie la zone sélectionnée via le même adapter canonique ; si refusée, rester dans Monde et diriger vers le formulaire de création d'une carte compatible, ancienne zone intacte.
- Si une URL ancienne ou un rafraîchissement ouvre malgré tout une WorldArea incompatible, l'éditeur présente un écran explicatif tactile, sans confondre la scène démo avec la carte utilisateur. Deux actions explicites : retour au Monde / nouvelle carte compatible.
- Une zone n'est enregistrée depuis Sculpt que si sa vraie scène a été montée. Sinon, seul le `WorldDocument` reçu est sauvegardé et transmis, sans redimensionnement ni copie ni masquage.
- Le retour ne dépend plus d'un dialogue d'alerte bloquant pour cette anomalie.

## Propriétaires / invariants
WorldDocument unique propriétaire ; `sculptWorldAreaScene` seul validateur de capacité de la grille ; stockage et handoff existants ; pas de nouvelle autorité ; anciennes sauvegardes et Portals inchangés ; V80 production immuable.

## Validation et suite
`tests/world-map-legacy-switch-regression.test.js` + tests historiques + CI + `scripts/smoke-sculpt-terrain-lab.mjs` en Chromium mobile 960×540 (sélection 2400×1600, garde du switch, ouverture URL historique, vrai clic tactile de retour, document intact). Tests/redéploiement à consolider avant validation finale sur l'appareil de l'utilisateur.
