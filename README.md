# GateMate ✈️

> Stuck at an airport? Meet someone during your layover.

Browser-first social/dating signup site for travelers in the same airport whose layovers overlap. **Email-verified, Instagram-contacted, no chat, no passwords.**

---

## Onboarding flow (high-level)

1. **`/signup`** — collect everything except email: nickname, age, gender, interested-in, Instagram handle, airport, layover start/end, optional flight number, vibe tags, consent.
2. **`/verify`** — *"Almost there ✨ — where should we notify you if someone overlaps?"* Ask for an email and call Firebase Auth's `sendSignInLinkToEmail`. The form draft is parked in `localStorage` while the user goes to their inbox.
3. **User clicks the magic link** in their email. They return to `/verify` with a Firebase auth code in the URL.
4. **`/verify` (return mode)** detects `isSignInWithEmailLink`, calls `signInWithEmailLink`, reads the draft from `localStorage`, and writes the profile to Firestore with `userId = auth.uid`, `emailVerified = true`, `status = 'active'`. Draft is cleared.
5. **`/matches`** identifies the viewer via `auth.currentUser`, finds their latest active profile, and runs the matching algorithm against other verified profiles at the same airport.

The user never enters a password. The Instagram handle is stored but only revealed to other users when they tap *"Reveal Instagram"* — that action increments a `revealCount` audit field.

---

## Why hybrid (Instagram + email)

Instagram is the **public, social contact channel**. Email is the **private, anti-spam verification channel**. We never use email to message users (no marketing, no notifications in MVP) — it just gates access to the matching pool. Security rules require `request.auth.token.email_verified == true` for any profile create, so the client cannot fake verification.

This still doesn't *cryptographically* prove a user owns the Instagram handle they typed — that needs a separate verification flow (e.g. bio-code or Meta OAuth). See `next_steps.md` for the planned Phase-2 IG verification.

---

## Stack

- **React 18 + Vite + TypeScript** — fast dev loop, static-friendly build
- **TailwindCSS** — utility-first styling, mobile-first
- **React Router (HashRouter)** — clean SPA routing on GitHub Pages without server rewrites
- **Firebase Firestore** — serverless DB; security rules enforce all access constraints
- **Firebase Auth (email link sign-in)** — passwordless email verification
- **GitHub Actions → GitHub Pages or Firebase Hosting** — zero-cost hosting

---

## Run locally

```bash
npm install
cp .env.example .env       # fill in Firebase web config
npm run dev                # http://localhost:5173/gatemate/
```

Without Firebase env vars set, the app boots in **demo mode** — the form works, the verify page lets you skip ahead, and the matches page shows mock activity-map data with no real travelers.

---

## Build and preview

```bash
npm run build
npm run preview
```

Vite's `base` is `/gatemate/` by default (matches GitHub Pages). The Firebase Hosting workflow sets `BASE_PATH=/` so the same build serves at the root of `<project>.web.app`.

---

## Firebase setup (one-time)

1. **Create a Firebase project** at https://console.firebase.google.com.
2. **Enable Cloud Firestore** in production mode. Pick a region close to your users (`eur3` for EU).
3. **Enable Email Link sign-in**: *Authentication → Sign-in method → Email/Password → enable + enable "Email link (passwordless sign-in)"*.
4. **Add your domains** to *Authentication → Settings → Authorized domains*. By default `localhost`, `<project>.web.app`, and `<project>.firebaseapp.com` are listed. Add `rishabhramteke.github.io` (or your custom domain) if you deploy there.
5. **Register a Web app** (Project settings → Your apps → Web). Copy the seven config values into `.env`.
6. **Deploy the rules and index**:
   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add        # pick the project
   firebase deploy --only firestore:rules,firestore:indexes
   ```

---

## Deploy to GitHub Pages

1. In GitHub: *Settings → Pages → Source → "GitHub Actions"*.
2. Add the seven `VITE_FIREBASE_*` keys as **Repository secrets**.
3. Push to `main`. The workflow at `.github/workflows/deploy.yml` builds and publishes.

For a fully anonymous URL + private repo, see the migration plan in `next_steps.md` (Firebase Hosting + private repo).

---

## Folder layout

```
src/
  components/
    AirportSelect, VibeSelector, MatchCard, EmailVerificationStep,
    PrivacyNotice, Footer, airportMap/{AirportActivityMap, ...}
  pages/
    LandingPage, SignupPage, VerifyPage, MatchResultsPage
  services/
    firebase profile CRUD, auth (email link), localStorage draft, matching, analytics
  utils/
    airports list, time formatting helpers, mock airport activity
  types/
    LayoverProfile / ProfileDraft / activity types
  firebase.ts        Firebase init (no-op when env vars are missing)
  App.tsx            HashRouter routes
  main.tsx           entry
```

---

## Privacy & safety

- **Email** is private — never shown to other users, never used to message them in MVP.
- **Instagram handle** is hidden by default — revealed only on tap (and counted via `revealCount`).
- **No GPS, no chat, no photos.**
- **Profiles auto-expire** at `layoverEnd`. Reads filter on `expiresAt > now`.
- **Email verification** is enforced server-side via Firestore rules — clients can't fake it.

See [`gatemate.md`](./gatemate.md) for the long-form context doc — system design, library choices, security rules, and decisions.
