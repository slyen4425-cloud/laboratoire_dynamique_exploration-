# Prévalidation technique — Labo Sculpture V37 / vrai liseré arrière de colline

- **Date :** 19 octobre 2026.
- **Base immuable :** V36 rendu `682b3958412a66b1ef924daa7aaeaff941c6d7aa`, CI et Pages SUCCESS.
- **Branche :** `work/exploration-sculpt-rear-rim-v37-2026-10-19`.
- **Départ :** `checkpoint/exploration-start-sculpt-rear-rim-v37-2026-10-19`.
- **Source finale testée et publiée :** `8cde0b308675c3463718c661e2b67d56567a6e8d`.
- **Checkpoint source final de prévalidation :** `checkpoint/exploration-sculpt-rear-rim-v37-mobile-cache-prevalidation-2026-10-19`.
- **Périmètre :** ajout de la lèvre arrière NORD et ouest sur vraie case sèche élevée via `sculptGroundReliefLighting().exposedEdges`, sans modifier sud/est V36, faces rocheuses, hauteur, eau, collisions ni texture. Chargement modules Sculpture versionné V37 dans `sculpt-lab.html` et dans l'import renderer de `sculpt-lab-main.js` pour éviter la reprise d'une ancienne version sur smartphone.
- **Test réel :** [CI Chromium et Node #39293795443](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39293795443) SUCCESS. Le premier [test ciblé #39293182047](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39293182047) constatait : contraste rebord arrière **110**, ouest **89**, faux bord sur terrain plat **0**, pas de liseré côté eau ni entre cases de même altitude. Sentinelles Builder, Combat, eau/terre, PWA conservées.
- **Publication Pages :** [PR infra #172](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/172) fusionnée, main `3c936c1fb97138a597d4423ffedd76bfd5cccbe5`, workflow [#39294140867](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39294140867) SUCCESS. Le workflow épingle la source V37, sans fusionner code du labo dans main.
- **Lien de test :** https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=37
- **Régressions connues :** aucune en CI. Validation esthétique sur téléphone attendue, au même angle et au même zoom que le retour précédent.
- **Prochain lot hors périmètre (ne pas entreprendre dans V37) :** vrai cadrage trois-quarts/axonometrique de la carte, avec projection et inverse toucher uniques, ordre des couches, conservation des coordonnées physiques et ajustement ultérieur des textures rocheuses facettées. Les sprites/assets ne sont pas à générer sans besoin explicite.
- **Statut : prévalidation technique ; pas de GREEN utilisateur.**
