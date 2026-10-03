# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Player Party Ref v1 — Exploration transporte uniquement la référence de party Capture.

## Branche
`work/exploration-player-party-ref-v1-2026-10-03`

## Base GREEN
`baec0fecede7b9117c3f58d801add3ea593d2796`

## Checkpoint de départ
`checkpoint/exploration-start-player-party-ref-v1-2026-10-03`

## Objectif
Conserver Exploration comme initiateur de rencontre sans lui donner la propriété du roster.

Chaîne cible :

```text
Capture session/bootstrap adapter
  -> active partyRef
  -> Encounter Intent
  -> CaptureEncounterSnapshot.player.partyRef
  -> Combat
```

## Règles
- aucune créature joueur copiée dans Exploration ;
- aucune stat/loadout/asset joueur dans le snapshot ;
- le WorldDocument ne possède pas la party ;
- Exploration ne fait que transporter une référence opaque ;
- Combat/Capture résout cette référence.

## Périmètre
- remplacer le literal `capture-party-preview` du bootstrap Exploration ;
- isoler le partyRef actif derrière un adapter Capture de laboratoire ;
- conserver le contrat `CaptureEncounterSnapshot v1` inchangé ;
- tests de frontière.

## Hors périmètre
- roster Combat ;
- édition de party ;
- persistence GenSrpG finale ;
- modification de `Zombicide-40k`.

## Critères GREEN
- Encounter Intent reçoit un partyRef via adapter ;
- aucun creatureId joueur dans Exploration ;
- snapshot inchangé ;
- CI SUCCESS.
