# Exploration — Mobile Landscape & Area Navigation UX v1 — Prévalidation R5 Performance

Date : 2026-10-07

## Retour utilisateur

R4 est beaucoup mieux ergonomiquement mais le Builder rame encore sensiblement sur smartphone.

## Cause mesurée dans l'architecture

- validation complète du WorldDocument à chaque preview ;
- redraw synchrone sur chaque pointermove ;
- backing canvas plein écran jusqu'à DPR 2 pendant l'interaction.

## TDD

- RED : `e9ec9f5157770343eb228e92f45cea9a45870852`
- CI RED : `37672557775` — FAILURE attendue
- scheduler : `80649a6a16b27f87c4cc915c279cce7a83214606`
- implémentation : `5c5ed28488d88fe6bab05c1e960237738c745ca7`
- correction sentinelle : `4a613f3501ef906f0bf724d801d26284d9f65c4d`
- CI : `37672859410` — SUCCESS, 401/401 tests

## Correction

- validation normalisée mise en cache tant que l'identité immuable du draft est inchangée ;
- preview coalescée à une frame via requestAnimationFrame ;
- pointermove/pinch/zoom ne redessinent plus plusieurs fois la même frame ;
- DPR temporairement abaissé pendant interaction tactile focus, puis remonté au repos.

## Autorités inchangées

- WorldDocument unique ;
- WorldArea unique ;
- Portal unique ;
- Renderer en lecture seule ;
- aucun changement Encounter/Combat ;
- aucun changement dans Zombicide-40k.

## Révision publique

`mobile-landscape-area-navigation-ux-v1-r5`

## Gate smartphone

Tester surtout :
1. plein écran paysage ;
2. pan continu rapide ;
3. pinch zoom ;
4. Taille Area ;
5. drag objet/acteur ;
6. peinture continue ;
7. Intérieur → / ← Extérieur.

GREEN FINAL interdit avant verdict utilisateur.


## Cache public final

- préparation R5 : `6fda9595c36bc61f4fbc2a8c29d89e40d28945f4`
- CI : `37673079083` — FAILURE attendue, import viewport encore r4
- correction cache : `ede4c28a46fb3e1d390e48f0ffa3111124321cef`
- CI : `37673219066` — SUCCESS, 401/401 tests

Le checkpoint final R5 doit être créé après cette correction.
