# GateMate — Living Context Document

> Single source of truth for the GateMate MVP. If your context window resets, read this first — every architectural choice, library, schema, and security decision is here so you can resume work without losing nuance.

**Repo:** https://github.com/rishabhramteke/gatemate
**Site (after deploy):** https://rishabhramteke.github.io/gatemate/
**Owner:** rishabhramteke (rishabh.ramteke@tomtom.com)
**MVP date:** 2026-04-30

---

## 1. Product summary

**Pitch:** "Stuck at an airport? Meet someone during your layover."

GateMate is a browser-first signup site that matches travelers at the same airport whose layover windows overlap. Users drop a profile (name, age, gender, vibe, Instagram), get shown overlapping travelers, and connect via Instagram. **No in-app chat. No login. No photos. No GPS.**

### Core flow
1. **Landing** → CTA "Find people at my airport".
2. **Signup form** → name, age, gender, interested-in, airport, layover start/end, Instagram, optional flight number, vibe tags, consent checkbox.
3. **Submit** → write to Firestore → query overlapping travelers at same airport → render results.
4. **Match cards** → name, age, vibe, overlap window. Instagram handle is **hidden** until the viewer taps **Reveal Instagram** (which `revealCount += 1` server-side).
5. **Expiry** → profiles auto-disappear from results once `expiresAt` (= `layoverEnd`) is in the past.

### Out of scope for MVP
- Payments, App Store, Play Store, push notifications, in-app chat, GPS, profile photos, full auth.

---

## 2. Tech stack and *why*

| Layer        | Choice                          | Why                                                                                                                                     |
|--------------|---------------------------------|------------------------------------------------------------------------------------------------------------------------------------------|
| Build tool   | **Vite 5**                      | Fast dev server, zero-config TS/JSX, native ES modules, smallest viable production bundle. `base: '/gatemate/'` for GH Pages.            |
| UI framework | **React 18**                    | Standard, huge ecosystem, plays well with Firebase web SDK and Vite. StrictMode for catching effect bugs early.                           |
| Language     | **TypeScript 5**                | Catches schema/typing drift between form draft and Firestore documents — important since Firestore is schemaless.                        |
| Styling      | **TailwindCSS 3**               | Utility-first lets us iterate fast on a design-heavy MVP without a component library. Mobile-first by default. Tiny prod CSS via JIT.    |
| Routing      | **react-router-dom 6 (HashRouter)** | HashRouter avoids the GitHub Pages SPA fallback dance — `/#/signup` always lands on the right route without server rewrites.            |
| Database     | **Firebase Firestore**          | Free tier covers MVP comfortably, no server to run, security rules enforce constraints, real-time-ready for v2 (live match updates).     |
| Hosting      | **GitHub Pages**                | Free static hosting on the user's existing `rishabhramteke.github.io` domain. Single GH Actions workflow handles build + publish.        |
| CI/CD        | **GitHub Actions**              | Native to the repo, free for public repos, official `actions/deploy-pages` flow with proper concurrency and `id-token` permissions.      |
| Analytics    | Lightweight shim (`services/analytics.ts`) | Console + optional `gtag` if loaded. No SDK locked in; swap to Plausible/GA4 later without touching call sites.            |

### Libraries explicitly *not* used (and why)
- **Redux / Zustand / Jotai** — local component state + URL search params are enough; no shared global state worth managing.
- **react-hook-form / formik** — one form, native HTML validation + a few `useState` calls is simpler and ships less JS.
- **dayjs / date-fns** — `Intl.DateTimeFormat` and `Date` math handle our needs; saves ~20kb.
- **Firebase Auth** — explicit MVP decision: no login. Identity is "whoever submits the form". Trade-off: anyone can create profiles; security rules restrict shape and scope.
- **Realtime listeners (`onSnapshot`)** — first load uses `getDocs` for simplicity; live subscription is a v2 thing once we have repeat traffic.
- **A UI component library (MUI/Chakra/Radix)** — Tailwind + a handful of `@layer components` classes is plenty for an MVP and keeps the bundle lean.

---

## 3. System architecture

```
                ┌──────────────────────┐
   user ──────► │ rishabhramteke.github│
   (browser)    │  .io/gatemate/       │  (static site, served by GitHub Pages CDN)
                └──────────┬───────────┘
                           │ Firebase web SDK (HTTPS)
                           ▼
                ┌──────────────────────┐
                │   Firebase Firestore │  collection: layover_profiles
                │   (security rules    │  indexes:    airportCode + status + expiresAt
                │    enforced)         │
                └──────────────────────┘
```

- **No backend server.** All logic that protects data lives in Firestore security rules (`firestore.rules`).
- **No long-lived sessions.** A submitting browser doesn't carry a token; security rules don't depend on `request.auth`.
- **Identity model:** the URL after signup carries the new profile's id (so we can exclude it from the viewer's match list). It is not authentication — anyone with the id could pretend to be that user. Acceptable for MVP because the only thing tied to the id is "exclude from your own match list".

### Page → service flow
1. `LandingPage` → static, marketing only.
2. `SignupPage` → `services/profiles.createProfile()` → returns Firestore doc id → navigate to `/matches?...`.
3. `MatchResultsPage` → `services/profiles.listActiveByAirport()` → `services/matching.overlapMatches()` → render `MatchCard[]`.
4. `MatchCard` → on **Reveal Instagram** → `services/profiles.incrementReveal()` → opens `instagram.com/@handle` in a new tab.

---

## 4. Data model

### Collection: `layover_profiles`

```ts
interface LayoverProfile {
  id: string;                // Firestore doc id (assigned by addDoc)
  name: string;              // 1–40 chars
  age: number;               // 18–99
  gender: 'woman' | 'man' | 'nonbinary' | 'other';
  interestedIn: 'women' | 'men' | 'everyone' | 'friends';
  airportCode: string;       // 3-letter IATA, uppercase
  layoverStart: Timestamp;
  layoverEnd: Timestamp;     // must be > layoverStart
  instagram: string;         // handle without leading '@', lowercased
  flightNumber?: string;     // optional, uppercased
  vibe: Vibe[];              // 0–6 of: coffee, drinks, walk, chat, dating, friends
  consent: boolean;          // must be true to create
  createdAt: Timestamp;      // server-side at create
  expiresAt: Timestamp;      // == layoverEnd (used for read filter and TTL)
  status: 'active' | 'expired' | 'hidden';
  revealCount: number;       // incremented on Reveal; the only mutable field
}
```

### Why `expiresAt == layoverEnd`
- Reads are filtered by `expiresAt > request.time` — once the layover ends, the profile is invisible without a server-side cleanup.
- A future Cloud Function can sweep `expiresAt < now` and mark `status = 'expired'` (or hard-delete for retention).

### Indexes

| Fields                                                    | Purpose                                               |
|-----------------------------------------------------------|-------------------------------------------------------|
| `airportCode ASC` + `status ASC` + `expiresAt ASC`        | The composite query in `listActiveByAirport`         |

(declared in `firestore.indexes.json` — `firebase deploy --only firestore:indexes` to apply.)

---

## 5. Matching algorithm

A profile **other** matches viewer **u** iff:

```
other.id != u.id
other.airportCode == u.airportCode
other.status == 'active'
other.expiresAt > now
u.layoverStart < other.layoverEnd
u.layoverEnd   > other.layoverStart
isCompatible(u, other)
```

### `isCompatible`
- If **either** side picked `friends`, **both** must have picked `friends`. Friends-only is symmetric and never crosses with dating preferences.
- Otherwise, viewer's `interestedIn` must accept the other's `gender`, **and** vice versa.
- `everyone` accepts any gender.
- `women` / `men` accept only `woman` / `man` respectively. Non-binary travelers are best served by `everyone` (or another non-binary user via `everyone`/`friends`).

### Overlap window
```
overlapStart = max(u.layoverStart, other.layoverStart)
overlapEnd   = min(u.layoverEnd,   other.layoverEnd)
overlapMinutes = (overlapEnd - overlapStart) in minutes
```
Results are filtered to `overlapMinutes > 0` and sorted by overlap descending.

### Where it runs
On the **client**, after fetching all currently-active profiles for the airport. This is fine for MVP traffic; with thousands of concurrent profiles per airport we'd push the filter into Firestore (e.g. range query on `layoverEnd`) or move matching into a Cloud Function.

---

## 6. Privacy and safety

- **Instagram handle is hidden** until a viewer taps **Reveal Instagram**, which calls `incrementReveal(id)`. Even though the handle is technically downloaded with the doc (Firestore can't field-mask without a backend), the UX gates it and the reveal action is auditable via `revealCount`.
- **Consent gate** on create: rules require `consent == true`.
- **No photos, no DOBs, no real names required** — just a nickname.
- **Auto-expiry** via `expiresAt > request.time` read filter.
- **Public-areas reminder** is shown on the signup form and every match card.
- **Report / hide** placeholder button is visible on every card. v2 wires it to a `reports` collection.

### Known MVP trade-offs
- *Anyone* can create a profile — no rate limit, no email verification. Mitigation: small audience, single static airport list, Firestore daily quota acts as a soft cap. Add App Check + reCAPTCHA when traffic grows.
- A determined attacker can read the entire active set for any airport (that's how matching works). Acceptable because every doc represents a user who ticked "I agree my profile may be shown to overlapping travelers".

---

## 7. Firestore security rules (summary)

Full rules live in `firestore.rules`. Key invariants enforced:

- `read` only when `status == 'active' && expiresAt > request.time`.
- `create` requires every required field, valid types, `consent == true`, `status == 'active'`, `revealCount == 0`, `age` in `[18, 99]`, name/instagram length caps, `airportCode` is exactly 3 chars, `gender`/`interestedIn` from a fixed enum, `layoverEnd > layoverStart`, and `expiresAt == layoverEnd`.
- `update` only if the **only** changed field is `revealCount`, and the new value is exactly `prev + 1`. Nothing else may be patched.
- `delete` is denied entirely. Cleanup is server-side only.

---

## 8. Folder layout

```
gatemate/
├─ .github/workflows/deploy.yml          GitHub Pages CI
├─ public/
│  ├─ plane.svg                          favicon
│  └─ 404.html                           SPA fallback (HashRouter handles routing, this is belt-and-braces)
├─ src/
│  ├─ components/
│  │  ├─ AirportSelect.tsx
│  │  ├─ Footer.tsx
│  │  ├─ MatchCard.tsx
│  │  ├─ PrivacyNotice.tsx
│  │  └─ VibeSelector.tsx
│  ├─ pages/
│  │  ├─ LandingPage.tsx
│  │  ├─ SignupPage.tsx
│  │  └─ MatchResultsPage.tsx
│  ├─ services/
│  │  ├─ analytics.ts                    track() shim
│  │  ├─ matching.ts                     overlap + compatibility logic
│  │  └─ profiles.ts                     Firestore CRUD
│  ├─ utils/
│  │  ├─ airports.ts                     AMS, BCN, CDG, FRA, LHR, MAD, FCO, IST, DXB, DOH
│  │  └─ time.ts                         format helpers
│  ├─ types/index.ts
│  ├─ firebase.ts                        init (no-op without env vars → "demo mode")
│  ├─ App.tsx                            HashRouter
│  ├─ main.tsx
│  └─ index.css                          Tailwind + a few @layer components
├─ firestore.rules
├─ firestore.indexes.json
├─ index.html
├─ tailwind.config.js
├─ postcss.config.js
├─ vite.config.ts                        base: '/gatemate/'
├─ tsconfig.json + tsconfig.app.json + tsconfig.node.json
├─ .env.example
├─ README.md
└─ gatemate.md                           THIS FILE
```

---

## 9. Environment variables

Set in `.env` locally and in GitHub repo **Settings → Secrets and variables → Actions** for CI:

| Var                                  | Source                                       |
|--------------------------------------|----------------------------------------------|
| `VITE_FIREBASE_API_KEY`              | Firebase console → Web app config            |
| `VITE_FIREBASE_AUTH_DOMAIN`          | "                                            |
| `VITE_FIREBASE_PROJECT_ID`           | "                                            |
| `VITE_FIREBASE_STORAGE_BUCKET`       | "                                            |
| `VITE_FIREBASE_MESSAGING_SENDER_ID`  | "                                            |
| `VITE_FIREBASE_APP_ID`               | "                                            |
| `VITE_FIREBASE_MEASUREMENT_ID`       | optional (Analytics)                         |

If the API key / project id / app id are missing, `firebase.ts` skips initialization and the app runs in **demo mode** (form submits do not write to a backend, match list is empty). The UI shows a banner explaining this.

---

## 10. Deployment

### One-time
1. **GitHub repo**: `rishabhramteke/gatemate` (created).
2. **GitHub Pages**: Settings → Pages → **Source: GitHub Actions**.
3. **Repository secrets**: add the seven `VITE_FIREBASE_*` keys from the table above.
4. **Firestore**: `firebase deploy --only firestore:rules,firestore:indexes`.

### Per release
- Merge / push to `main` → `.github/workflows/deploy.yml` runs:
  1. `npm ci`
  2. `npm run build` (Vite + tsc)
  3. Copies `dist/index.html` to `dist/404.html` for any deep-link safety net.
  4. Uploads to Pages and deploys.

URL: **https://rishabhramteke.github.io/gatemate/**

---

## 11. Analytics events

Defined in `services/analytics.ts`. All five required events are wired:

| Event                | Where                                  |
|----------------------|----------------------------------------|
| `page_view`          | Each page on mount                     |
| `form_started`       | First change in the signup form        |
| `profile_created`    | After successful Firestore write       |
| `matches_found`      | After match list is computed           |
| `instagram_revealed` | After successful `incrementReveal`     |

Today they only `console.debug` and forward to `window.gtag` if it's present. Swap to Plausible / Firebase Analytics later — call sites won't change.

---

## 12. Decisions log (and reversals to watch out for)

| # | Decision                                                            | Why                                                                  |
|---|---------------------------------------------------------------------|----------------------------------------------------------------------|
| 1 | **HashRouter, not BrowserRouter**                                   | GitHub Pages doesn't do server-side rewrites without hacks. Clean.   |
| 2 | **Vite `base: '/gatemate/'`**                                       | Site lives at a sub-path on `rishabhramteke.github.io`.               |
| 3 | **No login**                                                        | Friction kills MVP signups; rules + consent flag are enough.          |
| 4 | **Client-side filtering after `where(airportCode, status, expiresAt)`** | Composite range queries on Firestore are awkward; client filter is fine for MVP scale. |
| 5 | **`HashRouter` + a `404.html` redirect**                            | Belt-and-braces for users who paste a `/path` URL.                    |
| 6 | **Reveal action increments a counter, doesn't gate the field**      | Firestore cannot field-mask client reads without a backend; UX gate + audit counter is the practical compromise. |
| 7 | **Friends-only is symmetric**                                       | Avoids accidental dating overlaps; keeps the matrix simple.           |
| 8 | **Profiles never delete from client**                               | Prevent griefing. Cleanup belongs in a Cloud Function or admin tool.  |

When any of these change, update this section *and* the relevant code, in the same PR.

---

## 13. Roadmap snapshot (post-MVP)

- **App Check + reCAPTCHA v3** to throttle abuse.
- **Cloud Function** that sweeps expired profiles nightly.
- **`reports` collection** + admin tool to action hide/ban requests.
- **Realtime updates**: swap `getDocs` for `onSnapshot` so the match page updates as people land.
- **More airports**: dynamic list, possibly with airport search / autocomplete.
- **Email-based handle verification** (or magic link) before reveal.
- **Lounge / terminal hint** so users can suggest a meeting spot without sharing GPS.

---

## 14. How to resume work after a context reset

1. **Read this doc end-to-end.** It captures every non-obvious decision.
2. Check `git log --oneline -20` for what's shipped recently.
3. Read `firestore.rules` to refresh your mental model of what the DB enforces.
4. Run `npm run dev` with a populated `.env` to interact with the app.
5. The matching invariants live in `src/services/matching.ts` and the rules live in `firestore.rules`. Treat them as a pair — if you change one, change the other.
