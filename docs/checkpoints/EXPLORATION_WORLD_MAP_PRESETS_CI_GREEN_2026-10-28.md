# Checkpoint technique GREEN — World Builder : maps présets et Portal tactile
- Date : 2026-10-28
- Source CI vérifiée : `work/exploration-world-map-presets-traverse-2026-10-28` commit `6f15b02ac0eea0b5cb6adea18dae34cafef8e679`
- Prévalidation : PR #271 DRAFT ; aucun merge de gameplay vers main ; aucune fusion vers GenSrpg/Combat.
- Lot : vrai bouton de traversée positionné sur canvas avec rayon canonique, état désactivé hors zone ; nouvelle map vierge de même taille dans une WorldArea liée (Portals/Spawns/Encounter conservés) ; bibliothèque de présets localStorage + export/import JSON ; création région/donjon depuis préset et trajet par les vrais Portals ; retour sauve la WorldArea.
- Tests : 867 tests Node PASS, npm run check PASS ; CI core-tests et modern-combat-encounter success (2 exécutions) ; Chromium réel paysage 960x540, fullscreen, rendu de l’action dans le terrain, aller-retour WorldArea/donjon, Capture/Combat success.
- Publication isolée : workflow unique sur main commit `13ffc0af066f4d983a01c8a2f8427ba2edb4e0a0`, verify-and-assemble et deploy success. Vérification HTTPS `pages/world-map-presets-live` success.
- Production V80 : source immuable `933c852c41c4511cb0eed0717c246cc6b19aeddc` comparée strictement octet pour octet ; non modifiée.
- Limites connues : présets localStorage par appareil/navigateur ; export/import JSON pour transfert ; application à une WorldArea existante seulement si dimensions identiques ; création depuis un préset dans l’assembleur reprend les dimensions du préset. Le modèle 2,5D reste limité à 80×64 ; WorldDocument accepte des zones plus grandes.
- Prochain jalon : retour de validation smartphone Pixel 10a avant checkpoint GREEN utilisateur ou promotion gameplay.
