# START — Correctif fluidité sur la branche officielle du labo, 03/11/2026

## Contexte utilisateur
La prévisualisation tierce fondée sur la branche PR #338 n'affichait aucune carte sur son PC. Demande explicite de revenir à la publication et au lien habituels du laboratoire : correction visuelle validée techniquement puis publiée sur `main` **de Labo Exploration uniquement**, pour essai réel du PC. Ne pas raccorder `GenSRPG` ni démarrer le mode Jouer depuis cette opération.

## Source et lots indépendants
- Source canonique publiée : `main@9d5b198f193b73c1912dd21881311786415ba113` (CI et workflow Pages GREEN).
- Checkpoint START immuable : `checkpoint/exploration-render-fluidity-main-start-2026-11-03`, même SHA.
- Lot : `work/exploration-render-fluidity-main-2026-11-03` ; PR à ouvrir directement sur `main` une fois les changements préparés.
- PR #329/#335/#337/#338 restent **non fusionnées** : ne pas publier prématurément les cartes Forêt 1 / Plaine 1 ni le remplacement V80 ou les assets moulin/éolienne.
- Code de correction déjà éprouvé par la CI sur PR #338 (run 41619695579, succès Node+Chromium), mais ce SHA n'est PAS éligible tel quel à une publication sur `main` car il cumule des lots non acceptés. Refaire l'intégration minimale sur source canonique.
- RED : `tests/sculpt-navigation-frame-pacing.test.js` introduit avant correction au SHA `1bbfbf072f2a80c7c0ea461520921854f795307d`.

## Cause et correction
- Ancien rythme de Canvas limité à ~30 images/sec pendant marche par `navActor.moving ? 33 : 55` dans `navigationTick`, alors que déplacement/caméra calculés sur chaque RAF de l'écran.
- Correction : `scheduleDraw` déclenché à chaque RAF en mouvement ou en suivi d'altitude ; délai 55 ms seulement au repos. Conserver un unique propriétaire de rendu et de collision. Mesurer `navRenderFps` en comptant les vrais `draw()`, et afficher « Rendu FPS · Calcul FPS ».
- Mise à jour de l'URL d'import de `sculpt-lab-main.js` pour invalider le cache du navigateur.
- Éviter les changements hors périmètre : aucune carte, objet, import, règle, moteur, contenu ou navigation du hub modifiés.

## Portes de sortie
1. `npm test`, `npm run check`, gate réelle Chromium (présence de carte et du vrai acteur en Tester, rendu FPS) à la révision exacte.
2. PR vers `main` et merge seulement après GREEN CI ; publication par **seul workflow existant** `.github/workflows/publish-v81-main.yml`.
3. Vérifier workflow Pages et ressource publique `sculpt-lab.html` avec nouvelle signature, vérifier qu'un canevas de carte est présent; transmettre seulement alors le lien normal au joueur.
4. Après essai PC utilisateur, déterminer si la fluidité est satisfaisante ; le futur « Jouer une partie » GenSRPG sera traité indépendamment.

Aucun checkpoint GREEN déclaré avant preuves CI et publication du bon SHA.
