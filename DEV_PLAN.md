# Development Plan (Updated 2025-12-16)

- Maintain a predictable build pipeline (npm install, npm run build) with API_KEY configured via .env and staged QA (local build, telemetry HUD check, visual snapshot).
- Extend kinetic core to fuse rhythm (bass) and atmosphere (mid/high) so character moves track percussion while still reacting to tonal motion.
- Keep the holographic visualizer in lockstep via shared cues but bias it toward atmospheric color/morph changes and camera sweeps.
- Log every work session in `DEVLOG.md` with date/time, scope, and testing status.
- Keep in-app telemetry visible: HUD + toggleable session log panel that records user actions, pose shifts, and deck injections.
- Layer in orbital overlays and negative/stripe flashes triggered by drops/fills, validating both predictive (lookahead) and reactive (stutter) paths with canvas snapshot checks before builds.
- Surface a debug/telemetry HUD so audio analysis, lookahead, and deck/camera responses can be inspected during dev runs without extra instrumentation.
