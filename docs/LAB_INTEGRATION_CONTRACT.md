# GenSrpG Exploration — Contrat d'intégration future

Ce document empêche le laboratoire de devenir une architecture parallèle incompatible avec GenSrpG.

## Destination cible

Le sous-système doit pouvoir rejoindre :

`assets/gensrpg/capture/exploration/`

ou une structure équivalente décidée au moment de l'intégration.

## Dépendances autorisées à terme

Exploration peut dépendre de contrats publics :
- Core storage ;
- Core asset resolver ;
- Core event bus/utilitaires réellement communs ;
- Shell pour entrée/sortie du module ;
- Capture runtime pour contexte de session ;
- Capture Combat via Encounter Bridge.

Exploration ne dépend pas directement :
- d'internes Dungeon ;
- d'internes Survie ;
- de Tactical Dungeon ;
- de PvP ;
- du DOM global GenSrpG.

## Contrat rencontre

### CaptureEncounterSnapshot v1

Doit contenir uniquement les données nécessaires au combat, par exemple :
- version ;
- encounterId ;
- player/party refs ou snapshot requis ;
- opponent refs/snapshot requis ;
- règles de combat ;
- contexte minimal utile ;
- returnToken opaque pour Exploration.

### CaptureCombatResult v1

Doit contenir :
- version ;
- encounterId ;
- outcome ;
- états persistants à appliquer ;
- récompenses/capture éventuelle ;
- effets monde explicitement contractuels ;
- returnToken.

## Retour exploration

Exploration applique le résultat une seule fois et conserve :
- position ;
- seed ;
- état monde ;
- entités persistantes ;
- événements consommés.

Combat ne repositionne pas directement le joueur dans le monde.

## Builder

Le Builder exporte un WorldDocument versionné.

Le runtime consomme ce document.
Le Builder n'est jamais chargé comme autorité pendant l'exploration.

## Migration depuis le labo

Avant import dans GenSrpG :
1. cartographier chaque fichier ;
2. identifier son propriétaire ;
3. remplacer adapters locaux par services GenSrpG ;
4. supprimer les doublons ;
5. conserver tests ;
6. ajouter tests de non-interférence Capture/Dungeon/Survie/PvP ;
7. ouvrir un lot d'intégration dédié côté GenSrpG ;
8. ne rien merger tant que le raccord réel n'est pas GREEN.
