# START/RED — Chromium real scene smoke must respect physical collision (03/11/2026)

## Trigger
The canonical `main@ae99a0183e7e6ba2dd89a60255dd632db25c10eb` passed the full Exploraton CI (run 41622777739), but the official unique Pages release failed in run [41622777713](https://github.com/slyen4425-cloud/laboratoire_dynamique_exploration-/actions/runs/41622777713), job `verify-and-assemble`, real Chromium assembled preview. Error:
`Official main real map and painted Canvas FPS not observable: {"renderFps":51,"tickFps":61,"moving":"idle","hud":"Rendu 51 FPS · Calcul 61 FPS · 168 unités/s réelles","canvasSize":[760,894],"scene":[36,24],"terrainCached":true,"displayed":true}`.

## Diagnosis
The smoke already checked actual walking at `v26Walking.actorMotion==='walk'` early in the keyboard hold. After adding a 950ms observation interval for rendered FPS, the actor could hit a real obstacle in the 36×24 demo and switch to `idle` **correctly**. Asserting continued `walk` after that interval would demand movement through a blocking wall. Visual FPS, actual movement speed, map canvas and terrain cache were healthy.

## Change
- Base: `main@ae99a0183e7e6ba2dd89a60255dd632db25c10eb`, checkpoint `checkpoint/exploration-live-smoke-collision-start-2026-11-03`.
- Branch: `work/exploration-live-smoke-collision-2026-11-03`.
- Keep the first early `actorMotion==='walk'` test and all original graph, canvas, FPS and cache assertions. At the end of 950ms check positive real speed reported in HUD instead of assuming no obstacle.
- No game code, map content, physics, rendering or cache behavior altered. No mask or alternate authority. Failure of the original gate documented as RED; await CI and original Pages run for GREEN.
- Publish on **only** main Labo Exploration using existing `.github/workflows/publish-v81-main.yml`, without touching GenSRPG or pending authors' maps.
