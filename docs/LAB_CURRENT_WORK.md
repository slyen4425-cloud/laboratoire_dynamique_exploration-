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


## Validation utilisateur partielle — Combat handoff — 2026-10-03

Test utilisateur depuis PC :
- la page Combat s'ouvre correctement depuis Exploration ;
- la créature adverse affichée correspond bien à la rencontre déclenchée ;
- l'identité adverse est donc validée sur le vrai chemin same-origin.

La gate restante concerne :
- énergie initiale ;
- recharge énergie ;
- utilisation d'une capacité ;
- fin de combat ;
- retour automatique Exploration ;
- même Area / même position ;
- résultat appliqué une seule fois.

Le lot reste NON GREEN jusqu'à validation complète.


## Incident de validation — showcase direct exclu — 2026-10-03

Retour utilisateur :
- ouverture directe sur un duel Combat ;
- énergie locale ne montait pas ;
- adversaire n'attaquait pas ;
- ce comportement ne validait pas le vrai flux Exploration -> Encounter -> Combat.

Cause :
- la preview Pages avait été basculée temporairement sur la branche Combat
  `preview/lab-showcase-duel-moussados-loup-energy-v1-2026-10-03` ;
- ce showcase est une page de duel autonome ;
- son adapter n'applique pas le ruleset `capture.standard.1v1` du raccord Exploration ;
- il ne doit donc pas servir de gate d'intégration.

Décision :
- showcase direct retiré du chemin de validation ;
- la preview imbriquée Combat revient à
  `preview/lab-exploration-encounter-energy-ruleset-v1-2026-10-03` ;
- cette branche applique le ruleset Combat avant création des FighterConfig :
  - maxEnergy = 12 ;
  - initialEnergy = 2 ;
  - energyChargeAmount = 1 ;
  - energyChargeIntervalMs = 1800 ;
- le runtime Combat existant reste seul propriétaire de la recharge ;
- l'IA existante reste seule propriétaire de ses décisions et utilise le même runtime.

Validation automatique Combat :
- branche preview énergie : SHA `25897307799d741710dfd9435854f7d813da1b33` ;
- CI `37140788133` — SUCCESS ;
- test d'intégration : énergie Fighter > 0 et recharge après `advanceMs` ;
- sentinelles IA historiques toujours présentes.

Preview Exploration restaurée :
- PR infra #53 ;
- main : `f958b559da4404dc31a2c3ed05d60f237d657526` ;
- Pages run `37144544743` — SUCCESS.

Nouvelle gate smartphone :
1. ouvrir Exploration à la racine, jamais la page showcase ;
2. marcher jusqu'à une rencontre ;
3. toucher « Lancer le combat » ;
4. le Combat doit démarrer à 2/12 énergie ;
5. l'énergie doit augmenter de 1 toutes les 1,8 s jusqu'à 12 ;
6. l'adversaire doit commencer à agir quand une capacité est utilisable ;
7. fin de combat -> retour automatique Exploration ;
8. même Area / même position ;
9. résultat appliqué une seule fois.

Le lot reste NON GREEN jusqu'à cette validation.

## Validation utilisateur finale — Combat Handoff — 2026-10-03

Retour utilisateur explicite :
- le test réel Exploration -> Encounter -> Combat a déjà été effectué ;
- le comportement est validé ;
- énergie / combat / retour Exploration sont considérés OK sur le chemin réel.

La gate smartphone/utilisateur du lot est donc levée.

État :
**GREEN utilisateur — le lot Combat Handoff v1 peut être clôturé et servir de base au lot suivant.**
