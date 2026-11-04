# START — Arènes élémentaires 2,5D (04/11/2026)

- **Base protégée** : Exploration `main@699c87f83ac6b87fb77fb7ca340008b97d538e02`.
- **Lot unique** : `work/exploration-elemental-arenas-assets-2026-11-04`.
- **Source fournie** : `arenes_10_elements_monster_capture_png_transparents.zip`, SHA-256 `6cde858a912e99ad7be38ab444733bdd9d573949c8f19d5d453c0a22a617b191`.
- **Objectif** : importer 10 bâtiments d'arène élémentaire statiques 2,5D (Nature, Feu, Eau, Air, Terre, Foudre, Glace, Lumière, Ténèbres, Arcane) dans le catalogue officiel du World Builder.
- **Propriétaire unique** : Object Definition Catalog + World Object Asset Adapter ; moteur Exploration conservé.
- **Périmètre** : 10 PNG + WebP RGBA 512×512 extraits sans altération, manifeste avec hash/taille, dossier de bibliothèque, définitions natives, adapter, tests de résolution et fichier effectif.
- **Précaution** : visuels plaçables, mais aucun combat, championnat, portail, porte ni collision inventée pour ces arènes. `footprint.enabled=false` jusqu'à configuration réelle.
- **TDD** : test RED d'abord (fichiers/manifeste/catalogues absents), puis résolution, matérialisation par CI au SHA exact, vérification Node/CI/Pages si et seulement si promotion autorisée.
- **Hors périmètre** : GenSRPG, Combat, Jouer, Dungeon, mobile PWA, instances d'arène jouables et animations.
- **Workflow** : respecter l'isolation des PR et les exécutions Actions déjà en attente ; pas d'annulation non justifiée.
- **Critère GREEN** : SHA fusionné, tests requis et publication du SHA correspondant ; avant cela état prévalidation seulement.
