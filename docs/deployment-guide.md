# Palmadex 360 deployment guide

The app runs on three free services:

| Part | Service | What it hosts |
|---|---|---|
| Database | Neon | PostgreSQL |
| Backend (API) | Render | `server/` (Node.js, Express, Prisma, Socket.IO) |
| Frontend | Vercel | `client/` (React, Vite) |

Uploaded documents and face photos are stored in the database, so nothing is lost when Render restarts or redeploys (Render's free disk is wiped each time).

## 0. Before anything else: rotate the old database password

The previous Palmadex360 repository had `server/.env.production` and `server/env.local` committed to Git, with the Neon connection string inside. Anyone with access to the repository history can read that password.

1. In Neon, open the project, go to **Roles**, and reset the password of the role used by the app.
2. Use the new password in the connection strings below.

This version no longer tracks any `.env` file. Only `client/.env.production` is kept on purpose: it holds the public API address and nothing secret.

## 1. Database (Neon)

This version starts from a fresh database. Its single migration creates every table, so it cannot be applied on top of the old Palmadex tables.

1. In Neon, create a new database in your project (for example `palmadex360`), or a new project. Keep the old database as a backup until you are happy.
2. Click **Connect** and copy two connection strings:
   - **Pooled** (host contains `-pooler`). Add `&pgbouncer=true&connect_timeout=15` to the end. This is `DATABASE_URL`.
   - **Direct** (turn "Connection pooling" off). Add `&connect_timeout=15`. This is `DIRECT_URL`.

Both must include `sslmode=require`, which Neon adds by default.

## 2. Backend (Render)

Create (or edit) the web service connected to the GitHub repository:

| Setting | Value |
|---|---|
| Root directory | `server` |
| Runtime | Node |
| Build command | `npm ci && npm run build` |
| Start command | `npm start` |
| Health check path | `/api/v1/health` |
| Instance type | Free |

`npm run build` generates the Prisma client and applies the database migration (`prisma migrate deploy`), so every deploy keeps the database schema up to date.

Environment variables (Environment tab):

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `NODE_VERSION` | `22` |
| `JWT_SECRET` | a long random string (at least 32 characters). Generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `DATABASE_URL` | the pooled Neon string from step 1 |
| `DIRECT_URL` | the direct Neon string from step 1 |
| `APP_URL` | `https://palmadex360.vercel.app` (or your custom domain) |
| `CORS_ORIGINS` | only if the frontend uses another address, comma separated, e.g. `https://app.palmadex.com` |
| `BREVO_API_KEY` | see step 4 |
| `MAIL_FROM` | `Palmadex 360 <your-verified-sender@example.com>` |
| `FACE_ENROLLMENT_REQUIRED` | `true` |

`render.yaml` in the repository root holds the same settings if you prefer to create the service as a Blueprint.

Free-plan behaviour to expect: the service sleeps after about 15 minutes without traffic, and the first request after that takes up to a minute while it wakes. Live chat falls back to polling automatically if WebSockets drop.

## 3. Frontend (Vercel)

| Setting | Value |
|---|---|
| Root directory | `client` |
| Framework preset | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |

Environment variable: `VITE_API_URL` = `https://palmadex360.onrender.com/api/v1` (use your Render address). `client/.env.production` already holds this value, so the variable is only needed if the address is different.

`client/vercel.json` sends every route to `index.html`, so links such as `/procurement?tab=quality` work on refresh.

If you use Vercel preview deployments, add each preview address to `CORS_ORIGINS` on Render, or test on the production address.

## 4. Email (Brevo, free)

Render's free plan blocks outbound SMTP (ports 25, 465 and 587) since September 2025, so the app sends email over HTTPS through Brevo instead. Brevo's free plan allows 300 emails a day.

1. Create a Brevo account.
2. **Senders, domains & dedicated IPs > Senders**: add and verify the address emails should come from.
3. **SMTP & API > API keys**: create a key.
4. On Render set `BREVO_API_KEY` to the key and `MAIL_FROM` to `Palmadex 360 <that verified address>`.

Without an email service, emails (verification links, password resets, approvals) are written to the Render log instead. Admins can still approve people and use **Mark verified** in User & Access Management.

If you later move the API to a host that allows SMTP, leave `BREVO_API_KEY` empty and fill `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` and `SMTP_PASS`.

## 5. First sign-in

1. Open the Vercel address and register. The very first account in an empty database becomes the **Super Admin** automatically.
2. Take the face photo when asked.
3. Invite or approve the other users in **User & Access Management**, and give each the right role.
4. Open **Procurement > Checklists** to review the quality checklists (see the platform guide).

## 6. Pushing the code

This folder keeps the full Git history of the Palmadex360 repository. The update is left as uncommitted changes so you can review them first:

```
git status
git add -A
git commit -m "Palmadex 360: full platform on PostgreSQL, quality checks in procurement"
git push origin main
```

`git status` also shows the old `.env`, `.sql` and `.csv` files as deleted. That is intended: they held passwords and user data and are no longer tracked. They remain in older commits, which is why step 0 asks you to change the database password.

Render and Vercel deploy automatically when `main` changes (if auto-deploy is on).

## Running locally

```
cd server
cp .env.example .env        # fill in JWT_SECRET, DATABASE_URL and DIRECT_URL
npm install
npx prisma migrate deploy
npm run dev

cd ../client
cp .env.example .env.local
npm install
npm run dev
```

A local PostgreSQL or a separate Neon branch both work for `DATABASE_URL`. Use a different database from production.
