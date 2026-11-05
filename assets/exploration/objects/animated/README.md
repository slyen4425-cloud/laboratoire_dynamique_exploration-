# Moulins et éoliennes animés — Labo Exploration

Six vues validées : moulin et éolienne, face / trois-quarts gauche / trois-quarts droite.
- 72 PNG originaux RGBA 512×512 et six ZIP source immuables conservés.
- Six planches WebP 1024×768, 12 frames 256×256 (4×3), 10 FPS.
- `manifest.v1.json` reste l'index source unique des fichiers ; les identifiants d'animation sont réutilisés directement par l'Asset Adapter.
- Deux définitions natives `objectdef.building.windmill.01` et `objectdef.building.wind_turbine.01` dans `Bâtiments > Moulins / éoliennes animés`, avec trois variantes de vue et aperçu animés par le même `worldObjectAnimationFrame` que les cascades.
- Visuel décoratif : aucune collision ni porte inventée. Les futures interactions doivent être authorées par le système propriétaire de WorldObject, pas déduites des pixels.
- Dépôt final seulement après CI et Pages du commit fusionné.
