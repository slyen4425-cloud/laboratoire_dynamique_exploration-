# LAB_CURRENT_WORK — Rencontres terrain dans l'exploration 2,5D (reprise V80)

Date : 2026-10-27
Branche : `work/exploration-v80-encounters-terrain-owner-20261027`
Base V80 : `work/exploration-restart-from-v80-20261027`
Checkpoint de départ : `checkpoint/exploration-start-v80-encounters-2026-10-27`, ancré sur la base V80 intacte ; créé tardivement après les premiers commits (mention conservée pour traçabilité).
PR de travail : #256 — DRAFT — ne pas fusionner ni publier sans validations requises.

## Propriétaires uniques
- Exploration `stepMovement` + Collision World : position et mouvement du héros, déjà validés sur smartphone.
- `WorldSurface` v3 : géométrie et `terrainFamilyId` canoniques ; la texture `materialId` reste visuelle. La scène sculptée n'infère plus jamais la famille depuis la texture.
- `Encounter Controller` officiel : cadence de marche, déclenchement, verrou, `resetAnchor` sur téléportation/mode édition.
- `Terrain Family Encounter Resolver` officiel : sélection depuis la configuration existante (ici le `demoWorldDocument.encounterConfig` en lecture seule pour la preview) et le catalogue Capture (même snapshot read-only que le runtime 2D).
- `Encounter Bridge`, `CaptureEncounterSnapshot v1`, `Combat Handoff Store`, `Immersive Encounter Host v1` et `resolveExplorationCombatReturn` : combat réel et retour de position. Pas de combat factice.

## Travail réalisé
1. Suppression du nouveau sélecteur en doublon ; conservation du contrôleur historique.
2. Correction de l'absence de famille canonique / Area discordante ; aucun fallback visuel inventé.
3. Séparation de la famille de terrain et de la texture du pinceau 2,5D ; export/import de la famille de base sans trait peint.
4. Projection **sans stockage concurrent** du WorldSurface sculpté en entrée WorldArea du contrôleur officiel.
5. Le mode « Tester » appelle le contrôleur **après** mouvement/collision, sur la vraie position du héros. Il affiche la rencontre, bloque le déplacement, propose Continuer ou Lance le combat ; la fenêtre Combat provient des mêmes modules que le runtime 2D. Le retour Combat remet la position canonique du héros et libère le verrou.
6. Réinitialisation de l'ancre de distance sur nouvelle session, repositionnement et transition Portal, sans compter la téléportation comme déplacement.
7. Le HTML V80 gelé (sans nouvelle palette) conserve un boot Chromium vérifié ; aucune mutation de la version publiée.

## TDD, preuve CI et frontières
- Les tests RED précédents ont reproduit les erreurs de fallback de famille, Area discordante, couplage texture/famille et ancien test des quatre portes WebP.
- Nouveau test ciblé : `tests/sculpt-encounter-movement-bridge.test.js` (projection, vraie cadence, snapshot, verrou, intérieur sûr, repositionnement).
- CI `40577424075` sur SHA `bbf39aafb4d0aaa2559d3687df1f6af1ea16d431` : `npm test` 837/837 PASS, `npm run check` PASS, Chromium de la scène réelle PASS ; vraie marche, pause, reprise et ouverture de l'iframe Combat vérifiées.
- Sentinelle navigateur renforcée sur SHA `f98d88b6285f84dfdab680c5357caa97f88cc1e0` : exige que l'iframe affiche une arène Capture jouable avec ses capacités et PV, pas uniquement le bon URL. CI en attente au moment de cette mise à jour.
- Tests de frontière : pas de déclenchement par pixels, pas de moteur concurrent, intérieur sans rencontre par défaut, retour Combat par contrat seulement, HTML V80 conservé.

## État / prochains gates
NON GREEN tant que la CI du dernier SHA n'est pas vérifiée et la preview sur smartphone paysage validée. Aucun checkpoint final GREEN, aucune fusion, aucun déploiement de production.
La configuration des probabilités employée par cette preview est **celle du monde de démonstration Exploration déjà utilisé en 2D**, pas une nouvelle configuration enregistrée par le labo sculptable. Le raccord futur à un WorldDocument de l'utilisateur devra injecter sa configuration officielle, sans introduire une deuxième autorité.
