# Lot — Liaisons directionnelles 2/3 zones (30 octobre 2026)

- **Branche :** `work/exploration-zone-entry-reciprocity-2026-10-30`, issue du lot de présets riches PR #301 à `a7a100f545ef1f7930c7c1185a0767a207b85435`.
- **Signal utilisateur :** retour terrain sur l'essai Android du World Builder et des passages/sons.
- **Réalisation :** A sortie est → B entrée ouest ; B entrée ouest → A sortie est. B sortie est peut mener vers C, jamais retour implicite vers A. Le moteur et les données Portals/Spawns WorldDocument restent uniques. Création de présets, réparation explicite d'anciens mondes et connexion manuelle utilisent les mêmes commandes de liaison ; Spawns d’arrivée sur la route sans bounce. Tests TDD physiques 2/3 zones, routes inverses, intérieurs et sauvegardes. Pas de migration silencieuse des Portals placés par l’utilisateur.
- **Invariants :** main et V80 protégés ; aucun double propriétaire ; Combat et données auteur depuis Combat main ; pas de publication sans preuves du SHA exact.
- **État :** branche isolée ; GREEN technique et expérience mobile à confirmer par CI + test utilisateur avant promotion dans la PR de prévisualisation.

---

# Lot — Présets 2,5D riches, villages et paysages (30 octobre 2026)

- **Branche isolée :** `work/exploration-rich-village-landscapes-2026-10-30`.
- **Départ :** `main@474aa42674c9bd976a8a5a8af684d65cbe848b61` ; checkpoint START `checkpoint/exploration-rich-village-landscapes-start-2026-10-30`.
- **Signal utilisateur :** huit présets existants trop vides, trop peu de maisons, aucune cascade ni pont ; attentes : villages et paysages 2,5D plus riches, entrées de maisons avec véritables intérieurs.
- **Autorité :** présets natifs `src/builder/sculpt-builtin-map-presets.js`, aucun moteur secondaire de WorldArea, WorldDocument, collision, rendu, Portals, rencontres ou Combat.
- **Périmètre réalisé :** huit présets et IDs préservés ; 38 bâtiments dont auberges, étangs et plans d'eau sur les huit biomes, 7 ponts 2,5D et 7 cascades animées provenant des assets existants. Accès maisons/berges par les outils WorldSurface officiels ; instanciation par WorldArea et intérieurs liés indépendants via `createBuildingInteriorLink`.
- **Invariants protégés :** Spawn et Portal du WorldDocument, routes de bord à bord et collisions conservés, catalogues et bibliothèque personnalisée inchangés, V80 gelée, moteur Combat exclusivement depuis son main.
- **TDD RED puis correctifs cause racine :** `41103645764` : absence de densité sur les anciennes cartes ; `41104910246` : chemin de la clairière coupé par un étang ; `41105455220` : collision d'un pont avec l'accès principal. Corrigés par le placement des éléments et l'orientation des ponts, **sans** toucher au propriétaire des collisions.
- **Contrôles CI du commit `6028678ac19bb851e1be0054157b6a01ad27e2a8` :** `Exploration CI #41105841823` **SUCCESS** (`core-tests` : 921 tests, 0 échec ; `modern-combat-encounter` : vrais Chromium GREEN), `publish-v81-main.yml #41105841826` **SUCCESS** (`detect-upstream` + `verify-and-assemble` verts). Le job `deploy` est **skipped** sur PR, sans modification de la production.
- **Reste à valider :** rendu esthétique réel de chaque préset et confort/performance sur Pixel paysage, entrées/sorties des maisons, ponts/cascades, import/export et absence de blocage tactile. La CI n'est pas une validation manuelle. PR #301 reste **draft**, pas de checkpoint final GREEN et pas de fusion `main` avant validation de ce jalon.
- **Hors périmètre :** nouvelles images, nouvelles règles de rencontre, refonte relief, second publisher ou modification de GenSrpg/Combat.
- **Prochaine étape autorisée :** fournir une prévisualisation isolée réellement testable sans déroger à l'autorité Pages unique, puis recueillir la validation mobile. Si la preview nécessite une promotion, demander explicitement son feu vert au lieu de contourner le workflow.


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
