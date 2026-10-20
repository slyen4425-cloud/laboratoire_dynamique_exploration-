# Exploration V48 — Ombres de profondeur et atténuation des répétitions — Prévalidation (20/10/2026)

## Retour créateur
« C'est mieux, la direction est mieux. Mais oui c'est répétitif et flou. Également pense à garder le dégradé ombre pour l'effet de profondeur. »
La V47 atlas 96 px n'est **pas GREEN esthétique**.

## Base et gouvernance
- Base immuable publiée V47 `3b79161355b6c65ec10afe0dabc5851f71fca513`; publication Pages CI #39461194018, PR #189.
- START `checkpoint/exploration-start-cliff-depth-variety-v48-2026-10-20`.
- Branche `work/exploration-cliff-depth-variety-v48-2026-10-20` ; source figée de code `623bc4a84254793b9073b24508448333da5f1014`.
- Checkpoint prévalidation `checkpoint/exploration-cliff-depth-variety-v48-prevalidation-2026-10-20` au même SHA.
- CI source [#39478902393](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39478902393) **SUCCESS**, tests Node, navigateur Chromium (incluant Capture/Builder) ; CI checkpoint [#39479103119](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39479103119) en attente du résultat final au moment de rédaction.
- Aucun changement de logique métier : 2 modules de code UI cache-bust et atlas visuel, tests + docs.

## Correctif
- `src/render/sculpt-cliff-atlas.js` maintient la vraie texture illustrée V47 et son manifeste WebP SHA-256 inchangé.
- Ajout de `sculptCliffVariationPlan` pur : au plus six plages minérales irrégulières, seuils de dimensions, stable par seed, transparence modérée, décalage de motif, sans recouvrir toute la falaise en grille.
- **Restauration du gradient après l'image de roche**, à l'intérieur de la même silhouette de falaise déjà calculée par `sculpt-height-renderer.js` : clair au sommet, ombre croissante vers la base jusqu'à .33 d'alpha, ombre directionnelle sur le côté et petit éclairage latéral doux.
- Liserés de V37, relief, eau V46, personnages, bâtiments et route, collisions, passabilité, sauvegardes/export, caméra, météo/ciel, caches d'interaction tactiles V44 restent gelés. Pas de nouveau système de matériau, texture ni collision.

## Vérification réelle
- CI Node 633+ tests, RIFF/size/SHA de l'asset 8304 octets inchangés.
- Chromium réel : atlas physique 192x160 chargé; rendu V47 change toujours les vraies parois, 6 palettes fonctionnelles; aplats au sommet et eau inchangés; touches/caméra/export inchangés.
- Test de l'ombre sur un mur de 230px : moyenne luminance en haut 112.38 vs en bas 88.32 = assombrissement mesuré +24.06 (mêmes phases du motif natif séparées de 192px).
- 959 points de différence entre deux seeds sur le mur d'essai; plan décalé de 4 facettes sous contrôle; ni surface plateau ni gameplay modifié.

## Limite explicite
La **résolution intrinsèque 96×96** de chacune des deux bases V47 est insuffisante pour certaines grandes falaises et zoom sur smartphone. Le V48 peut seulement cacher certaines répétitions et restituer le volume. Ce n'est **pas** un remplacement haute définition ; ne jamais prétendre que le flou est supprimé. Pour réellement le corriger, recompiler des bases et variantes depuis les **PNG originaux 1254×1254**, conserver un contrôle anti-mosaïque (seamless à vérifier), binaire WebP dans GitHub avec manifeste bytes/SHA et tests, selon charte §12.1 et §12.1.1 en cas de transfert échoué.

## Gate
Prévalidation technique seulement jusqu'à publication infra pin du SHA + CI Pages SUCCESS. L'avis visuel du créateur sur smartphone reste nécessaire avant GREEN esthétique.
