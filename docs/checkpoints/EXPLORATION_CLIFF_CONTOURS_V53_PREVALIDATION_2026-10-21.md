# Exploration V53 — Continuité des contours de falaise — prévalidation du 21/10/2026

## Retour et diagnostic
- Le créateur valide les falaises HD V50, mais juge l'arrondi V52 insatisfaisant. Aucun GREEN esthétique pour V52.
- Le V52 arrondissait indépendamment les rectangles rocheux. Dans des segments étroits (28px), le rayon était plafonné dès 95 %, donc presque aucune différence à 150 %.
- Le curseur V52 n'a pas d'effet sur le rendu en l'absence d'un geste de peinture (fonctionnement maintenu, mais aperçu V53 clarifié).

## Gouvernance
- Base immuable V52 (incluant les ponts V51) : `d71face4ba39f1118f5f5b494a13fc66444e85ef`, Pages #39541814549 SUCCESS, acceptation esthétique falaises V50 seulement.
- START : `checkpoint/exploration-start-cliff-contours-v53-2026-10-21`.
- Branche : `work/exploration-cliff-contours-v53-2026-10-21`.
- Runtime testé : `2cb35c165f2065179efbba1f1bcc63c3cb735f98`.
- CI [#39564714425](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39564714425) **SUCCESS** pour core-tests + smoke Chromium Builder/Exploration/Combat.

## Correctif
- Zones touchées uniquement : voisinage direct d'une face sud sèche avec `roundness != 95`, calculé au rendu depuis les hauteurs déjà canoniques. Une case d'eau interrompt ce masque.
- Masque de falaise continu à courbes de Bézier : raccorde les changements de hauteur des faces adjacentes en haut comme au pied sans réinterpréter `levels[]`, `waterLevels[]` ou les paramètres de collisions.
- La fonction roche `rockFace` existante est conservée pour les textures, palettes, ombres, atlas HD V50, fissures, mousse et repli.
- Les faces ordinaires (`roundness=95`, en dehors de la zone peinte) prennent toujours l'ancien chemin de rendu : protection esthétique V50/V52.
- L'aperçu `Arrondi N %` présente maintenant la vraie donnée éditée, et non la hauteur `N → N`.

## Sentinelles
- Tests `tests/sculpt-continuous-cliffs-v53.test.js` : masque limité à la zone touchée, valeurs 0/95/150, raccord de niveaux, exclusion eau, géométrie inchangée, export/import.
- Smoke Chromium de pixels : falaise modifiée dans la zone arrondie, pixels de sol éloigné inchangés, préservation stricte des hauteurs et volumes d'eau.
- Toutes les sentinelles existantes, et vrais parcours Combat, restent exigées avant publication.

## Gate
- **GREEN technique source V53 uniquement**. Ne pas déclarer GREEN esthétique/tactile ; photographies et ressenti créateur sur smartphone nécessaires.
- Ne pas rebaser le moteur sur main. Publier en PR d'infrastructure seule, pin source immuable, après CI SHA final.
- Retour possible instantané sur pin V52 `d71face4ba39f1118f5f5b494a13fc66444e85ef`.
