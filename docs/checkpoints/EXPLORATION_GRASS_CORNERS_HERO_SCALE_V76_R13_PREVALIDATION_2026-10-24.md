# Exploration V76 R13 — Coin d'herbe continu et échelle du héros plus visible (24 octobre 2026)

## Retour utilisateur et statut
- **Validé sur Pixel par le créateur** : collisions et possibilité de marcher sur le sommet sphérique R12. Le lot R13 gèle le module Collision World.
- **Non validé** : textures d'herbe aux angles des plateaux carrés encore abîmées en R12 ; échelle du héros trop discrète d'un palier à l'autre. Cette correction R13 reste **NON GREEN Pixel** jusqu'au nouveau retour visuel.
- **Base immuable R12 publiée** : `0956fe57718a30a4abf6f0f5ac5dca1b2475f367`. Dernier GREEN global déclaré : V75 R2 `9cb6610fbf5a42896811e7c02cc3c5d353b844ef`.
- **START** : `checkpoint/exploration-start-grass-corners-hero-scale-v76-r13-2026-10-24`, depuis la base R12 avant la première modification.
- **Branche de code isolée** : `work/exploration-grass-corners-hero-scale-v76-r13-2026-10-24`.

## Diagnostic de cause
Le contour d'herbe arrondi est déjà calculé pour **toute la région de colline** par le renderer V61. En R12, le minéral sous les arcs était peint par la fonction Atlas **case par case** avec graine et ombrage propres à chaque tuile. Les micro-touches de lumière, les effets décoratifs et les ombres de bordure étaient également rendus en rectangles par cellule et découpaient optiquement le coin pourtant courbe.

## Correction source
- `src/render/sculpt-height-renderer.js` : un seul `CanvasPattern` natif (HD V49 via `sculptCliffHDLayers`, palette canonique `cliffAtlasTheme`) calculé à l'échelle du rendu et ancré dans les coordonnées monde pour tous les dessous de coins d'une colline arrondie. Les autres cas et les assets retardés gardent la compatibilité R12.
- Suppression des micro-rectangles et des gradients de contact par cellule **uniquement** pour les régions d'herbe arrondies. La luminosité d'altitude reste calculée par `sculptAltitudeVisualState`.
- Une seule bande de contact herbe/roche très légère par région, dessinée avec le contour V61 existant, sans recalcul de géométrie ni autorité de collision.
- `src/render/sculpt-altitude-visual.js` : `heroScale` de **2,7 % à 3,8 % par palier** avec borne de sécurité [0,75 ; 1,24], en conservant la référence 2. Par exemple niveau 2=1,00 et niveau 7=1,19. Le sprite et son ombre suivent via `createMapActorRenderer`, jamais le rayon physique.
- `sculpt-lab.html`, `src/sculpt-lab-main.js` et l'import renderer : révisions d'URL pour éviter le cache du Pixel lors de la publication.
- Nouveau test `tests/sculpt-grass-corners-hero-v76-r13.test.js` : palette / Atlas HD, une seule région de 16 cellules, arcs, absence de rectangulation du liseré, modèle de terrain inchangé et perspective monotone.

## Invariants gelés
Aucun changement de Collision World, World Model, serialization JSON, relief sphérique R9-R12, reliefs validés V75, eau, ponts V74, cascade V3, génération, pentes V77, escaliers V78, assets binaires, Combat, Builder ou dépôt principal.

## Gates et validation
- CI de première prévalidation du code (avant la mise à jour des URL cache) : **[SUCCESS #40071326239](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/40071326239)** avec Node, check et Chromium. Gate final après cache-busting et ce document à revérifier sur le SHA final.
- Validation manuelle requise : colline carrée 4×4 avec profil de coin arrondi, grass-rock sans patch rectangulaire ; contour bien texturé et continu aux quatre angles sur Pixel ; niveaux 1, 2, 4 et 7, héros et ombre ; collisions sphériques R12 identiques.
- **Ne pas créer de GREEN final sans cette validation visuelle.** Le raffinement des petits sommets sphériques reste reporté.
