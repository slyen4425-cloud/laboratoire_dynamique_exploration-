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

## Jouer natif : identité de session Aventure GenSRPG (03/11/2026)

**Propriétaires** : GenSRPG Capture/Core Storage conserve `AdventureSession`, créatures/XP/loot/équipe et son `sessionId`; Labo Exploration conserve **uniquement** les coordonnées/zone et l'empreinte du véritable `WorldDocument` via le module public `src/play/exploration-play-session.js`. Ni combat ni inventaire ne sont lus depuis ce module.

**Contrat optionnel version 1** :
- Jouer autonome : `createNewExplorationPlay(storage,world)` et `readExplorationPlay(storage,world)` utilisent inchangée `gensrpg.exploration.play.navigation.v1`.
- Partie GenSRPG : `createNewExplorationPlay(storage,world,{sessionId})`, `readExplorationPlay(...,{sessionId})`, `createExplorationPlayProgressWriter(...,{sessionId})`, `saveExplorationPlayPosition(...,{sessionId})` utilisent `gensrpg.exploration.play.navigation.v1:<sessionId>`. Identité sûre et présente dans le checkpoint ; lecture d'une autre session refusée ; aucun fallback sur la clé autonome.
- Le seul lancement de navigation depuis GenSRPG est `sculpt-lab.html?play=1&adventureSession=<id>` au **même origin** que GenSRPG, après création d'une vraie `AdventureSession` et d'un checkpoint officiel. Le retour Menu conserve l'identifiant ; dans le menu scoped `play.html?adventureSession=<id>`, **Nouvelle partie est désactivé** (propriétaire GenSRPG), seul `Continuer` peut relancer la navigation existante.
- Si le monde est absent, modifié ou incompatible, la reprise est bloquée avec message ; pas de carte de démo ni de réparation de Portal. La sauvegarde demeure intacte.
- Le World Builder du Labo externe et celui embarqué dans GenSRPG ont des origines de navigateur différentes : les données privées de l'un ne doivent pas être aspirées depuis l'autre. Export/import ou même origine requis.

Cette API facultative ne modifie pas le déplacement, la caméra, les collisions, les rencontres, le résultat Combat, les options joueur ou la politique de sauvegarde de GenSRPG. Tests TDD Node + vrai Chromium sur deux sessions et Jouer autonome. Publication GenSRPG uniquement après promotion de cette API sur le **main officiel Exploration SHA exact** et certification par les tests consommateur.
