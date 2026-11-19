# ☕ Smart QR-Based Café Management System

A full-stack, real-time MERN application built with Express.js, React 19, Tailwind CSS, Socket.IO, and Razorpay.

---

## 🌟 Key Features

1. **6 Unique Tables & QR Ordering**:
   - 6 uniquely identified dining tables (`Table 1` to `Table 6` / `TBL-001` to `TBL-006`).
   - Tamper-proof, cryptographically signed QR tokens per table.
   - Customers scan the table QR code to open their dedicated table menu.
   - Server-side validation guarantees orders cannot be spoofed or assigned to incorrect tables.

2. **Mobile-First Customer Experience**:
   - Browse 24 Indian café dishes across 6 categories (Meals, Snacks, Breakfast, Beverages, Desserts, Specials).
   - Pure Veg filter toggle and instant keyword search.
   - Item customizer for sizing (Regular/Large), custom add-ons (extra cheese, extra shot, dips), and special instructions.
   - Live sliding cart drawer with real-time bill breakdown (Subtotal, CGST 2.5%, SGST 2.5%, Service Charge 5%, and Total).

3. **Verified Online Payments (Razorpay)**:
   - Server-side price calculation (never trusts client price data).
   - Razorpay order creation + HMAC-SHA256 signature verification.
   - Supports live Razorpay credentials and instant **Sandbox / Demo Verification Mode** for seamless evaluations.
   - Only verified, paid orders reach the kitchen queue.

4. **Kitchen Display System (KDS)**:
   - Route: `/kitchen`
   - 3-stage Kanban workflow: **New Orders** ➔ **In Preparation** ➔ **Ready for Pickup**.
   - Preparation countdown timers and visual alerts for urgent orders.
   - Web Audio API synthetic chimes on incoming tickets (zero external audio file dependencies).

5. **Public Order Display Board**:
   - Route: `/display`
   - TV-optimized, full-screen dark mode display for café dining area monitors.
   - Split view: **PREPARING** (amber) vs. **READY TO SERVE** (emerald).
   - Live digital clock and pleasant audio chime when an order is ready.

6. **Staff & Admin Management Dashboard**:
   - Route: `/admin` (Login: `/admin/login`)
   - KPI metrics (Today's Sales, Orders Count, Active Tickets, Table Occupancy).
   - Live Orders manager with status advance actions.
   - 6-table floor plan with QR modal and direct customer simulation links.
   - Menu item manager (add/edit items, toggle in-stock/out-of-stock, delete).
   - Sales reports and popular dish analytics.

7. **Interactive Café & Table Reservations**:
   - Route `/` introduces Little Window Café with a layered courtyard scene, subtle parallax, and reduced-motion support.
   - Visitors can reserve an available table for up to 90 days ahead; capacity and table availability are checked by the server.
   - Route `/cafe` is a fixed customer-facing 3D café with a planted courtyard, live order board, staffed counter, and guest-to-counter-to-table service animation.
   - Reservations release automatically after a 30-minute arrival grace period if the guest does not check in.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** v18+ (tested on Node v24)
- **MongoDB** (local `mongodb://localhost:27017` or MongoDB Atlas URI in `server/.env`)

### 2. Starting the Backend Server
```bash
cd server
npm install
npm run seed     # Seeds 6 tables, 24 menu items, and 3 staff accounts
npm run dev      # Runs Express + Socket.IO on http://localhost:5000
```

### 3. Starting the Frontend Client
```bash
cd client
npm install
npm run dev      # Runs Vite dev server on http://localhost:5173
```

---

## 🔒 Security & operations

**Sessions**: staff sign in with a JWT held in an httpOnly cookie (`SameSite=Lax`, `Secure` in production). Passwords are bcrypt-hashed (cost 12); eight wrong attempts lock an account for 15 minutes. The login response never contains the token.

**Authorization**: every staff write is behind `protect` + `authorize`.

| Area | Who may call it |
|---|---|
| Order status, dish ticks, kitchen list, order reads | owner, counter, kitchen |
| Order clearing, statistics, table QR/regeneration/status/clear, floor management | owner, counter |
| Sales reports, staff accounts, settings | owner |
| Menu reads, table identity/QR validation, check-in, reservations, order tracking by token, display board | public |

Guests cancel through the table token that opened their menu; a body flag is not enough. Public table data never includes QR tokens or phone numbers, and public display payloads are stripped of guest contact details.

**Sockets**: the handshake reads the same session cookie. Kitchen/admin rooms are role-gated, `order:*`/`token:*` rooms are pattern-checked, and the display board carries sanitised tickets (optionally locked with `DISPLAY_TOKEN`).

**Payments**: amounts are computed server-side, the Razorpay signature is verified with HMAC, demo signatures only work with sandbox keys or outside production, and every create/verify call must present the table token that owns the order.

**Abuse limits**: reads 300/15 min per IP, login 10/15 min, order creation 20/10 min, payments 30/15 min, chat 20/hour.

**Virtual café tables**: selecting a table in the 3D café creates a random, table-scoped ordering token that expires after two hours. Physical QR codes continue to use their own tokens.

**Production boot**: the server refuses to start with placeholder `JWT_SECRET`, `COOKIE_SECRET`, `QR_TOKEN_SECRET` or `MONGODB_URI`. Set `TRUST_PROXY=1` behind Render/Railway so rate limits and secure cookies see the real client.

**Logs & audit**: JSON request logs with an `X-Request-Id` on every response; staff actions (order status, cancellation, clearing, table changes, QR regeneration, staff account edits) are written to `AuditLog`.

**Tests**: `cd server && npm test` — a database-free access-control suite covering anonymous writes, the public table shape, the guest cancellation gate, and owner-only registration.

**Deploy**: deploy the API from `server` on Render and the Vite app from `client` on Vercel. Set `VITE_BACKEND_URL` to the Render API origin and configure Render's `CLIENT_URL`/`CLIENT_URLS` with the exact Vercel origin. Use `NODE_ENV=production`, `TRUST_PROXY=1`, `COOKIE_SAMESITE=none`, and `COOKIE_SECURE=true` for the separate Vercel/Render domains; the production cookie defaults to `SameSite=None; Secure`. `client/vercel.json` sends browser routes such as `/table/:token` back to the SPA. `render.yaml` remains available for an all-Render deployment. MongoDB Atlas handles persistence and backups.

---

## 🔑 Demo Login Credentials

| Role | Email | Password | Access |
|---|---|---|---|
| **Owner (Admin)** | `admin@cafe.com` | `admin123` | Full dashboard, menu editing, table QR generation, reports |
| **Counter Staff** | `counter@cafe.com` | `counter123` | Order tracking, table occupancy, menu viewing |
| **Kitchen Chef** | `kitchen@cafe.com` | `kitchen123` | Kitchen Display System (KDS), ticket status updates |

---

## 🌐 Application Route Sitemap

- `/` — Project introduction with a guided overview of the guest-to-kitchen ordering flow
- `/cafe` — Fixed-camera 3D café with live table QR ordering, a concealed staff kitchen, and an in-place order status board
- `/table/:token` — Customer Mobile Menu for specific table QR token
- `/track/:token` — Live Customer Order Tracker with animated stepper and audio chime
- `/kitchen` — Kitchen Display System (KDS) 3-stage cooking queue
- `/display` — Public Order Board for café TV screens
- `/admin/login` — Staff login portal with 1-click credential presets
- `/admin` — Private Admin Dashboard
