## 2025-02-08T00:00:00Z
- Fused rhythm and atmosphere cues so dancer and hologram share timing while keeping their own emphases.
- Added predictive camera/hologram sweeps tied to bass drops and atmospheric swells.
- Documented plan in `DEV_PLAN.md` and kept lookahead-based mappings aligned with kinetic sequencing.
- Testing: `npm run build` (pass).

## 2025-12-16T22:08:57Z
- Added orbital strip overlays and drop-triggered negative/stripe flashes to keep camera sweeps synchronized with atmospheric lift.
- Blended stutter/drop cues into shared deck orbitals so bass-driven moves still borrow atmospheric energy.
- Testing: `npm run build`.

## 2025-12-16T23:05:00Z
- Added a togglable telemetry HUD that surfaces live vs lookahead audio energy, active kinetic node, orbital/stripe activity, and camera pose values for on-device QA.
- Documented the staged QA plan and debug HUD requirement in `DEV_PLAN.md`.
- Testing: `API_KEY=dummy npm run build`.

## 2025-12-16T23:09:13Z
- Added an in-app telemetry snapshot button that composites the hologram and character canvases into a downloadable PNG for visual QA.
- Kept HUD controls grouped for faster toggling between debug, recording, and snapshot capture.
- Testing: `API_KEY=dummy npm run build`.

## 2025-12-17T00:30:00Z
- Added a session log HUD with timestamped events plus a wildcard deck mixer to occasionally inject muted decks on drops/fills.
- Logged pose changes, snapshots, recording/export actions, and drop detections so debugging sessions can be replayed via the log overlay.
- Testing: `API_KEY=dummy npm run build`.

## 2025-12-17T02:20:00Z
- Added binary and capture artifact ignores so future screenshots and recordings stay out of commits while keeping code diffs lightweight.
- Reconfirmed the build pipeline after the ignore updates to ensure no regressions.
- Testing: `API_KEY=dummy npm run build`.

## 2025-12-17T04:30:00Z
- Added 6DOF roll/tilt coupling so atmospheric lift nudges the camera and character framing while keeping bass-driven punch intact.
- Installed Playwright with an auto-hosted dev server config and a smoke test to validate the shell boots with core controls visible.
- Documented the new tooling expectations in `AGENTS.md` and refreshed README testing guidance.
- Testing: `API_KEY=dummy npm run build`; `API_KEY=dummy npm run test:e2e`.

## 2025-12-17T06:00:00Z
- Added adjustable crossfeed controls so the dancer can borrow atmospheric lift while the hologram borrows bass punch, keeping both layers phase-aligned without losing their focus.
- Wired the audio crossfeed into camera pans/zooms and telemetry so lookahead cues, overlays, and HUD diagnostics all reflect the shared energy routing.
- Testing: `API_KEY=dummy npm run build`; `API_KEY=dummy npm run test:e2e`.

## 2025-12-17T15:45:00Z
- Surfaced an API key health badge in the HUD with masked display plus session-log notice so QA can confirm credentials before exporting or generating.
- Installed Playwright browser dependencies and validated the smoke test against the live Gemini key; captured a HUD screenshot for visual QA.
- Testing: `API_KEY=[redacted] npm run build`; `API_KEY=[redacted] npm run test:e2e`.

## 2025-12-18T10:00:00Z
- Centralized API key resolution (API_KEY/GEMINI_API_KEY/VITE_API_KEY/import.meta) and wired the HUD badge + Gemini client to share the same masked value/source.
- Updated README guidance to reflect the new resolver and keep QA aware of the accepted env names.
- Testing: `API_KEY=[redacted] npm run build`; `API_KEY=[redacted] npm run test:e2e`.

## 2025-12-18T18:30:00Z
- Added GitHub Actions CI that builds with the Gemini key, runs Playwright smoke tests, and deploys uploaded build artifacts to Firebase Hosting/Firestore using repo secrets.
- Checked in Firebase hosting/firestore config (`firebase.json`, rules, indexes, .firebaserc) so local and CI deploy paths stay aligned.
- Updated README with the required GitHub secrets (VITE_GEMINI_API_KEY, FIREBASE_TOKEN, FIREBASE_PROJECT_ID) and CI/deploy runbook.
- Testing: `API_KEY=dummy npm run build`; `API_KEY=dummy npm run test:e2e`.

## 2025-12-19T10:00:00Z
- Added a GitHub Pages workflow that builds with a repo-based `VITE_BASE_PATH`, runs the Playwright smoke test, and publishes `dist` via `actions/deploy-pages`.
- Set Vite `base` to respect `VITE_BASE_PATH` and added a `postbuild` copy to generate `404.html` so SPA routing works on Pages without black screens.
- Updated README and `.env.example` to document the Pages flow and base-path variable for local parity.
- Testing: `API_KEY=dummy npm run build`; `API_KEY=dummy npm run test:e2e`.

## 2025-12-26T00:10:00Z
- Hardened the GitHub Pages workflow by formatting the repo-scoped base path via `format('/{0}/', repo)` to avoid YAML parsing issues in Actions while keeping Vite asset paths aligned with Pages subpaths.
- Testing: `API_KEY=dummy npm run build` (workflow config change only).

## 2025-12-26T12:00:00Z
- Simplified the GitHub Pages base-path expression to a literal `"/${{ github.event.repository.name }}/"` to eliminate remaining YAML parsing complaints while keeping subpath assets aligned.
- Testing: `API_KEY=dummy npm run build` (workflow config change only).

## 2025-12-26T18:00:00Z
- Corrected the Pages workflow to compute `BASE_PATH` via `format('/{0}/', github.event.repository.name)` so Vite assets resolve under the GitHub Pages subpath instead of the literal expression string.
- Testing: `API_KEY=dummy npm run build`; `API_KEY=dummy npm run test:e2e`.

## 2025-12-27T12:30:00Z
- Hardened the GitHub Pages workflow by scoping permissions per job, forcing a `.nojekyll` marker into the built bundle, and reiterating that the Pages source must be set to “GitHub Actions” to avoid legacy Jekyll/doc builds failing on `/docs`.
- Updated README with the Pages source requirement and the `.nojekyll` safeguard so future deployments bypass the docs-based Jekyll path.
- Testing: `API_KEY=dummy npm run build`; `API_KEY=dummy npm run test:e2e`.
