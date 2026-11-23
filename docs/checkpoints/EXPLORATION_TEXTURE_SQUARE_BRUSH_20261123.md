# Exploration — checkpoint PR du pinceau carré de TEXTURE (#526)

- Source initiale : `main@57ca20e6647cc49ad16fdd8f02c88f8aca3ebe1a` (CI/Pages GREEN).
- Objectif : **pinceau de texture** carré et rond, sans toucher au pinceau de sculpture relief/eau déjà disponible.
- Autorité : le seul `WorldSurface v3` ajoute `brushShape: "square"` uniquement si sélectionné. Les traits anciens sans champ continuent **exactement** en rond.
- La même empreinte carrée balayée le long des points est partagée par le moteur des rencontres, les zones traversables, le rendu 2D, le rendu 2,5D et l'aperçu d'édition.
- La palette actuelle `Textures du terrain → Peindre le terrain` accueille uniquement un sélecteur de forme. Pas de second onglet, catalogue, texture ou famille.
- Tests de contrat et parcours réel `tests/sculpt-surface-square-brush-20261123.test.mjs`, tests existants de neige, routes et joints textures, puis Chromium et GitHub Actions CI.
- Aucune mutation du moteur collision hauteur/eau, PNJ, CreatureDefinition, combat, entrée/sortie, sauvegarde historique, URLs Pages, ZIP ou sprites.
- **À ne pas annoncer comme livré** avant CI de la SHA finale, fusion sur `main`, contrôles Pages et raccord PWA validé.
- L'outil hors-terrain de pourtour décoratif et les tracés de passage physique sur l'eau sont des responsabilités distinctes : ne pas inventer de second moteur.
