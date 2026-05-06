# ChargeWise AI — Deployment Guide

Full step-by-step guide to deploy the backend on Render and frontend on Vercel, with Supabase as the database.

---

## Prerequisites

Before starting, make sure you have:
- Your code pushed to GitHub (branch: `main`)
- A [Supabase](https://supabase.com) account (free)
- A [Render](https://render.com) account (free)
- A [Vercel](https://vercel.com) account (free)
- A [Groq](https://console.groq.com) API key

---

## Part 1 — Supabase (Database)

### Step 1 — Create a new project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Fill in:
   - **Name**: `chargewise`
   - **Database Password**: choose a strong password and save it somewhere safe
   - **Region**: `Southeast Asia (Singapore)` or closest to you
4. Click **Create new project** and wait ~2 minutes for it to provision

### Step 2 — Run the database init script

1. In the left sidebar click **SQL Editor**
2. Click **New query**
3. Open the file `backend/scripts/supabase_init.sql` from your project
4. Copy the entire contents and paste into the SQL editor
5. Click **Run** (or press `Ctrl+Enter`)
6. You should see: `Success. No rows returned`

This creates:
- `charging_sessions` table
- `feeder_load` table
- `alembic_version` table (so migrations are marked as done)

### Step 3 — Get your connection string

1. In the left sidebar go to **Settings → Database**
2. Scroll down to **Connection string**
3. Select the **URI** tab
4. Make sure **Session mode** is selected (port `5432`)
5. Copy the full string — it looks like:
   ```
   postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-1-ap-southeast-2.pooler.supabase.com:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the password you set in Step 1
7. Save this — you'll need it in the next part

---

## Part 2 — Render (Backend)

### Step 1 — Connect your GitHub repo

1. Go to [render.com](https://render.com) and sign in
2. Click **New +** → **Web Service**
3. Click **Connect a repository**
4. Authorize Render to access your GitHub if prompted
5. Find and select your `ChargeWise_AI` repository
6. Click **Connect**

### Step 2 — Configure the service

Fill in the settings exactly as below:

| Field | Value |
|---|---|
| **Name** | `chargewise-backend` |
| **Region** | Singapore (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

### Step 3 — Add environment variables

Scroll down to **Environment Variables** and add each one:

| Key | Value |
|---|---|
| `DATABASE_URL` | Your Supabase connection string from Part 1 Step 3 |
| `GROQ_API_KEY` | Your Groq API key from [console.groq.com](https://console.groq.com) |
| `USE_AI_DEMO_DATA` | `true` |
| `SCENARIO_MODE` | `NORMAL` |
| `DEBUG` | `false` |
| `CORS_ORIGINS` | `https://your-app.vercel.app` ← leave as placeholder for now, update after Part 3 |

### Step 4 — Deploy

1. Click **Create Web Service**
2. Render will start building — this takes 3–5 minutes on first deploy
3. Watch the build logs — you should see:
   ```
   Successfully installed ...
   INFO: Application startup complete.
   ```
4. Once the status shows **Live**, copy your backend URL — it looks like:
   ```
   https://chargewise-backend.onrender.com
   ```
5. Test it by opening `https://chargewise-backend.onrender.com/` in your browser
   - You should see: `{"status":"ok","message":"ChargeWise AI + Grid Optimizer API"}`

> **Note:** The free tier on Render spins down after 15 minutes of inactivity. The first request after sleep takes ~30 seconds to wake up. This is normal on the free plan.

---

## Part 3 — Vercel (Frontend)

### Step 1 — Set the backend URL

Before deploying, update `frontend/.env` with your Render URL:

```
VITE_API_URL=https://chargewise-backend.onrender.com
```

Commit and push this change:
```bash
git add frontend/.env
git commit -m "chore: set production API URL"
git push origin main
```

### Step 2 — Import your project on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New... → Project**
3. Click **Import Git Repository**
4. Authorize Vercel to access your GitHub if prompted
5. Find and select your `ChargeWise_AI` repository
6. Click **Import**

### Step 3 — Configure the project

On the configuration screen:

| Field | Value |
|---|---|
| **Framework Preset** | `Vite` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### Step 4 — Add environment variable

Still on the same screen, expand **Environment Variables** and add:

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://chargewise-backend.onrender.com` |

### Step 5 — Deploy

1. Click **Deploy**
2. Vercel builds in ~1–2 minutes
3. Once done you'll see a success screen with your live URL:
   ```
   https://chargewise-ai.vercel.app
   ```
   (the exact subdomain will vary)
4. Click **Visit** to open your live app and verify it loads

---

## Part 4 — Wire them together

Now that both are deployed, update the CORS setting on Render so the backend accepts requests from your Vercel frontend.

### Step 1 — Update CORS on Render

1. Go to your Render service → **Environment** tab
2. Find `CORS_ORIGINS` and update the value to your actual Vercel URL:
   ```
   https://chargewise-ai.vercel.app
   ```
   If you have multiple origins (e.g. a custom domain too), separate with commas:
   ```
   https://chargewise-ai.vercel.app,https://yourdomain.com
   ```
3. Click **Save Changes**
4. Render will automatically redeploy with the new value

### Step 2 — Verify end-to-end

1. Open your Vercel URL in the browser
2. The dashboard should load with live data (or Demo Mode badge if backend is sleeping)
3. Navigate through all pages — Dashboard, Forecast, Schedule, Risk, Pricing, Anomalies, Planning, Hierarchy, System Overview
4. If you see **Demo Mode** badge on any page, the frontend is working but the backend is either sleeping (wait 30s and refresh) or the `VITE_API_URL` is wrong

---

## Troubleshooting

**Backend build fails on Render**
- Check the build logs for the exact error
- Most common cause: a package in `requirements.txt` fails to install
- Make sure `psycopg2-binary` is in requirements (not `psycopg2`)

**`CORS` errors in browser console**
- `CORS_ORIGINS` on Render doesn't match your Vercel URL exactly
- Make sure there's no trailing slash: `https://app.vercel.app` not `https://app.vercel.app/`

**Database connection errors on Render**
- Double-check `DATABASE_URL` — the password must not contain unescaped special characters
- Make sure you're using port `5432` (session mode), not `6543` (transaction mode)
- The SSL cert (`prod-ca-2021.crt`) is bundled in `backend/` — Render will find it automatically

**Frontend shows blank page on Vercel**
- Make sure `frontend/vercel.json` is present (it handles SPA routing)
- Check that **Root Directory** is set to `frontend` in Vercel settings, not the repo root

**`VITE_API_URL` not working**
- Vercel only injects env vars that start with `VITE_` into the frontend build
- After adding/changing the env var in Vercel, you must trigger a redeploy: go to **Deployments → Redeploy**

---

## Summary

```
Supabase  →  PostgreSQL database (tables created via SQL Editor)
    ↓
Render    →  FastAPI backend (reads DB via SSL, serves /v1/* API)
    ↓
Vercel    →  React frontend (calls Render backend via VITE_API_URL)
```

Once all three are live and wired together, your app is fully deployed.
