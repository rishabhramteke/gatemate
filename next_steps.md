# GateMate — Next Steps

> Running checklist of work that's *not yet done*. Cross items off as you go. New ideas land at the bottom of "Later".

---

## 🚦 Make matching actually work (do these now)

- [ ] **Create the Firebase project**
  - Go to https://console.firebase.google.com/ → *Add project* (e.g. `gatemate-prod`).
  - Enable **Cloud Firestore** in *production mode*. Pick a region close to most users (e.g. `eur3` for EU traffic).

- [ ] **Register the web app**
  - In *Project settings → Your apps → Add app → Web*. Nickname: `gatemate-web`.
  - Copy the seven config values (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId, measurementId).

- [ ] **Local `.env`**
  - `cp .env.example .env` and paste the values prefixed with `VITE_FIREBASE_…`.
  - Run `npm install && npm run dev` — the demo-mode banner should disappear and form submissions should land in Firestore.

- [ ] **GitHub repo secrets**
  - Repo → Settings → *Secrets and variables → Actions → New repository secret*.
  - Add all seven `VITE_FIREBASE_*` keys with the same values.

- [ ] **Deploy Firestore rules + indexes**
  ```bash
  npm i -g firebase-tools
  firebase login
  firebase use --add        # select the gatemate project
  firebase deploy --only firestore:rules,firestore:indexes
  ```
  - Verify the composite index (`airportCode ASC + status ASC + expiresAt ASC`) is *Enabled* in the Firestore console under *Indexes*.

- [ ] **Trigger a redeploy with secrets**
  - Push any commit to `main` (or run *Actions → Deploy GateMate to GitHub Pages → Re-run all jobs*).
  - Confirm green build + visit https://rishabhramteke.github.io/gatemate/ and submit a test profile.

- [ ] **Smoke test the full flow**
  - Submit two overlapping profiles from two browsers (or incognito) at the same airport.
  - Confirm they appear in each other's match list.
  - Tap *Reveal Instagram* — confirm `revealCount` increments in the Firestore console.
  - Wait until `layoverEnd` passes; confirm the profile disappears from results.

---

## 🛡 Hardening (next sprint)

- [ ] **Enable Firebase App Check + reCAPTCHA v3** to throttle spam profile creation.
- [ ] **Cloud Function** scheduled job to mark profiles `status='expired'` once `expiresAt < now`, and hard-delete after 7 days for retention hygiene.
- [ ] **`reports` collection + admin tool** so the placeholder *Report / hide* button does something real.
- [ ] **Rate-limit profile creation per IP** (Cloud Function + simple Firestore counter, or App Check).
- [ ] **Error monitoring** — wire Sentry or LogRocket for the prod build. The free tier covers MVP traffic.
- [ ] **Privacy policy + Terms page** linked from the footer (required if you ship beyond friends).

## 🎯 Product polish

- [ ] Real "Best time" window in the activity map tooltip — derive from actual flight schedules (AeroDataBox, OpenSky, FlightRadar24 API).
- [ ] Replace mock `airportActivity` with a real activity API + 5-minute client cache.
- [ ] Live updates on the matches page — swap `getDocs` for `onSnapshot` so a new traveler appears without refresh.
- [ ] Airport autocomplete instead of a fixed list of ten codes.
- [ ] "Save my session" via a one-time email link so a user can re-open their match list from another device.
- [ ] Internationalization — copy is friendly but English-only today.

## 🧪 Quality gates

- [ ] Add unit tests for `services/matching.ts` — `isCompatible` matrix and overlap math.
- [ ] Add a couple of Playwright happy-path tests (load → fill form → see matches).
- [ ] CI step: `npm run typecheck` + `npm run lint` before build.

## 📈 Growth experiments

- [ ] Embeddable **"who's at YOUR airport"** widget for travel blogs.
- [ ] Shareable result link (read-only) — increases viral loop without requiring auth.
- [ ] QR codes printed for niche events (digital nomad meetups) that pre-fill the airport.

## 💭 Later / parking lot

- [ ] Optional photo uploads with strict moderation.
- [ ] Lounge / gate hint (no GPS — just a chip the user can pick).
- [ ] iOS Add-to-Home-Screen polish: web manifest, splash icons.
- [ ] Refactor `LayoverProfile` into versioned schema if/when the doc shape changes.

---

_Last updated: 2026-04-30. Edit freely — this file is for us, not for users._
