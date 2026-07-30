# Deploying the Backend on Render

Your FastAPI backend can run on Render's free tier. Because Render doesn't
provide MongoDB, you'll use **MongoDB Atlas** (free) for the database. The
frontend stays on Vercel and just points at the Render URL.

---

## Step 1 — Create a free MongoDB (Atlas)

1. Go to https://www.mongodb.com/cloud/atlas → sign up → create a **free M0 cluster**.
2. **Database Access** → Add a database user (username + password). Save them.
3. **Network Access** → Add IP Address → **Allow access from anywhere** (`0.0.0.0/0`).
   (Render's IPs are dynamic on the free plan, so this is required.)
4. **Connect → Drivers → Python** → copy the connection string. It looks like:
   ```
   mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   Replace `USER` / `PASSWORD` with the ones you created. This is your **MONGO_URL**.

---

## Step 2 — Push this repo to GitHub

In the Emergent chat, use **"Save to GitHub"** to push the project (includes the
`render.yaml` I added at the repo root).

---

## Step 3 — Create the service on Render (Blueprint = easiest)

1. Go to https://dashboard.render.com → **New +** → **Blueprint**.
2. Connect your GitHub repo. Render auto-detects `render.yaml` and shows a
   service called **leadgen-backend**.
3. Render will prompt you for the secret env vars (the ones marked "sync:false"):

   | Variable            | What to enter |
   |---------------------|----------------|
   | `MONGO_URL`         | your Atlas connection string from Step 1 |
   | `PUBLIC_BASE_URL`   | leave blank for now → fill after first deploy (Step 4) |
   | `GOOGLE_CLIENT_ID`  | `555647542880-5eqht2lc7r2qbe6qsicbm4hhairduicu.apps.googleusercontent.com` |
   | `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` (your OAuth secret) |
   | `LEAD_WEBHOOK_URL`  | leave blank (optional) |

   (The non-secret ones — `DB_NAME`, `CORS_ORIGINS`, `BOOKING_TIMEZONE`,
   `GOOGLE_CALENDAR_ID`, `PYTHON_VERSION` — are already set in `render.yaml`.)
4. Click **Apply / Create**. Render installs deps and starts the server.

---

## Step 4 — Set PUBLIC_BASE_URL + Google redirect URI

After the first deploy, Render gives you a URL like:
`https://leadgen-backend.onrender.com`

1. In Render → your service → **Environment** → set:
   `PUBLIC_BASE_URL = https://leadgen-backend.onrender.com`  → Save (it redeploys).
2. In Google Cloud Console → **Credentials** → your OAuth client → **Authorized
   redirect URIs** → add:
   `https://leadgen-backend.onrender.com/api/oauth/calendar/callback`

---

## Step 5 — Point the Vercel frontend at Render

1. In Vercel → your project → **Settings → Environment Variables**:
   `REACT_APP_BACKEND_URL = https://leadgen-backend.onrender.com`
   (no trailing slash)
2. **Redeploy** the Vercel project (CRA bakes env vars at build time).

---

## Step 6 — Connect Google Calendar (one time)

Open in your browser (signed in as toueg.leo@gmail.com):
```
https://leadgen-backend.onrender.com/api/oauth/calendar/login
```
Approve access. Bookings from the site now create events on your calendar with
invites emailed to prospects.

**Verify:**
- `https://leadgen-backend.onrender.com/api/` → `{"message": "..."}`
- `https://leadgen-backend.onrender.com/api/booking/availability` → JSON with `days`
- `https://leadgen-backend.onrender.com/api/oauth/calendar/status` → `connected: true`

---

## Notes / gotchas

- **Free plan sleeps:** Render free web services spin down after ~15 min idle;
  the first request then takes ~30–50s to wake. Upgrade to a paid instance
  (or set up an uptime pinger) if you want it always warm for prospects.
- **CORS** is currently `*` (open). Fine to launch; later you can restrict it to
  your Vercel domain by changing `CORS_ORIGINS` in Render.
- Keep `GOOGLE_CLIENT_SECRET` and `MONGO_URL` only in Render's env settings —
  never commit them to the repo.
