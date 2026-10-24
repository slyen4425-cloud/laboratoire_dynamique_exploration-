# Exploration V78 R2 — Escalier derrière le héros et projection caméra (24 octobre 2026)

## Validation et défauts signalés
- Le créateur confirme sur Pixel que la logique V78 permet de gravir l'escalier et d'accéder à l'étage supérieur.
- Deux défauts d'affichage à corriger sans toucher à la physique : (1) le joueur disparaît derrière l'escalier sur la montée ; (2) à caméra basse 35° la taille de l'escalier ne s'adapte pas au terrain.
- Base publiée `61d2c152983a231bd6808bb1ae9a5df3e7486450`, START immuable `checkpoint/exploration-start-stairs-occlusion-perspective-v78-r2-2026-10-24`, branche `work/exploration-stairs-occlusion-perspective-v78-r2-2026-10-24`.

## Propriétaire unique
- Rendu `src/sculpt-lab-main.js`. Le `sculptStairId` issu de la même navigation V78 existe déjà ; les deux passes d'objets excluent cet unique escalier pendant que le personnage se déplace dessus. Le sprite est dessiné **une fois avant le héros**, sans repasser devant lui. Séquence pont intégral -> acteur -> rambarde inchangée, y compris pont sous lequel l'acteur marche.
- La même matrice caméra `(1, shear, 0, pitch)` que celle du terrain est appliquée localement à l'escalier **uniquement en mode Tester**. Le point d'ancrage reste projeté une seule fois. À 90° taille verticale originale, à 55° plus courte, à 35° nettement plus compacte ; largeur et pente se projettent comme une surface au sol. Bâtiments, ponts et personnages restent sur le chemin billboard validé.
- Actualisation du paramètre de version du module dans `sculpt-lab.html` pour Chrome / Pixel.

## Non-régressions
- Aucune modification Collision World, moteur de mouvement, géométrie et altitude du pied/tête, types WorldObject, sérialisation, caméra partagée, ponts, sphères, assets. Le héros reste devant les planches de l'escalier mais la physique reste identique.
- `tests/sculpt-stair-perspective-occlusion-v78-r2.test.js` : ordre escalier-acteur, exclusion des deux passes, séquence pont/rail, transformation caméra à 35/55/90 degrés, cache PWA, terrain inchangé.
- Tests Node/TypeCheck/Chromium Sculpt/Builder/Combat sur SHA final et publication via PR Pages seulement après CI verte.

**Statut : PRÉVALIDATION / NON GREEN visuel Pixel.** À vérifier : ascension et descente, héro visible tout du long, vue 35/55/90°, aucun écrasement du pont ni autre objet.
