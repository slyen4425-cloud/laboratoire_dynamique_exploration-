# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Phase 7 — micro-lot 2 :
**Combat Handoff + CaptureCombatResult v1 + retour apply-once**.

## Branche
`work/exploration-phase7-combat-handoff-v1-2026-10-03`

## Base GREEN
`a3670b2bbeb069bb18b410d6e7debd77efe4545e`

## Dernier checkpoint GREEN
`checkpoint/exploration-phase7-encounter-controller-snapshot-v1-green-2026-10-03`

## Objectif
```text
Encounter Controller
 -> CaptureEncounterSnapshot v1
 -> transport same-origin versionné
 -> Capture Combat
 -> CaptureCombatResult v1
 -> retour Exploration
 -> application exactement une fois
```

## Autorités
- Exploration : position, monde, encounterId actif, retour ;
- Encounter Bridge : contrats publics uniquement ;
- Combat : résolution du combat ;
- CaptureDatabaseV1 : créatures/compétences/présentation ;
- transport : sessionStorage uniquement comme canal, jamais comme gameplay authority.

## Invariants
- Combat ne repositionne jamais le joueur ;
- résultat accepté seulement si encounterId + returnToken correspondent ;
- résultat consommé exactement une fois ;
- aucune copie de WorldDocument vers Combat ;
- aucune importation de fichiers internes du dépôt Combat ;
- aucun fallback silencieux vers une autre créature ;
- playerPartyRef reste opaque ; le labo Combat peut fournir un provider preview explicite pour capture-party-preview.

## Périmètre
- contrat CaptureCombatResult v1 ;
- enveloppe transport handoff v1 ;
- sauvegarde du point de retour Exploration hors snapshot Combat ;
- bouton lancer le combat ;
- lecture retour + apply-once ;
- résultat minimal victoire/défaite/fuite ;
- preview smartphone.

## Hors périmètre
- persistance production Core ;
- capture/reward définitifs ;
- vraie équipe Capture utilisateur ;
- modification Zombicide-40k.
