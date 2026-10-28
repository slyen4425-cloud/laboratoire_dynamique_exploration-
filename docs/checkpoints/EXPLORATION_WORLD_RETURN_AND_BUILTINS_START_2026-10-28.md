# START — Retour Carte 2,5D vers Monde et présets natifs

Date 2026-10-28. Base GREEN 0314dd0deda247569ddc1a576f0d0b63ede2098c. Checkpoint : checkpoint/exploration-start-world-return-and-builtins-2026-10-28. Branche : work/exploration-world-return-and-builtins-2026-10-28.

Diagnostic : le mode plein écran masque header et donc onglet Monde (body.sculpt-immersive header display:none), et masque le panneau de Portals en mode Tester, dernier bouton de retour. Le handoff de session est consommé au premier affichage et ne survit pas à actualisation.
Le catalogue ne propose pas encore de présets natifs ; seules des scènes utilisateur enregistrées localement sont disponibles.

Livraison : même WorldDocument/WorldArea/Portal/Spawn; bouton de retour toujours tactile et visible en immersive, sauvegarde atomique de la scène dans le document canonique, route/zone récupérable après refresh; 8 présets natifs read-only fondés sur SculptTerrain, Surface, et ObjectDefinitions officiels (forêt, neige, plaine et entrée de donjon). Pas de second état d'autorité ni masquage CSS, ni changement de V80 protégée. Tests TDD, Chromium paysage, CI et publication isolée.