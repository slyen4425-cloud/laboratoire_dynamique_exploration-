# GenSrpG Exploration — Coordination

## État actif — 2026-10-03
Phase 5 — Monde vivant — **Errance / Territoire v1**.

Branche :
`work/exploration-phase5-wild-wander-territory-v1-2026-10-03`

Base GREEN :
`d1adf39e00e672bead1a3b257660fb6185c43eb7`

Checkpoint de départ :
`checkpoint/exploration-start-phase5-wild-wander-territory-v1-2026-10-03`

Dernier checkpoint GREEN :
`checkpoint/exploration-phase5-wild-runtime-presence-v1-green-2026-10-03`

## Invariants
- ground / swim / fly viennent de Actor Definition ;
- Living World ne donne jamais une capacité de locomotion ;
- mouvement autonome réutilise Exploration Core ;
- Collision/Traversal seules autorités de passabilité ;
- territoire vient de homeZoneId ;
- aucun timer global ;
- aucun second renderer ;
- aucun autre dépôt.

## Suite
Après GREEN :
micro-lot 5 — perception / poursuite / fuite v1 **uniquement pour les créatures visibles**.

Décision produit 2026-10-03 :
- rencontres ordinaires = Encounter Zones + tables pondérées ;
- routes sûres = modificateur gameplay explicite de chance ;
- créatures visibles = rencontres spéciales/scénarisées/rares/boss/quêtes ;
- aucune chance de rencontre dérivée de materialId/texture.

Le contrat Random Encounter Zone / Table v1 sera traité avant le raccord Encounter Bridge.
