# Audit de compatibilité — Exploration vers Capture Combat récent
Date : 2026-10-14

## 1. Sources contrôlées

- Dépôt Exploration : `slyen4425-cloud/laboratoire_dynamique_exploration-`.
- Point de reprise Exploration : `work/exploration-terrain-render-hitch-culling-2026-10-14` à `4fe529603528c6e7806eaf404275c13d8b3a8875`. Dernière preview publiée à `7016e240f7a65df8fcfe81a59abf23aa84bfbd16` (466/466 tests, `npm run check`, GREEN technique, validation utilisateur partielle).
- Preview Combat actuellement empaquetée par `.github/workflows/pages-preview.yml` : `preview/lab-exploration-battle-end-return-v1-2026-10-05` à `8f4b5ee033b444b75033a7fcb4aff2e835805f8e`.
- Référence Combat actuelle analysée : `gh-pages` à `c527e9ae578aa4bd07209f7fa2d69acecf372420` (14 octobre), **non intégrée ni publiée ici**. Cette version contient notamment les évolutions du HUD, de l'IA, des effets, du stun/esquive et des combats 1v1/2v2.

## 2. Chemin existant, autorité et invariants

```
Exploration / Encounter Controller
  -> CaptureEncounterSnapshot v1 (encounterId, partyRef, creatureId, returnToken)
  -> src/encounters/combat-handoff-navigation.js
  -> sessionStorage['gensrpg.capture.combat-handoff.v1']
  -> combat-preview/examples/dom-demo/exploration-encounter.html
  -> Combat native / Roster / UI
  -> CaptureCombatResult v1 (outcome, encounterId, returnToken)
  -> returnUrl?combatReturn=1
  -> Exploration consumeCombatResult(): apply-once
  -> restore exact currentAreaId, x, y
```

Le résultat appartient exclusivement à Combat. Le contrat de transport et la restauration de la position appartiennent exclusivement à Exploration. Les `src/encounters/*` du laboratoire Exploration sont déjà protégés par les tests de handoff/retour.

## 3. Écarts prouvés par comparaison de l'arbre des deux branches Combat

L'ancien arbre contient 705 fichiers, la référence moderne 1163. Il y a précisément 20 fichiers historiques absents de la référence moderne, dont 10 fichiers runtime/pont :

1. `examples/dom-demo/exploration-encounter.html`
2. `examples/dom-demo/exploration-encounter.js`
3. `data/capture/parties/player-party.v1.json`
4. `src/adapters/input/capture/exploration-encounter-combat-source-v1.js`
5. `src/catalogs/capture-combat-ruleset-catalog-v1.js`
6. `src/contracts/capture-combat-result-v1.js`
7. `src/contracts/capture-encounter-snapshot-v1.js`
8. `src/contracts/capture-party-v1.js`
9. `src/ui/exploration-encounter-handoff-v1.js`
10. `src/ui/exploration-encounter-visual-source-v1.js`

Les 10 autres sont des tests historiques correspondants. Ces anciens éléments sont de possibles sources de migration, **pas** des composants à recopier aveuglément : leurs appels et leurs schémas doivent être adaptés au Core Combat récent.

Écart fonctionnel bloquant confirmé :
- La page 5 octobre appelle `mountCoop2v2Test({ ..., onBattleEnd({outcome}) { ... } })`.
- La fonction du Combat récent `src/ui/combat-2v2-test-ui.js` n'accepte plus `onBattleEnd` et n'expose actuellement aucun événement de fin équivalent : elle renvoie principalement `format, session, runtime, rosterSnapshot, dispose`.
- Le Combat récent requiert des éléments HUD supplémentaires, notamment `[data-combat-energy-orbs="<actorId>"]`, absents de l'ancienne page.
- Le code récent n'a ni `exploration-encounter.html` ni `exploration-encounter.js`. Le fait de changer uniquement la branche checkout ferait donc tomber la navigation vers un fichier absent.

Ces écarts interdisent de déclarer le raccord compatible, même si le moteur isolé du labo Combat est GREEN.

## 4. Contrat cible (à réaliser par ses propriétaires)

**Côté Combat, lot distinct sous la charte Combat :**
- exposer une notification unique de fin effective de bataille (victoire/défaite ou issue contractuelle), déterminée par le propriétaire Combat à partir du roster et des règles natives, sans minuterie ni observateur DOM ;
- restituer un point d'entrée Encounter vers la vue Combat moderne, sans recopier l'ancienne logique métier, avec chargement des créatures et techniques de la source Capture autoritaire ;
- accepter `CaptureEncounterSnapshot v1` et produire `CaptureCombatResult v1` en préservant `encounterId/returnToken` ;
- vérifier le vrai chemin avec fixtures de combats, y compris KO + réserve et multi-combats.

**Côté Exploration, lot isolé :**
- conserver le même `sessionStorage`, contrat v1 et token, sauf migration versionnée explicitement testée ;
- basculer le checkout *après* publication d'une branche Combat interopérable figée sur SHA ;
- conserver l'ancienne preview/branch comme rollback indépendant ;
- tester lancement, scène actuelle, fin, retour exact, reprise de seconde rencontre et non-application double ;
- publier la preview isolée uniquement avec CI verte et essai navigateur, puis demander une validation réelle PC + Pixel.

## 5. Gardes de non-régression

- Une **référence Combat plus récente** ne signifie pas une **référence compatible**. Refusez toute publication du nouveau raccord si la page est absente ou si Combat ne fournit pas de signal de fin contractuel.
- Aucun code de la session Combat, aucune logique HP/KO, aucun renderer, aucune règle de compétences copiés dans Exploration pour réparer le raccord.
- Pas de `MutationObserver`, de polling global, de réécriture des pages Combat dans le workflow de publication, ni de résultat factice pour simuler une victoire.
- Ne pas mélanger ce lot avec terrain/culling, Builder, fondus de route, caméra configurable, XP/loot/économie.
- Une CI GREEN des deux dépôts ne dispense pas d'un test réel du flux complet sur PC et Pixel.
- Jusqu'à une qualification inter-dépôts, laisser la preview ancienne et la production inchangées.

## 6. Situation et suite

Statut 2026-10-14 : **ÉCART TECHNIQUE CONFIRMÉ / MIGRATION NON PUBLIABLE**. Ce document consigne le contrat avant de travailler sur une intégration séparée, conformément à `LAB_CHARTE` et `LAB_INTEGRATION_CONTRACT`.

Après la migration et la validation du vrai flux : reprendre, en lots distincts, (1) la transition/fondu des routes configurable, puis (2) la caméra de jeu configurable (`work/exploration-configurable-game-camera-2026-10-14`, actuellement suspendue). L'optimisation mobile lourde reste un chantier ultérieur déclenché par tests reproductibles.
