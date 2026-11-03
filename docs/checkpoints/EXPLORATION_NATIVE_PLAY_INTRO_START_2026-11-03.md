# START — Introduction native du mode Jouer 2,5D (03/11/2026)

## Autorisation / conditions d'entrée
L'utilisateur a confirmé un net progrès de la fluidité sur son PC, a retrouvé le World Builder et demande le **déploiement / introduction de Jouer** dans le Labo Exploration. Le correctif World Builder root 404 est GREEN **à l'URL Pages officielle** (main `2f20cbac59685889c3b00918479d068ca8bae134`, CI 41647191523 SUCCESS, publisher 41647191660 SUCCESS).

Le lot Jouer commence du même SHA, checkpoint `checkpoint/exploration-native-play-intro-start-2026-11-03`, branche `work/exploration-native-play-intro-2026-11-03`. Le test RED `tests/exploration-play-session.test.js` a été créé **en premier** (commit `cc56c5d5246416e71047f69a560637fff28aa12e`) avant le module de jeu ; test RED de package/URL `tests/exploration-play-publication.test.js` commit `0510a34186e3117f97389d84cfdbd54525037076`.

## Périmètre livré par ce premier lot
- Un écran **`play.html`** : Nouvelle partie, Continuer, accès World Builder. Aucune carte factice en absence de WorldDocument enregistré. Une carte incompatible ou un Spawn absent bloque la partie avec message explicite, sans effacer les données.
- **Une seule source de carte** : `readWorldAssemblerDraft(window.localStorage)`, vrai `WorldDocument` v3, `sculptWorldAreaScene`, `mountWorldSculptArea`. Aucun deuxième graphe, pas d'édition cachée du monde.
- **Un seul moteur de déplacement** : `sculpt-lab-main.js?play=1` lance la scène 2,5D sous le même RAF fluide, caméra, Collision World, navigation clavier et stick. Le menu/le HUD Jouer remplacent toutes les commandes d'éditeur et le panneau de diagnostics Tester.
- **Points d'arrivée et passages officiels** : Portal/Spawn depuis le même WorldDocument, destination contrôlée, aucun ajout/réparation de cartes ou de liaisons en jeu.
- **Checkpoint navigation seulement** : clé `gensrpg.exploration.play.navigation.v1`, World ID/fingerprint + area/x/y, aucune donnée WorldDocument/compétence/XP/capture/loot sauvegardée ici. Validation du document à l'entrée, vérification de zone/coordonnées, sauvegarde de position toutes les ~1,5 s lors de déplacement et à la sortie/transition. Aucune seconde horloge et aucune revalidation lourde des maps à chaque frame.
- **Créatures/rencontres** : le mode Jouer ne peut PAS autoriser des rencontres depuis le catalogue d'auteur encore non filtré. La rencontre aléatoire est suspendue **uniquement dans ce mode**, jusqu'au raccord du catalogue du Bestiaire officiel Combat. Tester et ses tests restent inchangés. Ne jamais inventer une victoire, un niveau, une capture ou des récompenses.

## Limites explicitement non cachées
Il s'agit de la **première tranche fonctionnelle de l'exploration** : pas encore de combat Aventure réel ni de XP/loot/capture en jeu. Leurs autorités restent respectivement Labo Combat main et GenSRPG Aventure V2 PR #233. La page `Jouer` sera exposée sur l'adresse de test du Labo Exploration après CI et Pages, pas dans le hub GenSRPG principal. Les cartes Forêt 1/Plaine 1 de PR #337, moulin et éolienne restent non promues.

## Validation et sortie
1. `npm test` et `npm run check` incluant tests session, invariants CSS/DOM/publication.
2. Vrai Chromium sur fichiers checkout du SHA exact : page Jouer -> clic Nouvelle partie -> vrai Canvas/scène/acteur déplaçable -> Menu -> checkpoint -> Continuer au même X/Y, sans mutation WorldDocument ni apparition des outils d'édition.
3. Tests Chromium Combat/Builder historiques inchangés ; publisher Pages complet, puis HTTP 200 réel de `/play.html`, `/preview/encounters-v80/play.html` et modules; V80 checksum inchangé.
4. PR dédiée, preuve GREEN et publication uniquement après validation; retour utilisateur sur PC/Pixel paysage pour l'acceptation. Aucun raccord GenSRPG dans ce lot.

Feuille de route globale : issue [#343](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/issues/343).
