# Exploration V79 R3E — Prévalidation corrigée (caméra pièce polygonale, escaliers)

Date : 2026-10-25. Statut **PREVALIDATION, NON GREEN produit** avant essai Pixel du créateur.

## Constat visuel
Deux captures Pixel du même héros et de la même zone (angle 35° contre 80°) montrent un grand déplacement du héros uniquement à l'écran : même world X/Y et zoom, mais Canvas peint l'avatar plus haut. Une flèche épaisse recouvre l'escalier.

## Cause et correction
Dans `src/sculpt-lab-main.js`, pour l'intérieur `WorldArea.boundary.kind==='polygon'`, le masque du sol appelait `ctx.restore()` sans sauvegarde locale correspondante. Il supprimait le `ctx.save()` du bloc extérieur trop tôt, et la projection `ctx.transform(pitch)` appliquée aux murs contaminait aussi le rendu de l'avatar **déjà projeté** dans `sculptCameraProject`. La physique et la caméra mathématique étaient bonnes, le **Canvas** se trompait.

Le masque reçoit sa paire `ctx.save()/restore()` exclusive ; aucun changement à `sculptCameraInteriorView`, `sculptCameraFollowActor`, Collision World, WorldArea, WorldDocument, Portal, mouvement, zoom ou coordonnées persistantes. Instrumentation de **matrice Canvas réelle** à l'instant du sprite (non sérialisée), validation (a=d), (b=c=0) sur 35/55/90°, zoom 100/175/240, intérieur en L.

Dans `src/render/sculpt-interior-walls.js`, retrait exclusif du **cercle noir et marqueur ↑/↓** décoratifs du Portal d'escalier. Le WebP/échelle, la rotation choisie `Portal.visual.rotationDeg`, la zone `Portal.trigger`, les `WorldArea.Spawns` et le bouton jeu `Monter/Descendre` sont conservés.

## Gouvernance et vérification
- Base stable R3D : `bc75f929efcfcc24645bbf75e23786dafa0f9f10`, Pages `40212353120` SUCCESS.
- Checkpoint START : `checkpoint/exploration-start-camera-projection-stair-marker-v79-r3e-2026-10-25`.
- Travail isolé : `work/exploration-camera-projection-stair-marker-v79-r3e-2026-10-25`.
- Gates : tests Node de math caméra, équilibre du contexte graphique et absence du marqueur ; vrai Chromium vérifiant **la matrice Canvas réelle du héros** à neuf combinaisons angle × zoom et les tests hérités d'escaliers, Portals, export/import.
- Preview via workflow `.github/workflows/pages-preview.yml` épinglé au SHA exact et PR infrastructure-only. **Aucune fusion de code métier à `main`.**
- Validation finale GREEN : seulement après revue et essai Pixel utilisateur.
