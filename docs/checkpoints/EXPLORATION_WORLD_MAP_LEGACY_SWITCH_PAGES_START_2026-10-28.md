# START — Preview isolée du retour Monde / Carte ancienne zone
Date : 2026-10-28
START : checkpoint/exploration-start-world-map-legacy-switch-pages-2026-10-28
Base main GREEN : 7eb0922c7bfe1ebfe954289e827e5d636b2e9f69
Branche de publication : work/exploration-world-map-legacy-switch-pages-2026-10-28
Source gameplay : 84eb2274b21eb1757bc241ce6b93a5136d6e47d7 (PR #279)
V80 production immuable : 933c852c41c4511cb0eed0717c246cc6b19aeddc
Périmètre homogène : modifier uniquement le pin dans l'unique workflow Pages existant, ajouter sentinelles HTML/JS pour les deux boutons legacy et vérifier via la suite navigateur mobile la non-perte des données 2400×1600.
Interdits : aucune publication de gameplay main sans validation manuelle, aucun 2e workflow Pages ni chemin de build concurrent.
Validation : source Node 878 cas, Combat, npm check, navigateur Chromium 960×540 et URLs HTTP LIVE, contrôle byte-for-byte V80 avant merge et après.
