# Constructeur de mondes — régions uniquement sur le plan général (2026-11-15)

## Périmètre et départ
- Labo Exploration, base `main@e023ddab2e7716c360c56be5e2628b6be405cd21`.
- Branche isolée : `work/world-assembler-regions-only-20261115`.
- Propriétaire : UI World Assembler (`src/builder/world-assembler-main.js`).
- Problème : maisons, instances et donjons déjà visibles dans le contenu d'une région sont également rendus comme nœuds et flèches sur la carte générale.

## Correction et autorité
- La vue du plan n'affiche que les `WorldArea.kind === 'exterior'`, et uniquement les `Portal` entre deux régions extérieures.
- Les maisons, donjons et instances demeurent des `WorldArea` officielles, accessibles dans le contenu de leurs régions ; les liens de gameplay et retours sont inchangés.
- Le panneau de gauche liste les régions. Seules les instances réellement inaccessibles depuis toute région disposent d'une entrée de dépannage repliée.
- Projection pure, non persistée, fondée exclusivement sur `WorldDocument.areas` et `WorldDocument.portals`. Aucune seconde carte, aucune mutation d'IDs ou de sauvegardes.
- Le décompte des flèches du plan distingue les passages inter-régions. Le total réel de passages reste présent en infobulle.

## Garde-fous
- Ne pas toucher au moteur de déplacement/collision, aux outils Sculpt, aux éditions d'étages/murs en PR #471, ni aux autres dépôts et modes.
- Conserver les exports/imports et les passages aller-retour des intérieurs/donjons.
- Test : `tests/world-assembler-overview-regions-only-20261115.test.js`, puis `npm test`, `npm run check`, CI et publication du SHA exact avant statut GREEN.
- Un retour utilisateur et un vrai test visuel mobile restent nécessaires avant validation finale.
