# Prévalidation technique — Labo Sculpture V39 / inclinaison réglable en mode Tester

- **Date :** 19 octobre 2026.
- **Décision utilisateur :** le liseré V37 est validé. Le créateur souhaite conserver l'édition simple, avec un angle de caméra ajustable **en jeu** plutôt que d'imposer la vue trois-quarts à l'éditeur.
- **Base immuable publiée :** pilote caméra V38 `2b886832ea9cf46b5ca5d18b3e6471d670c3fd65` (PR #173). Ne pas utiliser la première branche V38 parallèle fondée sur V37 pour publication : elle serait régressive face au correctif V38 déjà en place.
- **Départ :** `checkpoint/exploration-start-game-camera-angle-v39-2026-10-19`.
- **Travail :** `work/exploration-game-camera-angle-v39-2026-10-19`.
- **Source finale testée/publiée :** `fb9f373ecfcd422df1f0cd132205d5abdc692357`.
- **Checkpoint source de prévalidation :** `checkpoint/exploration-game-camera-angle-v39-prevalidation-2026-10-19`.
- **Périmètre effectif :** vue éditeur classique au chargement, option trois-quarts conservée dans les paramètres avancés ; curseur 35° à 90° uniquement en navigation `Tester`. Réutilisation de l'adapter pur `sculpt-camera-projection.js` et des bornes/suivi de caméra existants, déformation du raster de terrain mais pas des sprites d'acteurs et des objets (projection de leurs ancrages individuels).
- **Gels :** terrain/altitudes et sauvegardes, collisions, mouvement/joystick, pinceaux/précision, roche et liseré V37, eau/route, Capture, Combat, Builder et dépôt principal.
- **Test réel :** [CI source #39318891988](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39318891988) SUCCESS et [CI checkpoint #39319045694](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39319045694) SUCCESS. Chromium réel : vue 90° (Canvas hash `3042950732`), vue 35° (`1276247993`), sortie retour éditeur pixels identiques, sauvegarde JSON inchangée, coordonnées acteur inchangées, aller-retour affine exact. Sentinelle V38 click/pinceau sur vraie case et autres intégrations restent GREEN.
- **Publication :** [PR infrastructure #174](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/pull/174) fusionnée main `751c32543e4896b894f4cf18c6714aad3d76546c`, [Pages #39319158175](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39319158175) SUCCESS.
- **Preview :** https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/sculpt-lab.html?v=39
- **Limite reconnue :** la caméra est encore une projection 2.5D affine avec inclinaison et léger biais en vue oblique, pas une caméra 3D orbitale. L'artistique des textures de roche reste un autre lot. La perspective est une prévisualisation de gameplay, pas une caméra sauvegardée dans le projet.
- **Statut :** prévalidation technique GREEN ; **validation visuelle sur smartphone du créateur attendue avant GREEN final**.
