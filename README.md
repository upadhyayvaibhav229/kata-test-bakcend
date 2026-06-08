# Karate Championship — Backend API

Node + Express + Prisma + PostgreSQL REST API for the Shotokan Karate Championship app.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and set DATABASE_URL to your Postgres connection string

# 3. Push schema to DB (dev shortcut — skips migration history)
npm run db:push

# OR use proper migrations (recommended for production):
npm run db:migrate

# 4. Seed sample data (optional)
npm run db:seed

# 5. Start dev server with hot reload
npm run dev
```

The API runs on **http://localhost:4000** by default.

---

## API Reference

### Forms

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/forms` | List all forms (includes registration count) |
| GET | `/api/forms/:id` | Get a single form |
| POST | `/api/forms` | Create a form |
| PATCH | `/api/forms/:id` | Update form fields |
| PATCH | `/api/forms/:id/toggle` | Toggle active/inactive |
| DELETE | `/api/forms/:id` | Delete form + all its registrations |

**POST body example:**
```json
{
  "name": "Summer Championship 2026",
  "startDate": "2026-07-01",
  "endDate": "2026-08-31",
  "active": true
}
```

---

### Registrations

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/registrations` | List (paginated, filterable) |
| GET | `/api/registrations/stats` | Counts by belt / branch |
| GET | `/api/registrations/:id` | Single registration |
| POST | `/api/registrations` | Submit a registration |
| PATCH | `/api/registrations/:id` | Admin edit |
| DELETE | `/api/registrations/:id` | Delete |

**GET query params:** `page`, `pageSize`, `search`, `branch`, `belt`, `formId`

**POST body example:**
```json
{
  "formId":      "clxxx...",
  "studentName": "Arjun Sharma",
  "age":         14,
  "phone":       "9876543210",
  "parentPhone": "9876543211",
  "branch":      "Andheri",
  "belt":        "yellow",
  "kata1":       "Taikyoku Shodan",
  "kata2":       "Taikyoku Nidan",
  "kata3":       "Heian Shodan"
}
```

---

### Tests (scaffold — implement logic to your spec)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/tests/events` | List test events |
| GET | `/api/tests/events/:id` | Event + panels + candidates |
| POST | `/api/tests/events` | Create event |
| PATCH | `/api/tests/events/:id` | Update event |
| DELETE | `/api/tests/events/:id` | Delete event |
| GET | `/api/tests/panels?eventId=` | List panels |
| POST | `/api/tests/panels` | Create panel |
| DELETE | `/api/tests/panels/:id` | Delete panel |
| GET | `/api/tests/candidates?panelId=` | List candidates |
| POST | `/api/tests/candidates` | Add candidate to panel |
| PATCH | `/api/tests/candidates/:id/grade` | Record score/pass |
| DELETE | `/api/tests/candidates/:id` | Remove candidate |

---

## Connecting to the frontend

Replace the `karate-store`'s in-memory state with API calls. For example:

```ts
// Instead of: store.createForm(...)
await fetch("http://localhost:4000/api/forms", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name, startDate, endDate }),
});
```

Use `VITE_API_URL=http://localhost:4000` in your frontend `.env` and prefix all calls with it.

---

## Production checklist

- Set `NODE_ENV=production` and a real `DATABASE_URL`
- Set `FRONTEND_URL` to your deployed frontend origin (CORS)
- Run `npm run build && npm start` (or use PM2 / Docker)
- Add authentication middleware before admin routes
