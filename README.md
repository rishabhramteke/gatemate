# GateMate ✈️

> Stuck at an airport? Meet someone during your layover.

Browser-first, no-login social/dating signup site for travelers in the same airport whose layovers overlap. Connect on Instagram, no in-app chat.

**Live:** https://rishabhramteke.github.io/gatemate/

---

## Stack

- **React 18 + Vite + TypeScript** — fast dev loop, static-friendly build
- **TailwindCSS** — utility-first styling, mobile-first
- **React Router (HashRouter)** — clean SPA routing on GitHub Pages without server rewrites
- **Firebase Firestore** — serverless DB, generous free tier, security rules enforce constraints
- **GitHub Actions → GitHub Pages** — zero-cost hosting and CI

No backend service to run. No login. Profiles auto-expire when the layover ends.

---

## Run locally

```bash
npm install
cp .env.example .env       # fill in Firebase web config
npm run dev                # http://localhost:5173
```

Without Firebase env vars set, the app boots in **demo mode** — the form works, the matches page loads, but no data is read or written.

---

## Build and preview

```bash
npm run build
npm run preview
```

The build emits to `dist/`. Vite's `base` is set to `/gatemate/` to match the GitHub Pages path.

---

## Firebase setup

1. Create a Firebase project at https://console.firebase.google.com.
2. Enable **Cloud Firestore** in production mode.
3. From *Project settings → Your apps → Web*, register a web app and copy the config into `.env`:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_MEASUREMENT_ID=...
   ```
4. Deploy the security rules in `firestore.rules` and the index in `firestore.indexes.json`:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add        # pick your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## Deploy to GitHub Pages

1. In GitHub: **Settings → Pages → Source → "GitHub Actions"**.
2. Add the same `VITE_FIREBASE_*` keys as **Repository secrets**.
3. Push to `main`. The workflow at `.github/workflows/deploy.yml` builds and publishes.

The site will be live at `https://rishabhramteke.github.io/gatemate/`.

---

## Folder layout

```
src/
  components/      AirportSelect, VibeSelector, MatchCard, PrivacyNotice, Footer
  pages/           LandingPage, SignupPage, MatchResultsPage
  services/        firebase profile CRUD, matching algorithm, analytics
  utils/           airports list, time formatting helpers
  types/           shared TypeScript types
  firebase.ts      Firebase init (no-op when env vars are missing)
  App.tsx          routes
  main.tsx         entry
```

---

## Privacy & safety

- Instagram handles are hidden by default — revealed only on tap (and tracked).
- No GPS, no chat, no photos in the MVP.
- Profiles auto-expire at `layoverEnd`. Reads are filtered by `expiresAt > now`.
- Always meet in public airport areas.

See [`gatemate.md`](./gatemate.md) for the long-form context doc — system design, library choices, and decisions.
