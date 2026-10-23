# Exploration V76 R11 — Collision de bord et lisibilité de profondeur (23 octobre 2026)

## Retour du créateur
Après V76 R10 sur Pixel : « Mieux, on peaufinera plus tard [...] les plus petites surfaces » ; demande de **corriger légèrement la collision** autour de la colline et de **renforcer l'ombre des bordures**, tout en **éclaircissant l'herbe sur les hauteurs**. Le rendu des petites couronnes est explicitement REPORTÉ, sans nouveau chantier de géométrie.

## Règles de charte appliquées
- Dernier GREEN utilisateur V75 R2 : `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- Base source R10 testée : `0a568f9a6f1483069a21bbe8607d365c20f52958`.
- Checkpoint START immuable : `checkpoint/exploration-start-sphere-depth-collision-v76-r11-2026-10-23`.
- Branche unique : `work/exploration-sphere-depth-collision-v76-r11-2026-10-23`.
- Propriétaires uniques conservés : géométrie/hauteurs = World Model, accès = Collision World, éclairage = Renderer, textures = Material Registry + Asset Adapter, position mobile = Exploration Core.
- Pas de rustine UI, masquage de texture, contour noir permanent, nouvelle couche de collision, ou autorité parallèle. Aucune modification des formats JSON, du World Model ou des assets.
- V77 (pentes marchables), V78 (escaliers), formes de petit diamètre, ponts V74, cascades V3, falaises V75 et moteur Combat/Builder **gelés**.

## Correctifs R11
1. `src/core/sculpt-navigation-collision.js` : l'unique garde de projection de sphère R9 reçoit une **petite marge de sécurité calculée à partir du rayon de l'acteur** : de 2 à 6 unités de monde, 4 pour le héros de rayon 5. La garde garde les tests de niveau bas et de la hauteur échantillonnée sur le **modèle géométrique canonique**, protège plus tôt les pieds du héros contre un chevauchement de l'herbe haute. Le retrait nord/latéral, le vol et les ponts restent des exceptions déjà existantes.
2. `src/render/sculpt-sphere-mesh.js` : intensité douce du rebord augmentée et modulée par la hauteur, sans ajouter de véritable contour noir. Les sommets à plateau conique R10 reçoivent un éclairement transparent `rgba(250,250,212,...)` proportionnel à la hauteur (0.10–0.24) et un **dégradé radial unique** du centre clair au pourtour ombré. Les collines rondes héritées restent ombrées dans leur tracé ; les cavités ne sont pas éclaircies. Aucun nouvel asset et seulement un remplissage supplémentaire par colline, maillage/cache R5 inchangés.
3. Petit sommet ou raccord cosmétique résiduel de faible diamètre non retravaillé, selon souhait utilisateur.

## Contrôles requis
- Node : tests existants et tests R11 de marge de collision bornée, passage latéral et vol, éclairage positif avec la hauteur, bord sombre suivant le rayon, sortie hors sommet, absence de perte de performances (max neuf remplissages par frustum).
- CI : `npm test` + `npm run check` + Chromium Sculpt/Builder/Combat, sur SHA final. Diff limité à Collision World + Renderer + tests + docs ; ni sérialisation ni texture ni moteur externe modifié.
- Publication : checkpoint PREVALIDATION sur SHA GREEN puis PR **infra-only** pour fixer le checkout GitHub Pages, pas de merge gameplay dans `main`.
- **V76 R11 NON GREEN Pixel** tant que le créateur n'a pas confirmé l'ombrage et la collision sur son téléphone. V77/V78 restent gelées.
