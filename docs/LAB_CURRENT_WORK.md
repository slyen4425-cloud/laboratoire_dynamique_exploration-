# LAB_CURRENT_WORK — Un seul atelier Monde / Carte 2,5D

Date : 2026-10-28.
Base GREEN `6f15b02ac0eea0b5cb6adea18dae34cafef8e679` (867/867 Node tests, Chromium réel, Pages isolées V80).
Branche : `work/exploration-unified-world-map-workspace-2026-10-28`.
START : `checkpoint/exploration-start-unified-world-map-workspace-2026-10-28`.

## Problème produit
La navigation historique envoie parfois vers `sculpt-lab.html` sans le contexte WorldDocument, donc une scène prototype séparée au lieu de la WorldArea sélectionnée. Le bouton Retour du World Builder pointe directement sur le prototype autonome. Les commandes de création de WorldArea ne permettent pas de choisir les dimensions alors que la nouvelle carte du prototype le permet. Ce sont des différences artificielles entre vues d'un même éditeur.

## Décision et autorité
Un seul atelier fonctionnel : World Builder (liste des WorldAreas et Portals) ⇄ Carte 2,5D (édition de la WorldArea sélectionnée) avec boutons d'onglet identiques. **Un seul WorldDocument** dans `world-assembler-handoff` et `world-assembler-document`, même draft propriétaire, zéro copie persistante parallèle. Le prototype historique autonome reste disponible uniquement comme outil de compatibilité/laboratoire, non comme porte d'entrée dans l'atelier unifié.

Périmètre :
- rendre la navigation entre onglets évidente sans passer de l'atelier au prototype par inadvertance ;
- autoriser le choix de la taille (8–80 × 8–64 cases) pendant l'ajout d'une zone ou d'un donjon depuis le World Builder ;
- reprendre mêmes réglages par défaut au changement de type, sans changer les tailles choisies manuellement ;
- préserver la scène et les liens lors des retours de l'édition Carte 2,5D ;
- tests TDD + Browser smartphone réel ; produit V80 toujours isolé.

Hors périmètre du premier lot : migration destructrice/automatique des anciennes scènes isolées vers un WorldDocument ; redimensionnement silencieux d'une WorldArea complexe déjà construite ; fusion des moteurs graphiques 2D/2,5D ou duplication d'un état.
