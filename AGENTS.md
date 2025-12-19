# Deployment Runbook for Autonomous Agents

**Objective:** Deploy `jusDNCE` to Firebase Hosting with Firestore and Auth enabled.
**Tools Required:** `npm`, `firebase-tools` (CLI), `gcloud` (CLI).

## Phase 1: Environment & Build

1.  **Verify Node Version**
    ```bash
    node -v
    # Ensure >= 18.0.0
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Build Project**
    *   *Note:* The build pipeline expects the API key to be available. Ensure `API_KEY` is set in the environment variables.
    ```bash
    export API_KEY="YOUR_GEMINI_API_KEY"
    npm run build
    # Verify 'dist' directory exists
    ls -la dist
    ```

## Phase 2: Firebase Initialization (If not initialized)

*If `firebase.json` does not exist, execute the following logic:*

1.  **Login (if needed)**
    ```bash
    firebase login:ci --no-localhost
    # OR use existing token via FIREBASE_TOKEN env var
    ```

2.  **Init Project**
    ```bash
    firebase init hosting
    # Select: "Use an existing project" (jusDNCE)
    # Public directory: "dist"
    # Configure as single-page app: "Yes"
    # Set up automatic builds and deploys with GitHub: "No" (or Yes if in CI context)
    ```

## Phase 3: Configuration & Rules

Create or Overwrite `firebase.json` with the following configuration to ensure SPA routing and headers work:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css|html|png|jpg|svg|json)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  }
}
```

Create `firestore.rules`:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false; // Only allow backend/stripe extensions to write credits
    }
    match /customers/{uid}/checkout_sessions/{id} {
      allow read, write: if request.auth.uid == uid;
    }
    match /products/{id} {
      allow read: if true;
    }
    match /prices/{id} {
      allow read: if true;
    }
  }
}
```

## Phase 4: Deployment

1.  **Deploy to Production**
    ```bash
    firebase deploy --only hosting,firestore
    ```

2.  **Verify Output**
    *   Capture the "Hosting URL" from the console output.
    *   Ping the URL to ensure 200 OK.

## Project quick facts (jusDNCE)

- Kinetic Core fuses MJ-style rigid grids with a directed pose graph and lookahead audio analysis; background hologram stays in lockstep but leans atmospheric (mid/high) while the dancer keys off rhythm (bass) plus shared lift.
- Render loop coordinates 6DOF camera pans/zooms/rolls, orbital overlays, negative/stripe flashes, and a telemetry HUD + session log for QA.
- Builds require `API_KEY` (or `GEMINI_API_KEY`) in the environment; `.env.example` maps both for local shells.

## Testing & tooling expectations

- **Build:** `npm run build` (with `API_KEY` exported) remains the primary check.
- **E2E smoke:** `npm run test:e2e` runs Playwright and auto-starts Vite on port 4173 with a dummy API key; traces are retained on failure.
- **Screenshots:** prefer `browser_container` (or the in-app SNAP control) for visual changes; keep captured artifacts out of git (`artifacts/`, `*.png` are ignored).
- **Telemetry review:** enable the HUD and session log in Step 4 during QA to confirm lookahead, pose, and deck cues are in sync with audio.
