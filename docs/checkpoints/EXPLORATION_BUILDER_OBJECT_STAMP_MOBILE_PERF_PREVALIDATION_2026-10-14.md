# GenSrpG Exploration — Placement d’objets tactile et performance immersive (2026-10-14)

## Gouvernance / périmètre
- Demande créateur : les objets doivent pouvoir être posés directement par touches répétées sur la carte (y compris en plein écran), puis déplacés sans risquer une rotation/échelle involontaire. Les grosses lenteurs de peinture et de plein écran mobile restent prioritaires.
- Domaine : World Builder UI, interactions directes WorldObject, preview mobile. 1 lot = 1 branche.
- Base : `1539ef847093377003b417d7e1fe9ccf7ba99f1b` (correctif pinceau prévalidation) ; checkpoint de départ `checkpoint/exploration-start-builder-object-stamp-mobile-perf-2026-10-14`.
- Branche : `work/exploration-builder-object-stamp-mobile-perf-2026-10-14`.
- Propriétaires conservés : `WorldDocument.areas[].objects[]` et fonctions `addWorldObject`/`updateWorldObjectTransform`; aucun placement JSON concurrent ni logique de gameplay dans l’UI.
- Hors périmètre : caméra de jeu configurable (chantier distinct `work/exploration-configurable-game-camera-2026-10-14` conservé/suspendu), Collision R2, encounters, Combat, assets utilisateur.

## Parcours
- Outil `Placer objet` à côté de `Déplacer`, sélecteur de modèle visible sur la carte même en mode plein écran.
- Une touche validée dépose un exemplaire. Des touches répétées déposent plusieurs exemplaires à des positions différentes, sans imposer d’étape préalable au centre de la carte.
- Après placement, passer à `Déplacer` pour sélectionner et glisser un objet déjà placé.
- Case `Autoriser taille / rotation` décochée par défaut : poignées masquées, hit-test de rotation et de redimensionnement désactivé. Les valeurs numériques de rotation et échelle restent disponibles dans le panneau Objets.
- Le premier geste tactile en mode placement ne déclenche plus la mise en plein écran obligatoire.
- Pour ne pas créer d’objet lors d’un zoom à deux doigts, la touche n’est enregistrée qu’au relâchement si le déplacement est bref ; le pinch annule la touche.

## Performance
- `previewPixelRatio` plafonne la résolution du buffer en plein écran tactile à 1x stable (au lieu de 1x pendant l’interaction et 1,5x hors interaction). Plus de reallocation canvas à chaque geste.
- Glisser un objet coalesce les coordonnées et écrit au plus une mutation du WorldDocument par frame d’animation; l’ultime position est flush au relâchement.
- Aucun changement de rendu en jeu ni des résolutions runtime, aucun FPS réels mesurés sur Pixel à ce stade.

## Tests / gating
- TDD RED `7ff3994ecf278f5a4ce94f5f812b06ee5d00210e` ; sentinelles adaptées au nouveau contrat après échecs intermédiaires diagnostiqués.
- Commit code et tests au SHA `ef26323ea23058ed76eb0d9bb2d83a1f06519afd` ; CI `38584062418` SUCCESS, **448/448 tests**, `npm run check` SUCCESS.
- Gate smartphone obligatoire : placer 5 arbres par touches successives en plein écran ; zoom deux doigts sans objet supplémentaire ; déplacer des arbres sans changement de rotation/échelle ; cocher taille/rotation puis les modifier ; décocher et vérifier verrouillage ; retester peinture et export/import ; juger subjectivement fluidité.
- Statut GREEN technique / PRÉVALIDATION uniquement ; aucune validation manuelle ni GREEN FINAL à ce stade.
