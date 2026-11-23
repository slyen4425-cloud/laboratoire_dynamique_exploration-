# Checkpoint — navigation autorisée réellement franchissable (#530), lot 2

Départ : `main@c1da0157379e24a29fa69d9b75f5902620745764` → branche `feat/navigation-authorize-corridors-20261123`.

## Contrat et absence de double autorité
1. Le volet Navigation existant présente trois modes : **Interdire** peint le masque, **Normal** l'efface, **Autoriser** trace un corridor de pente **pied → sommet**.
2. L'autorisation n'est pas un drapeau qui ignore la collision. `appendSculptNavigationAllowedCorridor` appelle le constructeur officiel `appendSculptTerrainRamp`, stocke son résultat dans le **seul** `SculptTerrain.ramps` et reste consommé par `sculptStairCorridor` et Collision World.
3. Le pinceau de Navigation conserve la largeur réglable, les gestes souris/doigt et l'aperçu. L'export/import, Undo/Redo et les cartes historiques sont conservés.
4. L'autorisation explicitement posée peut restaurer uniquement des interdictions situées sur son corridor ; les autres cases interdites restent telles quelles.
5. **Aucune eau non soutenue** : deux ancrages secs sont requis. Pas de faux pont, de téléportation, ni de contournement des falaises éloignées de la pente.
6. Aucun ID créé manuellement, aucun registre, aucune PWA ni module voisin changé.

## Validation demandée
- Test natif `tests/sculpt-navigation-authorize-corridors-20261123.test.mjs` et régressions `sculpt-natural-ramp-v77.test.js`, `sculpt-navigation-block-zones-20261123.test.mjs`.
- `npm run check`, suite complète `npm test`, Chromium `scripts/smoke-sculpt-terrain-lab.mjs`.
- PR SHA exact, CI + Pages verts, puis main CI/HTTPS avant toute synchronisation PWA.

**Statut initial : en vérification.** Ne pas annoncer terminé/GREEN sur création du document.
**Hors périmètre et ticket ouvert :** support eau gué/passerelle et trajet ajustable pied/sommet sur les assets d'escaliers (#530/#525).
