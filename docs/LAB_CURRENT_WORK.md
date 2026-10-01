# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Phase 1A — Core contract / configuration du mouvement — **GREEN / fermeture documentaire**.

## Branche
`work/exploration-phase1a-core-contract-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-phase1a-core-contract-2026-10-01`

## SHA de base
`a0804abc6b3c063538e1534ca833ed375f661a39`

## Dernier checkpoint GREEN
`checkpoint/exploration-governance-alignment-green-2026-10-01`

## Périmètre réalisé
- configuration Exploration versionnée ;
- valeurs Phase 0 sorties de `main.js` :
  - rayon joueur = 18 ;
  - vitesse max = 230 ;
  - deadzone = 0.05 ;
  - delta max = 0.033 ;
- injection de la vitesse dans Exploration Engine ;
- comportement par défaut conservé ;
- configuration personnalisée testée ;
- fallback invalide testable et centralisé.

## Propriétaires
- config : Exploration Config ;
- mouvement : Exploration Engine ;
- collision : Collision World ;
- input : Input Adapter.

## Fonctions gelées respectées
Aucun changement volontaire de :
- sensation de déplacement par défaut ;
- collision ;
- caméra ;
- renderer ;
- virtual stick ;
- coordonnées X/Y.

## Tests
CI au SHA technique `440917814739c61146bdeb3453e8c0494fa75cac` :
run `36875054596` — SUCCESS.

Couvre :
- defaults ;
- custom config ;
- fallback invalide ;
- vitesse injectée ;
- diagonales ;
- collision ;
- limites monde ;
- architecture sentinels.

## Test manuel
Non requis pour ce micro-lot : aucune valeur par défaut ni aucun comportement utilisateur ne change.
Le prochain lot visuel/assets fournira une preview mobile ciblée.

## Hors périmètre respecté
- aucune accélération/freinage ;
- aucun asset ;
- aucune génération ;
- aucune sauvegarde ;
- aucun combat ;
- aucun autre dépôt modifié.

## Prochaine étape
Créer le checkpoint GREEN Phase 1A, puis ouvrir un lot séparé d'audit/raccord d'assets visuels.
