# Release — Exploration music playback after trusted Tester (29 October 2026)

- Base release: main `f6df432c1f5aa6530e1393561b462dff78ac97bb`.
- Checkpoint START: `checkpoint/exploration-audio-playback-gesture-release-start-2026-10-29`.
- Source: `1e01159f7291a0512a329ba613996f3424d570d4` on `work/exploration-audio-playback-gesture-2026-10-29`.
- Reported regression: all four real MP3s present on GitHub Pages, but Android “Tester” did not audibly start soundtrack.
- Contract fix: `play()` success, not an attempted request, proves playing; first trusted Tester click comes before any legacy confirm; `NotAllowedError` can retry on actual navigation gestures; unversioned module URL replaced. No fake click, arbitrary delay, new audio button, or second audio authority.
- Tests: original 4-MP3 SHA-256, Node unit regression for rejected media play, native Chromium with a real click + advancing MP3 timestamp; CI full. V80 remains byte-frozen and original private masters remain private.
- Final acceptance: merge PR on green, Pages deploy green incl HTTPS probes, creator verifies real Pixel playback.
