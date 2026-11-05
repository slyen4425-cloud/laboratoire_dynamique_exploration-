# START — Réconciliation des 10 arènes élémentaires (2026-11-05)

- Source de confiance : PR #359 au SHA c1aee37d154400eefe50a978bad5a045758803f6, toutes les images déjà matérialisées et contrôlées.
- Base main@7155516b51db9892183cc043837037c4c87a0315, branche dédiée work/exploration-elemental-arenas-main-reconcile-2026-11-05. Aucun rebase aveugle de la PR #359 en conflit.
- RED : restaurer le test officiel en premier et exiger 10 WebP + 10 PNG, le manifeste et les définitions natives.
- GREEN : 10 bâtiments 2,5D visuels dans Bâtiments > Arènes élémentaires, aucune porte/interaction, aucun faux obstacle ni règles d'arène; test Chromium réel du placement/asset + CI complète.
- Ne modifier ni Combat, Jouer, Dungeon, les arènes de championnat ni le V80 figé; ne pas confondre art de bâtiment et mécanique d'arène.
- Publication seulement après fusion sécurisée, CI du SHA exact, Pages HTTPS et visibilité des objets dans World Builder.
