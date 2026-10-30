# Exploration — Interior Geometry Authoring v1 — Prévalidation

Date : 2026-10-08

## Base

- base GREEN : `1585de871136ffbb9858cedae0b6a0df2e679c8d`
- checkpoint start : `checkpoint/exploration-start-interior-geometry-authoring-v1-2026-10-08`
- work : `work/exploration-interior-geometry-authoring-v1-2026-10-08`

## TDD

- RED fonctionnel : `4fbd40c9c44ba7896b0ea3ac01cc891622fc65e3`
- CI RED : `37741723179`
- fonctionnel : `3d87e32892b7d145467cb9f32373473b3504e857`
- CI fonctionnelle : `37742123865` SUCCESS
- RED cache : `867bd9102248adce1bd44758180b94750ba3ca18`
- CI RED cache : `37742252525`
- cache code : `a8adfb4eb7652594c61aeab9f83aaaaabfa8b91c`
- sentinelles cache : `5047f48ab9d283d24348130acb7513924f1cf349`
- CI cache : `37742615742` SUCCESS, 410/410 tests

## Contrat livré

- WorldArea schema v6 ;
- rectangle legacy implicite ;
- polygon boundary normalisée 0..1 ;
- Collision World consomme la boundary ;
- runtime + Builder partagent le même clip ;
- formes Builder Rectangle/L/T/Croix ;
- width/height et poignée Taille Area redimensionnent la boundary proportionnellement ;
- aucun preset id persistant ;
- aucune seconde géométrie Renderer.

## Hors périmètre respecté

- pas de nouveaux assets/textures ;
- pas d'éditeur libre de vertices ;
- pas de changement Encounter/Combat ;
- pas de changement Zombicide-40k.

## Gate manuel

Validation smartphone requise avant GREEN FINAL.
