# V65–V66 — Caméra, tablier et commandes : PRÉVALIDATION TECHNIQUE

Base publique V64: bb32a1b257fd7672af28678cc6504da428da1f8c.
V65 source immuable: deb7386571786961446cc7a46d6592605254b96a ; START checkpoint/exploration-start-bridge-camera-depth-v65-2026-10-21 ; checkpoint/exploration-bridge-camera-depth-v65-prevalidation-2026-10-21 ; [CI #39658041232](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39658041232) SUCCESS.
V66 source immuable: e7d823c291629d627648e76a9042412f0580c741 ; START checkpoint/exploration-start-camera-input-v66-2026-10-21 ; checkpoint/exploration-camera-input-v66-prevalidation-2026-10-21 ; [CI #39659074209](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/39659074209) SUCCESS.

V65: V57 appliquait le décalage visuel des pieds sur le pont AVANT la projection par le pitch: à 35° ce décalage rétrécissait, alors que le sprite de pont conserve sa hauteur à l'écran. V65 projette d'abord le terrain en XY puis applique le décalage sprite en pixels. Dans Tester, case à cocher optionnelle pour afficher le véritable corridor physique projeté aux angles 35–90°, sans modifier la collision; lecture seule du WorldObject. Tests unitaires angles/variantes/échelles et Chromium général.

V66: la commande de joystick (coordonnées écran) était transmise telle quelle au monde XY, malgré le pitch et shear de la caméra Tester. Conversion dans l'inverse de la matrice puis compensation de vitesse écran bornée, uniquement dans l'adaptateur de Tester. Exploration Core stepMovement, Collision World, WorldDocument restent inchangés. Tests Node cardinaux/diagonaux 35,55,70,90° + vraie navigation Chromium événement ArrowUp à 35° et 90° ; Builder/Combat sentinelles GREEN.

Gel: eau V46, textures roche V50, contour visuel V61, ponts V60-V64 et assets, audio, 20 rochers, Combat.
Limites: CI GREEN technique ne prouve pas validation créateur Pixel. Contrôler réellement acteur sur pont à quatre orientations, 35/90°, scale et overlay physique/visuel ; pont hors corridor toujours non franchissable. Les plateaux à niveaux ENTIERS n'ont pas encore une vraie pente physique; une rampe demandera un lot World Model + Renderer + Collision distinct. Ne pas rendre toutes falaises grimpables. Pas de GREEN utilisateur anticipé.

Rollback pin V64: bb32a1b257fd7672af28678cc6504da428da1f8c.
