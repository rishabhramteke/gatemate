# Firebase setup — resume here when ready

> Paused on **2026-05-03**. Resume from **Step 1** below — none of the Firebase work has been done yet.

When this file's checklist is done, the site at https://rishabhramteke.github.io/gatemate/ stops being demo-mode and actually persists signups + matches.

**Total time:** ~35–45 minutes of clicking. No coding.
**Have ready:** a notepad to copy-paste 8 strings into GitHub at the end.

---

## Where you are right now

- ✅ Code is ready (hybrid Instagram + email-link verification flow).
- ✅ CI is green; site is live in **demo mode** (form works, no DB writes).
- ✅ Repo public on GitHub Pages — anonymity migration deferred until after Firebase works.
- ⬜ No Firebase project created yet.
- ⬜ No GitHub secrets set.
- ⬜ No Firestore rules deployed.

When the steps below are done, ping the assistant with: **"Done. Project ID is `<whatever>`."**

---

## Step 1 — Create the Firebase project (~5 min)

1. Go to **https://console.firebase.google.com**, signed in with whichever Google account you want to own this project. (Ownership can be transferred later — only the *project ID* is permanent.)
2. Click the big **Create a project** card.
3. Project name: `gatemateapp` (or any name — this becomes part of the URL: `gatemateapp.web.app`).
4. Confirm the suggested project ID below the name, or click the pencil to customize. **Write this down** — you'll need it for the GitHub secret and for telling the assistant when you're done.
5. Click **Continue**.
6. Google Analytics: **toggle OFF**. Click **Continue**.
7. Click **Create project**. Wait ~30 s. Click **Continue** when ready.

✅ You land on a colorful project home page.

---

## Step 2 — Turn on Firestore (~3 min)

1. Left sidebar → expand **Build** → click **Firestore Database**.
2. Click **Create database**.
3. Location: **`eur3 (europe-west)`** (or `nam5` for US — whatever's closest to your users). **Cannot be changed later.**
4. Click **Next** → choose **Start in production mode** → **Create**.
5. Wait ~1 minute. You'll land on an empty database screen.

✅ Database on but empty.

---

## Step 3 — Turn on email-link sign-in (~3 min) — *required for verification*

Without this, magic-link emails cannot be sent.

1. Left sidebar → **Build** → **Authentication**.
2. Click **Get started**.
3. Click **Email/Password** in the providers list.
4. Toggle ON **both**:
   - **Email/Password** (top toggle)
   - **Email link (passwordless sign-in)** (bottom toggle) — *this is the important one*
5. Click **Save**.

✅ "Email/Password" shows in the providers list with a green check.

---

## Step 4 — Add authorized domains (~2 min)

Firebase refuses to send magic links to untrusted domains.

1. Still in **Authentication**, click the **Settings** tab.
2. Click **Authorized domains** in the sub-menu.
3. You should already see:
   - `localhost`
   - `<your-project-id>.firebaseapp.com`
   - `<your-project-id>.web.app`
4. Click **Add domain** and add `rishabhramteke.github.io` so the current GitHub Pages URL works during testing.

✅ Four entries listed.

---

## Step 5 — Register the Web app + copy 7 config values (~3 min)

1. Top-left **gear icon** (next to "Project Overview") → **Project settings**.
2. Scroll to **Your apps**.
3. Click **`</>`** (Web).
4. App nickname: `gatemate-web`.
5. **Do NOT check** "Also set up Firebase Hosting".
6. Click **Register app**.
7. You'll see a code block:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "gatemateapp.firebaseapp.com",
     projectId: "gatemateapp",
     storageBucket: "gatemateapp.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc...",
     measurementId: "G-XXXX"   // may be missing — that's fine
   };
   ```
8. **Copy the whole block into your notepad.**
9. Click **Continue to console**.

✅ Seven values written down.

---

## Step 6 — Download the service account JSON (~2 min)

This file is a master key — treat it like a password.

1. **Project settings** (gear icon) → **Service accounts** tab.
2. Click **Generate new private key**.
3. Confirm with **Generate key**.
4. A `.json` file downloads. **Don't open it. Don't share it.**

✅ One JSON file in your Downloads folder.

---

## Step 7 — Paste 8 secrets into GitHub (~12 min)

### 7a. Open the secrets page
1. Visit **https://github.com/rishabhramteke/gatemate**.
2. Click **Settings** tab.
3. Left sidebar: **Secrets and variables** → **Actions**.

### 7b. Add the 7 small secrets

For each row: click **New repository secret** → type the **Name** exactly → paste the **Value** (no surrounding quotes!) → click **Add secret**.

| Name (exactly) | Value |
|---|---|
| `VITE_FIREBASE_API_KEY` | next to `apiKey:` |
| `VITE_FIREBASE_AUTH_DOMAIN` | next to `authDomain:` |
| `VITE_FIREBASE_PROJECT_ID` | next to `projectId:` |
| `VITE_FIREBASE_STORAGE_BUCKET` | next to `storageBucket:` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | next to `messagingSenderId:` |
| `VITE_FIREBASE_APP_ID` | next to `appId:` |
| `VITE_FIREBASE_MEASUREMENT_ID` | next to `measurementId:` (skip if missing) |

### 7c. Add the 8th secret — the JSON file
1. Open the JSON file (TextEdit on Mac / Notepad on Windows).
2. **Cmd/Ctrl+A → Cmd/Ctrl+C**.
3. GitHub → **New repository secret**.
4. Name: `FIREBASE_SERVICE_ACCOUNT` (case-sensitive).
5. Paste the entire JSON content.
6. Click **Add secret**.

✅ Repository secrets page lists **8 secrets** (7 if you skipped MEASUREMENT_ID).

---

## Step 8 — Ping the assistant

Send a message like:
> Done. Project ID is `gatemateapp`.

(Use the project ID from Step 1.)

The assistant will then:
1. Deploy `firestore.rules` and `firestore.indexes.json` to your project.
2. Push a commit so the GitHub Pages workflow rebuilds with the new secrets baked in.
3. End-to-end test: form → email link → Firestore write → matches page.
4. Hand back results so you can test from a real device.

After that's verified, the **anonymity migration** (Firebase Hosting + private repo) can be picked up — see the top of `next_steps.md`.

---

## Common mistakes

- **Magic link in spam** → expected on first send; mark Not Spam.
- **"Verification failed"** → link expired (15 min) or clicked on a different device than where you started signup. Send a fresh one.
- **Pasted with quotes** → click the secret in GitHub → Update → paste again without surrounding `"`.
- **Lost the config block** → Firebase: gear → Project settings → Your apps → click `gatemate-web` → "SDK setup and configuration".
- **Lost the JSON file** → generate a new one (Step 6). Old keys can be revoked later in the same tab.
