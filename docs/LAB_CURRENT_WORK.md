# LAB_CURRENT_WORK — Ergonomie panneaux Portals + plein écran 2,5D

Date : 2026-10-28
Branche : `work/exploration-portal-toolbar-ux-2026-10-28`
Base fonctionnelle et CI vérifiée : `4f0b97ccb6d12c2046540e543561d25ef8751e34`, lot World Builder 2,5D + vrais Portals, 854 tests PASS et Chromium paysage.
Checkpoint START créé **AVANT changement** : `checkpoint/exploration-start-portal-toolbar-ux-2026-10-28`.
Dernier checkpoint technique des zones 2,5D : voir `docs/LAB_CURRENT_WORK.md` sur la base 4f0b97c.
Main V80 immuable, source publiée 2,5D isolée sous `/preview/encounters-v80/`.

## Symptôme utilisateur
Sur téléphone, la boîte « Passage entre les zones » occupe beaucoup trop de surface pendant l'édition. Le bouton plein écran semble introuvable ou inaccessible derrière les contrôles. C'est bloquant pour placer les entrées/sorties sur la vraie carte 2,5D.

## Propriétaire et invariants
- Correction **uniquement d'UI** dans `sculpt-lab.html`, `src/sculpt-lab-main.js` et tests navigateur. Le modèle `WorldDocument v3`, `WorldArea.sculptTerrain`, les `Portal.trigger` et `Spawn` officiels, Collisions, Combat/Capture et sauvegardes restent **inchangés**.
- Réutiliser l'unique `#fullscreen-toggle` existant (fonction `toggleImmersive`) : pas de deuxième contrôle de plein écran ni contournement du CSS fallback 100dvh.
- Rendre le panneau Portal replié dès l'entrée 2,5D, afficher un onglet compact accessible au-dessus de la carte, et permettre de l'ouvrir ponctuellement dans une zone limitée avec scroll interne.
- Fermer le panneau lorsqu'on commence la pose au doigt ou passe en Tester. L'onglet Portal ne doit pas masquer le HUD Tester et le fullscreen doit rester visible.
- Les boutons existants Enregistrer/retour, placement entrée, arrivée, X/Y doivent rester accessibles en dépliant le panneau.
- Mobile paysage cible Pixel 10a ; tester aussi le retour à la page et l'usage hors monde (sculpt standalone).

## Gates
1. TDD RED test de contrat UI + nouveau contrôle Chromium réel : 960×540 paysage, boîte fermée, moins de 50px de hauteur ; bouton fullscreen visible et cliquable ; clic plein écran applique `body.sculpt-immersive` + canvas agrandi ; panneau ouvrable, largeur/hauteur/scroll bornés ; fermeture après action « Pointer » ; aucun blocage de la pose ; retour édition/tester et sortie du fullscreen.
2. `npm test`, `npm run check`, tous les smokes Chromium Exploration et Capture/Combat, CI SHA final GREEN.
3. Preview **isolée** publiée via un seul publisher GitHub Pages, V80 identique au byte près.
4. Validation smartphone par utilisateur avant checkpoint GREEN final ou promotion gameplay.

## Implémentation et validation technique (2026-10-28)

- Première régression RED explicite : commit `756469c48c50423f886267486e015469c2c75e2a` ; CI `40639802054`, 854 PASS / 3 FAIL portant sur les trois contrôles du panneau.
- Correctif au niveau du propriétaire UI dans `sculpt-lab.html` + `src/sculpt-lab-main.js` : `<details>` fermé par défaut, onglet « 🚪 Passages », panneau de 250px max avec scroll, fermeture pendant placement, masqué en Tester ; bouton `#fullscreen-toggle` original déplacé en tête de la barre déroulante, aucun deuxième plein écran.
- Après diagnostic Chromium d'une règle CSS trop spécifique (padding de la zone ouverte), correction de cette cause : panneau fermé de 40px sans masquer la vue.
- CI `40640191285` sur le SHA `5107985bf9efe147c5cf7f5138eb8a6cc317be0b` : **857/857 tests Node PASS**, syntaxe et Chromium Exploration/Combat PASS.
- Test Chromium *tactile réel* en 960×540 : panneau fermé 40px, panneau ouvert 286px avec scroll interne, fullscreen touch fonctionne et canvas couvre 540px de hauteur ; réduction au pointer place, retour au mode classique et navigation WorldArea → donjon → région hôte (4 Areas, 4 Portals) PASS.
- Modèle, règles de combat, relief et sauvegardes inchangés ; production V80 préservée. Nouveau lien preview isolée à vérifier une fois la publication en ligne.
- **Validation smartphone utilisateur non encore obtenue : aucun checkpoint GREEN final.**

## Reprise
Travail sur branche dédiée, pas de fusion dans la source de production et pas de modèle concurrent. Les variantes 2,5D continuent d'être épinglées à leur SHA validé dans la publication.
