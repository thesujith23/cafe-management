# Scaling Little Window Café

A working plan for taking this app from one café to many, and from one server process to a
deployment that survives traffic. Written against the code as it stands: Express 5 + Mongoose on
MongoDB Atlas, Socket.IO for live updates, React 19 on Vite served statically, Razorpay for payments.

`/plan` is a request to think about it before touching code. Nothing below is implemented yet.

---

## 1. What actually breaks first

In this order, not in the order people usually worry about:

1. **The API process is stateful in one place that matters.** Socket.IO keeps every connection, room
   membership and socket id in that process's memory. A second instance behind a load balancer means a
   guest connected to instance A never hears an update published by instance B. This is the first real wall,
   at roughly the traffic where one Node process stops being enough (a few hundred concurrent sockets).
2. **Reads that recompute the floor on every request.** `GET /api/tables` runs `expiredReservations`
   cleanup writes on every call, and `getTables` is hit by every visitor plus every booking modal. At a
   few hundred requests a second that is a write per read.
3. **Aggregations for reports over the whole `orders` collection.** `getStats` and the sales report scan
   by date without a covering index; the console polls them every 15 seconds per open dashboard.
4. **Rate limits are per-process.** `express-rate-limit`'s default memory store resets on deploy and is
   not shared, so N instances multiply the real limit by N. That is both an abuse hole and a false sense
   of safety.
5. **Background work has nowhere to run.** Payment confirmation, notifications and reservation expiry all
   happen inline in the request. A slow Razorpay call holds a connection.
6. **Media and QR files are local disk.** `server/qrcodes` and `uploads` are written to the container's
   filesystem, which does not survive a redeploy and is not shared between instances.

MongoDB is not the first problem if Atlas is on a paid tier with indexes — but the schema has no compound
indexes on the fields that reports and order lists filter by, so it will become one early.

---

## 2. Phase 0 — Make it measurable before making it bigger

You cannot scale what you cannot see, and this app has no metrics yet, only JSON request logs.

- [ ] Add `pino-http` style structured logs with a `duration` field (the request-id logger is already there;
      add timing and a slow-request threshold).
- [ ] Expose `GET /api/health` in the existing shape (it exists) plus `GET /api/metrics` with
      `prom-client`: request duration histogram, socket connections gauge, Mongo pool stats, event-loop lag.
- [ ] Instrument the slow paths directly: `getStats`, order list, payment create/verify, socket emit count.
- [ ] Put a load tool against a staging copy: `k6 run` or `autocannon` on `/api/tables`, `/api/menu/items`,
      `/api/orders` and a socket connect/disconnect loop. Record the p95 at 50/200/500 rps as the baseline.
- [ ] Record a decision log entry per phase in `CHANGES.md`, since that file is this project's history.

**Exit criteria**: a dashboard that shows p95 latency, error rate and socket count, and a written baseline
number for "how much traffic one instance handles".

---

## 3. Phase 1 — Make the API horizontally scalable (the real milestone)

### 3.1 Share the socket layer

Two options, in order of preference:

1. **Redis adapter** (`@socket.io/redis-adapter` + a managed Redis). Each instance publishes to Redis and
   every instance delivers to its own sockets, so room membership no longer needs to be local. This is a
   ~20-line change in `server/src/sockets/index.js`: create the adapter after `io` exists, with a pub and a
   sub client, and let it fail loudly at boot if Redis is unreachable in production.
2. **Sticky sessions + polling only**, if Redis is not acceptable. Cheaper, but worse: WebSocket transport
   is lost and every client falls back to long-polling, which multiplies request count.

Recommendation: Redis adapter, WebSocket transport kept.

### 3.2 Move per-process state out of the process

- Rate limiting → `rate-limit-redis` store, so the limits in `middleware/limiters.js` mean what they say
  across instances.
- Reservation expiry (currently a write inside `getTables`) → a scheduled job. A `node-cron` worker or a
  Mongo TTL/dirty-read pattern: mark `status: 'reserved'` with `reservation.startsAt`, then a job every
  minute flips expired rows and emits `table:statusUpdate`. `GET /api/tables` becomes a pure read.
- Session/JWT: the cookie is already stateless, so this is fine as-is. If you want remote sign-out, a Redis
  denylist keyed by `jti` is the smallest change.

### 3.3 Stateless instances behind a proxy

- `render.yaml` already has one web service. Add `numInstances`/autoscaling, keep `TRUST_PROXY=1`
  (already required by `config/index.js`), and make sure health checks point at `/api/health`.
- No in-memory caches in request handlers. The only short-lived in-process state is the socket map.

**Exit criteria**: two instances behind the proxy, a guest connected to one still receives an order update
created on the other, and rate limits hold under a two-instance load test.

---

## 4. Phase 2 — Data layer

- [ ] **Indexes**, matching the queries that exist today:
  - `orders`: `{ createdAt: -1 }`, `{ preparationStatus: 1, createdAt: -1 }`, `{ 'table._id': 1, createdAt: -1 }`,
    `{ paymentStatus: 1, createdAt: -1 }`, `{ orderNumber: 1 }` unique.
  - `payments`: `{ order: 1 }`, `{ razorpayOrderId: 1 }` unique, `{ status: 1, createdAt: -1 }`.
  - `diningtables`: `{ status: 1 }`, `{ tableId: 1 }` unique.
  - `ordertstatushistories`: `{ order: 1, createdAt: 1 }`.
- [ ] **Reports**: replace full-collection aggregation with a per-day rollup collection
      (`daily_sales` written by a nightly job). The console then reads one small document per period instead
      of scanning orders. This is the single biggest query win for the dashboard.
- [ ] **Archival**: orders older than N months move to an `orders_archive` collection (or a cold Atlas tier).
      The guest tracker already only looks at 24 hours, so only reports care.
- [ ] **Connection pool**: set `maxPoolSize` explicitly (default 100) and size it against the instance count,
      not per request.
- [ ] **Atlas**: dedicated tier, multi-AZ, automated backup with a tested restore. A restaurant's order
      history is business data; verify a restore, do not assume one.

---

## 5. Phase 3 — Media and files

- QR PNGs and menu photos move from `server/qrcodes` / `uploads` to object storage (S3-compatible or R2)
  behind a CDN. `generateQR` writes the object and stores the URL; the download route either streams from
  storage or redirects to a signed URL.
- Keep a local-disk fallback for development only, so `npm run dev` still works with no cloud account.
- Menu images served through the CDN with long cache headers and content-hashed names.

---

## 6. Phase 4 — Deploy pipeline and isolation

- [ ] One image, two entrypoints: `web` (API + sockets) and `worker` (cron, emails, payment reconciliation).
      Same code, different start command — no separate service to keep in sync.
- [ ] Migrations: the project has none. Add `migrate-mongo` (or a tiny script runner) before indexes and
      rollups land, so a deploy that changes schema can be rolled back safely.
- [ ] Zero-downtime deploys: health-check gated rolling release; keep a socket drain step (stop accepting new
      connections, let existing ones close for up to 60s) so a deploy does not drop open guest trackers.
      The client already reconnects and re-polls every 20 seconds, so a reconnect is survivable today, but
      being deliberate is better than relying on it.
- [ ] Staging environment against a separate Atlas database and sandbox Razorpay keys. `config/index.js`
      already refuses placeholder secrets in production, which is what makes a staging/production split
      safe.

---

## 7. Phase 5 — Money and correctness under load

- [ ] **Idempotency keys** on `POST /api/payments/create` and `/verify` (client sends a UUID per attempt,
      server stores it with a TTL index). A retried request must never charge twice.
- [ ] Payment webhooks as the source of truth for capture, with the verify endpoint as a fallback. Right now
      the browser is in the confirmation path; if the tab closes after payment the order can be left unpaid.
- [ ] Reservation booking needs a conditional write (`findOneAndUpdate` with the status filter, already
      used) plus a unique partial index per time slot to stop two simultaneous bookings taking the last table.
- [ ] Audit log growth: cap or roll up `AuditLog` (it is written on every staff action and never pruned).

---

## 8. Phase 6 — Multi-café (only if it is actually the goal)

If "scalable" means one product serving many cafés, not one café serving more guests:

1. Add `cafeId` to every collection and every query, and derive it from the host/subdomain or the signed
   session — never from a request body.
2. Every index becomes `{ cafeId: 1, ... }`-prefixed.
3. Tables, menu and staff become per-café scoped documents; `authorize` gains a cafe check.
4. QR tokens carry `cafeId` inside the signed payload, so a token cannot be replayed at another café.
5. Socket rooms become `cafe:<id>:kitchen` etc., otherwise one café's kitchen hears another's tickets.

This is a schema-wide change and should be decided **before** Phase 2 indexes are created, because the
indexes are the expensive part to redo.

---

## 9. What to do first, concretely

If this were my week:

| Order | Task | Why |
|---|---|---|
| 1 | Metrics + baseline load test | Without a number, every later claim is a guess |
| 2 | Redis socket adapter + Redis rate-limit store | The only true single-process coupling in the app |
| 3 | Compound indexes on `orders` / `payments` / `diningtables` | Cheapest latency win available |
| 4 | Move reservation expiry into a scheduled job | Removes a write from the hottest public read |
| 5 | Daily sales rollup collection | Makes the console's 15s polling cheap |
| 6 | Object storage for QR and menu images | Survives deploys, enables a CDN |
| 7 | Payment idempotency + webhook | Correctness is a scaling property too |

---

## 10. Constraints that shape all of it

- **Freebuff Sites / Cloudflare Workers cannot host this app.** It is a long-running Express process with
  MongoDB and in-memory Socket.IO. It needs a container host with WebSockets (Render, Fly, Railway, ECS) plus
  managed MongoDB and Redis. Any plan that assumes Workers means rewriting the server, not deploying it.
- **The client is already CDN-friendly**: static Vite build, no server rendering, `/api` calls relative.
  Serving it from a CDN with the CSP in `client/public/_headers` is free scale.
- **Do not scale the 3D scene with the app.** Three.js runs in the guest's browser; it costs the server
  nothing but the initial bundle (`client/public/vendor/three.min.js`). Keep it out of the critical path by
  keeping the lazy route split.
