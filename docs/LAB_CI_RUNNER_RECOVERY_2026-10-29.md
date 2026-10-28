# Recovery-only CI incident — 2026-10-29

- Owner: GitHub Actions maintenance only; no changes to runtime, sprites, assets or V80.
- START GREEN base: `32e38b07227a7e85426fa64fc15fdb1a81416ad0` — Actions `40769205457` SUCCESS.
- START checkpoint: `checkpoint/exploration-start-ci-unblock-stale-chromium-2026-10-29`.
- Work branch: `work/exploration-ci-unblock-stale-chromium-2026-10-29`.
- Incident: 19 historical `modern-combat-encounter` jobs hung at `Real Chromium sculptable terrain lab brush and material smoke`; two superseded runs queued.
- Allowed action: only 21 pre-verified Exploration CI run IDs from the older `work/exploration-preset-playable-travel-encounters-2026-10-28` branch, never the final PR #287 run `40782398863` or any other project.
- GitHub's in-connection tools do not expose an Actions cancellation operation; this isolated branch runs a one-time API cleanup through the repository's own GitHub Actions token (`actions: write`) and checks run name, branch and status before each cancellation.
- Preservation: no workflow on main, no merge, no gameplay publication, no bypass of CI.
- Exit: confirm the rescue workflow actually ran and returned success; then verify the PR #287 Core + Combat + Chromium jobs completed on its final SHA, followed by required Pixel gate. A queued cleanup is **not** an executed cancellation.
