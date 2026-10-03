# Checkpoint GREEN — Phase 5 Wild Wander / Territory v1

Date : 2026-10-03

## Branche source
`work/exploration-phase5-wild-wander-territory-v1-2026-10-03`

## Checkpoint de départ
`checkpoint/exploration-start-phase5-wild-wander-territory-v1-2026-10-03`

## Base GREEN
`d1adf39e00e672bead1a3b257660fb6185c43eb7`

## SHA validé avant checkpoint
`54c2aeffbe2b8a2c0b657cdb16ef5241306d704c`

## CI
- technique finale : `37102975365` — SUCCESS
- documentation / décision encounter split : `37111802747` — SUCCESS

## Preview validée
- main preview : `c354c38f3e29b34af44d891022e848f586d8e80c`
- Pages run : `37103039046` — SUCCESS
- artifact : `11266883587`

## Validation smartphone utilisateur
**GREEN**.

Validé :
- errance terrestre ;
- errance aquatique dans la rivière ;
- errance volante au-dessus de l'eau ;
- respect du territoire ;
- aucune régression joueur / route / eau / pont / Portal / Builder / Map Actor.

## Décision produit figée
Les rencontres ordinaires ne reposent pas principalement sur des créatures visibles.

Cible :
- rencontres ordinaires -> Encounter Zones + tables pondérées ;
- routes sûres -> modificateur explicite de chance ;
- créatures visibles -> rencontres spéciales/scénarisées/rares/boss/quêtes.

Exemple :
- forêt : 80 % pool Terre/Herbe ;
- 20 % pool Neutre.

Interdit :
- dériver la chance ou le pool depuis `materialId` ;
- utiliser une texture comme règle de rencontre ;
- transformer implicitement `surface.zones[]` en zones de rencontre gameplay.

## Suite
Phase 5 micro-lot 5 :
**perception / poursuite / fuite v1** uniquement pour les créatures visibles.

Avant Phase 7 Encounter Bridge :
**Random Encounter Zone / Table Contract v1**.
