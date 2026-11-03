# START — GitHub Pages World Builder 404 à la racine (03/11/2026)

## Signal et preuve
L'utilisateur reçoit HTTP 404 sur l'URL racine `https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/world-assembler.html`. Cette URL avait été annoncée à tort après le GREEN du main et du déploiement. Cause : le seul publisher `.github/workflows/publish-v81-main.yml` assemble le site racine depuis le commit **V80 figé** `933c852`, qui ne fournit pas `world-assembler.html`, tandis que les sources modernes de `main` sont publiées sous `/preview/encounters-v80/world-assembler.html`. Le run de publication [41635086102](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41635086102) avait vérifié ce véritable chemin complet.

## Périmètre et protection
- Départ `main@b0f19c5084f12a72304298ce8700c095eb32c338`, checkpoint `checkpoint/exploration-pages-world-assembler-entry-start-2026-11-03`, branche `work/exploration-pages-world-assembler-entry-2026-11-03`.
- RED d'abord : `tests/pages-world-assembler-root-route.test.js` SHA `034943e37124cf04841816c719cfc0971da37ef0`, exige un accès racine réel, la cible canonique et la preuve live.
- Solution : ajouter **seulement** une page d'entrée HTTP 200 à `site/world-assembler.html`, avec redirection HTML explicite vers le World Builder **déjà complet** de `/preview/encounters-v80` dans le **même Pages artifact** et lien de secours. Ce n'est ni un deuxième éditeur ni une copie des fichiers; les utilisateurs sont redirigés vers la même autorité `WorldDocument`. La version V80 et son hash ne sont pas modifiés.
- Gate de publication : Pages curl HTTP 200 sur `/world-assembler.html` + balise de redirection attendue ; second curl HTTP 200 + noeud réel `graph-nodes` sur cible ; autres tests/CI inchangés.
- Enregistrement retour monde et fluidité restent sur `main`; pas de GenSRPG, pas d'ajout de cartes ni d'assets, pas de mode Jouer implémenté par cette PR.

## Prochaine étape
Une fois la CI et le déploiement du SHA GREEN, publier l'URL racine déjà demandée ; conserver l'URL directe canonique comme secours. Puis commencer le mode Jeu dans une autre branche sur la feuille de route [#343](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/issues/343).
