# Deploying the Backend on Render (no database needed)

This backend uses your **Google Calendar as the source of truth** — availability
is read live from your calendar's free/busy, and bookings create events directly
on it. There is **no database to set up**. The only persistent secret is your
Google **refresh token**, stored as an environment variable.

---

## Step 1 — Push this repo to GitHub

In the Emergent chat, use **"Save to GitHub"** to push the project (it includes
the `render.yaml` at the repo root).

---

## Step 2 — Create the service on Render (Blueprint = easiest)

1. Go to https://dashboard.render.com → **New +** → **Blueprint**.
2. Connect your GitHub repo. Render detects `render.yaml` → service **leadgen-backend**.
3. Render prompts for the secret env vars (marked "sync:false"):

   | Variable               | What to enter |
   |------------------------|----------------|
   | `PUBLIC_BASE_URL`      | leave blank for now → fill after first deploy (Step 3) |
   | `GOOGLE_CLIENT_ID`     | `555647542880-5eqht2lc7r2qbe6qsicbm4hhairduicu.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` (your OAuth secret) |
   | `GOOGLE_REFRESH_TOKEN` | leave blank for now → you'll get it in Step 4 |

   (Non-secret vars — `CORS_ORIGINS`, `BOOKING_TIMEZONE`, `GOOGLE_CALENDAR_ID`,
   `PYTHON_VERSION` — are already set in `render.yaml`.)
4. Click **Apply / Create**. Render installs deps and starts the server.

---

## Step 3 — Set PUBLIC_BASE_URL + Google redirect URI

After the first deploy, Render gives you a URL like
`https://leadgen-backend.onrender.com`.

1. Render → your service → **Environment** → set
   `PUBLIC_BASE_URL = https://leadgen-backend.onrender.com` → Save (redeploys).
2. Google Cloud Console → **Credentials** → your OAuth client → **Authorized
   redirect URIs** → add:
   `https://leadgen-backend.onrender.com/api/oauth/calendar/callback`

---

## Step 4 — Connect Google Calendar & grab the refresh token

1. In your browser (signed in as toueg.leo@gmail.com) open:
   ```
   https://leadgen-backend.onrender.com/api/oauth/calendar/login
   ```
2. Approve access (on the "unverified app" screen: Advanced → Go to app).
3. The success page shows a **GOOGLE_REFRESH_TOKEN** value. Copy it.
4. Render → your service → **Environment** → set `GOOGLE_REFRESH_TOKEN` to that
   value → Save (redeploys). This keeps you connected permanently.

> If the page says "No refresh token returned", the app was already authorized.
> Go to https://myaccount.google.com/permissions, remove the app, then repeat Step 4.

---

## Step 5 — Point the Vercel frontend at Render

1. Vercel → project → **Settings → Environment Variables**:
   `REACT_APP_BACKEND_URL = https://leadgen-backend.onrender.com` (no trailing slash)
2. **Redeploy** the Vercel project (CRA bakes env vars at build time).

---

## Verify

- `…/api/` → `{"message": "Lead-Generation.ca API"}`
- `…/api/oauth/calendar/status` → `{"configured":true,"connected":true,"token_ok":true}`
- `…/api/booking/availability` → JSON `days`; slots you've blocked in your own
  Google Calendar automatically show as unavailable.
- Book a test slot on the site → event appears on your calendar with an invite
  emailed to the address you entered.

---

## Notes / gotchas

- **No database.** Availability and double-booking are enforced by reading your
  live calendar, so anything you personally block also blocks the site.
- **Free plan sleeps** after ~15 min idle (first request wakes it in ~30–50s).
  Availability loads a moment slower on cold start. Upgrade or add an uptime
  pinger to keep it warm for prospects.
- Keep `GOOGLE_CLIENT_SECRET` and `GOOGLE_REFRESH_TOKEN` only in Render's env
  settings — never commit them.
- The OAuth **redirect URI must match the backend domain**. Google lets you list
  several, so your preview URL and the Render URL can both be added.
