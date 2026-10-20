# Exploration — V46 berges d'eau assouplies, prévalidation technique — 20/10/2026

## Branche / source
- Demande utilisateur du 20/10 : les contours d'eau dessinés sont trop carrés, besoin d'arrondir visuellement.
- Source de départ V45 minéral `8dca9d98640f3af4397b5ed2b02b21e9a10b6bd7` (rendu roche publié et CI GREEN; avis esthétique mobile non encore collecté).
- START `checkpoint/exploration-start-sculpt-water-shore-v46-2026-10-20`, travail `work/exploration-sculpt-water-shore-v46-2026-10-20`, prévalidation `checkpoint/exploration-sculpt-water-shore-v46-prevalidation-2026-10-20` sur code figé `4a0f2d78e5a2fe86d801d38874750ab98742f149`.
- CI source [#39429375425](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39429375425) SUCCESS ; CI prévalidation [#39429615652](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39429615652) SUCCESS.

## Traitement visuel
- Le rendu `src/render/sculpt-height-renderer.js` calcule `sculptWetShoreProfile` depuis l'unique sémantique existante `sculptWetShoreEdges` : cellules voisines sèches, rayon et retrait visuel.
- Une courbe Canvas (coastlines concaves / coins visuellement arrondis) masque **à l'intérieur** des cellules humides, sans jamais peindre à l'extérieur; deux cellules adjacentes restent raccordées sans faille bleue ni couture verte; mousse/effet de rive découpés sur le même masque.
- Le tracé ne change ni `terrain.waterLevels`, ni `sculptWaterAt`, ni Collision World, ni la possibilité de marcher ou nager. Pas de nouveau canal d'authoring, ni de seconde géométrie persistée.
- Le sous-système minéral V45 (six palettes/grain 128px) reste inchangé. Cache-bust renderer `sculpt-rear-rim-v37-rock-v45-shore-v46`.

## Tests prouvés
- Node : une eau isolée a les quatre rives extérieures / profil limité ; pièces jointives 2x2 partagent des bords sans contour ; WorldModel unchanged.
- Chromium réel : coin sec et lisière extérieure pixels **[58,129,76]** identiques au rendu sec, centre d'eau **[71,193,232]**, deux cellules humides adjacentes bleues **[33,179,227]** et **[33,178,227]**, `sculptWaterAt` centre=2, voisin sec=0, JSON WaterModel inchangé.
- Sentinelles V33 eau/falaise, V35–V37 lip/liseré, V38/39 caméra, V40 passabilité, V41 sky, V42 acteurs, V43 toolbar, V44 glissement et V45 grain roche, Builder/Combat en vrai Chromium : GREEN.
- Rendu **visuellement arrondi**, pas de spline pour la géométrie des eaux.

## GREEN
Prévalidation technique GREEN uniquement. La validation sur smartphone, la comparaison visuelle à la référence du créateur pour les roches et l'amélioration visible des berges sont toujours **en attente de retour**. Source figée ci-dessus; preview `sculpt-lab.html?v=46` après Pages SUCCESS.
