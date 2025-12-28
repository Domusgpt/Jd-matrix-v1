<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/11Gb6YS30kXVHqfKjeNe-_0nKTXX_mB-T

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
   - For command-line builds, export `API_KEY`, `GEMINI_API_KEY`, or `VITE_API_KEY`; the runtime resolver picks the first availabl
e value and surfaces a masked badge in the HUD for QA.
3. Run the app:
   `npm run dev`

## Testing & QA

- **Quick verification:** `npm run build` (requires `API_KEY` or `GEMINI_API_KEY` in the environment).
- **Manual visual check:** run `npm run dev -- --host` and exercise Step 4 transitions to confirm kinetic graph responses against the audio lookahead.
- **E2E smoke (Playwright):** `npm run test:e2e` auto-starts Vite on port 4173 with a dummy API key and validates that the jusDNCE shell boots and exposes its core controls.
- **Recording/exports:** ensure microphone permissions and recording destinations are available before capturing test footage.

## CI & Deployment (GitHub Pages + Firebase)

- **Firebase workflow:** `.github/workflows/deploy.yml` runs on pushes to `main` or via manual dispatch. It installs dependencies, builds with the Gemini key, runs Playwright smoke tests, uploads the `dist` artifact, and then deploys that artifact to Firebase Hosting + Firestore.
- **Pages workflow:** `.github/workflows/pages.yml` configures Pages up front (disabling the managed Jekyll build), builds with a GitHub Pages base path, runs the same smoke tests, and publishes the `dist` output to GitHub Pages. The workflow sets `VITE_BASE_PATH` to `/${{ github.event.repository.name }}/`, drops a `.nojekyll` marker into the built bundle, and copies `404.html` for SPA routing. **Set the Pages source to “GitHub Actions”** in the repository settings; the default “Deploy from a branch” flow will try to run Jekyll against a `/docs` folder and fail.
- **Required repo secrets:**
  - `VITE_GEMINI_API_KEY` — primary Gemini key consumed by both build and E2E steps (also mapped to `API_KEY`, `GEMINI_API_KEY`, and `VITE_API_KEY`).
  - `FIREBASE_TOKEN` — CI token created via `firebase login:ci` for deploys (Firebase workflow only).
  - `FIREBASE_PROJECT_ID` (optional) — defaults to `jusdnce` if not provided; set to override the Firebase deployment target.
- **Local parity:** the same `firebase.json`/`firestore.rules` used in CI are checked in. To dry-run locally, build with `API_KEY` set, then run `firebase emulators:start` or `firebase deploy --only hosting,firestore --project <projectId>`. For GitHub Pages parity, set `VITE_BASE_PATH=/your-repo-name/` before running `npm run build` so assets load correctly from a subpath; the Pages workflow handles `.nojekyll` and `404.html` automatically.
