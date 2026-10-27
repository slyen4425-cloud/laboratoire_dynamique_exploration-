# Exploration V75 — Prévalidation technique falaise infranchissable (22 octobre 2026)

## Demande / ordre de mise en œuvre
1. Empêcher que le héros gravisse ou descende un escarpement en venant du haut de la vue, des côtés ou de l'autre versant, même quand les différences d'altitude sont faibles.
2. Lot V76 indépendant : vraie colline et vraie cavité circulaires, géométrie continue sphérique, **pas** un flou sur une grille de cubes.
3. Lot V77 indépendant : pente créée et traversée explicitement, même géométrie World pour rendu et Collision World, pente maximale configurable.
4. Lot V78 indépendant : WorldObject escalier avec entrée/sortie, hauteur et collisions explicitement autorisées, sans téléportation.

## Base, gouvernance, autorité
- Dernier checkpoint GREEN manuel des ponts : V73 `2d95caba255a201be738f33ada1cccebbafd8ec5`.
- Source technique V74 choisie pour ne pas perdre les WebP nettoyés : `8b1a894f33afbfcd907596ad8d271f2862b2f2cf`, prévalidation esthétique encore soumise au Pixel.
- Checkpoint START avant code `checkpoint/exploration-start-cliff-lock-v75-2026-10-22`.
- Branche `work/exploration-cliff-lock-v75-2026-10-22`; Collision World et son adaptateur Sculpt restent seuls juges du franchissement. Le résultat passe à Exploration Engine via `stepMovement`.
- V17/V40 autorisaient 1 à 3 cellules de dénivelé libre par le curseur Tester. V75 déclare les valeurs normales de montée et descente à **0** dans `SCULPT_NAVIGATION_PROBE_DEFAULTS`; le Tester les consomme directement et n'offre plus de curseur déverrouillable.
- Les outils de sculpture existants, la carte et le schéma de sauvegarde ne sont pas modifiés dans ce lot. Les futures pentes et escaliers devront passer par une autorisation **explicite** du même Collision World ; aucun effet visuel ne donnera de droit gameplay.

## Invariants préservés
- Ponts V69+ : sur/sous, sorties de berge, blocage des rambardes, largeur 35 %, taille longueur/largeur, rendu vertical, sprites nettoyés V74.
- Vol/nage/eau, ombres/caméra/joystick/acteurs, Surface et WorldDocument, Builder 2D, laboratoire Combat et rencontres restent inchangés.
- La règle de la grille n'est pas directement applicable à de **vraies** surfaces continues ; le prochain lot V76 documentera leur échantillonnage et vérifiera le même Collision World.

## Vérifications réelles
- `tests/sculpt-cliff-lock-v75.test.js` couvre les marches 1–5 niveaux en montée et descente dans 8 directions, la collision swept `stepMovement`, terrain plat, vol, 2D isolé et pont porté.
- Les sentinelles historiques V17/V40 restent en place pour le contrat du noyau ; V40 HUD est actualisée pour le mode Tester strict.
- `scripts/smoke-sculpt-terrain-lab.mjs` vérifie en vrai Chromium que le curseur obsolète reste verrouillé à 0 même si l'on tente 1 ou 3, que la scène n'est pas modifiée et que le mode Tester/éditeur est réversible.
- Première CI complète SUCCESS `#39837293202` sur SHA de code `bd0ede8d409f5ce741dfc2ffcc3b0bcfd25a1f4b` (Node + Chromium et validation Combat).
- Avant la publication finale, revérifier la CI sur le commit documentaire final exact, checkpoint de prévalidation et publication Pages épinglée via PR infra dédié.

## Critères de validation et limites
- **GREEN technique** = succès CI sur SHA final exact, document + checkpoint prévalidation, preview CI/Pages.
- **GREEN manuel suspendu** : tester un plateau de 1 et 2 niveaux de haut depuis le nord, sud, est, ouest sur smartphone, ainsi que diagonale/55°/80°, traversée de pont et vol.
- Les plateaux isolés deviennent volontairement inaccessibles à pied jusqu'à V77. **Ne pas ouvrir les accès en réintroduisant un seuil de hauteur libre**.
- La seule carte de jeu actuelle est encore discrète / cubique ; V75 ne prétend pas résoudre son rendu sphérique. V76 exigera une vraie couche géométrique continue (profil de calotte de sphère, collines et cuvettes), l'éditeur/preview et le même chemin collision.
- L'usage actuel de maxStepUp/down > 0 dans quelques vieux **tests** illustre l'ancien contrat bas niveau. Il n'existe plus de moyen pour un joueur du Tester de demander ces valeurs via l'UI V75. Ne pas confondre avec un accès valide futur.
- Ne pas lancer le code V76 avant d'avoir franchi le checkpoint / gate V75 conforme à la charte.
