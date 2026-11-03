# Six animations 2,5D moulin et éolienne — Monster Capture

Les six ZIP approuvés par l'utilisateur sont conservés octet pour octet, rangés sous ce dossier. Trois modèles de moulin et trois d'éolienne : face, ¾ gauche, ¾ droite. Chaque archive porte 12 PNG RGBA 512×512 (72 frames).

Le manifeste `manifest.v1.json` est l'unique index des packs, vues, chemins, empreintes SHA-256, FPS et format de lecture.

Import déterministe : `python3 scripts/materialize-wind-animations.py` valide les sources. `--extract` conserve les 72 PNG à l'identique dans `frames/`. `--extract --sheets` crée en plus six feuilles WebP 4×3 (256px/cellule ; Pillow requis). Aucune régénération des modèles.

**Limite du lot** : dépôt et organisation des ressources. Ni catalogue WorldObject, ni placement dans le World Builder, ni collisions ne sont modifiés. L'intégration du placement animé est un lot suivant qui utilisera l'Asset Adapter existant, sans deuxième autorité.

### Résultat de la matérialisation sur la branche

Les 72 sources PNG sont dans `<famille>/<vue>/frames/frame_00.png…frame_11.png` et les 6 planches directement chargeables sont dans `<famille>/<vue>/sheet.webp`. Le manifeste contient les chemins et la déclaration `runtimeAtlas.animation` (4×3, 12 frames, 256×256, 10 fps). Ce sont des ressources disponibles dans le dépôt, **pas encore des objets sélectionnables** dans le World Builder : leur activation visuelle devra réutiliser le catalogue officiel.
