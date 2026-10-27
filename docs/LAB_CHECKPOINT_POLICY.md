# GenSrpG Exploration — Politique de checkpoints

Cette politique reprend la politique officielle GenSrpG.

## Démarrage d'un chantier

Avant le premier changement de code, configuration ou asset :

1. identifier le dernier SHA GREEN servant de base ;
2. créer un checkpoint de départ :
   `checkpoint/exploration-start-<chantier>-YYYY-MM-DD` ;
3. créer la branche de travail depuis exactement ce SHA :
   `work/exploration-<chantier>-YYYY-MM-DD` ;
4. mettre à jour `LAB_CURRENT_WORK.md` avec :
   - chantier ;
   - branche ;
   - checkpoint de départ ;
   - SHA de base ;
   - dernier checkpoint GREEN ;
   - périmètre ;
   - propriétaires ;
   - invariants/fonctions gelées ;
   - tests ;
   - risques ;
   - prochaine étape.

Le checkpoint de départ ne doit jamais être créé tardivement sur un état déjà modifié en le présentant comme le début.

## Pendant le chantier

- 1 lot = 1 branche = 1 périmètre homogène ;
- checkpoints intermédiaires possibles pour les jalons structuraux ;
- aucun nom de checkpoint réutilisé pour deux états ;
- `LAB_CURRENT_WORK.md` reste court et sert de point de reprise ;
- CI rouge = lot non validable ;
- une régression bloque le jalon jusqu'au diagnostic.

## Fin d'un jalon GREEN

Après tous les tests requis :

1. créer :
   `checkpoint/exploration-<chantier>-green-YYYY-MM-DD`
   sur le SHA exact validé ;
2. documenter :
   - branche source ;
   - SHA ;
   - périmètre ;
   - tests/runs ;
   - validation mobile/manuelle ;
   - régressions connues ;
   - prochaine étape ;
3. mettre à jour `LAB_CURRENT_WORK.md` ;
4. fournir un lien de test si comportement utilisateur ;
5. ne pas commencer le lot suivant avant son propre checkpoint de départ.

## Reprise dans un nouveau fil

La reprise doit pouvoir se faire avec :

1. `docs/LAB_CHARTE.md` ;
2. `docs/LAB_CURRENT_WORK.md` ;
3. le checkpoint indiqué dans `LAB_CURRENT_WORK.md`.

La mémoire d'une conversation n'est jamais l'autorité du dépôt.
