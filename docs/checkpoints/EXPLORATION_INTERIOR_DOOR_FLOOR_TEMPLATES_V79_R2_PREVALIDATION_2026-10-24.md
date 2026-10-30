# V79 R2 — Porte intérieure, sols et modèles — prévalidation

Date : 2026-10-24. **Statut : prévalidation technique uniquement ; NON GREEN Pixel.**

## Gouvernance
- Source de départ R1 : `38016430e85b43701b26aeaa39c20252a0e702ec`.
- Checkpoint START : `checkpoint/exploration-start-interior-door-floor-templates-v79-r2-2026-10-24`.
- Branche métier : `work/exploration-interior-door-floor-templates-v79-r2-2026-10-24`.
- Aucune modification du dépôt principal ni du laboratoire Combat, ni du mouvement/Collision World, ni des rampes/escaliers validés.

## Ce que R2 change
1. Seuil/porte intérieure visible, positionnée depuis `exitPortal.trigger` (simple présentation ; retour extérieur conserve le même Portal et le même Spawn).
2. Même pack de cinq sols déjà détenu par Material Registry et Material Asset Adapter du Builder : chêne, bois foncé, carrelage clair, pierre sable, béton gris. Choix du sol de base de la pièce et peinture par zone dans la scène existante.
3. Modèles de pièces nommés, enregistrés localement, sérialisables dans `interiorTemplates[]` du JSON de scène, applicables à une autre maison. Le modèle copie terrain, objets, acteurs, sol ; ne copie jamais `Area`, `Portal`, `Spawn` ou `buildingId` ; l'utilisateur peut toujours éditer librement sans modèle.
4. `Retour extérieur`, sol, choix et enregistrement des modèles, angle caméra regroupés dans **la barre flottante existante**, visible en plein écran, pas dans un panneau hors-écran.

## Vérification technique
- Sentinelles Node : 797 tests réussis.
- Test `npm run check` syntaxe réussi.
- Browser Chromium réel : scénario de maison, ouverture d'intérieur, porte/retour canonique, angles, choix de sol, sauvegarde de modèle, remplacement de contenu, JSON export et présentation en palette flottante.
- Ces réussites doivent correspondre à la CI du SHA métier effectivement épinglé en Pages (ne jamais publier une source différente d'un SHA testé).

## Limites et prochaine étape
La construction native de murs, les portes intérieures physiques et les escaliers reliant des étages **ne sont pas présents dans R2**. Les simples murs de contour de V79 R1 demeurent décoratifs. Voir `docs/plans/EXPLORATION_INTERIOR_CONSTRUCTION_V79_R3_PLAN_2026-10-24.md` pour le découpage propriétaire unique, uniquement après retour Pixel.
Aucune fusion de la branche métier vers `main`. Publication de prévalidation seulement via PR infrastructure Pages épinglant le commit métier testé.
