# Exploration Builder — Carte vierge et export — Prévalidation (2026-10-14)

## Périmètre / ownership
- Domaine : World Builder UI + World Builder Draft + navigation de test.
- Branche : `work/exploration-builder-blank-world-export-2026-10-14`.
- Base de travail : `f7a7e72ffcedfc48f1de862becf52eb13a838cf0`, R2 Palette éditable **prévalidation**, pas GREEN FINAL.
- Start checkpoint : `checkpoint/exploration-start-builder-blank-world-export-2026-10-14`.
- Dernier GREEN FINAL antérieur : `checkpoint/exploration-interior-geometry-authoring-v1-green-2026-10-10`.
- Le lot garde la base R2 et ses invariants; aucune autre autorité de carte/sauvegarde/renderer.
- Hors périmètre : collision, traversée, combat, contenu Démo, texture utilisateur/assets binaires, runtime gameplay.

## Comportement
- Nouveau bouton visible « + Carte vierge » dans l'en-tête : confirmation préalable, nouvelle WorldArea extérieure de 2400 × 1600 modifiable, base Plaine/Terre, un Spawn central jouable.
- Aucune autre Area/portail/événement/acteur/objet/obstacle/zone/route/rivière; rencontres aléatoires désactivées sur cette carte initiale; toutes les familles restent configurables.
- Boutons « ↓ Exporter carte » en en-tête et « Exporter la carte (.json) » dans JSON : **la même** sérialisation WorldDocument validée.
- Export *.world.json et import via le contrôle existant; fichiers utilisateurs de textures restent dans IndexedDB de l'appareil, pas intégrés aux octets JSON.
- État de sélection, undo et point de tracé temporaire remis à zéro sur création, sans détruire la bibliothèque de textures.
- Nouveau cache-bust public pour Builder/CSS/Draft et liens test/retour, autorités Collision R2 et familles éditables conservées.

## Test et gates
- RED : `1ab0b13221ade7ec4556f9f8e7c7a2a8ced07368` — le test importe une fabrique inexistante; échec attendu.
- GREEN code : `5243527a6b817e273c4fb4de1c8b7119a224f4c4` — CI run `38515546118` **SUCCESS** (441/441, npm run check).
- Gate smartphone obligatoire : (1) exporter la carte en cours, (2) carte vierge après confirmation, (3) vérification visuelle zéro objet/tracé et point de spawn, (4) peindre sable et forêt sans lag, (5) export, import et reload identiques, (6) tester en jeu puis revenir, (7) relancer démo et confirmer contenu inchangé.
- Aucune validation smartphone R2 ni Collision R2 déclarée finalisée par cette publication.
- Pas de gameplay mergé dans main ; publication exclusivement par fichier infrastructure de Pages.
