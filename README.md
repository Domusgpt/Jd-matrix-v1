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
