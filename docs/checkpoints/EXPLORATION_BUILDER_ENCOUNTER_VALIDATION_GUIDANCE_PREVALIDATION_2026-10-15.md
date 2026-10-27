# CHECKPOINT — Builder Encounter Validation Guidance v1 — 2026-10-15

## Source et frontières

- Base/code antérieurs : `def7aaaa4b0d24317d0f4dc4544da20c26b35b19`, preview Exploration + Combat moderne.
- Départ : `checkpoint/exploration-start-builder-encounter-validation-guidance-2026-10-15`.
- Travail : `work/exploration-builder-encounter-validation-guidance-2026-10-15`.
- Propriétaire : Builder UI. `validateWorldBuilderDraft` et `WorldDocument` conservent le contrôle des éléments et leur total. Les paramètres de probabilité restent la propriété de l'auteur.
- Hors périmètre : moteur Combat, Encounter Snapshot, retour, monde, terrain, route, caméra et GenSrpG principal.

## Signalement et solution

Le bouton Tester en jeu donnait le code nu `encounter-element-total:forest` lorsque les pourcentages d'éléments Forêt étaient non égaux à 100 %. Ce blocage est voulu pour éviter les configurations aléatoires incohérentes, mais le message était incompréhensible et ne menait pas au bon réglage.

La guidance est une projection pure des erreurs sur le `WorldDocument` normalisé :
- message localisé avec nom exact de famille, total mesuré et total requis ;
- préservation des autres codes d'erreur pour ne rien masquer ;
- navigation directe vers `Terrain > Rencontres par famille` de la famille concernée après clic sur Tester ;
- aucun changement, arrondi ni normalisation automatique des chances ;
- wrapping du texte dans le header mobile ;
- cache public CSS/JS versionné, sentinelles d'import réconciliées.

## Contrôles

- TDD RED : CI `38663295703` failure attendue à l'ajout des tests.
- CI GREEN : `38664200206` SUCCESS, `475/475` tests.
- Chrome réel dans CI : saisie Forêt Nature de 50 à 40, total à 90 ; bouton « Tester en jeu » refuse la navigation ; texte indique 90/100 et Forêt ; onglet Terrain activé, bonne famille sélectionnée ; lancement actuel Encounter Combat testé après.
- Le Chrome test assemble les références Capture originales : Combat `3f612ec0cf4adf4bf5aa0a2594131613ce16ceec` ; Capture global-assets `e55fea3b559c348be596d7c16250808a39c315a1`.

## Gate

Prévalidation technique uniquement ; publier la preview GitHub Pages isolée, puis demander retest Pixel en paysage et un test de carte corrigée menant bien au Combat. Aucun GREEN FINAL sans verdict utilisateur.
