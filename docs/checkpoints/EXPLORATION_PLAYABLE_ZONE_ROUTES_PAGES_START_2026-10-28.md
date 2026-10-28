# START — Publication isolée des passages 2,5D jouables
Date : 2026-10-28
Base main précédente GREEN : `295d37c285008795756747cafa59f3b480fe02e4`, Pages 8 présets et maisons, production V80 source `933c852c41c4511cb0eed0717c246cc6b19aeddc` inchangée.
Checkpoint de départ : `checkpoint/exploration-start-playable-zone-routes-pages-2026-10-28`.
Branche : `work/exploration-playable-zone-routes-pages-2026-10-28`.
Objet : publication d'un code gameplay certifié CI qui permet, par consentement, de raccorder deux WorldAreas compatibles, y compris depuis des sauvegardes historiques incompatibles, et conserve les réglages de rencontres.
Autorité unique de déploiement : `.github/workflows/publish-v81-main.yml` ; production V80 byte-for-byte ; exploration preview isolée.
Checks avant merge : npm test, npm run check, audit Combat, Chromium smartphone 960x540 avec vrai clic dialogue et Portals retour, health HTTP et V80 identique.
Source feature sur PR #283 draft jusqu'au test Pixel.
