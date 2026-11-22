# Labo Exploration — Lot ergonomie Terrain / Textures / Familles

Date : 22 novembre 2026
Branche : `feat/sculpt-editor-terrain-palette-20261122`
Base : `main`
Propriétaire : éditeur Sculpt 2,5D et commandes existantes de World Builder.

## Problème reproduit
- Panneau Atelier initialement sous la carte ; commandes inaccessibles en plein écran paysage.
- Peinture des textures et rencontres présentées dans de petites palettes denses, sans regroupement par usage.
- Variante `texture.grass.forest.base.02` fournie mais pas sélectionnable comme matériau distinct.
- World Builder sait créer des familles personnalisées, mais la palette 2,5D n'affichait que les familles préprogrammées.

## Périmètre
1. Conserver la carte avant les outils dans le DOM (contrat canvas-first mobile), mais ouvrir l’accordéon Atelier par un bouton permanent de la barre d’outils et l’exposer comme panneau contenu dans le viewport, y compris en plein écran ; ranger l'import/export à l'intérieur et améliorer les palettes mobiles.
2. Peinture : sections repliables « Peindre », « Sol de base » et « Historique » ; matériaux existants groupés par nature.
3. Donner un choix explicite entre les deux textures d'herbe **déjà présentes** ; conserver `forest` comme famille sémantique pour les deux. Aucune image de fleurs n'est inventée.
4. Dans le panneau Rencontres, créer une famille avec nom lisible et profil issu des commandes canoniques du World Builder ; aucun ID manuel. Le choix d'une famille personnalisée ne doit pas être écrasé lorsqu'on change seulement de texture.
5. Les modifications de familles restent dans `WorldDocument.terrainFamilies` et `WorldDocument.encounterConfig`, puis dans la sauvegarde existante du World Builder ; pas de nouveau stockage.
6. En mode Sculpt autonome (hors World Builder), la création de familles reste indisponible, pour ne pas inventer un deuxième stockage. Les fonctions d'édition existantes demeurent.

## Invariants et protection
- Aucun ID existant de matériau, terrain, portail, zone, objet ou famille ne change ; seule `grass.forest.alt` est ajoutée.
- Pas de réécriture automatique des tracés existants ; la réparation historique demeure opt-in et annulable.
- Collision, relief, rendu des ponts/escaliers, caméra, prix/économie et moteur Combat hors périmètre.
- L'ancienne version V80 reste intacte.
- Les assets historiques sont réutilisés, sans copie.

## Tests et critères de validation
- `npm test` et `npm run check` : contrôler sur CI du commit de la PR.
- `tests/sculpt-editor-terrain-ux-20261122.test.mjs` : variantes et famille personnalisée + round-trip JSON.
- Régressions : `tests/materials.test.js`, peinture/rencontres terrain, World Builder.
- Validation navigateur téléphone paysage / PC : ouverture Atelier en plein écran, accordéons, peinture herbe 1/2, famille « Haute herbe » 60 % avec éléments de Forêt, déplacement et export/import du monde.
- Vérifier ensuite exactement le SHA publié sur Pages avant de conclure GREEN.

## État / hors périmètre
- Branche et PR pour tests ; **pas GREEN ni publication déclarée avant CI + navigateur + HTTPS**.
- Les textures florales devront être créées/importées comme assets distincts dans un chantier visuel ultérieur ; l'éditeur expose maintenant le modèle des variantes existantes.

## Reprise du 22 novembre — précision de la demande
- Les familles sont **librement nommables**, pas un modèle « Haute herbe ». Le sélecteur propose Sol/zone, Route/chemin et Eau/rivière dans le WorldDocument canonique.
- Les volets existants sont conservés : les contrôles de forme et précision sont rangés dans l’Atelier ; la bordure décorative et les commandes de réinitialisation y trouvent un emplacement logique.
- L’Atelier fermé ne crée plus de bloc supplémentaire sous la carte. Un seul bouton dans la barre principale l’ouvre dans le viewport.
- Le matériau de base appartient au seul `WorldSurface.baseMaterialId`, réglé sous Textures > Sol de base.
- La palette de textures retrouve sa largeur mobile compacte d’origine.
