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

### Core flow (hybrid Instagram + email verification)
1. **Landing** → CTA "Find people at my airport".
2. **`/signup`** → nickname, age, gender, interested-in, airport, layover start/end, Instagram handle, optional flight number, vibe tags, consent checkbox. **No email yet.** On submit the draft is saved to `localStorage` and we navigate to `/verify`.
3. **`/verify`** → "Almost there ✨" screen asks for an email. We call Firebase Auth `sendSignInLinkToEmail` with `handleCodeInApp: true`. Show "check your inbox".
4. **User clicks the magic link** in their email → returns to `/verify`.
5. **`/verify` (return mode)** detects `isSignInWithEmailLink`, calls `signInWithEmailLink`, reads the draft from `localStorage`, calls `createVerifiedProfile()` which writes to Firestore with `userId = auth.uid`, `emailVerified = true`, `status = 'active'`. Draft is cleared. Navigate to `/matches`.
6. **`/matches`** uses `auth.currentUser` → loads viewer's latest active profile via `getMyLatestActiveProfile()` → queries other profiles at the same airport → runs matching → renders cards.
7. **Match cards** → nickname, age, ✓ Verified badge, vibe, overlap window. Instagram handle is **hidden** until the viewer taps **Reveal Instagram** (which bumps `revealCount` server-side).
8. **Expiry** → profiles auto-disappear from results once `expiresAt` (= `layoverEnd`) is in the past.

Why hybrid: Instagram is the **public social contact channel**, email is the **private anti-spam verification channel**. Email is never displayed to other users or used for marketing in MVP. Security rules require `request.auth.token.email_verified == true` on every create, so a misbehaving client *cannot* set `emailVerified: true` itself.

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
  userId: string;            // == auth.uid; rules pin this to request.auth.uid
  nickname: string;          // 1–40 chars
  age: number;               // 18–99
  gender: 'woman' | 'man' | 'nonbinary' | 'other';
  interestedIn: 'women' | 'men' | 'everyone' | 'friends';
  airportCode: string;       // 3-letter IATA, uppercase
  layoverStart: Timestamp;
  layoverEnd: Timestamp;     // must be > layoverStart
  instagram: string;         // handle without leading '@', lowercased
  email: string;             // == auth.token.email; rules pin this
  emailVerified: boolean;    // must be true to create; rules require auth token email_verified
  flightNumber?: string;     // optional, uppercased
  vibe: Vibe[];              // 0–6 of: coffee, drinks, walk, chat, dating, friends
  consent: boolean;          // must be true to create
  createdAt: Timestamp;      // server-side at create
  expiresAt: Timestamp;      // == layoverEnd (used for read filter and TTL)
  status: 'pending_verification' | 'active' | 'expired' | 'hidden';
  revealCount: number;       // incremented on Reveal; the only mutable field
}
```

We currently **never write `pending_verification`** — drafts are parked in `localStorage` and only land in Firestore once the email link is clicked, at which point we write `status='active'` directly. The status enum still includes `pending_verification` for forward-compat (e.g. a future flow that stores drafts server-side for cross-device verification).

### Why `expiresAt == layoverEnd`
- Reads are filtered by `expiresAt > request.time` — once the layover ends, the profile is invisible without a server-side cleanup.
- A future Cloud Function can sweep `expiresAt < now` and mark `status = 'expired'` (or hard-delete for retention).

### Indexes

| Fields                                                                          | Purpose                                          |
|---------------------------------------------------------------------------------|--------------------------------------------------|
| `airportCode ASC` + `status ASC` + `emailVerified ASC` + `expiresAt ASC`        | `listActiveByAirport` — show only verified, active, non-expired profiles per airport |
| `userId ASC` + `status ASC` + `expiresAt DESC`                                  | `getMyLatestActiveProfile` — pull the viewer's most recent live profile             |

(declared in `firestore.indexes.json` — `firebase deploy --only firestore:indexes` to apply.)

---

## 5. Matching algorithm

A profile **other** matches viewer **u** iff:

```
other.id          != u.profileId
other.userId      != u.userId        # exclude all of viewer's other profiles too
other.airportCode == u.airportCode
other.status      == 'active'
other.emailVerified == true
other.expiresAt   > now
u.layoverStart    < other.layoverEnd
u.layoverEnd      > other.layoverStart
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

- `read` only when `status == 'active' && emailVerified == true && expiresAt > request.time`.
- `create` requires:
  - `request.auth != null` (must be signed in via Firebase Auth)
  - `request.auth.token.email_verified == true` (email-link sign-in sets this)
  - `request.resource.data.userId == request.auth.uid` (no impersonation)
  - `request.resource.data.email == request.auth.token.email` (email pinned to auth claim)
  - `request.resource.data.emailVerified == true`
  - all required fields present and well-typed
  - `consent == true`, `status == 'active'`, `revealCount == 0`
  - `age` in `[18, 99]`, nickname/instagram/email length caps
  - `airportCode` is exactly 3 chars, `gender` and `interestedIn` from a fixed enum
  - `layoverEnd > layoverStart` and `expiresAt == layoverEnd`.
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
│  │  ├─ VibeSelector.tsx
│  │  └─ airportMap/                     "Vibe map" — abstract airport activity visualization
│  │     ├─ AirportActivityMap.tsx       SVG composition: hub + terminal blobs + sparkles
│  │     ├─ TerminalZone.tsx             one zone (radial gradient + SMIL pulse glow)
│  │     ├─ ActivityHeader.tsx           airport name + global activity headline
│  │     ├─ ActivityTooltip.tsx          per-terminal floating card
│  │     ├─ colors.ts                    score → pastel palette (sky → peach → coral)
│  │     └─ index.ts
│  ├─ pages/
│  │  ├─ LandingPage.tsx
│  │  ├─ SignupPage.tsx
│  │  └─ MatchResultsPage.tsx            embeds <AirportActivityMap />
│  ├─ services/
│  │  ├─ analytics.ts                    track() shim
│  │  ├─ matching.ts                     overlap + compatibility logic
│  │  └─ profiles.ts                     Firestore CRUD
│  ├─ utils/
│  │  ├─ airports.ts                     AMS, BCN, CDG, FRA, LHR, MAD, FCO, IST, DXB, DOH
│  │  ├─ airportActivity.ts              MOCK activity data + headline helpers (swap for real API)
│  │  └─ time.ts                         format helpers
│  ├─ types/
│  │  ├─ index.ts                        LayoverProfile, ProfileDraft, MatchView, etc.
│  │  └─ activity.ts                     TerminalActivity, AirportActivity
│  ├─ firebase.ts                        init (no-op without env vars → "demo mode")
│  ├─ App.tsx                            HashRouter
│  ├─ main.tsx
│  └─ index.css                          Tailwind + warm @layer components
├─ firestore.rules
├─ firestore.indexes.json
├─ index.html
├─ tailwind.config.js                    pastel palette + animations + Quicksand display font
├─ postcss.config.js
├─ vite.config.ts                        base: '/gatemate/'
├─ tsconfig.json + tsconfig.app.json + tsconfig.node.json
├─ .env.example
├─ next_steps.md                         live punch list — read this when planning the next session
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
| 3 | **Email-link auth, not full passwords**                             | Verification without password fatigue. Email is private (not shown). Phase-2: bio-code IG verification. |
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

## 14. Design system (cute, warm, cozy)

The aesthetic is **"a quiet café at the airport"** — calm, safe, inviting, *not* aggressive like a dating app.

### Tokens (Tailwind)
- **Palette:** soft pastels — `peach.{50..600}` (warm), `cream`, `sand`, `dusk`, `skyish.{50..500}` (cool). Body backdrop is a layered radial gradient of those tones, fixed-attachment so it stays put while scrolling.
- **Fonts:** body `Inter` (400–700), headings `Quicksand` (500–700) → applied via `font-display` utility on `<h1>/<h2>/<h3>` and selected callouts. Loaded together from Google Fonts.
- **Shadows:** `shadow-soft` (warm peach falloff), `shadow-card` (warm grey falloff), `shadow-glow` (peach ring on hover).
- **Radii:** everything 16–24px; `rounded-3xl` for cards, `rounded-blob` (32px) for hero blocks, `rounded-full` for buttons and chips.
- **Animations:** `fade-in`, `fade-in-soft`, `float`, `sparkle`, `pulse-glow`, `drift-x`. Matches and steps animate in with staggered `animationDelay`.
- **Hover scale:** cards use `hover:scale-[1.02]` + slight `-translate-y-0.5` via `card-hover`.
- **Buttons:** `btn-primary` is a peach gradient pill with soft shadow → glow ring on hover; `btn-ghost` is a translucent pill with peach border.

### Microcopy bank
- "Stuck at an airport? Meet someone during your layover."
- "Someone else is waiting too ✨"
- "You might not be alone this layover ✨"
- "Cosy hour · someone might land soon ☁️"
- "Looking around the airport ✨"
- "A little safety hug 🤍"

If you change the palette or copy, keep it in this section so the next session knows the *why*.

---

## 15. AirportActivityMap (vibe map, not a GPS map)

A deliberately **abstract** airport visualization that makes the place feel alive without exposing user locations.

### Inputs (typed in `src/types/activity.ts`)
```ts
interface TerminalActivity {
  id: string;
  activityScore: number; // 0..1, derived from arrivals/departures/time-of-day/airport busyness
  userCount: number;     // GateMate travelers in this terminal's window
}
interface AirportActivity {
  airportCode: string;
  airportName: string;
  terminals: TerminalActivity[];
  globalActivityScore: number;
}
```

### Where the data comes from
- Today: `src/utils/airportActivity.ts` — hand-picked fixtures for AMS/LHR/CDG/DXB plus a deterministic synthesizer fallback for any other airport (sin-wave seeded by code + current hour, so it changes through the day without flickering).
- Tomorrow: replace `fetchActivity()` with a real API call (AeroDataBox, OpenSky, FlightRadar24) + a 5-min cache. The shape stays. Call sites don't change.

### What we deliberately *do not* show
- Exact user positions, real-time tracking, precise coordinates, real map tiles.

### What we *do* show
- Terminal-level **zones** rendered as pastel SVG blobs.
- Glow pulses sized by `activityScore` (more activity → larger, faster, warmer pulses; SMIL animation).
- Floating sparkle dots for atmosphere.
- A central "hub" with the airport code.
- Per-terminal tooltip on click: "Terminal B · High activity ✨ · 3 travelers in your time window · Best time: 15:00 – 17:00".

### Visual mapping (`colors.ts`)
- Score < 0.34 → soft sky (`#bae6fd` outer / `#7dd3fc` glow / `#075985` ink).
- Score 0.34–0.67 → warm peach (`#fed7aa` outer / `#fdba74` glow / `#9a3412` ink).
- Score ≥ 0.67 → glowing coral (`#fdba74` outer / `#fb923c` glow / `#9a3412` ink).

### Empty-state philosophy
- `userCount === 0` **never** renders an "empty" message inside the map — it shows "quiet" instead and the tooltip says "No travelers yet — try again in the next hour ✨".
- The map *always* feels alive thanks to the activity-driven glow + sparkles, even when no GateMate users are around.

### Component layout
- `AirportActivityMap` — orchestrator (positions, sparkles, hub, lines).
- `ActivityHeader` — sticky-feeling glass header above the SVG.
- `TerminalZone` — one zone; outer `<g>` does positioning, inner `<g>` does CSS hover scale (so they don't fight).
- `ActivityTooltip` — floating glass card overlay.

### Tech constraints respected
- **No** Mapbox / Leaflet / Google Maps / any external map lib.
- Pure React + TS + Tailwind + inline SVG with SMIL (no canvas, no webgl).
- Self-contained: drop `<AirportActivityMap airportCode="AMS" />` anywhere.

---

## 16. How to resume work after a context reset

1. **Read this doc end-to-end.** It captures every non-obvious decision.
2. **Read `next_steps.md`** to see what's still on the punch list.
3. Check `git log --oneline -20` for what's shipped recently.
4. Read `firestore.rules` to refresh your mental model of what the DB enforces.
5. Run `npm run dev` with a populated `.env` to interact with the app.
6. The matching invariants live in `src/services/matching.ts` and the rules live in `firestore.rules`. Treat them as a pair — if you change one, change the other.
7. The activity map's data contract lives in `src/types/activity.ts`. The mock provider is `src/utils/airportActivity.ts` — replace `fetchActivity()` with the real API when you have one; the rest of the UI doesn't need to change.
