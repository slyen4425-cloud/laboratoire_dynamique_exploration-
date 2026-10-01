# GenSrpG Exploration — Garde-fous techniques

## Sources de vérité

| Donnée | Autorité |
|---|---|
| position joueur | Exploration Engine |
| mouvement | Exploration Engine |
| collisions | Collision World |
| monde runtime | World Model |
| seed/config génération | World Generator input |
| caméra | Camera |
| intent tactile/clavier | Input Adapter |
| rencontre déclenchée | Encounter Controller |
| snapshot vers combat | Encounter Bridge |
| rendu | Renderer, lecture seule |

## Interdictions automatiques à ajouter progressivement à la CI

- MutationObserver sur body/html ;
- setInterval permanent ;
- stopImmediatePropagation général ;
- location.reload comme navigation ;
- globals gameplay ajoutés sans contrat ;
- import direct d'un runtime privé d'un autre module ;
- déplacement écrit depuis renderer/input ;
- doublon d'autorité de position ;
- logique gameplay dans service worker/loader.

## Cycle de vie

Tout module UI/adapter temporaire :
- installe ses listeners ;
- garde leurs références ;
- les retire dans dispose ;
- ne laisse aucun callback actif après dispose.

## Déterminisme

Le générateur doit être testable :
- même seed + même config = même structure ;
- config différente = changement contrôlé ;
- seed enregistrable/restaurable.

## Performance

Le monde pourra être grand, mais le renderer ne doit pas rendre naïvement tout le monde.

Prévoir :
- culling ;
- index spatial ;
- pooling seulement si mesuré nécessaire ;
- pas de boucle DOM massive.

Aucune optimisation ne doit devenir une seconde autorité gameplay.

## Sauvegarde

Le save documente :
- schemaVersion ;
- world seed/config ;
- état mutable ;
- position ;
- entités persistantes ;
- événements consommés.

Les migrations sont versionnées et idempotentes.

## Tests sentinelles permanents

Une fois validés, conserver :
- diagonal speed ;
- obstacle blocking ;
- world bounds ;
- camera independence ;
- touch intent ;
- deterministic generation ;
- save/reload ;
- encounter contract ;
- dispose/no leaked listener ;
- no forbidden globals.

## Test invariant majeur

La caméra, le renderer, l'input et le Builder ne peuvent jamais écrire directement la position canonique sans passer par l'Exploration Engine.
