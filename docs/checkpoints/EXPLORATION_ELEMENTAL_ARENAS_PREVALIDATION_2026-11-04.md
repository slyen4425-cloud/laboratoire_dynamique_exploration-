# Prévalidation — 10 arènes élémentaires

- Source: `main@699c87f83ac6b87fb77fb7ca340008b97d538e02`.
- Branche: `work/exploration-elemental-arenas-assets-2026-11-04`.
- TDD RED: `335ab3216cb797fc02b57e939551efc5c40b8d71`.
- Assets: 10 PNG + 10 WebP extraits du ZIP validé, résolution par le catalogue officiel, sans compression ni modification.
- Un seul lot: ni règles de combat, ni portail, ni collision artificielle ; les autres modules restent gelés.
- Workflow de matérialisation provisoire, à supprimer automatiquement après création des assets.
- **NON GREEN** jusqu'aux fichiers présents au SHA exact, CI complète, fusion, publication Pages et contrôle en World Builder.

- Audit de cause racine au SHA `431fc67d82fae15cd34ddee8fd94240a3c1498a1` : première exécution échouée sur `arene_terre_2p5d.webp` à cause d'un SHA manifeste tronqué à 57 caractères ; ZIP source inchangé et 9 autres empreintes correctes. Remplacer par la somme réelle `f6c8a59af5d3cadb0f62d3facf68ee713e3e0852e140f5a2d20f5ebf3037a8c7`, ajouter sentinelle longueur 64 dans le test et le matérialiseur, puis retester le SHA exact.
