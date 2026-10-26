# LAB_CURRENT_WORK — V80 portes intérieures

Date : 2026-10-26
Branche : `work/exploration-door-assets-v80-2026-10-26`
Base : V79 R3E `3bd48a50a99953bac74025aa815b9c223953f568`

## Périmètre
Intégrer 10 portes d'intérieur (20 PNG face/3/4) depuis `lot/portes-interieures-20-assets-20261026`, `assets/interiors/doors/manifest.json`, dans le sélecteur de porte du Builder 2.5D, sans modifier la logique canonique des portails.

## Vérifications requises
- 20 PNG valides et chemins présents ;
- 20 entrées au catalogue et 20 options dans `sculpt-lab.html` ;
- `npm test` et `npm run check` ;
- test navigateur : choix, affichage, sauvegarde/rechargement, passage de porte ;
- publication vérifiée avant annonce de lien V80.

## Statut
En attente de validation des tests navigateur et de publication. NON GREEN.

## Interdictions
Aucune fusion dans `main` ou modification du labo Combat / production sans accord utilisateur.
