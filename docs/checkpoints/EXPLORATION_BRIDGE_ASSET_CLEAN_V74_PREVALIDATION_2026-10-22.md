# Exploration V74 — Prévalidation du nettoyage SOURCE des 28 visuels de pont 2,5D

**Date :** 22 octobre 2026 · **Lot unique :** ponts 2,5D / nettoyage de franges et bavures blanches.

## Validation de départ V73

Le créateur confirme : « ok parfait », « les passages sont ok ». Le code V73 du pont vertical est figé sur SHA `2d95caba255a201be738f33ada1cccebbafd8ec5`, CI `#39798922299` SUCCESS et Pages `#39800306731` SUCCESS. Checkpoint GREEN utilisateur V73 `checkpoint/exploration-bridge-vertical-occlusion-v73-green-2026-10-22`.

## Gouvernance / périmètre

- START `checkpoint/exploration-start-bridge-asset-clean-v74-2026-10-22`, branch `work/exploration-bridge-asset-clean-v74-2026-10-22`, source base V73 exacte.
- 28 sources `assets/exploration/objects/bridges/bridge_*_2p5d_*.webp` nettoyées **physiquement en WebP** sur GitHub, sept familles × quatre vues.
- `scripts/clean-bridge-webps-v74.py` : masque couleur alpha prudent pour petites bavures de détourage et pixel semi-transparents blancs exposés, réencodage **WebP lossless**, conservation RGB opaque des vrais matériaux, dimensions 512×512, limite 6,5 % par image.
- Exécution GitHub Actions `#39812999536` SUCCESS : **28 fichiers nettoyés**, **39 582 pixels changés**, aucune suppression d'asset, aucune modification des quatre anciens WebPs.
- `scripts/update-bridge-manifest-v74.py`, workflow GitHub `v74-bridge-source-clean.yml` : recalcul **SHA-256 et taille** des 28 images dans `manifest.v1.json` ; 4 ponts historiques intacts. Action synchronisation `#39814241325` SUCCESS. Les 28 WebP V74 sont `VP8L` sans perte (contrat ancien `VP8X` supporté pour les assets historiques).
- `src/sculpt-lab-main.js` : ne **retraite plus** une seconde fois l'alpha des 28 sources maintenant propres. Le rattrapage historique V56 reste en place pour les anciens ponts. URL visuelle cache-bustée `?source-clean-v74`, aucun changement des assetId ou paths du registre.
- `sculpt-lab.html` : cache-bust du module JS V74.
- `tests/sculpt-bridge-source-webps-v74.test.js` et sentinelle `tests/exploration-bridges-2p5d-v1.test.js` : 28 fichiers exacts, manifest correspondant, WebP RIFF/VP8L valides, résolution catalogue, corridor 35 %, géométrie et redimensionnement V72 inchangés.
- **Aucune** modification à WorldObject/WorldDocument, Collision World, mouvement, hauteur, caméra, assets d'escaliers, masques de rails V73 ou autres labos.

## Validation et rollback

- Dernière CI du code + manifest `#39814282596` SUCCESS sur `8b1a894f33afbfcd907596ad8d271f2862b2f2cf`.
- CI exacte du jalon documentaire final et Pages toujours requises avant annonce de mise en ligne.
- **Gate mobile V74 :** confirmer visuellement la disparition des taches blanches sur horizontal / vertical / diagonales, notamment contours des pieds de pont ; vérifier bois et pierres clairs préservés ; passages V73 inchangés. Ne pas déclarer GREEN esthétique avant ce test Pixel.
- **Rollback :** Pages peut repointer sur V73 `2d95caba255a201be738f33ada1cccebbafd8ec5`.

## Prochain lot prévu, NON commencé

`docs/plans/EXPLORATION_PENTES_ESCALIERS_V75_SCOPE_2026-10-22.md` : deux mécaniques distinctes mais contractuelles, pente de terrain progressive et escaliers existants (pierre simple, bois, grand). Utiliser Collision World comme seule autorité ; ne jamais autoriser la montée partout en augmentant globalement `maxStepUp`.

**Statut : PR de publication à préparer après la CI finale ; V74 prévalidation technique et validation visuelle distinctes.**
