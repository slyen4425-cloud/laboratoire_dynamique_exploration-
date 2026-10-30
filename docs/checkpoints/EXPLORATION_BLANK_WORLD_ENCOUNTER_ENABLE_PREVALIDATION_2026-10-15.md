# Prévalidation technique — Rencontres des nouvelles cartes vierges

Date : 15 octobre 2026
Propriétaires : WorldArea pour `encounters.randomEnabled`, Builder Draft pour son édition, Encounter Controller pour le tirage. Aucun changement Combat.

- Branche : `work/exploration-blank-world-encounter-enable-2026-10-15`.
- Départ : `checkpoint/exploration-start-blank-world-encounter-enable-2026-10-15` sur `005b90a223df35477fb2a69ecbd5a9f71b92f243`.
- Source code qualifiée : `7cce25026e611709fe8e4665ca28d9a1cbcfd6ed`.
- CI : [38737222106](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38737222106) **SUCCESS** : 480/480 tests, `npm run check` et navigateur Chromium du raccord Combat GREEN.
- TDD RED : [38735926497](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38735926497), tests invalides attendus quand la commande d'édition et le défaut initial manquent.
- Preuve navigateur : carte vierge réelle créée dans Builder -> famille du sol de base Forêt -> chance de rencontre 100 % -> éléments exclusivement Terre 100 % -> lancement normal `index.html?builderTest=1` -> marche vers la droite -> rencontre native `Lavabête · élément earth · famille forest`, personnage à x:1357.1 y:800 ; pas d'injection de snapshot ni deuxième RNG.
- Test supplémentaire du DOM : activer/désactiver `area-random-encounters-enabled` depuis le Builder modifie uniquement `WorldArea.encounters.randomEnabled`, conserve les chances, reste exportable et laisse l'auteur maître de son choix.
- Le nouveau modèle des cartes vierges extérieures autorise les rencontres mais les chances de familles démarrent à 0 % ; pas d'apparition spontanée avant configuration. Les imports portant explicitement `randomEnabled:false` restent désactivés ; les intérieurs par défaut conservent leur politique OFF.
- Information affichée : désactivation Area visible, différence entre chance de tirage et 100 % d'élément, sol de base vs famille configurée, priorité route/eau/peinture, tirage par distance parcourue.
- Aucun changement de `Encounter Controller`, Combat, Catalogue Capture, collisions, routes, caméra, Zombicide-40k.
- Source d'autorité unique : `WorldDocument.areas[].encounters.randomEnabled`; les visuels et l'UI ne décident pas des combats.

## Gate restant
Publier une preview isolée épinglée au SHA qualifié ; test manuel sur Pixel paysage, avec carte déjà exportée et nouvelle carte vierge, vérifier rencontre puis vrai Combat Capture jusqu'au retour à la position identique. **GREEN TECHNIQUE seulement** ; sans cette validation, ne pas déclarer GREEN FINAL.
