# GenSrpG — Laboratoire Exploration

Laboratoire isolé consacré au moteur d'exploration libre de **Monster Capture / GenSrpG**.

Objectif : déplacement fluide sans cases comme autorité, monde continu, génération/édition de cartes, interactions et raccord futur au combat Capture.

## Position architecturale

Ce dépôt est un laboratoire indépendant, mais son architecture doit rester compatible avec la charte du projet principal `slyen4425-cloud/Zombicide-40k`.

Il ne constitue pas un cinquième module de jeu. À terme, son rôle cible est un sous-système de **Monster Capture**, typiquement :

`Capture -> Exploration -> Encounter contract -> Capture Combat`

Le laboratoire ne modifie jamais directement :
- `slyen4425-cloud/Zombicide-40k` ;
- `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

Tout raccord inter-dépôts passe par un contrat documenté et une intégration dédiée ultérieure.

## Gouvernance obligatoire

Avant toute reprise, lire dans cet ordre :

1. `docs/LAB_CHARTE.md`
2. `docs/LAB_DEVELOPMENT_RULES.md`
3. `docs/LAB_ROADMAP.md`
4. `docs/LAB_CURRENT_WORK.md`
5. `docs/LAB_COORDINATION.md`
6. `docs/LAB_MODULE_OWNERSHIP.md`
7. `docs/LAB_ARCHITECTURE.md`
8. `docs/LAB_TECHNICAL_GUARDRAILS.md`
9. `docs/LAB_CHECKPOINT_POLICY.md`
10. `docs/LAB_MANUAL_TEST_GATE.md`
11. `docs/LAB_INTEGRATION_CONTRACT.md`

## Règle de reprise

Un nouveau fil doit pouvoir reprendre le chantier à partir de :
- la charte ;
- `LAB_CURRENT_WORK.md` ;
- le checkpoint indiqué dans ce fichier.

Ne jamais repartir uniquement de la mémoire d'une conversation.
