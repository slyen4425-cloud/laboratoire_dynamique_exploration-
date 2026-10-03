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


## Preview intégrée — Exploration → Combat → retour — 2026-10-03

### Code Exploration
- branche : `work/exploration-phase7-combat-handoff-v1-2026-10-03` ;
- HEAD code validé : `b71c132937b267044f5a31a2c68c3110d9a9d5be` ;
- CI : `37137766467` — **SUCCESS**.

### Code Combat
- preview : `preview/lab-exploration-encounter-bridge-v1-2026-10-03` ;
- SHA : `bf28ba7e5466177eff936e8a412c655b2c16cfa8` ;
- CI : `37137395260` — **SUCCESS**.

### Déploiement d'intégration
Le workflow Pages déploie côte à côte :
- Exploration à la racine ;
- Combat sous `combat-preview/`.

Cela garantit la même origine navigateur sans merger les branches gameplay dans `main`.

- PR infra : #50 ;
- main infra : `8aeaef9b6ee37e327276d321687013500c65adb0` ;
- Pages run : `37137861112` — **SUCCESS** ;
- artifact : `11278119826`.

### Vrai chemin
```text
rencontre terrain
 -> CaptureEncounterSnapshot v1
 -> bouton Lancer le combat
 -> handoff versionné sessionStorage
 -> Combat bridge 1v1
 -> vraie creatureId adverse
 -> Combat Runtime existant
 -> CaptureCombatResult v1
 -> retour URL Exploration
 -> restauration position Exploration
 -> résultat consommé une seule fois
```

Le provider labo `capture-party-preview` utilise explicitement Maraileron tant que la vraie équipe Capture n'est pas raccordée.

Pour une créature sans asset Combat lié :
- creatureId/stats/skills restent réels ;
- seule la présentation utilise un fallback générique explicitement marqué ;
- aucune substitution silencieuse par une autre créature.

### Gate smartphone
1. marcher jusqu'à une rencontre ;
2. toucher « Lancer le combat » ;
3. vérifier que le nom adverse correspond à la rencontre ;
4. jouer le combat réel ;
5. victoire/défaite doit revenir automatiquement à Exploration ;
6. vérifier même Area et même position ;
7. vérifier que le résultat n'est pas appliqué deux fois ;
8. reprendre la marche et obtenir de nouvelles rencontres normalement.

Statut : **PREVALIDATION smartphone — NON GREEN**.
