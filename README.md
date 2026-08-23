# Society Maintenance Tracker

A platform for apartment societies to manage maintenance complaints end to end:
residents raise complaints with photos and track their status; the admin
triages, prioritizes, and resolves them through a recorded lifecycle; everyone
stays informed through a notice board and email notifications.

- **Backend:** Node.js, Express, PostgreSQL, Prisma ORM, JWT auth
- **Frontend:** React (Vite), React Router
- **Photo storage:** Cloudinary
- **Email:** Gmail + Nodemailer

A full architecture write-up (complaint history model, overdue detection,
photo handling, notification flow) is in [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md).

---

## 1. Project structure

```
society-maintenance-tracker/
├── backend/                  Express API
│   ├── prisma/
│   │   ├── schema.prisma     Data model (see §4 below)
│   │   ├── migrations/       SQL migrations (versioned, run with `prisma migrate deploy`)
│   │   └── seed.js           Creates a demo admin + resident account
│   ├── src/
│   │   ├── config/           DB / Cloudinary / email client setup
│   │   ├── middleware/       auth (JWT + role guard), photo upload, error handler
│   │   ├── controllers/      route handlers
│   │   ├── routes/           Express routers + input validation
│   │   ├── services/         email notification templates
│   │   └── utils/            overdue detection, sorting, settings, helpers
│   ├── test/                 unit tests + an API wiring smoke test
│   └── .env.example
├── frontend/                 React (Vite) SPA
│   ├── src/
│   │   ├── api/               axios calls per resource
│   │   ├── context/            auth context (JWT in localStorage)
│   │   ├── components/         shared UI (badges, cards, timeline, chart)
│   │   ├── pages/resident/     resident views
│   │   └── pages/admin/        admin views
│   └── .env.example
└── docs/
    └── SYSTEM_DESIGN.md
```

---

## 2. Setup guide

### 2.1 Accounts you'll need (all free tier)

| Service | Used for | Sign up |
|---|---|---|
| A PostgreSQL host — [Neon](https://neon.tech) or [Supabase](https://supabase.com) (or Render/Railway Postgres) | Database | Free tier, no credit card |
| [Cloudinary](https://cloudinary.com/users/register/free) | Complaint photo storage | Free tier |
| A Gmail account | Sending email notifications | You likely already have one |
| [Render](https://render.com) or [Railway](https://railway.app) | Hosting the backend API | Free tier |
| [Vercel](https://vercel.com) | Hosting the frontend | Free tier |
| [GitHub](https://github.com) | Source control / submission | — |

### 2.2 Generating a Gmail "App Password"

Nodemailer needs an **App Password**, not your normal Gmail password:

1. Turn on 2-Step Verification on your Google account (Google Account → Security).
2. Go to **Google Account → Security → 2-Step Verification → App passwords**.
3. Create one for "Mail" / "Other (Custom name)" → name it `society-tracker`.
4. Google gives you a 16-character password (e.g. `abcd efgh ijkl mnop`) — copy it
   into `EMAIL_APP_PASSWORD` in `backend/.env` (spaces are fine, or remove them).

### 2.3 Local development

**Prerequisites:** Node.js 18+, a PostgreSQL database (local, or a free
Neon/Supabase instance — either works, `DATABASE_URL` is all that changes).

```bash
# 1. Clone and enter the repo
git clone <your-repo-url>
cd society-maintenance-tracker

# 2. Backend
cd backend
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, Cloudinary, Gmail…
npm install                # postinstall runs `prisma generate` automatically
npx prisma migrate deploy  # applies backend/prisma/migrations/ to your database
npm run seed                # creates a demo admin + resident (see console output for credentials)
npm run dev                 # starts the API on http://localhost:4000

# 3. Frontend (in a second terminal)
cd frontend
cp .env.example .env       # point VITE_API_URL at the backend above
npm install
npm run dev                 # starts the app on http://localhost:5173
```

Log in with the seeded accounts (also printed by `npm run seed`):

- **Admin:** `admin@society.test` / `Admin@123`
- **Resident:** `resident@society.test` / `Resident@123`

Alternatively, register your own resident account from the UI, or register an
admin account by supplying `ADMIN_SIGNUP_CODE` (set in `backend/.env`) in the
"Registering as society admin?" field on the sign-up page.

### 2.4 Deploying

**Database (Neon/Supabase):** create a project, copy its connection string into
`DATABASE_URL`.

**Backend (Render):**
1. New → Web Service → connect your GitHub repo → root directory `backend`.
2. Build command: `npm install && npx prisma generate`
3. Start command: `npm run prisma:migrate && npm start` (runs migrations, then boots the server — safe to run on every deploy since Prisma tracks which migrations already applied)
4. Add all variables from `backend/.env.example` in the Render dashboard's Environment tab.
5. After the first deploy, run `npm run seed` once from Render's shell (or locally against the production `DATABASE_URL`) to create the first admin.

**Frontend (Vercel):**
1. New Project → import the repo → root directory `frontend`.
2. Framework preset: Vite.
3. Add `VITE_API_URL` = your Render backend URL + `/api` (e.g. `https://society-tracker-api.onrender.com/api`).
4. Deploy. Update `CORS_ORIGIN` on the backend to this Vercel URL afterwards.

---

## 3. Environment variables

See `backend/.env.example` and `frontend/.env.example` for the full, commented
list. Summary:

**Backend**

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth token signing |
| `ADMIN_SIGNUP_CODE` | Optional code that lets `/auth/register` create an ADMIN |
| `PORT`, `NODE_ENV`, `CORS_ORIGIN` | Server config |
| `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` | Photo uploads |
| `EMAIL_USER`, `EMAIL_APP_PASSWORD`, `EMAIL_FROM_NAME` | Gmail/Nodemailer |
| `DEFAULT_OVERDUE_THRESHOLD_DAYS` | Initial overdue threshold (admin can change later via Settings) |
| `SEED_ADMIN_PASSWORD`, `SEED_RESIDENT_PASSWORD` | Used only by `npm run seed` |

**Frontend**

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API, e.g. `http://localhost:4000/api` |

---

## 4. Database schema

PostgreSQL via Prisma. Full definitions in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma);
summary below (see `docs/SYSTEM_DESIGN.md` for the reasoning behind the
history/overdue/settings design).

**`users`** — `id, name, email (unique), passwordHash, role (RESIDENT|ADMIN), flatNumber, phone, createdAt, updatedAt`

**`complaints`** — `id, category (enum), description, photoUrl, photoPublicId, status (OPEN|IN_PROGRESS|RESOLVED), priority (LOW|MEDIUM|HIGH), residentId → users.id, createdAt, updatedAt, resolvedAt`

**`complaint_status_history`** — `id, complaintId → complaints.id, status, note, actorId → users.id, actorRole, timestamp`
One row per status change (including the initial "Open" row created when a
complaint is raised) — this *is* the audit trail the brief asks for, not a
denormalized summary.

**`notices`** — `id, title, body, isImportant, authorId → users.id, createdAt`

**`settings`** — singleton row (`id = 1`) holding `overdueThresholdDays`, the
configurable number of days after which an open complaint is flagged overdue.

Indexes: `complaints(residentId, status, category, priority, createdAt)` for
the admin filter/sort queries, `complaint_status_history(complaintId)` for
timeline lookups, `notices(isImportant, createdAt)` for the pinned-notice sort.

---

## 5. API documentation

Base URL: `/api`. All endpoints except `/auth/register` and `/auth/login`
require `Authorization: Bearer <token>`. Endpoints marked **(admin)** also
require the caller's role to be `ADMIN`.

### Auth

| Method | Path | Body | Notes |
|---|---|---|---|
| POST | `/auth/register` | `{ name, email, password, flatNumber?, phone?, adminCode? }` | Creates a RESIDENT, or an ADMIN if `adminCode` matches `ADMIN_SIGNUP_CODE`. Returns `{ user, token }`. |
| POST | `/auth/login` | `{ email, password }` | Returns `{ user, token }`. |
| GET | `/auth/me` | — | Returns the current user. |

### Complaints

| Method | Path | Role | Notes |
|---|---|---|---|
| POST | `/complaints` | Resident | `multipart/form-data`: `category, description, photo?`. Creates the complaint and its first history entry (`OPEN`). |
| GET | `/complaints` | Any | Resident sees only their own; Admin sees all. Query: `category, status, dateFrom, dateTo, page, limit`. Admin results are sorted overdue-first, then priority, then newest. Each complaint includes computed `isOverdue` / `daysOpen`. |
| GET | `/complaints/:id` | Any (owner or admin) | Includes full status history. |
| PATCH | `/complaints/:id/status` | **(admin)** | `{ status, note? }`. Appends a history row, emails the resident, sets `resolvedAt` when status becomes `RESOLVED`. Rejects further updates once a complaint is `RESOLVED` (closed). |
| PATCH | `/complaints/:id/priority` | **(admin)** | `{ priority }`. |

### Notices

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/notices` | Any | Important notices pinned first, then newest first. |
| POST | `/notices` | **(admin)** | `{ title, body, isImportant? }`. If `isImportant`, emails every resident. |

### Dashboard

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/dashboard` | **(admin)** | `{ totalComplaints, byStatus, byCategory, overdueCount, overdueThresholdDays }`. |

### Settings

| Method | Path | Role | Notes |
|---|---|---|---|
| GET | `/settings` | Any | Current `overdueThresholdDays`. |
| PATCH | `/settings` | **(admin)** | `{ overdueThresholdDays }` (1–365). Takes effect immediately for every complaint. |

Errors are JSON: `{ "error": "message" }` (validation errors also include a
`details` array). Standard status codes: `400` validation, `401` missing/bad
token, `403` wrong role or not the complaint's owner, `404` not found, `409`
duplicate email, `500` unexpected.

---

## 6. Testing

```bash
cd backend
npm test                                    # unit tests (overdue detection, admin sort order)
node -r ./test/_mockPrismaHook.js test/boot-check.js   # route-wiring smoke test (no DB needed)
```

```bash
cd frontend
npm run build     # production build
npm run lint
```

---

## 7. Design decisions worth knowing about

- **Overdue is computed, not stored.** `isOverdue` is derived from
  `createdAt` + the current `overdueThresholdDays` setting on every read, so
  changing the threshold in Settings instantly re-flags every complaint —
  nothing needs backfilling. See `docs/SYSTEM_DESIGN.md`.
- **A `RESOLVED` complaint is locked.** The API rejects further status/priority
  changes once resolved, matching "Once a complaint is marked Resolved, it is
  closed."
- **Every status change is audited**, including the complaint's creation
  (recorded as the first `OPEN` history row), so the timeline a resident sees
  is literally the same table the admin's changes are written to — not two
  systems that could drift apart.
- **Photos upload via a manual `cloudinary.uploader.upload_stream` call**
  (buffered in memory by multer, never written to disk), not the
  `multer-storage-cloudinary` bridge package — that package pins
  `cloudinary@^1.x`, which carries a known argument-injection advisory fixed
  only in `cloudinary@2.7+`. See the comment in `backend/src/middleware/upload.js`.
- **`npm audit` (backend)** reports one remaining high-severity advisory in
  `deepmerge-ts`, pulled in transitively by `@prisma/config` — a dev-time
  dependency of the `prisma` CLI itself, not of `@prisma/client` (what
  actually ships to production). It affects `prisma generate`/`migrate` at
  build time, not the running app, and fixing it means downgrading to an
  older Prisma major version — left as-is as the better trade-off.
