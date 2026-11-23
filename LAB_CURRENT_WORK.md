# Chantier actif — escalier Profil A / #525 — 23 novembre 2026

- **Dépôt propriétaire** : Exploration main, base gelée `57ca20e6647cc49ad16fdd8f02c88f8aca3ebe1a`; branche dédiée `fix/stairs-side-alt-profile-20261123`.
- **Symptôme** : le nouveau visuel nettoyé `object.stairs.earth_log_path_2p5d.side_alt.01`, présent dans le registre canonique avec l'ID original préservé, n'a aucun profil physique pour Collision World. Le héros ne peut pas le monter dans les conditions attendues.
- **Propriétaire unique** : `src/core/sculpt-stair-traversal.js`; conserve `WorldObject`, `sculptNavigation`, `stepMovement`, la grille de hauteur/eau, et le rendu `sculpt-object-picking`.
- **Lot borné** : ajouter uniquement le profil pied/sommet du **Profil A** confirmé par l'image source. **Ne pas changer** les anciens axes `side`, `oblique`, `front`, ni les images, IDs, placements, WorldDocument, collisions de falaise générale, marqueurs de carte ou assets.
- **Raccord réel** : `tests/sculpt-side-alt-stair-traversal-20261123.test.js` importe le catalogue d'objets et teste `stepMovement` réel dans les deux sens, le miroir, le rendu et le refus sur eau/dénivelé non autorisé.
- **Risque** : moteur de déplacement partagé. Exiger `Exploration CI` + prévalidation de publication sur la SHA exacte, puis CI `main` et Pages. Pas de raccord PWA avant checkpoint GREEN.
- **Chantiers suivants** : #525 tracé pied/sommet manuel, #530 permissions de passage relief/eau, #526 forme carrée du pinceau de textures. Ces travaux seront des lots séparés, jamais une seconde autorité.
