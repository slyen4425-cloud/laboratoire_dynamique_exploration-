# LAB_CURRENT_WORK — Lot mobile Exploration / Combat (29 octobre 2026)

- Base exacte : `fdc225e147a1593905e1cc98caa29a828408c03f`
- Checkpoint START : `checkpoint/exploration-mobile-audio-texture-start-2026-10-29`
- Branche unique : `work/exploration-mobile-audio-texture-2026-10-29`
- Objectif : faire démarrer la musique sur un geste gameplay existant (sans bouton audio), préparer les visuels réels avant présentation du combat et préparer les quatre musiques Exploration avec un contrat de livraison vérifiable.
- Autorité : exploration détient son ambiance; les SFX et musiques Combat restent ceux du propriétaire Combat, sans second moteur de bataille.
- Ressources autorisées : `integration/combat-bridge/exploration-encounter.{js,html}`, `src/encounters/capture-combat-warmup-v1.js`, `src/sculpt-lab-main.js`, `src/audio/*`, sentinelles sous `tests/`, ce journal.
- Hors périmètre : modifier V80, GenSrpg central, le moteur Combat officiel, les transferts auteur, les sources audio privées sans voie autorisée de publication.
- TDD RED → GREEN attendu : contrôle du décodage avant affichage, démarrage audio à la première interaction native, absence de bouton secondaire, nettoyage des voix au retour, tests du contrat 4 pistes, aucun fallback masquant une ressource absente.
- Risques : restrictions autoplay sur Android (aucun navigateur ne peut garantir le son sans interaction), dépôt privé audio inaccessible aux navigateurs; validation réelle requise sur Pixel.
- Livraison : source testée et CI verte avant checkpoint GREEN; publication via unique pipeline existant uniquement ensuite.
