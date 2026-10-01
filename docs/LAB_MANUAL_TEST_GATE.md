# GenSrpG Exploration — Jalon de test manuel

## Principe

Les tests automatiques protègent le moteur.
Les comportements utilisateur tactiles/visuels exigent un test réel mobile avant GREEN.

## Sentinelle Phase 0 gelée

Scénario :
1. ouvrir la preview sur smartphone ;
2. utiliser le stick ;
3. se déplacer dans toutes les directions ;
4. vérifier les diagonales ;
5. heurter un obstacle ;
6. vérifier la caméra ;
7. vérifier absence de freeze.

Résultat 2026-10-01 :
GREEN utilisateur.

## Futurs jalons

### Mouvement avancé
- démarrage ;
- freinage ;
- changements de direction ;
- contrôle fin ;
- collision glissée ;
- confort tactile.

### Monde généré
- accessibilité globale ;
- aucun spawn bloqué ;
- chemins lisibles ;
- retour identique avec même seed.

### Builder
- créer ;
- enregistrer ;
- recharger ;
- obtenir la même carte runtime.

### Monde vivant
- IA locale ;
- pas de téléportation ;
- pas de freeze ;
- culling correct.

### Encounter Bridge
- déclenchement ;
- snapshot ;
- combat ;
- retour position exacte ;
- résultat appliqué une seule fois.

## Règle

Aucun test manuel ne remplace la CI.
Aucune CI ne remplace un test mobile pour l'ergonomie réelle.
Les deux sont requis lorsque le jalon touche les deux dimensions.
