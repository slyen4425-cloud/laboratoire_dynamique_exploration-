# START — Publication isolée World Builder : repères de passage
- Date : 2026-10-28
- Source publisher base main : `ddc1dbe70021dbaeb9bee880c635b97bdb9a331b` (Pages unique).
- Checkpoint : `checkpoint/exploration-start-portal-markers-pages-2026-10-28`.
- Source gameplay visée : `361eac2473cb5b7bf655ee10cd980f5f18d52ef3` (PR #269, après gates).
- Objectif : publier le correctif SORTIE/ARRIVÉE/repère nommé via /preview/encounters-v80/ ; garder la production V80 épinglée au SHA 933c852 et inchangée.
- Autorité : workflow unique `.github/workflows/publish-v81-main.yml`; aucune modification des dossiers gameplay de main.
- Gates : source npm test/check, Chromium mobile réels, vérifications HTTPS du JS et des deux contrôles de repères, comparaison octet par octet de V80 ; aucune fusion si échec.
- Lien attendu : https://slyen4425-cloud.github.io/laboratoire_dynamique_exploration-/preview/encounters-v80/world-assembler.html?v=portal-markers-2
