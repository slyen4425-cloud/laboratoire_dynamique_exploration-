# Prévalidation technique — Sélection d'éléments par cases et tirage de créature par rareté

Date : 15 octobre 2026
Dépôt : laboratoire Exploration Dynamique
Branche : `work/exploration-encounter-element-selection-2026-10-15`
Départ : `checkpoint/exploration-start-encounter-element-selection-2026-10-15` sur `4887dc24288413f87ec130e18f7aeb4857307850`
Source de code épinglée : `545d0395ec608ce44f9a7d8a1f469d5f80a4701a`
CI : https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/38747467211 — **SUCCESS**, 484 tests / 484, check JS, audit inter-dépôts et Chromium.

## Règle fonctionnelle

1. Un pourcentage de chance de rencontre par famille, testé uniquement quand le personnage se déplace au palier du contrôleur.
2. Une liste de cases d'éléments possibles, dont le coché/décoché est persistant dans le WorldDocument.
3. Après succès de la chance, **un pool unique** des créatures Capture dont au moins un des éléments est autorisé et dont la rareté `spawnChance` est positive. Chaque créature multi-élément compte **une seule fois**.
4. Le choix de créature se fait par pondération sur la **rareté intrinsèque de chaque créature**, sans un premier tirage pondéré par élément. Le type contextuel transmis au Combat correspond à un élément autorisé de la créature choisie.

## Compatibilité et propriété des données

- Conservation de `encounterConfig.families[].elementChances` version 1 comme **transport historique de l'appartenance aux éléments** : toute ancienne entrée avec chance positive équivaut à une case cochée. Les nombres historiques ne jouent plus aucun rôle dans les poids du tirage et ne sont plus modifiables par l'interface. Un nouvel élément coché est sauvegardé avec un marqueur positif (`chancePercent: 1`) ; une case décochée retire l'entrée. Pas de nouveau schéma concurrent.
- Validation uniquement lorsqu'une famille a une chance positive mais aucun élément coché : `encounter-elements-empty:<familyId>` avec diagnostic français, navigation vers la famille.
- Zone de jeu/Area et famille terrain inchangées ; interdiction de rencontres Area conservée, intégrité import/export conservée.
- Aucun changement du moteur Combat, des définitions de créatures ou de rareté, des collisions, de la caméra, de la production.

## Tests vérifiés

- Variantes feu/eau, rareté pondérée unique et créature bi-élément non doublée ; chance zéro exclue.
- Model WorldDocument, import/export, Builder de carte vierge et anciens profils.
- Chromium réel : validation vide, UI de cases cochées, retour au document valide, navigation Tester en jeu, déplacement sur Forêt jusqu'à Encounter natif Terre.
- Architecture/cache et smoke Combat séparés conservés.

## Limites / validation restante

**GREEN TECHNIQUE, pas GREEN FINAL**. Publication isolée GitHub Pages, validation sur Pixel paysage, puis vrai combat complet aller-retour requis. Le combat de la preview restera volontairement au snapshot existant jusqu'au lot séparé de raccord du moteur Combat actuel ; ne jamais présenter cette version comme actuelle.
