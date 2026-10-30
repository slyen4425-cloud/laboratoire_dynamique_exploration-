# START — World Builder cartes vierges, presets et passage visible

Base fonctionnelle `361eac2473cb5b7bf655ee10cd980f5f18d52ef3`.
Branche : `work/exploration-world-map-presets-traverse-2026-10-28`.
Date : 2026-10-28.
TDD RED : preuve CSS du bouton hors flux, blocage création de scène WorldArea et absence de préset.
À conserver : seul WorldDocument v3 contrôle WorldAreas/Portals/Spawns, seul SculptTerrain contrôle relief, pas de double autorité sur les scènes.
Critères GREEN : bouton réellement sur canvas en mobile (non masqué), carte vierge à dimensions conservées et liens intacts, save/load/export/import de présets en local, nouveau WorldArea créé depuis un préset, tests navigateur et CI, V80 production identique.
