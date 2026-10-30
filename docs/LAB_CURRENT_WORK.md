# Lot — Présets 2,5D riches, villages et paysages (30 octobre 2026)

- **Branche isolée :** \`work/exploration-rich-village-landscapes-2026-10-30\`.
- **Départ :** \`main@474aa42674c9bd976a8a5a8af684d65cbe848b61\` ; checkpoint \`checkpoint/exploration-rich-village-landscapes-start-2026-10-30\`.
- **Signal utilisateur :** huit présets existants trop vides, trop peu de maisons, aucune cascade ni pont ; attentes : villages et paysages 2,5D plus riches, entrées de maisons avec véritables intérieurs.
- **Propriétaire :** couche d'assemblage des présets natifs \`src/builder/sculpt-builtin-map-presets.js\` ; pas de nouvelle autorité WorldArea, WorldDocument, collisions, rendu, musique ou Combat.
- **Invariants gelés :** 8 identifiants de présets inchangés, chemins bord-à-bord, Spawn/Portal WorldDocument, présets utilisateur et V80 inchangés ; catalogue de visuels existant exclusivement ; chaque habitation raccordée à sa propre Area intérieure par le mécanisme déjà éprouvé.
- **Implémentation :** plans de hameaux et villages plus habités ; vrais coups de pinceau eau/sol/chemins, ponts 2,5D au-dessus de l'eau, cascades animées et points d'eau dans différents biomes ; routes d'accès aux maisons et aux berges contrôlées contre l'eau.
- **Tests :** TDD nouveaux tests de richesse et raccord d'intérieurs, \`npm test\`, \`npm run check\`, sentinelles de parcours physiques forêt ↔ neige, tests navigateur via CI Exploration ; ne pas annoncer GREEN avant les preuves et validation visuelle mobile.
- **Hors périmètre :** nouvelles images/animations, refonte du moteur de relief, changement des règles de rencontre, publication \`main\` non sollicitée.
- **Risques :** performance/quantité de maisons et d'intérieurs sur téléphone, collision des accès, pont et relief visuel ; la CI ne remplace pas le test tactile/visuel réel.
- **État :** lot de travail, pas encore GREEN ; \`main\` et Pages stables.

---

# Lot correctif — source Combat main exclusivement (30 octobre 2026)

- Branche `work/exploration-combat-main-only-2026-10-30`, départ `main@200025735bb49145f4a60258ba6d63a7a4aea774`.
- Exigence utilisateur : Exploration ne peut consommer aucune définition de compétence ou de créature venant de Combat `gh-pages` ; seule la promotion explicite sur Combat `main` autorise sa prise en compte.
- Avant : moteur Combat `main`, mais données auteur `gh-pages@4fd0821545eaa41ce1d3115e56f3574db6273426`, non conforme.
- Après : moteur et données auteur du même SHA Combat `main` contrôlé à l'assemblage. Un changement incompatible échoue explicitement la CI : aucune dégradation ni retour silencieux à `gh-pages`.
- Le catalogue graphique `global-assets` est une branche média dédiée préexistante, non une autorité de règles Combat ; séparation à traiter explicitement si la politique `main` doit aussi inclure les binaires médias. Ne pas casser les visuels sans migration validée.
- Tests requis : CI Node/Chromium native, publication de l'artefact compilé, preuves HTTPS ; V80 protégée tant que non-promue.
- L'absence actuelle de la réaction Défense de Moussados dans les données de Combat `main` n'autorise pas sa copie depuis `gh-pages`.

---

# LAB_CURRENT_WORK — promotion de l'Exploration 2,5D validée vers main (30 octobre 2026)

## Autorité et périmètre
- Lot : `work/exploration-main-source-promotion-2026-10-30`.
- Départ main : `1aee007a1f7493512c4ed6416581d4f5953d5fdf`.
- Source unique validée : `checkpoint/exploration-audio-playback-gesture-green-2026-10-30` (`3a0a6ec4bad257f28577d54cd3e23e557e05d9b4`).
- Validation utilisateur du comportement audio Exploration faite le 30 octobre 2026.
- Promouvoir dans `main` le code complet (`src`, `assets`, Builder, World Assembler, Exploration 2,5D, contrats, tests) sans dupliquer l'autorité Combat ; les documents principaux récents de `main` restent autoritaires.

## Raccord de publication
- Le seul publisher Pages est `.github/workflows/publish-v81-main.yml`.
- Build Explorer depuis le SHA exact du `main` publié (ou de la tête PR pendant revue), jamais depuis une branche de travail oubliée.
- Moteur Combat : dépôt Combat `main` officiel ; catalogue visuel : `global-assets`.
- Données auteur : snapshot officiel vérifié `gh-pages@4fd0821545eaa41ce1d3115e56f3574db6273426` pour cette version validée. Le `gh-pages` plus récent contient `force_reserve_switch` que le contrat moteur `main` n'accepte pas encore. Les nouvelles mécaniques auteur ne sont **pas** dégradées ni supprimées pour faciliter la publication : elles nécessitent une version Combat main compatible et un nouveau GREEN avant promotion.
- V80 historique `933c852c41c4511cb0eed0717c246cc6b19aeddc` strictement protégée.
- Les 4 copies MP3 d'exploration correspondent aux binaires approuvés et testés, les masters restent privés.

## Critères de clôture
- PR avec diff contrôlé et unique source `main`, aucun deuxième publisher.
- CI Node + vrais tests Chromium, dont lecture réelle d'un MP3 sur clic Tester, passage Combat retour, World Builder et sauvegardes.
- Assemblage Pages + 4 SHA256 MP3 + vérification HTTP + preuve V80 identique.
- Checkpoint final GREEN avec SHA et runs ; pas de déclaration GREEN sans preuve.
