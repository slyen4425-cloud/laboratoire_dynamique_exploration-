# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-01

## Chantier actif
Phase 1A — Core contract / configuration du mouvement sans changement de comportement.

## Branche
`work/exploration-phase1a-core-contract-2026-10-01`

## Checkpoint de départ
`checkpoint/exploration-start-phase1a-core-contract-2026-10-01`

## SHA de base
`a0804abc6b3c063538e1534ca833ed375f661a39`

## Dernier checkpoint GREEN
`checkpoint/exploration-governance-alignment-green-2026-10-01`

SHA :
`a0804abc6b3c063538e1534ca833ed375f661a39`

## État gelé à préserver
Phase 0 :
- déplacement continu X/Y ;
- stick tactile mobile ;
- vitesse ressentie actuellement validée ;
- diagonales normalisées ;
- collisions ;
- caméra ;
- aucune case comme autorité ;
- preview mobile fonctionnelle.

## Périmètre Phase 1A
- créer une configuration Exploration normalisée/versionnée ;
- sortir du runtime les valeurs de mouvement actuellement codées en dur :
  - vitesse maximale ;
  - rayon joueur ;
  - deadzone input ;
  - delta simulation maximal ;
- injecter la configuration dans le moteur ;
- ajouter des tests valeurs par défaut + valeurs personnalisées ;
- conserver exactement le comportement actuel avec les valeurs par défaut.

## Propriétaires
- config : Exploration Config ;
- mouvement : Exploration Engine ;
- collision : Collision World ;
- input : Input Adapter.

## Fichiers autorisés
- `src/config/` ;
- `src/core/config.js` ;
- `src/core/movement.js` si nécessaire pour injection ;
- `src/main.js` uniquement pour consommation de config ;
- tests ;
- documentation du lot.

## Hors périmètre
- accélération/freinage ;
- génération ;
- assets/sols/murs ;
- nouvelle UI ;
- sauvegarde ;
- combat ;
- modification d'un autre dépôt.

## Fonctions protégées
- collision existante ;
- caméra ;
- rendu ;
- virtual stick ;
- coordonnées X/Y ;
- sensation de vitesse par défaut.

## Tests requis
- défauts normalisés ;
- custom config réellement utilisée ;
- valeur personnalisée prioritaire sur le défaut ;
- diagonale toujours normalisée ;
- collision toujours GREEN ;
- architecture sentinels GREEN ;
- CI GREEN.

## Risque inter-module
Nul : laboratoire autonome, aucune dépendance ajoutée.

## Étape suivante si GREEN
Lot séparé Phase 1B ou Phase 2 visuel/assets, avec nouveau checkpoint de départ.
