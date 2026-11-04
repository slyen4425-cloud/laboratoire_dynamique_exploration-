# Prévalidation — 10 arènes élémentaires

- Source: `main@699c87f83ac6b87fb77fb7ca340008b97d538e02`.
- Branche: `work/exploration-elemental-arenas-assets-2026-11-04`.
- TDD RED: `335ab3216cb797fc02b57e939551efc5c40b8d71`.
- Assets: 10 PNG + 10 WebP extraits du ZIP validé, résolution par le catalogue officiel, sans compression ni modification.
- Un seul lot: ni règles de combat, ni portail, ni collision artificielle ; les autres modules restent gelés.
- Workflow de matérialisation provisoire, à supprimer automatiquement après création des assets.
- **NON GREEN** jusqu'aux fichiers présents au SHA exact, CI complète, fusion, publication Pages et contrôle en World Builder.

- Audit de cause racine au SHA `431fc67d82fae15cd34ddee8fd94240a3c1498a1` : première exécution échouée sur `arene_terre_2p5d.webp` à cause d'un SHA manifeste tronqué à 57 caractères ; ZIP source inchangé et 9 autres empreintes correctes. Remplacer par la somme réelle `f6c8a59af5d3cadb0f62d3facf68ee713e3e0852e140f5a2d20f5ebf3037a8c7`, ajouter sentinelle longueur 64 dans le test et le matérialiseur, puis retester le SHA exact.

## Vérification d'intégrité après exécution GitHub Actions

- Workflow de matérialisation : [run 41868870117](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41868870117), job `materialize` **success**.
- Commit automatisé des assets : `f1fed25d340cd02b978b04a1d8544b7396c8e1e0`.
- Arbre Git exact vérifié : **20 fichiers** dans `assets/exploration/objects/buildings/arenas/`, soit **10 PNG RGBA + 10 WebP** ; source ZIP inchangée, 10 hashes complets validés ; workflow temporaire retiré de l'arbre.
- Ce checkpoint ajoute une modification documentaire pour tester en CI **le SHA final contenant physiquement les assets** et ne modifie aucun contenu de jeu.
- **Statut maintenu NON GREEN** jusqu'aux résultats du nouveau SHA, la fusion vérifiée et la publication HTTPS du même SHA. Les anciens runs échoués sur le SHA `431fc67d82fa` restent conservés comme preuves de la cause corrigée.

- TDD du SHA `bf1dcc1de0bec9e5a91d83eb61b96356ac69a826` : fichiers présents et hashes WebP corrects ; un unique test échoue sur une faute de chemin `arena_` au lieu du chemin source canonique `arene_` (ENOENT). Corriger l'assertion sans déplacer ni renommer un asset. Conserver le test de résolution et relancer sur le SHA exact.
